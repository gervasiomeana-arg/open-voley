import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  Unlock,
  Sparkles,
  Users,
  Send,
  DollarSign
} from 'lucide-react';
import { ClientHistorySection } from './ClientHistorySection';
import { PrdFeasibilitySection } from './PrdFeasibilitySection';
import { SalesProposalsSection } from './SalesProposalsSection';
import { VentasPricingSection } from './VentasPricingSection';

interface ResearchTabProps {
  isUnlocked?: boolean;
  onUnlockSuccess?: () => void;
}

type SubTabType = 'proposals' | 'clients' | 'prd' | 'market';

export const ResearchTab: React.FC<ResearchTabProps> = ({ 
  isUnlocked: externalUnlocked,
  onUnlockSuccess 
}) => {
  const [internalUnlocked, setInternalUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [subTab, setSubTab] = useState<SubTabType>('market'); // Default to VENTAS as requested

  const isUnlocked = externalUnlocked !== undefined ? externalUnlocked : internalUnlocked;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim().toUpperCase() === 'CAR123') {
      setInternalUnlocked(true);
      setErrorMsg('');
      if (onUnlockSuccess) {
        onUnlockSuccess();
      }
    } else {
      setErrorMsg('Clave incorrecta. Ingrese la clave válida para acceder.');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Acceso Restringido</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            La solapa de <strong className="text-amber-400 font-semibold">Investigación de Mercado, Ventas & PRD</strong> contiene información estratégica. Ingresa la clave de acceso requerida.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="password"
              placeholder="Ingresar clave de acceso"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-white placeholder-slate-500 text-sm pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-mono"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" /> Desbloquear Ventas & PRD
          </button>
        </form>

        <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
          OPEN VOLEY • Sistema de Scouting Táctico
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-2 sm:p-6 text-slate-100">
      {/* Subnavigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <button
          onClick={() => setSubTab('market')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'market'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>VENTAS (Precios vs Competencia)</span>
        </button>

        <button
          onClick={() => setSubTab('proposals')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'proposals'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>PROPUESTAS (Venta & Email)</span>
        </button>

        <button
          onClick={() => setSubTab('clients')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'clients'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Historial de Clientes (30 Días)</span>
        </button>

        <button
          onClick={() => setSubTab('prd')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'prd'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generador PRD & Rentabilidad</span>
        </button>
      </div>

      {/* SUBTAB: VENTAS & ANALISIS DE PRECIOS */}
      {subTab === 'market' && <VentasPricingSection />}

      {/* SUBTAB: COMMERCIAL PROPOSALS & EMAIL GENERATOR */}
      {subTab === 'proposals' && <SalesProposalsSection />}

      {/* SUBTAB: PRD GENERATOR & PROFITABILITY EVALUATOR */}
      {subTab === 'prd' && <PrdFeasibilitySection />}

      {/* SUBTAB: CLIENT HISTORY & TRIAL CONTROLLER */}
      {subTab === 'clients' && <ClientHistorySection />}
    </div>
  );
};
