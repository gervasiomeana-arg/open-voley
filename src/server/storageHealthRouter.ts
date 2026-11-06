import {cloudRpc,durableStorageEnabled} from './supabaseStore';
import {asyncHandler} from './asyncHandler';
import { Router } from 'express';
import { getSessionFromRequest } from './sessionSecurity';
import { getTrainingRepositoryStatus } from './trainingRepository';
const router = Router();
router.get('/', asyncHandler(async (req, res) => {
    const session = await getSessionFromRequest(req);
    if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if(durableStorageEnabled()){const verified=await cloudRpc('ov_storage_ready',{});return res.json({status:'ok',storage:{requestedDriver:'supabase',activeDriver:'supabase',fallbackActive:false,healthy:true,durable:true,backups:true,message:'Supabase connection verified'},verified});}
    const storage = {...getTrainingRepositoryStatus(),durable:false};
    return res.status(storage.healthy ? 200 : 503).json({
        status: storage.healthy ? 'ok' : 'degraded',
        storage,
    });
}));
export const storageHealthRouter = router;
