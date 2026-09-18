import React, { useMemo, useState } from 'react';
import {
  Download,
  Film,
  Filter,
  Play,
  Scissors,
  User,
  Volleyball,
} from 'lucide-react';
import { EvaluationSymbol, MatchData, ScoutCodeAction, TeamSide, VolleySkill } from '../types';

interface SmartSportsEditorProps {
  match: MatchData;
  actions: ScoutCodeAction[];
  userCuts: ScoutCodeAction[];
  onPreviewAction: (action: ScoutCodeAction) => void;
  onPlayPlaylist: (actions: ScoutCodeAction[], preRoll: number, postRoll: number) => void;
  onExportVideo: (actions: ScoutCodeAction[], preRoll: number, postRoll: number) => void;
}

const SKILL_LABELS: Record<VolleySkill, string> = {
  S: 'Saque',
  R: 'Recepción',
  E: 'Armado',
  A: 'Ataque',
  B: 'Bloqueo',
  D: 'Defensa',
  F: 'Freeball',
};

const EVAL_LABELS: Record<EvaluationSymbol, string> = {
  '#': 'Punto / Perfecto',
  '+': 'Positivo',
  '!': 'Neutro',
  '-': 'Negativo',
  '/': 'Bloqueado',
  '=': 'Error',
};

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
}

export const SmartSportsEditor: React.FC<SmartSportsEditorProps> = ({
  match,
  actions,
  userCuts,
  onPreviewAction,
  onPlayPlaylist,
  onExportVideo,
}) => {
  const [team, setTeam] = useState<'all' | TeamSide>('all');
  const [playerNum, setPlayerNum] = useState<'all' | number>('all');
  const [skill, setSkill] = useState<'all' | VolleySkill>('all');
  const [evaluation, setEvaluation] = useState<'all' | EvaluationSymbol>('all');
  const [preRoll, setPreRoll] = useState(3);
  const [postRoll, setPostRoll] = useState(3);

  const sourceActions = useMemo(() => {
    const byId = new Map<string, ScoutCodeAction>();
    [...actions, ...userCuts].forEach((action) => {
      if (Number.isFinite(action.timestamp) && action.timestamp >= 0) {
        byId.set(action.id, action);
      }
    });
    return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
  }, [actions, userCuts]);

  const availablePlayers = useMemo(() => {
    const seen = new Map<string, { team: TeamSide; number: number; name: string }>();
    sourceActions.forEach((action) => {
      if (team !== 'all' && action.team !== team) return;
      const key = `${action.team}-${action.playerNum}`;
      const roster = (action.team === 'home' ? match.homePlayers : match.awayPlayers)
        .find((player) => player.number === action.playerNum);
      seen.set(key, {
        team: action.team,
        number: action.playerNum,
        name: action.playerName || roster?.name || `Jugador #${action.playerNum}`,
      });
    });
    return [...seen.values()].sort((a, b) => a.number - b.number);
  }, [sourceActions, team, match.homePlayers, match.awayPlayers]);

  const playlist = useMemo(() => {
    return sourceActions.filter((action) => {
      if (team !== 'all' && action.team !== team) return false;
      if (playerNum !== 'all' && action.playerNum !== playerNum) return false;
      if (skill !== 'all' && action.skill !== skill) return false;
      if (evaluation !== 'all' && action.evaluation !== evaluation) return false;
      return true;
    });
  }, [sourceActions, team, playerNum, skill, evaluation]);

  const estimatedDuration = playlist.reduce(
    (sum, action) => sum + preRoll + postRoll + 1,
    0,
  );

  const resetFilters = () => {
    setTeam('all');
    setPlayerNum('all');
    setSkill('all');
    setEvaluation('all');
  };

  const exportManifest = () => {
    if (playlist.length === 0) return;

    const manifest = {
      version: 1,
      type: 'open-voley-smart-sports-edit',
      createdAt: new Date().toISOString(),
      match: {
        id: match.id,
        title: match.title,
        date: match.date,
        homeTeamName: match.homeTeamName,
        awayTeamName: match.awayTeamName,
      },
      filters: { team, playerNum, skill, evaluation, preRoll, postRoll },
      clips: playlist.map((action, index) => ({
        order: index + 1,
        actionId: action.id,
        playerNum: action.playerNum,
        playerName: action.playerName,
        team: action.team,
        skill: action.skill,
        evaluation: action.evaluation,
        timestamp: action.timestamp,
        startSec: Math.max(0, action.timestamp - preRoll),
        endSec: action.timestamp + postRoll,
        rallyId: action.rallyId,
        description: action.description,
      })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const playerPart = playerNum === 'all' ? 'todos' : `jugador-${playerNum}`;
    const skillPart = skill === 'all' ? 'todas' : SKILL_LABELS[skill].toLowerCase();
    anchor.href = url;
    anchor.download = `open-voley-${playerPart}-${skillPart}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-black text-indigo-300">
                Editor Deportivo Inteligente · V1
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Jugadas → Playlist → Montaje
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Selecciona acciones reales del Scout por jugador, fundamento y resultado. OPEN VOLEY prepara los cortes temporales para revisión y para el futuro renderizador MP4.
              </p>
            </div>
          </div>

          <div className="flex gap-2 text-xs">
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-500">Clips </span>
              <strong className="text-white">{playlist.length}</strong>
            </div>
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-500">Duración aprox. </span>
              <strong className="text-white">{formatTime(estimatedDuration)}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Volleyball className="w-3 h-3" /> Equipo
            </span>
            <select
              value={team}
              onChange={(e) => {
                setTeam(e.target.value as 'all' | TeamSide);
                setPlayerNum('all');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            >
              <option value="all">Ambos equipos</option>
              <option value="home">{match.homeTeamName}</option>
              <option value="away">{match.awayTeamName}</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" /> Jugador
            </span>
            <select
              value={playerNum}
              onChange={(e) => setPlayerNum(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            >
              <option value="all">Todos los jugadores</option>
              {availablePlayers.map((player) => (
                <option key={`${player.team}-${player.number}`} value={player.number}>
                  #{player.number} {player.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400">Fundamento</span>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value as 'all' | VolleySkill)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            >
              <option value="all">Todos</option>
              {(Object.keys(SKILL_LABELS) as VolleySkill[]).map((key) => (
                <option key={key} value={key}>{SKILL_LABELS[key]}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400">Resultado</span>
            <select
              value={evaluation}
              onChange={(e) => setEvaluation(e.target.value as 'all' | EvaluationSymbol)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            >
              <option value="all">Todos</option>
              {(Object.keys(EVAL_LABELS) as EvaluationSymbol[]).map((key) => (
                <option key={key} value={key}>{key} · {EVAL_LABELS[key]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Ventana por clip</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              Antes
              <input
                type="number"
                min={0}
                max={15}
                value={preRoll}
                onChange={(e) => setPreRoll(Math.max(0, Math.min(15, Number(e.target.value) || 0)))}
                className="w-10 bg-transparent text-white font-mono text-center outline-none"
              />
              s
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              Después
              <input
                type="number"
                min={0}
                max={15}
                value={postRoll}
                onChange={(e) => setPostRoll(Math.max(0, Math.min(15, Number(e.target.value) || 0)))}
                className="w-10 bg-transparent text-white font-mono text-center outline-none"
              />
              s
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> Limpiar
            </button>
            <button
              type="button"
              onClick={() => onPlayPlaylist(playlist, preRoll, postRoll)}
              disabled={playlist.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Reproducir montaje
            </button>
            <button
              type="button"
              onClick={() => onExportVideo(playlist, preRoll, postRoll)}
              disabled={playlist.length === 0}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-black flex items-center gap-1.5"
              title="Genera un archivo real usando las capacidades de grabación del navegador. Requiere video local."
            >
              <Film className="w-3.5 h-3.5" /> Exportar video
            </button>
            <button
              type="button"
              onClick={exportManifest}
              disabled={playlist.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1.5"
              title="Exporta la lista exacta de cortes para reproducir o renderizar el montaje."
            >
              <Download className="w-3.5 h-3.5" /> Exportar lista
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-black text-sm text-white">Playlist seleccionada</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cada fila representa un corte real alrededor del timestamp registrado.
            </p>
          </div>
          <Film className="w-5 h-5 text-indigo-300" />
        </div>

        {playlist.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-800 rounded-2xl">
            <div className="text-sm font-bold text-slate-400">No hay acciones con estos filtros</div>
            <p className="text-xs text-slate-600 mt-1">Prueba otro jugador, fundamento o resultado.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
            {playlist.map((action, index) => {
              const roster = (action.team === 'home' ? match.homePlayers : match.awayPlayers)
                .find((player) => player.number === action.playerNum);
              const start = Math.max(0, action.timestamp - preRoll);
              const end = action.timestamp + postRoll;
              return (
                <button
                  type="button"
                  key={action.id}
                  onClick={() => onPreviewAction(action)}
                  className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center font-black text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          #{action.playerNum} {action.playerName || roster?.name || 'Jugador'} · {SKILL_LABELS[action.skill]}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {EVAL_LABELS[action.evaluation]} · {action.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-amber-300">{formatTime(action.timestamp)}</div>
                        <div className="text-[10px] font-mono text-slate-600">{formatTime(start)} → {formatTime(end)}</div>
                      </div>
                      <Play className="w-4 h-4 text-indigo-300 group-hover:text-white" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
