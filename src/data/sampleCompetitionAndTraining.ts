import { Competition, FixtureMatch, StandingEntry, TrainingSession, AiEvidenceInsight } from '../types';

export const sampleCompetitions: Competition[] = [
  {
    id: 'comp_metro_2026',
    name: 'Liga Metropolitana División de Honor',
    category: 'Primera División',
    gender: 'Femenino',
    format: 'groups_playoffs',
    teamsCount: 8,
    courtsCount: 2,
    status: 'active',
    pointsSystem: '3-1',
    teams: [
      'Club Ciudad de Campana',
      'Vélez Sarsfield',
      'Boca Juniors',
      'Gimnasia y Esgrima La Plata',
      'River Plate',
      'San Lorenzo',
      'Banco Provincia',
      'Estudiantes de La Plata'
    ],
    startDate: '2026-08-10',
    endDate: '2026-11-28'
  },
  {
    id: 'comp_sub18_clausura',
    name: 'Torneo Clausura Sub 18',
    category: 'Sub 18',
    gender: 'Femenino',
    format: 'round_robin',
    teamsCount: 6,
    courtsCount: 2,
    status: 'upcoming',
    pointsSystem: '3-1',
    teams: [
      'Club Ciudad de Campana',
      'Vélez Sarsfield',
      'Boca Juniors',
      'San Lorenzo',
      'River Plate',
      'Club Italiano'
    ],
    startDate: '2026-09-20',
    endDate: '2026-12-15'
  }
];

export const sampleFixtures: FixtureMatch[] = [
  {
    id: 'fix_1',
    competitionId: 'comp_metro_2026',
    roundName: 'Fecha 6',
    date: '2026-09-12',
    time: '20:00',
    court: 'Cancha Principal (Campana)',
    homeTeam: 'Club Ciudad de Campana',
    awayTeam: 'Vélez Sarsfield',
    status: 'scheduled'
  },
  {
    id: 'fix_2',
    competitionId: 'comp_metro_2026',
    roundName: 'Fecha 6',
    date: '2026-09-12',
    time: '21:30',
    court: 'Microestadio Quinquela Martín',
    homeTeam: 'Boca Juniors',
    awayTeam: 'Gimnasia y Esgrima LP',
    status: 'scheduled'
  },
  {
    id: 'fix_3',
    competitionId: 'comp_metro_2026',
    roundName: 'Fecha 5',
    date: '2026-09-05',
    time: '20:00',
    court: 'Polideportivo San Lorenzo',
    homeTeam: 'San Lorenzo',
    awayTeam: 'Club Ciudad de Campana',
    scoreHomeSets: 1,
    scoreAwaySets: 3,
    setScores: '21-25, 25-23, 19-25, 22-25',
    status: 'finished'
  },
  {
    id: 'fix_4',
    competitionId: 'comp_metro_2026',
    roundName: 'Fecha 5',
    date: '2026-09-05',
    time: '21:00',
    court: 'Estadio Víctor Nethol',
    homeTeam: 'Gimnasia y Esgrima LP',
    awayTeam: 'River Plate',
    scoreHomeSets: 3,
    scoreAwaySets: 0,
    setScores: '25-18, 25-20, 25-17',
    status: 'finished'
  },
  {
    id: 'fix_5',
    competitionId: 'comp_metro_2026',
    roundName: 'Fecha 7',
    date: '2026-09-19',
    time: '19:30',
    court: 'Microestadio River Plate',
    homeTeam: 'River Plate',
    awayTeam: 'Club Ciudad de Campana',
    status: 'scheduled'
  }
];

export const sampleStandings: StandingEntry[] = [
  { position: 1, teamName: 'Boca Juniors', played: 5, won: 5, lost: 0, setsWon: 15, setsLost: 3, points: 14, streak: 'G-G-G-G-G' },
  { position: 2, teamName: 'Club Ciudad de Campana', played: 5, won: 4, lost: 1, setsWon: 13, setsLost: 6, points: 12, streak: 'G-G-P-G-G' },
  { position: 3, teamName: 'Gimnasia y Esgrima LP', played: 5, won: 4, lost: 1, setsWon: 12, setsLost: 5, points: 11, streak: 'P-G-G-G-G' },
  { position: 4, teamName: 'Vélez Sarsfield', played: 5, won: 3, lost: 2, setsWon: 11, setsLost: 8, points: 9, streak: 'G-P-G-P-G' },
  { position: 5, teamName: 'San Lorenzo', played: 5, won: 2, lost: 3, setsWon: 8, setsLost: 10, points: 6, streak: 'G-P-P-G-P' },
  { position: 6, teamName: 'River Plate', played: 5, won: 1, lost: 4, setsWon: 6, setsLost: 13, points: 4, streak: 'P-G-P-P-P' },
  { position: 7, teamName: 'Banco Provincia', played: 5, won: 1, lost: 4, setsWon: 4, setsLost: 12, points: 3, streak: 'P-P-P-P-G' },
  { position: 8, teamName: 'Estudiantes de La Plata', played: 5, won: 0, lost: 5, setsWon: 2, setsLost: 15, points: 1, streak: 'P-P-P-P-P' }
];

export const sampleTrainingSessions: TrainingSession[] = [
  {
    id: 'train_1',
    title: 'Ajuste de Recepción Zona 5 y Transición R4',
    date: '2026-09-10',
    time: '19:00',
    durationMin: 90,
    playersCount: 14,
    focusProblem: 'Recepción en zona 5 cayó 18% frente a saques flotados dirigidos',
    linkedMatchId: 'm1',
    status: 'planned',
    notes: 'Priorizar ángulo de plataforma antes de contactar y comunicación líbero-punta.',
    exercises: [
      {
        id: 'ex_1',
        block: 'Calentamiento',
        name: 'Activación de cadera, tren inferior y desplazamientos laterales',
        durationMin: 15,
        description: 'Movilidad articular, ejercicios con bandas elásticas y sombras de recepción en 3 direcciones.',
        courtFocus: 'Línea de fondo completa',
        keyObjective: 'Preparación neuromuscular y velocidad de lectura inicial'
      },
      {
        id: 'ex_2',
        block: 'Recepción',
        name: 'Entrenamiento condicionado de recepción en Zona 5 vs dos sacadores flotados',
        durationMin: 25,
        description: 'Dos sacadores desde zona 1 rival alternan trayectorias cortas y profundas hacia zona 5. La receptora debe entregar el 70% de balones positivos (+) a zona 3.',
        courtFocus: 'Zona 5 y 6 con delimitación visual con conos',
        keyObjective: 'Fijar hombros hacia el objetivo y amortiguar el balón flotante'
      },
      {
        id: 'ex_3',
        block: 'Side-out',
        name: 'Simulación de Side-Out en Rotación 4 (R4)',
        durationMin: 25,
        description: 'Comenzar en R4 obligatoria. Recepción bajo presión con salida de ataque prioritaria por punta y zaguero.',
        courtFocus: 'Media cancha en R4 con bloqueo rival colocado',
        keyObjective: 'Mejorar el porcentaje de Side-Out en la rotación más vulnerable'
      },
      {
        id: 'ex_4',
        block: 'Juego condicionado',
        name: '6 vs 6 con punto doble por Side-Out en R4 y R5',
        durationMin: 20,
        description: 'Partido de 15 puntos donde la rotación que anota de Side-Out en su primer intento recibe 2 puntos.',
        courtFocus: 'Cancha completa',
        keyObjective: 'Transferencia al contexto real de competición con presión psicológica'
      },
      {
        id: 'ex_5',
        block: 'Cierre',
        name: 'Saques tácticos de precisión y vuelta a la calma',
        durationMin: 5,
        description: '10 saques por jugadora a zonas designadas (1 y 5). Estiramientos estáticos.',
        courtFocus: 'Zonas de saque',
        keyObjective: 'Consolidación técnica en estado de fatiga'
      }
    ]
  }
];

export const sampleAiEvidenceInsights: AiEvidenceInsight[] = [
  {
    id: 'ins_1',
    type: 'INSIGHT',
    category: 'CRÍTICO',
    title: '48% de tus errores no forzados ocurrieron después del punto 20',
    description: 'En los sets 1 y 3 se concentraron 9 de los 17 errores totales en el tramo de definición (puntos 20-25). La efectividad de ataque cayó de 54% a 29% en situaciones de cierre.',
    evidenceSource: 'Basado en: 5 partidos analizados, 322 rallies',
    evidenceCount: 322,
    actionLabel: 'Generar Entrenamiento de Cierre',
    actionType: 'generate_training'
  },
  {
    id: 'ins_2',
    type: 'INSIGHT',
    category: 'TENDENCIA',
    title: 'El Side-Out del equipo mejoró +8% en los últimos 4 partidos',
    description: 'La salida de recepción creció de 51% a 59% global gracias a la consistencia del primer tiempo por zona 3 con Polinisky.',
    evidenceSource: 'Basado en: 4 partidos de liga, 184 rotaciones',
    evidenceCount: 184,
    actionLabel: 'Ver Análisis Táctico',
    actionType: 'view_analysis'
  },
  {
    id: 'ins_3',
    type: 'INSIGHT',
    category: 'RIVAL',
    title: 'Vélez Sarsfield dirige el 61% de sus saques a zona 5',
    description: 'Su armadora y opuesta sacan preferentemente con flotado buscando el conflicto entre punta receptora y líbero en el fondo izquierdo.',
    evidenceSource: 'Basado en: 3 partidos observados del rival, 118 saques',
    evidenceCount: 118,
    actionLabel: 'Ver Video de Saques Rival',
    actionType: 'view_video'
  },
  {
    id: 'ins_4',
    type: 'INSIGHT',
    category: 'JUGADOR',
    title: 'Lucia Fernandez (#7) mejoró +11% de eficiencia en recepción positiva',
    description: 'Subió de 49% a 60% de recepciones dobles positivas (+ / #) permitiendo mayor juego con centrales.',
    evidenceSource: 'Basado en: 5 partidos, 74 recepciones evaluadas',
    evidenceCount: 74,
    playerNumRef: 7,
    actionLabel: 'Ver Ficha Player 360',
    actionType: 'view_players'
  }
];

export const sampleAiInsights = sampleAiEvidenceInsights;
