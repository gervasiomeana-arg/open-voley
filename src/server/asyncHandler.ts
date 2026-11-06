import type { RequestHandler } from 'express';
import { CloudStorageError } from './supabaseStore';
export const asyncHandler=(handler:any):RequestHandler=>(req,res,next)=>Promise.resolve().then(()=>handler(req,res,next)).catch(next);
export function storageErrorHandler(error:any,_req:any,res:any,next:any){
 if(!(error instanceof CloudStorageError)){if(_req.path.startsWith('/api/'))return res.status([400,413].includes(error.status)?error.status:500).json({error:'No se pudo completar la operación. Los datos no se confirmaron.'});return next(error);}
 return res.status(error.status).json({error:error.message,storageUnavailable:error.status===503,conflict:error.status===409});
}
