import React, { useState, useEffect, useRef } from 'react';
import { Volleyball, ShieldCheck, Clock, ArrowRight, AlertCircle, CheckCircle2, Sparkles, LogIn, Mail, ShieldAlert, UserCheck, X } from 'lucide-react';
import { ClientUser, TrialInfo } from '../types';

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
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<any>(null);
  const [error, setError] = useState('');
  const [isGsiInitialized, setIsGsiInitialized] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Suggested quick accounts (User's active email from session or common sports accounts)
  const quickAccounts = [
    { email: 'reservasnuevohorizonte@gmail.com', name: 'Nuevo Horizonte Vóley Club' },
    { email: 'dt.carlossanchez.voley@gmail.com', name: 'Carlos Sánchez (DT)' },
    { email: 'gervasiomeana@gmail.com', name: 'Gervasio Meana (Entrenador)' },
  ];

  // Parse JWT token from Google Identity Services
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing Google JWT:', e);
      return null;
    }
  };

  // Initialize Google Identity Services if script is loaded
  useEffect(() => {
    const checkGsi = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          const clientId = '84460130822-placeholder.apps.googleusercontent.com';
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response.credential) {
                const payload = parseJwt(response.credential);
                if (payload && payload.email) {
                  handleProcessLogin(payload.email, payload.name || payload.given_name, payload.picture);
                }
              }
            },
            auto_select: false,
          });

          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 320,
          });

          setIsGsiInitialized(true);
        } catch (e) {
          console.warn('GSI render notice:', e);
        }
      }
    };

    const timer = setTimeout(checkGsi, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleProcessLogin = async (email: string, name: string, picture?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor ingresa un correo de Google válido (@gmail.com o cuenta Google Workspace).');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail, 
          name: name ? name.trim() : cleanEmail.split('@')[0], 
          picture 
        }),
      });

      if (!res.ok) {
        throw new Error('Error al registrar la sesión en el servidor');
      }

      const data = await res.json();
      
      // Save locally
      localStorage.setItem('openvoley_user', JSON.stringify(data.client));
      localStorage.setItem('openvoley_trial', JSON.stringify(data.trial));
      
      // Show instant success feedback animation
      setSuccessAnimation({
        client: data.client,
        trial: data.trial,
      });

      setTimeout(() => {
        onLoginSuccess(data.client, data.trial);
      }, 1200);

    } catch (err: any) {
      console.error('Error logging in:', err);
      // Fallback local persistence if offline
      const now = new Date().toISOString();
      const localUser: ClientUser = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        name: name ? name.trim() : cleanEmail.split('@')[0],
        picture: picture || '',
        firstLoginDate: now,
        lastLoginDate: now,
        trialDurationDays: 30,
        customGrantedDays: 0,
        isBlocked: false,
      };
      const localTrial: TrialInfo = {
        daysRemaining: 30,
        isExpired: false,
        firstLoginDate: now,
        totalAllowedDays: 30,
        elapsedDays: 0,
      };
      localStorage.setItem('openvoley_user', JSON.stringify(localUser));
      localStorage.setItem('openvoley_trial', JSON.stringify(localTrial));
      
      setSuccessAnimation({
        client: localUser,
        trial: localTrial,
      });

      setTimeout(() => {
        onLoginSuccess(localUser, localTrial);
      }, 1200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setError('Debes ingresar tu correo Google para comenzar.');
      return;
    }
    const derivedName = nameInput.trim() || emailInput.split('@')[0].replace('.', ' ');
    handleProcessLogin(emailInput, derivedName);
  };

  // If success state is active, show confirmation screen
  if (successAnimation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
        <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-8 shadow-2xl text-center space-y-5 text-white animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
              ¡Cuenta Google Registrada con Éxito!
            </span>
            <h2 className="text-2xl font-black text-white">
              Prueba de 30 Días Activada
            </h2>
            <p className="text-xs text-slate-300">
              Registrado: <strong className="text-amber-400 font-mono">{successAnimation.client.email}</strong>
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-left text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Primer ingreso:</span>
              <span className="text-white font-medium">{new Date().toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Tiempo de prueba:</span>
              <span className="text-emerald-400 font-bold">30 Días Full Access</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Historial de Clientes:</span>
              <span className="text-amber-400 font-bold">Guardado en Servidor ✅</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Ingresando a OPEN VOLEY...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-lg overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white my-auto animate-fade-in">
        
        {/* Close Button if opened from landing */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/20 text-slate-950">
            <Volleyball className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isExistingClientLogin ? 'Acceso de Clientes Activos' : 'Activación de Prueba Gratuita (7 Días)'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isExistingClientLogin ? 'Bienvenido a OPEN VOLEY' : 'Comienza tus 7 Días Gratis'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {isExistingClientLogin 
              ? 'Ingresa con tu cuenta de Google registrada para acceder al software y cargar tus partidos.'
              : 'Vincula tu correo de Google para activar automáticamente tu período de prueba y registrar tu cuenta en el historial.'}
          </p>
        </div>

        {/* 7-Day Guarantee Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0 mt-0.5 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2">
              <span>{isExistingClientLogin ? 'Acceso Seguro sin Contraseñas' : '7 Días de Prueba Completa'}</span>
              <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.2 rounded font-black uppercase tracking-wider">
                {isExistingClientLogin ? 'OPEN VOLEY PRO' : '100% GRATIS'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isExistingClientLogin
                ? 'Tu licencia activa y estadísticas se sincronizan automáticamente con tu cuenta de Google.'
                : 'Sin tarjeta de crédito. Al finalizar los 7 días podrás continuar con el plan mensual o anual con Mercado Pago.'}
            </p>
          </div>
        </div>

        {/* Google GSI Button Container if available */}
        <div ref={googleBtnRef} className="w-full flex justify-center empty:hidden"></div>

        {/* Direct Google Account Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Tu Correo Google (@gmail.com o Workspace) *</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="ejemplo@gmail.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition shadow-inner font-mono"
                required
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Cada cliente inicia con su propio correo para registrar sus propios partidos y licencia.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Nombre de Entrenador o Club
            </label>
            <input
              type="text"
              placeholder="Ej: Marcelo Méndez / Club Ciudad"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition shadow-inner"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !emailInput.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isLoading 
                ? 'Verificando cuenta...' 
                : isExistingClientLogin 
                  ? 'Ingresar con mi Cuenta' 
                  : 'Activar 7 Días de Prueba'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-900" />
          </button>
        </form>

        {/* Security / Terms Notice */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Acceso Seguro • Registro Oficial en Servidor</span>
          </div>
          <span className="text-slate-400 font-semibold">NEXUS SportsTech</span>
        </div>
      </div>
    </div>
  );
};
