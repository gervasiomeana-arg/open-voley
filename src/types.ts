export type TeamSide = 'home' | 'away';

export type VolleySkill = 'S' | 'R' | 'E' | 'A' | 'B' | 'D' | 'F'; 
// S=Serve, R=Reception, E=Setting(Set), A=Attack, B=Block, D=Dig/Defense, F=Freeball

export type EvaluationSymbol = '#' | '+' | '!' | '-' | '/' | '=';
/*
  # = Perfect / Point (Win point)
  + = Positive / Good
  ! = Neutral / Combination
  - = Negative / Poor
  / = Blocked (for attack) / Invasión
  = = Error (Lost point / Out / Net)
*/

export interface CourtPoint {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  zone?: number; // 1 to 9
  subzone?: 'A' | 'B' | 'C' | 'D';
}

export interface ScoutCodeAction {
  id: string;
  rawCode: string;
  team: TeamSide;
  playerNum: number;
  playerName?: string;
  skill: VolleySkill;
  evaluation: EvaluationSymbol;
  startZone?: number;
  endZone?: number;
  startSubzone?: string;
  endSubzone?: string;
  timestamp: number; // video timestamp in seconds
  setNumber: number;
  scoreHome: number;
  scoreAway: number;
  rotationHome: number[]; // e.g. [1, 6, 5, 4, 3, 2]
  rotationAway: number[];
  description: string;
  /**
   * Optional structured rally context. New scouting can populate these fields
   * progressively; legacy matches remain compatible because every field is optional.
   */
  rallyId?: string;
  rallySequence?: number;
  phase?: 'K1' | 'K2' | 'K3' | 'transition' | 'unknown';
  serveType?: 'float' | 'jump_float' | 'jump_spin' | 'standing' | 'unknown';
  receptionContext?: 'positive' | 'negative' | 'freeball' | 'unknown';
}

export type UserRole = 'Entrenador' | 'Jugador' | 'Analista' | 'Organizador' | 'Club' | 'Asistente' | 'Administrador';

export interface Player {
  id: string;
  number: number;
  name: string;
  position: 'OH' | 'MB' | 'OPP' | 'S' | 'L'; // Outside Hitter, Middle Blocker, Opposite, Setter, Libero
  team: TeamSide;
  starter: boolean;
  heightCm?: number;
  weightKg?: number;
  spikeReachCm?: number;
  blockReachCm?: number;
  age?: number;
  dominantHand?: 'Derecha' | 'Izquierda';
  availability?: 'disponible' | 'duda' | 'baja' | 'en_recuperacion';
  hittingStyle?: string; // Forma de golpear la pelota / Técnica
  kinesiologyNotes?: string; // Ficha de Kinesiología y Lesiones
  nutritionNotes?: string; // Plan de Nutrición y Suplementación
  notes?: string; // Observaciones Tácticas Generales
}

export interface MatchSet {
  setNumber: number;
  scoreHome: number;
  scoreAway: number;
  winner?: TeamSide;
}

export interface MatchData {
  id: string;
  title: string;
  date: string;
  competition: string;
  category?: string;
  venue?: string;
  homeTeamName: string;
  awayTeamName: string;
  currentSet: number;
  sets: MatchSet[];
  homePlayers: Player[];
  awayPlayers: Player[];
  actions: ScoutCodeAction[];
  homeRotation: number[]; // player numbers in positions [P1, P2, P3, P4, P5, P6]
  awayRotation: number[];
  server: { team: TeamSide; playerNum: number };
  winner?: TeamSide;
  isFinished?: boolean;
  isPrepared?: boolean;
  status?: 'scheduled' | 'prepared' | 'in_progress' | 'finished' | 'analyzed';
}

export interface PlayerStats {
  playerNum: number;
  name: string;
  position: string;
  team: TeamSide;
  // Serve
  serveTotal: number;
  serveAce: number;
  serveErr: number;
  // Reception
  recTotal: number;
  recPerfect: number; // #
  recPositive: number; // +
  recErr: number; // =
  recPosPct: number;
  recPerfPct: number;
  // Attack
  attTotal: number;
  attPts: number; // #
  attErr: number; // =
  attBlocked: number; // /
  attEffPct: number; // (Pts - Err - Blocked) / Total * 100
  // Block
  blockPts: number;
  // Digs
  digTotal: number;
}

export interface ClientUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  firstLoginDate: string; // ISO string
  lastLoginDate: string; // ISO string
  trialDurationDays: number; // default 30
  customGrantedDays?: number;
  isBlocked?: boolean;
  club?: string;
  role?: string;
  phone?: string;
  notes?: string;
}

export interface VisitorLead {
  id: string;
  timestamp: string;
  domain: string;
  page: string;
  deviceType: string;
  action: string;
  userAgent?: string;
  emailHint?: string;
}

export interface TrialInfo {
  daysRemaining: number;
  isExpired: boolean;
  firstLoginDate: string;
  totalAllowedDays: number;
  elapsedDays: number;
}

export interface RallyDetection {
  id: string;
  timestampStart: number;
  timestampEnd: number;
  durationSec: number;
  servingTeam: TeamSide;
  serverNum: number;
  attackingTeam: TeamSide;
  attackerNum: number;
  result: 'home_point' | 'away_point';
  confidenceScore: number;
  ballMaxSpeedKmh: number;
  spikeReachM: number;
  detectedCode: string;
  phase: 'Saque' | 'Recepción' | 'Armado' | 'Ataque' | 'Bloqueo' | 'Punto';
  notes?: string;
}

export interface Competition {
  id: string;
  name: string;
  category: string;
  gender: 'Femenino' | 'Masculino' | 'Mixto';
  format: 'round_robin' | 'groups_playoffs' | 'single_elimination';
  teamsCount: number;
  courtsCount: number;
  status: 'active' | 'upcoming' | 'finished';
  pointsSystem: '3-1' | '2-1';
  teams: string[];
  startDate: string;
  endDate: string;
}

export interface FixtureMatch {
  id: string;
  competitionId: string;
  roundName: string;
  date: string;
  time: string;
  court: string;
  homeTeam: string;
  awayTeam: string;
  scoreHomeSets?: number;
  scoreAwaySets?: number;
  setScores?: string;
  status: 'scheduled' | 'live' | 'finished';
}

export interface StandingEntry {
  position: number;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  points: number;
  streak: string;
}

export interface TrainingExercise {
  id: string;
  block: 'Calentamiento' | 'Recepción' | 'Side-out' | 'Juego condicionado' | 'Cierre' | 'Bloqueo/Defensa' | 'Saque';
  name: string;
  durationMin: number;
  description: string;
  courtFocus: string;
  keyObjective: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMin: number;
  playersCount: number;
  focusProblem: string;
  linkedMatchId?: string;
  exercises: TrainingExercise[];
  notes?: string;
  status: 'planned' | 'completed';
  completed?: boolean;
}

export interface AiEvidenceInsight {
  id: string;
  type: 'HECHO' | 'INSIGHT' | 'RECOMENDACIÓN';
  category: 'CRÍTICO' | 'TENDENCIA' | 'RIVAL' | 'JUGADOR';
  title: string;
  description: string;
  evidenceSource: string;
  evidenceCount: number;
  actionLabel?: string;
  actionType?: 'view_video' | 'generate_training' | 'view_players' | 'view_analysis';
  rotationRef?: number;
  playerNumRef?: number;
  /** Exact rallies supporting the finding; used to jump from insight to evidence. */
  rallyIds?: string[];
}

