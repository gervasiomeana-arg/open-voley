import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Volleyball, 
  Users, 
  Trophy, 
  Video, 
  Dumbbell, 
  Sparkles, 
  FileText, 
  ArrowRight,
  UserCheck,
  TrendingUp,
  Plus
} from 'lucide-react';
import { Player, MatchData, Competition } from '../types';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: 'home' | 'team' | 'competition' | 'match' | 'analysis' | 'ai') => void;
  onOpenNewMatch: () => void;
  onOpenNewTraining: () => void;
  onOpenUploadVideo: () => void;
  onSelectPlayer: (player: Player) => void;
  players: Player[];
  match: MatchData;
  competitions: Competition[];
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewMatch,
  onOpenNewTraining,
  onOpenUploadVideo,
  onSelectPlayer,
  players,
  match,
  competitions,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered by parent state or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Quick Action Commands
  const commands = [
    {
      id: 'cmd_new_match',
      title: 'Crear nuevo partido',
      category: 'Comando',
      icon: Plus,
      badge: 'Acción Rápida',
      color: 'text-amber-400',
      action: () => {
        onClose();
        onOpenNewMatch();
      }
    },
    {
      id: 'cmd_train',
      title: 'Generar entrenamiento con OPEN AI',
      category: 'Comando',
      icon: Dumbbell,
      badge: 'OPEN AI',
      color: 'text-purple-400',
      action: () => {
        onClose();
        onOpenNewTraining();
      }
    },
    {
      id: 'cmd_upload_video',
      title: 'Subir y sincronizar video',
      category: 'Comando',
      icon: Video,
      badge: 'Video AI',
      color: 'text-cyan-400',
      action: () => {
        onClose();
        onOpenUploadVideo();
      }
    },
    {
      id: 'cmd_analyze_rival',
      title: 'Analizar rival y plan de partido',
      category: 'Comando',
      icon: TrendingUp,
      badge: 'Scouting',
      color: 'text-emerald-400',
      action: () => {
        onClose();
        onNavigate('analysis');
      }
    },
    {
      id: 'cmd_match_center',
      title: 'Ir al Match Center (Resumen y Rotaciones)',
      category: 'Navegación',
      icon: Volleyball,
      badge: 'Partido',
      color: 'text-amber-400',
      action: () => {
        onClose();
        onNavigate('match');
      }
    },
    {
      id: 'cmd_roster',
      title: 'Ver plantel y Player 360',
      category: 'Navegación',
      icon: Users,
      badge: 'Equipo',
      color: 'text-blue-400',
      action: () => {
        onClose();
        onNavigate('team');
      }
    },
    {
      id: 'cmd_open_ai',
      title: 'Abrir asistente contextual OPEN AI',
      category: 'Navegación',
      icon: Sparkles,
      badge: 'OPEN AI',
      color: 'text-purple-400',
      action: () => {
        onClose();
        onNavigate('ai');
      }
    }
  ];

  // Matching Players
  const matchedPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(cleanQuery) ||
      p.position.toLowerCase().includes(cleanQuery) ||
      `#${p.number}`.includes(cleanQuery)
  );

  // Matching Competitions
  const matchedCompetitions = competitions.filter(
    (c) =>
      c.name.toLowerCase().includes(cleanQuery) ||
      c.category.toLowerCase().includes(cleanQuery)
  );

  // Matching Commands
  const matchedCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(cleanQuery) ||
      cmd.badge.toLowerCase().includes(cleanQuery) ||
      cmd.category.toLowerCase().includes(cleanQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador, equipo, partido, competición o comando..."
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
          {/* Quick Actions / Commands */}
          {matchedCommands.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
                <span>Comandos y Acciones Rápidas</span>
                <span className="text-slate-500 font-mono">{matchedCommands.length}</span>
              </div>
              <div className="space-y-1">
                {matchedCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left bg-slate-800/40 hover:bg-slate-800 border border-transparent hover:border-slate-700/80 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg bg-slate-800 group-hover:bg-slate-700 ${cmd.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-white font-medium group-hover:text-amber-300 transition truncate">
                          {cmd.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-semibold border border-slate-700/60">
                          {cmd.badge}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Players */}
          {matchedPlayers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
                <span>Jugadores ({match.homeTeamName})</span>
                <span className="text-slate-500 font-mono">{matchedPlayers.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {matchedPlayers.slice(0, 6).map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      onClose();
                      onSelectPlayer(player);
                      onNavigate('team');
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-left bg-slate-800/30 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {player.number}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-medium truncate group-hover:text-amber-300">
                          {player.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {player.position} {player.starter ? '• Titular' : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded group-hover:text-white">
                      Player 360
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Competitions */}
          {matchedCompetitions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
                <span>Competiciones y Torneos</span>
                <span className="text-slate-500 font-mono">{matchedCompetitions.length}</span>
              </div>
              <div className="space-y-1">
                {matchedCompetitions.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      onClose();
                      onNavigate('competition');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left bg-slate-800/30 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-white font-medium group-hover:text-amber-300">
                          {comp.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {comp.category} • {comp.teamsCount} equipos • {comp.format === 'groups_playoffs' ? 'Zonas + Playoffs' : 'Liga regular'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {comp.status === 'active' ? 'En Curso' : 'Próximo'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Match */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              <span>Partido Actual en Carga</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onNavigate('match');
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black">
                  <Volleyball className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white font-bold group-hover:text-amber-300">
                    {match.homeTeamName} vs {match.awayTeamName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {match.competition} • Set {match.currentSet} • {match.actions?.length || 0} jugadas registradas
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                Abrir Partido →
              </span>
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Usa <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px]">↓</kbd> para navegar</span>
            <span><kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px]">ENTER</kbd> para seleccionar</span>
          </div>
          <span className="text-slate-400 font-semibold">OPEN VOLEY Search</span>
        </div>
      </div>
    </div>
  );
};
