import {launchConfiguration,MANUAL_LAUNCH_CHECKS,readClientBuild} from './launchReadiness';
import {getTrainingRepositoryStatus} from './trainingRepository';
import {reconcilePayment} from './paymentProcessing';
import { Router } from 'express';
import { getSessionFromRequest } from './sessionSecurity';
import { loadAccounts, isAdminEmail } from './accountStore';
import { DEFAULT_PRICES,getPrices,savePrices,recordLead,listLeads,deleteLead,recordVisit,listVisits, listReconciliation, listPaymentAudit, getLaunchReview, saveLaunchReview } from './commercialStore';

export const commercialRouter = Router();
const clean=(v:unknown,max=150)=>typeof v==='string' ? v.trim().slice(0,max) : '';
commercialRouter.get('/api/commercial/prices', (_req,res)=>res.json({prices:getPrices()}));
commercialRouter.post('/api/commercial/leads', (req,res)=>{
  const email=clean(req.body?.email,320).toLowerCase(),name=clean(req.body?.name);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || req.body?.consent !== true) return res.status(400).json({error:'Completá nombre, correo y autorización de contacto.'});
  recordLead({email,name,club:clean(req.body?.club),phone:clean(req.body?.phone,60),source:'demo-request',consent:true});
  res.status(201).json({success:true});
});
commercialRouter.post('/api/visitors/track',(req,res)=>{
  recordVisit({page:clean(req.body?.page,300),domain:clean(req.body?.domain),deviceType:clean(req.body?.deviceType,40),action:clean(req.body?.action),anonymous:true});
  res.json({success:true});
});
commercialRouter.use('/api/commercial',(req,res,next)=>{
  const session=getSessionFromRequest(req);
  if (!session) return res.status(401).json({error:'Iniciá sesión con Google.'});
  if (!isAdminEmail(session.email)) return res.status(403).json({error:'Solo administración.'});
  res.locals.adminEmail=session.email;next();
});
commercialRouter.get('/api/commercial/access',(_req,res)=>res.json({isAdmin:true}));
commercialRouter.get('/api/commercial/leads',(_req,res)=>res.json({leads:listLeads(),...listVisits()}));
commercialRouter.delete('/api/commercial/leads/:email',(req,res)=>{deleteLead(String(req.params.email));res.json({success:true});});
commercialRouter.put('/api/commercial/prices',(req,res)=>{
  const prices=structuredClone(DEFAULT_PRICES);
  for (const id of Object.keys(prices)) for (const cycle of ['monthly','annual']) for (const currency of ['ARS','USD']) {
    const value=req.body?.prices?.[id]?.[cycle]?.[currency];
    if (typeof value!=='number' || !Number.isFinite(value) || value<=0 || value>1e8 || Math.abs(value*100-Math.round(value*100))>1e-6) return res.status(400).json({error:'Ingresá precios positivos con hasta dos decimales.'});
    prices[id][cycle][currency]=value;
  }
  savePrices(prices,res.locals.adminEmail);res.json({success:true,prices});
});

commercialRouter.get('/api/commercial/payments',(_req,res)=>{
 const records=listReconciliation(),accounts=loadAccounts(),byUser=new Map(accounts.map(a=>[a.id,a])),seen=new Set(records.payments.map(p=>p.paymentId));
 const history=accounts.flatMap(a=>(a.payments||[]).filter((p:any)=>p.paymentId&&!seen.has(String(p.paymentId))).map((p:any)=>({paymentId:String(p.paymentId),userId:a.id,status:p.status,amount:p.amount,currency:p.currency,state:'not-checked',reason:'Pago del historial: consultar para verificar estado actual.',updatedAt:p.date,source:'history'}))).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,200);
 const payments=[...records.payments,...history].slice(0,200).map(p=>({...p,name:byUser.get(p.userId)?.name||'',email:byUser.get(p.userId)?.email||''}));
 res.json({payments,summary:records.summary,audit:listPaymentAudit(),limit:200});
});
let activeChecks=0;
commercialRouter.post('/api/commercial/payments/:paymentId/recheck',async(req,res)=>{
 const id=String(req.params.paymentId);if(!/^[0-9]{1,30}$/.test(id))return res.status(400).json({error:'Identificador de pago inválido.'});
 if(!process.env.MERCADOPAGO_ACCESS_TOKEN?.trim())return res.status(503).json({error:'Mercado Pago no está configurado.'});
 if(activeChecks>=2)return res.status(429).json({error:'Hay consultas en curso. Intentá nuevamente.'});
 activeChecks++;try{const result=await reconcilePayment(id,'admin-recheck',res.locals.adminEmail);res.json({success:true,result});}
 catch{return res.status(502).json({error:'No se pudo verificar o guardar el pago. El caso quedó registrado para reintentar.'});}
 finally{activeChecks--;}
});

commercialRouter.get('/api/commercial/readiness',(_req,res)=>res.json({...launchConfiguration(process.env,readClientBuild(),getTrainingRepositoryStatus()),manualChecks:MANUAL_LAUNCH_CHECKS,review:getLaunchReview()}));
commercialRouter.put('/api/commercial/readiness',(req,res)=>{
 const checks:Record<string,boolean>={};
 for(const id of Object.keys(MANUAL_LAUNCH_CHECKS)){if(typeof req.body?.checks?.[id]!=='boolean')return res.status(400).json({error:'Indicá todas las comprobaciones realizadas.'});checks[id]=req.body.checks[id];}
 if(req.body.notes!==undefined&&(typeof req.body.notes!=='string'||req.body.notes.length>1000))return res.status(400).json({error:'Las notas admiten hasta 1000 caracteres.'});
 const review={checks,notes:clean(req.body.notes,1000),admin:res.locals.adminEmail,reviewedAt:new Date().toISOString(),builtAt:readClientBuild()?.builtAt||null};saveLaunchReview(review);res.json({review});
});
