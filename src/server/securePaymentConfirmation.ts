import type {Request,Response,NextFunction} from 'express';
import {getSessionFromRequest} from './sessionSecurity';
import {fetchVerifiedPayment,parsePaymentReference,applyVerifiedPayment,rememberPaymentResult} from './paymentProcessing';
export async function securePaymentConfirmation(req:Request,res:Response,next:NextFunction){
 if(req.method!=='POST'||req.path!=='/api/mercadopago/confirm-payment')return next();
 const session=getSessionFromRequest(req);if(!session)return res.status(401).json({error:'Authentication required'});
 const id=String(req.body?.paymentId||'').trim();if(!/^[0-9]{1,30}$/.test(id))return res.status(400).json({error:'A valid paymentId is required'});
 if(!process.env.MERCADOPAGO_ACCESS_TOKEN?.trim())return res.status(503).json({error:'Mercado Pago is not configured'});
 try{
  const data=await fetchVerifiedPayment(id),reference=parsePaymentReference(data.external_reference);
  if(!reference||reference.userId!==session.userId||String(data.payer?.email||'').trim().toLowerCase()!==session.email)return res.status(403).json({error:'Payment owner does not match authenticated user'});
  const result=applyVerifiedPayment(data,id);rememberPaymentResult(id,result,'confirmation');
  if(result.state!=='done'||(result.action!=='access-granted'&&!(result.status==='approved'&&result.alreadyProcessed)))return res.status(409).json({error:result.reason,status:result.status});
  return res.status(200).json({success:true,alreadyProcessed:!!result.alreadyProcessed,plan:result.plan||null,grantedDays:result.grantedDays,paymentId:id});
 }catch(error){console.error('Payment confirmation failed:',error);return res.status(502).json({error:'Payment verification or processing unavailable'});}
}
