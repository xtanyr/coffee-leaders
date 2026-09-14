import { Router } from 'express';
import { ParsedQs } from 'qs';
import prisma from '../prisma';
import {
  computeAttritionReport,
  computeCalendarForecast,
  calculateFeatureStats,
  buildMonthBuckets,
  buildExpectedAttritions,
  normalizeCity,
  buildFeatureVector,
  calculateBaseProbability,
  distributeProbability,
  clampProbability,
} from '../services/analytics/leaderAttrition';

const router = Router();

const DEFAULT_HORIZON = 12;
const MIN_HORIZON = 1;
const MAX_HORIZON = 24;

const normalizeStringParam = (value?: string | ParsedQs | (string | ParsedQs)[]): string | string[] | undefined => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    const strings = value.filter((item): item is string => typeof item === 'string');
    return strings.length ? strings : undefined;
  }
  return undefined;
};

const parseHorizon = (value?: string | string[]): number => {
  if (!value) {
    return DEFAULT_HORIZON;
  }
  const numeric = Array.isArray(value) ? Number(value[0]) : Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_HORIZON;
  }
  return Math.min(MAX_HORIZON, Math.max(MIN_HORIZON, Math.floor(numeric)));
};

const yieldToEventLoop = () => new Promise<void>(resolve => setImmediate(resolve));

router.get('/attrition', async (req, res) => {
  try {
    const horizon = parseHorizon(normalizeStringParam(req.query.horizon));
    await yieldToEventLoop();
    const report = await computeAttritionReport(prisma, horizon);
    if (!report) {
      return res.status(204).send();
    }
    res.json(report);
  } catch (error) {
    console.error('Error computing attrition report:', error);
    res.status(500).json({ error: 'Failed to compute attrition report' });
  }
});

router.get('/debug/novosibirsk', async (req, res) => {
  try {
    const leaders = await prisma.leader.findMany();
    const activeLeaders = leaders.filter((leader) => !leader.endDate);
    const horizonMonths = 12;
    const now = new Date();
    const stats = calculateFeatureStats(leaders, now);
    const monthBuckets = buildMonthBuckets(now, horizonMonths);
    const expectedMap = new Map<string, number>();
    const results: any[] = [];
    for (const leader of activeLeaders.filter(l => normalizeCity(l.city) === 'Новосибирск')) {
      const { raw } = buildFeatureVector(leader, stats, now);
      const computedBaseProbability = calculateBaseProbability(raw, stats, leader, now);
      const baseProbability = computedBaseProbability;
      const distributedProbabilities = distributeProbability(baseProbability, monthBuckets.length);
      monthBuckets.forEach((bucket, index) => {
        const key = `${normalizeCity(leader.city)}|${bucket.key}`;
        expectedMap.set(key, (expectedMap.get(key) ?? 0) + (distributedProbabilities[index] ?? 0));
      });
      results.push({ id: leader.id, baseProbability, distributedProbabilities: distributedProbabilities.slice(0, 3) });
    }
    const expectedAttritions = buildExpectedAttritions(activeLeaders, monthBuckets, expectedMap);
    const nsAttritions = expectedAttritions.filter(e => e.city === 'Новосибирск');
    res.json({ activeNovosibirskLeaders: results, expectedMapEntries: Array.from(expectedMap.entries()).filter(([k]) => k.startsWith('Новосибирск')), nsAttritions: nsAttritions.slice(0, 3) });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

router.get('/calendar', async (req, res) => {
  try {
    const horizon = parseHorizon(normalizeStringParam(req.query.horizon));
    await yieldToEventLoop();
    const forecast = await computeCalendarForecast(prisma, horizon);
    if (!forecast) {
      return res.status(204).send();
    }
    res.json(forecast);
  } catch (error) {
    console.error('Error computing calendar forecast:', error);
    res.status(500).json({ error: 'Failed to compute calendar forecast' });
  }
});

export default router;
