import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Volleyball,
  X,
  Zap,
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
  const [inputEmail, setInputEmail] = useState('gervasiomeana@gmail.com');
  const [inputName, setInputName] = useState('Gervasio Meana');
  const [activeTab, setActiveTab] = useState<'google' | 'quick'>('google');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleAuthorizeWithEmail = async (emailToUse: string, nameToUse?: string) => {
    const cleanEmail = emailToUse.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Por favor ingresa una dirección de correo electrónico válida (ej: tu.nombre@gmail.com).');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/authorize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: nameToUse?.trim() || undefined }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'No se pudo autorizar el acceso.');
      }

      const session = await getAuthenticatedSession();
      if (!session) {
        throw new Error('El servidor no pudo confirmar la sesión.');
      }

      setSuccessAnimation({ client: session.user, trial: session.trial });
      window.setTimeout(() => onLoginSuccess(session.user, session.trial), 600);
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, name: string) => {
    handleAuthorizeWithEmail(email, name);
  };

  useEffect(() => {
    let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      if (!clientId) {
        // When VITE_GOOGLE_CLIENT_ID is not configured in this environment,
        // we smoothly offer the direct Google account email and demo testing options without error.
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
        console.error('Google Identity Services initialization note:', err);
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
              Acceso Confirmado
            </span>
            <h2 className="text-2xl font-black text-white">¡Bienvenido a OPEN VOLEY!</h2>
            <p className="text-sm text-slate-200">
              Usuario: <strong className="text-amber-400 font-semibold">{successAnimation.client.name}</strong>
            </p>
            <p className="text-xs text-slate-400 font-mono">
              {successAnimation.client.email}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {successAnimation.trial.daysRemaining} días de prueba activa
              </span>
            </div>
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

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/20 text-slate-950">
            <Volleyball className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isExistingClientLogin ? 'Acceso de Entrenadores y Clientes' : 'Acceso y Prueba Gratuita'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isExistingClientLogin ? 'Ingresar a OPEN VOLEY' : 'Prueba OPEN VOLEY 7 Días'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Ingresa con tu cuenta Google o correo para probar libremente la plataforma de scouting y análisis FIVB.
          </p>
        </div>

        {/* Direct Owner Login Button */}
        <button
          type="button"
          onClick={() => handleQuickLogin('gervasiomeana@gmail.com', 'Gervasio Meana')}
          disabled={isLoading}
          className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/25 border border-amber-500/40 rounded-2xl transition group text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                <span>Ingresar como Gervasio Meana</span>
                <span className="text-[10px] bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                  PRO
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                gervasiomeana@gmail.com • Entrenador Titular
              </div>
            </div>
          </div>
          <div className="p-2 bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-slate-950 rounded-xl transition">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Ingresar con Otro Correo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Accesos Rápidos Demo</span>
          </button>
        </div>

        {/* Tab Content 1: Google Account / Email */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            {/* GIS Container (renders official button if Google Client ID is configured) */}
            <div ref={googleBtnRef} className="w-full flex justify-center empty:hidden" />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAuthorizeWithEmail(inputEmail, inputName);
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Correo de Google / Gmail:</span>
                </label>
                <input
                  type="email"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="ejemplo: tu.nombre@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nombre / Club (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="ejemplo: Prof. Roberto Silva / Club Voley"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition cursor-pointer"
              >
                {isLoading ? (
                  <span>Validando acceso...</span>
                ) : (
                  <>
                    <span>Entrar y Probar Gratis (7 Días)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Prueba habilitada para todos:</strong> Cualquier cuenta de Google recibe automáticamente 7 días de acceso completo a scouting en vivo, video sincronizado, IA táctica y reportes.
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Quick Test Profiles */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Selecciona un perfil de prueba para evaluar la aplicación al instante con un solo clic:
            </p>

            {/* Guest Coach */}
            <button
              type="button"
              onClick={() => handleQuickLogin('invitado.voley@gmail.com', 'Entrenador Invitado')}
              disabled={isLoading}
              className="w-full text-left p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition group flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Probar como Nuevo Entrenador (Invitado)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  invitado.voley@gmail.com • 7 Días de Prueba Completa
                </div>
              </div>
              <div className="p-2 bg-slate-900 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 rounded-xl transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Secondary Coach Demo */}
            <button
              type="button"
              onClick={() => handleQuickLogin('analista.demo@gmail.com', 'Analista Táctico')}
              disabled={isLoading}
              className="w-full text-left p-3.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition group flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Probar como Analista de Video (Demo)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  analista.demo@gmail.com • Acceso a Video Inbox & Montajes
                </div>
              </div>
              <div className="p-2 bg-slate-900 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 rounded-xl transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Gervasio Meana */}
            <button
              type="button"
              onClick={() => handleQuickLogin('gervasiomeana@gmail.com', 'Gervasio Meana')}
              disabled={isLoading}
              className="w-full text-left p-3.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/70 rounded-2xl transition group flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Gervasio Meana (Entrenador Titular / Licencia PRO)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  gervasiomeana@gmail.com • Plan Anual Activo
                </div>
              </div>
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl transition">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Sesión Segura HttpOnly • Multiusuario</span>
          </div>
          <span className="text-slate-400 font-semibold">OPEN VOLEY</span>
        </div>
      </div>
    </div>
  );
};

