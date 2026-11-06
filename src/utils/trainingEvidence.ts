import { TrainingEvidenceContext, TrainingExercise } from '../types';

export function buildEvidenceExercises(
  genProblem: string,
  genDuration: number,
  evidenceContext?: TrainingEvidenceContext,
  now = Date.now(),
): TrainingExercise[] {
  const category = evidenceContext?.category || 'generic';
  const focus = genProblem.trim();

  const warmupDuration = Math.max(10, Math.round(genDuration * 0.15));
  const specificDuration = Math.max(20, Math.round(genDuration * 0.30));
  const transferDuration = Math.max(20, Math.round(genDuration * 0.25));
  const evaluationDuration = Math.max(15, Math.round(genDuration * 0.20));
  const closingDuration = Math.max(
    5,
    genDuration - warmupDuration - specificDuration - transferDuration - evaluationDuration,
  );

  const warmup: TrainingExercise = {
    id: `ex_${now}_1`,
    block: 'Calentamiento',
    name: 'Activación orientada al patrón del partido',
    durationMin: warmupDuration,
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
      durationMin: specificDuration,
      description: 'Recrear secuencias de recepción y salida correspondientes al hallazgo observado. Mantener la rotación indicada por la evidencia y registrar cada resolución para poder comparar después.',
      courtFocus: evidenceContext?.rotationRef ? `Rotación R${evidenceContext.rotationRef}` : 'Rotación observada en la evidencia',
      keyObjective: 'Aumentar la eficacia de Side-out en el contexto realmente detectado',
    },
    serve_reception: {
      id: `ex_${now}_2`,
      block: 'Recepción',
      name: `Recepción sobre el patrón detectado: ${focus}`,
      durationMin: specificDuration,
      description: 'Reproducir únicamente el tipo de saque y la zona que figuran en el hallazgo. Registrar calidad de recepción para comparar el ejercicio con la muestra del partido.',
      courtFocus: 'Zona indicada por la evidencia del hallazgo',
      keyObjective: 'Reducir la recepción negativa frente al patrón observado',
    },
    attack: {
      id: `ex_${now}_2`,
      block: 'Ataque',
      name: `Resolución ofensiva: ${focus}`,
      durationMin: specificDuration,
      description: 'Repetir situaciones ofensivas equivalentes a las registradas, conservando sólo las condiciones conocidas en los datos.',
      courtFocus: 'Contexto ofensivo registrado',
      keyObjective: 'Mejorar la resolución del problema ofensivo observado',
    },
    serve: {
      id: `ex_${now}_2`,
      block: 'Saque',
      name: `Trabajo específico: ${focus}`,
      durationMin: specificDuration,
      description: 'Entrenar el patrón de saque sustentado por el hallazgo y registrar resultado de cada intento.',
      courtFocus: 'Objetivo indicado por la evidencia, si existe',
      keyObjective: 'Mejorar consistencia y presión de saque sin inventar objetivos no registrados',
    },
    reception: {
      id: `ex_${now}_2`,
      block: 'Recepción',
      name: `Trabajo específico: ${focus}`,
      durationMin: specificDuration,
      description: 'Repetir el contexto de recepción respaldado por los datos y registrar la evaluación de cada acción.',
      courtFocus: 'Contexto respaldado por la evidencia',
      keyObjective: 'Mejorar la calidad de recepción en el problema observado',
    },
    generic: {
      id: `ex_${now}_2`,
      block: 'Juego condicionado',
      name: `Foco técnico-táctico: ${focus}`,
      durationMin: specificDuration,
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
      block: 'Juego condicionado',
      name: 'Transferencia a situación de juego',
      durationMin: transferDuration,
      description: 'Integrar el foco trabajado en rallies completos y registrar las acciones con el Scout para conservar evidencia comparable.',
      courtFocus: 'Cancha completa',
      keyObjective: 'Transferir la mejora al rally real',
    },
    {
      id: `ex_${now}_4`,
      block: 'Juego condicionado',
      name: 'Bloque de control y comparación',
      durationMin: evaluationDuration,
      description: 'Repetir el contexto objetivo sin corrección durante la acción y registrar resultados. La mejora se evalúa con datos, no por una conclusión automática.',
      courtFocus: 'Mismo contexto del bloque específico',
      keyObjective: 'Crear una nueva muestra comparable',
    },
    {
      id: `ex_${now}_5`,
      block: 'Cierre',
      name: 'Revisión del objetivo de la sesión',
      durationMin: closingDuration,
      description: 'Registrar observaciones del cuerpo técnico y dejar definido qué indicador se revisará en el próximo partido.',
      courtFocus: 'Fuera de cancha',
      keyObjective: 'Cerrar el ciclo con un criterio de seguimiento explícito',
    },
  ];
}

export function buildTrainingEvidenceNote(context?: TrainingEvidenceContext): string {
  if (!context) {
    return 'Foco ingresado manualmente por el cuerpo técnico; no se presenta como hallazgo automático.';
  }

  return `Basado en ${context.evidenceSource || 'evidencia del partido'}${context.evidenceCount ? ` (n=${context.evidenceCount})` : ''}${context.rallyIds?.length ? `; rallies vinculados: ${context.rallyIds.length}` : ''}.`;
}
