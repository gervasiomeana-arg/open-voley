import React from 'react';
import { 
  Play, 
  Volleyball, 
  BarChart2, 
  TrendingUp, 
  Video, 
  Sparkles, 
  Users, 
  PlusCircle, 
  Clock, 
  Calendar, 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  FolderKanban,
  FileText,
  Activity
} from 'lucide-react';
import { MatchData, ClientUser, TrialInfo } from '../types';
import { SavedMatchRecord, SavedTeam } from '../services/teamStorage';
import { getMatchStage } from '../utils/matchStatus';

interface HomeDashboardProps {
  match: MatchData;
  savedMatches: SavedMatchRecord[];
  savedTeams: SavedTeam[];
  onContinueScouting: () => void;
  onOpenMatchCenter?: () => void;
  onOpenBoxScore: () => void;
  onOpenAnalytics: () => void;
  onOpenVideo: () => void;
  onOpenAi: () => void;
  onOpenNewMatch: () => void;
  onOpenTeams: () => void;
  onLoadSavedMatch: (record: SavedMatchRecord) => void;
  currentUser?: ClientUser | null;
  trialInfo?: TrialInfo | null;
  hasVideoLoaded?: boolean;
  userCutsCount?: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  match,
  savedMatches,
  savedTeams,
  onContinueScouting,
  onOpenMatchCenter,
  onOpenBoxScore,
  onOpenAnalytics,
  onOpenVideo,
  onOpenAi,
  onOpenNewMatch,
  onOpenTeams,
  onLoadSavedMatch,
  currentUser,
  trialInfo,
  hasVideoLoaded = false,
  userCutsCount = 0,
}) => {
  const totalActions = match.actions ? match.actions.length : 0;
  const stageInfo = getMatchStage(match);
  const isMatchLive = stageInfo.stage === 'in_progress';
  const lastAction = totalActions > 0 ? match.actions[totalActions - 1] : null;

  const validHomeSets = typeof (match as any).homeSets === 'number' && !isNaN((match as any).homeSets)
    ? (match as any).homeSets
    : (Array.isArray(match.sets) ? match.sets.filter((s) => s.winner === 'home').length : 0);

  const validAwaySets = typeof (match as any).awaySets === 'number' && !isNaN((match as any).awaySets)
    ? (match as any).awaySets
    : (Array.isArray(match.sets) ? match.sets.filter((s) => s.winner === 'away').length : 0);

  const isMatchFinished = stageInfo.stage === 'finished' || stageInfo.stage === 'analyzed' || Boolean(match.isFinished) || Boolean(match.winner) || validHomeSets >= 3 || validAwaySets >= 3;
  const matchStatusLabel = isMatchFinished
    ? 'Finalizado'
    : stageInfo.stage === 'scheduled'
    ? 'Programado'
    : stageInfo.stage === 'prepared'
    ? 'Preparado'
    : 'En curso';

  const currentSetData = Array.isArray(match.sets) ? match.sets[match.currentSet - 1] : undefined;
  const validHomeScore = typeof (match as any).homeScore === 'number' && !isNaN((match as any).homeScore)
    ? (match as any).homeScore
    : (currentSetData && typeof currentSetData.scoreHome === 'number' && !isNaN(currentSetData.scoreHome) ? currentSetData.scoreHome : 0);

  const validAwayScore = typeof (match as any).awayScore === 'number' && !isNaN((match as any).awayScore)
    ? (match as any).awayScore
    : (currentSetData && typeof currentSetData.scoreAway === 'number' && !isNaN(currentSetData.scoreAway) ? currentSetData.scoreAway : 0);

  const myTeams = (savedTeams || []).filter((t) => t.type === 'my_team');
  const opponentTeams = (savedTeams || []).filter((t) => t.type === 'opponent');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: [ ESTADO DEL PARTIDO ACTUAL ] CON ACCIÓN RECOMENDADA       */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-6 sm:p-7">
        {/* Subtle accent background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Match Status & Teams */}
          <div className="space-y-4 max-w-2xl">
            {/* Tag / Status (Low noise metadata) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border ${stageInfo.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stageInfo.dotClass}`} />
                {stageInfo.label}
              </span>

              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800">
                {match.category || 'Primera División'}
              </span>

              {match.date && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {match.date}
                </span>
              )}
            </div>

            {/* Scoreboard Display */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-0.5">
              {/* Home Team */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 font-black text-base">
                  {match.homeTeamName?.charAt(0) || 'L'}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Local</div>
                  <div className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {match.homeTeamName}
                  </div>
                </div>
              </div>

              {/* Score / Sets Badges */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono leading-none">
                    {validHomeSets}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Sets</div>
                </div>
                <div className="text-lg font-black text-slate-600 px-1">-</div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono leading-none">
                    {validAwaySets}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Sets</div>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider text-right">Visitante</div>
                  <div className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {match.awayTeamName}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 font-black text-base">
                  {match.awayTeamName?.charAt(0) || 'V'}
                </div>
              </div>
            </div>

            {/* Set & Points Details */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 font-semibold flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">Set Actual:</span>
                <span className="text-white font-bold">Set {match.currentSet}</span>
                <span className="font-mono text-amber-400 font-bold">
                  ({validHomeScore} - {validAwayScore})
                </span>
              </div>

              <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 font-medium flex items-center gap-1.5 text-[11px] text-slate-400">
                <Volleyball className="w-3.5 h-3.5 text-amber-400" />
                <span>{totalActions} jugadas registradas</span>
              </div>

              {lastAction && (
                <span className="text-slate-400 text-[11px] truncate max-w-xs">
                  Última: <strong className="text-slate-200">{lastAction.playerName || 'Jugador'}</strong> ({lastAction.skill})
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Dominant Primary CTA + Secondary Shortcuts */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
            {stageInfo.stage === 'in_progress' ? (
              <button
                onClick={onContinueScouting}
                className="group relative flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>[ CONTINUAR SCOUT ]</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : stageInfo.stage === 'prepared' ? (
              <button
                onClick={onContinueScouting}
                className="group relative flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>[ INICIAR SCOUT ]</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : stageInfo.stage === 'finished' || stageInfo.stage === 'analyzed' ? (
              <button
                onClick={onOpenBoxScore}
                className="group relative flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition cursor-pointer"
              >
                <BarChart2 className="w-4 h-4" />
                <span>[ VER ESTADÍSTICAS ]</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : onOpenMatchCenter ? (
              <button
                onClick={onOpenMatchCenter}
                className="group relative flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <Volleyball className="w-4 h-4 fill-current" />
                <span>[ CENTRO DEL PARTIDO ]</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                onClick={onContinueScouting}
                className="group relative flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>[ CONTINUAR PARTIDO ]</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Secondary shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              {onOpenMatchCenter && (
                <button
                  onClick={onOpenMatchCenter}
                  className="flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700/80 transition cursor-pointer"
                >
                  <Volleyball className="w-3 h-3 text-amber-400" />
                  <span>Centro Partido</span>
                </button>
              )}

              {stageInfo.stage === 'finished' || stageInfo.stage === 'analyzed' ? (
                <button
                  onClick={onContinueScouting}
                  className="flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700/80 transition cursor-pointer"
                >
                  <Play className="w-3 h-3 text-cyan-400" />
                  <span>Ver Scout</span>
                </button>
              ) : (
                <button
                  onClick={onOpenBoxScore}
                  className="flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700/80 transition cursor-pointer"
                >
                  <BarChart2 className="w-3 h-3 text-emerald-400" />
                  <span>Planilla FIVB</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE-COLUMN DASHBOARD: PARTIDOS, EQUIPOS, RESUMEN DE ACTIVIDAD        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COL 1: ÚLTIMOS PARTIDOS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Últimos Partidos</h3>
                  <p className="text-[11px] text-slate-400">Historial y partidos guardados</p>
                </div>
              </div>

              <button
                onClick={onOpenNewMatch}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>

            {/* List of matches */}
            <div className="space-y-2.5">
              {/* Active Match Card */}
              <div 
                onClick={onOpenMatchCenter || onContinueScouting}
                className="p-3.5 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-amber-500/40 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      isMatchFinished 
                        ? 'bg-emerald-400' 
                        : stageInfo.stage === 'scheduled' || stageInfo.stage === 'prepared' 
                        ? 'bg-slate-400' 
                        : 'bg-amber-400 animate-pulse'
                    }`} />
                    <span className="text-xs font-bold text-white truncate">
                      {match.homeTeamName} vs {match.awayTeamName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {matchStatusLabel} • Set {match.currentSet} ({validHomeSets}-{validAwaySets}) • {totalActions} jugadas
                  </div>
                </div>
                <div className="text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  Ver Centro →
                </div>
              </div>

              {/* Saved Matches items */}
              {savedMatches && savedMatches.length > 0 ? (
                savedMatches.slice(0, 3).map((sm) => (
                  <div
                    key={sm.id}
                    onClick={() => onLoadSavedMatch(sm)}
                    className="p-3 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl border border-slate-700/60 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {sm.homeTeamName} vs {sm.awayTeamName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{sm.date}</span>
                        <span>•</span>
                        <span>{sm.actionsCount} jugadas</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-amber-400 transition font-bold">
                      Cargar
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
                  No hay otros partidos guardados aún
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onOpenNewMatch}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs p-2.5 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Configurar Nuevo Partido</span>
          </button>
        </div>

        {/* COL 2: EQUIPOS Y ROSTERS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Equipos & Planteles</h3>
                  <p className="text-[11px] text-slate-400">Mis equipos y biblioteca de rivales</p>
                </div>
              </div>

              <button
                onClick={onOpenTeams}
                className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                <span>Administrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick stats of teams */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                <div className="text-xl font-black text-white font-mono">{myTeams.length}</div>
                <div className="text-[11px] font-bold text-cyan-400 mt-0.5">Mis Equipos</div>
                <div className="text-[10px] text-slate-400">Planteles propios</div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                <div className="text-xl font-black text-white font-mono">{opponentTeams.length}</div>
                <div className="text-[11px] font-bold text-orange-400 mt-0.5">Rivales</div>
                <div className="text-[10px] text-slate-400">Equipos scouted</div>
              </div>
            </div>

            {/* List preview */}
            <div className="space-y-2">
              {(savedTeams || []).slice(0, 3).map((team) => (
                <div
                  key={team.id}
                  onClick={onOpenTeams}
                  className="p-2.5 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl border border-slate-700/50 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${team.type === 'my_team' ? 'bg-cyan-400' : 'bg-orange-400'}`} />
                    <span className="text-xs font-bold text-slate-200 truncate">{team.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {team.players?.length || 0} jug.
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenTeams}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs p-2.5 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Ver Todos los Equipos</span>
          </button>
        </div>

        {/* COL 3: RESUMEN DE ACTIVIDAD RECIENTE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Resumen de Actividad</h3>
                  <p className="text-[11px] text-slate-400">Estado integral de la sesión</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-2.5">
              {/* Scouting Activity */}
              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volleyball className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Scouting en Vivo</div>
                    <div className="text-[10px] text-slate-400">{totalActions} acciones registradas</div>
                  </div>
                </div>
                <button
                  onClick={onContinueScouting}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                >
                  Cancha 2D →
                </button>
              </div>

              {/* Video status */}
              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Sincronización Video</div>
                    <div className="text-[10px] text-slate-400">
                      {hasVideoLoaded ? 'Video HD sincronizado' : 'Sin video montado'} • {userCutsCount} cortes
                    </div>
                  </div>
                </div>
                <button
                  onClick={onOpenVideo}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold"
                >
                  Abrir →
                </button>
              </div>

              {/* IA Coach status */}
              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">IA Coach & Visión</div>
                    <div className="text-[10px] text-slate-400">Distribución de armador activa</div>
                  </div>
                </div>
                <button
                  onClick={onOpenAi}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold"
                >
                  Consultar →
                </button>
              </div>
            </div>
          </div>

          {/* User status */}
          {trialInfo && (
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">Licencia de Prueba:</span>
              </div>
              <span className="font-bold text-emerald-400">
                {trialInfo.daysRemaining} días restantes
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
