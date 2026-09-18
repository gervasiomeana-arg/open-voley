import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { SmartSportsMontage } from '../types';

export interface SmartSportsMontageRepository {
  list(userId: string): Promise<SmartSportsMontage[]>;
  upsert(userId: string, montage: SmartSportsMontage): Promise<void>;
  delete(userId: string, montageId: string): Promise<void>;
}

interface UserMontageRecord {
  userId: string;
  montages: SmartSportsMontage[];
}

const JSON_FILE = path.join(process.cwd(), 'smart_sports_montages_db.json');

function loadJson(): UserMontageRecord[] {
  try {
    if (!fs.existsSync(JSON_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJson(records: UserMontageRecord[]) {
  fs.writeFileSync(JSON_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

class JsonMontageRepository implements SmartSportsMontageRepository {
  async list(userId: string) {
    return loadJson().find((record) => record.userId === userId)?.montages || [];
  }

  async upsert(userId: string, montage: SmartSportsMontage) {
    const records = loadJson();
    const index = records.findIndex((record) => record.userId === userId);
    const current = index >= 0 ? records[index].montages : [];
    const updated = current.some((item) => item.id === montage.id)
      ? current.map((item) => item.id === montage.id ? montage : item)
      : [montage, ...current];
    if (index >= 0) records[index] = { userId, montages: updated };
    else records.push({ userId, montages: updated });
    saveJson(records);
  }

  async delete(userId: string, montageId: string) {
    const records = loadJson().map((record) =>
      record.userId === userId
        ? { ...record, montages: record.montages.filter((item) => item.id !== montageId) }
        : record,
    );
    saveJson(records);
  }
}

class SqliteMontageRepository implements SmartSportsMontageRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath = process.env.OPENVOLEY_DB_PATH?.trim() || path.join(process.cwd(), 'openvoley.db')) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec([
      'PRAGMA journal_mode = WAL;',
      'CREATE TABLE IF NOT EXISTS smart_sports_montages (',
      '  user_id TEXT NOT NULL,',
      '  montage_id TEXT NOT NULL,',
      '  match_id TEXT NOT NULL,',
      '  updated_at TEXT NOT NULL,',
      '  payload_json TEXT NOT NULL,',
      '  PRIMARY KEY (user_id, montage_id)',
      ');',
      'CREATE INDEX IF NOT EXISTS idx_smart_sports_montages_user_updated',
      '  ON smart_sports_montages(user_id, updated_at DESC);',
    ].join('\n'));
  }

  async list(userId: string) {
    const rows = this.db.prepare(
      'SELECT payload_json FROM smart_sports_montages WHERE user_id = ? ORDER BY updated_at DESC LIMIT 250',
    ).all(userId) as Array<{ payload_json: string }>;
    return rows.flatMap((row) => {
      try { return [JSON.parse(row.payload_json) as SmartSportsMontage]; } catch { return []; }
    });
  }

  async upsert(userId: string, montage: SmartSportsMontage) {
    this.db.prepare([
      'INSERT INTO smart_sports_montages (user_id, montage_id, match_id, updated_at, payload_json)',
      'VALUES (?, ?, ?, ?, ?)',
      'ON CONFLICT(user_id, montage_id) DO UPDATE SET',
      'match_id = excluded.match_id, updated_at = excluded.updated_at, payload_json = excluded.payload_json',
    ].join(' ')).run(userId, montage.id, montage.matchId, montage.updatedAt, JSON.stringify(montage));
  }

  async delete(userId: string, montageId: string) {
    this.db.prepare('DELETE FROM smart_sports_montages WHERE user_id = ? AND montage_id = ?').run(userId, montageId);
  }
}

export interface MontageRepositoryStatus {
  requestedDriver: 'json' | 'sqlite';
  activeDriver: 'json' | 'sqlite';
  fallbackActive: boolean;
  healthy: boolean;
  message: string;
}

function createRepository() {
  const requestedDriver = process.env.OPENVOLEY_STORAGE_DRIVER?.trim().toLowerCase() === 'json' ? 'json' : 'sqlite';
  if (requestedDriver === 'sqlite') {
    try {
      return {
        repository: new SqliteMontageRepository() as SmartSportsMontageRepository,
        status: { requestedDriver:'sqlite', activeDriver:'sqlite', fallbackActive:false, healthy:true, message:'SQLite montage persistence active' } as MontageRepositoryStatus,
      };
    } catch (error) {
      console.error('Montage SQLite initialization failed; using JSON fallback:', error);
      return {
        repository: new JsonMontageRepository() as SmartSportsMontageRepository,
        status: { requestedDriver:'sqlite', activeDriver:'json', fallbackActive:true, healthy:false, message:'SQLite montage initialization failed; JSON fallback active' } as MontageRepositoryStatus,
      };
    }
  }
  return {
    repository: new JsonMontageRepository() as SmartSportsMontageRepository,
    status: { requestedDriver:'json', activeDriver:'json', fallbackActive:false, healthy:true, message:'JSON montage persistence active' } as MontageRepositoryStatus,
  };
}

const created = createRepository();

export function getSmartSportsMontageRepository() {
  return created.repository;
}

export function getSmartSportsMontageRepositoryStatus() {
  return { ...created.status };
}
