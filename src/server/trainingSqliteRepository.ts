import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { TrainingSession } from '../types';
import type { TrainingRepository } from './trainingRepository';
import type { UserTrainingRecord } from './trainingSessionsStore';

const MIGRATION_KEY = 'legacy_training_json_v1';

export class SqliteTrainingRepository implements TrainingRepository {
  private readonly db: DatabaseSync;

  constructor(
    dbPath = process.env.OPENVOLEY_DB_PATH?.trim() || path.join(process.cwd(), 'openvoley.db'),
    legacyJsonPath = path.join(process.cwd(), 'training_sessions_db.json'),
  ) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(
      [
        'PRAGMA journal_mode = WAL;',
        'PRAGMA foreign_keys = ON;',
        'CREATE TABLE IF NOT EXISTS training_sessions (',
        '  user_id TEXT NOT NULL,',
        '  session_id TEXT NOT NULL,',
        '  session_date TEXT NOT NULL,',
        '  payload_json TEXT NOT NULL,',
        '  updated_at TEXT NOT NULL,',
        '  PRIMARY KEY (user_id, session_id)',
        ');',
        'CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date',
        '  ON training_sessions(user_id, session_date DESC, updated_at DESC);',
        'CREATE TABLE IF NOT EXISTS app_migrations (',
        '  migration_key TEXT PRIMARY KEY,',
        '  applied_at TEXT NOT NULL',
        ');',
      ].join('\n'),
    );

    this.migrateLegacyJsonOnce(legacyJsonPath);
  }

  async list(userId: string): Promise<TrainingSession[]> {
    const rows = this.db
      .prepare(
        'SELECT payload_json FROM training_sessions WHERE user_id = ? ORDER BY session_date DESC, updated_at DESC LIMIT 250',
      )
      .all(userId) as Array<{ payload_json: string }>;

    return rows.flatMap((row) => {
      try {
        return [JSON.parse(row.payload_json) as TrainingSession];
      } catch {
        return [];
      }
    });
  }

  async upsert(userId: string, session: TrainingSession): Promise<void> {
    this.db
      .prepare(
        [
          'INSERT INTO training_sessions (user_id, session_id, session_date, payload_json, updated_at)',
          'VALUES (?, ?, ?, ?, ?)',
          'ON CONFLICT(user_id, session_id) DO UPDATE SET',
          'session_date = excluded.session_date,',
          'payload_json = excluded.payload_json,',
          'updated_at = excluded.updated_at',
        ].join(' '),
      )
      .run(
        userId,
        session.id,
        session.date || '',
        JSON.stringify(session),
        new Date().toISOString(),
      );
  }

  async delete(userId: string, sessionId: string): Promise<void> {
    this.db
      .prepare('DELETE FROM training_sessions WHERE user_id = ? AND session_id = ?')
      .run(userId, sessionId);
  }

  close(): void {
    this.db.close();
  }

  private migrateLegacyJsonOnce(legacyJsonPath: string): void {
    const alreadyApplied = this.db
      .prepare('SELECT migration_key FROM app_migrations WHERE migration_key = ?')
      .get(MIGRATION_KEY);

    if (alreadyApplied) return;

    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (fs.existsSync(legacyJsonPath)) {
        const parsed = JSON.parse(fs.readFileSync(legacyJsonPath, 'utf-8'));
        const records: UserTrainingRecord[] = Array.isArray(parsed) ? parsed : [];
        const insert = this.db.prepare(
          [
            'INSERT INTO training_sessions (user_id, session_id, session_date, payload_json, updated_at)',
            'VALUES (?, ?, ?, ?, ?)',
            'ON CONFLICT(user_id, session_id) DO NOTHING',
          ].join(' '),
        );

        for (const record of records) {
          if (!record || typeof record.userId !== 'string' || !Array.isArray(record.sessions)) {
            continue;
          }

          for (const session of record.sessions) {
            if (!session || typeof session.id !== 'string') continue;
            insert.run(
              record.userId,
              session.id,
              session.date || '',
              JSON.stringify(session),
              new Date().toISOString(),
            );
          }
        }
      }

      this.db
        .prepare('INSERT INTO app_migrations (migration_key, applied_at) VALUES (?, ?)')
        .run(MIGRATION_KEY, new Date().toISOString());
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      console.error('Legacy training migration failed:', error);
      throw error;
    }
  }
}
