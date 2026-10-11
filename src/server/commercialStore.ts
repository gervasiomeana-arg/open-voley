import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const DEFAULT_PRICES = {
  'plan-dt': {name:'Plan DT / Entrenador',monthly:{ARS:18000,USD:19},annual:{ARS:160000,USD:169}},
  'plan-club-pro': {name:'Plan Club Pro & Liga',monthly:{ARS:35000,USD:35},annual:{ARS:320000,USD:315}},
  'plan-federacion': {name:'Plan Federación / Torneo',monthly:{ARS:95000,USD:99},annual:{ARS:850000,USD:890}},
};
let database: DatabaseSync;
function db() {
  if (!database) {
    database = new DatabaseSync(process.env.OPENVOLEY_DB_PATH || path.join(process.cwd(),'openvoley.db'));
    database.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS commercial_settings (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commercial_leads (email TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commercial_visits (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS checkout_quotes (reference TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payment_events (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);`);
  }
  return database;
}
export function getPrices(): typeof DEFAULT_PRICES {
  const row = db().prepare('SELECT payload FROM commercial_settings WHERE id=?').get('prices') as any;
  return row ? JSON.parse(row.payload) : structuredClone(DEFAULT_PRICES);
}
export function savePrices(value: typeof DEFAULT_PRICES, admin: string) {
  db().prepare('INSERT INTO commercial_settings VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run('prices',JSON.stringify(value));
  recordPaymentEvent(`prices-${randomUUID()}`,{type:'price-change',admin});
}
export function recordLead(input: {email:string;name:string;club?:string;phone?:string;source:string;verified?:boolean;consent?:boolean}) {
  const email=input.email.trim().toLowerCase();
  const row=db().prepare('SELECT payload FROM commercial_leads WHERE email=?').get(email) as any;
  const previous=row ? JSON.parse(row.payload) : {};
  if(previous.verified && !input.verified) return;
  const now=new Date().toISOString();
  const value={...previous,email,name:input.name || previous.name,club:input.club || previous.club || '',phone:input.phone || previous.phone || '',source:input.source,verified:!!(previous.verified || input.verified),consent:!!(previous.consent || input.consent),firstSeen:previous.firstSeen || now,lastSeen:now};
  db().prepare('INSERT INTO commercial_leads VALUES (?,?,?) ON CONFLICT(email) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').run(email,JSON.stringify(value),now);
}
export function listLeads(){return (db().prepare('SELECT payload FROM commercial_leads ORDER BY updated_at DESC LIMIT 10000').all() as any[]).map(r=>JSON.parse(r.payload));}
export function deleteLead(email:string){db().prepare('DELETE FROM commercial_leads WHERE email=?').run(email.toLowerCase().trim());}
export function recordVisit(value: object){db().prepare('INSERT INTO commercial_visits VALUES (?,?,?)').run(randomUUID(),JSON.stringify(value),new Date().toISOString());}
export function listVisits(){const rows=db().prepare('SELECT payload,created_at FROM commercial_visits ORDER BY created_at DESC LIMIT 500').all() as any[];return {total:(db().prepare('SELECT COUNT(*) AS count FROM commercial_visits').get() as any).count,visits:rows.map(r=>({...JSON.parse(r.payload),date:r.created_at}))};}
export function saveQuote(reference:string,value:object){db().prepare('INSERT INTO checkout_quotes VALUES (?,?)').run(reference,JSON.stringify(value));}
export function getQuote(reference:string){const row=db().prepare('SELECT payload FROM checkout_quotes WHERE reference=?').get(reference) as any;return row ? JSON.parse(row.payload) : null;}
export function recordPaymentEvent(id:string,value:object){db().prepare('INSERT INTO payment_events VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(id,JSON.stringify(value),new Date().toISOString());}
