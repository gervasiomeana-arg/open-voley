import { Player, TeamSide, MatchData, ScoutCodeAction } from '../types';

export interface SavedTeam {
  id: string;
  name: string;
  shortName: string;
  category: string; // e.g. "Primera División", "Sub 18", "Sub 16", "Sub 21"
  gender: 'Femenino' | 'Masculino' | 'Mixto';
  type: 'my_team' | 'opponent'; // Equipo propio vs Rival
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedMatchRecord {
  id: string;
  title: string;
  competition: string;
  date: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId?: string;
  awayTeamId?: string;
  finalScore: string;
  videoSrc?: string;
  videoFileName?: string;
  matchData: MatchData;
  userCuts?: ScoutCodeAction[];
  actionsCount?: number;
  status?: string;
  updatedAt: string;
}

const STORAGE_TEAMS_KEY = 'openvoley_saved_teams_v1';
const STORAGE_MATCHES_KEY = 'openvoley_saved_matches_v1';

// Initial default teams for new users
const DEFAULT_SAVED_TEAMS: SavedTeam[] = [
  {
    id: 'team_my_default',
    name: 'Club Ciudad de Campana',
    shortName: 'Campana',
    category: 'Sub 18',
    gender: 'Femenino',
    type: 'my_team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    players: [
      { id: 'p_my_1', number: 1, name: 'Camila Rodriguez', position: 'S', team: 'home', starter: true, heightCm: 178, spikeReachCm: 290, blockReachCm: 275 },
      { id: 'p_my_7', number: 7, name: 'Lucia Fernandez', position: 'OH', team: 'home', starter: true, heightCm: 184, spikeReachCm: 305, blockReachCm: 292 },
      { id: 'p_my_9', number: 9, name: 'Sofia Martinez', position: 'OPP', team: 'home', starter: true, heightCm: 186, spikeReachCm: 310, blockReachCm: 295 },
      { id: 'p_my_11', number: 11, name: 'Valentina Gomez', position: 'MB', team: 'home', starter: true, heightCm: 188, spikeReachCm: 312, blockReachCm: 300 },
      { id: 'p_my_14', number: 14, name: 'Martina Benitez', position: 'OH', team: 'home', starter: true, heightCm: 182, spikeReachCm: 300, blockReachCm: 288 },
      { id: 'p_my_16', number: 16, name: 'Abril Morales', position: 'MB', team: 'home', starter: true, heightCm: 187, spikeReachCm: 308, blockReachCm: 298 },
      { id: 'p_my_4', number: 4, name: 'Catalina Sosa', position: 'L', team: 'home', starter: true, heightCm: 166, spikeReachCm: 260, blockReachCm: 250 },
      { id: 'p_my_2', number: 2, name: 'Julieta Vega', position: 'S', team: 'home', starter: false, heightCm: 175 },
      { id: 'p_my_5', number: 5, name: 'Milagros Rossi', position: 'OH', team: 'home', starter: false, heightCm: 180 },
      { id: 'p_my_8', number: 8, name: 'Paula Silva', position: 'MB', team: 'home', starter: false, heightCm: 185 },
      { id: 'p_my_12', number: 12, name: 'Florencia Rios', position: 'OPP', team: 'home', starter: false, heightCm: 183 },
      { id: 'p_my_15', number: 15, name: 'Zoe Albornoz', position: 'L', team: 'home', starter: false, heightCm: 168 }
    ]
  },
  {
    id: 'team_opp_velez',
    name: 'Vélez Sarsfield',
    shortName: 'Vélez',
    category: 'Sub 18',
    gender: 'Femenino',
    type: 'opponent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    players: [
      { id: 'p_opp_1', number: 1, name: 'M. Curatola', position: 'S', team: 'away', starter: true, heightCm: 176 },
      { id: 'p_opp_3', number: 3, name: 'S. Garcia', position: 'OH', team: 'away', starter: true, heightCm: 182 },
      { id: 'p_opp_5', number: 5, name: 'L. Perez', position: 'MB', team: 'away', starter: true, heightCm: 185 },
      { id: 'p_opp_8', number: 8, name: 'C. Romero', position: 'OPP', team: 'away', starter: true, heightCm: 184 },
      { id: 'p_opp_10', number: 10, name: 'A. Gonzalez', position: 'OH', team: 'away', starter: true, heightCm: 180 },
      { id: 'p_opp_12', number: 12, name: 'V. Lopez', position: 'MB', team: 'away', starter: true, heightCm: 186 },
      { id: 'p_opp_2', number: 2, name: 'D. Moretti', position: 'L', team: 'away', starter: true, heightCm: 165 },
      { id: 'p_opp_6', number: 6, name: 'R. Alvarez', position: 'S', team: 'away', starter: false },
      { id: 'p_opp_9', number: 9, name: 'N. Diaz', position: 'OH', team: 'away', starter: false },
      { id: 'p_opp_14', number: 14, name: 'T. Herrera', position: 'MB', team: 'away', starter: false }
    ]
  },
  {
    id: 'team_opp_boca',
    name: 'Boca Juniors',
    shortName: 'Boca',
    category: 'Primera División',
    gender: 'Femenino',
    type: 'opponent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    players: [
      { id: 'p_boc_1', number: 1, name: 'Capitana Boca', position: 'OH', team: 'away', starter: true },
      { id: 'p_boc_3', number: 3, name: 'Armadora Boca', position: 'S', team: 'away', starter: true },
      { id: 'p_boc_7', number: 7, name: 'Central Boca 1', position: 'MB', team: 'away', starter: true },
      { id: 'p_boc_9', number: 9, name: 'Opuesta Boca', position: 'OPP', team: 'away', starter: true },
      { id: 'p_boc_11', number: 11, name: 'Punta Boca 2', position: 'OH', team: 'away', starter: true },
      { id: 'p_boc_15', number: 15, name: 'Central Boca 2', position: 'MB', team: 'away', starter: true },
      { id: 'p_boc_5', number: 5, name: 'Líbero Boca', position: 'L', team: 'away', starter: true }
    ]
  }
];

// Helper to get saved teams
export function getSavedTeams(): SavedTeam[] {
  try {
    const raw = localStorage.getItem(STORAGE_TEAMS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(DEFAULT_SAVED_TEAMS));
      return DEFAULT_SAVED_TEAMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SAVED_TEAMS;
  } catch (err) {
    console.warn('Error reading saved teams, returning defaults:', err);
    return DEFAULT_SAVED_TEAMS;
  }
}

// Helper to save or update a team
export function saveTeam(team: SavedTeam): SavedTeam[] {
  const current = getSavedTeams();
  const index = current.findIndex((t) => t.id === team.id);
  let updated: SavedTeam[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...team, updatedAt: new Date().toISOString() };
  } else {
    updated = [team, ...current];
  }
  try {
    localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving teams:', err);
  }
  return updated;
}

// Helper to delete a team
export function deleteSavedTeam(id: string): SavedTeam[] {
  const current = getSavedTeams();
  const updated = current.filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting team:', err);
  }
  return updated;
}

// Helper to parse roster from text (WhatsApp / Excel list)
export function parseRosterFromText(text: string, teamSide: TeamSide = 'home'): Player[] {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n');
  const players: Player[] = [];
  let currentNum = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: Starts with a number, e.g. "7 Lopez Martina Punta" or "#12 Gomez Central"
    const numberMatch = trimmed.match(/^#?(\d{1,2})[\s\-.:\)\/]+(.+)$/);
    let num = currentNum;
    let rest = trimmed;

    if (numberMatch) {
      num = parseInt(numberMatch[1], 10);
      rest = numberMatch[2].trim();
    } else {
      // Check if number is at the end: "Sofia Gomez 14"
      const endNumberMatch = trimmed.match(/^(.+?)[\s\-]+#?(\d{1,2})$/);
      if (endNumberMatch) {
        rest = endNumberMatch[1].trim();
        num = parseInt(endNumberMatch[2], 10);
      }
    }

    // Detect Position in rest
    let position: Player['position'] = 'OH';
    let isStarter = players.length < 6;
    let cleanName = rest;

    const lower = rest.toLowerCase();
    if (lower.includes('libero') || lower.includes('líbero') || /\b(l)\b/i.test(rest)) {
      position = 'L';
      cleanName = cleanName.replace(/líbero|libero|\bL\b/gi, '').trim();
    } else if (lower.includes('armador') || lower.includes('armadora') || /\b(s)\b/i.test(rest) || lower.includes('setter')) {
      position = 'S';
      cleanName = cleanName.replace(/armador[a]?|setter|\bS\b/gi, '').trim();
    } else if (lower.includes('opuesto') || lower.includes('opuesta') || /\b(opp)\b/i.test(rest)) {
      position = 'OPP';
      cleanName = cleanName.replace(/opuest[oa]|\bOPP\b/gi, '').trim();
    } else if (lower.includes('central') || /\b(mb)\b/i.test(rest) || lower.includes('medio')) {
      position = 'MB';
      cleanName = cleanName.replace(/central|medio|\bMB\b/gi, '').trim();
    } else if (lower.includes('punta') || lower.includes('receptor') || /\b(oh)\b/i.test(rest)) {
      position = 'OH';
      cleanName = cleanName.replace(/punta|receptor[a]?|\bOH\b/gi, '').trim();
    }

    // Clean any parentheses, trailing commas or dashes
    cleanName = cleanName.replace(/[()\[\],;]/g, '').trim();
    if (!cleanName) {
      cleanName = `Jugador #${num}`;
    }

    players.push({
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      number: num,
      name: cleanName,
      position,
      team: teamSide,
      starter: isStarter,
      heightCm: position === 'MB' ? 188 : position === 'L' ? 168 : 182,
    });

    currentNum = num + 1;
  }

  return players;
}

// -------------------------------------------------------------
// SAVED MATCHES HISTORY
// -------------------------------------------------------------

export function getSavedMatches(): SavedMatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_MATCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error reading saved matches:', err);
    return [];
  }
}

export function saveMatchRecord(record: SavedMatchRecord): SavedMatchRecord[] {
  const current = getSavedMatches();
  const index = current.findIndex((m) => m.id === record.id);
  let updated: SavedMatchRecord[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    updated = [record, ...current];
  }
  try {
    localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving match record:', err);
  }
  return updated;
}

export function deleteSavedMatchRecord(id: string): SavedMatchRecord[] {
  const current = getSavedMatches();
  const updated = current.filter((m) => m.id !== id);
  try {
    localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting match record:', err);
  }
  return updated;
}

// -------------------------------------------------------------
// CURRENT ACTIVE MATCH PERSISTENCE
// -------------------------------------------------------------

export const STORAGE_CURRENT_MATCH_KEY = 'openvoley_current_match_v1';

export function getCurrentMatch(): MatchData | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_MATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.homeTeamName && parsed.awayTeamName) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Error reading current match from storage:', err);
    return null;
  }
}

export function saveCurrentMatch(match: MatchData): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_MATCH_KEY, JSON.stringify(match));
  } catch (err) {
    console.warn('Error saving current match to storage:', err);
  }
}

export function clearCurrentMatch(): void {
  try {
    localStorage.removeItem(STORAGE_CURRENT_MATCH_KEY);
  } catch (err) {
    console.warn('Error clearing current match from storage:', err);
  }
}
