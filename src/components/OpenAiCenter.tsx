import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Dumbbell, 
  ShieldAlert, 
  Video, 
  Send, 
  Volleyball, 
  FileText, 
  HelpCircle,
  TrendingUp,
  BarChart2,
  Users
} from 'lucide-react';
import { MatchData, TrainingEvidenceContext } from '../types';
import { getCurrentMatch } from '../services/teamStorage';
import { buildEvidenceInsights } from '../utils/evidenceInsights';
import { buildOpenAiConversationContext } from '../utils/openAiConversationContext';

export interface AttackCounts {
  totalAttacks: number;
  attackPoints: number;
  attackErrors: number;
}

/**
 * Counts only real match actions of type ATTACK and returns:
 * - totalAttacks
 * - attackPoints
 * - attackErrors
 */
export function countMatchAttacks(currentMatch: MatchData): AttackCounts {
  const actions = currentMatch.actions || [];
  const attackActions = actions.filter(
    (a) => a.skill === 'A' || (a as any).type === 'ATTACK' || (a as any).actionType === 'ATTACK'
  );

  const totalAttacks = attackActions.length;
  const attackPoints = attackActions.filter(
    (a) => a.evaluation === '#' || (a as any).result === 'point' || (a as any).result === 'pt'
  ).length;
  const attackErrors = attackActions.filter(
    (a) => a.evaluation === '=' || (a as any).result === 'error' || (a as any).result === 'err'
  ).length;

  return {
    totalAttacks,
    attackPoints,
    attackErrors,
  };
}

export interface ServeCounts {
  totalServes: number;
  serveAces: number;
  serveErrors: number;
}

/**
 * Counts only real match actions of type SERVE and returns:
 * - totalServes
 * - serveAces
 * - serveErrors
 */
export function countMatchServes(currentMatch: MatchData): ServeCounts {
  const actions = currentMatch.actions || [];
  const serveActions = actions.filter(
    (a) => a.skill === 'S' || (a as any).type === 'SERVE' || (a as any).actionType === 'SERVE' || (a as any).skill === 'SERVE'
  );

  const totalServes = serveActions.length;
  const serveAces = serveActions.filter(
    (a) => a.evaluation === '#' || (a as any).result === 'ace' || (a as any).result === 'point' || (a as any).result === 'pt'
  ).length;
  const serveErrors = serveActions.filter(
    (a) => a.evaluation === '=' || (a as any).result === 'error' || (a as any).result === 'err'
  ).length;

  return {
    totalServes,
    serveAces,
    serveErrors,
  };
}

export interface ReceptionCounts {
  totalReceptions: number;
  positiveReceptions: number;
  receptionErrors: number;
}

/**
 * Counts only real match actions of type RECEPTION and returns:
 * - totalReceptions
 * - positiveReceptions
 * - receptionErrors
 */
export function countMatchReceptions(currentMatch: MatchData): ReceptionCounts {
  const actions = currentMatch.actions || [];
  const recActions = actions.filter(
    (a) => a.skill === 'R' || (a as any).type === 'RECEPTION' || (a as any).actionType === 'RECEPTION' || (a as any).skill === 'RECEPTION'
  );

  const totalReceptions = recActions.length;
  const positiveReceptions = recActions.filter(
    (a) => a.evaluation === '+' || a.evaluation === '#' || (a as any).result === 'positive' || (a as any).result === 'perfect'
  ).length;
  const receptionErrors = recActions.filter(
    (a) => a.evaluation === '=' || (a as any).result === 'error' || (a as any).result === 'err'
  ).length;

  return {
    totalReceptions,
    positiveReceptions,
    receptionErrors,
  };
}

export type PerformanceIssueResult = 'ATTACK' | 'SERVE' | 'RECEPTION' | 'INSUFFICIENT_DATA';

/**
 * Evaluates real match performance across Attack, Serve, and Reception.
 * Requires at least 3 actions in a category to draw conclusions.
 * Returns ATTACK, SERVE, RECEPTION, or INSUFFICIENT_DATA.
 */
export function getPrimaryPerformanceIssue(currentMatch: MatchData): PerformanceIssueResult {
  const attacks = countMatchAttacks(currentMatch);
  const serves = countMatchServes(currentMatch);
  const receptions = countMatchReceptions(currentMatch);

  const MIN_ACTIONS = 3;

  const validSkills: Array<{
    skill: 'ATTACK' | 'SERVE' | 'RECEPTION';
    issueScore: number;
  }> = [];

  // Evaluate Attack only if volume is sufficient (>= 3 actions)
  if (attacks.totalAttacks >= MIN_ACTIONS) {
    const errorRate = attacks.attackErrors / attacks.totalAttacks;
    const efficiency = (attacks.attackPoints - attacks.attackErrors) / attacks.totalAttacks;
    const issueScore = errorRate + Math.max(0, -efficiency);
    validSkills.push({ skill: 'ATTACK', issueScore });
  }

  // Evaluate Serve only if volume is sufficient (>= 3 actions)
  if (serves.totalServes >= MIN_ACTIONS) {
    const errorRate = serves.serveErrors / serves.totalServes;
    const netServeLoss = (serves.serveErrors - serves.serveAces) / serves.totalServes;
    const issueScore = errorRate + Math.max(0, netServeLoss);
    validSkills.push({ skill: 'SERVE', issueScore });
  }

  // Evaluate Reception only if volume is sufficient (>= 3 actions)
  if (receptions.totalReceptions >= MIN_ACTIONS) {
    const errorRate = receptions.receptionErrors / receptions.totalReceptions;
    const nonPositiveRate = (receptions.totalReceptions - receptions.positiveReceptions) / receptions.totalReceptions;
    const issueScore = errorRate * 1.5 + nonPositiveRate * 0.5;
    validSkills.push({ skill: 'RECEPTION', issueScore });
  }

  if (validSkills.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  // Sort by highest issue severity
  validSkills.sort((a, b) => b.issueScore - a.issueScore);

  return validSkills[0].skill;
}

const ISSUE_TRANSLATIONS: Record<PerformanceIssueResult, string> = {
  ATTACK: 'Ataque',
  SERVE: 'Saque',
  RECEPTION: 'Recepción',
  INSUFFICIENT_DATA: 'Datos insuficientes',
};

interface OpenAiCenterProps {
  match?: MatchData;
  currentMatch?: MatchData;
  historicalMatches?: MatchData[];
  onGenerateTraining?: (context: TrainingEvidenceContext) => void;
  onOpenVideoClips?: (rallyIds?: string[]) => void;
  onOpenTactics?: () => void;
  onOpenPlayer360?: (playerNumber: number) => void;
}

export const OpenAiCenter: React.FC<OpenAiCenterProps> = ({
  match,
  currentMatch: propCurrentMatch,
  historicalMatches = [],
  onGenerateTraining,
  onOpenVideoClips,
  onOpenTactics,
  onOpenPlayer360,
}) => {
  const currentMatch = propCurrentMatch || match || getCurrentMatch();
  const [activeCategory, setActiveCategory] = useState<'all' | 'tactical' | 'training' | 'scouting' | 'player'>('all');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Array<{ q: string; a: string; timestamp: string }>>([]);
  const [isAnswering, setIsAnswering] = useState(false);

  const actionsCount = (currentMatch.actions || []).length;
  const currentMatchAttacks = countMatchAttacks(currentMatch);
  const currentMatchServes = countMatchServes(currentMatch);
  const totalServes = currentMatchServes.totalServes;
  const currentMatchReceptions = countMatchReceptions(currentMatch);
  void currentMatchReceptions;
  const primaryPerformanceIssue = getPrimaryPerformanceIssue(currentMatch);
  const evidenceInsights = buildEvidenceInsights(currentMatch, 'home');
  const trainingRecommendation =
    primaryPerformanceIssue === 'ATTACK'
      ? 'Trabajar definición de ataque y reducción de errores.'
      : '';

  const serveTrainingAction =
    primaryPerformanceIssue === 'SERVE'
      ? 'Trabajar precisión de saque y reducción de errores.'
      : '';

interface ActionInsightItem {
  id: string;
  category: 'tactical' | 'training' | 'player' | 'scouting';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  sourceEvidence: string;
  actionType: 'generate_training' | 'view_clips' | 'view_tactics' | 'player_profile';
  actionTarget?: string;
  rallyIds?: string[];
  evidenceCount?: number;
  performanceMetric?: TrainingEvidenceContext['metric'];
  rotationRef?: number;
  serveTypeRef?: TrainingEvidenceContext['serveType'];
  zoneRef?: number;
  playerNumRef?: number;
  actionCta: string;
}

  const trainingActions: ActionInsightItem[] = [
    ...(trainingRecommendation
      ? [
          {
            id: 'action-attack-training',
            category: 'training' as const,
            severity: 'high' as const,
            title: 'Plan de Entrenamiento',
            description: trainingRecommendation,
            sourceEvidence: 'Área prioritaria: Ataque',
            actionType: 'generate_training' as const,
            actionTarget: trainingRecommendation,
            performanceMetric: 'attack_efficiency_pct' as const,
            actionCta: 'Crear Sesión de Entrenamiento',
          },
        ]
      : []),
    ...(serveTrainingAction
      ? [
          {
            id: 'action-serve-training',
            category: 'training' as const,
            severity: 'high' as const,
            title: 'Plan de Entrenamiento',
            description: serveTrainingAction,
            sourceEvidence: 'Área prioritaria: Saque',
            actionType: 'generate_training' as const,
            actionTarget: serveTrainingAction,
            performanceMetric: 'serve_efficiency_pct' as const,
            actionCta: 'Crear Sesión de Entrenamiento',
          },
        ]
      : []),
  ];

  const evidenceActions: ActionInsightItem[] = evidenceInsights.map((insight) => ({
    id: insight.id,
    category: insight.category === 'JUGADOR' ? 'player' : insight.category === 'RIVAL' ? 'scouting' : 'tactical',
    severity: insight.type === 'HECHO' ? 'medium' : 'low',
    title: insight.title,
    description: insight.description,
    sourceEvidence: `${insight.evidenceSource} • n=${insight.evidenceCount}`,
    actionType:
      insight.actionType === 'view_video'
        ? 'view_clips'
        : insight.actionType === 'view_analysis'
          ? 'view_tactics'
          : insight.actionType === 'view_players'
            ? 'player_profile'
            : 'view_tactics',
    actionTarget: insight.rotationRef ? `R${insight.rotationRef}` : undefined,
    rallyIds: insight.rallyIds,
    evidenceCount: insight.evidenceCount,
    performanceMetric: insight.performanceMetric,
    rotationRef: insight.rotationRef,
    serveTypeRef: insight.serveTypeRef,
    zoneRef: insight.zoneRef,
    playerNumRef: insight.playerNumRef,
    actionCta:
      insight.actionType === 'view_video'
        ? 'Ver rallies / clips'
        : insight.actionType === 'view_players'
          ? 'Ver jugador'
          : 'Ver análisis táctico',
  }));

  const allInsights = [...evidenceActions, ...trainingActions];

  const filteredInsights =
    activeCategory === 'all'
      ? allInsights
      : allInsights.filter((i) => i.category === activeCategory);

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAnswering) return;

    const q = customQuestion.trim();
    setCustomQuestion('');
    setIsAnswering(true);
    try {
      const context = buildOpenAiConversationContext(currentMatch, historicalMatches);
      const conversation = customAnswers.slice(0, 6).reverse().map((item) => ({ question: item.q, answer: item.a }));
      const response = await fetch('/api/ai-scout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: q, context, conversation }),
      });
      const payload = await response.json().catch(() => null);
      const a = response.ok && payload?.reply
        ? String(payload.reply)
        : payload?.error === 'AI service is not configured'
          ? 'OPEN AI no está configurado en este servidor. Falta GEMINI_API_KEY.'
          : 'No fue posible completar la consulta con los datos disponibles.';
      setCustomAnswers((prev) => [{ q, a, timestamp: new Date().toLocaleTimeString().slice(0, 5) }, ...prev].slice(0, 20));
    } catch {
      setCustomAnswers((prev) => [{ q, a: 'No fue posible conectar con OPEN AI.', timestamp: new Date().toLocaleTimeString().slice(0, 5) }, ...prev].slice(0, 20));
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HERO: EXECUTIVE 3-LINE POST-MATCH SUMMARY */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">OPEN AI Tactical Intelligence</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  Motor FIVB Vóley
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inteligencia deportiva contextual con acciones directas para el cuerpo técnico y atletas
              </p>
            </div>
          </div>

          {/* Strict Data Safety Evidence Badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium text-[11px]">
              Basado en: <strong className="text-white font-mono">{actionsCount} jugadas analizadas</strong>
            </span>
          </div>
        </div>

        {/* Post-Match Summary */}
        <div className="p-4 bg-slate-950/70 border border-purple-800/30 rounded-2xl space-y-1.5">
          <div className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
            Dictamen Ejecutivo Post-Partido
          </div>
          {currentMatchAttacks.totalAttacks === 0 ? (
            <p className="text-xs text-slate-400 py-1">
              No hay ataques registrados para analizar.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-slate-200 py-0.5">
                {`Se registraron ${currentMatchAttacks.totalAttacks} ataques: ${currentMatchAttacks.attackPoints} terminaron en punto y ${currentMatchAttacks.attackErrors} en error.`}
              </p>
              <div className="text-[11px] text-slate-400">
                {`Basado en ${currentMatchAttacks.totalAttacks} ataques registrados.`}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-300 py-0.5">
            {`Se registraron ${totalServes} saques.`}
          </p>
          <div className="text-xs text-purple-300 font-medium pt-1 border-t border-slate-800/60">
            {primaryPerformanceIssue === 'INSUFFICIENT_DATA'
              ? 'Datos insuficientes para detectar un área prioritaria.'
              : `Área prioritaria: ${ISSUE_TRANSLATIONS[primaryPerformanceIssue]}`}
          </div>
        </div>
      </div>

      {/* 2. ACTIONABLE INSIGHTS (AI ACTIONS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Hallazgos con Evidencia y Acciones Inmediatas</span>
            </h3>
            <p className="text-xs text-slate-400">
              Los hallazgos tácticos sólo aparecen cuando la muestra real supera el umbral mínimo definido
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'tactical', label: 'Tácticos' },
              { id: 'training', label: 'Entrenamiento' },
              { id: 'scouting', label: 'Scouting rival' },
              { id: 'player', label: 'Individuales' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  activeCategory === tab.id
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredInsights.length === 0 ? (
            <div className="col-span-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
              <p className="text-xs text-slate-400 font-medium">
                Datos insuficientes para generar este análisis.
              </p>
            </div>
          ) : (
            filteredInsights.map((item) => {
            const isHigh = item.severity === 'high';
            const isMed = item.severity === 'medium';
            return (
              <div
                key={item.id}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl shadow-lg transition flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isHigh ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      isMed ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.category === 'tactical' ? 'Táctico' : item.category === 'training' ? 'Entrenamiento' : item.category === 'player' ? 'Jugador' : 'Scouting'}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.sourceEvidence}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-white leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* AI ACTION BUTTON */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      if (item.actionType === 'generate_training' && onGenerateTraining) {
                        onGenerateTraining({
                          title: item.title,
                          description: item.actionTarget || item.description,
                          evidenceSource: item.sourceEvidence,
                          evidenceCount: item.evidenceCount,
                          rallyIds: item.rallyIds,
                          rotationRef: item.rotationRef,
                          category:
                            item.performanceMetric === 'sideout_pct'
                              ? 'rotation_sideout'
                              : item.performanceMetric === 'reception_negative_pct'
                                ? 'serve_reception'
                                : item.id.includes('attack')
                                  ? 'attack'
                                  : item.id.includes('serve')
                                    ? 'serve'
                                    : item.id.includes('reception')
                                      ? 'reception'
                                      : 'generic',
                          metric: item.performanceMetric,
                          serveType: item.serveTypeRef,
                          zoneRef: item.zoneRef,
                          teamSide: 'home',
                        });
                      } else if (item.actionType === 'view_clips' && onOpenVideoClips) {
                        onOpenVideoClips(item.rallyIds);
                      } else if (item.actionType === 'view_tactics' && onOpenTactics) {
                        onOpenTactics();
                      } else if (item.actionType === 'player_profile' && onOpenPlayer360 && item.playerNumRef) {
                        onOpenPlayer360(item.playerNumRef);
                      }
                    }}
                    className="w-full bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-purple-500/30 transition flex items-center justify-between cursor-pointer group/btn"
                  >
                    <span className="flex items-center gap-1.5">
                      {item.actionType === 'generate_training' && <Dumbbell className="w-3.5 h-3.5" />}
                      {item.actionType === 'view_clips' && <Video className="w-3.5 h-3.5" />}
                      {item.actionType === 'view_tactics' && <ShieldAlert className="w-3.5 h-3.5" />}
                      {item.actionType === 'player_profile' && <Users className="w-3.5 h-3.5" />}
                      <span>{item.actionCta}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  {item.performanceMetric && item.actionType !== 'generate_training' && onGenerateTraining && (
                    <button
                      type="button"
                      onClick={() =>
                        onGenerateTraining({
                          insightId: item.id,
                          title: item.title,
                          description: item.description,
                          evidenceSource: item.sourceEvidence,
                          evidenceCount: item.evidenceCount,
                          rallyIds: item.rallyIds,
                          rotationRef: item.rotationRef,
                          category:
                            item.performanceMetric === 'sideout_pct'
                              ? 'rotation_sideout'
                              : item.performanceMetric === 'reception_negative_pct'
                                ? 'serve_reception'
                                : 'generic',
                          metric: item.performanceMetric,
                          serveType: item.serveTypeRef,
                          zoneRef: item.zoneRef,
                          teamSide: 'home',
                        })
                      }
                      className="w-full mt-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs py-2 px-3 rounded-xl border border-emerald-500/30 transition flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5" />
                        Crear entrenamiento desde esta evidencia
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* 3. INTERACTIVE CONTEXTUAL TACTICAL INQUIRY */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-black text-white">Consulta Táctica Contextual</h3>
          </div>
          <span className="text-[11px] text-slate-400">Contexto controlado • Partido + historial + evidencia registrada</span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendQuestion} className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ej: ¿Cómo estuvo nuestra recepción? ¿Qué jugador hizo más puntos? ¿Qué cambió respecto de partidos anteriores?"
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
          <button
            type="submit"
            disabled={!customQuestion.trim() || isAnswering}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/20 shrink-0"
          >
            <span>{isAnswering ? 'Analizando...' : 'Consultar'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Answers List */}
        <div className="space-y-3 pt-2">
          {customAnswers.map((ans, idx) => (
            <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {ans.q}
                </span>
                <span className="font-mono text-[10px] text-slate-500">{ans.timestamp} hs</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {ans.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
