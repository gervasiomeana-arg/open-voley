import {
  MatchData,
  PerformanceFollowUpResult,
  ScoutCodeAction,
  TrainingPerformanceTarget,
} from '../types';
import { calculateTeamDataVolleySummary } from './dataVolleyAnalytics';

const MIN_COMPARABLE_SAMPLE = 4;

interface MetricMeasurement {
  value?: number;
  sample: number;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function measureReceptionNegative(
  match: MatchData,
  target: TrainingPerformanceTarget,
): MetricMeasurement {
  const opponent = target.teamSide === 'home' ? 'away' : 'home';
  const receptions = (match.actions || []).filter((action) => {
    if (action.team !== target.teamSide || action.skill !== 'R') return false;

    if (!target.serveType && !target.zoneRef) return true;
    if (!action.rallyId) return false;

    return (match.actions || []).some((serve) =>
      serve.team === opponent &&
      serve.skill === 'S' &&
      serve.rallyId === action.rallyId &&
      (!target.serveType || serve.serveType === target.serveType) &&
      (!target.zoneRef || serve.endZone === target.zoneRef)
    );
  });

  const negative = receptions.filter(
    (action) =>
      action.receptionContext === 'negative' ||
      ['=', '/', '-', '!'].includes(action.evaluation),
  ).length;

  return {
    value: receptions.length ? pct(negative, receptions.length) : undefined,
    sample: receptions.length,
  };
}

function measureTarget(match: MatchData, target: TrainingPerformanceTarget): MetricMeasurement {
  const summary = calculateTeamDataVolleySummary(match, target.teamSide);

  if (target.metric === 'sideout_pct') {
    if (!target.rotationRef) return { sample: 0 };
    const rotation = summary.rotations.find((row) => row.rotation === target.rotationRef);
    if (!rotation) return { sample: 0 };
    return {
      value: rotation.sideoutOpportunities ? rotation.sideoutPct : undefined,
      sample: rotation.sideoutOpportunities,
    };
  }

  if (target.metric === 'reception_negative_pct') {
    return measureReceptionNegative(match, target);
  }

  if (target.metric === 'attack_efficiency_pct') {
    return {
      value: summary.attack.total ? summary.attack.efficiencyPct : undefined,
      sample: summary.attack.total,
    };
  }

  if (target.metric === 'serve_efficiency_pct') {
    return {
      value: summary.serve.total ? summary.serve.efficiencyPct : undefined,
      sample: summary.serve.total,
    };
  }

  return { sample: 0 };
}

function improvementDelta(metric: TrainingPerformanceTarget['metric'], rawDelta: number): number {
  // Lower negative reception percentage is better; all other automated metrics improve upward.
  return metric === 'reception_negative_pct' ? -rawDelta : rawDelta;
}

export function evaluatePerformanceFollowUp(
  target: TrainingPerformanceTarget,
  currentMatch: MatchData,
  minSample = MIN_COMPARABLE_SAMPLE,
): PerformanceFollowUpResult {
  if (target.sourceMatchId && currentMatch.id === target.sourceMatchId) {
    return {
      status: 'not_comparable',
      label: target.label,
      baselineValue: target.baselineValue,
      baselineSample: target.baselineSample,
      message: 'Este es el partido de origen del objetivo. La comparación debe hacerse con un partido posterior.',
    };
  }

  const currentTeamName = target.teamSide === 'home' ? currentMatch.homeTeamName : currentMatch.awayTeamName;
  if (target.sourceTeamName && currentTeamName !== target.sourceTeamName) {
    return {
      status: 'not_comparable',
      label: target.label,
      baselineValue: target.baselineValue,
      baselineSample: target.baselineSample,
      message: `El partido actual corresponde a ${currentTeamName}; este objetivo pertenece a ${target.sourceTeamName}.`,
    };
  }

  if (target.sourceMatchDate && currentMatch.date) {
    const sourceDate = Date.parse(`${target.sourceMatchDate}T00:00:00Z`);
    const currentDate = Date.parse(`${currentMatch.date}T00:00:00Z`);
    if (!Number.isNaN(sourceDate) && !Number.isNaN(currentDate) && currentDate <= sourceDate) {
      return {
        status: 'not_comparable',
        label: target.label,
        baselineValue: target.baselineValue,
        baselineSample: target.baselineSample,
        message: `El partido actual (${currentMatch.date}) no es posterior al partido de origen (${target.sourceMatchDate}).`,
      };
    }
  }

  if (target.metric === 'manual') {
    return {
      status: 'not_comparable',
      label: target.label,
      baselineValue: target.baselineValue,
      baselineSample: target.baselineSample,
      message: 'Este objetivo fue definido manualmente y no tiene una métrica automática comparable.',
    };
  }

  if (
    target.baselineValue === undefined ||
    target.baselineSample === undefined ||
    target.baselineSample < minSample
  ) {
    return {
      status: 'insufficient_data',
      label: target.label,
      baselineValue: target.baselineValue,
      baselineSample: target.baselineSample,
      message: `La muestra inicial no alcanza el mínimo de ${minSample} acciones comparables.`,
    };
  }

  const current = measureTarget(currentMatch, target);

  if (current.value === undefined || current.sample < minSample) {
    return {
      status: 'insufficient_data',
      label: target.label,
      baselineValue: target.baselineValue,
      baselineSample: target.baselineSample,
      currentValue: current.value,
      currentSample: current.sample,
      message: `El partido actual tiene ${current.sample} acciones comparables; se requieren al menos ${minSample}.`,
    };
  }

  const rawDelta = current.value - target.baselineValue;
  const directionDelta = improvementDelta(target.metric, rawDelta);
  const status: PerformanceFollowUpResult['status'] =
    directionDelta > 0 ? 'improved' : directionDelta < 0 ? 'declined' : 'stable';

  const signed = rawDelta > 0 ? `+${rawDelta}` : `${rawDelta}`;
  const interpretation =
    status === 'improved'
      ? 'mejora observada'
      : status === 'declined'
        ? 'retroceso observado'
        : 'sin cambio observado';

  return {
    status,
    label: target.label,
    baselineValue: target.baselineValue,
    currentValue: current.value,
    delta: rawDelta,
    baselineSample: target.baselineSample,
    currentSample: current.sample,
    message: `${target.label}: ${target.baselineValue}% → ${current.value}% (${signed} pp); ${interpretation}. No implica significancia estadística.`,
  };
}

export function buildPerformanceTargetFromMatch(
  match: MatchData,
  partial: Omit<
    TrainingPerformanceTarget,
    'baselineValue' | 'baselineSample' | 'sourceMatchId'
  >,
): TrainingPerformanceTarget {
  const target: TrainingPerformanceTarget = {
    ...partial,
    sourceMatchId: match.id,
    sourceMatchDate: match.date,
    sourceTeamName: partial.teamSide === 'home' ? match.homeTeamName : match.awayTeamName,
  };

  if (target.metric === 'manual') return target;

  const measurement = measureTarget(match, target);
  return {
    ...target,
    baselineValue: measurement.value,
    baselineSample: measurement.sample,
  };
}

export const PERFORMANCE_FOLLOW_UP_MIN_SAMPLE = MIN_COMPARABLE_SAMPLE;
