import { MatchData } from '../types';

/** A score does not prove that every rally or contact was scouted. */
export function matchRecordingStatus(match: MatchData) {
  const actions = match.actions?.length ?? 0;
  const scoreboardPoints = (match.sets || []).reduce((sum, set) =>
    sum + Math.max(0, set.scoreHome || 0) + Math.max(0, set.scoreAway || 0), 0);
  // Every scored rally needs at least one recorded contact. The converse is not true:
  // multiple contacts can belong to a single rally, so never infer complete coverage.
  const definitelyPartial = actions < scoreboardPoints;
  return {
    actions,
    scoreboardPoints,
    definitelyPartial,
    message: definitelyPartial
      ? `Registro parcial: ${actions} acciones registradas y ${scoreboardPoints} puntos en el marcador. Las estadísticas describen sólo las acciones cargadas.`
      : 'Las estadísticas describen sólo las acciones cargadas. El marcador y la finalización del partido no certifican un scouting completo.',
  };
}
