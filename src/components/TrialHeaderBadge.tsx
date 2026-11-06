import React from 'react';
import { Clock, LogOut, ShieldAlert, Sparkles, CheckCircle2, CreditCard } from 'lucide-react';
import { ClientUser, TrialInfo } from '../types';

interface TrialHeaderBadgeProps {
  user: ClientUser;
  trial: TrialInfo;
  onLogout: () => void;
  onOpenPlans?: () => void;
}

export const TrialHeaderBadge: React.FC<TrialHeaderBadgeProps> = ({ user, trial, onLogout, onOpenPlans }) => {
  const isExpiringSoon = trial.daysRemaining <= 5;
  const isExpired = trial.isExpired || trial.daysRemaining <= 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-900/90 border border-slate-800 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl">
      {/* User Avatar */}
      <div className="flex items-center gap-2">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover border border-slate-700"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-bold flex items-center justify-center text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden xl:block text-left">
          <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
            {user.name}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
            {user.email}
          </div>
        </div>
      </div>

      {/* Trial Countdown Chip */}
      <div
        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer transition ${
          isExpired
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
            : isExpiringSoon
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        }`}
        onClick={onOpenPlans}
        title={`Iniciaste el ${new Date(trial.firstLoginDate).toLocaleDateString()} - Clic para ver planes`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">
          {isExpired
            ? 'Expirado'
            : `${trial.daysRemaining}d restantes`}
        </span>
      </div>

      {/* Mercado Pago Plans Button */}
      {onOpenPlans && (
        <button
          onClick={onOpenPlans}
          className="bg-sky-500/15 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 hover:border-sky-400 font-bold text-xs px-2 sm:px-2.5 py-1 rounded-xl flex items-center gap-1 transition shadow-sm"
          title="Ver Planes y Pagar con Mercado Pago"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Planes</span>
        </button>
      )}

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
        title="Cerrar Sesión Google"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
