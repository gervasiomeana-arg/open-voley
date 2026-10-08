import { CompactScoutPanel } from './CompactScoutPanel';
import { TargetZoneCourt } from './TargetZoneCourt';
import { useScoutButtons, evaluationForKey } from '../utils/scoutButtonPreferences';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MatchData, Player, ScoutCodeAction, TeamSide, VolleySkill, EvaluationSymbol } from '../types';
import { isTerminalScoutAction, nextScoutStep } from '../utils/scoutRallyAssist';
import { 
  RotateCcw, 
  RotateCw, 
  Zap, 
  Check, 
  Sparkles,
  Users,
  ChevronRight,
  Shield,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  Keyboard,
  Info
} from 'lucide-react';

interface VolleyballScoutModeProps {
  match: MatchData;
  onAddAction: (action: ScoutCodeAction) => void;
  onDeleteAction: (id: string) => void;
  onScoreChange: (homeScore: number, awayScore: number) => void;
  onRotateTeam: (team: TeamSide) => void;
  onSubstitutePlayer: (team: TeamSide, playerOut: number, playerIn: number) => void;
  onLiberoReplacement: (team: TeamSide, liberoNum: number, replacedPlayerNum: number | null) => void;
  onSelectAction?: (id: string) => void;
}

// Fundamental skills
interface SkillConfig {
  id: VolleySkill;
  label: string;
  short: string;
  icon: string;
  key: string;
}

const SKILLS: SkillConfig[] = [
  { id: 'A', label: 'ATAQUE', short: 'Ataque', icon: '💥', key: 'A' },
  { id: 'R', label: 'RECEPCIÓN', short: 'Recep', icon: '🤲', key: 'R' },
  { id: 'S', label: 'SAQUE', short: 'Saque', icon: '🏐', key: 'S' },
  { id: 'B', label: 'BLOQUEO', short: 'Bloq', icon: '🧱', key: 'B' },
  { id: 'E', label: 'ARMADO', short: 'Armado', icon: '👐', key: 'E' },
  { id: 'D', label: 'DEFENSA', short: 'Defensa', icon: '🛡️', key: 'D' },
];

// Outcome / Quality definition per skill
interface OutcomeOption {
  symbol: EvaluationSymbol;
  label: string;
  sublabel: string;
  key: string;
  colorClass: string;
  isPoint?: boolean;
  isError?: boolean;
}

const SKILL_OUTCOMES: Record<VolleySkill, OutcomeOption[]> = {
  A: [
    { symbol: '#', label: 'PUNTO', sublabel: 'Remate ganador', key: 'P', colorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400', isPoint: true },
    { symbol: '+', label: 'CONTINUIDAD', sublabel: 'Balón en juego', key: 'C', colorClass: 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400' },
    { symbol: '/', label: 'BLOQUEADO', sublabel: 'Bloqueado por rival', key: '/', colorClass: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400' },
    { symbol: '=', label: 'ERROR', sublabel: 'Fuera / Red', key: 'X', colorClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400', isError: true },
  ],
  R: [
    { symbol: '#', label: 'PERFECTA', sublabel: 'A la cabeza del armador', key: 'P', colorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400' },
    { symbol: '+', label: 'POSITIVA', sublabel: 'Ataque con opciones', key: 'C', colorClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400' },
    { symbol: '!', label: 'NEUTRA', sublabel: 'Balón forzado', key: 'N', colorClass: 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400' },
    { symbol: '-', label: 'NEGATIVA', sublabel: 'Pase de emergencia', key: '-', colorClass: 'bg-orange-600 hover:bg-orange-500 text-white border-orange-400' },
    { symbol: '=', label: 'ERROR', sublabel: 'Ace rival directo', key: 'X', colorClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400', isError: true },
  ],
  S: [
    { symbol: '#', label: 'ACE / PUNTO', sublabel: 'Punto directo de saque', key: 'P', colorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400', isPoint: true },
    { symbol: '+', label: 'POSITIVO', sublabel: 'Complica recepción rival', key: 'C', colorClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400' },
    { symbol: '!', label: 'CONTINUIDAD', sublabel: 'Saque neutro en juego', key: 'N', colorClass: 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400' },
    { symbol: '-', label: 'NEGATIVO', sublabel: 'Saque fácil / regalado', key: '-', colorClass: 'bg-orange-600 hover:bg-orange-500 text-white border-orange-400' },
    { symbol: '=', label: 'ERROR', sublabel: 'Saque a la red o fuera', key: 'X', colorClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400', isError: true },
  ],
  B: [
    { symbol: '#', label: 'PUNTO', sublabel: 'Bloqueo directo al piso', key: 'P', colorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400', isPoint: true },
    { symbol: '+', label: 'CONTINUIDAD', sublabel: 'Toque / Rebote positivo', key: 'C', colorClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400' },
    { symbol: '=', label: 'ERROR / INVASIÓN', sublabel: 'Toque de red / afuera', key: 'X', colorClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400', isError: true },
  ],
  D: [
    { symbol: '#', label: 'PERFECTA', sublabel: 'Defensa al armador', key: 'P', colorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400' },
    { symbol: '+', label: 'POSITIVA', sublabel: 'Contraataque armado', key: 'C', colorClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400' },
    { symbol: '!', label: 'CONTINUIDAD', sublabel: 'Balón libre en juego', key: 'N', colorClass: 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400' },
    { symbol: '=', label: 'ERROR', sublabel: 'Defensa fallida', key: 'X', colorClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400', isError: true },
  ],
  E: [
    { symbol: '#', label: 'PERFECTO', sublabel: 'Atacante mano a mano', key: 'P', colorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400' },
    { symbol: '+', label: 'POSITIVO', sublabel: 'Pase preciso con bloqueo', key: 'C', colorClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400' },
    { symbol: '=', label: 'ERROR', sublabel: 'Doble golpe / invasión', key: 'X', colorClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400', isError: true },
  ],
  F: [
    { symbol: '#', label: 'PERFECTA', sublabel: 'Entrega perfecta', key: 'P', colorClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400' },
    { symbol: '+', label: 'POSITIVA', sublabel: 'Entrega controlada', key: 'C', colorClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400' },
    { symbol: '=', label: 'ERROR', sublabel: 'Error no forzado', key: 'X', colorClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400', isError: true },
  ],
};

export const VolleyballScoutMode: React.FC<VolleyballScoutModeProps> = ({
  match,
  onAddAction,
  onDeleteAction,
  onScoreChange,
  onRotateTeam,
  onSubstitutePlayer,
  onSelectAction,
}) => {
  // Active team being scouted
  const [activeTeam, setActiveTeam] = useState<TeamSide>('home');
  const [compactView, setCompactView] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    if (!compactView) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setCompactView(false); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = before; window.removeEventListener('keydown', close); };
  }, [compactView]);
  
  // Staged player & skill for the rapid 2-step flow
  const [stagedPlayerId, setStagedPlayerId] = useState<string | null>(null);
  const [stagedSkill, setStagedSkill] = useState<VolleySkill>('A');

  // Optional context: one tap when the analyst has the information, never required.
  const [selectedTargetZone, setSelectedTargetZone] = useState<number | null>(null);
  const [selectedServeOriginZone, setSelectedServeOriginZone] = useState<1 | 6 | 5 | null>(null);
  const [selectedServeType, setSelectedServeType] = useState<ScoutCodeAction['serveType'] | null>(null);

  useEffect(() => {
    setSelectedServeOriginZone(null);
  }, [stagedSkill, activeTeam]);
  
  // Visual quick confirmation toast (ephemeral, disappears in 1200ms)
  const [quickConfirmation, setQuickConfirmation] = useState<string | null>(null);

  // Keyboard helper toggle
  const [showKeyboardGuide, setShowKeyboardGuide] = useState<boolean>(false);
  const [substitutionOut, setSubstitutionOut] = useState<number | null>(null);

  // Score of current set
  const currentSetData = match.sets[match.currentSet - 1] || { scoreHome: 0, scoreAway: 0 };
  const homeScore = currentSetData.scoreHome;
  const awayScore = currentSetData.scoreAway;

  // Rotation and bench players for active team
  const activePlayers = useMemo(() => {
    const list = (activeTeam === 'home' ? match.homePlayers : match.awayPlayers) || [];
    const rotation = (activeTeam === 'home' ? match.homeRotation : match.awayRotation) || [];

    // Court positions P1..P6
    const court = rotation.map((pNum, index) => {
      const posZone = index + 1; // 1 to 6
      // Scouting keeps the rotational six visible; liberos are selected separately.
      const found = list.find((p) => p.number === pNum);
      return {
        zoneIndex: posZone,
        rotationalPlayerNum: pNum,
        player: found || {
          id: `tmp_${activeTeam}_${pNum}`,
          number: pNum,
          name: `Jugador ${pNum}`,
          position: 'OH' as const,
          team: activeTeam,
          starter: true,
        },
      };
    });

    // Bench players
    const onCourtNumbers = new Set(court.map(({ player }) => player.number));
    const bench = list.filter((p) => p.position !== 'L' && !onCourtNumbers.has(p.number) && !rotation.includes(p.number));
    const liberos = list.filter((p) => p.position === 'L');

    return { court, bench, liberos };
  }, [activeTeam, match]);

  // Selected player entity (defaults to front left attacker P4 or first available)
  const selectedPlayer = useMemo(() => {
    const list = (activeTeam === 'home' ? match.homePlayers : match.awayPlayers) || [];
    const courtPlayers = activePlayers.court.map((c) => c.player).filter(Boolean);
    const allPlayers = [...list, ...courtPlayers, ...(activePlayers.bench || [])];

    if (stagedPlayerId) {
      const found = allPlayers.find((p) => p.id === stagedPlayerId);
      if (found) return found;
    }
    if (stagedSkill === 'R') return null;
    // Default to court position P4 (attack left) or P1 (serve) or first available
    return activePlayers.court[3]?.player || activePlayers.court[0]?.player || allPlayers[0] || {
      id: `tmp_${activeTeam}_1`,
      number: 1,
      name: `Jugador 1`,
      position: 'OH' as const,
      team: activeTeam,
      starter: true,
    };
  }, [stagedPlayerId, stagedSkill, activePlayers, activeTeam, match]);

  // Service is rule-driven: the server is always P1 of the serving team.
  const servingPlayer = useMemo(() => {
    const list = match.server.team === 'home' ? match.homePlayers : match.awayPlayers;
    const rotation = match.server.team === 'home' ? match.homeRotation : match.awayRotation;
    const p1 = rotation[0] ?? match.server.playerNum;
    return list.find((p) => p.number === p1) || {
      id: `tmp_${match.server.team}_${p1}`,
      number: p1,
      name: `Jugador ${p1}`,
      position: 'OH' as const,
      team: match.server.team,
      starter: true,
    };
  }, [match.server, match.homePlayers, match.awayPlayers, match.homeRotation, match.awayRotation]);

  useEffect(() => {
    if (stagedSkill !== 'S') return;
    setActiveTeam(match.server.team);
    setStagedPlayerId(servingPlayer.id);
  }, [stagedSkill, match.server.team, match.server.playerNum, servingPlayer.id]);

  const selectScoutPlayer = (team: TeamSide, player: Player) => {
    setActiveTeam(team);
    setStagedPlayerId(player.id);
    setSubstitutionOut(null);
    if ((stagedSkill === 'S' && (team !== match.server.team || player.id !== servingPlayer.id)) ||
        (player.position === 'L' && (stagedSkill === 'A' || stagedSkill === 'B'))) {
      setStagedSkill('R');
    }
  };

  // Last registered action in the match
  const lastAction = useMemo(() => {
    if (!match.actions || match.actions.length === 0) return null;
    return match.actions[match.actions.length - 1];
  }, [match.actions]);

  // Trigger quick ephemeral feedback without blocking UI
  const triggerConfirmation = (msg: string) => {
    setQuickConfirmation(msg);
    const timer = setTimeout(() => {
      setQuickConfirmation(null);
    }, 1300);
    return () => clearTimeout(timer);
  };

  // Fast direct action registration
  const handleCommitAction = useCallback((evalSymbol: EvaluationSymbol) => {
    if (!selectedPlayer) return;

    // A serve can only be registered by P1 of the team that currently owns service.
    // Selecting SAQUE automatically uses that player and rejects the other team.
    if (stagedSkill === 'S' && activeTeam !== match.server.team) {
      triggerConfirmation(`🏐 Saca ${match.server.team === 'home' ? match.homeTeamName : match.awayTeamName} #${servingPlayer.number}`);
      return;
    }
    const actionPlayer = stagedSkill === 'S' ? servingPlayer : selectedPlayer;

    const skillObj = SKILLS.find((s) => s.id === stagedSkill);
    const outcomes = SKILL_OUTCOMES[stagedSkill] || [];
    const outcomeObj = outcomes.find((o) => o.symbol === evalSymbol);

    const isTerminal = isTerminalScoutAction(stagedSkill, evalSymbol);
    const isPoint = evalSymbol === '#' && isTerminal;
    const isError = evalSymbol === '=';
    const isBlock = stagedSkill === 'A' && evalSymbol === '/';

    // Standard FIVB/Data Volley code representation
    const prefix = activeTeam === 'home' ? '*' : 'a';
    const numStr = actionPlayer.number.toString().padStart(2, '0');
    const rawCode = `${prefix}${numStr}${stagedSkill}${evalSymbol}`;

    const desc = `${activeTeam === 'home' ? match.homeTeamName : match.awayTeamName} #${actionPlayer.number} ${actionPlayer.name}: ${skillObj?.short || stagedSkill} (${outcomeObj?.label || evalSymbol})`;

    // Infer zone from player position on court (1..6)
    const courtIndex = activePlayers.court.findIndex((c) => c.player.number === actionPlayer.number);
    const inferredZone = courtIndex >= 0 ? courtIndex + 1 : undefined;

    const newAction: ScoutCodeAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rawCode,
      team: activeTeam,
      playerNum: actionPlayer.number,
      playerName: actionPlayer.name,
      skill: stagedSkill,
      evaluation: evalSymbol,
      // Capture only context that is known at tap time. Never invent a destination zone.
      // P1 identifies the rotational server, not the location along the service line.
      startZone: stagedSkill === 'S' ? (selectedServeOriginZone ?? undefined) : inferredZone,
      endZone: selectedTargetZone ?? undefined,
      serveType: stagedSkill === 'S' ? (selectedServeType ?? undefined) : undefined,
      receptionContext:
        stagedSkill === 'R'
          ? (evalSymbol === '#' || evalSymbol === '+'
              ? 'positive'
              : (evalSymbol === '!' || evalSymbol === '-' || evalSymbol === '/' || evalSymbol === '='
                  ? 'negative'
                  : 'unknown'))
          : undefined,
      timestamp: Date.now() / 1000,
      setNumber: match.currentSet,
      scoreHome: homeScore,
      scoreAway: awayScore,
      rotationHome: [...(match.homeRotation || [1, 2, 3, 4, 5, 6])],
      rotationAway: [...(match.awayRotation || [1, 2, 3, 4, 5, 6])],
      servingTeam: match.server.team,
      serverNum: match.server.playerNum,
      liberoReplacements: match.liberoReplacements
        ? JSON.parse(JSON.stringify(match.liberoReplacements))
        : undefined,
      description: desc,
    };

    // Record the action. App.tsx is the single source of truth for automatic
    // scoreboard changes, so Scout must never increment the score a second time.
    onAddAction(newAction);

    if (isPoint) {
      triggerConfirmation(`✓ #${actionPlayer.number} ${skillObj?.short} — PUNTO`);
    } else if (isError || isBlock) {
      triggerConfirmation(`✓ #${actionPlayer.number} ${skillObj?.short} — ${isBlock ? 'BLOQUEADO (Punto rival)' : 'ERROR'}`);
    } else {
      triggerConfirmation(`✓ #${actionPlayer.number} ${skillObj?.short} — ${outcomeObj?.label || evalSymbol}`);
    }

    // Autosiguiente: reduce taps only when the volleyball sequence is unambiguous.
    // The analyst can always override team/skill manually.
    const next = nextScoutStep(activeTeam, stagedSkill, evalSymbol);
    setSelectedTargetZone(null);
    setSelectedServeOriginZone(null);
    if (stagedSkill === 'S') setSelectedServeType(null);
    if (next) {
      setActiveTeam(next.team);
      setStagedSkill(next.skill === 'E' ? 'A' : next.skill);
      setStagedPlayerId(null);
    } else if (isTerminal) {
      // The match engine updates score/rotation/server. Prepare the UI for the
      // next rally; the server synchronization effect below selects the new P1.
      setStagedSkill('S');
      setStagedPlayerId(null);
    }
  }, [selectedPlayer, stagedSkill, activeTeam, match, homeScore, awayScore, activePlayers, onAddAction, onScoreChange, selectedTargetZone, selectedServeOriginZone, selectedServeType, servingPlayer]);

  // After a terminal rally, App.tsx may rotate and change service.
  // Keep Scout aligned with the authoritative server and preselect the physical P1.
  useEffect(() => {
    if (stagedSkill !== 'S') return;
    setActiveTeam(match.server.team);
    const roster = match.server.team === 'home' ? match.homePlayers : match.awayPlayers;
    const server = roster.find((p) => p.number === match.server.playerNum);
    if (server) setStagedPlayerId(server.id);
  }, [stagedSkill, match.server.team, match.server.playerNum, match.homePlayers, match.awayPlayers]);

  // Immediate Undo without modal
  const handleUndo = useCallback(() => {
    if (!match.actions || match.actions.length === 0) return;
    const last = match.actions[match.actions.length - 1];

    // App.tsx also owns score rollback when an action is deleted. Keeping the
    // rollback in one place prevents double decrements and correctly handles
    // every terminal evaluation (including blocked attacks).
    onDeleteAction(last.id);
    triggerConfirmation(`↶ Acción Deshecha: #${last.playerNum} ${last.rawCode}`);
  }, [match.actions, homeScore, awayScore, onDeleteAction, onScoreChange]);

  const scoutButtons = useScoutButtons();

  // Fast keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside any text input or modal
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      // Undo: Ctrl+Z or Backspace
      if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

      // Switch Team: Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTeam((prev) => (prev === 'home' ? 'away' : 'home'));
        return;
      }

      // Select Player on Court via 1..6 (Positions P1 to P6)
      const numKey = parseInt(e.key, 10);
      if (numKey >= 1 && numKey <= 6) {
        const item = activePlayers.court[numKey - 1];
        if (item && item.player) {
          setStagedPlayerId(item.player.id);
          return;
        }
      }

      // Select Skill: S, R, E, A, B, D
      const upperKey = e.key.toUpperCase();
      if (upperKey === 'S') { setStagedSkill('S'); return; }
      if (upperKey === 'R') { setStagedSkill('R'); return; }
      if (upperKey === 'A') { setStagedSkill('A'); return; }
      if (upperKey === 'B') { setStagedSkill('B'); return; }
      if (upperKey === 'D') { setStagedSkill('D'); return; }

      const evaluation = evaluationForKey(e.key, scoutButtons);
      if (evaluation && SKILL_OUTCOMES[stagedSkill].some(option => option.symbol === evaluation)) {
        e.preventDefault();
        handleCommitAction(evaluation);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePlayers, handleUndo, handleCommitAction, scoutButtons, stagedSkill]);

  // Current outcomes available for the selected skill
  const currentOutcomes = [...(SKILL_OUTCOMES[stagedSkill] || SKILL_OUTCOMES.A)]
    .sort((a, b) => scoutButtons.order.indexOf(a.symbol) - scoutButtons.order.indexOf(b.symbol));

  if (compactView) return <CompactScoutPanel match={match} activeTeam={activeTeam} selectedPlayer={selectedPlayer} skill={stagedSkill} outcomes={currentOutcomes} onPlayer={selectScoutPlayer} onSkill={setStagedSkill} onEvaluate={handleCommitAction} onUndo={handleUndo} onClose={() => setCompactView(false)} confirmation={quickConfirmation} />;

  return (
    <>
    <button type="button" onClick={() => setCompactView(true)} className="min-h-11 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950">Scout simple · Pantalla completa</button>
    <div className="space-y-4 select-none animate-fadeIn">
      {/* EPHEMERAL QUICK TOAST CONFIRMATION (Disappears in 1.2s without requiring 'Aceptar') */}
      {quickConfirmation && (
        <div className="fixed top-20 right-6 z-50 bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-sm border-2 border-amber-300 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{quickConfirmation}</span>
        </div>
      )}

      {/* MOBILE STICKY SCORE: always visible below the global match context bar */}
      <div className="sm:hidden sticky top-[98px] z-30 -mx-1 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase text-amber-400 truncate">{match.homeTeamName}</div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onScoreChange(Math.max(0, homeScore - 1), awayScore)}
                className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 text-xs font-black border border-slate-700"
                aria-label="Restar punto local"
              >−</button>
              <span className="text-2xl leading-none font-black font-mono text-white min-w-[30px] text-center">{homeScore}</span>
              <button
                type="button"
                onClick={() => onScoreChange(homeScore + 1, awayScore)}
                className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/40"
                aria-label="Sumar punto local"
              >+</button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
              SET {match.currentSet}
            </span>
            <span className="mt-1 text-[10px] font-black text-amber-300 whitespace-nowrap">
              🏐 {match.server.team === 'home' ? 'LOCAL' : 'RIVAL'} #{match.server.playerNum}
            </span>
          </div>

          <div className="min-w-0 flex flex-col items-end">
            <div className="text-[9px] font-black uppercase text-cyan-400 truncate max-w-full">{match.awayTeamName}</div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onScoreChange(homeScore, Math.max(0, awayScore - 1))}
                className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 text-xs font-black border border-slate-700"
                aria-label="Restar punto rival"
              >−</button>
              <span className="text-2xl leading-none font-black font-mono text-white min-w-[30px] text-center">{awayScore}</span>
              <button
                type="button"
                onClick={() => onScoreChange(homeScore, awayScore + 1)}
                className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-black border border-cyan-500/40"
                aria-label="Sumar punto rival"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. SCOREBOARD & MATCH HEADER (TABLET / DESKTOP) */}
      <div className="hidden sm:flex bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Local Team */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => setActiveTeam('home')}
            className={`text-left p-2.5 rounded-2xl border transition ${
              activeTeam === 'home'
                ? 'bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeTeam === 'home' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-black tracking-wider uppercase text-amber-400">EQUIPO LOCAL</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white truncate max-w-[180px]">
              {match.homeTeamName}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              Sets ganados: <strong className="text-amber-300">{match.sets.filter((s) => s.winner === 'home').length}</strong>
            </div>
          </button>

          {/* Home Score Number & Quick Adjust */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(Math.max(0, homeScore - 1), awayScore);
              }}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-700 active:scale-95 transition"
              title="Restar punto Local (-1)"
            >
              -
            </button>
            <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 text-center shadow-inner min-w-[56px]">
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400">
                {homeScore}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(homeScore + 1, awayScore);
              }}
              className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-sm border border-amber-500/40 active:scale-95 transition"
              title="Sumar punto Local (+1)"
            >
              +
            </button>
          </div>
        </div>

        {/* Center: Set indicator, previous sets & quick rotate buttons */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              SET {match.currentSet}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              {match.sets.map((s) => (
                <span
                  key={s.setNumber}
                  className={`px-1.5 py-0.5 rounded ${
                    s.setNumber === match.currentSet ? 'text-amber-400 bg-slate-800' : 'text-slate-500'
                  }`}
                >
                  S{s.setNumber}: {s.scoreHome}-{s.scoreAway}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Rotations for both teams */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRotateTeam('home')}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Rotar formación Local (P1->P6->P5->P4->P3->P2)"
            >
              <RotateCw className="w-3 h-3 text-amber-400" />
              <span>Rotar Local</span>
            </button>

            <button
              onClick={() => onRotateTeam('away')}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Rotar formación Rival"
            >
              <RotateCw className="w-3 h-3 text-cyan-400" />
              <span>Rotar Rival</span>
            </button>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-end">
          {/* Away Score Number & Quick Adjust */}
          <div className="flex items-center gap-1.5 order-2 md:order-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(homeScore, Math.max(0, awayScore - 1));
              }}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-700 active:scale-95 transition"
              title="Restar punto Rival (-1)"
            >
              -
            </button>
            <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 text-center shadow-inner min-w-[56px]">
              <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400">
                {awayScore}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(homeScore, awayScore + 1);
              }}
              className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-sm border border-cyan-500/40 active:scale-95 transition"
              title="Sumar punto Rival (+1)"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setActiveTeam('away')}
            className={`text-right p-2.5 rounded-2xl border transition order-1 md:order-2 ${
              activeTeam === 'away'
                ? 'bg-cyan-500/20 border-cyan-500/60 ring-2 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] font-black tracking-wider uppercase text-cyan-400">EQUIPO RIVAL</span>
              <span className={`w-2.5 h-2.5 rounded-full ${activeTeam === 'away' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            </div>
            <div className="text-lg sm:text-xl font-black text-white truncate max-w-[180px]">
              {match.awayTeamName}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              Sets ganados: <strong className="text-cyan-300">{match.sets.filter((s) => s.winner === 'away').length}</strong>
            </div>
          </button>
        </div>

      </div>

      {/* 2. PERSISTENT 'ÚLTIMA ACCIÓN' STRIP + 'DESHACER' DIRECT BUTTON */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-md flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:inline text-[10px] font-black tracking-widest uppercase bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg shrink-0">
            ÚLTIMA ACCIÓN
          </span>
          {lastAction ? (
            <div className="flex items-center gap-2 text-xs font-bold text-white truncate">
              <span className="text-amber-400 font-mono">#{lastAction.playerNum}</span>
              <span className="hidden sm:inline truncate">{lastAction.description}</span>
              <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {lastAction.rawCode}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Listo para registrar la primera acción del punto...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* UNDO BUTTON: DIRECT, ZERO-MODAL REVERSAL */}
          <button
            onClick={handleUndo}
            disabled={!lastAction}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md ${
              lastAction
                ? 'bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 active:scale-95'
                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
            title="Deshacer inmediatamente la última acción (Ctrl+Z o Backspace)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="sm:hidden">↶</span><span className="hidden sm:inline">↶ DESHACER</span>
          </button>

          {/* KEYBOARD SHORTCUTS TOGGLE */}
          <button
            onClick={() => setShowKeyboardGuide((prev) => !prev)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Ver atajos de teclado"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OPTIONAL KEYBOARD GUIDE COLLAPSIBLE BAR */}
      {showKeyboardGuide && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300 space-y-1.5">
          <div className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Atajos de Teclado Activos en Modo Rápido:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div><strong className="text-white">1 .. 6:</strong> Jugador P1 .. P6</div>
            <div><strong className="text-amber-300">S, R, A, B, D:</strong> Fundamento</div>
            <div className="col-span-2 flex flex-wrap gap-3">{currentOutcomes.map(option => <span key={option.symbol}><strong className="text-amber-300">{scoutButtons.keys[option.symbol]} / {option.symbol}:</strong> {option.label}</span>)}</div>
            <div><strong className="text-white">Ctrl+Z:</strong> Deshacer</div>
          </div>
        </div>
      )}

      {/* Compact scoreboard: both rotational sixes and separate libero selectors. */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl space-y-3 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-black text-white">Rotaciones · Ambos equipos</span>
          <span className="text-[10px] text-amber-200">A · Armador en amarillo claro · L · Líberos afuera</span>
          <span className="text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-lg">
            {activeTeam === 'home' ? match.homeTeamName : match.awayTeamName} · {selectedPlayer ? `#${selectedPlayer.number}` : 'Elegí receptor'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)] gap-3 items-start">
          <div className="sm:col-start-2 sm:row-start-1 w-full max-w-[240px] mx-auto space-y-2 bg-slate-950 border border-slate-700 rounded-xl p-2">
            {(['home', 'away'] as const).map((team) => {
              const players = team === 'home' ? match.homePlayers : match.awayPlayers;
              const rotation = team === 'home' ? match.homeRotation : match.awayRotation;
              const positions = team === 'home' ? [1, 6, 5, 2, 3, 4] : [4, 3, 2, 5, 6, 1];
              return (
                <React.Fragment key={team}>
                  {team === 'away' && <div className="h-1 bg-white rounded-full" aria-label="Red entre equipos" />}
                  <div className="space-y-1.5">
                    <div className={`text-[10px] font-black truncate ${team === 'home' ? 'text-blue-300' : 'text-fuchsia-300'}`}>
                      {team === 'home' ? match.homeTeamName : match.awayTeamName}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {positions.map((position) => {
                        const num = rotation[position - 1];
                        const player = players.find((p) => p.number === num) || { id: `tmp_${team}_${num}`, number: num, name: `Jugador ${num}`, team, position: 'OH' as const, starter: true };
                        const selected = activeTeam === team && selectedPlayer?.id === player.id;
                        const serving = team === match.server.team && position === 1;
                        return (
                          <button key={position} type="button" onClick={() => selectScoutPlayer(team, player)}
                            aria-label={`Seleccionar ${team === 'home' ? match.homeTeamName : match.awayTeamName} P${position} #${num}${player.position === 'S' ? ', armador' : ''}`}
                            aria-pressed={selected}
                            className={`min-h-11 rounded-xl border-2 text-white flex flex-col items-center justify-center ${player.position === 'S' ? 'bg-amber-100 !text-slate-950' : team === 'home' ? 'bg-blue-600' : 'bg-fuchsia-600'} ${selected ? 'border-white ring-2 ring-amber-400' : 'border-transparent'}`}
                          >
                            <span className="text-[8px] leading-none opacity-80">P{position}{player.position === 'S' ? ' · A' : ''}{serving ? ' · 🏐' : ''}</span>
                            <span className="font-mono text-lg font-black leading-tight">{num}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1" role="group" aria-label={`Líberos de ${team === 'home' ? match.homeTeamName : match.awayTeamName}`}>
                      {players.filter((p) => p.position === 'L').map((libero) => (
                        <button key={libero.id} type="button" onClick={() => selectScoutPlayer(team, libero)}
                          aria-label={`Seleccionar líbero ${team === 'home' ? match.homeTeamName : match.awayTeamName} #${libero.number} ${libero.name}`}
                          aria-pressed={activeTeam === team && selectedPlayer?.id === libero.id}
                          className={`min-h-11 px-3 rounded-lg border text-xs font-black ${activeTeam === team && selectedPlayer?.id === libero.id ? 'bg-purple-500 border-white text-white' : 'bg-purple-950 border-purple-500 text-purple-200'}`}
                        >L {libero.number}</button>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {(['home', 'away'] as const).map((team) => {
            const players = team === 'home' ? match.homePlayers : match.awayPlayers;
            const rotation = team === 'home' ? match.homeRotation : match.awayRotation;
            return (
              <div key={team} className={`hidden sm:block rounded-xl border border-slate-700 overflow-hidden ${team === 'home' ? 'sm:col-start-1' : 'sm:col-start-3'} sm:row-start-1`}>
                <div className={`text-xs font-black text-white px-2 py-2 ${team === 'home' ? 'bg-blue-600' : 'bg-fuchsia-600'}`}>{team === 'home' ? match.homeTeamName : match.awayTeamName}</div>
                <div className="max-h-72 overflow-y-auto p-1 space-y-1">
                  {players.map((player) => {
                    const position = rotation.indexOf(player.number) + 1;
                    const available = position > 0 || player.position === 'L';
                    return <button key={player.id} type="button" disabled={!available} onClick={() => selectScoutPlayer(team, player)} className={`w-full text-left text-[11px] flex items-center gap-2 px-2 py-1.5 rounded-lg ${activeTeam === team && selectedPlayer?.id === player.id ? 'bg-blue-700 text-white' : available ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-500'}`}>
                      <span className="font-mono font-black">{player.number}</span><span className="truncate flex-1">{player.name}</span><span>{player.position === 'L' ? 'L' : position ? `P${position}` : ''}</span>
                    </button>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <details className="text-xs bg-slate-950 rounded-xl border border-slate-800 p-2">
          <summary className="cursor-pointer font-bold text-slate-300">Cambios de jugadores · {activeTeam === 'home' ? match.homeTeamName : match.awayTeamName}</summary>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {activePlayers.court.map(({ player, zoneIndex }) => <button key={zoneIndex} type="button" onClick={() => setSubstitutionOut(player.number)} className={`px-2 py-2 rounded-lg border ${substitutionOut === player.number ? 'bg-rose-500 text-white border-rose-300' : 'text-slate-300 border-slate-700'}`}>P{zoneIndex} #{player.number} sale</button>)}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {activePlayers.bench.map((player) => <button key={player.id} type="button" onClick={() => {
              if (substitutionOut == null) { triggerConfirmation('Elegí primero quién sale'); return; }
              onSubstitutePlayer(activeTeam, substitutionOut, player.number);
              setSubstitutionOut(null); setStagedPlayerId(player.id);
            }} className="px-2 py-2 rounded-lg border border-emerald-500 text-emerald-300">#{player.number} entra</button>)}
          </div>
        </details>

        {stagedSkill === 'R' && (
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-xs text-cyan-100" role="status">
            <strong>Recepción · {activeTeam === 'home' ? match.homeTeamName : match.awayTeamName}</strong>
            <p className="mt-1">{selectedPlayer ? `Receptor #${selectedPlayer.number}: elegí la evaluación para registrar.` : 'Tocá el número del receptor o del líbero y después elegí la evaluación.'}</p>
          </div>
        )}

        {/* 4. FAST 2-STEP REGISTRATION CONTROLS */}
        <div className="space-y-4 pt-2">
          
          {/* STEP 1: FUNDAMENTAL SKILL (6 LARGE TOUCH BUTTONS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                1. Fundamento Técnico
              </span>
              <span className="text-amber-400 font-bold font-mono">
                Seleccionado: {SKILLS.find((s) => s.id === stagedSkill)?.label}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2.5">
              {SKILLS.filter(s => s.id !== 'E').map((skill) => {
                const isActive = stagedSkill === skill.id;
                return (
                  <button
                    key={skill.id}
                    onClick={() => {
                      if (isActive && skill.id === 'A') {
                        // If user clicks ATAQUE while already active, directly commit a point attack (#)
                        handleCommitAction('#');
                      } else {
                        setStagedSkill(skill.id);
                      }
                    }}
                    className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm flex flex-col items-center justify-center gap-1 transition active:scale-95 border cursor-pointer min-h-[58px] sm:min-h-0 ${
                      isActive
                        ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-xl shadow-amber-500/20 scale-[1.02] ring-2 ring-amber-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <span className="text-lg sm:text-2xl leading-none">{skill.icon}</span>
                    <span className="tracking-tight">{skill.label}</span>
                    <span className={`hidden sm:inline text-[10px] font-mono ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-500'}`}>
                      ({skill.key})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: OUTCOME / QUALITY (1 CLICK = REGISTRADO) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                2. Resultado
              </span>
              <span className="hidden sm:inline text-emerald-400 font-bold">
                ✓ Graba automáticamente en marcador y planilla
              </span>
            </div>

            <div className={`grid gap-2.5 ${
              currentOutcomes.length === 3
                ? 'grid-cols-3'
                : currentOutcomes.length === 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-3 sm:grid-cols-5'
            }`}>
              {currentOutcomes.map((opt) => (
                <button
                  key={opt.symbol}
                  disabled={!selectedPlayer}
                  onClick={() => handleCommitAction(opt.symbol)}
                  className={`disabled:opacity-40 disabled:cursor-not-allowed ${opt.colorClass} border-2 py-3 sm:py-4 px-2 sm:px-3 rounded-xl sm:rounded-2xl font-black transition transform active:scale-95 shadow-xl flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px]`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl sm:text-2xl font-mono leading-none">{opt.symbol}</span>
                    <span className="text-[11px] sm:text-base tracking-tight">{opt.label}</span>
                  </div>
                  <span className="hidden sm:block text-[10px] tracking-tight opacity-90 text-center truncate w-full">
                    {opt.sublabel} ({scoutButtons.keys[opt.symbol]})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* OPTIONAL CONTEXT: fast, one-tap and never blocks registration */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Contexto opcional
              </span>
              <span className="hidden sm:inline text-[11px] text-slate-500">
                Si no lo sabes, no marques nada. OPEN VOLEY no completa datos por su cuenta.
              </span>
            </div>

            {stagedSkill === 'S' && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Zona de origen del saque">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Desde dónde saca:</span>
                {([1, 6, 5] as const).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    aria-pressed={selectedServeOriginZone === zone}
                    onClick={() => setSelectedServeOriginZone((prev) => prev === zone ? null : zone)}
                    className={`w-11 h-11 rounded-xl text-xs font-black border transition ${selectedServeOriginZone === zone
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'}`}
                  >
                    Z{zone}
                  </button>
                ))}
              </div>
            )}

            {stagedSkill === 'S' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Tipo de saque:</span>
                {[
                  { id: 'float' as const, label: 'Flotante' },
                  { id: 'jump_float' as const, label: 'Jump Float' },
                  { id: 'jump_spin' as const, label: 'Potencia' },
                  { id: 'standing' as const, label: 'De pie' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedServeType((prev) => prev === item.id ? null : item.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      selectedServeType === item.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {['S', 'A', 'E', 'D', 'F'].includes(stagedSkill) && (
              <TargetZoneCourt selectedZone={selectedTargetZone} onSelect={setSelectedTargetZone} />
            )}
          </div>



        </div>

      </div>

    </div>
    </>
  );
};
