import {getStorageUser,subscribeStorageMutations} from './userStorage';
import {isCloudKey,validateCloudValue} from '../shared/userDataSchema';
interface RecordValue {key:string;value:any;revision:number;updatedAt:string}
interface Pending {value:any;baseRevision:number}
export interface SyncStatus {state:'local'|'loading'|'synced'|'pending'|'conflict'|'error';message:string;pending:number;conflicts:string[]}
let owner='guest',enabled=false,generation=0,mutationVersion=0,busy=false,timer:ReturnType<typeof setTimeout>|undefined;
let status:SyncStatus={state:'local',message:'Copia local. Nube aún no activada.',pending:0,conflicts:[]};
const subscribers=new Set<(s:SyncStatus)=>void>();
const prefix=(id:string)=>`ov-user:${encodeURIComponent(id)}:`;
const storage=(key:string,id=owner)=>prefix(id)+key;
const ackKey='openvoley.cloud.ack.v1';
async function digest(value:any){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(bytes)).map(n=>n.toString(16).padStart(2,'0')).join('');}
const pendingKey='openvoley.cloud.pending.v1',revisionsKey='openvoley.cloud.revisions.v1',conflictsKey='openvoley.cloud.conflicts.v1';
function read<T>(key:string,fallback:T,id=owner):T{const raw=localStorage.getItem(storage(key,id));return raw===null?fallback:JSON.parse(raw);}
function put(key:string,value:any,id=owner){localStorage.setItem(storage(key,id),JSON.stringify(value));}
function publish(state:SyncStatus['state'],message:string){let pending=0,conflicts:string[]=[];try{pending=Object.keys(read(pendingKey,{})).length;conflicts=Object.keys(read(conflictsKey,{})).length?Object.keys(read(conflictsKey,{})):[];}catch{state='error';message='La copia local requiere revisión.';}status={state,message,pending,conflicts};for(const f of subscribers)f(status);}
export function getDataSyncStatus(){return status;}
export function subscribeDataSync(f:(s:SyncStatus)=>void){subscribers.add(f);return ()=>{subscribers.delete(f);};}
export function cloudOwnsUserData(){return enabled&&owner===getStorageUser()&&owner!=='guest';}
function schedule(){if(timer)clearTimeout(timer);timer=setTimeout(()=>void flushUserData(),1500);}
subscribeStorageMutations(event=>{
 if(event.key===null){if(event.owner!==owner){generation++;owner=event.owner;enabled=false;if(timer)clearTimeout(timer);publish('local','Copia local. Verificando nube.');}return;}
 if(!isCloudKey(event.key)||event.owner==='guest')return;
 mutationVersion++;
 if(event.error){publish('error','No se pudo guardar en este dispositivo. Exportá un respaldo antes de continuar.');return;}
 try{
  const value=event.value===null?null:parseLocal(event.key,event.value);
  if(!validateCloudValue(event.key,value))throw new Error();
  const pending=read<Record<string,Pending>>(pendingKey,{},event.owner),revisions=read<Record<string,number>>(revisionsKey,{},event.owner);
  pending[event.key]={value,baseRevision:pending[event.key]?.baseRevision??revisions[event.key]??0};put(pendingKey,pending,event.owner);
  if(event.owner===owner){publish('pending','Cambios guardados en este dispositivo; pendientes de confirmar en la nube.');if(enabled)schedule();else publish('local','Datos en este dispositivo. Nube aún no activada.');}
 }catch{if(event.owner===owner)publish('error','No se pudo preparar la copia en la nube. Exportá un respaldo local.');}
});
async function request(path:string,init:RequestInit,id:string){const response=await fetch('/api/user-data'+path,{...init,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Openvoley-User':id,...init.headers},signal:AbortSignal.timeout(15000)});const data=await response.json();return {response,data};}
const rawKeys=new Set(['openvoley.courtView','openvoley.courtSides','openvoley_scouting_mode','openvoley_recent_home_team_id']);
const parseLocal=(key:string,raw:string)=>rawKeys.has(key)?raw:JSON.parse(raw);
function applyRecord(record:RecordValue,id:string){const key=storage(record.key,id);if(record.value===null)localStorage.removeItem(key);else localStorage.setItem(key,rawKeys.has(record.key)?String(record.value):JSON.stringify(record.value));}
function notifyHydrated(){if(typeof window!=='undefined')window.dispatchEvent(new Event('openvoley:cloud-hydrated'));}
export async function initializeUserDataSync(id:string){
 owner=id;enabled=true;const run=++generation;publish('loading','Comprobando la copia permanente…');
 try{
  const {response,data}=await request('',{method:'GET',cache:'no-store'},id);
  if(run!==generation||getStorageUser()!==id)return;
  if(!response.ok)throw new Error();
  if(data.enabled!==true){enabled=false;publish('local','Datos en este dispositivo. Nube aún no activada.');return;}
  if(!Array.isArray(data.records)||data.records.some((r:any)=>!isCloudKey(r.key)||!validateCloudValue(r.key,r.value)||!Number.isSafeInteger(r.revision)||r.revision<1))throw new Error();
  const ack=read<Record<string,string>>(ackKey,{},id);
  const pending=read<Record<string,Pending>>(pendingKey,{},id),revisions=read<Record<string,number>>(revisionsKey,{},id),conflicts=read<Record<string,RecordValue>>(conflictsKey,{},id);
  const remote=new Map<string,RecordValue>(data.records.map((r:RecordValue)=>[r.key,r]));
  const keys=new Set<string>(remote.keys());for(let i=0;i<localStorage.length;i++){const full=localStorage.key(i)!;if(full.startsWith(prefix(id))&&isCloudKey(full.slice(prefix(id).length)))keys.add(full.slice(prefix(id).length));}
  const mutationAtStart=mutationVersion;
  const hashes=new Map<string,string>();
  await Promise.all([...keys].map(async key=>{const raw=localStorage.getItem(storage(key,id));if(raw!==null)hashes.set('local:'+key,await digest(parseLocal(key,raw)));const r=remote.get(key);if(r)hashes.set('remote:'+key,await digest(r.value));}));
  if(run!==generation||getStorageUser()!==id)return;
  if(mutationAtStart!==mutationVersion){await initializeUserDataSync(id);return;}
  for(const key of keys){
   const r=remote.get(key),raw=localStorage.getItem(storage(key,id));
   if(pending[key]){if(r&&r.revision!==pending[key].baseRevision&&JSON.stringify(r.value)!==JSON.stringify(pending[key].value))conflicts[key]=r;else if(r&&JSON.stringify(r.value)===JSON.stringify(pending[key].value)){delete pending[key];delete conflicts[key];revisions[key]=r.revision;ack[key]=hashes.get('remote:'+key)!;}continue;}
   if(!r){if(raw!==null){const value=parseLocal(key,raw);if(!validateCloudValue(key,value))throw new Error();pending[key]={value,baseRevision:0};}continue;}
   if(raw===null||JSON.stringify(parseLocal(key,raw))===JSON.stringify(r.value)||(ack[key]&&ack[key]===hashes.get('local:'+key))){applyRecord(r,id);revisions[key]=r.revision;ack[key]=hashes.get('remote:'+key)!;delete conflicts[key];}
   else {conflicts[key]=r;pending[key]={value:parseLocal(key,raw),baseRevision:revisions[key]??0};}
  }
  if(run!==generation||getStorageUser()!==id)return;
  put(ackKey,ack,id);put(pendingKey,pending,id);put(revisionsKey,revisions,id);put(conflictsKey,conflicts,id);notifyHydrated();
  if(Object.keys(conflicts).length)publish('conflict','Hay versiones diferentes. Revisalas antes de reemplazar datos.');else await flushUserData();
 }catch{if(run===generation)publish('error','La nube no respondió. Conservamos la copia local; el guardado permanente no está confirmado.');}
}
export async function flushUserData(){
 if(busy||!enabled||owner==='guest'||owner!==getStorageUser())return;
 busy=true;const id=owner,run=generation;
 try{
  for(const key of Object.keys(read<Record<string,Pending>>(pendingKey,{},id))){
   if(run!==generation||id!==getStorageUser())return;
   if(read<Record<string,RecordValue>>(conflictsKey,{},id)[key])continue;
   const item=read<Record<string,Pending>>(pendingKey,{},id)[key];if(!item)continue;
   const {response,data}=await request('/'+encodeURIComponent(key),{method:'PUT',body:JSON.stringify(item)},id);
   if(run!==generation||id!==getStorageUser())return;
   if(!response.ok){if(response.status===409&&data.code!=='SESSION_CHANGED'){busy=false;await initializeUserDataSync(id);return;}throw new Error();}
   const record=data.record;if(data.success!==true||record?.key!==key||!Number.isSafeInteger(record.revision))throw new Error();
   const hash=await digest(item.value);if(run!==generation||id!==getStorageUser())return;
   const pending=read<Record<string,Pending>>(pendingKey,{},id),revisions=read<Record<string,number>>(revisionsKey,{},id),ack=read<Record<string,string>>(ackKey,{},id);revisions[key]=record.revision;ack[key]=hash;
   if(JSON.stringify(pending[key]?.value)===JSON.stringify(item.value))delete pending[key];else if(pending[key])pending[key].baseRevision=record.revision;
   put(ackKey,ack,id);put(revisionsKey,revisions,id);put(pendingKey,pending,id);
  }
  const conflicts=read(conflictsKey,{},id),pending=read(pendingKey,{},id);
  if(Object.keys(conflicts).length)publish('conflict','Revisá las versiones antes de continuar la sincronización.');else if(Object.keys(pending).length){publish('pending','Cambios pendientes de confirmar.');schedule();}else publish('synced','Datos confirmados en la nube.');
 }catch{if(run===generation)publish('error','No se confirmó el guardado en la nube. La copia local sigue disponible.');}
 finally{busy=false;if(run!==generation&&enabled&&owner!=='guest')schedule();}
}
export async function resolveDataConflict(key:string,choice:'local'|'cloud'){
 const id=owner,run=generation,r=read<Record<string,RecordValue>>(conflictsKey,{},id)[key];if(!r)return;
 const original=read<Record<string,Pending>>(pendingKey,{},id)[key];
 const hash=choice==='cloud'?await digest(r.value):undefined;
 if(choice==='cloud'&&original){const {response}=await request('/'+encodeURIComponent(key)+'/archive',{method:'POST',body:JSON.stringify(original)},id);if(!response.ok)throw new Error('No se respaldó la versión local. No se reemplazaron tus datos.');}
 if(run!==generation||id!==getStorageUser())return;
 const pending=read<Record<string,Pending>>(pendingKey,{},id),conflicts=read<Record<string,RecordValue>>(conflictsKey,{},id),revisions=read<Record<string,number>>(revisionsKey,{},id);
 if(JSON.stringify(pending[key])!==JSON.stringify(original)||JSON.stringify(conflicts[key])!==JSON.stringify(r))throw new Error('Hubo nuevos cambios. Revisá nuevamente las versiones antes de reemplazar datos.');
 if(choice==='cloud'){applyRecord(r,id);delete pending[key];revisions[key]=r.revision;const ack=read<Record<string,string>>(ackKey,{},id);ack[key]=hash!;put(ackKey,ack,id);}else if(pending[key])pending[key].baseRevision=r.revision;
 delete conflicts[key];put(pendingKey,pending,id);put(conflictsKey,conflicts,id);put(revisionsKey,revisions,id);notifyHydrated();await flushUserData();
}
export async function listDataBackups(key:string){const user=owner,run=generation;const {response,data}=await request('/'+encodeURIComponent(key)+'/backups',{method:'GET',cache:'no-store'},user);if(!response.ok||run!==generation||user!==getStorageUser())throw new Error('No se pudieron consultar los respaldos de la cuenta actual.');return data.backups as Array<{id:number;createdAt:string;revision:number;kind:string}>;}
export async function restoreDataBackup(key:string,id:number){
 const user=owner,run=generation,revision=read<Record<string,number>>(revisionsKey,{},user)[key]??0;
 if(read<Record<string,Pending>>(pendingKey,{},user)[key])throw new Error('Primero resolvé los cambios pendientes de esta sección.');
 const {response,data}=await request('/'+encodeURIComponent(key)+'/restore',{method:'POST',body:JSON.stringify({backupId:id,baseRevision:revision})},user);
 if(!response.ok||run!==generation||user!==getStorageUser())throw new Error('La restauración no se confirmó. Actualizá la copia antes de reintentar.');
 const r=data.records?.[0];if(!r||r.key!==key||!validateCloudValue(key,r.value)||!Number.isSafeInteger(r.revision))throw new Error('Respuesta no válida.');
 const hash=await digest(r.value);if(run!==generation||user!==getStorageUser())return;
 if(read<Record<string,Pending>>(pendingKey,{},user)[key]){await initializeUserDataSync(user);throw new Error('Hubo cambios durante la restauración. Revisá ambas versiones.');}
 applyRecord(r,user);const revisions=read<Record<string,number>>(revisionsKey,{},user),ack=read<Record<string,string>>(ackKey,{},user);revisions[key]=r.revision;ack[key]=hash;put(ackKey,ack,user);put(revisionsKey,revisions,user);notifyHydrated();publish('synced','Respaldo restaurado y confirmado en la nube.');
}
if(typeof window!=='undefined')window.addEventListener('online',()=>{if(enabled)void initializeUserDataSync(owner);});
