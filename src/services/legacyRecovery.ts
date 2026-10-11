import {getStorageUser,userStorage} from './userStorage';

const labels:Record<string,string>={
 openvoley_saved_teams_v1:'Equipos',openvoley_saved_matches_v1:'Partidos guardados',openvoley_training_sessions_v1:'Entrenamientos',
 openvoley_smart_sports_montages_v1:'Montajes',openvoley_user_cuts:'Acciones de vídeo',openvoley_ai_rallies:'Jugadas analizadas',openvoley_current_match_v1:'Partido activo anterior',
};
export interface RecoveryItem {key:string;label:string;count:number;value:any;error?:string}
export const RECOVERY_CHECKPOINT='openvoley.recovery.previous.v1';
const allowed=(key:string)=>Object.hasOwn(labels,key)||/^openvoley\.whiteboard\.v1\.[a-zA-Z0-9_-]{1,120}$/.test(key);
const record=(v:any)=>v && typeof v==='object' && typeof v.id==='string' && v.id.length>0 && v.id.length<=200;
function valid(key:string,value:any){
 if(key==='openvoley_current_match_v1')return record(value)&&typeof value.homeTeamName==='string'&&typeof value.awayTeamName==='string'&&Array.isArray(value.homePlayers)&&Array.isArray(value.awayPlayers);
 if(key.startsWith('openvoley.whiteboard.'))return value&&Array.isArray(value.tokens)&&Array.isArray(value.strokes);
 if(!Array.isArray(value)||value.length>10000||!value.every(record))return false;
 if(key==='openvoley_saved_teams_v1')return value.every(v=>typeof v.name==='string'&&Array.isArray(v.players));
 if(key==='openvoley_saved_matches_v1')return value.every(v=>v.matchData&&typeof v.homeTeamName==='string'&&typeof v.awayTeamName==='string');
 if(key==='openvoley_training_sessions_v1')return value.every(v=>typeof v.title==='string'&&typeof v.focusProblem==='string'&&Array.isArray(v.exercises));
 if(key==='openvoley_smart_sports_montages_v1')return value.every(v=>typeof v.name==='string'&&typeof v.matchId==='string'&&Array.isArray(v.actionIds));
 return true;
}
export function inspectLegacy():RecoveryItem[]{
 const keys=[...Object.keys(labels)];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('openvoley.whiteboard.')&&allowed(key))keys.push(key)}
 return [...new Set(keys)].flatMap(key=>{
  const raw=localStorage.getItem(key);if(raw===null)return [];
  try{if(raw.length>20*1024*1024)throw new Error('Datos demasiado grandes');const value=JSON.parse(raw);if(!valid(key,value))throw new Error('Formato inválido');return [{key,label:labels[key]||'Pizarra anterior',count:Array.isArray(value)?value.length:1,value}]}
  catch{return [{key,label:labels[key]||'Pizarra anterior',count:0,value:null,error:'No se puede importar: formato inválido o tamaño excesivo.'}]}
 });
}
export function legacyExport(){return {format:'openvoley-legacy-review',version:1,date:new Date().toISOString(),items:inspectLegacy().map(({key,error})=>({key,error,raw:localStorage.getItem(key)}))}}
export function recoverLegacy(selected:string[],ownerConfirmed:boolean,replaceActive=false){
 const owner=getStorageUser();if(owner==='guest'||!ownerConfirmed)throw new Error('Confirmá que los datos pertenecen a tu cuenta.');
 const source=new Map(inspectLegacy().map(v=>[v.key,v]));const writes=new Map<string,string>();let added=0,skipped=0;
 for(const key of new Set(selected)){const item=source.get(key);if(!allowed(key)||!item||item.error)throw new Error('Selección inválida.');
  if(key==='openvoley_current_match_v1'&&!replaceActive){skipped++;continue}
  const raw=userStorage.getItem(key);
  if(Array.isArray(item.value)){
   const existing=raw?JSON.parse(raw):[];if(!Array.isArray(existing))throw new Error('El destino contiene datos inválidos.');
   const seen=new Set(existing.map(v=>v.id));const merged=[...existing];for(const value of item.value){if(seen.has(value.id)){skipped++;continue}seen.add(value.id);merged.push(value);added++}writes.set(key,JSON.stringify(merged));
  }else if(raw!==null&&key!=='openvoley_current_match_v1'){skipped++}
  else{writes.set(key,JSON.stringify(item.value));added++}
 }
 const previous=Object.fromEntries([...writes.keys()].map(key=>[key,userStorage.getItem(key)]));
 userStorage.setItem(RECOVERY_CHECKPOINT,JSON.stringify({owner,date:new Date().toISOString(),previous}));
 try{for(const [key,value]of writes)userStorage.setItem(key,value)}catch(error){for(const [key,value]of Object.entries(previous)){if(value===null)userStorage.removeItem(key);else userStorage.setItem(key,value)}throw error}
 return {added,skipped};
}
export function restoreRecoveryCheckpoint(){
 const raw=userStorage.getItem(RECOVERY_CHECKPOINT);if(!raw)throw new Error('No hay una recuperación anterior.');
 const snapshot=JSON.parse(raw);if(snapshot.owner!==getStorageUser()||!snapshot.previous||typeof snapshot.previous!=='object')throw new Error('Copia inválida.');
 for(const [key,value]of Object.entries(snapshot.previous)){if(!allowed(key)||(value!==null&&typeof value!=='string'))throw new Error('Copia inválida.');}
 for(const [key,value]of Object.entries(snapshot.previous)){if(value===null)userStorage.removeItem(key);else userStorage.setItem(key,value as string)}
}
