import React, { useState, useEffect } from 'react';
import { MatchData, Player, TeamSide } from '../types';
import { 
  CheckCircle2, 
  X, 
  Users, 
  RotateCw, 
  Play, 
  Radio, 
  Shield, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface MatchPreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchData;
  onSavePreparation: (data: {
    homeRotation: number[];
    awayRotation: number[];
    serverTeam: TeamSide;
    serverPlayerNum: number;
    startScoutingImmediately?: boolean;
  }) => void;
}

export const MatchPreparationModal: React.FC<MatchPreparationModalProps> = ({
  isOpen,
  onClose,
  match,
  onSavePreparation,
}) => {
  const defaultHomeRot = match.homeRotation && match.homeRotation.length === 6 
    ? [...match.homeRotation] 
    : (match.homePlayers || []).slice(0, 6).map((p) => p.number);

  const defaultAwayRot = match.awayRotation && match.awayRotation.length === 6 
    ? [...match.awayRotation] 
    : (match.awayPlayers || []).slice(0, 6).map((p) => p.number);

  const [homeRot, setHomeRot] = useState<number[]>(defaultHomeRot);
  const [awayRot, setAwayRot] = useState<number[]>(defaultAwayRot);
  const [serverTeam, setServerTeam] = useState<TeamSide>(match.server?.team || 'home');

  useEffect(() => {
    if (isOpen) {
      const hRot = match.homeRotation && match.homeRotation.length === 6 
        ? [...match.homeRotation] 
        : (match.homePlayers || []).slice(0, 6).map((p) => p.number);
      const aRot = match.awayRotation && match.awayRotation.length === 6 
        ? [...match.awayRotation] 
        : (match.awayPlayers || []).slice(0, 6).map((p) => p.number);
      setHomeRot(hRot.length === 6 ? hRot : [1, 2, 3, 4, 5, 6]);
      setAwayRot(aRot.length === 6 ? aRot : [1, 2, 3, 4, 5, 6]);
      setServerTeam(match.server?.team || 'home');
    }
  }, [isOpen, match.id, match.currentSet]);

  const getPlayerName = (num: number, team: TeamSide): string => {
    const list = team === 'home' ? match.homePlayers : match.awayPlayers;
    const p = list.find((pl) => pl.number === num);
    return p ? p.name : `Jugador #${num}`;
  };

  const handleUpdateHomePos = (index: number, num: number) => {
    const next = [...homeRot];
    next[index] = num;
    setHomeRot(next);
  };

  const handleUpdateAwayPos = (index: number, num: number) => {
    const next = [...awayRot];
    next[index] = num;
    setAwayRot(next);
  };

  const handleRotate = (team: TeamSide) => {
    if (team === 'home') {
      // Rotate P1->P6->P5->P4->P3->P2
      const [p1, p2, p3, p4, p5, p6] = homeRot;
      setHomeRot([p2, p3, p4, p5, p6, p1]);
    } else {
      const [p1, p2, p3, p4, p5, p6] = awayRot;
      setAwayRot([p2, p3, p4, p5, p6, p1]);
    }
  };

  const handleConfirm = (startImmediately: boolean) => {
    const sPlayerNum = serverTeam === 'home' ? (homeRot[0] || 1) : (awayRot[0] || 1);
    onSavePreparation({
      homeRotation: homeRot,
      awayRotation: awayRot,
      serverTeam,
      serverPlayerNum: sPlayerNum,
      startScoutingImmediately: startImmediately,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Preparación del Partido</h2>
              <p className="text-xs text-slate-400">
                {match.homeTeamName} vs {match.awayTeamName} • Set {match.currentSet || 1}
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
        <div className="p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-6">
          
          {/* Saque Inicial */}
          <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              1. Equipo con Saque Inicial — el sacador será automáticamente P1
            </span>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setServerTeam('home')}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                  serverTeam === 'home'
                    ? 'bg-amber-500/20 border-amber-500/60 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-black block">{match.homeTeamName}</span>
                  <span className="text-[10px] text-slate-400">Local saca primero</span>
                </div>
                {serverTeam === 'home' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setServerTeam('away')}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                  serverTeam === 'away'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-black block">{match.awayTeamName}</span>
                  <span className="text-[10px] text-slate-400">Rival saca primero</span>
                </div>
                {serverTeam === 'away' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Formaciones Iniciales: Local & Rival */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
            
            {/* Local */}
            <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Formación {match.homeTeamName} (Local)
                </span>
                <button
                  type="button"
                  onClick={() => handleRotate('home')}
                  className="text-[10px] font-bold text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
                  title="Rotar una posición"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotar formación</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[4, 3, 2, 5, 6, 1].map((posNumber) => {
                  const rotIndex = posNumber - 1;
                  const currentNum = homeRot[rotIndex] || 0;
                  return (
                    <div key={`h-pos-${posNumber}`} className="p-1.5 sm:p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[9px] font-bold text-slate-500 block">P{posNumber}</span>
                      <select
                        value={currentNum}
                        onChange={(e) => handleUpdateHomePos(rotIndex, parseInt(e.target.value, 10))}
                        className="w-full bg-slate-950 text-white text-sm sm:text-xs font-black py-2 sm:py-1 px-1 rounded mt-0.5 border border-slate-800"
                      >
                        {(match.homePlayers || []).map((p) => (
                          <option key={p.id} value={p.number}>#{p.number}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rival */}
            <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                  Formación {match.awayTeamName} (Rival)
                </span>
                <button
                  type="button"
                  onClick={() => handleRotate('away')}
                  className="text-[10px] font-bold text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  title="Rotar una posición"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotar</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[4, 3, 2, 5, 6, 1].map((posNumber) => {
                  const rotIndex = posNumber - 1;
                  const currentNum = awayRot[rotIndex] || 0;
                  return (
                    <div key={`a-pos-${posNumber}`} className="p-1.5 sm:p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[9px] font-bold text-slate-500 block">P{posNumber}</span>
                      <select
                        value={currentNum}
                        onChange={(e) => handleUpdateAwayPos(rotIndex, parseInt(e.target.value, 10))}
                        className="w-full bg-slate-950 text-white text-sm sm:text-xs font-black py-2 sm:py-1 px-1 rounded mt-0.5 border border-slate-800"
                      >
                        {(match.awayPlayers || []).map((p) => (
                          <option key={p.id} value={p.number}>#{p.number}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            Cancelar
          </button>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => handleConfirm(false)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-xl text-xs font-black border border-cyan-500/30 transition cursor-pointer"
            >
              [ GUARDAR Y MARCAR PREPARADO ]
            </button>

            <button
              type="button"
              onClick={() => handleConfirm(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>[ INICIAR SCOUT ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
