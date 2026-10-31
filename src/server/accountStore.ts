import { effectiveAccessDays } from '../shared/accessPeriod';
import {cloudRpc,durableStorageEnabled,readCloud} from './supabaseStore';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const file = () => path.join(process.cwd(), 'clients_db.json');
const versions=new WeakMap<object,{revision:number;original:string}>();

export async function loadAccounts(): Promise<any[]> {
  if(durableStorageEnabled()){
    const records=await readCloud('accounts','system');
    const accounts=records.filter(r=>r.value!==null).map(r=>{versions.set(r.value,{revision:r.revision,original:JSON.stringify(r.value)});return r.value;});
    return accounts;
  }
  if (!fs.existsSync(file())) return [];
  const value = JSON.parse(fs.readFileSync(file(), 'utf8'));
  if (!Array.isArray(value)) throw new Error('Invalid accounts database');
  return value;
}
export async function saveAccounts(accounts: any[],previous?:any[]): Promise<void> {
 if(durableStorageEnabled()){
  const writes=accounts.flatMap(a=>{const v=versions.get(a);return v?.original===JSON.stringify(a)?[]:[{namespace:'accounts',owner:'system',key:a.id,value:a,baseRevision:v?.revision||0}];});
  if(previous)for(const a of previous)if(!accounts.some(x=>x.id===a.id))writes.push({namespace:'accounts',owner:'system',key:a.id,value:null,baseRevision:versions.get(a)?.revision||0});
  if(writes.length) await cloudRpc('ov_commit_records',{p_writes:writes});return;
 }
  const temp = `${file()}.${randomUUID()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(accounts, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file());
}
export function isAdminEmail(email: string): boolean {
  return (process.env.ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase().trim());
}
export function accountTrial(account: any, now = Date.now()) {
  const first = Date.parse(account.firstLoginDate);
  const totalAllowedDays = effectiveAccessDays(account);
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

/** Legacy reset requests start a fresh paid period without rewriting registration history. */
export function resetAccessDays(account: any, days = 30, now = Date.now()) {
  const first = Date.parse(account.firstLoginDate);
  if (!Number.isFinite(first) || !Number.isFinite(days) || days <= 0 || days > 365)
    throw new Error('Invalid access period');
  const elapsedDays = Math.max(0, (now - first) / 86400000);
  account.customGrantedDays = elapsedDays + days - Number(account.trialDurationDays || 0);
  account.isBlocked = false;
}
