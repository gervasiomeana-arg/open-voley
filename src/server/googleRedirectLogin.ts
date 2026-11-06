import type { Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';

export const GOOGLE_REDIRECT_CALLBACK = '/api/auth/google/redirect';

/** Google Identity Services double-submit protection; never trust a posted token alone. */
export function validGoogleRedirectCsrf(req: Pick<Request, 'headers' | 'body'>): boolean {
  const posted=req.body?.g_csrf_token;
  if(typeof posted!=='string'||!posted||posted.length>1024)return false;
  const cookies=(req.headers.cookie||'').split(';').map(p=>p.trim()).filter(p=>p.startsWith('g_csrf_token='));
  if(cookies.length!==1)return false;
  try {
    const cookie=decodeURIComponent(cookies[0].slice('g_csrf_token='.length));
    const a=Buffer.from(cookie),b=Buffer.from(posted);
    return a.length===b.length && timingSafeEqual(a,b);
  } catch {return false;}
}

export function googleLoginPage(req: Request,res: Response) {
  const clientId=process.env.GOOGLE_CLIENT_ID?.trim()||'';
  // This public client ID is escaped for a script context, never a secret or credential.
  const clientJson=JSON.stringify(clientId).replace(/</g,'\\u003c');
  const error=typeof req.query?.error==='string';
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin-allow-popups');
  return res.status(clientId?200:503).send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Ingresar · OPEN VOLEY</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#080e19;color:#f4f0e7;font:16px/1.5 system-ui,sans-serif}main{box-sizing:border-box;width:min(94vw,460px);padding:28px;background:#142333;border:1px solid #304455;border-radius:20px}h1{font-size:26px}strong{color:#ffc02d}p{color:#bac7d4}a{color:#ffc02d;display:inline-block;padding:12px 0}#error{color:#ffb6bd}#google-button{min-height:44px}#google-button:empty:before{content:'Cargando acceso de Google…';color:#bac7d4}</style></head><body><main>
<strong>OPEN VOLEY</strong><h1>Ingresar con Google</h1><p>Continuá en esta misma ventana. No se abrirá una ventana emergente.</p>
<p id="error" role="alert">${!clientId?'El acceso con Google no está configurado. Contactá a administración.':error?'No se pudo completar el ingreso. Volvé a intentar con tu cuenta de Google.':''}</p>
${clientId?'<div id="google-button"></div>':''}
<p>Las cuentas nuevas reciben 7 días de prueba. Google puede pedirte verificar tu identidad.</p><a href="/">Volver a OPEN VOLEY</a>
<script>
function loginError(){document.getElementById('error').textContent='Google no se pudo cargar. Revisá la conexión y recargá esta página.';}
function renderGoogleButton(){try{google.accounts.id.initialize({client_id:${clientJson},ux_mode:'redirect',login_uri:location.origin+'${GOOGLE_REDIRECT_CALLBACK}',auto_select:false,button_auto_select:false,use_fedcm_for_button:false});google.accounts.id.renderButton(document.getElementById('google-button'),{theme:'filled_blue',size:'large',width:280});}catch(e){loginError();}}
</script>${clientId?'<script src="https://accounts.google.com/gsi/client" async defer onload="renderGoogleButton()" onerror="loginError()"></script>':''}</main></body></html>`);
}
