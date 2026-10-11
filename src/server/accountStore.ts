import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const file = () => path.join(process.cwd(), 'clients_db.json');
export function loadAccounts(): any[] {
  if (!fs.existsSync(file())) return [];
  const value = JSON.parse(fs.readFileSync(file(), 'utf8'));
  if (!Array.isArray(value)) throw new Error('Invalid accounts database');
  return value;
}
export function saveAccounts(accounts: any[]): void {
  const temp = `${file()}.${randomUUID()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(accounts, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file());
}
export function isAdminEmail(email: string): boolean {
  return (process.env.ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase().trim());
}
export function accountTrial(account: any, now = Date.now()) {
  const first = Date.parse(account.firstLoginDate);
  const totalAllowedDays = Number(account.trialDurationDays || 0) + Number(account.customGrantedDays || 0);
  const elapsedMs = Number.isFinite(first) ? Math.max(0, now - first) : Infinity;
  const remainingMs = totalAllowedDays * 86400000 - elapsedMs;
  return { daysRemaining: Math.max(0, Math.ceil(remainingMs / 86400000)), isExpired: remainingMs <= 0 || !!account.isBlocked,
    firstLoginDate: account.firstLoginDate, totalAllowedDays, elapsedDays: Math.floor(elapsedMs / 86400000) };
}
export function grantAccessDays(account: any, days: number, now = Date.now()) {
  const first = Date.parse(account.firstLoginDate);
  if (!Number.isFinite(first)) throw new Error('Invalid account start date');
  const elapsedDays = Math.max(0, (now - first) / 86400000);
  const allowed = Number(account.trialDurationDays || 0) + Number(account.customGrantedDays || 0);
  account.customGrantedDays = Math.max(allowed, elapsedDays) + days - Number(account.trialDurationDays || 0);
}
