import React, { useState, useEffect } from 'react';
import { MatchData, TeamSide } from '../types';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Trophy, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface FinishMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchData;
  onConfirmFinish: (winner: TeamSide) => void;
}

export const FinishMatchModal: React.FC<FinishMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  onConfirmFinish,
}) => {
  const homeSets = match.sets ? match.sets.filter((s) => s.winner === 'home').length : 0;
  const awaySets = match.sets ? match.sets.filter((s) => s.winner === 'away').length : 0;
  const isRegulationWin = homeSets >= 3 || awaySets >= 3;
  const curSet = match.sets && match.sets[match.currentSet - 1];
  const curHomeScore = curSet?.scoreHome || 0;
  const curAwayScore = curSet?.scoreAway || 0;

  // Pre-select winner by sets won, or by current points if tied
  const defaultWinner: TeamSide = homeSets > awaySets ? 'home' : (awaySets > homeSets ? 'away' : (curHomeScore >= curAwayScore ? 'home' : 'away'));
  const [selectedWinner, setSelectedWinner] = useState<TeamSide>(defaultWinner);

  useEffect(() => {
    if (isOpen) {
      setSelectedWinner(defaultWinner);
    }
  }, [isOpen, defaultWinner]);

  // Check if there is an in-progress set
  const hasInProgressSet = !isRegulationWin && (curHomeScore > 0 || curAwayScore > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Finalizar Partido</h2>
              <p className="text-xs text-slate-400">
                {match.homeTeamName} vs {match.awayTeamName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Score Summary */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Local</span>
              <div className="text-base font-black text-white">{match.homeTeamName}</div>
              <span className="text-xs font-mono text-amber-400 font-bold">{homeSets} Sets</span>
            </div>

            <div className="text-center px-3 py-1 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 font-bold block">SET {match.currentSet}</span>
              <span className="text-sm font-mono font-black text-white">{curHomeScore} - {curAwayScore}</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Visitante</span>
              <div className="text-base font-black text-white">{match.awayTeamName}</div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{awaySets} Sets</span>
            </div>
          </div>

          {/* Warning if match ended before 3 sets */}
          {!isRegulationWin && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 font-bold">Partido con sets en disputa</strong>
                <span>
                  Ningún equipo ha llegado a 3 sets ganados aún (Marcador: {homeSets} a {awaySets}).
                  Puedes finalizarlo igualmente y las estadísticas registradas quedarán guardadas con total precisión.
                </span>
              </div>
            </div>
          )}

          {/* Select Winner Team */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Equipo Ganador del Encuentro
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedWinner('home')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                  selectedWinner === 'home'
                    ? 'bg-amber-500/20 border-amber-500/60 text-white font-bold ring-1 ring-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-black block text-white">{match.homeTeamName}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">{homeSets} sets ganados</span>
                </div>
                {selectedWinner === 'home' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedWinner('away')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                  selectedWinner === 'away'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-white font-bold ring-1 ring-cyan-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-black block text-white">{match.awayTeamName}</span>
                  <span className="text-[10px] text-cyan-400 font-semibold">{awaySets} sets ganados</span>
                </div>
                {selectedWinner === 'away' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            [ REVISAR / VOLVER ]
          </button>

          <button
            type="button"
            onClick={() => onConfirmFinish(selectedWinner)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>[ {isRegulationWin ? 'FINALIZAR PARTIDO' : 'FINALIZAR IGUALMENTE'} ]</span>
          </button>
        </div>

      </div>
    </div>
  );
};
