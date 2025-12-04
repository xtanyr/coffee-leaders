export interface Leader {
  id: number;
  name: string;
  startDate: string;
  endDate?: string;
  birthDate: string;
  city: string;
  coffeeShop: string;
  pipName?: string | null;
  pipEndDate?: string | null;
  pipSuccessChance?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoffeeShop {
  id: number;
  name: string;
  city: string;
  openingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalLeaders: number;
  statsByCity: Array<{
    city: string;
    count: number;
  }>;
}

export interface AuditEntry {
  id: number;
  requiredLeaders: number;
  targetDate: string;
  city: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type City =
  | 'Омск'
  | 'Москва'
  | 'Казань'
  | 'Санкт-Петербург'
  | 'Новосибирск'
  | 'Нижний Новгород'
  | 'Самара';

export type PipStatus = 'none' | 'active' | 'overdue';

export interface AttritionBaselinePoint {
  timeDays: number;
  cumulativeHazard: number;
}

export interface AttritionFeatureStats {
  companyAverageTenureMonths: number;
  activeAverageTenureMonths: number;
  cityAverageTenureMonths: Record<string, number>;
}

export interface AttritionMonthSummary {
  monthIndex: number;
  monthKey: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface LeaderProbabilityByMonth {
  monthIndex: number;
  monthKey: string;
  label: string;
  probability: number;
}

export interface LeaderAttritionInsight {
  leaderId: number;
  name: string;
  city: string;
  coffeeShop: string;
  ageYears: number;
  currentTenureMonths: number;
  pipStatus: PipStatus;
  pipSuccessChance: number | null;
  featureValues: Record<string, number>;
  rawMetrics: {
    tenureMonths: number;
    tenureVsCompanyMonths: number;
    tenureVsActiveMonths: number;
    tenureVsCityMonths: number;
    ageYears: number;
    pipSuccessChance: number | null;
  };
  probabilities: LeaderProbabilityByMonth[];
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
  featureNames: string[];
  model: {
    coefficients: number[];
    baseline: AttritionBaselinePoint[];
  };
  stats: AttritionFeatureStats;
  months: AttritionMonthSummary[];
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