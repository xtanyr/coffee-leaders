const MAX_EXP_ARGUMENT = 40; // keep exp stable

export interface SurvivalSample {
  durationDays: number;
  event: boolean;
  features: number[];
}

export interface CoxModelBaselinePoint {
  timeDays: number;
  cumulativeHazard: number;
}

export interface CoxModel {
  coefficients: number[];
  baseline: CoxModelBaselinePoint[];
  tailHazardRate: number;
}

export interface TrainOptions {
  maxIterations?: number;
  learningRate?: number;
  tolerance?: number;
  l2Penalty?: number;
}

interface EnrichedSample extends SurvivalSample {
  eta: number;
  risk: number;
}

const DEFAULT_OPTIONS: Required<TrainOptions> = {
  maxIterations: 400,
  learningRate: 0.01,
  tolerance: 1e-6,
  l2Penalty: 1e-3,
};

export function trainCoxModel(
  samples: SurvivalSample[],
  options?: TrainOptions
): CoxModel | null {
  if (!samples.length) {
    return null;
  }

  const featureLength = samples[0].features.length;
  if (!featureLength) {
    return null;
  }

  const { maxIterations, learningRate, tolerance, l2Penalty } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let coefficients = new Array(featureLength).fill(0);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const { gradient, gradNorm } = computeGradient(samples, coefficients, l2Penalty);

    coefficients = coefficients.map((beta, idx) => beta + learningRate * gradient[idx]);

    if (gradNorm < tolerance) {
      break;
    }
  }

  const baseline = computeBaseline(samples, coefficients);
  if (!baseline.length) {
    return null;
  }

  const tailHazardRate = computeTailHazardRate(baseline);

  return {
    coefficients,
    baseline,
    tailHazardRate,
  };
}

function computeGradient(
  samples: SurvivalSample[],
  coefficients: number[],
  l2Penalty: number
) {
  const enriched = enrichSamples(samples, coefficients);
  const gradient = new Array(coefficients.length).fill(0);

  const ordered = enriched
    .filter((sample) => sample.event)
    .sort((a, b) => a.durationDays - b.durationDays);

  for (const eventSample of ordered) {
    const riskSet = enriched.filter((sample) => sample.durationDays >= eventSample.durationDays);
    const denominator = riskSet.reduce((sum, sample) => sum + sample.risk, 0);
    if (!denominator) {
      continue;
    }

    for (let i = 0; i < coefficients.length; i += 1) {
      const weightedFeatureSum = riskSet.reduce(
        (sum, sample) => sum + sample.features[i] * sample.risk,
        0
      );
      const expectation = weightedFeatureSum / denominator;
      gradient[i] += eventSample.features[i] - expectation;
    }
  }

  for (let i = 0; i < coefficients.length; i += 1) {
    gradient[i] -= l2Penalty * coefficients[i];
  }

  const gradNorm = Math.sqrt(gradient.reduce((sum, value) => sum + value * value, 0));

  return { gradient, gradNorm };
}

function enrichSamples(samples: SurvivalSample[], coefficients: number[]): EnrichedSample[] {
  return samples.map((sample) => {
    const eta = dotProduct(coefficients, sample.features);
    const boundedEta = Math.max(-MAX_EXP_ARGUMENT, Math.min(MAX_EXP_ARGUMENT, eta));
    const risk = Math.exp(boundedEta);
    return {
      ...sample,
      eta,
      risk,
    };
  });
}

function computeBaseline(samples: SurvivalSample[], coefficients: number[]): CoxModelBaselinePoint[] {
  const enriched = enrichSamples(samples, coefficients);
  const baseline: CoxModelBaselinePoint[] = [];

  const eventSamples = enriched
    .filter((sample) => sample.event)
    .sort((a, b) => a.durationDays - b.durationDays);

  const processedTimes = new Set<number>();
  let cumulativeHazard = 0;

  for (const eventSample of eventSamples) {
    const time = eventSample.durationDays;
    if (processedTimes.has(time)) {
      continue;
    }
    processedTimes.add(time);

    const eventsAtTime = eventSamples.filter((sample) => sample.durationDays === time).length;
    const riskSet = enriched.filter((sample) => sample.durationDays >= time);
    const denominator = riskSet.reduce((sum, sample) => sum + sample.risk, 0);
    if (!denominator) {
      continue;
    }

    const increment = eventsAtTime / denominator;
    cumulativeHazard += increment;
    baseline.push({ timeDays: time, cumulativeHazard });
  }

  return baseline;
}

function computeTailHazardRate(baseline: CoxModelBaselinePoint[]): number {
  if (!baseline.length) {
    return 0;
  }

  if (baseline.length === 1) {
    const point = baseline[0];
    const rate = point.timeDays > 0 ? point.cumulativeHazard / point.timeDays : point.cumulativeHazard;
    return rate || 0;
  }

  const lastPoint = baseline[baseline.length - 1];
  const prevPoint = baseline[baseline.length - 2];
  const deltaHazard = lastPoint.cumulativeHazard - prevPoint.cumulativeHazard;
  const deltaTime = Math.max(1, lastPoint.timeDays - prevPoint.timeDays);
  return deltaHazard / deltaTime;
}

export function getCumulativeHazard(model: CoxModel, durationDays: number): number {
  if (!model.baseline.length) {
    return 0;
  }

  if (durationDays <= model.baseline[0].timeDays) {
    const first = model.baseline[0];
    if (first.timeDays === 0) {
      return first.cumulativeHazard;
    }
    const ratio = durationDays / first.timeDays;
    return first.cumulativeHazard * Math.max(0, Math.min(1, ratio));
  }

  for (let i = model.baseline.length - 1; i >= 0; i -= 1) {
    const point = model.baseline[i];
    if (durationDays >= point.timeDays) {
      const nextPoint = model.baseline[i + 1];
      if (!nextPoint) {
        const delta = durationDays - point.timeDays;
        return point.cumulativeHazard + delta * model.tailHazardRate;
      }

      const interval = nextPoint.timeDays - point.timeDays;
      if (interval <= 0) {
        return nextPoint.cumulativeHazard;
      }
      const ratio = (durationDays - point.timeDays) / interval;
      const interpolated =
        point.cumulativeHazard + ratio * (nextPoint.cumulativeHazard - point.cumulativeHazard);
      return interpolated;
    }
  }

  return model.baseline[model.baseline.length - 1].cumulativeHazard;
}

export function survivalProbability(model: CoxModel, features: number[], durationDays: number): number {
  const hazard = getCumulativeHazard(model, Math.max(0, durationDays));
  const lp = dotProduct(model.coefficients, features);
  const boundedLp = Math.max(-MAX_EXP_ARGUMENT, Math.min(MAX_EXP_ARGUMENT, lp));
  const riskMultiplier = Math.exp(boundedLp);
  return Math.exp(-hazard * riskMultiplier);
}

export function probabilityBetween(
  model: CoxModel,
  features: number[],
  startDuration: number,
  endDuration: number
): number {
  const from = Math.max(0, startDuration);
  const to = Math.max(from, endDuration);
  const survivalStart = survivalProbability(model, features, from);
  const survivalEnd = survivalProbability(model, features, to);
  const probability = survivalStart - survivalEnd;
  return Math.max(0, Math.min(1, probability));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
}

