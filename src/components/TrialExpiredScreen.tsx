import React, { useState } from 'react';
import { Lock, Clock, ShieldAlert, KeyRound, ArrowRight, LogOut, CheckCircle2, MessageSquare, Mail, CreditCard, Sparkles, ExternalLink } from 'lucide-react';
import { ClientUser, TrialInfo } from '../types';
import { SubscriptionPlansModal } from './SubscriptionPlansModal';

interface TrialExpiredScreenProps {
  user: ClientUser;
  trial: TrialInfo;
  onLogout: () => void;
  onExtendSuccess: (updatedUser: ClientUser, updatedTrial: TrialInfo) => void;
}

export const TrialExpiredScreen: React.FC<TrialExpiredScreenProps> = ({
  user,
  trial,
  onLogout,
  onExtendSuccess,
}) => {
  const [adminKey, setAdminKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const firstDateFormatted = new Date(trial.firstLoginDate || user.firstLoginDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleAdminUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim().toUpperCase() === 'NEXUS30' || adminKey.trim().toUpperCase() === 'CAR123') {
      setIsExtending(true);
      try {
        const res = await fetch('/api/clients/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, addDays: 30 }),
        });
        const data = await res.json();
        const updatedUser: ClientUser = {
          ...user,
          customGrantedDays: (user.customGrantedDays || 0) + 30,
          isBlocked: false,
        };
        const updatedTrial: TrialInfo = {
          ...trial,
          daysRemaining: 30,
          isExpired: false,
          totalAllowedDays: trial.totalAllowedDays + 30,
        };
        localStorage.setItem('openvoley_user', JSON.stringify(updatedUser));
        localStorage.setItem('openvoley_trial', JSON.stringify(updatedTrial));
        onExtendSuccess(updatedUser, updatedTrial);
      } catch (err) {
        console.error(err);
      } finally {
        setIsExtending(false);
      }
    } else {
      setErrorMsg('Clave de administrador incorrecta.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 text-white animate-fadeIn">
          
          {/* Lock Icon Banner */}
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>

          {/* Title & Message */}
          <div className="space-y-2">
            <span className="bg-rose-500/20 text-rose-400 text-[11px] font-bold px-3 py-1 rounded-full border border-rose-500/30 uppercase tracking-wide">
              Período de Prueba Concluido
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tu Licencia de 30 Días ha Expirado
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              El plazo de prueba gratuita de 30 días para la cuenta <strong className="text-white font-mono">{user.email}</strong> ha finalizado.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Titular de la cuenta:</span>
              <span className="font-bold text-white">{user.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Fecha de primer ingreso:</span>
              <span className="font-mono text-amber-400">{firstDateFormatted}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Días de uso consumidos:</span>
              <span className="font-bold text-rose-400">30 / 30 días</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Estado actual:</span>
              <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                Bloqueado por tiempo límite
              </span>
            </div>
          </div>

          {/* MERCADO PAGO PRIMARY CALL TO ACTION */}
          <div className="space-y-3">
            <button
              onClick={() => setShowPlansModal(true)}
              className="w-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-black py-3.5 px-5 rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-sky-500/25 transition transform active:scale-95 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 text-sky-400 flex items-center justify-center font-extrabold text-xs">
                MP
              </div>
              <span>Pagar con Mercado Pago & Activar Licencia</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <span>🇦🇷 Tarjetas de Débito, Crédito y Saldo en Cuenta</span>
            </div>
          </div>

          {/* Contact to Renew License */}
          <div className="space-y-2 text-left bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-4 rounded-2xl">
            <div className="font-bold text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> ¿Prefieres pagar por transferencia bancaria?
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              Escríbenos por WhatsApp para enviarte los datos de CBU/Alias y habilitarte la cuenta en el instante.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <a
                href="https://wa.me/5491112345678?text=Hola%20OPEN%20VOLEY,%20quiero%20renovar%20mi%20suscripcion"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition"
              >
                <span>WhatsApp Comercial</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="mailto:reservasnuevohorizonte@gmail.com?subject=Renovacion%20Licencia%20OPEN%20VOLEY"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition"
              >
                <Mail className="w-3.5 h-3.5" /> Email Soporte
              </a>
            </div>
          </div>

          {/* Actions & Admin Code Unlock */}
          <div className="space-y-3 pt-2">
            {!showAdminInput ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setShowAdminInput(true)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Clave de Extensión NEXUS
                </button>

                <button
                  onClick={onLogout}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Cambiar Cuenta Google
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminUnlock} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Clave de extensión (ej: CAR123 o NEXUS30)"
                    value={adminKey}
                    onChange={(e) => {
                      setAdminKey(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isExtending}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shrink-0 transition"
                  >
                    Activar +30 Días
                  </button>
                </div>
                {errorMsg && <div className="text-rose-400 text-[11px] text-left">{errorMsg}</div>}
                <button
                  type="button"
                  onClick={() => setShowAdminInput(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-400 underline block text-center"
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Plans Modal with Mercado Pago */}
      <SubscriptionPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        currentUser={user}
        trialInfo={trial}
        onPaymentSuccess={onExtendSuccess}
      />
    </>
  );
};
