import React, { useEffect, useState } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Sparkles, 
  Clock, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  Calendar, 
  Activity, 
  ArrowRight,
  Edit3,
  Save,
  Trash2,
  X,
  Layers,
  Volleyball
} from 'lucide-react';
import { TrainingSession, TrainingExercise, MatchData, TrainingEvidenceContext } from '../types';
import { sampleTrainingSessions } from '../data/sampleCompetitionAndTraining';
import { buildEvidenceExercises, buildTrainingEvidenceNote } from '../utils/trainingEvidence';
import { buildPerformanceTargetFromMatch, evaluatePerformanceFollowUp } from '../utils/performanceFollowUp';
import { deleteTrainingSession, getSavedTrainingSessions } from '../services/trainingStorage';
import { deleteTrainingSessionFromServer, saveTrainingSessionLocallyFirst, syncTrainingSessions } from '../services/trainingSync';

interface TrainingCenterProps {
  match?: MatchData;
  initialFocusProblem?: string;
  evidenceContext?: TrainingEvidenceContext;
  onNavigateToMatch?: () => void;
}

export const TrainingCenter: React.FC<TrainingCenterProps> = ({
  match,
  initialFocusProblem,
  evidenceContext,
  onNavigateToMatch,
}) => {
  const [sessions, setSessions] = useState<TrainingSession[]>(() => {
    const saved = getSavedTrainingSessions();
    return saved.length ? saved : sampleTrainingSessions;
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    const saved = getSavedTrainingSessions();
    return saved[0]?.id || sampleTrainingSessions[0]?.id || '';
  });

  // Generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(Boolean(initialFocusProblem));
  const [genDuration, setGenDuration] = useState<number>(90);
  const [genPlayers, setGenPlayers] = useState<number>(14);
  const [genProblem, setGenProblem] = useState<string>(initialFocusProblem || 'Definir problema táctico a trabajar');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'checking' | 'synced' | 'local'>('checking');

  useEffect(() => {
    let cancelled = false;
    void syncTrainingSessions().then((result) => {
      if (cancelled) return;
      if (result.sessions.length) {
        setSessions(result.sessions);
        setSelectedSessionId((current) =>
          result.sessions.some((session) => session.id === current)
            ? current
            : result.sessions[0].id,
        );
      }
      setSyncStatus(result.status === 'synced' ? 'synced' : 'local');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const activeFollowUp =
    activeSession?.performanceTarget && match
      ? evaluatePerformanceFollowUp(activeSession.performanceTarget, match)
      : undefined;

  const handleToggleCompleted = () => {
    if (!activeSession) return;
    const updatedSession: TrainingSession = {
      ...activeSession,
      completed: !activeSession.completed,
      status: activeSession.completed ? 'planned' : 'completed',
    };
    setSessions(saveTrainingSessionLocallyFirst(updatedSession));
  };

  const handleDeleteSession = () => {
    if (!activeSession) return;
    const updated = deleteTrainingSession(activeSession.id);
    setSessions(updated);
    void deleteTrainingSessionFromServer(activeSession.id);
    setSelectedSessionId(updated[0]?.id || '');
  };

  const handleUpdateNotes = (notes: string) => {
    if (!activeSession) return;
    const updatedSession: TrainingSession = { ...activeSession, notes };
    setSessions(saveTrainingSessionLocallyFirst(updatedSession));
  };

  const handleGenerateWithAi = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const evidenceNote = buildTrainingEvidenceNote(evidenceContext);

      const performanceTarget =
        match && evidenceContext?.metric
          ? buildPerformanceTargetFromMatch(match, {
              metric: evidenceContext.metric,
              label: evidenceContext.title,
              teamSide: evidenceContext.teamSide || 'home',
              rotationRef: evidenceContext.rotationRef,
              serveType: evidenceContext.serveType,
              zoneRef: evidenceContext.zoneRef,
              sourceInsightId: evidenceContext.insightId,
              sourceRallyIds: evidenceContext.rallyIds,
            })
          : undefined;

      const newSession: TrainingSession = {
        id: `train_${Date.now()}`,
        title: `Sesión Táctica: ${genProblem.substring(0, 38)}`,
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        durationMin: genDuration,
        playersCount: genPlayers,
        focusProblem: genProblem,
        linkedMatchId: match?.id,
        performanceTarget,
        status: 'planned',
        completed: false,
        notes: `${evidenceNote} Objetivo: generar una nueva muestra comparable en el próximo control.`,
        exercises: buildEvidenceExercises(genProblem, genDuration, evidenceContext),
      };

      setSessions(saveTrainingSessionLocallyFirst(newSession));
      setSelectedSessionId(newSession.id);
      setIsGenerating(false);
      setIsGeneratorOpen(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner: The Closed Performance Cycle */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Centro de Entrenamiento Táctico</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  OPEN AI Connected
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold border border-slate-700">
                  {syncStatus === 'checking'
                    ? 'Sincronizando…'
                    : syncStatus === 'synced'
                      ? 'Historial sincronizado'
                      : 'Modo local'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Diseño de sesiones cerrando el ciclo: Análisis del Partido → Detección de Problema → Entrenamiento Guiado
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/20 transition cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar Sesión con OPEN AI</span>
          </button>
        </div>

        {/* Closed Loop Visual Bar */}
        <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-white uppercase text-[10px] tracking-wider">Ciclo Táctico:</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] overflow-x-auto custom-scrollbar py-1">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">1. PARTIDO</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">2. ANÁLISIS</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">3. PROBLEMA</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">4. ENTRENAMIENTO</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">5. MEJORA</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">6. PRÓXIMO PARTIDO</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Sessions List & Active Session Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Saved Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>Sesiones Planificadas ({sessions.length})</span>
          </div>

          <div className="space-y-2">
            {sessions.map((s) => {
              const isSelected = s.id === activeSession.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-left space-y-2 ${
                    isSelected
                      ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.durationMin} min • {s.playersCount} jug.
                    </span>
                    <span className="text-slate-500 font-mono">{s.date}</span>
                  </div>

                  <h4 className="font-bold text-white text-xs leading-snug">
                    {s.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    Foco: <span className="text-slate-300 font-medium">{s.focusProblem}</span>
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-slate-500">{s.exercises.length} bloques de trabajo</span>
                    <span className="text-purple-400 font-bold">Ver Plan →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col (2 cols): Active Session Detailed Plan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  Plan de Entrenamiento
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {activeSession.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Fecha: <strong className="text-slate-300">{activeSession.date}</strong> a las {activeSession.time} • Duración: <strong className="text-slate-300">{activeSession.durationMin} min</strong> • Plantel: <strong className="text-slate-300">{activeSession.playersCount} jugadoras</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleCompleted}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                    activeSession.completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeSession.completed ? 'Sesión realizada' : 'Marcar realizada'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSession}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-rose-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>

              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] max-w-xs">
                <span className="text-rose-400 font-bold block mb-0.5">Déficit a corregir:</span>
                <span className="text-slate-300">{activeSession.focusProblem}</span>
              </div>
            </div>

            {activeSession.performanceTarget && (
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      Seguimiento de mejora
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {activeSession.performanceTarget.label}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                    activeFollowUp?.status === 'improved'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : activeFollowUp?.status === 'declined'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : activeFollowUp?.status === 'stable'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {activeFollowUp?.status === 'improved'
                      ? 'Mejora observada'
                      : activeFollowUp?.status === 'declined'
                        ? 'Retroceso observado'
                        : activeFollowUp?.status === 'stable'
                          ? 'Sin cambio'
                          : activeFollowUp?.status === 'insufficient_data'
                            ? 'Muestra insuficiente'
                            : 'Pendiente de comparación'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-500 uppercase">Base</div>
                    <div className="text-lg font-black text-white">
                      {activeSession.performanceTarget.baselineValue !== undefined
                        ? `${activeSession.performanceTarget.baselineValue}%`
                        : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      n={activeSession.performanceTarget.baselineSample ?? 0}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-500 uppercase">Actual</div>
                    <div className="text-lg font-black text-white">
                      {activeFollowUp?.currentValue !== undefined ? `${activeFollowUp.currentValue}%` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      n={activeFollowUp?.currentSample ?? 0}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-500 uppercase">Diferencia</div>
                    <div className="text-lg font-black text-white">
                      {activeFollowUp?.delta !== undefined
                        ? `${activeFollowUp.delta > 0 ? '+' : ''}${activeFollowUp.delta} pp`
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-500 uppercase">Origen</div>
                    <div className="text-[11px] font-bold text-slate-300 mt-1 break-all">
                      {activeSession.performanceTarget.sourceMatchId || 'Manual'}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeFollowUp?.message || 'Todavía no hay un partido comparable para evaluar este objetivo.'}
                </p>
              </div>
            )}

            {/* Exercise Blocks List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                <span>Estructura de la Sesión (5 Bloques Progresivos)</span>
                <span className="text-[10px] text-purple-400 font-mono">100% Personalizable</span>
              </h4>

              <div className="space-y-3">
                {activeSession.exercises.map((ex, i) => (
                  <div
                    key={ex.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 font-mono font-bold text-[11px] flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          {ex.block}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {ex.durationMin} min
                      </span>
                    </div>

                    <div className="font-bold text-white text-xs">
                      {ex.name}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ex.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span><strong>Ubicación en cancha:</strong> {ex.courtFocus}</span>
                      <span className="text-emerald-400 font-medium"><strong>Objetivo:</strong> {ex.keyObjective}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Closing Notes */}
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-300">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Notas del Cuerpo Técnico
              </label>
              <textarea
                value={activeSession.notes || ''}
                onChange={(event) => handleUpdateNotes(event.target.value)}
                rows={3}
                placeholder="Agregar observaciones de la sesión..."
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GENERATOR MODAL (OPEN AI) */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Generador Táctico OPEN AI</h3>
                  <p className="text-xs text-slate-400">Diseño automatizado basado en el problema detectado</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Problema Táctico o Déficit Detectado
                </label>
                <textarea
                  value={genProblem}
                  onChange={(e) => setGenProblem(e.target.value)}
                  rows={2}
                  placeholder="Ej: Recepción en zona 5 frente a saques flotados o Side-out en R4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Duración Total (min)</label>
                  <select
                    value={genDuration}
                    onChange={(e) => setGenDuration(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  >
                    <option value={60}>60 minutos</option>
                    <option value={75}>75 minutos</option>
                    <option value={90}>90 minutos (Estándar)</option>
                    <option value={120}>120 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Jugadoras Presentes</label>
                  <input
                    type="number"
                    min={8}
                    max={24}
                    value={genPlayers}
                    onChange={(e) => setGenPlayers(parseInt(e.target.value) || 14)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-purple-950/20 border border-purple-800/30 rounded-xl text-slate-300 space-y-1">
                <span className="font-bold text-purple-400 block text-[11px]">Estructura que generará la IA:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  La estructura se adapta al tipo de evidencia recibida. Si faltan datos de zona, rotación o tipo de saque, OPEN VOLEY no los completa: deja ese detalle para el cuerpo técnico.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isGenerating || !genProblem.trim()}
                onClick={handleGenerateWithAi}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Generando sesión...' : 'Generar Sesión Completa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
