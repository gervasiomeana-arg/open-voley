import { TrainingExercise } from '../types';

export type TrainingFocusKind = 'RECEPTION' | 'SIDEOUT' | 'SERVE' | 'ATTACK' | 'GENERAL';

export function classifyTrainingFocus(problem: string): TrainingFocusKind {
  const text = problem.toLowerCase();
  if (text.includes('side-out') || text.includes('sideout') || /\br[1-6]\b/.test(text) || text.includes('rotación')) {
    return 'SIDEOUT';
  }
  if (text.includes('recepción') || text.includes('receptor') || text.includes('zona') && text.includes('saque')) {
    return 'RECEPTION';
  }
  if (text.includes('saque') || text.includes('ace')) return 'SERVE';
  if (text.includes('ataque') || text.includes('eficiencia') || text.includes('bloque')) return 'ATTACK';
  return 'GENERAL';
}

function distributeDurations(total: number): [number, number, number, number, number] {
  const base = [
    Math.max(10, Math.round(total * 0.15)),
    Math.max(15, Math.round(total * 0.25)),
    Math.max(15, Math.round(total * 0.25)),
    Math.max(15, Math.round(total * 0.25)),
  ];
  const used = base.reduce((sum, value) => sum + value, 0);
  const last = Math.max(5, total - used);
  return [base[0], base[1], base[2], base[3], last];
}

export function buildTrainingExercises(problem: string, durationMin: number): TrainingExercise[] {
  const focus = classifyTrainingFocus(problem);
  const d = distributeDurations(durationMin);
  const id = (index: number) => `exercise_${focus.toLowerCase()}_${index}`;

  if (focus === 'SIDEOUT') {
    return [
      { id: id(1), block: 'Calentamiento', name: 'Activación con lectura de primera pelota', durationMin: d[0], description: 'Movilidad dinámica y secuencias de desplazamiento receptor-armador-atacante sin oposición.', courtFocus: 'Cancha completa', keyObjective: 'Preparar patrones de salida de recepción' },
      { id: id(2), block: 'Recepción', name: 'Recepción dirigida con rotación objetivo', durationMin: d[1], description: `Trabajo de primera pelota priorizando el contexto detectado: ${problem}`, courtFocus: 'Rotación objetivo y corredores de recepción', keyObjective: 'Mejorar calidad de la primera pelota' },
      { id: id(3), block: 'Side-out', name: 'K1 por rotación con decisión del armador', durationMin: d[2], description: 'Secuencias saque-recepción-armado-ataque, registrando resolución y repitiendo la rotación objetivo.', courtFocus: 'Rotación objetivo en cancha completa', keyObjective: 'Aumentar resolución de Side-out' },
      { id: id(4), block: 'Juego condicionado', name: '6 vs 6 con foco en Side-out', durationMin: d[3], description: 'El punto comienza siempre con saque rival. Se registra si el equipo resuelve el K1 en la primera secuencia.', courtFocus: 'Cancha completa', keyObjective: 'Transferir la mejora a contexto competitivo' },
      { id: id(5), block: 'Cierre', name: 'Repaso de la rotación y feedback', durationMin: d[4], description: 'Serie corta de rallies y revisión del criterio técnico-táctico trabajado.', courtFocus: 'Rotación objetivo', keyObjective: 'Consolidar decisiones' },
    ];
  }

  if (focus === 'RECEPTION') {
    return [
      { id: id(1), block: 'Calentamiento', name: 'Activación de plataforma y desplazamientos', durationMin: d[0], description: 'Movilidad, control de plataforma y lectura temprana de trayectoria.', courtFocus: 'Fondo de cancha', keyObjective: 'Estabilidad y lectura visual' },
      { id: id(2), block: 'Recepción', name: 'Recepción específica según evidencia', durationMin: d[1], description: `Recrear el patrón observado sin inventar variables adicionales: ${problem}`, courtFocus: 'Zonas y receptoras involucradas', keyObjective: 'Reducir recepciones negativas' },
      { id: id(3), block: 'Side-out', name: 'Recepción + K1 inmediato', durationMin: d[2], description: 'Cada recepción continúa obligatoriamente con armado y ataque para medir transferencia al Side-out.', courtFocus: 'Cancha completa', keyObjective: 'Conectar recepción con resolución ofensiva' },
      { id: id(4), block: 'Juego condicionado', name: '6 vs 6 con saque dirigido', durationMin: d[3], description: 'Saque competitivo dirigido a las zonas observadas en la evidencia; registrar la calidad de recepción.', courtFocus: 'Cancha completa', keyObjective: 'Validar la mejora bajo presión' },
      { id: id(5), block: 'Cierre', name: 'Serie final de recepción objetivo', durationMin: d[4], description: 'Bloque breve para comprobar estabilidad técnica al final de la sesión.', courtFocus: 'Zona objetivo', keyObjective: 'Consolidar consistencia' },
    ];
  }

  if (focus === 'SERVE') {
    return [
      { id: id(1), block: 'Calentamiento', name: 'Activación de hombro y cadena de saque', durationMin: d[0], description: 'Movilidad específica, lanzamientos y progresión técnica sin máxima potencia.', courtFocus: 'Zona de saque', keyObjective: 'Preparar gesto y control' },
      { id: id(2), block: 'Saque', name: 'Precisión por zona', durationMin: d[1], description: `Trabajo técnico vinculado al problema observado: ${problem}`, courtFocus: 'Z1–Z6 marcadas como objetivos', keyObjective: 'Aumentar precisión con menor error' },
      { id: id(3), block: 'Saque', name: 'Saque bajo consigna táctica', durationMin: d[2], description: 'Series con objetivo de zona y tipo de saque definidos por el cuerpo técnico.', courtFocus: 'Cancha completa', keyObjective: 'Repetibilidad táctica' },
      { id: id(4), block: 'Juego condicionado', name: '6 vs 6 iniciando con objetivo de saque', durationMin: d[3], description: 'Cada rally comienza con una consigna de saque y se registra el resultado de la recepción rival.', courtFocus: 'Cancha completa', keyObjective: 'Transferencia a partido' },
      { id: id(5), block: 'Cierre', name: 'Serie de control de error', durationMin: d[4], description: 'Secuencia final priorizando consistencia y rutina de saque.', courtFocus: 'Zona de saque', keyObjective: 'Estabilidad bajo fatiga' },
    ];
  }

  if (focus === 'ATTACK') {
    return [
      { id: id(1), block: 'Calentamiento', name: 'Activación de salto y brazo', durationMin: d[0], description: 'Progresión de carrera, salto y golpeo sin oposición.', courtFocus: 'Red completa', keyObjective: 'Preparación neuromuscular' },
      { id: id(2), block: 'Bloqueo/Defensa', name: 'Lectura de bloqueo y elección de golpe', durationMin: d[1], description: `Ejercicios orientados al problema observado: ${problem}`, courtFocus: 'Z2–Z4', keyObjective: 'Mejorar selección de solución' },
      { id: id(3), block: 'Side-out', name: 'Ataque tras recepción', durationMin: d[2], description: 'Secuencias completas de K1 con registro de punto, error y bloqueo sufrido.', courtFocus: 'Cancha completa', keyObjective: 'Mejorar eficiencia de ataque' },
      { id: id(4), block: 'Juego condicionado', name: '6 vs 6 con control de eficiencia', durationMin: d[3], description: 'Se registra cada ataque para comparar puntos, errores y bloqueos durante el juego.', courtFocus: 'Cancha completa', keyObjective: 'Transferir eficiencia a competencia' },
      { id: id(5), block: 'Cierre', name: 'Definición con objetivo técnico', durationMin: d[4], description: 'Serie corta de ataques con consigna técnica individual.', courtFocus: 'Red completa', keyObjective: 'Consolidar solución ofensiva' },
    ];
  }

  return [
    { id: id(1), block: 'Calentamiento', name: 'Activación general con balón', durationMin: d[0], description: 'Movilidad y control de balón orientados al objetivo de la sesión.', courtFocus: 'Cancha completa', keyObjective: 'Preparación general' },
    { id: id(2), block: 'Recepción', name: 'Trabajo técnico del problema', durationMin: d[1], description: problem, courtFocus: 'Zona definida por el cuerpo técnico', keyObjective: 'Aislar el problema observado' },
    { id: id(3), block: 'Side-out', name: 'Integración en secuencia de juego', durationMin: d[2], description: 'Integrar el foco técnico dentro de una secuencia real de juego.', courtFocus: 'Cancha completa', keyObjective: 'Transferencia progresiva' },
    { id: id(4), block: 'Juego condicionado', name: '6 vs 6 condicionado', durationMin: d[3], description: 'Juego con una regla específica para aumentar repeticiones del problema trabajado.', courtFocus: 'Cancha completa', keyObjective: 'Aplicación bajo presión' },
    { id: id(5), block: 'Cierre', name: 'Evaluación final', durationMin: d[4], description: 'Serie breve para revisar el criterio trabajado y registrar observaciones.', courtFocus: 'Cancha completa', keyObjective: 'Comprobar transferencia' },
  ];
}
