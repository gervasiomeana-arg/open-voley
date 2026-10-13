import {durableStorageEnabled,readCloud,updateCloud} from './supabaseStore';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export const DEFAULT_PRICES = {
    'plan-dt': { name: 'Plan DT / Entrenador', monthly: { ARS: 18000, USD: 19 }, annual: { ARS: 160000, USD: 169 } },
    'plan-club-pro': { name: 'Plan Club Pro & Liga', monthly: { ARS: 35000, USD: 35 }, annual: { ARS: 320000, USD: 315 } },
    'plan-federacion': { name: 'Plan Federación / Torneo', monthly: { ARS: 95000, USD: 99 }, annual: { ARS: 850000, USD: 890 } },
};
let database: DatabaseSync;
function db() {
    if (!database) {
        database = new DatabaseSync(process.env.OPENVOLEY_DB_PATH || path.join(process.cwd(), 'openvoley.db'));
        database.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS commercial_settings (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commercial_leads (email TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commercial_visits (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS checkout_quotes (reference TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payment_reconciliation (id TEXT PRIMARY KEY, state TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payment_audit (id TEXT PRIMARY KEY, payment_id TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payment_events (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);`);
    }
    return database;
}
export async function getPrices(): Promise<typeof DEFAULT_PRICES> {
 if(durableStorageEnabled()){ const row=(await readCloud('commercial','settings','prices'))[0];return row?.value??structuredClone(DEFAULT_PRICES); }

    const row = db().prepare('SELECT payload FROM commercial_settings WHERE id=?').get('prices') as any;
    return row ? JSON.parse(row.payload) : structuredClone(DEFAULT_PRICES);
}
export async function savePrices(value: typeof DEFAULT_PRICES, admin: string) {
 if(durableStorageEnabled()){ await updateCloud('commercial','settings','prices',()=>value);await recordPaymentEvent(`prices-${randomUUID()}`,{type:'price-change',admin});return; }

    db().prepare('INSERT INTO commercial_settings VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run('prices', JSON.stringify(value));
    await recordPaymentEvent(`prices-${randomUUID()}`, { type: 'price-change', admin });
}
export async function recordLead(input: {
    email: string;
    name: string;
    club?: string;
    phone?: string;
    source: string;
    verified?: boolean;
    consent?: boolean;
}) {
 if(durableStorageEnabled()){ const email=input.email.trim().toLowerCase(),now=new Date().toISOString();await updateCloud('commercial','leads',email,previous=>{previous??={};if(previous.verified&&!input.verified)return previous;return {...previous,email,name:input.name||previous.name,club:input.club||previous.club||'',phone:input.phone||previous.phone||'',source:input.source,verified:!!(previous.verified||input.verified),consent:!!(previous.consent||input.consent),firstSeen:previous.firstSeen||now,lastSeen:now};});return; }

    const email = input.email.trim().toLowerCase();
    const row = db().prepare('SELECT payload FROM commercial_leads WHERE email=?').get(email) as any;
    const previous = row ? JSON.parse(row.payload) : {};
    if (previous.verified && !input.verified)
        return;
    const now = new Date().toISOString();
    const value = { ...previous, email, name: input.name || previous.name, club: input.club || previous.club || '', phone: input.phone || previous.phone || '', source: input.source, verified: !!(previous.verified || input.verified), consent: !!(previous.consent || input.consent), firstSeen: previous.firstSeen || now, lastSeen: now };
    db().prepare('INSERT INTO commercial_leads VALUES (?,?,?) ON CONFLICT(email) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').run(email, JSON.stringify(value), now);
}
export async function listLeads() {
 if(durableStorageEnabled()){ return (await readCloud('commercial','leads')).filter(r=>r.value!==null).map(r=>r.value).sort((a,b)=>b.lastSeen.localeCompare(a.lastSeen)); }
 return (db().prepare('SELECT payload FROM commercial_leads ORDER BY updated_at DESC LIMIT 10000').all() as any[]).map(r => JSON.parse(r.payload)); }
export async function deleteLead(email: string) {
 if(durableStorageEnabled()){ await updateCloud('commercial','leads',email.toLowerCase().trim(),()=>null);return; }
 db().prepare('DELETE FROM commercial_leads WHERE email=?').run(email.toLowerCase().trim()); }
export async function recordVisit(value: object) {
 if(durableStorageEnabled()){ const date=new Date().toISOString();await updateCloud('commercial','visits',`${date}-${randomUUID()}`,()=>({...value,date}));return; }
 db().prepare('INSERT INTO commercial_visits VALUES (?,?,?)').run(randomUUID(), JSON.stringify(value), new Date().toISOString()); }
export async function listVisits() {
 if(durableStorageEnabled()){ const rows=(await readCloud('commercial','visits')).filter(r=>r.value!==null);return {total:rows.length,visits:rows.reverse().slice(0,500).map(r=>r.value)}; }
 const rows = db().prepare('SELECT payload,created_at FROM commercial_visits ORDER BY created_at DESC LIMIT 500').all() as any[]; return { total: (db().prepare('SELECT COUNT(*) AS count FROM commercial_visits').get() as any).count, visits: rows.map(r => ({ ...JSON.parse(r.payload), date: r.created_at })) }; }
export async function saveQuote(reference: string, value: object) {
 if(durableStorageEnabled()){ await updateCloud('commercial','quotes',reference,()=>value);return; }
 db().prepare('INSERT INTO checkout_quotes VALUES (?,?)').run(reference, JSON.stringify(value)); }
export async function getQuote(reference: string) {
 if(durableStorageEnabled()){ return (await readCloud('commercial','quotes',reference))[0]?.value??null; }
 const row = db().prepare('SELECT payload FROM checkout_quotes WHERE reference=?').get(reference) as any; return row ? JSON.parse(row.payload) : null; }
export async function recordPaymentEvent(id: string, value: object) {
 if(durableStorageEnabled()){ const date=new Date().toISOString();await updateCloud('commercial','payment-audit',`${date}-${randomUUID()}`,()=>({paymentId:id,...value,date}));await updateCloud('commercial','payment-events',id,()=>value);return; }
 db().prepare('INSERT INTO payment_audit VALUES (?,?,?,?)').run(randomUUID(), id, JSON.stringify(value), new Date().toISOString()); db().prepare('INSERT INTO payment_events VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(id, JSON.stringify(value), new Date().toISOString()); }
export async function getReconciliation(id: string) {
 if(durableStorageEnabled()){ return (await readCloud('commercial','reconciliation',id))[0]?.value??null; }
 const row = db().prepare('SELECT payload FROM payment_reconciliation WHERE id=?').get(id) as any; return row ? JSON.parse(row.payload) : null; }
export async function saveReconciliation(id: string, value: any) {
 if(durableStorageEnabled()){ const now=new Date().toISOString();return (await updateCloud('commercial','reconciliation',id,previous=>({...previous,...value,paymentId:id,firstSeen:previous?.firstSeen||now,updatedAt:now}))).value; }
 const now = new Date().toISOString(); const previous = await getReconciliation(id); const record = { ...previous, ...value, paymentId: id, firstSeen: previous?.firstSeen || now, updatedAt: now }; db().prepare('INSERT INTO payment_reconciliation VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,payload=excluded.payload,updated_at=excluded.updated_at').run(id, record.state, JSON.stringify(record), now); return record; }
export async function listReconciliation() {
 if(durableStorageEnabled()){ const records=(await readCloud('commercial','reconciliation')).filter(r=>r.value!==null).map(r=>r.value);const summary:Record<string,number>={};for(const p of records)summary[p.state]=(summary[p.state]||0)+1;return {payments:records.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,200),summary}; }
 const rows = db().prepare("SELECT payload FROM payment_reconciliation ORDER BY CASE state WHEN 'review' THEN 0 WHEN 'retry' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END, updated_at DESC LIMIT 200").all() as any[]; const summary = db().prepare('SELECT state,COUNT(*) AS total FROM payment_reconciliation GROUP BY state').all(); return { payments: rows.map(r => JSON.parse(r.payload)), summary: Object.fromEntries(summary.map(r => [r.state, r.total])) }; }
export async function listPaymentAudit() {
 if(durableStorageEnabled()){ return (await readCloud('commercial','payment-audit')).reverse().slice(0,100).map(r=>r.value); }
 return (db().prepare('SELECT payment_id,payload,created_at FROM payment_audit ORDER BY created_at DESC,rowid DESC LIMIT 100').all() as any[]).map(r => ({ paymentId: r.payment_id, ...JSON.parse(r.payload), date: r.created_at })); }
export async function getLaunchReview() {
 if(durableStorageEnabled()){ return (await readCloud('commercial','settings','launch-review'))[0]?.value??null; }
 const row = db().prepare('SELECT payload FROM commercial_settings WHERE id=?').get('launch-review') as any; return row ? JSON.parse(row.payload) : null; }
export async function saveLaunchReview(value: object) {
 if(durableStorageEnabled()){ await updateCloud('commercial','settings','launch-review',()=>value);return; }
 db().prepare('INSERT INTO commercial_settings VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run('launch-review', JSON.stringify(value)); }
