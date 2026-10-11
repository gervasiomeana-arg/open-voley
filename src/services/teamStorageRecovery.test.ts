import assert from 'node:assert/strict';
import { setStorageUser, userStorage } from './userStorage';
import { 
  getSavedTeams, 
  getSavedMatches, 
  getCurrentMatch, 
  recoverAllStoredData, 
  importDataFromBackupJson,
  SavedTeam,
  SavedMatchRecord
} from './teamStorage';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    get length() { return values.size; },
    key: (i: number) => [...values.keys()][i] ?? null,
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  },
  configurable: true,
});

console.log('Testing team, match and player recovery...');

// Scenario 1: User created custom teams while in guest mode or legacy unscoped key
const customTeam: SavedTeam = {
  id: 'team_custom_1',
  name: 'Defensores de Banfield',
  shortName: 'Banfield',
  category: 'Sub 18',
  gender: 'Femenino',
  type: 'my_team',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  players: [
    { id: 'p_101', number: 1, name: 'Sofia Rodriguez', position: 'S', team: 'home', starter: true },
    { id: 'p_102', number: 4, name: 'Lucia Gomez', position: 'OH', team: 'home', starter: true },
    { id: 'p_103', number: 7, name: 'Valeria Diaz', position: 'MB', team: 'home', starter: true },
  ],
};

// Store in legacy unscoped key
values.set('openvoley_saved_teams_v1', JSON.stringify([customTeam]));

// User logs in as user-123
setStorageUser('user-123');

// getSavedTeams must automatically recover the custom team and its players!
const recoveredTeams = getSavedTeams();
assert.equal(recoveredTeams.some(t => t.name === 'Defensores de Banfield'), true, 'Custom team should be recovered');
const banfield = recoveredTeams.find(t => t.name === 'Defensores de Banfield')!;
assert.equal(banfield.players.length, 3, 'All 3 players must be recovered');

// Scenario 2: Matches saved in guest key
const customMatch: SavedMatchRecord = {
  id: 'match_test_1',
  title: 'Banfield vs Vélez',
  competition: 'Metropolitano',
  date: '2026-10-10',
  homeTeamName: 'Defensores de Banfield',
  awayTeamName: 'Vélez Sarsfield',
  finalScore: '3 - 1',
  matchData: {
    id: 'match_test_1',
    title: 'Banfield vs Vélez',
    homeTeamName: 'Defensores de Banfield',
    awayTeamName: 'Vélez Sarsfield',
    competition: 'Metropolitano',
    date: '2026-10-10',
    venue: 'Cancha Central',
    currentSet: 4,
    status: 'finished',
    sets: [
      { setNumber: 1, scoreHome: 25, scoreAway: 20, winner: 'home' },
      { setNumber: 2, scoreHome: 22, scoreAway: 25, winner: 'away' },
      { setNumber: 3, scoreHome: 25, scoreAway: 18, winner: 'home' },
      { setNumber: 4, scoreHome: 25, scoreAway: 21, winner: 'home' },
    ],
    homePlayers: banfield.players,
    awayPlayers: [
      { id: 'p_v1', number: 2, name: 'Clara Silva', position: 'OH', team: 'away', starter: true },
    ],
    actions: [],
    homeRotation: [1, 2, 3, 4, 5, 6],
    awayRotation: [1, 2, 3, 4, 5, 6],
    server: { team: 'home', playerNum: 1 },
  },
  actionsCount: 45,
  status: 'finished',
  updatedAt: new Date().toISOString(),
};

// Store in guest scope
values.set('ov-user:guest:openvoley_saved_matches_v1', JSON.stringify([customMatch]));

const recoveredMatches = getSavedMatches();
assert.equal(recoveredMatches.some(m => m.title === 'Banfield vs Vélez'), true, 'Match should be recovered');

// Scenario 3: Active match recovery
values.set('openvoley_current_match_v1', JSON.stringify(customMatch.matchData));
const active = getCurrentMatch();
assert.notEqual(active, null, 'Active match should be recovered');
assert.equal(active?.homeTeamName, 'Defensores de Banfield');

// Scenario 4: recoverAllStoredData utility
const summary = recoverAllStoredData();
assert.equal(summary.teams.some(t => t.name === 'Defensores de Banfield'), true);
assert.equal(summary.matches.some(m => m.id === 'match_test_1'), true);

// Scenario 5: importDataFromBackupJson
const backupObj = {
  teams: [
    {
      id: 'team_imported_1',
      name: 'River Plate Sub 21',
      shortName: 'River',
      category: 'Sub 21',
      gender: 'Femenino',
      type: 'opponent',
      players: [
        { id: 'p_r1', number: 10, name: 'Martina River', position: 'OH', team: 'away', starter: true }
      ]
    }
  ]
};

const importRes = importDataFromBackupJson(JSON.stringify(backupObj));
assert.equal(importRes.teamsAdded, 1, 'Should import 1 team');
assert.equal(getSavedTeams().some(t => t.name === 'River Plate Sub 21'), true, 'Imported team should be in saved teams');

console.log('All team, match, and player recovery tests passed successfully!');
