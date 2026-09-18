import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Volleyball,
  X,
} from 'lucide-react';
import { ClientUser, TrialInfo } from '../types';
import { getAuthenticatedSession } from '../services/authSession';

interface GoogleAuthModalProps {
  onLoginSuccess: (user: ClientUser, trial: TrialInfo) => void;
  onClose?: () => void;
  isExistingClientLogin?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  onLoginSuccess,
  onClose,
  isExistingClientLogin = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<{ client: ClientUser; trial: TrialInfo } | null>(null);
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      if (!clientId) {
        setError('El acceso con Google no está configurado en este entorno.');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) {
              setError('Google no devolvió una credencial válida.');
              return;
            }

            setError('');
            setIsLoading(true);

            try {
              const verifyRes = await fetch('/api/auth/google', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
              });

              if (!verifyRes.ok) {
                const errData = await verifyRes.json().catch(() => ({}));
                throw new Error(errData?.error || 'No se pudo validar la cuenta de Google.');
              }

              // The Google response itself is not used as application identity.
              // The HttpOnly cookie created by the backend is immediately re-validated through /api/auth/me.
              const session = await getAuthenticatedSession();
              if (!session) {
                throw new Error('El servidor no pudo confirmar la nueva sesión.');
              }

              setSuccessAnimation({ client: session.user, trial: session.trial });
              window.setTimeout(() => onLoginSuccess(session.user, session.trial), 700);
            } catch (err: any) {
              console.error('Google authentication failed:', err);
              setError(err?.message || 'No se pudo validar tu sesión.');
            } finally {
              setIsLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleBtnRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 320,
        });
      } catch (err) {
        console.error('Google Identity Services initialization failed:', err);
        setError('No se pudo iniciar el acceso con Google.');
      }
    };

    const timer = window.setTimeout(initializeGoogle, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onLoginSuccess]);

  if (successAnimation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
        <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-8 shadow-2xl text-center space-y-5 text-white animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
              Sesión verificada
            </span>
            <h2 className="text-2xl font-black text-white">Bienvenido a OPEN VOLEY</h2>
            <p className="text-xs text-slate-300">
              Cuenta: <strong className="text-amber-400 font-mono">{successAnimation.client.email}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Licencia y período de acceso confirmados por el servidor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-lg overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white my-auto animate-fade-in">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/20 text-slate-950">
            <Volleyball className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isExistingClientLogin ? 'Acceso de Clientes Activos' : 'Prueba Gratuita OPEN VOLEY'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isExistingClientLogin ? 'Bienvenido a OPEN VOLEY' : 'Comienza tus 7 Días Gratis'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Tu identidad se valida directamente con Google y luego con el servidor de OPEN VOLEY.
          </p>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-bold text-emerald-300">
              {isExistingClientLogin ? 'Acceso Seguro sin Contraseñas' : '7 Días de Prueba Completa'}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              No aceptamos login manual por email. La sesión solo se crea después de validar una credencial real de Google.
            </p>
          </div>
        </div>

        <div className="min-h-[44px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-xs text-slate-300">Validando sesión con OPEN VOLEY...</div>
          ) : (
            <div ref={googleBtnRef} className="w-full flex justify-center" />
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Google verificado • Sesión HttpOnly</span>
          </div>
          <span className="text-slate-400 font-semibold">OPEN VOLEY</span>
        </div>
      </div>
    </div>
  );
};
