import React, { useState } from 'react';
import { MatchData, ScoutCodeAction, TeamSide, VolleySkill, EvaluationSymbol } from '../types';
import { parseScoutCodes, parseScoutCode, EVALUATION_NAMES, SKILL_NAMES } from '../utils/codeParser';
import { Send, Keyboard, Plus, RotateCw, Play, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScoutTerminalProps {
  match: MatchData;
  onAddAction: (action: ScoutCodeAction) => void;
  onDeleteAction: (id: string) => void;
  onScoreChange: (homeScore: number, awayScore: number) => void;
  onSetScoreWinner: (winner: TeamSide) => void;
  onRotateTeam: (team: TeamSide) => void;
}

export const ScoutTerminal: React.FC<ScoutTerminalProps> = ({
  match,
  onAddAction,
  onDeleteAction,
  onScoreChange,
  onSetScoreWinner,
  onRotateTeam,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<number>(14);
  const [selectedTeam, setSelectedTeam] = useState<TeamSide>('home');
  const [selectedSkill, setSelectedSkill] = useState<VolleySkill>('A');
  const [selectedEval, setSelectedEval] = useState<EvaluationSymbol>('#');
  const [selectedStartZone, setSelectedStartZone] = useState<number>(4);
  const [selectedEndZone, setSelectedEndZone] = useState<number>(5);

  // Parse code on the fly for preview
  const parsedPreviews = parseScoutCodes(
    inputCode,
    match.homePlayers,
    match.awayPlayers,
    match.currentSet,
    match.sets[match.currentSet - 1]?.scoreHome || 0,
    match.sets[match.currentSet - 1]?.scoreAway || 0,
    match.homeRotation,
    match.awayRotation
  );

  const handleSendCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) return;

    const actions = parseScoutCodes(
      inputCode,
      match.homePlayers,
      match.awayPlayers,
      match.currentSet,
      match.sets[match.currentSet - 1]?.scoreHome || 0,
      match.sets[match.currentSet - 1]?.scoreAway || 0,
      match.homeRotation,
      match.awayRotation
    );

    if (actions.length > 0) {
      actions.forEach((act) => onAddAction(act));

      let currentHome = match.sets[match.currentSet - 1]?.scoreHome || 0;
      let currentAway = match.sets[match.currentSet - 1]?.scoreAway || 0;

      const pointAction = actions.find((a) => a.evaluation === '#' || a.evaluation === '=');
      if (pointAction) {
        if (pointAction.evaluation === '#') {
          if (pointAction.team === 'home') onScoreChange(currentHome + 1, currentAway);
          else onScoreChange(currentHome, currentAway + 1);
        } else if (pointAction.evaluation === '=') {
          if (pointAction.team === 'home') onScoreChange(currentHome, currentAway + 1);
          else onScoreChange(currentHome + 1, currentAway);
        }
      }

      setInputCode('');
    }
  };

  const handleQuickAdd = () => {
    const prefix = selectedTeam === 'home' ? '*' : 'A';
    const playerStr = selectedPlayer < 10 ? `0${selectedPlayer}` : `${selectedPlayer}`;
    const code = `${prefix}${playerStr}${selectedSkill}H${selectedEval}${selectedStartZone}${selectedEndZone}`;
    
    setInputCode(code);
    const action = parseScoutCode(
      code,
      match.homePlayers,
      match.awayPlayers,
      match.currentSet,
      match.sets[match.currentSet - 1]?.scoreHome || 0,
      match.sets[match.currentSet - 1]?.scoreAway || 0,
      match.homeRotation,
      match.awayRotation
    );

    if (action) {
      onAddAction(action);
      // Auto score increment
      const currentHome = match.sets[match.currentSet - 1]?.scoreHome || 0;
      const currentAway = match.sets[match.currentSet - 1]?.scoreAway || 0;

      if (action.evaluation === '#') {
        if (action.team === 'home') onScoreChange(currentHome + 1, currentAway);
        else onScoreChange(currentHome, currentAway + 1);
      } else if (action.evaluation === '=') {
        if (action.team === 'home') onScoreChange(currentHome, currentAway + 1);
        else onScoreChange(currentHome + 1, currentAway);
      }

      setInputCode('');
    }
  };

  const currentSetData = match.sets[match.currentSet - 1] || { scoreHome: 0, scoreAway: 0 };

  return (
    <div className="space-y-6">
      {/* Scoreboard and Rotation Control Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Home Score */}
        <div className="flex items-center gap-4 text-center">
          <div className="text-left">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Local</span>
            <div className="text-xl font-black text-white">{match.homeTeamName}</div>
            <button
              onClick={() => onRotateTeam('home')}
              className="mt-1 inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
            >
              <RotateCw className="w-3 h-3 text-orange-400" /> Rotar
            </button>
          </div>
          <div className="bg-slate-950 px-5 py-2 rounded-xl border border-slate-800">
            <div className="text-3xl font-black text-orange-500">{currentSetData.scoreHome}</div>
          </div>
        </div>

        {/* Set & Versus indicator */}
        <div className="text-center space-y-1">
          <div className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
            SET {match.currentSet}
          </div>
          <div className="text-2xl font-black text-slate-500">VS</div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            {match.sets.map((s) => (
              <span
                key={s.setNumber}
                className={`px-2 py-0.5 rounded ${
                  s.setNumber === match.currentSet
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                S{s.setNumber}: {s.scoreHome}-{s.scoreAway}
              </span>
            ))}
          </div>
        </div>

        {/* Away Score */}
        <div className="flex items-center gap-4 text-center">
          <div className="bg-slate-950 px-5 py-2 rounded-xl border border-slate-800">
            <div className="text-3xl font-black text-cyan-400">{currentSetData.scoreAway}</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Visitante</span>
            <div className="text-xl font-black text-white">{match.awayTeamName}</div>
            <button
              onClick={() => onRotateTeam('away')}
              className="mt-1 inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
            >
              <RotateCw className="w-3 h-3 text-cyan-400" /> Rotar
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Input Console */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Keyboard className="w-5 h-5" />
            Consola de Comandos de Scouting (Live Code Terminal)
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Sintaxis: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">*12AH#15</code> | <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">A05SM=91</code>
          </div>
        </div>

        {/* Text Code Form */}
        <form onSubmit={handleSendCode} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Escribe código (ej: *14AH#21, A05SM=91, *18S#16)..."
                className="w-full bg-slate-950 text-amber-400 placeholder-slate-600 font-mono text-lg px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition"
            >
              <Send className="w-5 h-5" /> Registrar
            </button>
          </div>

          {/* Live Parsing Preview */}
          {parsedPreviews.length > 0 ? (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-mono space-y-1.5 shadow-lg">
              <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {parsedPreviews.length > 1 ? 'Acción Encadenada (Saque + Recepción o Ataque + Defensa)' : 'Acción Identificada'}
                </span>
                <span className="bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">{inputCode.toUpperCase()}</span>
              </div>
              {parsedPreviews.map((p, idx) => (
                <div key={idx} className="bg-slate-950/70 p-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{p.description}</span>
                </div>
              ))}
            </div>
          ) : inputCode.length > 0 ? (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> Código en curso o no reconocido (ej: a14sq.4#17, *14AH#21, 14s.4=)
            </div>
          ) : null}
        </form>

        {/* Quick Builder Buttons */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Constructor Rápido Táctico (Sin Teclado)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            {/* Team */}
            <div>
              <label className="text-slate-500 block mb-1">Equipo</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value as TeamSide)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                <option value="home">Local (*)</option>
                <option value="away">Visitante (A)</option>
              </select>
            </div>

            {/* Player */}
            <div>
              <label className="text-slate-500 block mb-1">Jugador #</label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                {(selectedTeam === 'home' ? match.homePlayers : match.awayPlayers).map((p) => (
                  <option key={p.id} value={p.number}>
                    #{p.number} {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill */}
            <div>
              <label className="text-slate-500 block mb-1">Acción</label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value as VolleySkill)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                <option value="A">Ataque (A)</option>
                <option value="S">Saque (S)</option>
                <option value="R">Recepción (R)</option>
                <option value="B">Bloqueo (B)</option>
                <option value="D">Defensa (D)</option>
                <option value="E">Pase/Colocación (E)</option>
              </select>
            </div>

            {/* Evaluation */}
            <div>
              <label className="text-slate-500 block mb-1">Resultado</label>
              <select
                value={selectedEval}
                onChange={(e) => setSelectedEval(e.target.value as EvaluationSymbol)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                <option value="#">Punto / Perfecto (#)</option>
                <option value="+">Positivo (+)</option>
                <option value="!">Neutro (!)</option>
                <option value="-">Negativo (-)</option>
                <option value="=">Error (=)</option>
                <option value="/">Bloqueado (/)</option>
              </select>
            </div>

            {/* Start Zone */}
            <div>
              <label className="text-slate-500 block mb-1">Desde Zona</label>
              <select
                value={selectedStartZone}
                onChange={(e) => setSelectedStartZone(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => (
                  <option key={z} value={z}>
                    Zona {z}
                  </option>
                ))}
              </select>
            </div>

            {/* End Zone */}
            <div>
              <label className="text-slate-500 block mb-1">Hacia Zona</label>
              <select
                value={selectedEndZone}
                onChange={(e) => setSelectedEndZone(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => (
                  <option key={z} value={z}>
                    Zona {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleQuickAdd}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Insertar Jugada
            </button>
          </div>
        </div>
      </div>

      {/* Action Feed Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            📋 Feed de Jugadas Scouteadas ({match.actions.length})
          </h3>
          <span className="text-xs text-slate-500">Orden Cronológico</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {match.actions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Aún no hay acciones registradas. Escribe un código arriba.
            </div>
          ) : (
            [...match.actions].reverse().map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-sm transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-1 rounded ${
                      act.team === 'home'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-cyan-100 text-cyan-800'
                    }`}
                  >
                    {act.rawCode}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">{act.description}</div>
                    <div className="text-xs text-slate-500">
                      Marcador: {act.scoreHome}-{act.scoreAway} | Set {act.setNumber}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      act.evaluation === '#'
                        ? 'bg-emerald-100 text-emerald-800'
                        : act.evaluation === '='
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {act.evaluation}
                  </span>
                  <button
                    onClick={() => onDeleteAction(act.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                    title="Eliminar jugada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
