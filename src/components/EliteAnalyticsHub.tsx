import React, { useState, useMemo } from 'react';
import { MatchData, TeamSide, ScoutCodeAction } from '../types';
import { calculateTeamDataVolleySummary } from '../utils/dataVolleyAnalytics';
import { 
  TrendingUp, 
  Target, 
  Compass, 
  Zap, 
  Shield, 
  Users, 
  Printer, 
  Download, 
  Flame, 
  Layers, 
  Crosshair, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Info, 
  SlidersHorizontal,
  FileText,
  ChevronRight,
  BarChart2,
  PieChart,
  Calendar,
  Trophy,
  ArrowUpRight,
  Eye
} from 'lucide-react';

export type EliteReportType = 
  | 'ferraro_scout'     // 1. Estudio del Adversario (Método Hernán Ferraro / Datearte)
  | 'setter_matrix'     // 2. Matriz de Distribución de Armado & Rotaciones (Data Volley / VolleyStation)
  | 'serve_pass_matrix' // 3. Matriz de Saque vs Recepción & Zonas Target (VolleyMetrics)
  | 'k1_k2_phases';     // 4. Rendimiento Fases K1 (Sideout) vs K2 (Break Point) & Rachas (FIVB VIS)

interface EliteAnalyticsHubProps {
  match: MatchData;
  currentMatch?: MatchData;
  onOpenNewMatch?: () => void;
}

export interface OpponentServeCounts {
  opponentTotalServes: number;
  valueOf?: () => number;
  toString?: () => string;
}

/**
 * Counts real match actions of type SERVE for the opponent team and returns:
 * - opponentTotalServes
 */
export function countOpponentServes(currentMatch: MatchData): OpponentServeCounts {
  const actions = currentMatch.actions || [];
  const opponentServeActions = actions.filter((a) => {
    const isOpponent =
      a.team === 'away' ||
      (a as any).teamSide === 'away' ||
      (Boolean(currentMatch.awayTeamName) && (a as any).team === currentMatch.awayTeamName);
    const isServe =
      a.skill === 'S' ||
      (a as any).type === 'SERVE' ||
      (a as any).actionType === 'SERVE' ||
      (a as any).skill === 'SERVE';
    return isOpponent && isServe;
  });

  const opponentTotalServes = opponentServeActions.length;
  return {
    opponentTotalServes,
    valueOf() {
      return opponentTotalServes;
    },
    toString() {
      return String(opponentTotalServes);
    },
  };
}

/**
 * Detects if there is at least one ACE action of type SERVE for the opponent team.
 * Returns true if at least one exists, otherwise false.
 */
export function hasOpponentServeAce(currentMatch: MatchData): boolean {
  const actions = currentMatch.actions || [];
  return actions.some((a) => {
    const isOpponent =
      a.team === 'away' ||
      (a as any).teamSide === 'away' ||
      (Boolean(currentMatch.awayTeamName) && (a as any).team === currentMatch.awayTeamName);
    const isServe =
      a.skill === 'S' ||
      (a as any).type === 'SERVE' ||
      (a as any).actionType === 'SERVE' ||
      (a as any).skill === 'SERVE';
    const isAce =
      a.evaluation === '#' ||
      (a as any).result === 'ace' ||
      (a as any).result === 'point' ||
      (a as any).result === 'pt';
    return isOpponent && isServe && isAce;
  });
}

/**
 * Counts real match actions of type SERVE for the opponent team with result ACE.
 * Returns the total number of opponent serve aces (opponentServeAces).
 */
export function countOpponentServeAces(currentMatch: MatchData): number {
  const actions = currentMatch.actions || [];
  const opponentServeAceActions = actions.filter((a) => {
    const isOpponent =
      a.team === 'away' ||
      (a as any).teamSide === 'away' ||
      (Boolean(currentMatch.awayTeamName) && (a as any).team === currentMatch.awayTeamName);
    const isServe =
      a.skill === 'S' ||
      (a as any).type === 'SERVE' ||
      (a as any).actionType === 'SERVE' ||
      (a as any).skill === 'SERVE';
    const isAce =
      a.evaluation === '#' ||
      (a as any).result === 'ace' ||
      (a as any).result === 'point' ||
      (a as any).result === 'pt';
    return isOpponent && isServe && isAce;
  });

  const opponentServeAces = opponentServeAceActions.length;
  return opponentServeAces;
}

export const EliteAnalyticsHub: React.FC<EliteAnalyticsHubProps> = ({
  match,
  currentMatch: propCurrentMatch,
  onOpenNewMatch,
}) => {
  const currentMatch = propCurrentMatch || match;
  const hasEnoughActionsForAdvancedAnalysis: boolean = currentMatch.actions.length >= 20;
  void countOpponentServes;
  void hasOpponentServeAce;
  void countOpponentServeAces;

  const [selectedReport, setSelectedReport] = useState<EliteReportType>('ferraro_scout');
  const [analyzedTeamSide, setAnalyzedTeamSide] = useState<TeamSide>('away'); // Rival por defecto
  const [selectedSetFilter, setSelectedSetFilter] = useState<number>(0); // 0 = Todo el partido

  // Setter Matrix sub-filter
  const [setterRotationFilter, setSetterRotationFilter] = useState<number>(0); // 0 = Todas, 1-6 = P1-P6
  const [setterPassQualityFilter, setSetterPassQualityFilter] = useState<'all' | 'positive' | 'negative'>('all');

  // Filter actions based on set and team
  const filteredActions = useMemo(() => {
    return match.actions.filter((a) => {
      if (selectedSetFilter > 0 && a.setNumber !== selectedSetFilter) return false;
      return true;
    });
  }, [match.actions, selectedSetFilter]);

  const targetTeamName = analyzedTeamSide === 'away' ? match.awayTeamName : match.homeTeamName;
  const opposingTeamName = analyzedTeamSide === 'away' ? match.homeTeamName : match.awayTeamName;
  const targetPlayers = analyzedTeamSide === 'away' ? match.awayPlayers : match.homePlayers;

  const filteredMatch = useMemo<MatchData>(() => ({
    ...match,
    actions: filteredActions,
  }), [match, filteredActions]);

  const dataVolleySummary = useMemo(
    () => calculateTeamDataVolleySummary(filteredMatch, analyzedTeamSide),
    [filteredMatch, analyzedTeamSide],
  );

  const handlePrint = () => {
    window.print();
  };

  // Helper calculation for *E% (Efficiency)
  const calcEfficiency = (points: number, errors: number, total: number): number => {
    if (!total || total === 0) return 0;
    return Math.round(((points - errors) / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[11px] rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                MÓDULO 6: ANALYTICS & INFORMES DE ÉLITE
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded border border-amber-500/30">
                Data Volley 4 & Datearte 2.0 Standard
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Informes Tácticos & Estadísticas de Alto Nivel
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Análisis avanzado para Directores Técnicos y Analistas de Alto Rendimiento: Estudio del adversario, matriz de distribución del armador, mapa de saque/recepción y fases K1 vs K2.
            </p>
          </div>

          {/* Quick Filters Bar (Team Selector + Set Filter + Print) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Team Side Selector */}
            <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setAnalyzedTeamSide('away')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  analyzedTeamSide === 'away'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Analizar al rival"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Rival: {match.awayTeamName}</span>
              </button>
              <button
                onClick={() => setAnalyzedTeamSide('home')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  analyzedTeamSide === 'home'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Analizar mi equipo"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mi Equipo: {match.homeTeamName}</span>
              </button>
            </div>

            {/* Set Selector */}
            <div className="bg-slate-950/80 px-2 py-1 rounded-2xl border border-slate-800 flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-400 pl-1">Set:</span>
              <select
                value={selectedSetFilter}
                onChange={(e) => setSelectedSetFilter(Number(e.target.value))}
                aria-label="Filtrar por set del partido"
                className="bg-slate-800 text-white text-xs font-bold rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value={0}>Todos los Sets</option>
                {match.sets && match.sets.length > 0 ? (
                  match.sets.map((s) => (
                    <option key={s.setNumber} value={s.setNumber}>
                      Set {s.setNumber} ({s.scoreHome}-{s.scoreAway})
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Set 1</option>
                    <option value={2}>Set 2</option>
                    <option value={3}>Set 3</option>
                  </>
                )}
              </select>
            </div>

            {/* Print / Export Button */}
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-white font-black text-xs px-3.5 py-2 rounded-2xl flex items-center gap-1.5 border border-slate-700 shadow-md transition cursor-pointer print:hidden"
              title="Imprimir informe en formato PDF oficial para el cuerpo técnico"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Report Tabs Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-slate-800/80">
          {/* TAB 1 */}
          <button
            onClick={() => setSelectedReport('ferraro_scout')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              selectedReport === 'ferraro_scout'
                ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Informe 1 • Datearte 2.0
              </span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-black text-sm text-slate-100">
              Estudio del Adversario
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Método Hernán Ferraro: K1/K2, flot vs salto y armador
            </div>
          </button>

          {/* TAB 2 */}
          <button
            onClick={() => setSelectedReport('setter_matrix')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              selectedReport === 'setter_matrix'
                ? 'bg-purple-500/15 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                Informe 2 • Setter Matrix
              </span>
              <Compass className="w-4 h-4 text-purple-400" />
            </div>
            <div className="font-black text-sm text-slate-100">
              Distribución del Armador
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Tendencias por rotación (P1-P6), pase + / - y pelotas calientes
            </div>
          </button>

          {/* TAB 3 */}
          <button
            onClick={() => setSelectedReport('serve_pass_matrix')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              selectedReport === 'serve_pass_matrix'
                ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Informe 3 • VolleyMetrics
              </span>
              <Crosshair className="w-4 h-4 text-amber-400" />
            </div>
            <div className="font-black text-sm text-slate-100">
              Saque vs Recepción & Seams
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Zonas de conflicto, costuras líbero-punta y receptor target
            </div>
          </button>

          {/* TAB 4 */}
          <button
            onClick={() => setSelectedReport('k1_k2_phases')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
              selectedReport === 'k1_k2_phases'
                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Informe 4 • FIVB VIS
              </span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-black text-sm text-slate-100">
              Fases K1 (Sideout) vs K2
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Eficiencia de salida, break point runs y kill on 1st ball
            </div>
          </button>
        </div>
      </div>

      {/* DataVolley coach snapshot: only real actions from the selected team/set */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black tracking-[0.18em] text-cyan-400 uppercase">Lectura rápida del DT</div>
            <h2 className="text-xl font-black text-white mt-1">Resumen DataVolley • {dataVolleySummary.teamName}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Calculado únicamente con las {dataVolleySummary.sampleSize} acciones registradas en el filtro actual.
            </p>
          </div>
          <div className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            {dataVolleySummary.sampleSize === 0
              ? 'Sin muestra estadística disponible'
              : 'Sin valores de ejemplo ni proyecciones inventadas'}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Recepción +', value: dataVolleySummary.reception.total ? `${dataVolleySummary.reception.positivePct}%` : '—', detail: `${dataVolleySummary.reception.total} rec.` },
            { label: 'Recepción #', value: dataVolleySummary.reception.total ? `${dataVolleySummary.reception.perfectPct}%` : '—', detail: 'perfecta' },
            { label: 'Ataque %', value: dataVolleySummary.attack.total ? `${dataVolleySummary.attack.pointPct}%` : '—', detail: `${dataVolleySummary.attack.points}/${dataVolleySummary.attack.total}` },
            { label: 'Ataque E%', value: dataVolleySummary.attack.total ? `${dataVolleySummary.attack.efficiencyPct}%` : '—', detail: 'puntos-err-blq' },
            { label: 'Ace %', value: dataVolleySummary.serve.total ? `${dataVolleySummary.serve.pointPct}%` : '—', detail: `${dataVolleySummary.serve.points}/${dataVolleySummary.serve.total}` },
            { label: 'Bloqueos', value: String(dataVolleySummary.blockPoints), detail: 'puntos directos' },
            { label: 'Balance', value: dataVolleySummary.sampleSize ? (dataVolleySummary.gainLoss > 0 ? `+${dataVolleySummary.gainLoss}` : String(dataVolleySummary.gainLoss)) : '—', detail: 'ganancia/pérdida' },
          ].map((metric) => (
            <div key={metric.label} className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{metric.label}</div>
              <div className="text-xl font-black text-white mt-1">{metric.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{metric.detail}</div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2">Rotación</th>
                <th className="px-3 py-2 text-center">Muestra</th>
                <th className="px-3 py-2 text-center">Rec +</th>
                <th className="px-3 py-2 text-center">Ataque E%</th>
                <th className="px-3 py-2 text-center">K1 / Side-out</th>
                <th className="px-3 py-2 text-center">K2 / Break Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dataVolleySummary.rotations.map((row) => (
                <tr key={row.rotation} className="bg-slate-900/50 hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-black text-white">R{row.rotation}</td>
                  <td className="px-3 py-2 text-center text-slate-300">{row.samples}</td>
                  <td className="px-3 py-2 text-center text-cyan-300">{row.reception.total ? `${row.reception.positivePct}%` : '—'}</td>
                  <td className="px-3 py-2 text-center text-amber-300">{row.attack.total ? `${row.attack.efficiencyPct}%` : '—'}</td>
                  <td className="px-3 py-2 text-center text-emerald-300">{row.sideoutOpportunities ? `${row.sideoutPct}% (${row.sideoutWon}/${row.sideoutOpportunities})` : '—'}</td>
                  <td className="px-3 py-2 text-center text-purple-300">{row.breakPointOpportunities ? `${row.breakPointPct}% (${row.breakPointWon}/${row.breakPointOpportunities})` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          {dataVolleySummary.strongestRotation && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              Mejor side-out observado: R{dataVolleySummary.strongestRotation}
            </span>
          )}
          {dataVolleySummary.weakestRotation && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              Rotación a revisar: R{dataVolleySummary.weakestRotation}
            </span>
          )}
          {!dataVolleySummary.strongestRotation && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
              Se requieren al menos 2 recepciones por rotación para marcar fortalezas/debilidades.
            </span>
          )}
        </div>
      </div>

      {/* Insufficient data notification or Active Report Content */}
      {hasEnoughActionsForAdvancedAnalysis === false ? (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <p className="text-xs text-slate-400 font-medium">
            Datos insuficientes para generar un informe táctico avanzado.
          </p>
        </div>
      ) : (
        <>
          {/* RENDER ACTIVE REPORT CONTENT */}
          {selectedReport === 'ferraro_scout' && (
            <ReportFerraroAdversary
              match={match}
              teamSide={analyzedTeamSide}
              teamName={targetTeamName}
              players={targetPlayers}
              actions={filteredActions}
            />
          )}

          {selectedReport === 'setter_matrix' && (
            <ReportSetterDistribution
              match={match}
              teamSide={analyzedTeamSide}
              teamName={targetTeamName}
              players={targetPlayers}
              actions={filteredActions}
              rotationFilter={setterRotationFilter}
              setRotationFilter={setSetterRotationFilter}
              passQualityFilter={setterPassQualityFilter}
              setPassQualityFilter={setSetterPassQualityFilter}
            />
          )}

          {selectedReport === 'serve_pass_matrix' && (
            <ReportServePassSeams
              match={match}
              teamSide={analyzedTeamSide}
              teamName={targetTeamName}
              players={targetPlayers}
              actions={filteredActions}
            />
          )}

          {selectedReport === 'k1_k2_phases' && (
            <ReportK1K2Phases
              match={match}
              teamSide={analyzedTeamSide}
              teamName={targetTeamName}
              players={targetPlayers}
              actions={filteredActions}
            />
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// INFORME 1: ESTUDIO DEL ADVERSARIO (MÉTODO HERNÁN FERRARO - DATEARTE 2.0)
// ============================================================================
interface ReportFerraroAdversaryProps {
  match: MatchData;
  teamSide: TeamSide;
  teamName: string;
  players: any[];
  actions: ScoutCodeAction[];
}

const ReportFerraroAdversary: React.FC<ReportFerraroAdversaryProps> = ({
  match,
  teamSide,
  teamName,
  players,
  actions,
}) => {
  // Compute match fundamentals table exactly as Page 3 of the presentation
  // Saque, Recepción, Ataque Total, Atq después de Rec (K1), Transición (K2), Bloqueo, Defensa, Free ball, Levantada
  const fundamentalsData = useMemo(() => {
    // Real calculation based on actions for teamSide
    const teamActions = actions.filter((a) => a.team === teamSide);

    const calcSkillRow = (
      name: string,
      predicate: (a: ScoutCodeAction) => boolean,
    ) => {
      const subset = teamActions.filter(predicate);
      if (subset.length === 0) {
        return { name, tot: 0, err: 0, errP: 0, slash: 0, slashP: 0, neg: 0, negP: 0, excl: 0, exclP: 0, pos: 0, posP: 0, kill: 0, killP: 0, eff: 0 };
      }
      const tot = subset.length;
      const err = subset.filter((a) => a.evaluation === '=').length;
      const slash = subset.filter((a) => a.evaluation === '/').length;
      const neg = subset.filter((a) => a.evaluation === '-').length;
      const excl = subset.filter((a) => a.evaluation === '!').length;
      const pos = subset.filter((a) => a.evaluation === '+').length;
      const kill = subset.filter((a) => a.evaluation === '#').length;

      const eff = Math.round(((kill - err - slash) / (tot || 1)) * 100);

      return {
        name,
        tot,
        err,
        errP: Math.round((err / tot) * 100),
        slash,
        slashP: Math.round((slash / tot) * 100),
        neg,
        negP: Math.round((neg / tot) * 100),
        excl,
        exclP: Math.round((excl / tot) * 100),
        pos,
        posP: Math.round((pos / tot) * 100),
        kill,
        killP: Math.round((kill / tot) * 100),
        eff,
      };
    };

    return [
      calcSkillRow('Saque', (a) => a.skill === 'S'),
      calcSkillRow('Recepción', (a) => a.skill === 'R'),
      calcSkillRow('Ataque', (a) => a.skill === 'A'),
      calcSkillRow('Atq después de Rec (K1)', (a) => a.skill === 'A' && a.rawCode.includes('K1')),
      calcSkillRow('Transición (K2)', (a) => a.skill === 'A' && a.rawCode.includes('K2')),
      calcSkillRow('Bloqueo', (a) => a.skill === 'B'),
      calcSkillRow('Defensa', (a) => a.skill === 'D'),
      calcSkillRow('Free ball', (a) => a.skill === 'F'),
      calcSkillRow('Levantada', (a) => a.skill === 'E'),
    ];
  }, [actions, teamSide]);

  // Player breakdown built only from recorded actions.
  const playerStatsBreakdown = useMemo(() => {
    const teamActions = actions.filter((action) => action.team === teamSide);

    return players.map((player) => {
      const playerActions = teamActions.filter((action) => action.playerNum === player.number);
      const receptions = playerActions.filter((action) => action.skill === 'R');
      const attacks = playerActions.filter((action) => action.skill === 'A');
      const k1Attacks = attacks.filter((action) => action.rawCode.toUpperCase().includes('K1'));
      const k2Attacks = attacks.filter((action) => action.rawCode.toUpperCase().includes('K2'));

      const receptionPositive = receptions.filter(
        (action) => action.evaluation === '#' || action.evaluation === '+',
      ).length;
      const receptionPerfect = receptions.filter((action) => action.evaluation === '#').length;
      const receptionErrors = receptions.filter((action) => action.evaluation === '=').length;

      const attackSummary = (subset: ScoutCodeAction[]) => {
        const kills = subset.filter((action) => action.evaluation === '#').length;
        const errors = subset.filter((action) => action.evaluation === '=').length;
        const blocked = subset.filter((action) => action.evaluation === '/').length;
        return {
          total: subset.length,
          kills,
          errors,
          blocked,
          efficiency: subset.length
            ? Math.round(((kills - errors - blocked) / subset.length) * 100)
            : 0,
        };
      };

      return {
        id: player.id,
        number: player.number,
        name: player.name,
        position: player.position,
        reception: {
          total: receptions.length,
          errors: receptionErrors,
          positivePct: receptions.length ? Math.round((receptionPositive / receptions.length) * 100) : 0,
          perfectPct: receptions.length ? Math.round((receptionPerfect / receptions.length) * 100) : 0,
        },
        attack: attackSummary(attacks),
        attK1: attackSummary(k1Attacks),
        attK2: attackSummary(k2Attacks),
      };
    });
  }, [actions, players, teamSide]);

  return (
    <div className="space-y-6">
      {/* 1. Header Sheet Info Banner (Página 1 y 3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
            {teamName.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Informe de Preparación de Partido • Metodología Hernán Ferraro
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">
                {actions.length} acciones analizadas
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{teamName}</h2>
            <p className="text-xs text-slate-400">
              Torneo Oficial • Análisis Táctico Completo: Distribución de armador, K1 vs K2 y desglose de recepción.
            </p>
          </div>
        </div>

        {/* Starting 6 Rotation Diagram (Formación Base - Página 3) */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="text-[11px] font-bold text-slate-400">
            <div className="text-cyan-400 font-mono text-[10px]">FORMACIÓN BASE</div>
            Titulares en Cancha
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono font-black text-xs">
            <div className="bg-slate-800 text-amber-400 px-2 py-1 rounded">IV: #{players[3]?.number ?? '—'}</div>
            <div className="bg-slate-800 text-cyan-400 px-2 py-1 rounded">III: #{players[2]?.number ?? '—'}</div>
            <div className="bg-slate-800 text-rose-400 px-2 py-1 rounded">II: #{players[1]?.number ?? '—'}</div>
            <div className="bg-slate-800 text-slate-300 px-2 py-1 rounded">V: #{players[4]?.number ?? '—'}</div>
            <div className="bg-slate-800 text-slate-300 px-2 py-1 rounded">VI: #{players[5]?.number ?? '—'}</div>
            <div className="bg-slate-800 text-purple-400 px-2 py-1 rounded">I: #{players[0]?.number ?? '—'}</div>
          </div>
          <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 px-2 py-2 rounded text-[11px] font-bold text-center">
            L: #{players.find(p => p.position === 'L')?.number ?? '—'}
          </div>
        </div>
      </div>

      {/* 2. TABLA GLOBAL DE FUNDAMENTOS DEL RIVAL (Página 3 Exacta) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span>Fundamentos Globales del Equipo Analizado</span>
            </h3>
            <p className="text-xs text-slate-400">
              Efectividad neta (*E%), volumen total, errores, bolas negativas y puntos directos.
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"/> Error (=)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/> Negativa (-)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/> Positiva (+)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/> Punto (#)</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-mono">
                <th className="py-3 px-4 font-bold text-slate-200">Fundamento</th>
                <th className="py-3 px-3 text-center font-bold text-cyan-400">*E%</th>
                <th className="py-3 px-3 text-center font-bold">Tot</th>
                <th className="py-3 px-2 text-center text-rose-400 font-bold">=</th>
                <th className="py-3 px-2 text-center text-rose-400">%</th>
                <th className="py-3 px-2 text-center text-amber-400 font-bold">/</th>
                <th className="py-3 px-2 text-center text-amber-400">%</th>
                <th className="py-3 px-2 text-center text-slate-300 font-bold">-</th>
                <th className="py-3 px-2 text-center text-slate-300">%</th>
                <th className="py-3 px-2 text-center text-slate-400 font-bold">!</th>
                <th className="py-3 px-2 text-center text-slate-400">%</th>
                <th className="py-3 px-2 text-center text-blue-400 font-bold">+</th>
                <th className="py-3 px-2 text-center text-blue-400">%</th>
                <th className="py-3 px-2 text-center text-emerald-400 font-bold">#</th>
                <th className="py-3 px-3 text-center text-emerald-400 font-bold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {fundamentalsData.map((row, i) => (
                <tr 
                  key={row.name} 
                  className={`hover:bg-slate-800/40 transition ${
                    row.name.includes('Atq') || row.name.includes('Transición') 
                      ? 'bg-slate-950/40' 
                      : ''
                  }`}
                >
                  <td className="py-2.5 px-4 font-sans font-bold text-slate-200 flex items-center gap-2">
                    {row.name.includes('K1') && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono">Sideout</span>}
                    {row.name.includes('K2') && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-mono">Counter</span>}
                    <span>{row.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-black">
                    <span className={`px-2 py-0.5 rounded ${
                      row.eff >= 40 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : row.eff >= 20 
                          ? 'bg-blue-500/20 text-blue-400'
                          : row.eff >= 0 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {row.eff}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-100">{row.tot}</td>
                  <td className="py-2.5 px-2 text-center text-rose-400 font-bold">{row.err}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.errP}%</td>
                  <td className="py-2.5 px-2 text-center text-amber-400 font-bold">{row.slash}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.slashP}%</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.neg}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.negP}%</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.excl}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.exclP}%</td>
                  <td className="py-2.5 px-2 text-center text-blue-400 font-bold">{row.pos}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.posP}%</td>
                  <td className="py-2.5 px-2 text-center text-emerald-400 font-black">{row.kill}</td>
                  <td className="py-2.5 px-3 text-center font-black text-emerald-400">{row.killP}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. DESGLOSE POR JUGADOR - SOLO DATOS REALES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Recepción por jugador</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Total, error, positiva y perfecta calculados desde las recepciones registradas.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Receptor</th>
                  <th className="px-3 py-2 text-center">Tot</th>
                  <th className="px-3 py-2 text-center">Err</th>
                  <th className="px-3 py-2 text-center">Pos +%</th>
                  <th className="px-3 py-2 text-center">Perf #%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {playerStatsBreakdown
                  .filter((row) => row.reception.total > 0)
                  .map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-bold text-slate-200">#{row.number} {row.name}</td>
                      <td className="px-3 py-2 text-center text-slate-300">{row.reception.total}</td>
                      <td className="px-3 py-2 text-center text-rose-400">{row.reception.errors}</td>
                      <td className="px-3 py-2 text-center text-cyan-300">{row.reception.positivePct}%</td>
                      <td className="px-3 py-2 text-center text-emerald-300">{row.reception.perfectPct}%</td>
                    </tr>
                  ))}
                {playerStatsBreakdown.every((row) => row.reception.total === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No hay recepciones registradas para el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400">
            OPEN VOLEY todavía no registra de manera estructurada el tipo de saque recibido
            (flotante/potencia). Por eso no separa esa estadística hasta disponer de ese dato real.
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Ataque por jugador</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              El total y la eficiencia son reales. K1/K2 sólo aparecen cuando la acción fue etiquetada con esa fase.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Atacante</th>
                  <th className="px-3 py-2 text-center">Tot</th>
                  <th className="px-3 py-2 text-center">Pts</th>
                  <th className="px-3 py-2 text-center">E%</th>
                  <th className="px-3 py-2 text-center">K1 E%</th>
                  <th className="px-3 py-2 text-center">K2 E%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {playerStatsBreakdown
                  .filter((row) => row.attack.total > 0)
                  .map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-bold text-slate-200">#{row.number} {row.name}</td>
                      <td className="px-3 py-2 text-center text-slate-300">{row.attack.total}</td>
                      <td className="px-3 py-2 text-center text-emerald-300">{row.attack.kills}</td>
                      <td className="px-3 py-2 text-center text-amber-300">{row.attack.efficiency}%</td>
                      <td className="px-3 py-2 text-center text-cyan-300">
                        {row.attK1.total ? `${row.attK1.efficiency}% (${row.attK1.total})` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center text-purple-300">
                        {row.attK2.total ? `${row.attK2.efficiency}% (${row.attK2.total})` : '—'}
                      </td>
                    </tr>
                  ))}
                {playerStatsBreakdown.every((row) => row.attack.total === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No hay ataques registrados para el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. DISPONIBILIDAD DEL ANÁLISIS DEL ARMADOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <Compass className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-black text-white">Distribución del armador: criterio de muestra</h3>
            <p className="text-xs text-slate-400 mt-1">
              Las tendencias por zona, rotación y calidad de pase se muestran en la pestaña “Distribución del Armador”.
              Si faltan acciones de colocación o contexto suficiente, OPEN VOLEY informa “sin muestra suficiente” en lugar
              de completar la lectura con porcentajes estimados.
            </p>
          </div>
        </div>
      </div>

      {/* 5. CRITERIO PARA EL PLAN DE PARTIDO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>Plan de Partido basado en evidencia</span>
        </h3>
        <p className="text-xs text-slate-400">
          OPEN VOLEY no genera instrucciones tácticas fijas. El DT puede construirlas a partir de la rotación con menor
          side-out, los receptores con peor rendimiento observado, el atacante con mayor volumen y la distribución real
          del armador. Cuando una muestra no alcanza, la interfaz lo indica expresamente.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// INFORME 2: MATRIZ DE DISTRIBUCIÓN DE ARMADO (DATA VOLLEY & VOLLEYSTATION)
// ============================================================================
interface ReportSetterDistributionProps {
  match: MatchData;
  teamSide: TeamSide;
  teamName: string;
  players: any[];
  actions: ScoutCodeAction[];
  rotationFilter: number;
  setRotationFilter: (rot: number) => void;
  passQualityFilter: 'all' | 'positive' | 'negative';
  setPassQualityFilter: (filter: 'all' | 'positive' | 'negative') => void;
}

const ReportSetterDistribution: React.FC<ReportSetterDistributionProps> = ({
  match,
  teamSide,
  teamName,
  players,
  actions,
  rotationFilter,
  setRotationFilter,
  passQualityFilter,
  setPassQualityFilter,
}) => {
  const setter = players.find((player) => player.position === 'S' && player.starter)
    ?? players.find((player) => player.position === 'S');

  const rotationForAction = (action: ScoutCodeAction): number => {
    if (!setter) return 0;
    const rotation = teamSide === 'home' ? action.rotationHome : action.rotationAway;
    if (!Array.isArray(rotation) || rotation.length < 6) return 0;
    const index = rotation.indexOf(setter.number);
    return index >= 0 ? index + 1 : 0;
  };

  const passQualityForSetting = (setting: ScoutCodeAction): 'positive' | 'negative' | 'unknown' => {
    const previous = [...actions]
      .filter((action) =>
        action.team === teamSide &&
        action.setNumber === setting.setNumber &&
        action.timestamp <= setting.timestamp &&
        setting.timestamp - action.timestamp <= 12 &&
        action.skill === 'R',
      )
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!previous) return 'unknown';
    if (previous.evaluation === '#' || previous.evaluation === '+') return 'positive';
    if (previous.evaluation === '!' || previous.evaluation === '-' || previous.evaluation === '/' || previous.evaluation === '=') return 'negative';
    return 'unknown';
  };

  const setterData = useMemo(() => {
    const settings = actions.filter((action) => {
      if (action.team !== teamSide || action.skill !== 'E') return false;
      if (setter && action.playerNum !== setter.number) return false;
      if (rotationFilter > 0 && rotationForAction(action) !== rotationFilter) return false;
      if (passQualityFilter !== 'all' && passQualityForSetting(action) !== passQualityFilter) return false;
      return true;
    });

    const byZone = new Map<number, number>();
    settings.forEach((action) => {
      const zone = action.endZone;
      if (zone && zone >= 1 && zone <= 9) {
        byZone.set(zone, (byZone.get(zone) || 0) + 1);
      }
    });

    const totalWithZone = [...byZone.values()].reduce((sum, value) => sum + value, 0);
    const zonePct = (zone: number) => totalWithZone > 0
      ? Math.round(((byZone.get(zone) || 0) / totalWithZone) * 100)
      : 0;

    return {
      totalSets: settings.length,
      totalWithZone,
      byZone,
      p4: zonePct(4),
      p3: zonePct(3),
      p2: zonePct(2),
      pipe: zonePct(6),
      p1: zonePct(1),
      unknown: settings.length - totalWithZone,
    };
  }, [actions, teamSide, setter, rotationFilter, passQualityFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Distribución real del armador
              </span>
              <span className="text-xs text-slate-400">Equipo: <strong>{teamName}</strong></span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">Matriz de Distribución por Rotación</h3>
            <p className="text-xs text-slate-400">
              Usa acciones de colocación (E) con zona destino. Si no se registra la zona del armado, no se estima.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Rotación:</span>
            {[0, 1, 2, 3, 4, 5, 6].map((rot) => (
              <button
                key={rot}
                onClick={() => setRotationFilter(rot)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  rotationFilter === rot ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {rot === 0 ? 'Todas' : `R${rot}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-300">Calidad de recepción previa:</span>
          {[
            { id: 'all' as const, label: 'Todas' },
            { id: 'positive' as const, label: 'Positiva / Perfecta' },
            { id: 'negative' as const, label: 'Fuera de sistema' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPassQualityFilter(item.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                passQualityFilter === item.id ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              Salidas registradas
            </h4>
            <span className="text-xs font-mono text-purple-300">
              {setterData.totalSets} armados • {setterData.totalWithZone} con zona
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { zone: 4, label: 'Zona 4', pct: setterData.p4 },
              { zone: 3, label: 'Zona 3', pct: setterData.p3 },
              { zone: 2, label: 'Zona 2', pct: setterData.p2 },
              { zone: 6, label: 'Pipe / Z6', pct: setterData.pipe },
              { zone: 1, label: 'Zona 1', pct: setterData.p1 },
            ].map((item) => (
              <div key={item.zone} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">{item.label}</div>
                <div className="text-2xl font-black text-white mt-1">
                  {setterData.totalWithZone ? `${item.pct}%` : '—'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {setterData.byZone.get(item.zone) || 0} armados
                </div>
              </div>
            ))}
          </div>

          {setterData.totalSets === 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              Sin acciones de colocación suficientes para este filtro. No se muestran porcentajes simulados.
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <h4 className="text-sm font-black text-white">Calidad de la muestra</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Armador</span><span className="text-white font-bold">{setter ? `#${setter.number} ${setter.name}` : 'No identificado'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Armados</span><span className="text-white font-bold">{setterData.totalSets}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Con zona destino</span><span className="text-white font-bold">{setterData.totalWithZone}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Sin zona</span><span className="text-white font-bold">{setterData.unknown}</span></div>
          </div>
          <p className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            El kill rate por salida no se calcula aquí porque el modelo actual no enlaza de forma inequívoca cada armado con el ataque siguiente.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INFORME 3: MATRIZ DE SAQUE VS RECEPCIÓN & ZONAS
// ============================================================================
interface ReportServePassSeamsProps {
  match: MatchData;
  teamSide: TeamSide;
  teamName: string;
  players: any[];
  actions: ScoutCodeAction[];
}

const ReportServePassSeams: React.FC<ReportServePassSeamsProps> = ({
  match,
  teamSide,
  teamName,
  players,
  actions,
}) => {
  const zoneStats = useMemo(() => {
    const receptions = actions.filter((action) => action.team === teamSide && action.skill === 'R');
    return [1, 2, 3, 4, 5, 6].map((zone) => {
      const subset = receptions.filter((action) => action.startZone === zone || action.endZone === zone);
      const errors = subset.filter((action) => action.evaluation === '=').length;
      const negative = subset.filter((action) => ['=', '/', '-', '!'].includes(action.evaluation)).length;
      const positive = subset.filter((action) => action.evaluation === '+' || action.evaluation === '#').length;
      const perfect = subset.filter((action) => action.evaluation === '#').length;
      return {
        zone,
        total: subset.length,
        errors,
        negativePct: subset.length ? Math.round((negative / subset.length) * 100) : 0,
        positivePct: subset.length ? Math.round((positive / subset.length) * 100) : 0,
        perfectPct: subset.length ? Math.round((perfect / subset.length) * 100) : 0,
      };
    });
  }, [actions, teamSide]);

  const receptionsByPlayer = useMemo(() => {
    return players.map((player) => {
      const subset = actions.filter(
        (action) => action.team === teamSide && action.skill === 'R' && action.playerNum === player.number,
      );
      const errors = subset.filter((action) => action.evaluation === '=').length;
      const positive = subset.filter((action) => action.evaluation === '+' || action.evaluation === '#').length;
      const perfect = subset.filter((action) => action.evaluation === '#').length;
      return {
        number: player.number,
        name: player.name,
        total: subset.length,
        errors,
        positivePct: subset.length ? Math.round((positive / subset.length) * 100) : 0,
        perfectPct: subset.length ? Math.round((perfect / subset.length) * 100) : 0,
      };
    }).filter((row) => row.total > 0);
  }, [actions, players, teamSide]);

  const targetZone = [...zoneStats].filter((row) => row.total >= 2).sort((a, b) => b.negativePct - a.negativePct)[0];

  const serveReceptionMatrix = useMemo(() => {
    const serveTypes: Array<NonNullable<ScoutCodeAction['serveType']>> = ['float', 'jump_float', 'jump_spin', 'standing'];
    const rows = serveTypes.flatMap((serveType) =>
      [1, 2, 3, 4, 5, 6].map((zone) => {
        const serves = actions.filter(
          (action) =>
            action.team !== teamSide &&
            action.skill === 'S' &&
            action.serveType === serveType &&
            action.endZone === zone &&
            action.rallyId,
        );

        const receptions = serves.flatMap((serve) =>
          actions.filter(
            (action) =>
              action.team === teamSide &&
              action.skill === 'R' &&
              action.rallyId === serve.rallyId,
          ),
        );

        const errors = receptions.filter((action) => action.evaluation === '=').length;
        const negative = receptions.filter((action) =>
          action.receptionContext === 'negative' || ['=', '/', '-', '!'].includes(action.evaluation),
        ).length;
        const positive = receptions.filter((action) =>
          action.receptionContext === 'positive' || action.evaluation === '+' || action.evaluation === '#',
        ).length;

        return {
          serveType,
          zone,
          total: receptions.length,
          errors,
          negativePct: receptions.length ? Math.round((negative / receptions.length) * 100) : 0,
          positivePct: receptions.length ? Math.round((positive / receptions.length) * 100) : 0,
        };
      }),
    );

    return rows.filter((row) => row.total > 0);
  }, [actions, teamSide]);

  const serveTypeLabel: Record<NonNullable<ScoutCodeAction['serveType']>, string> = {
    float: 'Flotante',
    jump_float: 'Jump Float',
    jump_spin: 'Potencia',
    standing: 'De pie',
    unknown: 'Desconocido',
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Recepción por zona
          </span>
          <span className="text-xs text-slate-400">Equipo receptor: <strong>{teamName}</strong></span>
        </div>
        <h3 className="text-xl font-black text-white mt-2">Mapa real de Recepción & Zonas Target</h3>
        <p className="text-xs text-slate-400 mt-1">
          Se calcula desde la zona registrada en cada recepción. No se infieren costuras ni tipo de saque si esos datos no fueron capturados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white">Recepción por zona</h4>
            <span className="text-[11px] text-slate-400">
              {targetZone ? `Zona a revisar: Z${targetZone.zone}` : 'Sin muestra suficiente'}
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Zona</th>
                  <th className="px-3 py-2 text-center">Tot</th>
                  <th className="px-3 py-2 text-center">Err</th>
                  <th className="px-3 py-2 text-center">Neg %</th>
                  <th className="px-3 py-2 text-center">Pos +%</th>
                  <th className="px-3 py-2 text-center">Perf #%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {zoneStats.map((row) => (
                  <tr key={row.zone}>
                    <td className="px-3 py-2 font-black text-white">Z{row.zone}</td>
                    <td className="px-3 py-2 text-center text-slate-300">{row.total}</td>
                    <td className="px-3 py-2 text-center text-rose-400">{row.errors}</td>
                    <td className="px-3 py-2 text-center text-amber-300">{row.total ? `${row.negativePct}%` : '—'}</td>
                    <td className="px-3 py-2 text-center text-cyan-300">{row.total ? `${row.positivePct}%` : '—'}</td>
                    <td className="px-3 py-2 text-center text-emerald-300">{row.total ? `${row.perfectPct}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <h4 className="text-sm font-black text-white">Receptores</h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Jugador</th>
                  <th className="px-3 py-2 text-center">Tot</th>
                  <th className="px-3 py-2 text-center">Err</th>
                  <th className="px-3 py-2 text-center">Pos +%</th>
                  <th className="px-3 py-2 text-center">Perf #%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {receptionsByPlayer.map((row) => (
                  <tr key={row.number}>
                    <td className="px-3 py-2 font-bold text-white">#{row.number} {row.name}</td>
                    <td className="px-3 py-2 text-center text-slate-300">{row.total}</td>
                    <td className="px-3 py-2 text-center text-rose-400">{row.errors}</td>
                    <td className="px-3 py-2 text-center text-cyan-300">{row.positivePct}%</td>
                    <td className="px-3 py-2 text-center text-emerald-300">{row.perfectPct}%</td>
                  </tr>
                ))}
                {receptionsByPlayer.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Sin recepciones registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">
            Las costuras entre dos receptores todavía requieren una captura específica. OPEN VOLEY no las infiere.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-white">Tipo de saque × zona × recepción</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Cruce exacto por rally entre el saque rival etiquetado y la recepción posterior.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-300">
            {serveReceptionMatrix.reduce((sum, row) => sum + row.total, 0)} recepciones vinculadas
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Saque</th>
                <th className="px-3 py-2 text-center">Destino</th>
                <th className="px-3 py-2 text-center">Rec</th>
                <th className="px-3 py-2 text-center">Err</th>
                <th className="px-3 py-2 text-center">Neg %</th>
                <th className="px-3 py-2 text-center">Pos +%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {serveReceptionMatrix.map((row) => (
                <tr key={`${row.serveType}-${row.zone}`}>
                  <td className="px-3 py-2 font-bold text-white">{serveTypeLabel[row.serveType]}</td>
                  <td className="px-3 py-2 text-center font-black text-amber-300">Z{row.zone}</td>
                  <td className="px-3 py-2 text-center text-slate-300">{row.total}</td>
                  <td className="px-3 py-2 text-center text-rose-400">{row.errors}</td>
                  <td className="px-3 py-2 text-center text-amber-300">{row.negativePct}%</td>
                  <td className="px-3 py-2 text-center text-cyan-300">{row.positivePct}%</td>
                </tr>
              ))}
              {serveReceptionMatrix.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Sin rallies con tipo de saque + zona destino + recepción vinculados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INFORME 4: FASES K1 / K2 DESDE ACCIONES REALES
// ============================================================================
interface ReportK1K2PhasesProps {
  match: MatchData;
  teamSide: TeamSide;
  teamName: string;
  players: any[];
  actions: ScoutCodeAction[];
}

const ReportK1K2Phases: React.FC<ReportK1K2PhasesProps> = ({
  match,
  teamSide,
  teamName,
  actions,
}) => {
  const filteredMatch = useMemo<MatchData>(() => ({ ...match, actions }), [match, actions]);
  const summary = useMemo(() => calculateTeamDataVolleySummary(filteredMatch, teamSide), [filteredMatch, teamSide]);

  const sideoutTotals = summary.rotations.reduce(
    (acc, row) => ({ won: acc.won + row.sideoutWon, opp: acc.opp + row.sideoutOpportunities }),
    { won: 0, opp: 0 },
  );
  const breakpointTotals = summary.rotations.reduce(
    (acc, row) => ({ won: acc.won + row.breakPointWon, opp: acc.opp + row.breakPointOpportunities }),
    { won: 0, opp: 0 },
  );

  const sideoutPct = sideoutTotals.opp ? Math.round((sideoutTotals.won / sideoutTotals.opp) * 100) : 0;
  const breakpointPct = breakpointTotals.opp ? Math.round((breakpointTotals.won / breakpointTotals.opp) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            K1 / K2 observado
          </span>
          <span className="text-xs text-slate-400">Equipo: <strong>{teamName}</strong></span>
        </div>
        <h3 className="text-xl font-black text-white mt-2">Side-out y Break Point por Rotación</h3>
        <p className="text-xs text-slate-400 mt-1">
          Se detectan secuencias observadas a partir de recepción o saque y acciones posteriores. No se aplican benchmarks ni porcentajes prefijados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-cyan-400 font-bold uppercase">Side-out K1</div>
          <div className="text-3xl font-black text-white mt-1">{sideoutTotals.opp ? `${sideoutPct}%` : '—'}</div>
          <div className="text-[11px] text-slate-400">{sideoutTotals.won}/{sideoutTotals.opp} oportunidades</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-purple-400 font-bold uppercase">Break Point K2</div>
          <div className="text-3xl font-black text-white mt-1">{breakpointTotals.opp ? `${breakpointPct}%` : '—'}</div>
          <div className="text-[11px] text-slate-400">{breakpointTotals.won}/{breakpointTotals.opp} oportunidades</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-amber-400 font-bold uppercase">Ataque E%</div>
          <div className="text-3xl font-black text-white mt-1">{summary.attack.total ? `${summary.attack.efficiencyPct}%` : '—'}</div>
          <div className="text-[11px] text-slate-400">{summary.attack.total} ataques</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 font-bold uppercase">Balance directo</div>
          <div className="text-3xl font-black text-white mt-1">{summary.sampleSize ? (summary.gainLoss > 0 ? `+${summary.gainLoss}` : summary.gainLoss) : '—'}</div>
          <div className="text-[11px] text-slate-400">puntos directos - errores directos</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <h4 className="text-base font-black text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          Rotaciones R1–R6
        </h4>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Rotación</th>
                <th className="px-3 py-2 text-center">Rec</th>
                <th className="px-3 py-2 text-center">K1 ganado</th>
                <th className="px-3 py-2 text-center">Side-out %</th>
                <th className="px-3 py-2 text-center">Saque</th>
                <th className="px-3 py-2 text-center">K2 ganado</th>
                <th className="px-3 py-2 text-center">Break Point %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {summary.rotations.map((row) => (
                <tr key={row.rotation}>
                  <td className="px-3 py-2 font-black text-white">R{row.rotation}</td>
                  <td className="px-3 py-2 text-center text-slate-300">{row.sideoutOpportunities}</td>
                  <td className="px-3 py-2 text-center text-emerald-300">{row.sideoutWon}</td>
                  <td className="px-3 py-2 text-center text-cyan-300">{row.sideoutOpportunities ? `${row.sideoutPct}%` : '—'}</td>
                  <td className="px-3 py-2 text-center text-slate-300">{row.breakPointOpportunities}</td>
                  <td className="px-3 py-2 text-center text-emerald-300">{row.breakPointWon}</td>
                  <td className="px-3 py-2 text-center text-purple-300">{row.breakPointOpportunities ? `${row.breakPointPct}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Estas métricas son observacionales. Para una clasificación táctica más precisa del rally completo será conveniente incorporar un identificador de rally en el modelo de scouting.
        </p>
      </div>
    </div>
  );
};
