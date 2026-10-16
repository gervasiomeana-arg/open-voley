export const AI_MESSAGES = {
  AI_NOT_CONFIGURED: 'OPEN AI no está configurado en este servidor. Falta GEMINI_API_KEY.',
  AI_ACCESS_DENIED: 'El proveedor de IA rechazó el acceso. El administrador debe revisar la credencial y los permisos del proyecto.',
  AI_MODEL_UNAVAILABLE: 'El modelo de IA configurado no está disponible. El administrador debe revisar GEMINI_MODEL.',
  AI_RATE_LIMIT: 'El servicio de IA alcanzó un límite o cuota. Intentá más tarde; si persiste, el administrador debe revisar la cuota del proyecto.',
  AI_TIMEOUT: 'La consulta de IA superó el tiempo de espera. Intentá nuevamente con una consulta más breve.',
  AI_EMPTY_RESPONSE: 'El proveedor de IA no devolvió una respuesta. No se generó una conclusión.',
  AI_UNAVAILABLE: 'No se pudo completar la consulta de IA. El servicio puede estar temporalmente indisponible.',
} as const;
export type AiErrorCode = keyof typeof AI_MESSAGES;
export function classifyAiError(error: unknown): {status:number;code:AiErrorCode;error:string} {
  const e=error as {status?:unknown;name?:unknown;message?:unknown}|null;
  const status=Number(e?.status);
  let code:AiErrorCode='AI_UNAVAILABLE',http=502;
  if(e?.message==='AI_NOT_CONFIGURED'){code='AI_NOT_CONFIGURED';http=503;}
  else if(e?.message==='AI_MODEL_INVALID'||status===404){code='AI_MODEL_UNAVAILABLE';http=503;}
  else if(status===401||status===403){code='AI_ACCESS_DENIED';http=503;}
  else if(status===429){code='AI_RATE_LIMIT';http=429;}
  else if(status===408||status===504||e?.name==='AbortError'||e?.name==='TimeoutError'){code='AI_TIMEOUT';http=504;}
  else if(e?.message==='AI_EMPTY_RESPONSE')code='AI_EMPTY_RESPONSE';
  return {status:http,code,error:AI_MESSAGES[code]};
}
export function aiResponseError(status:number,payload:unknown) {
  const p=payload as {code?:unknown;error?:unknown}|null;
  if(typeof p?.code==='string'&&Object.hasOwn(AI_MESSAGES,p.code))return AI_MESSAGES[p.code as AiErrorCode];
  if(p?.error==='AI service is not configured')return AI_MESSAGES.AI_NOT_CONFIGURED;
  if(status===401)return 'Tu sesión venció. Volvé a ingresar con Google para consultar OPEN AI.';
  if(status===403)return 'Tu cuenta no tiene acceso a esta consulta. Revisá el estado de la licencia.';
  if(status===413)return 'El contexto supera el límite de análisis. Seleccioná menos partidos.';
  if(status===429)return AI_MESSAGES.AI_RATE_LIMIT;
  if(status===504)return AI_MESSAGES.AI_TIMEOUT;
  return AI_MESSAGES.AI_UNAVAILABLE;
}
