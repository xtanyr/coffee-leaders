import { Router } from 'express';
import { ParsedQs } from 'qs';
import { PrismaClient } from '@prisma/client';
import {
  computeAttritionReport,
  computeCalendarForecast,
} from '../services/analytics/leaderAttrition';

const router = Router();
const prisma = new PrismaClient();

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

router.get('/attrition', async (req, res) => {
  try {
    const horizon = parseHorizon(normalizeStringParam(req.query.horizon));
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

router.get('/calendar', async (req, res) => {
  try {
    const horizon = parseHorizon(normalizeStringParam(req.query.horizon));
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
