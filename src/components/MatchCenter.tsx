import React, { useMemo } from 'react';
import { MatchData, ScoutCodeAction, TeamSide } from '../types';
import { calculatePlayerStats } from '../utils/codeParser';
import { getMatchStage } from '../utils/matchStatus';
import { 
  Zap, 
  Video, 
  BarChart2, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Trophy, 
  Save, 
  FolderKanban, 
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity,
  History,
  Compass,
  Users,
  RotateCcw
} from 'lucide-react';

interface MatchCenterProps {
  match: MatchData;
  onNavigateTo: (destination: 'scout' | 'video' | 'stats' | 'ai' | 'analytics') => void;
  onOpenNewMatch: () => void;
  onOpenSavedMatches: () => void;
  onSaveMatch: () => void;
  onOpenPreparation?: () => void;
  onOpenFinishMatch?: () => void;
  onReopenMatch?: () => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({
  match,
  onNavigateTo,
  onOpenNewMatch,
  onOpenSavedMatches,
  onSaveMatch,
  onOpenPreparation,
  onOpenFinishMatch,
  onReopenMatch,
}) => {
  // 1. Calculate Match Status & Stage from centralized helper
  const stageInfo = useMemo(() => getMatchStage(match), [match]);

  const currentSetData = match.sets[match.currentSet - 1] || { scoreHome: 0, scoreAway: 0 };
  const homeSets = match.sets.filter((s) => s.winner === 'home').length;
  const awaySets = match.sets.filter((s) => s.winner === 'away').length;

  const isFinished = stageInfo.stage === 'finished' || stageInfo.stage === 'analyzed';
  const isInProgress = stageInfo.stage === 'in_progress';
  const isPrepared = stageInfo.stage === 'prepared';
  const isScheduled = stageInfo.stage === 'scheduled';

  // Status Icon selection
  const StatusIcon = useMemo(() => {
    if (isFinished) return CheckCircle2;
    if (isInProgress) return Activity;
    if (isPrepared) return Users;
    return Clock;
  }, [isFinished, isInProgress, isPrepared]);

  // 2. Real Existing Statistics Calculation (No invented metrics)
  const summaryStats = useMemo(() => {
    if (!match.actions || match.actions.length === 0) return null;

    const allPlayers = [...(match.homePlayers || []), ...(match.awayPlayers || [])];
    const statsList = calculatePlayerStats(allPlayers, match.actions);

    // Top Scorer (Ataque Pts + Bloqueo Pts + Saque Aces)
    let topScorer: { name: string; number: number; points: number; team: TeamSide } | null = null;
    let maxPts = 0;

    // Best Receiver (% Positiva con al menos 1 recepción)
    let bestReceiver: { name: string; number: number; posPct: number; total: number } | null = null;
    let maxRecPct = -1;

    // Team aggregated totals
    let totalAttacks = 0;
    let totalAttPts = 0;
    let totalAttErr = 0;
    let totalAttBlocked = 0;

    let totalRecs = 0;
    let totalRecPositive = 0;

    let totalErrors = 0;

    statsList.forEach((st) => {
      const pts = st.attPts + st.blockPts + st.serveAce;
      if (pts > maxPts) {
        maxPts = pts;
        topScorer = { name: st.name, number: st.playerNum, points: pts, team: st.team };
      }

      if (st.recTotal > 0 && st.recPosPct > maxRecPct) {
        maxRecPct = st.recPosPct;
        bestReceiver = { name: st.name, number: st.playerNum, posPct: st.recPosPct, total: st.recTotal };
      }

      totalAttacks += st.attTotal;
      totalAttPts += st.attPts;
      totalAttErr += st.attErr;
      totalAttBlocked += st.attBlocked;

      totalRecs += st.recTotal;
      totalRecPositive += st.recPositive;

      totalErrors += (st.serveErr + st.recErr + st.attErr);
    });

    const attackEff = totalAttacks > 0 
      ? Math.round(((totalAttPts - totalAttErr - totalAttBlocked) / totalAttacks) * 100) 
      : null;
    
    const attackKillPct = totalAttacks > 0
      ? Math.round((totalAttPts / totalAttacks) * 100)
      : null;

    const recPositivePct = totalRecs > 0
      ? Math.round((totalRecPositive / totalRecs) * 100)
      : null;

    return {
      topScorer,
      bestReceiver,
      attackEff,
      attackKillPct,
      recPositivePct,
      totalErrors,
      totalActions: match.actions.length,
    };
  }, [match]);

  // 3. Last 3 to 5 Actions in the match
  const lastActions = useMemo(() => {
    if (!match.actions || match.actions.length === 0) return [];
    return match.actions.slice(-4).reverse();
  }, [match.actions]);

  const skillNameMap: Record<string, string> = {
    S: 'Saque',
    R: 'Recepción',
    E: 'Armado',
    A: 'Ataque',
    B: 'Bloqueo',
    D: 'Defensa',
    F: 'Freeball',
  };

  const evalLabelMap: Record<string, { text: string; color: string }> = {
    '#': { text: 'Punto', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
    '+': { text: 'Positiva / Continuidad', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30' },
    '!': { text: 'Neutra', color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' },
    '-': { text: 'Negativa', color: 'text-orange-400 bg-orange-950/60 border-orange-500/30' },
    '/': { text: 'Bloqueado', color: 'text-purple-400 bg-purple-950/60 border-purple-500/30' },
    '=': { text: 'Error', color: 'text-rose-400 bg-rose-950/60 border-rose-500/30' },
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn select-none pb-8">

      {/* =========================================================
          0. INDICADOR DE PROGRESO DEL PARTIDO (Secuencia Lineal)
          PREPARAR → SCOUT → FINALIZAR → ANALIZAR
          ========================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 sm:px-5 py-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-black">
            FLUJO DEL PARTIDO:
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5">
          {[
            { id: 'prepare', label: '1. PREPARAR' },
            { id: 'scout', label: '2. SCOUT' },
            { id: 'finish', label: '3. FINALIZAR' },
            { id: 'analyze', label: '4. ANALIZAR' },
          ].map((step, idx, arr) => {
            const isCurrent = stageInfo.progressStep === step.id;
            const isPassed =
              (step.id === 'prepare' && stageInfo.progressStep !== 'prepare') ||
              (step.id === 'scout' && (stageInfo.progressStep === 'finish' || stageInfo.progressStep === 'analyze')) ||
              (step.id === 'finish' && stageInfo.progressStep === 'analyze');

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : isPassed
                      ? 'bg-slate-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-950/60 text-slate-500 border border-slate-800/60'
                  }`}
                >
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />}
                  <span>{step.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <span className={`text-xs ${isPassed ? 'text-emerald-500' : 'text-slate-600'}`}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      {/* =========================================================
          1. ENCABEZADO PRINCIPAL DEL PARTIDO
          ========================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-80 h-28 bg-amber-500/5 blur-3xl pointer-events-none" />

        {/* Top Meta Bar: Status, Competition, Date (Low-contrast metadata) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${stageInfo.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stageInfo.dotClass}`} />
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{stageInfo.label}</span>
            </span>

            {match.competition && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium hidden sm:flex">
                <Trophy className="w-3 h-3 text-slate-500" />
                <span>{match.competition}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {match.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{match.date}</span>
              </span>
            )}
            {match.category && (
              <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
                {match.category}
              </span>
            )}
          </div>
        </div>

        {/* Scoreboard: LOCAL vs VISITANTE & Sets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Home Team */}
          <div className="md:col-span-5 flex items-center justify-between md:justify-start gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Local
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
                {match.homeTeamName}
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">
                {match.homePlayers?.length || 0} jugadores en plantilla
              </span>
            </div>

            <div className="bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 text-center shadow-inner shrink-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Sets</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 leading-none">
                {homeSets}
              </span>
            </div>
          </div>

          {/* Center: Current Set & Score */}
          <div className="md:col-span-2 flex flex-col items-center justify-center text-center p-2.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
              SET {match.currentSet}
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {currentSetData.scoreHome} - {currentSetData.scoreAway}
            </div>
            
            {/* Sets history list */}
            {match.sets.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 overflow-x-auto text-[10px] font-mono font-bold text-slate-400">
                {match.sets.map((s) => (
                  <span
                    key={s.setNumber}
                    className={`px-1.5 py-0.5 rounded ${
                      s.setNumber === match.currentSet ? 'text-amber-400 bg-slate-800 font-black' : 'text-slate-500'
                    }`}
                  >
                    S{s.setNumber}: {s.scoreHome}-{s.scoreAway}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="md:col-span-5 flex items-center justify-between md:justify-end gap-4">
            <div className="bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 text-center shadow-inner shrink-0 order-2 md:order-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Sets</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 leading-none">
                {awaySets}
              </span>
            </div>

            <div className="text-right min-w-0 order-1 md:order-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Visitante
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
                {match.awayTeamName}
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">
                {match.awayPlayers?.length || 0} jugadores en plantilla
              </span>
            </div>
          </div>

        </div>

        {/* =========================================================
            ZONA CONTEXTUAL: "SIGUIENTE PASO" (Se adapta según el estado)
            ========================================================= */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                SIGUIENTE PASO
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                {stageInfo.nextStepTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {stageInfo.nextStepDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {/* PARTIDO PROGRAMADO */}
            {isScheduled && (
              <>
                {onOpenPreparation ? (
                  <button
                    onClick={onOpenPreparation}
                    className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>[ PREPARAR PARTIDO ]</span>
                  </button>
                ) : null}
                <button
                  onClick={() => onNavigateTo('scout')}
                  className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                  title="Saltar directamente al scouting"
                >
                  <span>Iniciar Scout →</span>
                </button>
              </>
            )}

            {/* PARTIDO PREPARADO */}
            {isPrepared && (
              <>
                <button
                  onClick={() => onNavigateTo('scout')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>[ INICIAR SCOUT ]</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {onOpenPreparation && (
                  <button
                    onClick={onOpenPreparation}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    <span>Editar Preparación</span>
                  </button>
                )}
              </>
            )}

            {/* PARTIDO EN CURSO */}
            {isInProgress && (
              <>
                <button
                  onClick={() => onNavigateTo('scout')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>[ CONTINUAR SCOUT ]</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {onOpenFinishMatch && (
                  <button
                    onClick={onOpenFinishMatch}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white font-bold text-xs rounded-xl border border-rose-500/30 transition cursor-pointer"
                  >
                    <span>[ FINALIZAR PARTIDO ]</span>
                  </button>
                )}
              </>
            )}

            {/* PARTIDO FINALIZADO / ANALIZADO */}
            {isFinished && (
              <>
                <button
                  onClick={() => onNavigateTo('stats')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>[ VER ESTADÍSTICAS ]</span>
                </button>
                <button
                  onClick={() => onNavigateTo('analytics')}
                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>[ VER INFORME ]</span>
                </button>
                {onReopenMatch && (
                  <button
                    onClick={onReopenMatch}
                    className="w-full sm:w-auto px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                    title="Permite registrar o corregir jugadas"
                  >
                    <span>Reanudar Scout</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* =========================================================
          2. MÓDULOS DEL PARTIDO (ACCESO SECUNDARIO Y DINÁMICO)
          ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* BOTÓN 1: [ SCOUT ] */}
        <button
          onClick={() => onNavigateTo('scout')}
          className={`group p-4 rounded-2xl text-white text-left transition active:scale-98 shadow-md flex flex-col justify-between h-36 cursor-pointer ${
            isInProgress
              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/60 ring-1 ring-amber-500/30'
              : (isScheduled || isPrepared)
              ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40'
              : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${
              isInProgress ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
              isInProgress 
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold animate-pulse' 
                : isPrepared
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-400 bg-slate-950 border-slate-800'
            }`}>
              {isInProgress ? '● EN VIVO' : isPrepared ? '✓ PREPARADO' : isFinished ? 'HISTORIAL' : 'CONSOLA'}
            </span>
          </div>

          <div>
            <div className="text-base font-black text-white flex items-center gap-1.5 group-hover:text-amber-400 transition-colors">
              <span>{isFinished ? 'Ver Jugadas' : 'Scouting en Vivo'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {isInProgress ? 'Registro punto a punto en cancha' : 'Cancha 2D, rotaciones y toques'}
            </p>
          </div>
        </button>

        {/* BOTÓN 2: [ VIDEO ] */}
        <button
          onClick={() => onNavigateTo('video')}
          className="group p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700 text-left transition active:scale-98 shadow-md flex flex-col justify-between h-36 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              CLIPS
            </span>
          </div>

          <div>
            <div className="text-base font-black text-white flex items-center gap-1.5 group-hover:text-sky-400 transition-colors">
              <span>Video Sincronizado</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              Reproducción sincronizada con jugadas
            </p>
          </div>
        </button>

        {/* BOTÓN 3: [ ESTADÍSTICAS & PLANILLA ] */}
        <button
          onClick={() => onNavigateTo('stats')}
          className={`group p-4 rounded-2xl text-white text-left transition active:scale-98 shadow-md flex flex-col justify-between h-36 cursor-pointer ${
            isFinished
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-2 border-emerald-500/60 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${
              isFinished ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isFinished
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'text-slate-400 bg-slate-950 border-slate-800'
            }`}>
              {isFinished ? 'OFICIAL FIVB' : 'FIVB P2'}
            </span>
          </div>

          <div>
            <div className="text-base font-black text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
              <span>Estadísticas & Planilla</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {isFinished ? 'Planilla oficial completa y métricas' : 'Planilla oficial y métricas por jugador'}
            </p>
          </div>
        </button>

        {/* BOTÓN 4: [ INFORME / ANÁLISIS ] */}
        <button
          onClick={() => onNavigateTo('analytics')}
          className={`group p-4 rounded-2xl text-white text-left transition active:scale-98 shadow-md flex flex-col justify-between h-36 cursor-pointer ${
            isFinished
              ? 'bg-purple-500/10 hover:bg-purple-500/20 border-2 border-purple-500/60 ring-1 ring-purple-500/30'
              : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${
              isFinished ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-500/10 text-purple-400'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isFinished
                ? 'bg-purple-600 text-white border-purple-400 font-bold'
                : 'text-slate-400 bg-slate-950 border-slate-800'
            }`}>
              {isFinished ? 'INFORME LISTO' : 'IA & TÁCTICA'}
            </span>
          </div>

          <div>
            <div className="text-base font-black text-white flex items-center gap-1.5 group-hover:text-purple-400 transition-colors">
              <span>Informe & Análisis</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {isFinished ? 'Estudio del adversario y matrices' : 'Recomendaciones y matrices avanzadas'}
            </p>
          </div>
        </button>

      </div>

      {/* =========================================================
          3. RESUMEN AUTOMÁTICO & ÚLTIMAS ACCIONES EN VIVO
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RESUMEN AUTOMÁTICO (Información real existente sin métricas inventadas) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Resumen del Partido
              </h3>
            </div>
            {summaryStats && (
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {summaryStats.totalActions} acciones computadas
              </span>
            )}
          </div>

          {summaryStats ? (
            <div className="space-y-3">
              {/* Highlight Cards: Mejor Anotador & Mejor Recepción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Mejor Anotador */}
                {summaryStats.topScorer ? (
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-black text-lg shrink-0">
                      #{summaryStats.topScorer.number}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                        Mejor Anotador
                      </span>
                      <div className="text-sm font-black text-white truncate">
                        {summaryStats.topScorer.name}
                      </div>
                      <span className="text-xs text-slate-400 font-bold font-mono">
                        {summaryStats.topScorer.points} puntos anotados
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500 italic">
                    Sin remates anotados aún
                  </div>
                )}

                {/* Mejor Recepción */}
                {summaryStats.bestReceiver ? (
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-black text-lg shrink-0">
                      #{summaryStats.bestReceiver.number}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                        Mejor Recepción
                      </span>
                      <div className="text-sm font-black text-white truncate">
                        {summaryStats.bestReceiver.name}
                      </div>
                      <span className="text-xs text-slate-400 font-bold font-mono">
                        {summaryStats.bestReceiver.posPct}% positiva ({summaryStats.bestReceiver.total} pases)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-500 italic">
                    Sin recepciones registradas aún
                  </div>
                )}

              </div>

              {/* Ratios & Key Indicators List */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {summaryStats.attackKillPct !== null && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Eficacia Ataque</span>
                    <span className="text-xl font-black font-mono text-white mt-0.5 block">
                      {summaryStats.attackKillPct}%
                    </span>
                  </div>
                )}

                {summaryStats.recPositivePct !== null && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Recep. Positiva</span>
                    <span className="text-xl font-black font-mono text-cyan-400 mt-0.5 block">
                      {summaryStats.recPositivePct}%
                    </span>
                  </div>
                )}

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Errores Totales</span>
                  <span className="text-xl font-black font-mono text-rose-400 mt-0.5 block">
                    {summaryStats.totalErrors}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-2">
              <p className="text-xs text-slate-400">
                El partido todavía no tiene jugadas registradas en la planilla.
              </p>
              <button
                onClick={() => onNavigateTo('scout')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Comenzar Scouting en Vivo</span>
              </button>
            </div>
          )}
        </div>

        {/* ÚLTIMAS ACCIONES (Máximo 3 a 5 jugadas) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Últimas Acciones
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              En Cancha
            </span>
          </div>

          {lastActions.length > 0 ? (
            <div className="space-y-2">
              {lastActions.map((act) => {
                const evalMeta = evalLabelMap[act.evaluation] || { text: act.evaluation, color: 'text-slate-300 bg-slate-800 border-slate-700' };
                const skillLabel = skillNameMap[act.skill] || act.skill;
                return (
                  <div
                    key={act.id}
                    className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-black text-amber-400 bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                        #{act.playerNum}
                      </span>
                      <div className="min-w-0 truncate">
                        <span className="font-bold text-white block truncate">
                          {act.playerName || `Jugador #${act.playerNum}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {skillLabel} • Set {act.setNumber}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border font-mono shrink-0 ${evalMeta.color}`}>
                      {evalMeta.text}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500 italic">
              Aún no hay acciones registradas en este partido.
            </div>
          )}

          {/* Quick link to continue scouting */}
          <button
            onClick={() => onNavigateTo('scout')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Abrir Consola Completa de Scouting</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* =========================================================
          4. ACCIONES SECUNDARIAS DEL PARTIDO (PIE DE PÁGINA)
          ========================================================= */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 font-medium flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px]">Gestión del Partido: guarda tu progreso, carga partidos anteriores o crea uno nuevo.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSaveMatch}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer text-xs"
            title="Guardar estado del partido actual"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardar</span>
          </button>

          <button
            onClick={onOpenSavedMatches}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer text-xs"
            title="Cargar otro partido desde el almacenamiento local"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
            <span>Cargar Partido</span>
          </button>

          <button
            onClick={onOpenNewMatch}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-xl font-bold border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer text-xs"
            title="Crear un nuevo partido"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Nuevo</span>
          </button>
        </div>
      </div>

    </div>
  );
};
