import React, {useEffect,useRef,useState} from 'react';
import {ClientUser,TrialInfo} from '../types';
import {getAuthenticatedSession} from '../services/authSession';
interface Props {onLoginSuccess:(user:ClientUser,trial:TrialInfo)=>void;onClose?:()=>void;isExistingClientLogin?:boolean}
declare global {interface Window {google?:any}}
export const GoogleAuthModal:React.FC<Props>=({onLoginSuccess,onClose})=>{
 const loginSuccess=useRef(onLoginSuccess);loginSuccess.current=onLoginSuccess;
 const button=useRef<HTMLDivElement>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  // Google is needed only after the visitor opens the sign-in dialog.
  if (!window.google?.accounts?.id && !document.querySelector('script[data-openvoley-google]')) {
   const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.openvoleyGoogle='true';document.head.appendChild(script);
  }
  const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {setError('El acceso con Google todavía no está configurado. Contactá a administración.');return;}
  const initialize=()=>{
   if(cancelled || !window.google?.accounts?.id || !button.current)return false;
   window.google.accounts.id.initialize({client_id:clientId,auto_select:false,callback:async(response:any)=>{
    setBusy(true);setError('');
    try {
     const result=await fetch('/api/auth/google',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:response.credential})});
     const data=await result.json();if(!result.ok)throw new Error(data.error || 'No se pudo verificar tu cuenta.');
     const session=await getAuthenticatedSession();if(!session)throw new Error('No se pudo confirmar la sesión.');
     loginSuccess.current(session.user,session.trial);
    }catch(e){setError(e instanceof Error?e.message:'No se pudo ingresar.')}finally{setBusy(false)}
   }});
   window.google.accounts.id.renderButton(button.current,{theme:'filled_blue',size:'large',width:280});return true;
  };
  const timer=window.setInterval(()=>{if(initialize())window.clearInterval(timer)},250);
  const timeout=window.setTimeout(()=>{window.clearInterval(timer);if(!window.google?.accounts?.id)setError('Google no se pudo cargar. Revisá tu conexión y volvé a abrir esta ventana.')},10000);
  return()=>{cancelled=true;window.clearInterval(timer);window.clearTimeout(timeout)};
 },[]);
 return <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"><section className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5 text-white">
 {onClose&&<button onClick={onClose} className="float-right p-2" aria-label="Cerrar">✕</button>}
 <h2 className="text-2xl font-bold">Ingresar a OPEN VOLEY</h2><p>Usá tu cuenta de Google. Las cuentas nuevas reciben 7 días de prueba.</p>
 <div ref={button} className={busy?'opacity-50 pointer-events-none':''}/>{busy&&<p>Verificando cuenta…</p>}{error&&<p role="alert" className="text-rose-300">{error}</p>}
 <a href="/ingresar" className="block min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-3 py-3 text-center text-sm font-bold text-white">Ingresar sin ventana emergente</a>
 <p className="text-xs text-slate-300">Si el botón de Google no abre, usá esta alternativa para continuar en la misma ventana.</p>
 <p className="text-sm text-slate-400">Al registrarte guardamos tu nombre, correo y fechas de acceso para administrar tu cuenta y la prueba.</p>
 </section></div>;
};
