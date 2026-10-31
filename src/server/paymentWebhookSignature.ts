import {createHmac,timingSafeEqual} from 'node:crypto';
export function validPaymentWebhookSignature(dataId:string,requestId:string,signature:string,secret:string):boolean {
  const values=Object.fromEntries(signature.split(',').map(part=>part.trim().split('=')));
  if(!secret || !requestId || !/^[a-zA-Z0-9]{1,64}$/.test(dataId) || !/^[0-9]+$/.test(values.ts || '') || !/^[a-f0-9]{64}$/i.test(values.v1 || ''))return false;
  const digest=createHmac('sha256',secret).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${values.ts};`).digest();
  return timingSafeEqual(digest,Buffer.from(values.v1,'hex'));
}
