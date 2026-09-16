import { MatchData } from '../types';

export type MatchStage = 'scheduled' | 'prepared' | 'in_progress' | 'finished' | 'analyzed';

export interface MatchStageInfo {
  stage: MatchStage;
  label: string;
  badgeClass: string;
  dotClass: string;
  primaryAction: 'prepare' | 'scout' | 'stats' | 'report' | 'video' | 'ai';
  primaryLabel: string;
  nextStepTitle: string;
  nextStepDesc: string;
  nextStepActionLabel: string;
  progressStep: 'prepare' | 'scout' | 'finish' | 'analyze';
}

export function getMatchStage(match?: MatchData | null): MatchStageInfo {
  if (!match) {
    return {
      stage: 'scheduled',
      label: 'PARTIDO PROGRAMADO',
      badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
      dotClass: 'bg-slate-400',
      primaryAction: 'prepare',
      primaryLabel: 'PREPARAR PARTIDO',
      nextStepTitle: 'Prepará el partido para comenzar el scouting',
      nextStepDesc: 'Verifica la formación inicial y el equipo que realiza el primer saque.',
      nextStepActionLabel: 'PREPARAR PARTIDO',
      progressStep: 'prepare',
    };
  }

  const sets = Array.isArray(match.sets) ? match.sets : [];
  const actions = Array.isArray(match.actions) ? match.actions : [];
  const homeSets = sets.filter((s) => s.winner === 'home').length;
  const awaySets = sets.filter((s) => s.winner === 'away').length;
  const totalActions = actions.length;
  const hasAnyScore = sets.some((s) => (s.scoreHome || 0) > 0 || (s.scoreAway || 0) > 0);

  // 1. Finished or Analyzed
  const isFinished = Boolean(match.isFinished) || Boolean(match.winner) || homeSets >= 3 || awaySets >= 3;
  if (isFinished) {
    const isAnalyzed = match.status === 'analyzed' || totalActions > 25;
    if (isAnalyzed) {
      return {
        stage: 'analyzed',
        label: 'PARTIDO ANALIZADO',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        dotClass: 'bg-purple-400',
        primaryAction: 'report',
        primaryLabel: 'VER INFORME',
        nextStepTitle: 'Estadísticas e Informes Listos',
        nextStepDesc: 'Partido analizado. Consulta el informe detallado, distribución táctica o video clips.',
        nextStepActionLabel: 'VER INFORME',
        progressStep: 'analyze',
      };
    }
    return {
      stage: 'finished',
      label: 'PARTIDO FINALIZADO',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      dotClass: 'bg-emerald-400',
      primaryAction: 'stats',
      primaryLabel: 'VER ESTADÍSTICAS',
      nextStepTitle: 'Revisá las estadísticas del partido',
      nextStepDesc: 'Partido finalizado. Consulta la planilla oficial FIVB P2 y métricas técnicas.',
      nextStepActionLabel: 'VER ESTADÍSTICAS',
      progressStep: 'analyze',
    };
  }

  // 2. In Progress
  if (totalActions > 0 || hasAnyScore) {
    return {
      stage: 'in_progress',
      label: 'PARTIDO EN CURSO',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      dotClass: 'bg-amber-400 animate-pulse',
      primaryAction: 'scout',
      primaryLabel: 'CONTINUAR SCOUT',
      nextStepTitle: 'El partido está en curso',
      nextStepDesc: 'Registra puntos, rotaciones y evaluaciones directamente en la cancha.',
      nextStepActionLabel: 'CONTINUAR SCOUT',
      progressStep: 'scout',
    };
  }

  // 3. Prepared
  if (match.isPrepared || match.status === 'prepared') {
    return {
      stage: 'prepared',
      label: 'PARTIDO PREPARADO',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      dotClass: 'bg-cyan-400',
      primaryAction: 'scout',
      primaryLabel: 'INICIAR SCOUT',
      nextStepTitle: 'Todo está listo para empezar',
      nextStepDesc: 'Formación y saque inicial confirmados. Haz clic para comenzar el Set 1.',
      nextStepActionLabel: 'INICIAR SCOUT',
      progressStep: 'scout',
    };
  }

  // 4. Scheduled
  return {
    stage: 'scheduled',
    label: 'PARTIDO PROGRAMADO',
    badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    dotClass: 'bg-slate-400',
    primaryAction: 'prepare',
    primaryLabel: 'PREPARAR PARTIDO',
    nextStepTitle: 'Prepará el partido para comenzar el scouting',
    nextStepDesc: 'Verifica la formación inicial y el equipo que realiza el primer saque.',
    nextStepActionLabel: 'PREPARAR PARTIDO',
    progressStep: 'prepare',
  };
}
