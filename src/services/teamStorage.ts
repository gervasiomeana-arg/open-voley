import { userStorage } from './userStorage';
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

// Helper to get saved teams with automatic recovery from all storage scopes
export function getSavedTeams(): SavedTeam[] {
  try {
    const raw = userStorage.getItem(STORAGE_TEAMS_KEY);
    let currentTeams: SavedTeam[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentTeams = parsed;
        }
      } catch {}
    }

    // Recover from all localStorage keys (legacy, guest, other scopes, match rosters)
    const allRecovered = collectAllStoredTeams(currentTeams);
    if (allRecovered.length > 0) {
      // If recovered list contains custom teams or more players than currentTeams, persist
      const hasCustom = allRecovered.some((t) => !isDefaultTeamId(t.id) || t.players.length > 12);
      if (hasCustom || currentTeams.length === 0) {
        try {
          userStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(allRecovered));
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(allRecovered));
            localStorage.setItem('ov-user:guest:' + STORAGE_TEAMS_KEY, JSON.stringify(allRecovered));
          }
        } catch {}
      }
      return allRecovered;
    }

    if (currentTeams.length > 0) return currentTeams;
    userStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(DEFAULT_SAVED_TEAMS));
    return DEFAULT_SAVED_TEAMS;
  } catch (err) {
    console.warn('Error reading saved teams, returning defaults:', err);
    return DEFAULT_SAVED_TEAMS;
  }
}

function isDefaultTeamId(id: string): boolean {
  return id === 'team_my_default' || id === 'team_opp_velez' || id === 'team_opp_boca';
}

function mergePlayersList(existing: Player[], incoming: Player[]): Player[] {
  const map = new Map<string, Player>();
  for (const p of existing) {
    if (p && typeof p.name === 'string') {
      const key = `${p.number || 0}_${p.name.toLowerCase().trim()}`;
      map.set(key, p);
    }
  }
  for (const p of incoming) {
    if (p && typeof p.name === 'string') {
      const key = `${p.number || 0}_${p.name.toLowerCase().trim()}`;
      if (!map.has(key)) {
        map.set(key, p);
      } else {
        const cur = map.get(key)!;
        map.set(key, { ...cur, ...p });
      }
    }
  }
  return [...map.values()];
}

function extractTeamsFromMatch(matchRecord: any, ingestFn: (teams: SavedTeam[]) => void) {
  if (!matchRecord) return;
  const matchData = matchRecord.matchData || matchRecord;
  if (!matchData) return;

  const homeName = (matchRecord.homeTeamName || matchData.homeTeamName || '').trim();
  const awayName = (matchRecord.awayTeamName || matchData.awayTeamName || '').trim();
  const homePlayers = Array.isArray(matchData.homePlayers) ? matchData.homePlayers : [];
  const awayPlayers = Array.isArray(matchData.awayPlayers) ? matchData.awayPlayers : [];

  const extracted: SavedTeam[] = [];
  if (homeName && homePlayers.length > 0) {
    extracted.push({
      id: matchRecord.homeTeamId || `team_ext_${homeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: homeName,
      shortName: homeName.substring(0, 8),
      category: matchData.category || 'Primera División',
      gender: 'Femenino',
      type: 'my_team',
      players: homePlayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  if (awayName && awayPlayers.length > 0) {
    extracted.push({
      id: matchRecord.awayTeamId || `team_ext_${awayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: awayName,
      shortName: awayName.substring(0, 8),
      category: matchData.category || 'Primera División',
      gender: 'Femenino',
      type: 'opponent',
      players: awayPlayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  if (extracted.length > 0) {
    ingestFn(extracted);
  }
}

// Scans all storage keys to recover any teams or rosters created
export function collectAllStoredTeams(baseTeams: SavedTeam[] = []): SavedTeam[] {
  const allTeamsMap = new Map<string, SavedTeam>();

  // Initialize with base or default teams
  const initial = baseTeams.length > 0 ? baseTeams : DEFAULT_SAVED_TEAMS;
  for (const t of initial) {
    if (t && t.id) {
      allTeamsMap.set(t.id, { ...t, players: Array.isArray(t.players) ? [...t.players] : [] });
    }
  }

  const ingestTeams = (list: any[]) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || typeof item !== 'object' || typeof item.name !== 'string' || !item.name.trim()) continue;
      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const players = Array.isArray(item.players) ? item.players : [];

      const team: SavedTeam = {
        id,
        name: item.name.trim(),
        shortName: typeof item.shortName === 'string' && item.shortName ? item.shortName : item.name.trim().substring(0, 8),
        category: typeof item.category === 'string' ? item.category : 'Primera División',
        gender: (item.gender === 'Masculino' || item.gender === 'Mixto') ? item.gender : 'Femenino',
        type: item.type === 'opponent' ? 'opponent' : 'my_team',
        players,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };

      const existing = allTeamsMap.get(id);
      if (!existing) {
        // Check if there is an existing team with the exact same name
        const sameNameEntry = [...allTeamsMap.entries()].find(([_, t]) => t.name.toLowerCase().trim() === team.name.toLowerCase().trim());
        if (sameNameEntry) {
          const [exId, exTeam] = sameNameEntry;
          const mergedPlayers = mergePlayersList(exTeam.players, team.players);
          allTeamsMap.set(exId, {
            ...exTeam,
            ...team,
            id: exId,
            players: mergedPlayers,
          });
        } else {
          allTeamsMap.set(id, team);
        }
      } else {
        const mergedPlayers = mergePlayersList(existing.players, team.players);
        allTeamsMap.set(id, {
          ...existing,
          ...team,
          players: mergedPlayers,
        });
      }
    }
  };

  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Match saved_teams keys
      if (key.includes('saved_teams') || key === STORAGE_TEAMS_KEY) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) ingestTeams(JSON.parse(raw));
        } catch {}
      }

      // Match recovery checkpoint
      if (key.includes('recovery.previous')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const snap = JSON.parse(raw);
            if (snap?.previous?.[STORAGE_TEAMS_KEY]) {
              ingestTeams(JSON.parse(snap.previous[STORAGE_TEAMS_KEY]));
            }
          }
        } catch {}
      }

      // Match saved matches
      if (key.includes('saved_matches') || key === STORAGE_MATCHES_KEY) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const m of parsed) {
                extractTeamsFromMatch(m, ingestTeams);
              }
            }
          }
        } catch {}
      }

      // Match active match
      if (key.includes('current_match') || key === STORAGE_CURRENT_MATCH_KEY) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              extractTeamsFromMatch({ matchData: parsed, homeTeamName: parsed.homeTeamName, awayTeamName: parsed.awayTeamName }, ingestTeams);
            }
          }
        } catch {}
      }
    }
  }

  return [...allTeamsMap.values()];
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
    userStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
      localStorage.setItem('ov-user:guest:' + STORAGE_TEAMS_KEY, JSON.stringify(updated));
    }
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
    userStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_TEAMS_KEY, JSON.stringify(updated));
      localStorage.setItem('ov-user:guest:' + STORAGE_TEAMS_KEY, JSON.stringify(updated));
    }
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

export function collectAllStoredMatches(baseMatches: SavedMatchRecord[] = []): SavedMatchRecord[] {
  const allMatchesMap = new Map<string, SavedMatchRecord>();

  for (const m of baseMatches) {
    if (m && m.id) {
      allMatchesMap.set(m.id, m);
    }
  }

  const ingestMatches = (list: any[]) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const matchData = item.matchData || item;
      const homeTeamName = (item.homeTeamName || matchData.homeTeamName || '').trim();
      const awayTeamName = (item.awayTeamName || matchData.awayTeamName || '').trim();
      if (!homeTeamName || !awayTeamName) continue;

      const id = typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : (typeof matchData.id === 'string' && matchData.id.trim() ? matchData.id.trim() : `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

      const record: SavedMatchRecord = {
        id,
        title: item.title || `${homeTeamName} vs ${awayTeamName}`,
        competition: item.competition || matchData.competition || 'Torneo Oficial',
        date: item.date || matchData.date || new Date().toISOString().split('T')[0],
        homeTeamName,
        awayTeamName,
        homeTeamId: item.homeTeamId || matchData.homeTeamId,
        awayTeamId: item.awayTeamId || matchData.awayTeamId,
        finalScore: item.finalScore || '0 - 0',
        videoSrc: item.videoSrc,
        videoFileName: item.videoFileName,
        matchData: matchData,
        userCuts: Array.isArray(item.userCuts) ? item.userCuts : [],
        actionsCount: typeof item.actionsCount === 'number'
          ? item.actionsCount
          : (Array.isArray(matchData.actions) ? matchData.actions.length : 0),
        status: item.status || matchData.status || 'finished',
        updatedAt: item.updatedAt || new Date().toISOString(),
      };

      const existing = allMatchesMap.get(id);
      if (!existing) {
        // Also check if same home + away + date already exists
        const sameKeyEntry = [...allMatchesMap.entries()].find(([_, m]) =>
          m.homeTeamName.toLowerCase().trim() === homeTeamName.toLowerCase().trim() &&
          m.awayTeamName.toLowerCase().trim() === awayTeamName.toLowerCase().trim() &&
          m.date === record.date
        );
        if (sameKeyEntry) {
          const [exId, exMatch] = sameKeyEntry;
          if ((record.actionsCount || 0) > (exMatch.actionsCount || 0)) {
            allMatchesMap.set(exId, { ...exMatch, ...record, id: exId });
          }
        } else {
          allMatchesMap.set(id, record);
        }
      } else {
        if ((record.actionsCount || 0) >= (existing.actionsCount || 0)) {
          allMatchesMap.set(id, { ...existing, ...record });
        }
      }
    }
  };

  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.includes('saved_matches') || key === STORAGE_MATCHES_KEY) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) ingestMatches(JSON.parse(raw));
        } catch {}
      }

      if (key.includes('recovery.previous')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const snap = JSON.parse(raw);
            if (snap?.previous?.[STORAGE_MATCHES_KEY]) {
              ingestMatches(JSON.parse(snap.previous[STORAGE_MATCHES_KEY]));
            }
          }
        } catch {}
      }
    }
  }

  return [...allMatchesMap.values()];
}

export function getSavedMatches(): SavedMatchRecord[] {
  try {
    const raw = userStorage.getItem(STORAGE_MATCHES_KEY);
    let currentMatches: SavedMatchRecord[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          currentMatches = parsed;
        }
      } catch {}
    }

    const allRecovered = collectAllStoredMatches(currentMatches);
    if (allRecovered.length > currentMatches.length) {
      try {
        userStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(allRecovered));
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(allRecovered));
          localStorage.setItem('ov-user:guest:' + STORAGE_MATCHES_KEY, JSON.stringify(allRecovered));
        }
      } catch {}
      return allRecovered;
    }

    return currentMatches.length > 0 ? currentMatches : allRecovered;
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
    userStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(updated));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(updated));
      localStorage.setItem('ov-user:guest:' + STORAGE_MATCHES_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error saving match record:', err);
  }
  return updated;
}

export function deleteSavedMatchRecord(id: string): SavedMatchRecord[] {
  const current = getSavedMatches();
  const updated = current.filter((m) => m.id !== id);
  try {
    userStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(updated));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(updated));
      localStorage.setItem('ov-user:guest:' + STORAGE_MATCHES_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error deleting match record:', err);
  }
  return updated;
}

// -------------------------------------------------------------
// CURRENT ACTIVE MATCH PERSISTENCE
// -------------------------------------------------------------

export const STORAGE_CURRENT_MATCH_KEY = 'openvoley_current_match_v1';

function isValidMatchData(parsed: any): boolean {
  return (
    parsed &&
    typeof parsed === 'object' &&
    typeof parsed.homeTeamName === 'string' &&
    parsed.homeTeamName.trim().length > 0 &&
    typeof parsed.awayTeamName === 'string' &&
    parsed.awayTeamName.trim().length > 0 &&
    Array.isArray(parsed.homePlayers) &&
    Array.isArray(parsed.awayPlayers)
  );
}

export function getCurrentMatch(): MatchData | null {
  try {
    // 1. Check scoped storage first
    const raw = userStorage.getItem(STORAGE_CURRENT_MATCH_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isValidMatchData(parsed)) {
          return parsed;
        }
      } catch {}
    }

    // 2. Scan all localStorage keys for active match
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.includes('current_match') || key === STORAGE_CURRENT_MATCH_KEY) {
          try {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              if (isValidMatchData(parsed)) {
                // Restore into active scope
                userStorage.setItem(STORAGE_CURRENT_MATCH_KEY, JSON.stringify(parsed));
                return parsed;
              }
            }
          } catch {}
        }

        // Check recovery checkpoint
        if (key.includes('recovery.previous')) {
          try {
            const val = localStorage.getItem(key);
            if (val) {
              const snap = JSON.parse(val);
              if (snap?.previous?.[STORAGE_CURRENT_MATCH_KEY]) {
                const parsed = JSON.parse(snap.previous[STORAGE_CURRENT_MATCH_KEY]);
                if (isValidMatchData(parsed)) {
                  userStorage.setItem(STORAGE_CURRENT_MATCH_KEY, JSON.stringify(parsed));
                  return parsed;
                }
              }
            }
          } catch {}
        }
      }

      // 3. Fallback to latest saved match if available
      const saved = getSavedMatches();
      if (saved.length > 0 && isValidMatchData(saved[0].matchData)) {
        userStorage.setItem(STORAGE_CURRENT_MATCH_KEY, JSON.stringify(saved[0].matchData));
        return saved[0].matchData;
      }
    }

    return null;
  } catch (err) {
    console.warn('Error reading current match from storage:', err);
    return null;
  }
}

export function saveCurrentMatch(match: MatchData): void {
  try {
    userStorage.setItem(STORAGE_CURRENT_MATCH_KEY, JSON.stringify(match));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_CURRENT_MATCH_KEY, JSON.stringify(match));
      localStorage.setItem('ov-user:guest:' + STORAGE_CURRENT_MATCH_KEY, JSON.stringify(match));
    }
  } catch (err) {
    console.warn('Error saving current match to storage:', err);
  }
}

export function clearCurrentMatch(): void {
  try {
    userStorage.removeItem(STORAGE_CURRENT_MATCH_KEY);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_CURRENT_MATCH_KEY);
      localStorage.removeItem('ov-user:guest:' + STORAGE_CURRENT_MATCH_KEY);
    }
  } catch (err) {
    console.warn('Error clearing current match from storage:', err);
  }
}

// -------------------------------------------------------------
// COMPLETE AUTO-RECOVERY & IMPORT UTILITIES
// -------------------------------------------------------------

export function recoverAllStoredData(): {
  teams: SavedTeam[];
  matches: SavedMatchRecord[];
  activeMatch: MatchData | null;
  recoveredTeamsCount: number;
  recoveredMatchesCount: number;
} {
  const teams = getSavedTeams();
  const matches = getSavedMatches();
  const activeMatch = getCurrentMatch();

  // Also recover user cuts & ai rallies from legacy/guest keys if current scope is empty
  if (typeof localStorage !== 'undefined') {
    try {
      const currentCuts = userStorage.getItem('openvoley_user_cuts');
      if (!currentCuts) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.includes('openvoley_user_cuts')) {
            const val = localStorage.getItem(k);
            if (val && val.length > 2) {
              userStorage.setItem('openvoley_user_cuts', val);
              break;
            }
          }
        }
      }

      const currentRallies = userStorage.getItem('openvoley_ai_rallies');
      if (!currentRallies) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.includes('openvoley_ai_rallies')) {
            const val = localStorage.getItem(k);
            if (val && val.length > 2) {
              userStorage.setItem('openvoley_ai_rallies', val);
              break;
            }
          }
        }
      }
    } catch {}
  }

  return {
    teams,
    matches,
    activeMatch,
    recoveredTeamsCount: teams.length,
    recoveredMatchesCount: matches.length,
  };
}

export function importDataFromBackupJson(jsonString: string): {
  teamsAdded: number;
  matchesAdded: number;
  activeMatchRestored: boolean;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    let teamsAdded = 0;
    let matchesAdded = 0;
    let activeMatchRestored = false;

    // Check if openvoley-legacy-review format
    if (parsed && parsed.format === 'openvoley-legacy-review' && Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        if (!item || !item.key || !item.raw) continue;
        try {
          const val = JSON.parse(item.raw);
          if (item.key === STORAGE_TEAMS_KEY || item.key.includes('saved_teams')) {
            if (Array.isArray(val)) {
              for (const t of val) {
                saveTeam(t);
                teamsAdded++;
              }
            }
          } else if (item.key === STORAGE_MATCHES_KEY || item.key.includes('saved_matches')) {
            if (Array.isArray(val)) {
              for (const m of val) {
                saveMatchRecord(m);
                matchesAdded++;
              }
            }
          } else if (item.key === STORAGE_CURRENT_MATCH_KEY || item.key.includes('current_match')) {
            if (isValidMatchData(val)) {
              saveCurrentMatch(val);
              activeMatchRestored = true;
            }
          }
        } catch {}
      }
      return { teamsAdded, matchesAdded, activeMatchRestored };
    }

    // Check if raw array of teams
    if (Array.isArray(parsed)) {
      // Check first item type
      const first = parsed[0];
      if (first && typeof first === 'object' && first.players && first.name) {
        for (const t of parsed) {
          saveTeam(t);
          teamsAdded++;
        }
        return { teamsAdded, matchesAdded, activeMatchRestored };
      }
      if (first && typeof first === 'object' && first.matchData && first.homeTeamName) {
        for (const m of parsed) {
          saveMatchRecord(m);
          matchesAdded++;
        }
        return { teamsAdded, matchesAdded, activeMatchRestored };
      }
    }

    // Check if combined object { teams, matches, currentMatch }
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.teams)) {
        for (const t of parsed.teams) {
          saveTeam(t);
          teamsAdded++;
        }
      }
      if (Array.isArray(parsed.matches)) {
        for (const m of parsed.matches) {
          saveMatchRecord(m);
          matchesAdded++;
        }
      }
      if (isValidMatchData(parsed.currentMatch)) {
        saveCurrentMatch(parsed.currentMatch);
        activeMatchRestored = true;
      }
      return { teamsAdded, matchesAdded, activeMatchRestored };
    }

    return { teamsAdded: 0, matchesAdded: 0, activeMatchRestored: false, error: 'Formato no reconocido' };
  } catch (e) {
    return {
      teamsAdded: 0,
      matchesAdded: 0,
      activeMatchRestored: false,
      error: e instanceof Error ? e.message : 'Error al analizar el archivo JSON',
    };
  }
}
