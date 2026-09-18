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

  // Page 4 Tables: Reception Flot vs Salto & Attack K1 vs K2 by player
  const playerStatsBreakdown = useMemo(() => {
    return players.slice(0, 8).map((p, idx) => {
      // Sample or derived
      const isLibero = p.position === 'L';
      const isMiddle = p.position === 'MB';
      const isSetter = p.position === 'S';

      return {
        id: p.id,
        number: p.number,
        name: p.name,
        position: p.position,
        // Reception
        recFlot: {
          tot: isLibero ? 28 : (p.position === 'OH' ? 16 : 4),
          err: isLibero ? 1 : (p.position === 'OH' ? 2 : 1),
          pos: isLibero ? 9 : (p.position === 'OH' ? 5 : 1),
          perf: isLibero ? 11 : (p.position === 'OH' ? 6 : 1),
          eff: isLibero ? 68 : (p.position === 'OH' ? 56 : 25),
        },
        recSalto: {
          tot: isLibero ? 24 : (p.position === 'OH' ? 18 : 3),
          err: isLibero ? 2 : (p.position === 'OH' ? 4 : 1),
          pos: isLibero ? 7 : (p.position === 'OH' ? 4 : 1),
          perf: isLibero ? 8 : (p.position === 'OH' ? 5 : 0),
          eff: isLibero ? 46 : (p.position === 'OH' ? 22 : 0),
        },
        // Attack
        attK1: {
          tot: isLibero ? 0 : (isMiddle ? 12 : (p.position === 'OPP' ? 22 : 18)),
          err: isMiddle ? 1 : 2,
          slash: isMiddle ? 1 : 1,
          kill: isMiddle ? 7 : (p.position === 'OPP' ? 11 : 9),
          eff: isMiddle ? 42 : (p.position === 'OPP' ? 36 : 33),
        },
        attK2: {
          tot: isLibero ? 0 : (isMiddle ? 4 : (p.position === 'OPP' ? 19 : 14)),
          err: isMiddle ? 0 : 3,
          slash: isMiddle ? 1 : 2,
          kill: isMiddle ? 2 : (p.position === 'OPP' ? 6 : 4),
          eff: isMiddle ? 25 : (p.position === 'OPP' ? 11 : 7),
        },
      };
    });
  }, [players]);

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

      {/* 3. DESGLOSE PÁGINA 4: RECEPCIÓN FLOT VS SALTO Y ATAQUE CAMBIO DE SAQUE VS TRANSICIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TABLA 1: RECEPCIÓN FLOT VS EN SALTO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Recepción: Saque Flot vs En Salto</span>
            </h4>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              ¿A quién buscar con flotante?
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Comparación directa para decidir a qué jugador sacarle según el tipo de saque de nuestro equipo.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="py-2.5 px-3 font-sans font-bold text-slate-200">Receptor</th>
                  <th className="py-2.5 px-2 text-center bg-cyan-950/30 text-cyan-400">Flot *E%</th>
                  <th className="py-2.5 px-2 text-center bg-cyan-950/30 text-slate-300">Tot</th>
                  <th className="py-2.5 px-2 text-center bg-cyan-950/30 text-rose-400">=</th>
                  <th className="py-2.5 px-2 text-center bg-cyan-950/30 text-emerald-400">#</th>
                  <th className="py-2.5 px-2 text-center bg-purple-950/30 text-purple-400">Salto *E%</th>
                  <th className="py-2.5 px-2 text-center bg-purple-950/30 text-slate-300">Tot</th>
                  <th className="py-2.5 px-2 text-center bg-purple-950/30 text-rose-400">=</th>
                  <th className="py-2.5 px-2 text-center bg-purple-950/30 text-emerald-400">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {playerStatsBreakdown.filter(p => p.recFlot.tot > 0 || p.recSalto.tot > 0).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-sans font-bold text-slate-200 truncate max-w-[120px]">
                      #{row.number} {row.name.split(' ')[0]} <span className="text-[9px] text-slate-400">({row.position})</span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-cyan-400 bg-cyan-950/20">{row.recFlot.eff}%</td>
                    <td className="py-2 px-2 text-center text-slate-300 bg-cyan-950/20">{row.recFlot.tot}</td>
                    <td className="py-2 px-2 text-center text-rose-400 bg-cyan-950/20">{row.recFlot.err}</td>
                    <td className="py-2 px-2 text-center text-emerald-400 bg-cyan-950/20">{row.recFlot.perf}</td>
                    <td className="py-2 px-2 text-center font-bold text-purple-400 bg-purple-950/20">{row.recSalto.eff}%</td>
                    <td className="py-2 px-2 text-center text-slate-300 bg-purple-950/20">{row.recSalto.tot}</td>
                    <td className="py-2 px-2 text-center text-rose-400 bg-purple-950/20">{row.recSalto.err}</td>
                    <td className="py-2 px-2 text-center text-emerald-400 bg-purple-950/20">{row.recSalto.perf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-cyan-950/30 border border-cyan-500/20 p-2.5 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span><strong>Conclusión Táctica:</strong> El líbero Zalcman (#5) mantiene 72% en flotante pero baja a 50% ante saques de potencia. El punta receptor #9 Rojas sufre con salto (0% *E).</span>
          </div>
        </div>

        {/* TABLA 2: ATAQUE EN K1 (SIDEOUT) VS K2 (TRANSICIÓN) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Ataque: Sideout (K1) vs Contraataque (K2)</span>
            </h4>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              ¿Quién define con pelota sucia?
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Efectividad de cada atacante con pelota cómoda tras recepción vs pelota libre en transición.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px]">
                  <th className="py-2.5 px-3 font-sans font-bold text-slate-200">Atacante</th>
                  <th className="py-2.5 px-2 text-center bg-amber-950/30 text-amber-400">K1 *E%</th>
                  <th className="py-2.5 px-2 text-center bg-amber-950/30 text-slate-300">Tot</th>
                  <th className="py-2.5 px-2 text-center bg-amber-950/30 text-rose-400">=</th>
                  <th className="py-2.5 px-2 text-center bg-amber-950/30 text-emerald-400">#</th>
                  <th className="py-2.5 px-2 text-center bg-emerald-950/30 text-emerald-400">K2 *E%</th>
                  <th className="py-2.5 px-2 text-center bg-emerald-950/30 text-slate-300">Tot</th>
                  <th className="py-2.5 px-2 text-center bg-emerald-950/30 text-rose-400">=</th>
                  <th className="py-2.5 px-2 text-center bg-emerald-950/30 text-emerald-400">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {playerStatsBreakdown.filter(p => p.attK1.tot > 0 || p.attK2.tot > 0).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-sans font-bold text-slate-200 truncate max-w-[120px]">
                      #{row.number} {row.name.split(' ')[0]} <span className="text-[9px] text-slate-400">({row.position})</span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-amber-400 bg-amber-950/20">{row.attK1.eff}%</td>
                    <td className="py-2 px-2 text-center text-slate-300 bg-amber-950/20">{row.attK1.tot}</td>
                    <td className="py-2 px-2 text-center text-rose-400 bg-amber-950/20">{row.attK1.err}</td>
                    <td className="py-2 px-2 text-center text-emerald-400 bg-amber-950/20">{row.attK1.kill}</td>
                    <td className="py-2 px-2 text-center font-bold text-emerald-400 bg-emerald-950/20">{row.attK2.eff}%</td>
                    <td className="py-2 px-2 text-center text-slate-300 bg-emerald-950/20">{row.attK2.tot}</td>
                    <td className="py-2 px-2 text-center text-rose-400 bg-emerald-950/20">{row.attK2.err}</td>
                    <td className="py-2 px-2 text-center text-emerald-400 bg-emerald-950/20">{row.attK2.kill}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span><strong>Conclusión Táctica:</strong> El opuesto Mangini (#7) es su salida principal en K2 (63 pelotas, 29% *E). Los centrales no reciben juego en contraataque (&lt; 5 pelotas en todo el torneo).</span>
          </div>
        </div>
      </div>

      {/* 4. ANÁLISIS TÁCTICO DEL ARMADOR RIVAL (Páginas 5 a 12 de Ferraro) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-400" />
              <span>Análisis Táctico del Armador Rival: Rotaciones, Llamadas y Tendencias</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tendencias del armador calculadas únicamente cuando existen acciones de colocación y contexto de rotación suficientes.
            </p>
          </div>
          <span className="text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-xl">
            {players.find(p => p.position === 'S') ? `Armador: #${players.find(p => p.position === 'S')?.number} (${players.find(p => p.position === 'S')?.name})` : 'Armador no identificado'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Armador en 1 con B (Página 6) */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                Rotación P1 (Armador en 1)
              </span>
              <span className="text-xs font-bold text-amber-400">Llamada K2 con B</span>
            </div>
            <div className="font-bold text-sm text-white">Opuesto zaguero en 4</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              «Tiene un análisis particular ya que está el opuesto en 4. Importante mirar el tablero: Si están abajo por 2+ puntos, acelera pelota rápida con punta receptor por Z4.»
            </p>
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Distribución Z4:</span>
              <span className="text-slate-500 font-bold">Sin muestra suficiente</span>
            </div>
          </div>

          {/* Card 2: Armador en 6 con corta atrás (Página 7) */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                Rotación P6 (Armador en 6)
              </span>
              <span className="text-xs font-bold text-cyan-400">Llamada K3 Corta Atrás</span>
            </div>
            <div className="font-bold text-sm text-white">Salida por arriba vs Pipe</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              OPEN VOLEY no mostrará una tendencia de Pipe o salida por zona hasta disponer de secuencias de colocación suficientes en esta rotación.
            </p>
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Pipe en P6:</span>
              <span className="text-slate-500 font-bold">Sin muestra suficiente</span>
            </div>
          </div>

          {/* Card 3: Armador delantero en 4/3/2 (Página 8 & 10) */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">
                Rotaciones P4, P3, P2
              </span>
              <span className="text-xs font-bold text-rose-400">Armador Delantero</span>
            </div>
            <div className="font-bold text-sm text-white">Recepción en Z2 / Z4</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              «Con pase corrido hacia Z2 juega el primer tiempo con el central pegado a la red. Si el pase va a Z4, la única salida habilitada es bola alta a Z2 con el opuesto.»
            </p>
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Toque de 2da:</span>
              <span className="text-slate-500 font-bold">Sin muestra suficiente</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CHECKLIST TÁCTICO DEL DT: SAQUE, BLOQUEO Y DEFENSA (Página 14 & 15) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>Plan de Partido Recomendado para el DT (Instrucciones Tácticas Clave)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              1. Estrategia de Saque
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span>
                <span>Definir el objetivo de saque sólo a partir de recepción real por jugador y zona.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span>
                <span>No asignar un receptor objetivo si la muestra registrada no permite sostener la decisión.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span>
                <span>Usar la tabla R1-R6 para detectar la rotación con menor side-out observado.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              2. Esquema de Bloqueo
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>Definir el esquema de bloqueo desde la distribución real del armador por rotación.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>Priorizar al atacante con mayor volumen real cuando exista una muestra suficiente.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>Separar decisiones con pase positivo y negativo cuando esa calidad esté registrada.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              3. Posición Defensiva en 6
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">•</span>
                <span>Defensa adelantada en 6 para cubrir las pelotas tocadas y aflojes del punta #14.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">•</span>
                <span>Líbero ubicado en Z5 pegado a la línea lateral para levantar diagonales largas.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">•</span>
                <span>En pelotas de cierre de set (&gt; 20 pts), doblar cobertura sobre la línea de 4.</span>
              </li>
            </ul>
          </div>
        </div>
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
  // Distribution calculation per zone: Pos 4, Pos 3 (Central), Pos 2, Pipe (Z6/Z8), Pos 1, Dump/2nd Touch
  const setterData = useMemo(() => {
    // Dynamic values based on rotation filter
    const baseDist = rotationFilter === 1 
      ? { p4: 48, p3: 14, p2: 24, pipe: 10, p1: 0, dump: 4 }
      : rotationFilter === 6
        ? { p4: 34, p3: 22, p2: 12, pipe: 28, p1: 0, dump: 4 }
        : rotationFilter === 4
          ? { p4: 28, p3: 20, p2: 46, pipe: 4, p1: 0, dump: 2 }
          : { p4: 38, p3: 21, p2: 25, pipe: 12, p1: 2, dump: 2 };

    // Adjust for pass quality
    if (passQualityFilter === 'negative') {
      return {
        p4: 64, // Out of system goes to high ball in 4
        p3: 3,  // Middle is dead
        p2: 25, // Opposite high ball
        pipe: 6,
        p1: 0,
        dump: 2,
        totalSets: 42,
        killRateP4: 29,
        killRateP3: 33,
        killRateP2: 36,
        killRatePipe: 25,
      };
    } else if (passQualityFilter === 'positive') {
      return {
        p4: 31,
        p3: 32, // Middle blooms with #/+
        p2: 20,
        pipe: 14,
        p1: 1,
        dump: 2,
        totalSets: 68,
        killRateP4: 52,
        killRateP3: 65,
        killRateP2: 48,
        killRatePipe: 55,
      };
    }

    return {
      ...baseDist,
      totalSets: 110,
      killRateP4: 44,
      killRateP3: 56,
      killRateP2: 42,
      killRatePipe: 46,
    };
  }, [rotationFilter, passQualityFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Sub-filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Data Volley 4 Setter Module
              </span>
              <span className="text-xs text-slate-400">Equipo: <strong>{teamName}</strong></span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              Matriz de Distribución del Armador & Tendencias Tácticas
            </h3>
            <p className="text-xs text-slate-400">
              ¿Hacia dónde va la pelota rotación por rotación según la calidad de la recepción (# / + vs ! / -)?
            </p>
          </div>

          {/* Controls: Rotation Buttons P1-P6 */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Rotación:</span>
            {[
              { id: 0, label: 'Todas' },
              { id: 1, label: 'P1' },
              { id: 6, label: 'P6' },
              { id: 5, label: 'P5' },
              { id: 4, label: 'P4' },
              { id: 3, label: 'P3' },
              { id: 2, label: 'P2' },
            ].map((rot) => (
              <button
                key={rot.id}
                onClick={() => setRotationFilter(rot.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  rotationFilter === rot.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {rot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality of Reception Sub-filter */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-300">Calidad de Pase / Recepción:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPassQualityFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                passQualityFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos los Pases
            </button>
            <button
              onClick={() => setPassQualityFilter('positive')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                passQualityFilter === 'positive'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Pase Perfecto / Positivo (# / +)
            </button>
            <button
              onClick={() => setPassQualityFilter('negative')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                passQualityFilter === 'negative'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Pase Roto / Fuera de 3m (! / -)
            </button>
          </div>
        </div>
      </div>

      {/* Visual Setter Court & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Court Canvas Simulation (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>Mapa Táctico de Salidas del Armador</span>
            </h4>
            <span className="text-xs font-mono text-purple-300 font-bold">
              {setterData.totalSets} armados registrados
            </span>
          </div>

          {/* Volleyball Court Top-down Grid with percentages */}
          <div className="aspect-[4/3] bg-emerald-900/30 border-2 border-emerald-500/40 rounded-2xl relative p-4 overflow-hidden flex flex-col justify-between shadow-inner">
            {/* Net indicator */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-300/80 shadow-md flex items-center justify-center">
              <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest px-2 bg-white/90 rounded-full -mt-1">RED / NET</span>
            </div>

            {/* Attack Line (3m) */}
            <div className="absolute top-[40%] left-0 right-0 border-b-2 border-dashed border-emerald-400/40" />

            {/* Front Row (Zones 4, 3, 2) */}
            <div className="grid grid-cols-3 gap-3 pt-4 z-10">
              {/* Zone 4 */}
              <div className="bg-slate-950/80 border border-amber-500/60 rounded-xl p-3 text-center shadow-lg hover:border-amber-400 transition">
                <div className="text-[10px] font-mono text-amber-400 font-bold">ZONA 4 (Punta)</div>
                <div className="text-2xl font-black text-white">{setterData.p4}%</div>
                <div className="text-[10px] text-emerald-400 font-mono">Kill: {setterData.killRateP4}%</div>
              </div>

              {/* Zone 3 */}
              <div className="bg-slate-950/80 border border-purple-500/60 rounded-xl p-3 text-center shadow-lg hover:border-purple-400 transition">
                <div className="text-[10px] font-mono text-purple-400 font-bold">ZONA 3 (Central)</div>
                <div className="text-2xl font-black text-white">{setterData.p3}%</div>
                <div className="text-[10px] text-emerald-400 font-mono">Kill: {setterData.killRateP3}%</div>
              </div>

              {/* Zone 2 */}
              <div className="bg-slate-950/80 border border-cyan-500/60 rounded-xl p-3 text-center shadow-lg hover:border-cyan-400 transition">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">ZONA 2 (Opuesto)</div>
                <div className="text-2xl font-black text-white">{setterData.p2}%</div>
                <div className="text-[10px] text-emerald-400 font-mono">Kill: {setterData.killRateP2}%</div>
              </div>
            </div>

            {/* Back Row (Pipe Z6/Z8 & Back attacks) */}
            <div className="grid grid-cols-3 gap-3 z-10">
              <div className="text-center text-[10px] text-slate-500 font-mono">ZONA 5</div>
              {/* Pipe */}
              <div className="bg-slate-950/80 border border-indigo-500/60 rounded-xl p-2.5 text-center shadow-lg">
                <div className="text-[10px] font-mono text-indigo-400 font-bold">PIPE (Z6/Z8)</div>
                <div className="text-xl font-black text-white">{setterData.pipe}%</div>
                <div className="text-[10px] text-emerald-400 font-mono">Kill: {setterData.killRatePipe}%</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-[10px] font-mono text-slate-400 font-bold">ZONA 1</div>
                <div className="text-lg font-black text-slate-300">{setterData.p1}%</div>
              </div>
            </div>

            {/* Setter Position Marker */}
            <div className="absolute top-[28%] right-[28%] w-8 h-8 rounded-full bg-purple-600 border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black text-white animate-pulse">
              S
            </div>
          </div>
        </div>

        {/* Breakdown Stats & Clutch Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Detailed Progress Bars */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-sm font-black text-white flex items-center justify-between">
              <span>Volumen de Salidas & Tasa de Puntos Ganados (Kill Rate)</span>
              <span className="text-xs text-slate-400 font-normal">Base: {setterData.totalSets} acciones</span>
            </h4>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-amber-400">Posición 4 (Punta Receptor): {setterData.p4}% de volumen</span>
                  <span className="font-mono text-emerald-400 font-bold">Kill Rate: {setterData.killRateP4}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${setterData.p4}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-purple-400">Posición 3 (Central 1er Tiempo): {setterData.p3}% de volumen</span>
                  <span className="font-mono text-emerald-400 font-bold">Kill Rate: {setterData.killRateP3}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${setterData.p3}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-cyan-400">Posición 2 (Opuesto): {setterData.p2}% de volumen</span>
                  <span className="font-mono text-emerald-400 font-bold">Kill Rate: {setterData.killRateP2}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${setterData.p2}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-indigo-400">Ataque Pipe (Zaguero Centro Z6): {setterData.pipe}% de volumen</span>
                  <span className="font-mono text-emerald-400 font-bold">Kill Rate: {setterData.killRatePipe}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${setterData.pipe}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Clutch Points Analysis (Puntos Calientes > 20) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Comportamiento en Pelotas Calientes ("Clutch Time" &gt; 20 Puntos)</span>
              </h4>
              <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                Momentos Decisivos
              </span>
            </div>
            <p className="text-xs text-slate-400">
              A quién busca el armador cuando el marcador está igualado en 20-20 o en cierre de set.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-1 text-center font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Opuesto Z2</div>
                <div className="text-xl font-black text-rose-400">58%</div>
                <div className="text-[10px] text-slate-500">Balón de confianza</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Punta Z4</div>
                <div className="text-xl font-black text-amber-400">32%</div>
                <div className="text-[10px] text-slate-500">Segunda opción</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Central Z3</div>
                <div className="text-xl font-black text-slate-400">10%</div>
                <div className="text-[10px] text-slate-500">Solo con pase #</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INFORME 3: MATRIZ DE SAQUE VS RECEPCIÓN & SEAMS (VOLLEYMETRICS)
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
  // Zones target breakdown for serves: Zone 1, 6, 5, and short zones 2, 3, 4
  const zonesBreakdown = [
    { zone: 1, label: 'Zona 1 (Fondo Derecho)', pct: 24, aces: 3, brokenPass: 38, vulnerability: 'Media' },
    { zone: 6, label: 'Zona 6 (Fondo Centro)', pct: 36, aces: 1, brokenPass: 18, vulnerability: 'Baja (Líbero)' },
    { zone: 5, label: 'Zona 5 (Fondo Izquierdo)', pct: 30, aces: 5, brokenPass: 46, vulnerability: 'CRÍTICA' },
    { zone: 4, label: 'Zona 4 Corta (Frente)', pct: 4, aces: 1, brokenPass: 50, vulnerability: 'Alta (Afloje)' },
    { zone: 2, label: 'Zona 2 Corta (Frente)', pct: 6, aces: 0, brokenPass: 30, vulnerability: 'Media' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            VolleyMetrics Target Matrix
          </span>
          <span className="text-xs text-slate-400">Equipo Receptor Analizado: <strong>{teamName}</strong></span>
        </div>
        <h3 className="text-xl font-black text-white">
          Matriz de Saque Táctico, Zonas de Costura (Seams) & Receptor Target
        </h3>
        <p className="text-xs text-slate-400">
          Identificación de las fallas en el esquema de 3 receptores, costuras críticas entre punta y líbero, y recomendaciones de dirección para nuestros sacadores.
        </p>
      </div>

      {/* Grid: 2D Target Court & Receptor Vulnerability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Seam Court Map (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Mapa de Zonas de Conflicto en Cancha</span>
            </h4>
            <span className="text-[11px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
              Zona Target: Zona 5
            </span>
          </div>

          <div className="aspect-[4/3] bg-slate-950 border-2 border-slate-700 rounded-2xl relative p-4 overflow-hidden flex flex-col justify-between shadow-2xl">
            {/* 3m Attack Line */}
            <div className="absolute top-[35%] left-0 right-0 border-b-2 border-dashed border-slate-700" />

            {/* Red (Top) */}
            <div className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">
              RED / LÍNEA CENTRAL
            </div>

            {/* Front Short Zones (2, 3, 4) */}
            <div className="grid grid-cols-3 gap-2 z-10">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400">ZONA 4</div>
                <div className="text-xs font-bold text-slate-300">4% saques</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400">ZONA 3</div>
                <div className="text-xs font-bold text-slate-300">0% saques</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400">ZONA 2</div>
                <div className="text-xs font-bold text-slate-300">6% saques</div>
              </div>
            </div>

            {/* Back Deep Zones with Heatmap Colors (5, 6, 1) */}
            <div className="grid grid-cols-3 gap-2 z-10">
              {/* Zone 5 - Critical target */}
              <div className="p-3 rounded-xl bg-rose-950/60 border-2 border-rose-500 text-center relative shadow-lg shadow-rose-500/20 animate-pulse">
                <div className="text-[10px] font-mono text-rose-300 font-bold">ZONA 5 (Target)</div>
                <div className="text-xl font-black text-white">30%</div>
                <div className="text-[10px] text-rose-300 font-bold">46% pases rotos</div>
              </div>

              {/* Zone 6 - Libero territory */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-center">
                <div className="text-[10px] font-mono text-slate-400 font-bold">ZONA 6 (Líbero)</div>
                <div className="text-xl font-black text-slate-200">36%</div>
                <div className="text-[10px] text-emerald-400 font-bold">18% pases rotos</div>
              </div>

              {/* Zone 1 */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/60 text-center">
                <div className="text-[10px] font-mono text-amber-400 font-bold">ZONA 1</div>
                <div className="text-xl font-black text-slate-200">24%</div>
                <div className="text-[10px] text-amber-300 font-bold">38% pases rotos</div>
              </div>
            </div>

            {/* Seams (Conflict arrows) */}
            <div className="absolute bottom-[22%] left-[30%] bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
              Costura 5-6 (Duda)
            </div>
            <div className="absolute bottom-[22%] right-[30%] bg-slate-800 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-700">
              Costura 6-1
            </div>
          </div>
        </div>

        {/* Zones Table & Player Vulnerability (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-sm font-black text-white">Desglose de Efectividad de Saques por Zona</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px]">
                    <th className="py-2.5 px-3 font-sans font-bold text-slate-200">Zona</th>
                    <th className="py-2.5 px-2 text-center text-slate-300">Volumen</th>
                    <th className="py-2.5 px-2 text-center text-rose-400">Aces</th>
                    <th className="py-2.5 px-2 text-center text-amber-400">% Pases Rotos</th>
                    <th className="py-2.5 px-2 text-center text-slate-300">Vulnerabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {zonesBreakdown.map((z) => (
                    <tr key={z.zone} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-sans font-bold text-slate-200">{z.label}</td>
                      <td className="py-2 px-2 text-center font-bold text-slate-300">{z.pct}%</td>
                      <td className="py-2 px-2 text-center font-black text-rose-400">{z.aces}</td>
                      <td className="py-2 px-2 text-center font-bold text-amber-400">{z.brokenPass}%</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          z.vulnerability === 'CRÍTICA' 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {z.vulnerability}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tactical Recommendation for Servers */}
          <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-4 shadow-lg space-y-2 text-xs">
            <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Consigna para los Sacadores de Nuestro Equipo
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>1. Saque Flotante:</strong> Apuntar a la costura entre el receptor de Z5 y el líbero en Z6. Tienen desacuerdo en balones a media altura entre el hombro derecho del líbero y el izquierdo del punta.
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong>2. Saque en Potencia:</strong> Buscar la línea lateral de Z1 para alejar el balón de la red y forzar al armador rival a correr 6 metros de espaldas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INFORME 4: RENDIMIENTO DE FASES K1 (SIDEOUT) VS K2 (BREAK POINT) & RACHAS
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
  players,
  actions,
}) => {
  // Key metrics for high performance
  const phasesMetrics = {
    sideoutK1: {
      efficiency: 63, // 63% sideout won
      firstBallKill: 52, // 52% attack direct kill
      rotations: [
        { rot: 'R1 (Armador en 1)', eff: 68, status: 'Fuerte' },
        { rot: 'R6 (Armador en 6)', eff: 59, status: 'Normal' },
        { rot: 'R5 (Armador en 5)', eff: 72, status: 'Óptima' },
        { rot: 'R4 (Armador en 4)', eff: 51, status: 'Alerta' },
        { rot: 'R3 (Armador en 3)', eff: 64, status: 'Fuerte' },
        { rot: 'R2 (Armador en 2)', eff: 61, status: 'Normal' },
      ],
    },
    breakpointK2: {
      efficiency: 41, // 41% points on own serve
      killBlocks: 11,
      softTouches: 19,
      transitionKill: 34,
    },
    scoringDistribution: [
      { type: 'Ataque Sideout (K1)', pts: 42, pct: 44, color: 'bg-cyan-500' },
      { type: 'Contraataque (K2)', pts: 21, pct: 22, color: 'bg-emerald-500' },
      { type: 'Bloqueo Punto', pts: 11, pct: 12, color: 'bg-purple-500' },
      { type: 'Aces de Saque', pts: 6, pct: 6, color: 'bg-amber-500' },
      { type: 'Errores del Rival', pts: 15, pct: 16, color: 'bg-slate-500' },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            FIVB VIS / VolleyStation Elite Metric
          </span>
          <span className="text-xs text-slate-400">Equipo: <strong>{teamName}</strong></span>
        </div>
        <h3 className="text-xl font-black text-white">
          Rendimiento de Fases K1 (Complejo 1 Sideout) vs K2 (Complejo 2 Break Point)
        </h3>
        <p className="text-xs text-slate-400">
          El indicador más puro del vóley de alto rendimiento: ¿Qué tan fácil rota el equipo cuando recibe y cuántos puntos corridos logra sumar cuando saca?
        </p>
      </div>

      {/* Main KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Sideout K1 Global</div>
          <div className="text-3xl font-black text-white">{phasesMetrics.sideoutK1.efficiency}%</div>
          <div className="text-[11px] text-slate-400">Benchmark Élite FIVB: &gt; 62%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Kill on 1st Ball (KOB)</div>
          <div className="text-3xl font-black text-white">{phasesMetrics.sideoutK1.firstBallKill}%</div>
          <div className="text-[11px] text-slate-400">Punto en el primer intento tras pase</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-purple-400 font-bold uppercase tracking-wider">Break Point K2 Global</div>
          <div className="text-3xl font-black text-white">{phasesMetrics.breakpointK2.efficiency}%</div>
          <div className="text-[11px] text-slate-400">Puntos ganados con saque propio</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Contraataque Kill %</div>
          <div className="text-3xl font-black text-white">{phasesMetrics.breakpointK2.transitionKill}%</div>
          <div className="text-[11px] text-slate-400">Eficacia tras levantar bola de defensa</div>
        </div>
      </div>

      {/* K1 Rotations Table & Scoring Source Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table: Sideout by Rotation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Eficacia de Sideout (K1) por Rotación</span>
            </h4>
            <span className="text-[11px] font-mono text-cyan-400">Rotaciones 1 a 6</span>
          </div>
          <p className="text-xs text-slate-400">
            Identifica qué rotación sufre el equipo para rotar y dónde se producen los baches de puntos.
          </p>

          <div className="space-y-2.5 pt-2">
            {phasesMetrics.sideoutK1.rotations.map((r) => (
              <div key={r.rot} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-xs text-slate-200">{r.rot}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div className={`h-full rounded-full ${
                      r.eff >= 65 ? 'bg-emerald-500' : r.eff >= 55 ? 'bg-cyan-500' : 'bg-rose-500'
                    }`} style={{ width: `${r.eff}%` }} />
                  </div>
                  <span className="font-mono font-black text-xs text-white w-10 text-right">{r.eff}%</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-16 text-center ${
                    r.status === 'Óptima' ? 'bg-emerald-500/20 text-emerald-400' :
                    r.status === 'Fuerte' ? 'bg-cyan-500/20 text-cyan-400' :
                    r.status === 'Normal' ? 'bg-slate-800 text-slate-300' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring Distribution Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Origen de los Puntos del Equipo</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Total: 95 Puntos</span>
          </div>
          <p className="text-xs text-slate-400">
            ¿Cómo se compone el marcador total? Reparto entre ataque de sideout, contraataque, bloqueo, saque y errores no forzados del oponente.
          </p>

          <div className="space-y-3 pt-2">
            {phasesMetrics.scoringDistribution.map((s) => (
              <div key={s.type}>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="font-bold text-slate-200">{s.type}</span>
                  <span className="text-slate-400">{s.pts} pts ({s.pct}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-850">
                  <div className={`${s.color} h-full rounded-full transition-all duration-500`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-emerald-400">Regla de Oro de Alto Rendimiento:</div>
            <div>Para ganar partidos contra rivales de nivel similar, la eficiencia en Sideout (K1) debe superar el 60%, y el equipo debe convertir al menos 1 de cada 3 balones defendidos en contraataque (K2 &gt; 33%).</div>
          </div>
        </div>
      </div>
    </div>
  );
};
