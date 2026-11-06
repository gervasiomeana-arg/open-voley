import { AiEvidenceInsight, MatchData, ScoutCodeAction, TeamSide } from '../types';
import { calculateTeamDataVolleySummary } from './dataVolleyAnalytics';

const MIN_ROTATION_SAMPLE = 4;
const MIN_SERVE_TARGET_SAMPLE = 4;

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function serveTypeLabel(type: NonNullable<ScoutCodeAction['serveType']>): string {
  return ({
    float: 'flotante',
    jump_float: 'jump float',
    jump_spin: 'potencia',
    standing: 'de pie',
    unknown: 'desconocido',
  })[type];
}

export function buildEvidenceInsights(match: MatchData, analyzedTeam: TeamSide): AiEvidenceInsight[] {
  const summary = calculateTeamDataVolleySummary(match, analyzedTeam);
  const insights: AiEvidenceInsight[] = [];

  const rotationRows = summary.rotations.filter((row) => row.sideoutOpportunities >= MIN_ROTATION_SAMPLE);
  if (rotationRows.length >= 2) {
    const weakest = [...rotationRows].sort((a, b) => a.sideoutPct - b.sideoutPct)[0];
    const strongest = [...rotationRows].sort((a, b) => b.sideoutPct - a.sideoutPct)[0];

    insights.push({
      id: `rotation-sideout-r${weakest.rotation}`,
      type: 'HECHO',
      category: 'TENDENCIA',
      title: `R${weakest.rotation}: menor Side-out observado`,
      description: `R${weakest.rotation} resolvió ${weakest.sideoutWon} de ${weakest.sideoutOpportunities} oportunidades de recepción (${weakest.sideoutPct}%).`,
      evidenceSource: 'Rallies y recepciones registradas',
      evidenceCount: weakest.sideoutOpportunities,
      actionLabel: 'Ver análisis',
      actionType: 'view_analysis',
      rotationRef: weakest.rotation,
      performanceMetric: 'sideout_pct',
      rallyIds: [...new Set((match.actions || [])
        .filter((action) => {
          if (action.team !== analyzedTeam || action.skill !== 'R' || !action.rallyId) return false;
          const rotation = action.rotationHome;
          const setter = match.homePlayers.find((player) => player.position === 'S' && player.starter)
            ?? match.homePlayers.find((player) => player.position === 'S');
          return analyzedTeam === 'home'
            ? Boolean(setter && Array.isArray(rotation) && rotation.indexOf(setter.number) + 1 === weakest.rotation)
            : Boolean((() => {
                const awaySetter = match.awayPlayers.find((player) => player.position === 'S' && player.starter)
                  ?? match.awayPlayers.find((player) => player.position === 'S');
                return awaySetter && Array.isArray(action.rotationAway) && action.rotationAway.indexOf(awaySetter.number) + 1 === weakest.rotation;
              })());
        })
        .map((action) => action.rallyId!))],
    });

    if (strongest.rotation !== weakest.rotation) {
      insights.push({
        id: `rotation-contrast-r${strongest.rotation}-r${weakest.rotation}`,
        type: 'INSIGHT',
        category: 'TENDENCIA',
        title: `Brecha de Side-out entre R${strongest.rotation} y R${weakest.rotation}`,
        description: `La muestra observada muestra ${strongest.sideoutPct}% en R${strongest.rotation} frente a ${weakest.sideoutPct}% en R${weakest.rotation}. La diferencia es de ${strongest.sideoutPct - weakest.sideoutPct} puntos porcentuales.`,
        evidenceSource: 'Comparación R1–R6 con muestra mínima',
        evidenceCount: strongest.sideoutOpportunities + weakest.sideoutOpportunities,
        actionLabel: 'Revisar rallies',
        actionType: 'view_video',
        rotationRef: weakest.rotation,
      });
    }
  }

  const opponent: TeamSide = analyzedTeam === 'home' ? 'away' : 'home';
  const opponentServes = (match.actions || []).filter(
    (action) =>
      action.team === opponent &&
      action.skill === 'S' &&
      action.rallyId &&
      action.serveType &&
      action.serveType !== 'unknown' &&
      action.endZone &&
      action.endZone >= 1 &&
      action.endZone <= 6,
  );

  const targets = new Map<string, {
    serveType: NonNullable<ScoutCodeAction['serveType']>;
    zone: number;
    total: number;
    negative: number;
    errors: number;
  }>();

  opponentServes.forEach((serve) => {
    const receptions = (match.actions || []).filter(
      (action) =>
        action.team === analyzedTeam &&
        action.skill === 'R' &&
        action.rallyId === serve.rallyId,
    );

    receptions.forEach((reception) => {
      const key = `${serve.serveType}:${serve.endZone}`;
      const row = targets.get(key) || {
        serveType: serve.serveType!,
        zone: serve.endZone!,
        total: 0,
        negative: 0,
        errors: 0,
      };
      row.total += 1;
      if (reception.evaluation === '=') row.errors += 1;
      if (
        reception.receptionContext === 'negative' ||
        ['=', '/', '-', '!'].includes(reception.evaluation)
      ) row.negative += 1;
      targets.set(key, row);
    });
  });

  const qualifiedTargets = [...targets.values()]
    .filter((row) => row.total >= MIN_SERVE_TARGET_SAMPLE)
    .map((row) => ({ ...row, negativePct: pct(row.negative, row.total) }))
    .sort((a, b) => b.negativePct - a.negativePct || b.total - a.total);

  const topTarget = qualifiedTargets[0];
  if (topTarget) {
    insights.push({
      id: `serve-target-${topTarget.serveType}-z${topTarget.zone}`,
      type: 'HECHO',
      category: 'RIVAL',
      title: `${serveTypeLabel(topTarget.serveType)} a Z${topTarget.zone}: mayor presión observada`,
      description: `Ese patrón produjo ${topTarget.negative} recepciones negativas de ${topTarget.total} vinculadas (${topTarget.negativePct}%) y ${topTarget.errors} errores directos de recepción.`,
      evidenceSource: 'Saque rival + zona destino + recepción unidos por rallyId',
      evidenceCount: topTarget.total,
      actionLabel: 'Ver evidencia',
      actionType: 'view_video',
      performanceMetric: 'reception_negative_pct',
      serveTypeRef: topTarget.serveType,
      zoneRef: topTarget.zone,
      rallyIds: [...new Set((match.actions || [])
        .filter((action) =>
          action.team === opponent &&
          action.skill === 'S' &&
          action.rallyId &&
          action.serveType === topTarget.serveType &&
          action.endZone === topTarget.zone
        )
        .map((action) => action.rallyId!))],
    });
  }

  return insights;
}

export const EVIDENCE_INSIGHT_THRESHOLDS = {
  minRotationSample: MIN_ROTATION_SAMPLE,
  minServeTargetSample: MIN_SERVE_TARGET_SAMPLE,
};
