import {AdminCommercialPanel} from './AdminCommercialPanel';
import React, { useState, useEffect } from 'react';
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
  const [authorized,setAuthorized]=useState(false);
  const [accessMessage,setAccessMessage]=useState('Verificando acceso administrativo…');
  const [subTab,setSubTab]=useState<SubTabType>('market');
  useEffect(()=>{fetch('/api/commercial/access').then(async r=>{if(!r.ok)throw new Error('Esta sección requiere tu cuenta administradora verificada con Google.');setAuthorized(true)}).catch(e=>setAccessMessage(e.message))},[]);
  if(!authorized)return <p role="status" className="p-6 text-slate-300">{accessMessage}</p>;

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
          <span>Administración y precios</span>
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
          <span>Clientes y licencias</span>
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
      {subTab === 'market' && <><AdminCommercialPanel /><VentasPricingSection /></>}

      {/* SUBTAB: COMMERCIAL PROPOSALS & EMAIL GENERATOR */}
      {subTab === 'proposals' && <SalesProposalsSection />}

      {/* SUBTAB: PRD GENERATOR & PROFITABILITY EVALUATOR */}
      {subTab === 'prd' && <PrdFeasibilitySection />}

      {/* SUBTAB: CLIENT HISTORY & TRIAL CONTROLLER */}
      {subTab === 'clients' && <ClientHistorySection />}
    </div>
  );
};
