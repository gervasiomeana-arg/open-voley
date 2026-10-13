import type {TrainingRepository} from './trainingRepository';
import {readCloud,updateCloud,cloudRpc} from './supabaseStore';
import type {TrainingSession,SmartSportsMontage} from '../types';
const training='openvoley_training_sessions_v1',montages='openvoley_smart_sports_montages_v1';
async function list<T>(user:string,key:string):Promise<T[]>{const v=(await readCloud('user',user,key))[0]?.value;return Array.isArray(v)?v:[];}
async function upsert(user:string,key:string,item:any){await updateCloud('user',user,key,v=>{const a=Array.isArray(v)?v:[];return a.some(x=>x.id===item.id)?a.map(x=>x.id===item.id?item:x):[item,...a];});}
async function remove(user:string,key:string,id:string){await updateCloud('user',user,key,v=>(Array.isArray(v)?v:[]).filter(x=>x.id!==id));}
export class CloudTrainingRepository implements TrainingRepository {
 list(user:string){return list<TrainingSession>(user,training);}
 upsert(user:string,item:TrainingSession){return upsert(user,training,item);}
 delete(user:string,id:string){return remove(user,training,id);}
}
export class CloudMontageRepository {
 list(user:string){return list<SmartSportsMontage>(user,montages);}
 async listInbox(_email:string):Promise<SmartSportsMontage[]>{
  return cloudRpc('ov_montage_inbox',{p_email:_email.toLowerCase().trim()});
 }
 upsert(user:string,item:SmartSportsMontage){return upsert(user,montages,item);}
 delete(user:string,id:string){return remove(user,montages,id);}
}
