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

export function buildSetRotation(players: Player[], previous: number[] = []): number[] {
  const available = players.filter((p) => p.position !== 'L').map((p) => p.number);
  const used = new Set<number>();
  const rotation = Array.from({ length: 6 }, (_, index) => {
    const number = previous[index];
    if (!available.includes(number) || used.has(number)) return 0;
    used.add(number);
    return number;
  });
  return rotation.map((number) => {
    if (number) return number;
    const next = available.find((candidate) => !used.has(candidate)) || 0;
    if (next) used.add(next);
    return next;
  });
}

export function assignSetPosition(rotation: number[], index: number, number: number): number[] {
  const next = [...rotation];
  const existingIndex = next.indexOf(number);
  if (existingIndex >= 0 && existingIndex !== index) next[existingIndex] = next[index];
  next[index] = number;
  return next;
}

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
  const [homeRot, setHomeRot] = useState<number[]>(() => buildSetRotation(match.homePlayers, match.homeRotation));
  const [awayRot, setAwayRot] = useState<number[]>(() => buildSetRotation(match.awayPlayers, match.awayRotation));
  const [serverTeam, setServerTeam] = useState<TeamSide>(match.server?.team || 'home');
  const [selectedPosition, setSelectedPosition] = useState<{ team: TeamSide; index: number }>({ team: 'home', index: 0 });

  useEffect(() => {
    if (!isOpen) return;
    setHomeRot(buildSetRotation(match.homePlayers, match.homeRotation));
    setAwayRot(buildSetRotation(match.awayPlayers, match.awayRotation));
    setServerTeam(match.server?.team || 'home');
    setSelectedPosition({ team: 'home', index: 0 });
  }, [isOpen, match.id, match.currentSet]);

  const isValidFormation = (rotation: number[], players: Player[]) =>
    rotation.length === 6 && new Set(rotation).size === 6 &&
    rotation.every((num) => players.some((p) => p.number === num && p.position !== 'L'));
  const canConfirm = isValidFormation(homeRot, match.homePlayers) && isValidFormation(awayRot, match.awayPlayers);

  const assignPlayer = (team: TeamSide, number: number) => {
    if (selectedPosition.team !== team) {
      setSelectedPosition({ team, index: 0 });
      return;
    }
    const setter = team === 'home' ? setHomeRot : setAwayRot;
    setter((previous) => assignSetPosition(previous, selectedPosition.index, number));
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
    if (!canConfirm) return;
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
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Formación del Set</h2>
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

          <p className="text-xs text-slate-300">Tocá una posición de cancha y después el jugador en la lista del mismo equipo. Si ya está en otra posición, se intercambian.</p>
          <div className="grid grid-cols-2 lg:grid-cols-[1fr_1.3fr_1fr] gap-3 items-start">
            {/* Both halves stay together, also on mobile. */}
            <div className="col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 rounded-2xl bg-slate-950 border border-slate-700 p-3 space-y-3">
              {(['home', 'away'] as const).map((team) => {
                const rotation = team === 'home' ? homeRot : awayRot;
                const players = team === 'home' ? match.homePlayers : match.awayPlayers;
                const positions = team === 'home' ? [1, 6, 5, 2, 3, 4] : [4, 3, 2, 5, 6, 1];
                return (
                  <React.Fragment key={team}>
                    {team === 'away' && <div className="h-1 rounded-full bg-white" aria-label="Red" />}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-black truncate ${team === 'home' ? 'text-blue-300' : 'text-fuchsia-300'}`}>{team === 'home' ? match.homeTeamName : match.awayTeamName}</span>
                        <button type="button" onClick={() => handleRotate(team)} className="p-2 rounded-lg bg-slate-800 text-white text-xs flex items-center gap-1" aria-label={`Rotar formación de ${team === 'home' ? match.homeTeamName : match.awayTeamName}`}><RotateCw className="w-3.5 h-3.5" />Rotar</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {positions.map((position) => {
                          const selected = selectedPosition.team === team && selectedPosition.index === position - 1;
                          const number = rotation[position - 1];
                          const setter = players.some(p => p.number === number && p.position === 'S');
                          return (
                            <button
                              key={position}
                              type="button"
                              aria-label={`${team === 'home' ? match.homeTeamName : match.awayTeamName} P${position}, número ${number || 'sin asignar'}${setter ? ', armador' : ''}`}
                              aria-pressed={selected}
                              onClick={() => setSelectedPosition({ team, index: position - 1 })}
                              className={`min-h-16 rounded-xl border-2 text-white flex flex-col items-center justify-center ${setter ? 'bg-amber-100 !text-slate-950' : team === 'home' ? 'bg-blue-600' : 'bg-fuchsia-600'} ${selected ? 'border-white ring-2 ring-amber-400' : 'border-transparent'}`}
                            >
                              <span className="text-[10px] opacity-80">P{position}{setter ? ' · A' : ''}{position === 1 && serverTeam === team ? ' · SAQUE' : ''}</span>
                              <span className="text-2xl font-black font-mono">{number ? `#${number}` : '—'}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Líberos:</span>
                        {players.filter((p) => p.position === 'L').map((p) => <span key={p.id} className="px-2 py-1 rounded-lg border border-purple-500 text-purple-200 font-bold">L #{p.number}</span>)}
                        {!players.some((p) => p.position === 'L') && <span>Sin registrar</span>}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <p className="text-[10px] text-slate-400">Los líberos se seleccionan aparte en el scout para registrar sus acciones.</p>
            </div>

            {(['home', 'away'] as const).map((team) => {
              const players = team === 'home' ? match.homePlayers : match.awayPlayers;
              const rotation = team === 'home' ? homeRot : awayRot;
              return (
                <div key={team} className={`rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden ${team === 'home' ? 'lg:col-start-1' : 'lg:col-start-3'} lg:row-start-1`}>
                  <div className={`px-3 py-2 text-xs font-black text-white ${team === 'home' ? 'bg-blue-600' : 'bg-fuchsia-600'}`}>{team === 'home' ? match.homeTeamName : match.awayTeamName}</div>
                  <div className="px-2 py-2 text-[10px] text-slate-400">
                    {selectedPosition.team === team ? `Asignar a P${selectedPosition.index + 1}` : 'Elegí una posición de este equipo'}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1 space-y-1">
                    {players.map((player) => {
                      const position = rotation.indexOf(player.number) + 1;
                      const libero = player.position === 'L';
                      return (
                        <button key={player.id} type="button" disabled={libero || selectedPosition.team !== team} onClick={() => assignPlayer(team, player.number)} aria-label={`Asignar #${player.number} ${player.name}`} className={`w-full flex items-center gap-2 text-left rounded-lg px-2 py-2 text-xs ${libero ? 'text-purple-300 bg-purple-500/10' : position ? 'text-white bg-slate-800' : 'text-slate-300 hover:bg-slate-800'}`}>
                          <span className="font-mono font-black shrink-0">#{player.number}</span>
                          <span className="truncate flex-1">{player.name}</span>
                          <span className="text-[10px] shrink-0">{libero ? 'L' : `${player.position === 'S' ? 'A · ' : ''}${position ? `P${position}` : ''}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {!canConfirm && <p role="alert" className="text-xs text-amber-400">Cada equipo necesita seis jugadores distintos, sin incluir a los líberos. Completá el plantel antes de iniciar.</p>}

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
              disabled={!canConfirm}
              onClick={() => handleConfirm(false)}
              className="disabled:opacity-40 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-xl text-xs font-black border border-cyan-500/30 transition cursor-pointer"
            >
              [ GUARDAR Y MARCAR PREPARADO ]
            </button>

            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => handleConfirm(true)}
              className="disabled:opacity-40 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
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
