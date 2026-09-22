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
  /** Serving state immediately before this action, used for exact rally undo. */
  servingTeam?: TeamSide;
  serverNum?: number;
  /** Physical libero state immediately before this action, used for exact undo. */
  liberoReplacements?: MatchData['liberoReplacements'];
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
  /** Physical libero replacement; rotation itself always keeps the rotational player. */
  liberoReplacements?: Partial<Record<TeamSide, { liberoNum: number; replacedPlayerNum: number }>>;
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
  block: 'Calentamiento' | 'Recepción' | 'Side-out' | 'Juego condicionado' | 'Cierre' | 'Bloqueo/Defensa' | 'Saque' | 'Ataque';
  name: string;
  durationMin: number;
  description: string;
  courtFocus: string;
  keyObjective: string;
}

export interface TrainingEvidenceContext {
  insightId?: string;
  title: string;
  description: string;
  evidenceSource?: string;
  evidenceCount?: number;
  rallyIds?: string[];
  rotationRef?: number;
  category?: 'rotation_sideout' | 'serve_reception' | 'attack' | 'serve' | 'reception' | 'generic';
  metric?: TrainingPerformanceTarget['metric'];
  serveType?: ScoutCodeAction['serveType'];
  zoneRef?: number;
  teamSide?: TeamSide;
}

export interface TrainingPerformanceTarget {
  metric: 'sideout_pct' | 'reception_negative_pct' | 'attack_efficiency_pct' | 'serve_efficiency_pct' | 'manual';
  label: string;
  teamSide: TeamSide;
  baselineValue?: number;
  baselineSample?: number;
  rotationRef?: number;
  serveType?: ScoutCodeAction['serveType'];
  zoneRef?: number;
  sourceMatchId?: string;
  sourceMatchDate?: string;
  sourceTeamName?: string;
  sourceInsightId?: string;
  sourceRallyIds?: string[];
}

export interface PerformanceFollowUpResult {
  status: 'improved' | 'declined' | 'stable' | 'insufficient_data' | 'not_comparable';
  label: string;
  baselineValue?: number;
  currentValue?: number;
  delta?: number;
  baselineSample?: number;
  currentSample?: number;
  message: string;
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
  performanceTarget?: TrainingPerformanceTarget;
  exercises: TrainingExercise[];
  notes?: string;
  status: 'planned' | 'completed';
  completed?: boolean;
}

export interface SmartSportsMontage {
  id: string;
  name: string;
  matchId: string;
  matchTitle: string;
  createdAt: string;
  updatedAt: string;
  preRoll: number;
  postRoll: number;
  actionIds: string[];
  /** Optional index metadata for library browsing; legacy montages remain valid. */
  playerNums?: number[];
  playerNames?: string[];
  skills?: VolleySkill[];
  teamSides?: TeamSide[];
  recipientType?: 'player' | 'team' | 'staff';
  recipientLabel?: string;
  coachNote?: string;
  shareTitle?: string;
  readyToShare?: boolean;
  recipientEmail?: string;
  publishedAt?: string;
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
  performanceMetric?: TrainingPerformanceTarget['metric'];
  serveTypeRef?: ScoutCodeAction['serveType'];
  zoneRef?: number;
  /** Exact rallies supporting the finding; used to jump from insight to evidence. */
  rallyIds?: string[];
}

