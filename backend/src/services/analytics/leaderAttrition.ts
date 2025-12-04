import { CoffeeShop, Leader, PrismaClient } from '@prisma/client';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AVG_DAYS_PER_MONTH = 30.4375;
const FEATURE_KEYS = [
  'ageYears',
  'tenureYears',
  'pipActive',
  'pipSeverity',
  'tenureVsCompany',
  'tenureVsActive',
  'tenureVsCity',
  'pipOverdue',
] as const;
type FeatureKey = (typeof FEATURE_KEYS)[number];

interface FeatureStats {
  companyAverageTenureMonths: number;
  activeAverageTenureMonths: number;
  cityAverageTenureMonths: Record<string, number>;
}

function clampProbability(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function centeredLogistic(deltaMonths: number, scaleMonths = 6): number {
  if (scaleMonths <= 0) {
    return 0;
  }
  const normalized = deltaMonths / scaleMonths;
  const logistic = 1 / (1 + Math.exp(-normalized));
  return logistic - 0.5; // range [-0.5, 0.5]
}

function distributeProbability(totalProbability: number, bucketCount: number): number[] {
  if (bucketCount === 0 || totalProbability <= 0) {
    return Array(bucketCount).fill(0);
  }
  const weights = Array.from({ length: bucketCount }, (_, index) => 1 / (index + 1));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (totalProbability * weight) / weightSum);
}

function determinePipStatus(leader: Leader, reference: Date): 'none' | 'active' | 'overdue' {
  if (!leader.pipName) {
    return 'none';
  }
  if (!leader.pipEndDate) {
    return 'active';
  }
  return new Date(leader.pipEndDate) < reference ? 'overdue' : 'active';
}

function buildMonthBuckets(now: Date, horizonMonths: number): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const startOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 0; i < horizonMonths; i += 1) {
    const start = new Date(startOfCurrent.getFullYear(), startOfCurrent.getMonth() + i, 1);
    const end = new Date(startOfCurrent.getFullYear(), startOfCurrent.getMonth() + i + 1, 1);
    buckets.push({
      index: i + 1,
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label: formatMonthLabel(start),
      start,
      end,
    });
  }
  return buckets;
}

function buildExpectedAttritions(
  leaders: Leader[],
  buckets: MonthBucket[],
  expectedMap: Map<string, number>
): ExpectedAttritionEntry[] {
  const cities = Array.from(new Set(leaders.map((leader) => leader.city))).sort();
  const entries: ExpectedAttritionEntry[] = [];
  cities.forEach((city) => {
    buckets.forEach((bucket) => {
      const key = `${city}|${bucket.key}`;
      entries.push({
        city,
        monthIndex: bucket.index,
        monthKey: bucket.key,
        label: bucket.label,
        expectedDepartures: expectedMap.get(key) ?? 0,
      });
    });
  });
  return entries;
}

function aggregateOpenings(
  coffeeShops: CoffeeShop[],
  buckets: Array<{ index: number; key: string; start: Date; end: Date }>
): Map<string, number> {
  const map = new Map<string, number>();
  coffeeShops.forEach((shop) => {
    if (!shop.openingDate) {
      return;
    }
    const openingDate = new Date(shop.openingDate);
    const bucket = buckets.find(
      (candidate) => openingDate >= candidate.start && openingDate < candidate.end
    );
    if (!bucket) {
      return;
    }
    const key = `${shop.city}|${bucket.key}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
}

function monthsBetween(start: Date, end: Date): number {
  return daysBetween(start, end) / AVG_DAYS_PER_MONTH;
}

function yearsBetween(start: Date, end: Date): number {
  return daysBetween(start, end) / 365.25;
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / MS_PER_DAY);
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleString('ru-RU', {
    month: 'short',
    year: 'numeric',
  });
}

function getPipRiskFactor(leader: Leader, reference: Date): number {
  if (!leader.pipName) {
    return 0;
  }

  const normalizeChance = (value: number) => Math.max(0, Math.min(100, value));

  if (leader.pipSuccessChance !== null && leader.pipSuccessChance !== undefined) {
    const inverse = 1 - normalizeChance(leader.pipSuccessChance) / 100;
    if (inverse <= 0) {
      return 0;
    }
    return 0.2 + 0.8 * inverse;
  }

  if (leader.pipEndDate && new Date(leader.pipEndDate) < reference) {
    return 0.8;
  }

  return 0.4;
}

function calculateBaseProbability(
  raw: FeatureVectorResult['raw'],
  stats: FeatureStats,
  leader: Leader,
  reference: Date
): number {
  const tenureComponent = centeredLogistic(
    raw.tenureMonths - stats.companyAverageTenureMonths,
    Math.max(stats.companyAverageTenureMonths / 2, 6)
  );
  const cityComponent = centeredLogistic(raw.tenureVsCityMonths, 6);
  const activeComponent = centeredLogistic(raw.tenureVsActiveMonths, 6);
  const pipComponent = getPipRiskFactor(leader, reference);

  const baseScore =
    0.5 +
    0.4 * tenureComponent +
    0.2 * cityComponent +
    0.2 * activeComponent +
    0.2 * pipComponent;

  return clampProbability(baseScore);
}

interface FeatureVectorResult {
  vector: number[];
  breakdown: Record<FeatureKey, number>;
  raw: {
    tenureMonths: number;
    tenureVsCompanyMonths: number;
    tenureVsActiveMonths: number;
    tenureVsCityMonths: number;
    ageYears: number;
    pipSuccessChance: number | null;
  };
}

interface MonthBucket {
  index: number;
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export interface MonthSummary {
  monthIndex: number;
  monthKey: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface LeaderAttritionInsight {
  leaderId: number;
  name: string;
  city: string;
  coffeeShop: string;
  ageYears: number;
  currentTenureMonths: number;
  pipStatus: 'none' | 'active' | 'overdue';
  pipSuccessChance: number | null;
  featureValues: Record<FeatureKey, number>;
  rawMetrics: FeatureVectorResult['raw'];
  probabilities: Array<{
    monthIndex: number;
    monthKey: string;
    label: string;
    probability: number;
  }>;
  cumulativeProbability: number;
}

export interface ExpectedAttritionEntry {
  city: string;
  monthIndex: number;
  monthKey: string;
  label: string;
  expectedDepartures: number;
}

export interface AttritionReport {
  generatedAt: string;
  horizonMonths: number;
  featureNames: FeatureKey[];
  stats: FeatureStats;
  months: MonthSummary[];
  leaders: LeaderAttritionInsight[];
  expectedAttritions: ExpectedAttritionEntry[];
}

export interface CalendarCityBreakdown {
  city: string;
  expectedAttritions: number;
  plannedOpenings: number;
  netLeadersNeeded: number;
}

export interface CalendarMonthForecast {
  monthIndex: number;
  monthKey: string;
  label: string;
  startDate: string;
  endDate: string;
  cities: CalendarCityBreakdown[];
  totals: {
    expectedAttritions: number;
    plannedOpenings: number;
    netLeadersNeeded: number;
  };
}

export interface CalendarForecast {
  generatedAt: string;
  horizonMonths: number;
  months: CalendarMonthForecast[];
  metadata: {
    cities: string[];
  };
}

export async function computeAttritionReport(
  prisma: PrismaClient,
  horizonMonths = 12
): Promise<AttritionReport | null> {
  const leaders = await prisma.leader.findMany();

  if (!leaders.length) {
    return null;
  }

  const now = new Date();
  const stats = calculateFeatureStats(leaders, now);

  const activeLeaders = leaders.filter((leader) => !leader.endDate);
  const monthBuckets = buildMonthBuckets(now, horizonMonths);

  const expectedMap = new Map<string, number>();
  const leaderInsights: LeaderAttritionInsight[] = activeLeaders.map((leader) => {
    const reference = now;
    const { breakdown, raw } = buildFeatureVector(leader, stats, reference);
    const baseProbability = calculateBaseProbability(raw, stats, leader, reference);
    const distributedProbabilities = distributeProbability(baseProbability, monthBuckets.length);
    const probabilities: LeaderAttritionInsight['probabilities'] = monthBuckets.map((bucket: MonthBucket, index: number) => {
      const probability = distributedProbabilities[index] ?? 0;
      const key = `${leader.city}|${bucket.key}`;
      expectedMap.set(key, (expectedMap.get(key) ?? 0) + probability);
      return {
        monthIndex: bucket.index,
        monthKey: bucket.key,
        label: bucket.label,
        probability,
      };
    });

    const cumulativeProbability = baseProbability;

    return {
      leaderId: leader.id,
      name: leader.name,
      city: leader.city,
      coffeeShop: leader.coffeeShop,
      ageYears: raw.ageYears,
      currentTenureMonths: raw.tenureMonths,
      pipStatus: determinePipStatus(leader, reference),
      pipSuccessChance: leader.pipSuccessChance ?? null,
      featureValues: breakdown,
      rawMetrics: raw,
      probabilities,
      cumulativeProbability,
    };
  });

  const expectedAttritions = buildExpectedAttritions(
    leaders,
    monthBuckets,
    expectedMap
  );

  return {
    generatedAt: now.toISOString(),
    horizonMonths,
    featureNames: [...FEATURE_KEYS],
    stats,
    months: monthBuckets.map((bucket) => ({
      monthIndex: bucket.index,
      monthKey: bucket.key,
      label: bucket.label,
      startDate: bucket.start.toISOString(),
      endDate: bucket.end.toISOString(),
    })),
    leaders: leaderInsights,
    expectedAttritions,
  };
}

export async function computeCalendarForecast(
  prisma: PrismaClient,
  horizonMonths = 12
): Promise<CalendarForecast | null> {
  const [report, coffeeShops] = await Promise.all([
    computeAttritionReport(prisma, horizonMonths),
    prisma.coffeeShop.findMany(),
  ]);

  if (!report) {
    return null;
  }

  const months = report.months.map((month) => ({
    index: month.monthIndex,
    key: month.monthKey,
    label: month.label,
    start: new Date(month.startDate),
    end: new Date(month.endDate),
  }));

  const cities = Array.from(
    new Set([
      ...report.expectedAttritions.map((entry) => entry.city),
      ...coffeeShops.map((shop) => shop.city),
    ])
  ).sort();

  const expectedMap = new Map<string, number>();
  report.expectedAttritions.forEach((entry) => {
    const key = `${entry.city}|${entry.monthKey}`;
    expectedMap.set(key, entry.expectedDepartures);
  });

  const openingMap = aggregateOpenings(coffeeShops, months);

  const calendarMonths: CalendarMonthForecast[] = months.map((bucket) => {
    const citiesBreakdown: CalendarCityBreakdown[] = cities.map((city) => {
      const key = `${city}|${bucket.key}`;
      const expectedAttritions = expectedMap.get(key) ?? 0;
      const plannedOpenings = openingMap.get(key) ?? 0;
      return {
        city,
        expectedAttritions,
        plannedOpenings,
        netLeadersNeeded: expectedAttritions + plannedOpenings,
      };
    });

    const totals = citiesBreakdown.reduce(
      (acc, cityRow) => {
        acc.expectedAttritions += cityRow.expectedAttritions;
        acc.plannedOpenings += cityRow.plannedOpenings;
        acc.netLeadersNeeded += cityRow.netLeadersNeeded;
        return acc;
      },
      { expectedAttritions: 0, plannedOpenings: 0, netLeadersNeeded: 0 }
    );

    return {
      monthIndex: bucket.index,
      monthKey: bucket.key,
      label: bucket.label,
      startDate: bucket.start.toISOString(),
      endDate: bucket.end.toISOString(),
      cities: citiesBreakdown,
      totals,
    };
  });

  return {
    generatedAt: report.generatedAt,
    horizonMonths: report.horizonMonths,
    months: calendarMonths,
    metadata: {
      cities,
    },
  };
}

function calculateFeatureStats(leaders: Leader[], now: Date): FeatureStats {
  const allTenures = leaders.map((leader) =>
    monthsBetween(leader.startDate, leader.endDate ?? now)
  );
  const activeTenures = leaders
    .filter((leader) => !leader.endDate)
    .map((leader) => monthsBetween(leader.startDate, now));

  const companyAverageTenureMonths = average(allTenures);
  const activeAverageTenureMonths = activeTenures.length
    ? average(activeTenures)
    : companyAverageTenureMonths;

  const cityTotals = new Map<string, { total: number; count: number }>();
  leaders.forEach((leader) => {
    const reference = leader.endDate ?? now;
    const tenure = monthsBetween(leader.startDate, reference);
    const entry = cityTotals.get(leader.city) ?? { total: 0, count: 0 };
    entry.total += tenure;
    entry.count += 1;
    cityTotals.set(leader.city, entry);
  });

  const cityAverageTenureMonths: Record<string, number> = {};
  cityTotals.forEach((value, city) => {
    cityAverageTenureMonths[city] = value.total / value.count;
  });

  return {
    companyAverageTenureMonths,
    activeAverageTenureMonths,
    cityAverageTenureMonths,
  };
}

function buildFeatureVector(
  leader: Leader,
  stats: FeatureStats,
  reference: Date
): FeatureVectorResult {
  const tenureMonths = monthsBetween(leader.startDate, reference);
  const tenureVsCompanyMonths = tenureMonths - stats.companyAverageTenureMonths;
  const tenureVsActiveMonths = tenureMonths - stats.activeAverageTenureMonths;
  const cityAverage = stats.cityAverageTenureMonths[leader.city] ?? stats.companyAverageTenureMonths;
  const tenureVsCityMonths = tenureMonths - cityAverage;

  const ageYears = yearsBetween(leader.birthDate, reference);
  const pipActive = Boolean(leader.pipName);
  const pipOverdue = pipActive && leader.pipEndDate ? new Date(leader.pipEndDate) < reference : false;
  const pipSuccessChance = leader.pipSuccessChance ?? null;
  const pipSeverity = pipActive
    ? pipSuccessChance !== null
      ? Math.max(0, Math.min(1, (100 - pipSuccessChance) / 100))
      : 0.5
    : 0;

  const breakdown: Record<FeatureKey, number> = {
    ageYears: ageYears / 10,
    tenureYears: tenureMonths / 12,
    pipActive: pipActive ? 1 : 0,
    pipSeverity,
    tenureVsCompany: tenureVsCompanyMonths / 12,
    tenureVsActive: tenureVsActiveMonths / 12,
    tenureVsCity: tenureVsCityMonths / 12,
    pipOverdue: pipOverdue ? 1 : 0,
  };

  return {
    vector: FEATURE_KEYS.map((key) => breakdown[key]),
    breakdown,
    raw: {
      tenureMonths,
      tenureVsCompanyMonths,
      tenureVsActiveMonths,
      tenureVsCityMonths,
      ageYears,
      pipSuccessChance,
    },
  };
}

// (rest of file unchanged)

