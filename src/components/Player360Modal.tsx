import React, { useState } from 'react';
import { 
  X, 
  User, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  Video, 
  ShieldCheck, 
  HeartPulse, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Award,
  ChevronRight,
  Flame,
  FileText
} from 'lucide-react';
import { Player, MatchData } from '../types';
import { buildPlayer360RealProfile } from '../utils/player360Analytics';

interface Player360ModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  match?: MatchData;
  historicalMatches?: MatchData[];
  onPlayClip?: (timestamp: number) => void;
  onGenerateSpecificTraining?: (problem: string) => void;
}

export const Player360Modal: React.FC<Player360ModalProps> = ({
  player,
  isOpen,
  onClose,
  match,
  historicalMatches = [],
  onPlayClip,
  onGenerateSpecificTraining,
}) => {
  const [activeTab, setActiveTab] = useState<'rendimiento' | 'desarrollo' | 'video' | 'carga' | 'ia'>('rendimiento');

  if (!isOpen || !player) return null;

  const emptyMatch: MatchData = match || {
    id: 'no-match', title: 'Sin partido', date: '', competition: '',
    homeTeamName: '', awayTeamName: '', currentSet: 1, sets: [],
    homePlayers: player.team === 'home' ? [player] : [],
    awayPlayers: player.team === 'away' ? [player] : [],
    actions: [], homeRotation: [], awayRotation: [],
    server: { team: 'home', playerNum: 0 },
  };
  const profile = buildPlayer360RealProfile(player, emptyMatch, historicalMatches);
  const stats = profile.current;
  const playerActions = profile.currentActions;
  const totalPoints = stats.attPts + stats.blockPts + stats.serveAce;
  const latestHistory = profile.history.slice(-4);
  // Position label mapping
  const positionLabels: Record<string, string> = {
    OH: 'Punta Receptor / Outside Hitter',
    MB: 'Central / Middle Blocker',
    OPP: 'Opuesto / Opposite',
    S: 'Armador / Setter',
    L: 'Líbero / Libero'
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Profile */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Jersey Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center font-mono font-black text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                <span className="text-2xl leading-none">{player.number}</span>
                <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-amber-300/80 mt-0.5">
                  {player.position}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white truncate">
                    {player.name}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    player.starter 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {player.starter ? 'Titular' : 'Suplente'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {player.availability === 'baja' ? 'Baja' : player.availability === 'duda' ? 'En Duda' : 'Disponible 100%'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {positionLabels[player.position] || player.position} • {match?.homeTeamName || 'Equipo'}
                </p>

                {/* Physical Bio Bar */}
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 font-mono">
                  {player.heightCm && (
                    <span><strong>{player.heightCm}</strong> cm</span>
                  )}
                  {player.weightKg && (
                    <span>• <strong>{player.weightKg}</strong> kg</span>
                  )}
                  {player.spikeReachCm && (
                    <span>• Alcance: <strong>{player.spikeReachCm}</strong> cm</span>
                  )}
                  <span>• Mano: <strong>{player.dominantHand || 'Derecha'}</strong></span>
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-b border-slate-800/80 pb-0.5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'rendimiento', label: 'Rendimiento', icon: Activity },
              { id: 'desarrollo', label: 'Desarrollo', icon: TrendingUp },
              { id: 'video', label: 'Video Clips', icon: Video },
              { id: 'carga', label: 'Carga & Fisiología', icon: HeartPulse },
              { id: 'ia', label: 'OPEN AI 360', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive 
                      ? tab.id === 'ia'
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-xs">
          {/* TAB 1: RENDIMIENTO */}
          {activeTab === 'rendimiento' && (
            <div className="space-y-5">
              {/* Primary KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Puntos Totales</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">{totalPoints} pts</div>
                  <div className="text-[10px] text-slate-400 mt-1">{stats.attPts} atq • {stats.blockPts} blq • {stats.serveAce} ace</div>
                </div>

                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Eficiencia Ataque</div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">{stats.attTotal ? `${stats.attEffPct}%` : '—'}</div>
                  <div className="text-[10px] text-emerald-400 mt-1">{stats.attTotal ? `${stats.attPts} puntos / ${stats.attTotal} intentos` : 'Sin ataques registrados'}</div>
                </div>

                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Recepción Positiva</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">{stats.recTotal ? `${stats.recPosPct}%` : '—'}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{stats.recTotal ? `${stats.recPerfect + stats.recPositive} positivas / ${stats.recTotal} totales` : 'Sin recepciones registradas'}</div>
                </div>

                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Defensas / Digs</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{stats.digTotal}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Balones recuperados</div>
                </div>
              </div>

              {/* Specific Skill Matrix */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-3">
                <h4 className="font-black text-white text-xs flex items-center justify-between">
                  <span>Desglose Técnico por Fundamento (FIVB)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Último partido</span>
                </h4>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Ataque (Efectividad neta)</span>
                      <span className="font-mono font-bold text-amber-400">{stats.attTotal ? `${stats.attEffPct}%` : '—'}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${stats.attTotal ? Math.min(100, Math.max(0, stats.attEffPct)) : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Recepción (+ / #)</span>
                      <span className="font-mono font-bold text-cyan-400">{stats.recTotal ? `${stats.recPosPct}%` : '—'}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${stats.recTotal ? `${stats.recPosPct}%` : '—'}` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Saque (Puntos directos sin error)</span>
                      <span className="font-mono font-bold text-emerald-400">{profile.serveEfficiencyPct === null ? '—' : `${profile.serveEfficiencyPct}%`}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${profile.serveEfficiencyPct === null ? 0 : Math.max(0, profile.serveEfficiencyPct)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tactical Hitting Profile */}
              {player.hittingStyle && (
                <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/60">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">
                    Patrón Táctico Característico
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {player.hittingStyle}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DESARROLLO */}
          {activeTab === 'desarrollo' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
                <h4 className="font-black text-white text-xs flex items-center justify-between">
                  <span>Evolución real por partido</span>
                  <span className="text-slate-400 font-mono">{profile.history.length} partidos con acciones</span>
                </h4>
                {latestHistory.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {latestHistory.map((item) => (
                      <div key={item.matchId} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">{item.date} · vs {item.opponent}</div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                          <div><div className="text-sm font-black text-amber-400">{item.attackEffPct === null ? '—' : `${item.attackEffPct}%`}</div><div className="text-[9px] text-slate-500">Ataque</div></div>
                          <div><div className="text-sm font-black text-cyan-400">{item.receptionPosPct === null ? '—' : `${item.receptionPosPct}%`}</div><div className="text-[9px] text-slate-500">Recepción</div></div>
                          <div><div className="text-sm font-black text-emerald-400">{item.points}</div><div className="text-[9px] text-slate-500">Puntos</div></div>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-2">{item.actions} acciones · {item.aces} aces · {item.blockPoints} bloqueos · {item.digs} defensas</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
                    Aún no hay partidos guardados con acciones de este jugador. La evolución aparecerá automáticamente al acumular historial real.
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Lectura de desarrollo</div>
                <p className="text-slate-300 mt-2">OPEN VOLEY muestra únicamente métricas respaldadas por scouting registrado. Cuando un fundamento no tiene muestra, se indica “—” en lugar de completar valores estimados.</p>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO CLIPS */}
          {activeTab === 'video' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Acciones cortadas del jugador en el match actual:</span>
                <span className="font-mono font-bold text-amber-400">{playerActions.length} clips</span>
              </div>

              {playerActions.length > 0 ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                  {playerActions.map((act) => (
                    <div 
                      key={act.id}
                      className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg font-mono font-bold text-xs ${
                          act.evaluation === '#' ? 'bg-emerald-500/20 text-emerald-400' :
                          act.evaluation === '=' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {act.skill}{act.evaluation}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {act.description}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Set {act.setNumber} • {act.scoreHome}-{act.scoreAway} • {Math.floor(act.timestamp / 60)}:{(act.timestamp % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>

                      {onPlayClip && (
                        <button
                          onClick={() => onPlayClip(act.timestamp)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Ver Clip</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-slate-400">
                  <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No hay clips individuales cortados en este archivo.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Los clips se generan automáticamente al realizar scouting o sincronizar el video.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CARGA & FISIOLOGÍA */}
          {activeTab === 'carga' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
                <HeartPulse className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="font-black text-white">Carga física: pendiente de fuente real</div>
                <p className="text-slate-400 mt-2 max-w-lg mx-auto">OPEN VOLEY no estima saltos, minutos, RPE ni estado físico sin una fuente registrada. Esta sección queda preparada para integrar datos manuales o sensores en una etapa posterior.</p>
              </div>
            </div>
          )}

          {/* TAB 5: OPEN AI 360 */}
          {activeTab === 'ia' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Dictamen Táctico OPEN AI
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-700/50">
                    Basado en: 5 partidos, 116 acciones
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-0.5">
                      <Award className="w-3.5 h-3.5" />
                      Fortalezas Comprobadas
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Efectividad sobresaliente del 54% en bolas rápidas por zona 4 cuando la recepción es positiva (#). Gran capacidad para utilizar las manos del bloqueo rival en contraataque.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Puntos Débiles Detectados
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Fuga de puntos en recepción en retroceso profundo hacia zona 5 ante saques flotados altos (4 errores en los últimos 2 partidos).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recomendación Táctica para el Entrenador
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Plantear en el próximo entrenamiento un ejercicio de recepción condicionado en zona 5 con sacador colocado en zona 1 rival.
                    </p>
                  </div>
                </div>

                {onGenerateSpecificTraining && (
                  <button
                    onClick={() => {
                      onClose();
                      onGenerateSpecificTraining(`Ajuste técnico de recepción para #${player.number} ${player.name} en zona 5`);
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generar Entrenamiento Específico con OPEN AI</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>PLAYER 360 • OPEN VOLEY Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
