import React, { useState } from 'react';
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
  const [sessions, setSessions] = useState<TrainingSession[]>(sampleTrainingSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sampleTrainingSessions[0].id);

  // Generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(Boolean(initialFocusProblem));
  const [genDuration, setGenDuration] = useState<number>(90);
  const [genPlayers, setGenPlayers] = useState<number>(14);
  const [genProblem, setGenProblem] = useState<string>(initialFocusProblem || 'Definir problema táctico a trabajar');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const buildEvidenceExercises = (): TrainingExercise[] => {
    const now = Date.now();
    const category = evidenceContext?.category || 'generic';
    const focus = genProblem.trim();

    const warmup: TrainingExercise = {
      id: `ex_${now}_1`,
      block: 'Activación',
      name: 'Activación orientada al patrón del partido',
      durationMin: Math.max(10, Math.round(genDuration * 0.15)),
      description: evidenceContext
        ? `Preparación técnica usando como referencia el hallazgo: ${evidenceContext.title}. No se agregan zonas, gestos ni patrones que no estén presentes en la evidencia.`
        : `Preparación general vinculada al foco definido por el cuerpo técnico: ${focus}.`,
      courtFocus: 'Según el foco definido',
      keyObjective: 'Preparar la tarea principal sin introducir supuestos tácticos',
    };

    const categoryExercise: Record<string, TrainingExercise> = {
      rotation_sideout: {
        id: `ex_${now}_2`,
        block: 'Side-out',
        name: `Repetición contextual del problema: ${focus}`,
        durationMin: Math.max(20, Math.round(genDuration * 0.30)),
        description: `Recrear secuencias de recepción y salida correspondientes al hallazgo observado. Mantener la rotación indicada por la evidencia y registrar cada resolución para poder comparar después.`,
        courtFocus: evidenceContext?.rotationRef ? `Rotación R${evidenceContext.rotationRef}` : 'Rotación observada en la evidencia',
        keyObjective: 'Aumentar la eficacia de Side-out en el contexto realmente detectado',
      },
      serve_reception: {
        id: `ex_${now}_2`,
        block: 'Recepción',
        name: `Recepción sobre el patrón detectado: ${focus}`,
        durationMin: Math.max(20, Math.round(genDuration * 0.30)),
        description: `Reproducir únicamente el tipo de saque y la zona que figuran en el hallazgo. Registrar calidad de recepción para comparar el ejercicio con la muestra del partido.`,
        courtFocus: 'Zona indicada por la evidencia del hallazgo',
        keyObjective: 'Reducir la recepción negativa frente al patrón observado',
      },
      attack: {
        id: `ex_${now}_2`,
        block: 'Ataque',
        name: `Resolución ofensiva: ${focus}`,
        durationMin: Math.max(20, Math.round(genDuration * 0.30)),
        description: 'Repetir situaciones ofensivas equivalentes a las registradas, conservando sólo las condiciones conocidas en los datos.',
        courtFocus: 'Contexto ofensivo registrado',
        keyObjective: 'Mejorar la resolución del problema ofensivo observado',
      },
      serve: {
        id: `ex_${now}_2`,
        block: 'Saque',
        name: `Trabajo específico: ${focus}`,
        durationMin: Math.max(20, Math.round(genDuration * 0.30)),
        description: 'Entrenar el patrón de saque sustentado por el hallazgo y registrar resultado de cada intento.',
        courtFocus: 'Objetivo indicado por la evidencia, si existe',
        keyObjective: 'Mejorar consistencia y presión de saque sin inventar objetivos no registrados',
      },
      reception: {
        id: `ex_${now}_2`,
        block: 'Recepción',
        name: `Trabajo específico: ${focus}`,
        durationMin: Math.max(20, Math.round(genDuration * 0.30)),
        description: 'Repetir el contexto de recepción respaldado por los datos y registrar la evaluación de cada acción.',
        courtFocus: 'Contexto respaldado por la evidencia',
        keyObjective: 'Mejorar la calidad de recepción en el problema observado',
      },
      generic: {
        id: `ex_${now}_2`,
        block: 'Trabajo específico',
        name: `Foco técnico-táctico: ${focus}`,
        durationMin: Math.max(20, Math.round(genDuration * 0.30)),
        description: evidenceContext
          ? 'Trabajar exclusivamente el problema descrito por el hallazgo. La evidencia disponible no permite especificar automáticamente una zona, tipo de saque o rotación adicional.'
          : 'Foco definido manualmente por el cuerpo técnico. OPEN VOLEY no atribuye este ejercicio a evidencia automática.',
        courtFocus: 'A definir por el cuerpo técnico',
        keyObjective: 'Trabajar el foco sin completar información inexistente',
      },
    };

    return [
      warmup,
      categoryExercise[category] || categoryExercise.generic,
      {
        id: `ex_${now}_3`,
        block: 'Transferencia',
        name: 'Transferencia a situación de juego',
        durationMin: Math.max(20, Math.round(genDuration * 0.25)),
        description: 'Integrar el foco trabajado en rallies completos y registrar las acciones con el Scout para conservar evidencia comparable.',
        courtFocus: 'Cancha completa',
        keyObjective: 'Transferir la mejora al rally real',
      },
      {
        id: `ex_${now}_4`,
        block: 'Evaluación',
        name: 'Bloque de control y comparación',
        durationMin: Math.max(15, Math.round(genDuration * 0.20)),
        description: 'Repetir el contexto objetivo sin corrección durante la acción y registrar resultados. La mejora se evalúa con datos, no por una conclusión automática.',
        courtFocus: 'Mismo contexto del bloque específico',
        keyObjective: 'Crear una nueva muestra comparable',
      },
      {
        id: `ex_${now}_5`,
        block: 'Cierre',
        name: 'Revisión del objetivo de la sesión',
        durationMin: Math.max(5, genDuration - (
          Math.max(10, Math.round(genDuration * 0.15)) +
          Math.max(20, Math.round(genDuration * 0.30)) +
          Math.max(20, Math.round(genDuration * 0.25)) +
          Math.max(15, Math.round(genDuration * 0.20))
        )),
        description: 'Registrar observaciones del cuerpo técnico y dejar definido qué indicador se revisará en el próximo partido.',
        courtFocus: 'Fuera de cancha',
        keyObjective: 'Cerrar el ciclo con un criterio de seguimiento explícito',
      },
    ];
  };

  const handleGenerateWithAi = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const evidenceNote = evidenceContext
        ? `Basado en ${evidenceContext.evidenceSource || 'evidencia del partido'}${evidenceContext.evidenceCount ? ` (n=${evidenceContext.evidenceCount})` : ''}${evidenceContext.rallyIds?.length ? `; rallies vinculados: ${evidenceContext.rallyIds.length}` : ''}.`
        : 'Foco ingresado manualmente por el cuerpo técnico; no se presenta como hallazgo automático.';

      const newSession: TrainingSession = {
        id: `train_${Date.now()}`,
        title: `Sesión Táctica: ${genProblem.substring(0, 38)}`,
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        durationMin: genDuration,
        playersCount: genPlayers,
        focusProblem: genProblem,
        linkedMatchId: match?.id,
        status: 'planned',
        completed: false,
        notes: `${evidenceNote} Objetivo: generar una nueva muestra comparable en el próximo control.`,
        exercises: buildEvidenceExercises(),
      };

      setSessions([newSession, ...sessions]);
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

              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] max-w-xs">
                <span className="text-rose-400 font-bold block mb-0.5">Déficit a corregir:</span>
                <span className="text-slate-300">{activeSession.focusProblem}</span>
              </div>
            </div>

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
            {activeSession.notes && (
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notas del Cuerpo Técnico</span>
                {activeSession.notes}
              </div>
            )}
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
