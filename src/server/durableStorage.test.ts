import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {PGlite} from '@electric-sql/pglite';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ov-durable-'));
let db=new PGlite(path.join(root,'postgres'));
await db.exec('create role anon; create role authenticated; create role service_role;');
await db.exec(fs.readFileSync('supabase/migrations/20261013_durable_storage.sql','utf8'));
process.env.OPENVOLEY_PERSISTENCE='supabase';process.env.SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only-server-key';process.env.SESSION_SECRET='test-only-secret-at-least-32-characters';
const {cloudRpc,readCloud,writeCloud}=await import('./supabaseStore');
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input:any,init:any)=>{
 if(String(input).startsWith('http://127.0.0.1:'))return originalFetch(input,init);
 assert.ok(String(input).startsWith('https://test.supabase.co/rest/v1/rpc/'));
 const configured=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;assert.equal(init.headers.apikey,configured);assert.equal(init.headers.Authorization,configured?.startsWith('sb_secret_')?undefined:`Bearer ${configured}`);
 const name=String(input).split('/').pop()!,args=JSON.parse(init.body);
 const keys=Object.keys(args);assert.ok(/^ov_[a-z_]+$/.test(name));assert.ok(keys.every(k=>/^p_[a-z_]+$/.test(k)));
 try{const values=keys.map(k=>typeof args[k]==='object'&&args[k]!==null?JSON.stringify(args[k]):args[k]);const q=await db.query(`select public.${name}(${keys.map((k,i)=>`${k} => $${i+1}`).join(',')}) as data`,values);return new Response(JSON.stringify((q.rows[0] as any).data),{status:200});}
 catch(error:any){return new Response(JSON.stringify({code:error.code}),{status:500});}
};
process.env.SUPABASE_SECRET_KEY='sb_secret_mock';
assert.equal((await cloudRpc<any>('ov_storage_ready',{})).schemaVersion,1);
delete process.env.SUPABASE_SECRET_KEY;
const key='openvoley_saved_teams_v1';
const first=await writeCloud('user','A',key,[{id:'team-A'}],0);assert.equal(first.revision,1);
assert.deepEqual(await readCloud('user','B'),[]);
await assert.rejects(()=>writeCloud('user','A',key,[{id:'stale'}],0),(e:any)=>e.status===409);
await writeCloud('user','A',key,[{id:'edited'}],1);
let backups=await cloudRpc<any[]>('ov_backups',{p_owner:'A',p_key:key});assert.ok(backups.length>=1);
await assert.rejects(()=>cloudRpc('ov_restore',{p_owner:'B',p_key:key,p_backup_id:backups[0].id,p_base_revision:0}));
await cloudRpc('ov_restore',{p_owner:'A',p_key:key,p_backup_id:backups[0].id,p_base_revision:2});assert.equal((await readCloud('user','A',key))[0].value[0].id,'team-A');
// An optimistic-conflict batch must roll back every preceding write.
await assert.rejects(()=>cloudRpc('ov_commit_records',{p_writes:[{namespace:'user',owner:'A',key:'a-new',value:[],baseRevision:0},{namespace:'user',owner:'A',key,value:[],baseRevision:0}]}));assert.deepEqual(await readCloud('user','A','a-new'),[]);
// Immutable revision and daily retention are enforced by the database.
for(let n=3;n<17;n++)await writeCloud('user','A',key,[{id:'v'+n}],n);
backups=await cloudRpc<any[]>('ov_backups',{p_owner:'A',p_key:key});assert.equal(backups.filter(b=>b.kind==='revision').length,10);assert.equal(backups.filter(b=>b.kind==='daily').length,1);
await db.exec('set role anon');await assert.rejects(()=>db.query("select public.ov_read_records('user','A',null)"));await db.exec('reset role');
const {loadAccounts,saveAccounts}=await import('./accountStore');
await saveAccounts([{id:'A',email:'a@example.test',firstLoginDate:'2026-10-01',trialDurationDays:7},{id:'B',email:'b@example.test',trialDurationDays:7}]);
const one=await loadAccounts(),two=await loadAccounts();one[0].name='Updated';await saveAccounts(one);two[1].name='Independent';await saveAccounts(two);assert.equal((await loadAccounts())[0].name,'Updated');
const stale=await loadAccounts(),fresh=await loadAccounts();fresh[0].name='Fresh';await saveAccounts(fresh);stale[0].name='Stale';await assert.rejects(()=>saveAccounts(stale),(e:any)=>e.status===409);
await db.close();db=new PGlite(path.join(root,'postgres'));assert.equal((await loadAccounts())[0].name,'Fresh');assert.equal((await readCloud('user','A',key))[0].value[0].id,'v16');
// Export pages are a single immutable point-in-time snapshot.
const snapshot=await cloudRpc<any>('ov_prepare_export',{});
const exported=await cloudRpc<any>('ov_export_page',{p_export_id:snapshot.exportId,p_after:0,p_limit:20});assert.ok(exported.rows.length>0);
const beforeExport=JSON.stringify(exported.rows);await writeCloud('user','A',key,[{id:'after-snapshot'}],17);
assert.equal(JSON.stringify((await cloudRpc<any>('ov_export_page',{p_export_id:snapshot.exportId,p_after:0,p_limit:20})).rows),beforeExport);
await cloudRpc('ov_finish_export',{p_export_id:snapshot.exportId});
const {encryptBackup,decryptBackup}=await import('../../scripts/backupCipher.mjs');
const encrypted=encryptBackup(exported.rows,'a-separate-test-only-backup-encryption-key');assert.deepEqual(decryptBackup(encrypted,'a-separate-test-only-backup-encryption-key'),exported.rows);
assert.throws(()=>decryptBackup({...encrypted,tag:Buffer.alloc(16).toString('base64')},'a-separate-test-only-backup-encryption-key'));
assert.throws(()=>decryptBackup(encrypted,'another-separate-test-only-backup-encryption-key'));
// Actual HTTP routes derive ownership from verified sessions, not request JSON.
const express=(await import('express')).default;
const {securityMiddleware}=await import('./securityMiddleware');const {asyncHandler,storageErrorHandler}=await import('./asyncHandler');
const {userDataRouter}=await import('./userDataRouter');const {createSessionToken}=await import('./sessionSecurity');
const accounts=await loadAccounts();accounts[0].firstLoginDate=new Date().toISOString();accounts[1].firstLoginDate='2000-01-01';await saveAccounts(accounts);
const tokenA=await createSessionToken({userId:'A',email:'a@example.test'}),tokenB=await createSessionToken({userId:'B',email:'b@example.test'});
const app=express();app.use(express.json(),asyncHandler(securityMiddleware));app.use('/api/user-data',userDataRouter);app.use(storageErrorHandler);
const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${(server.address() as any).port}`;
async function call(token:string,owner:string,method='GET',path='',body:any=undefined){return originalFetch(base+'/api/user-data'+path,{method,headers:{authorization:`Bearer ${token}`,'X-Openvoley-User':owner,'Content-Type':'application/json',Origin:base},body:body===undefined?undefined:JSON.stringify(body)});}
assert.equal((await originalFetch(base+'/api/user-data')).status,401);
assert.equal((await call(tokenA,'B')).status,409);
const own=await call(tokenA,'A');assert.equal(own.status,200);assert.equal((await own.json()).records[0].value[0].id,'after-snapshot');
assert.equal((await call(tokenB,'B')).status,200); // Expired users can retrieve their own data.
assert.equal((await call(tokenB,'B','PUT','/'+key,{value:[],baseRevision:0})).status,403);
assert.equal((await call(tokenA,'A','PUT','/arbitrary',{value:[],baseRevision:0})).status,400);
assert.equal((await call(tokenA,'A','PUT','/'+key,{value:[],baseRevision:0,owner:'B'})).status,409);
await new Promise<void>(resolve=>server.close(()=>resolve()));
// Migration validates the entire file and preserves existing identity and trial dates.
const {importServerMigration}=await import('./storageMigration');
const migrating={id:'migration-test',email:'migration@example.test',firstLoginDate:'2026-10-01',trialDurationDays:7};
assert.equal((await importServerMigration({clients:[migrating]})).imported,1);
assert.equal((await importServerMigration({clients:[{trialDurationDays:7,firstLoginDate:'2026-10-01',email:'migration@example.test',id:'migration-test'}]})).unchanged,1);
await assert.rejects(()=>importServerMigration({clients:[{...migrating,trialDurationDays:30}]}),(e:any)=>e.status===409);
assert.equal((await readCloud('accounts','system','migration-test'))[0].value.firstLoginDate,'2026-10-01');
await assert.rejects(()=>importServerMigration({format:'openvoley-server-migration',version:1,records:[{namespace:'user',owner:'A',key:'openvoley_ai_rallies',value:[{id:'not-committed'}]},{namespace:'user',owner:'A',key:'invalid',value:[]}]}));
assert.deepEqual(await readCloud('user','A','openvoley_ai_rallies'),[]);
// Outages fail closed: no local JSON fallback or falsely acknowledged writes.
globalThis.fetch=async()=>{throw new Error('offline');};await assert.rejects(()=>loadAccounts(),(e:any)=>e.status===503);await assert.rejects(()=>writeCloud('user','A',key,[],17),(e:any)=>e.status===503);
globalThis.fetch=originalFetch;await db.close();fs.rmSync(root,{recursive:true,force:true});
console.log('Durable PostgreSQL checks passed: account isolation, CAS, atomic rollback, backups, restoration, RLS grants, independent edits, restart and outage behavior.');
