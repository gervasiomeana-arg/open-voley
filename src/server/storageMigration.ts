import {isDeepStrictEqual} from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {loadAccounts} from './accountStore';
import {cloudRpc,readCloud,CloudStorageError} from './supabaseStore';
import {isCloudKey,validateCloudValue} from '../shared/userDataSchema';
export async function exportServerMigration(){
 const accounts=await loadAccounts();const records:any[]=accounts.map(a=>({namespace:'accounts',owner:'system',key:a.id,value:a}));
 const visitorsPath=path.join(process.cwd(),'visitors_db.json');if(fs.existsSync(visitorsPath)){const visits=JSON.parse(fs.readFileSync(visitorsPath,'utf8'));if(!Array.isArray(visits))throw new CloudStorageError(400,'Archivo de visitas inválido.');records.push({namespace:'commercial',owner:'legacy-visitors',key:'all',value:visits});}
 const dbPath=process.env.OPENVOLEY_DB_PATH||path.join(process.cwd(),'openvoley.db');
 if(fs.existsSync(dbPath)){
  const db=new DatabaseSync(dbPath,{readOnly:true});
  try{
   const tables=new Set((db.prepare("select name from sqlite_master where type='table'").all() as any[]).map(r=>r.name));
   for(const [table,owner,key,column] of [['commercial_settings','settings','id','payload'],['commercial_leads','leads','email','payload'],['commercial_visits','visits','id','payload'],['payment_audit','payment-audit','id','payload'],['checkout_quotes','quotes','reference','payload'],['payment_reconciliation','reconciliation','id','payload'],['payment_events','payment-events','id','payload']] as const){
    if(tables.has(table))for(const r of db.prepare(`select ${key} as key,${column} as value from ${table}`).all() as any[])records.push({namespace:'commercial',owner,key:r.key,value:JSON.parse(r.value)});
   }
   for(const [table,key] of [['training_sessions','openvoley_training_sessions_v1'],['smart_sports_montages','openvoley_smart_sports_montages_v1']] as const){
    if(!tables.has(table))continue;const groups=new Map<string,any[]>();for(const r of db.prepare(`select user_id,payload_json from ${table}`).all() as any[]){if(!groups.has(r.user_id))groups.set(r.user_id,[]);groups.get(r.user_id)!.push(JSON.parse(r.payload_json));}
    for(const [owner,value]of groups)records.push({namespace:'user',owner,key,value});
   }
  }finally{db.close();}
 }
 return {format:'openvoley-server-migration',version:1,createdAt:new Date().toISOString(),records};
}
export async function importServerMigration(input:any,options:{dryRun?:boolean}={}){
 // A legacy /api/clients JSON export is also accepted to preserve pre-deployment IDs.
 if(Array.isArray(input?.clients))input={format:'openvoley-server-migration',version:1,records:input.clients.map((a:any)=>({namespace:'accounts',owner:'system',key:a.id,value:a}))};
 if(input?.format!=='openvoley-server-migration'||input.version!==1||!Array.isArray(input.records)||input.records.length>1000)throw new CloudStorageError(400,'Respaldo de migración inválido o demasiado grande.');
 const seen=new Set<string>();const writes:any[]=[];
 for(const r of input.records){
  if(!r||!['accounts','commercial','user'].includes(r.namespace)||typeof r.owner!=='string'||!r.owner||typeof r.key!=='string'||!r.key||r.value===null)throw new CloudStorageError(400,'Registro inválido. No se importó información.');
  if(r.namespace==='accounts'&&(r.owner!=='system'||r.value?.id!==r.key||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value?.email||'')||!Number.isFinite(Date.parse(r.value?.firstLoginDate))||!Number.isFinite(r.value?.trialDurationDays)))throw new CloudStorageError(400,'Cuenta inválida. No se importó información.');
  if(r.namespace==='user'&&(!isCloudKey(r.key)||!validateCloudValue(r.key,r.value)))throw new CloudStorageError(400,'Datos personales inválidos.');
  const id=JSON.stringify([r.namespace,r.owner,r.key]);if(seen.has(id))throw new CloudStorageError(400,'El archivo contiene claves duplicadas.');seen.add(id);
  const old=(await readCloud(r.namespace,r.owner,r.key))[0];if(old){if(!isDeepStrictEqual(old.value,r.value))throw new CloudStorageError(409,'La base de destino ya tiene información diferente. No se sobrescribió.');continue;}
  writes.push({...r,baseRevision:0});
 }
 if(!options.dryRun&&writes.length)await cloudRpc('ov_commit_records',{p_writes:writes});return {imported:options.dryRun?0:writes.length,unchanged:input.records.length-writes.length,wouldImport:writes.length,dryRun:!!options.dryRun};
}
