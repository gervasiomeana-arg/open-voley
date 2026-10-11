import {getStorageUser,userStorage} from './userStorage';

const labels:Record<string,string>={
 openvoley_saved_teams_v1:'Equipos',openvoley_saved_matches_v1:'Partidos guardados',openvoley_training_sessions_v1:'Entrenamientos',
 openvoley_smart_sports_montages_v1:'Montajes',openvoley_user_cuts:'Acciones de vídeo',openvoley_ai_rallies:'Jugadas analizadas',openvoley_current_match_v1:'Partido activo anterior',
};
export interface RecoveryItem {key:string;targetKey?:string;label:string;count:number;value:any;raw?:string;error?:string}
export const RECOVERY_CHECKPOINT='openvoley.recovery.previous.v1';
export const DELETED_RECORDS='openvoley.recovery.deleted.v1';
const allowed=(key:string)=>Object.hasOwn(labels,key)||/^openvoley\.whiteboard\.v1\.[a-zA-Z0-9_-]{1,120}$/.test(key);
const record=(v:any)=>v && typeof v==='object' && typeof v.id==='string' && v.id.length>0 && v.id.length<=200;
const players=(v:any)=>Array.isArray(v)&&v.length<=1000&&v.every(p=>record(p)&&typeof p.name==='string'&&Number.isInteger(p.number)&&p.number>=0&&p.number<=999&&['S','OH','OPP','MB','L'].includes(p.position));
function valid(key:string,value:any){
 if(key==='openvoley_current_match_v1')return record(value)&&typeof value.homeTeamName==='string'&&typeof value.awayTeamName==='string'&&players(value.homePlayers)&&players(value.awayPlayers);
 if(key.startsWith('openvoley.whiteboard.'))return value&&Array.isArray(value.tokens)&&Array.isArray(value.strokes);
 if(!Array.isArray(value)||value.length>10000||!value.every(record))return false;
 if(key==='openvoley_saved_teams_v1')return value.every(v=>typeof v.name==='string'&&v.name.trim()&&players(v.players));
 if(key==='openvoley_saved_matches_v1')return value.every(v=>v.matchData&&typeof v.matchData==='object'&&!Array.isArray(v.matchData)&&typeof v.homeTeamName==='string'&&typeof v.awayTeamName==='string'&&(v.matchData.homePlayers===undefined||players(v.matchData.homePlayers))&&(v.matchData.awayPlayers===undefined||players(v.matchData.awayPlayers)));
 if(key==='openvoley_training_sessions_v1')return value.every(v=>typeof v.title==='string'&&typeof v.focusProblem==='string'&&Array.isArray(v.exercises));
 if(key==='openvoley_smart_sports_montages_v1')return value.every(v=>typeof v.name==='string'&&typeof v.matchId==='string'&&Array.isArray(v.actionIds));
 return true;
}
function item(source:string,target:string,raw:string,label:string):RecoveryItem{
 try{if(raw.length>20*1024*1024)throw new Error('Datos demasiado grandes');const value=JSON.parse(raw);if(!valid(target,value))throw new Error('Formato inválido');return {key:source,targetKey:target,label,count:Array.isArray(value)?value.length:1,value,raw}}
 catch{return {key:source,targetKey:target,label,count:0,value:null,raw,error:'No se puede importar: formato inválido o tamaño excesivo.'}}
}
function reviewRosters(result:RecoveryItem[],entry:RecoveryItem){
 if(entry.error)return;
 const records=entry.targetKey==='openvoley_saved_matches_v1'?entry.value:entry.targetKey==='openvoley_current_match_v1'?[entry.value]:[];
 for(const record of records){const match=record.matchData||record;
  for(const side of ['home','away']){const roster=match[side+'Players'],name=record[side+'TeamName']||match[side+'TeamName'];
   if(typeof name!=='string'||!players(roster)||!roster.length)continue;
   const id=record[side+'TeamId']||match[side+'TeamId']||`recovered_${record.id}_${side}`;
   const value=[{id,name,shortName:name.slice(0,8),category:match.category||'Plantel recuperado',gender:match.gender||'Mixto',type:side==='home'?'my_team':'opponent',players:roster,createdAt:record.updatedAt||'1970-01-01T00:00:00.000Z',updatedAt:record.updatedAt||'1970-01-01T00:00:00.000Z'}];
   result.push({key:entry.key+'#roster:'+record.id+':'+side,targetKey:'openvoley_saved_teams_v1',label:'Plantel '+name+' · '+entry.label,count:1,value});
  }
 }
}
function addReview(result:RecoveryItem[],entry:RecoveryItem){result.push(entry);reviewRosters(result,entry)}
// Discovery is read-only. Previous account scopes are shown only in the administrator review UI.
export function inspectLegacy(includePreviousAccounts=false):RecoveryItem[]{
 const result:RecoveryItem[]=[];const active=getStorageUser();
 for(let i=0;i<localStorage.length;i++){
  const source=localStorage.key(i);if(!source)continue;
  const scope=/^ov-user:([^:]+):(.+)$/.exec(source);
  const target=scope?scope[2]:source;let owner:string|null=null;try{owner=scope?decodeURIComponent(scope[1]):null}catch{continue}
  if(owner&&owner!==active&&owner!=='guest'&&!includePreviousAccounts)continue;
  const raw=localStorage.getItem(source);if(raw===null)continue;
  const origin=owner===active?'Esta cuenta':owner==='guest'?'Invitado':owner?'Cuenta anterior '+owner:'Datos históricos compartidos';
  if(target===RECOVERY_CHECKPOINT){
   try{const snapshot=JSON.parse(raw);if(!snapshot.previous||typeof snapshot.previous!=='object')continue;
    if(snapshot.owner!==active&&!includePreviousAccounts)continue;
    for(const [key,value]of Object.entries(snapshot.previous)){if(allowed(key)&&typeof value==='string')addReview(result,item(source+'#'+key,key,value,(labels[key]||'Pizarra')+' · Copia previa · '+origin))}
   }catch{}continue;
  }
  if(!allowed(target)||owner===active)continue;
  addReview(result,item(source,target,raw,(labels[target]||'Pizarra anterior')+' · '+origin));
 }
 return result;
}
export function legacyExport(includePreviousAccounts=false){return {format:'openvoley-legacy-review',version:1,date:new Date().toISOString(),items:inspectLegacy(includePreviousAccounts).map(v=>({key:v.targetKey||v.key,source:v.key,error:v.error,raw:v.raw??JSON.stringify(v.value)}))}}
export function deletedIds(key:string):Set<string>{const raw=userStorage.getItem(DELETED_RECORDS);if(!raw)return new Set();const all=JSON.parse(raw);return new Set(Array.isArray(all[key])?all[key]:[])}
export function markDeleted(key:string,id:string){const raw=userStorage.getItem(DELETED_RECORDS);const all=raw?JSON.parse(raw):{};all[key]=[...new Set([...(all[key]||[]),id])];userStorage.setItem(DELETED_RECORDS,JSON.stringify(all))}
function commit(writes:Map<string,string>){
 const previous=Object.fromEntries([...writes.keys()].map(key=>[key,userStorage.getItem(key)]));
 const oldCheckpoint=userStorage.getItem(RECOVERY_CHECKPOINT);
 userStorage.setItem(RECOVERY_CHECKPOINT,JSON.stringify({owner:getStorageUser(),date:new Date().toISOString(),previous}));
 try{for(const [key,value]of writes)userStorage.setItem(key,value)}catch(error){
  for(const [key,value]of Object.entries(previous)){if(value===null)userStorage.removeItem(key);else userStorage.setItem(key,value)}
  if(oldCheckpoint===null)userStorage.removeItem(RECOVERY_CHECKPOINT);else userStorage.setItem(RECOVERY_CHECKPOINT,oldCheckpoint);
  throw error;
 }
}
export function recoverItems(items:RecoveryItem[],ownerConfirmed:boolean,replaceActive=false){
 if(getStorageUser()==='guest'||!ownerConfirmed)throw new Error('Revisá los datos y confirmá que pertenecen a tu cuenta.');
 const writes=new Map<string,string>();let added=0,skipped=0;
 for(const entry of items){const key=entry.targetKey||entry.key;if(!allowed(key)||entry.error||!valid(key,entry.value))throw new Error('Selección inválida.');
  if(key==='openvoley_current_match_v1'&&!replaceActive){skipped++;continue}
  const raw=writes.get(key)??userStorage.getItem(key);
  if(Array.isArray(entry.value)){
   const existing=raw?JSON.parse(raw):[];if(!Array.isArray(existing))throw new Error('El destino contiene datos inválidos.');
   const seen=new Set(existing.map(v=>v.id)),deleted=deletedIds(key),merged=[...existing];
   for(const value of entry.value){if(seen.has(value.id)||deleted.has(value.id)){skipped++;continue}seen.add(value.id);merged.push(key==='openvoley_saved_teams_v1'?{shortName:value.name.slice(0,8),category:'Plantel recuperado',gender:'Mixto',type:'my_team',createdAt:'1970-01-01T00:00:00.000Z',updatedAt:'1970-01-01T00:00:00.000Z',...value}:value);added++}
   writes.set(key,JSON.stringify(merged));
  }else if(raw!==null&&key!=='openvoley_current_match_v1'){skipped++}
  else{writes.set(key,JSON.stringify(entry.value));added++}
 }
 if(writes.size)commit(writes);
 return {added,skipped};
}
export function recoverLegacy(selected:string[],ownerConfirmed:boolean,replaceActive=false,includePreviousAccounts=false){
 const source=new Map(inspectLegacy(includePreviousAccounts).map(v=>[v.key,v]));
 return recoverItems([...new Set(selected)].map(key=>{const entry=source.get(key);if(!entry)throw new Error('Selección inválida.');return entry}),ownerConfirmed,replaceActive);
}
export function inspectBackup(json:string):RecoveryItem[]{
 if(json.length>20*1024*1024)throw new Error('El respaldo supera 20 MB.');
 const parsed=JSON.parse(json);const result:RecoveryItem[]=[];
 const add=(key:string,value:any)=>{if(!allowed(key)||!valid(key,value))throw new Error('El respaldo contiene datos inválidos.');addReview(result,{key:'archivo:'+result.length,targetKey:key,label:labels[key]||'Pizarra',count:Array.isArray(value)?value.length:1,value})};
 if(parsed?.format==='openvoley-legacy-review'&&Array.isArray(parsed.items)){for(const v of parsed.items){if(v.error||typeof v.raw!=='string')throw new Error('El respaldo contiene datos inválidos.');add(v.key,JSON.parse(v.raw))}}
 else if(Array.isArray(parsed)&&parsed.length){add(parsed[0]?.matchData?'openvoley_saved_matches_v1':'openvoley_saved_teams_v1',parsed)}
 else if(valid('openvoley_current_match_v1',parsed)){add('openvoley_current_match_v1',parsed)}
 else if(parsed&&typeof parsed==='object'){
  if(parsed.teams!==undefined)add('openvoley_saved_teams_v1',parsed.teams);
  if(parsed.matches!==undefined)add('openvoley_saved_matches_v1',parsed.matches);
  if(parsed.currentMatch!==undefined)add('openvoley_current_match_v1',parsed.currentMatch);
  if(parsed.match!==undefined)add('openvoley_current_match_v1',parsed.match);
 }
 if(!result.length)throw new Error('Formato de respaldo no reconocido.');return result;
}
export function restoreRecoveryCheckpoint(){
 const raw=userStorage.getItem(RECOVERY_CHECKPOINT);if(!raw)throw new Error('No hay una recuperación anterior.');
 const snapshot=JSON.parse(raw);if(snapshot.owner!==getStorageUser()||!snapshot.previous||typeof snapshot.previous!=='object')throw new Error('Copia inválida.');
 for(const [key,value]of Object.entries(snapshot.previous)){if(!allowed(key)||(value!==null&&typeof value!=='string'))throw new Error('Copia inválida.');}
 for(const [key,value]of Object.entries(snapshot.previous)){if(value===null)userStorage.removeItem(key);else userStorage.setItem(key,value as string)}
}

export function exportCurrentData(){
 const items=[];
 for(let i=0;i<localStorage.length;i++){const source=localStorage.key(i),prefix=`ov-user:${encodeURIComponent(getStorageUser())}:`;if(!source?.startsWith(prefix))continue;
  const key=source.slice(prefix.length);if(!allowed(key))continue;const raw=localStorage.getItem(source);if(raw!==null)items.push({key,raw});
 }
 return {format:'openvoley-legacy-review',version:1,date:new Date().toISOString(),items};
}
export function deleteStoredRecord(key:string,id:string,value:string){
 const previous=userStorage.getItem(key),previousDeleted=userStorage.getItem(DELETED_RECORDS);
 try{markDeleted(key,id);userStorage.setItem(key,value)}catch(error){
  if(previous===null)userStorage.removeItem(key);else userStorage.setItem(key,previous);
  if(previousDeleted===null)userStorage.removeItem(DELETED_RECORDS);else userStorage.setItem(DELETED_RECORDS,previousDeleted);
  throw error;
 }
}
