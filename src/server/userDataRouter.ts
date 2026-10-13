import { Router } from 'express';
import {asyncHandler} from './asyncHandler';
import {getSessionFromRequest} from './sessionSecurity';
import {CloudStorageError,cloudRpc,durableStorageEnabled,readCloud,writeCloud} from './supabaseStore';
import {isCloudKey,validateCloudValue} from '../shared/userDataSchema';
export const userDataRouter=Router();
userDataRouter.use(asyncHandler(async(req:any,res:any,next:any)=>{
 const session=await getSessionFromRequest(req);if(!session)return res.status(401).json({error:'Authentication required'});
 if(req.headers['x-openvoley-user']!==session.userId)return res.status(409).json({code:'SESSION_CHANGED',error:'La sesión cambió. No se guardaron los datos en otra cuenta.'});
 res.locals.owner=session.userId;next();
}));
userDataRouter.get('/',asyncHandler(async(_req:any,res:any)=>{
 if(!durableStorageEnabled())return res.json({enabled:false,records:[]});
 await cloudRpc('ov_storage_ready',{});
 const records=await readCloud('user',res.locals.owner);
 if(records.some(r=>!isCloudKey(r.key)||!validateCloudValue(r.key,r.value)))throw new CloudStorageError(503,'La copia del servidor requiere revisión. No se modificaron tus datos locales.');
 res.setHeader('Cache-Control','no-store');res.json({enabled:true,records});
}));
userDataRouter.use((_req,res,next)=>{if(!durableStorageEnabled())return res.status(503).json({error:'El guardado permanente aún no está activado.'});next();});
userDataRouter.put('/:key',asyncHandler(async(req:any,res:any)=>{
 const key=String(req.params.key),revision=req.body?.baseRevision,value=req.body?.value;
 if(!Number.isSafeInteger(revision)||revision<0||!validateCloudValue(key,value))return res.status(400).json({error:'Datos o versión no válidos.'});
 const record=await writeCloud('user',res.locals.owner,key,value,revision);res.json({success:true,record});
}));
userDataRouter.get('/:key/backups',asyncHandler(async(req:any,res:any)=>{
 const key=String(req.params.key);if(!isCloudKey(key))return res.status(400).json({error:'Clave inválida.'});
 res.setHeader('Cache-Control','no-store');res.json({backups:await cloudRpc('ov_backups',{p_owner:res.locals.owner,p_key:key})});
}));
userDataRouter.post('/:key/restore',asyncHandler(async(req:any,res:any)=>{
 const key=String(req.params.key),id=req.body?.backupId,revision=req.body?.baseRevision;
 if(!isCloudKey(key)||!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(revision)||revision<0)return res.status(400).json({error:'Restauración inválida.'});
 const records=await cloudRpc('ov_restore',{p_owner:res.locals.owner,p_key:key,p_backup_id:id,p_base_revision:revision});res.json({success:true,records});
}));

userDataRouter.post('/:key/archive',asyncHandler(async(req:any,res:any)=>{
 const key=String(req.params.key),value=req.body?.value,revision=req.body?.baseRevision;
 if(!validateCloudValue(key,value)||!Number.isSafeInteger(revision)||revision<0)return res.status(400).json({error:'Copia local inválida.'});
 const backup=await cloudRpc('ov_archive_local',{p_owner:res.locals.owner,p_key:key,p_value:value,p_revision:revision});res.json({success:true,backup});
}));
