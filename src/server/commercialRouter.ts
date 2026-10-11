import { Router } from 'express';
import { getSessionFromRequest } from './sessionSecurity';
import { isAdminEmail } from './accountStore';
import { DEFAULT_PRICES,getPrices,savePrices,recordLead,listLeads,deleteLead,recordVisit,listVisits } from './commercialStore';

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
