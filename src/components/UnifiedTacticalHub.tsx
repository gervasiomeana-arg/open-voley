import React, { useState } from 'react';
import { MatchData, Player, ScoutCodeAction, TeamSide, VolleySkill, EvaluationSymbol } from '../types';
import { parseScoutCodes, parseScoutCode, EVALUATION_NAMES, SKILL_NAMES } from '../utils/codeParser';
import { VolleyballScoutMode } from './VolleyballScoutMode';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Activity, 
  Apple, 
  Target, 
  Ruler, 
  ChevronRight, 
  X, 
  Save, 
  Info, 
  RotateCw, 
  Keyboard, 
  Send, 
  Plus, 
  Download, 
  RotateCcw,
  Sparkles,
  Search,
  Eye,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Zap,
  LayoutGrid,
  HelpCircle,
  PlusCircle,
  FolderKanban,
  ArrowLeft
} from 'lucide-react';

interface UnifiedTacticalHubProps {
  match: MatchData;
  onAddAction: (action: ScoutCodeAction) => void;
  onDeleteAction: (id: string) => void;
  onScoreChange: (homeScore: number, awayScore: number) => void;
  onSetScoreWinner: (winner: TeamSide) => void;
  onRotateTeam: (team: TeamSide) => void;
  onSubstitutePlayer: (team: TeamSide, playerOut: number, playerIn: number) => void;
  onLiberoReplacement: (team: TeamSide, liberoNum: number, replacedPlayerNum: number | null) => void;
  onUpdatePlayers: (team: TeamSide, players: Player[]) => void;
  onUpdateTeamName: (team: TeamSide, newName: string) => void;
  selectedActionId: string | null;
  onSelectAction: (id: string) => void;
  handleZoneClick: (zone: number, team: TeamSide) => void;
  onOpenNewMatch?: () => void;
  onOpenTeamsManager?: () => void;
  onOpenHelp?: () => void;
  onSaveMatch?: () => void;
  onBackToMatchCenter?: () => void;
}

// Coordinates for standard volleyball zones 1-9 on a 0..100 grid for each half
// Half A (Home): y = 50..100
// Half B (Away): y = 0..50
const ZONE_COORDS_HOME: Record<number, { x: number; y: number }> = {
  1: { x: 80, y: 84 },
  6: { x: 50, y: 84 },
  5: { x: 20, y: 84 },
  2: { x: 80, y: 62 },
  3: { x: 50, y: 62 },
  4: { x: 20, y: 62 },
  7: { x: 80, y: 95 },
  8: { x: 50, y: 95 },
  9: { x: 20, y: 95 },
};

const ZONE_COORDS_AWAY: Record<number, { x: number; y: number }> = {
  1: { x: 20, y: 16 },
  6: { x: 50, y: 16 },
  5: { x: 80, y: 16 },
  2: { x: 20, y: 38 },
  3: { x: 50, y: 38 },
  4: { x: 80, y: 38 },
  7: { x: 20, y: 5 },
  8: { x: 50, y: 5 },
  9: { x: 80, y: 5 },
};

export const UnifiedTacticalHub: React.FC<UnifiedTacticalHubProps> = ({
  match,
  onAddAction,
  onDeleteAction,
  onScoreChange,
  onSetScoreWinner,
  onRotateTeam,
  onSubstitutePlayer,
  onLiberoReplacement,
  onUpdatePlayers,
  onUpdateTeamName,
  selectedActionId,
  onSelectAction,
  handleZoneClick,
  onOpenNewMatch,
  onOpenTeamsManager,
  onOpenHelp,
  onSaveMatch,
  onBackToMatchCenter,
}) => {
  // Active viewing state (Default: MODO RÁPIDO, remembers preference in localStorage)
  const [scoutViewMode, setScoutViewMode] = useState<'quick_touch' | 'tactical_2d'>(() => {
    const saved = localStorage.getItem('openvoley_scouting_mode');
    return saved === 'tactical_2d' ? 'tactical_2d' : 'quick_touch';
  });

  const handleToggleScoutMode = (mode: 'quick_touch' | 'tactical_2d') => {
    setScoutViewMode(mode);
    localStorage.setItem('openvoley_scouting_mode', mode);
  };

  const handleUndo = () => {
    if (!match.actions || match.actions.length === 0) return;
    const last = match.actions[match.actions.length - 1];
    const curSet = match.sets[match.currentSet - 1] || { scoreHome: 0, scoreAway: 0 };
    if (last.evaluation === '#') {
      if (last.team === 'home') {
        onScoreChange(Math.max(0, curSet.scoreHome - 1), curSet.scoreAway);
      } else {
        onScoreChange(curSet.scoreHome, Math.max(0, curSet.scoreAway - 1));
      }
    } else if (last.evaluation === '=') {
      if (last.team === 'home') {
        onScoreChange(curSet.scoreHome, Math.max(0, curSet.scoreAway - 1));
      } else {
        onScoreChange(Math.max(0, curSet.scoreHome - 1), curSet.scoreAway);
      }
    }
    onDeleteAction(last.id);
  };

  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);
  const [isEditingPlayerModal, setIsEditingPlayerModal] = useState(false);
  const [editingPlayerTeam, setEditingPlayerTeam] = useState<TeamSide>('home');
  const [playerFormData, setPlayerFormData] = useState<Partial<Player>>({});
  const [activeSidePanel, setActiveSidePanel] = useState<'home' | 'away' | 'console'>('console');
  const [substituteTargetPos, setSubstituteTargetPos] = useState<{ team: TeamSide; zone: number; currentNum: number } | null>(null);

  // Command Console state
  const [inputCode, setInputCode] = useState('');
  const [selectedPlayerNum, setSelectedPlayerNum] = useState<number>(14);
  const [selectedTeam, setSelectedTeam] = useState<TeamSide>('home');
  const [selectedSkill, setSelectedSkill] = useState<VolleySkill>('A');
  const [selectedEval, setSelectedEval] = useState<EvaluationSymbol>('#');
  const [selectedStartZone, setSelectedStartZone] = useState<number>(4);
  const [selectedEndZone, setSelectedEndZone] = useState<number>(5);

  const [hoveredZone, setHoveredZone] = useState<{ zone: number; team: TeamSide } | null>(null);

  // Helpers to get player from number
  const getPlayer = (num: number, team: TeamSide): Player | undefined => {
    const list = (team === 'home' ? match.homePlayers : match.awayPlayers) || [];
    return list.find((p) => p.number === num);
  };

  // PosIndex: 0->Z1, 1->Z2, 2->Z3, 3->Z4, 4->Z5, 5->Z6
  const getCourtPlayer = (team: TeamSide, zone: number): { player: Player | undefined; number: number } | null => {
    const rotation = (team === 'home' ? match.homeRotation : match.awayRotation) || [];
    const posIndex = zone - 1;
    const pNum = rotation[posIndex];
    if (!pNum) return null;
    return {
      number: pNum,
      player: getPlayer(pNum, team),
    };
  };

  // Parse code on the fly for preview (supports compound codes like a14sq.4#17)
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
      // Add all generated actions (single or dual)
      actions.forEach((act) => onAddAction(act));

      let currentHome = match.sets[match.currentSet - 1]?.scoreHome || 0;
      let currentAway = match.sets[match.currentSet - 1]?.scoreAway || 0;

      // Auto score increment if any terminal action scored a point (#) or direct error (=)
      // Check last action or point-scoring action
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
    const playerStr = selectedPlayerNum < 10 ? `0${selectedPlayerNum}` : `${selectedPlayerNum}`;
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

  // Player Editing Modal Handlers
  const handleOpenAddPlayer = (team: TeamSide) => {
    const currentList = team === 'home' ? match.homePlayers : match.awayPlayers;
    setEditingPlayerTeam(team);
    setPlayerFormData({
      id: `p_${Date.now()}`,
      number: currentList.length ? Math.max(...currentList.map((p) => p.number)) + 1 : 1,
      name: '',
      position: 'OH',
      team: team,
      starter: false,
      heightCm: 185,
      weightKg: 76,
      spikeReachCm: 320,
      blockReachCm: 300,
      hittingStyle: '',
      kinesiologyNotes: '',
      nutritionNotes: '',
      notes: '',
    });
    setIsEditingPlayerModal(true);
  };

  const handleOpenEditPlayer = (player: Player) => {
    setEditingPlayerTeam(player.team);
    setPlayerFormData({ ...player });
    setIsEditingPlayerModal(true);
  };

  const handleSavePlayerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerFormData.name || playerFormData.number === undefined) return;

    const newPlayer: Player = {
      id: playerFormData.id || `p_${Date.now()}`,
      number: Number(playerFormData.number),
      name: playerFormData.name,
      position: (playerFormData.position as Player['position']) || 'OH',
      team: editingPlayerTeam,
      starter: !!playerFormData.starter,
      heightCm: playerFormData.heightCm ? Number(playerFormData.heightCm) : undefined,
      weightKg: playerFormData.weightKg ? Number(playerFormData.weightKg) : undefined,
      spikeReachCm: playerFormData.spikeReachCm ? Number(playerFormData.spikeReachCm) : undefined,
      blockReachCm: playerFormData.blockReachCm ? Number(playerFormData.blockReachCm) : undefined,
      hittingStyle: playerFormData.hittingStyle || '',
      kinesiologyNotes: playerFormData.kinesiologyNotes || '',
      nutritionNotes: playerFormData.nutritionNotes || '',
      notes: playerFormData.notes || '',
    };

    const targetList = editingPlayerTeam === 'home' ? match.homePlayers : match.awayPlayers;
    const exists = targetList.some((p) => p.id === newPlayer.id);
    const updated = exists
      ? targetList.map((p) => (p.id === newPlayer.id ? newPlayer : p))
      : [...targetList, newPlayer];

    onUpdatePlayers(editingPlayerTeam, updated);
    if (selectedPlayerForProfile?.id === newPlayer.id) {
      setSelectedPlayerForProfile(newPlayer);
    }
    setIsEditingPlayerModal(false);
  };

  const handleDeletePlayer = (id: string, team: TeamSide) => {
    if (!confirm('¿Eliminar a este jugador/a del plantel?')) return;
    const targetList = team === 'home' ? match.homePlayers : match.awayPlayers;
    const updated = targetList.filter((p) => p.id !== id);
    onUpdatePlayers(team, updated);
    if (selectedPlayerForProfile?.id === id) {
      setSelectedPlayerForProfile(null);
    }
  };

  // Perform Substitution on Court Rotation
  const handlePerformSubstitution = (newNum: number) => {
    if (!substituteTargetPos) return;
    const { team, zone } = substituteTargetPos;
    const posIndex = zone - 1;
    const currentRot = team === 'home' ? [...match.homeRotation] : [...match.awayRotation];
    currentRot[posIndex] = newNum;

    if (team === 'home') {
      match.homeRotation = currentRot;
    } else {
      match.awayRotation = currentRot;
    }
    setSubstituteTargetPos(null);
  };

  const getPositionBadge = (pos: Player['position']) => {
    const colors: Record<string, string> = {
      OH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      MB: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      OPP: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      S: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      L: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors[pos] || 'bg-slate-800 text-slate-300'}`}>
        {pos}
      </span>
    );
  };

  const currentSetData = match.sets[match.currentSet - 1] || { scoreHome: 0, scoreAway: 0 };

  return (
    <div className="space-y-3 sm:space-y-6 text-slate-100 max-w-[1600px] mx-auto">

      {/* QUICK WORKFLOW BAR: Return to Match Center + Context Metadata + Clean Secondary Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3.5 shadow-lg flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToMatchCenter && (
            <button
              onClick={onBackToMatchCenter}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer shrink-0"
              title="Volver al Centro del Partido"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">← Centro del Partido</span><span className="sm:hidden">Centro</span>
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white truncate">{match.homeTeamName} vs {match.awayTeamName}</span>
              <span className="text-[10px] bg-slate-950 text-amber-400 font-mono px-2 py-0.5 rounded border border-slate-800 font-bold">
                Set {match.currentSet} ({currentSetData.scoreHome} - {currentSetData.scoreAway})
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate block">
              {match.competition || 'Torneo Oficial'} • {match.date}
            </span>
          </div>
        </div>

        {/* Secondary controls with neutral styling */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {onOpenTeamsManager && (
            <button
              onClick={onOpenTeamsManager}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Biblioteca de Equipos Propios y Rivales"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Equipos</span>
            </button>
          )}

          {onSaveMatch && (
            <button
              onClick={onSaveMatch}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Guardar partido actual en historial"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guardar</span>
            </button>
          )}

          {onOpenNewMatch && (
            <button
              onClick={onOpenNewMatch}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Crear un nuevo partido"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Nuevo</span>
            </button>
          )}

          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Ver guía y atajos de teclado"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ayuda</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 0. SCOUTING VIEW MODE SELECTOR (Segment control con jerarquía limpia) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 bg-slate-900 border border-slate-800 p-2 sm:p-3 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-bold text-xs text-slate-300">Registro</span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            {scoutViewMode === 'quick_touch' ? 'Panel de toques rápidos optimizado' : 'Consola completa con coordenadas espaciales'}
          </span>
        </div>

        {/* Clean segment toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto text-xs">
          <button
            onClick={() => handleToggleScoutMode('quick_touch')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              scoutViewMode === 'quick_touch'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Modo Rápido</span>
          </button>

          <button
            onClick={() => handleToggleScoutMode('tactical_2d')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              scoutViewMode === 'tactical_2d'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Modo Completo</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE MODE */}
      {scoutViewMode === 'quick_touch' ? (
        <VolleyballScoutMode
          key={match.id}
          match={match}
          onAddAction={onAddAction}
          onDeleteAction={onDeleteAction}
          onScoreChange={onScoreChange}
          onRotateTeam={onRotateTeam}
          onSubstitutePlayer={onSubstitutePlayer}
          onLiberoReplacement={onLiberoReplacement}
          onSelectAction={onSelectAction}
        />
      ) : (
        <>
          {/* 1. SCOREBOARD & ROTATION STRIP */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6">
        
        {/* Local Team Box */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Local</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{match.homeTeamName}</div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => onRotateTeam('home')}
                className="inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-orange-500/20 hover:text-orange-400 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-700 transition font-bold"
                title="Rotar equipo Local en sentido horario (1->6->5->4->3->2->1)"
              >
                <RotateCw className="w-3.5 h-3.5 text-orange-400" /> Rotar Formación
              </button>
              <button
                onClick={() => setActiveSidePanel('home')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Ver Plantel ({match.homePlayers?.length || 0})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(Math.max(0, currentSetData.scoreHome - 1), currentSetData.scoreAway);
              }}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-700 active:scale-95 transition"
              title="Restar punto Local (-1)"
            >
              -
            </button>
            <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 shadow-inner min-w-[56px] text-center">
              <div className="text-3xl sm:text-4xl font-black text-orange-500 font-mono">{currentSetData.scoreHome}</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(currentSetData.scoreHome + 1, currentSetData.scoreAway);
              }}
              className="w-7 h-7 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 flex items-center justify-center font-bold text-sm border border-orange-500/40 active:scale-95 transition"
              title="Sumar punto Local (+1)"
            >
              +
            </button>
          </div>
        </div>

        {/* Set & Versus Box */}
        <div className="text-center space-y-1.5">
          <div className="bg-amber-500/20 text-amber-300 text-xs font-black px-4 py-1.5 rounded-full border border-amber-500/30 uppercase tracking-widest inline-block shadow-sm">
            SET {match.currentSet}
          </div>
          <div className="text-xl font-black text-slate-600">VS</div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-mono">
            {match.sets.map((s) => (
              <span
                key={s.setNumber}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                  s.setNumber === match.currentSet
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                S{s.setNumber}: {s.scoreHome}-{s.scoreAway}
              </span>
            ))}
          </div>
        </div>

        {/* Away Team Box */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 order-2 md:order-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(currentSetData.scoreHome, Math.max(0, currentSetData.scoreAway - 1));
              }}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-700 active:scale-95 transition"
              title="Restar punto Rival (-1)"
            >
              -
            </button>
            <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 shadow-inner min-w-[56px] text-center">
              <div className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">{currentSetData.scoreAway}</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(currentSetData.scoreHome, currentSetData.scoreAway + 1);
              }}
              className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-sm border border-cyan-500/40 active:scale-95 transition"
              title="Sumar punto Rival (+1)"
            >
              +
            </button>
          </div>
          <div className="text-right order-1 md:order-2">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Visitante</span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{match.awayTeamName}</div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                onClick={() => setActiveSidePanel('away')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Ver Plantel ({match.awayPlayers?.length || 0})
              </button>
              <button
                onClick={() => onRotateTeam('away')}
                className="inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-700 transition font-bold"
                title="Rotar equipo Visitante en sentido horario"
              >
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Rotar Formación
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* PERSISTENT ÚLTIMA ACCIÓN & DESHACER STRIP (MODO COMPLETO) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-black tracking-widest uppercase bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg shrink-0">
            ÚLTIMA ACCIÓN
          </span>
          {match.actions && match.actions.length > 0 ? (
            <div className="flex items-center gap-2 text-xs font-bold text-white truncate">
              <span className="text-amber-400 font-mono">#{match.actions[match.actions.length - 1].playerNum}</span>
              <span className="truncate">{match.actions[match.actions.length - 1].description}</span>
              <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {match.actions[match.actions.length - 1].rawCode}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Listo para registrar acción en el partido...</span>
          )}
        </div>

        <button
          onClick={handleUndo}
          disabled={!match.actions || match.actions.length === 0}
          className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md ${
            match.actions && match.actions.length > 0
              ? 'bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 active:scale-95'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
          }`}
          title="Deshacer inmediatamente la última acción registrada"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>↶ DESHACER</span>
        </button>
      </div>

      {/* 2. UNIFIED TACTICAL ARENA: 2D COURT (CENTER) + EXPANDABLE ROSTERS & LIVE COMMAND CONSOLE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-6 items-start">
        
        {/* LEFT / CENTER: THE 2D VOLLEYBALL COURT WITH BOTH TEAMS ON COURT */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl space-y-3 sm:space-y-4">
            
            {/* Court Header & Quick Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-amber-400 flex items-center gap-2">
                  <span>🏐 Cancha 2D Integral con Jugadores de Ambos Equipos</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Haz clic en la ficha de cualquier jugador para abrir su <strong>expediente físico/kinésico</strong> o en una zona para scoutear.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> {match.homeTeamName} (Abajo)
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> {match.awayTeamName} (Arriba)
                </span>
              </div>
            </div>

            {/* SVG 2D Court Container */}
            <div className="relative w-full aspect-[9/14] max-w-lg mx-auto bg-slate-950 rounded-2xl p-2 border-2 border-amber-500/30 shadow-2xl overflow-hidden select-none">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                
                {/* Court Wood Canvas Background */}
                <rect x="0" y="0" width="100" height="100" fill="#0b1120" />

                {/* Outer Free Zone Lines */}
                <rect x="8" y="8" width="84" height="84" fill="#0f172a" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 1" />

                {/* Official 18x9m FIVB Court Area */}
                <rect x="12" y="12" width="76" height="76" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />

                {/* THE NET (Red central y = 50) */}
                <line x1="6" y1="50" x2="94" y2="50" stroke="#ef4444" strokeWidth="2.2" />
                <line x1="6" y1="49.5" x2="94" y2="49.5" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="1.5 1" />
                <line x1="6" y1="50.5" x2="94" y2="50.5" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="1.5 1" />
                <text x="95" y="51" fill="#ef4444" fontSize="2.8" fontWeight="bold" textAnchor="start">RED</text>

                {/* 3m Attack Lines */}
                {/* Away 3m line (y = 35.3) */}
                <line x1="12" y1="35.3" x2="88" y2="35.3" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="1.2 1" />
                <text x="90" y="36" fill="#fbbf24" fontSize="2.2" opacity="0.6">3m</text>

                {/* Home 3m line (y = 64.7) */}
                <line x1="12" y1="64.7" x2="88" y2="64.7" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="1.2 1" />
                <text x="90" y="65.5" fill="#fbbf24" fontSize="2.2" opacity="0.6">3m</text>

                {/* Zone Grid Guidelines */}
                <line x1="37.3" y1="12" x2="37.3" y2="88" stroke="#334155" strokeWidth="0.4" strokeDasharray="0.8 0.8" />
                <line x1="62.6" y1="12" x2="62.6" y2="88" stroke="#334155" strokeWidth="0.4" strokeDasharray="0.8 0.8" />
                <line x1="12" y1="23.6" x2="88" y2="23.6" stroke="#334155" strokeWidth="0.4" strokeDasharray="0.8 0.8" />
                <line x1="12" y1="76.4" x2="88" y2="76.4" stroke="#334155" strokeWidth="0.4" strokeDasharray="0.8 0.8" />

                {/* Zone Labels & Scouting Clickable Background */}
                {[1, 2, 3, 4, 5, 6].map((zone) => {
                  const coordAway = ZONE_COORDS_AWAY[zone];
                  const coordHome = ZONE_COORDS_HOME[zone];
                  return (
                    <g key={`zone_indicators_${zone}`}>
                      {/* Away Zone Target */}
                      <circle
                        cx={coordAway.x}
                        cy={coordAway.y}
                        r="6"
                        fill="#06b6d4"
                        fillOpacity={hoveredZone?.zone === zone && hoveredZone?.team === 'away' ? 0.35 : 0.08}
                        stroke="#06b6d4"
                        strokeWidth="0.4"
                        className="cursor-pointer transition-all"
                        onClick={() => handleZoneClick(zone, 'away')}
                        onMouseEnter={() => setHoveredZone({ zone, team: 'away' })}
                        onMouseLeave={() => setHoveredZone(null)}
                      />
                      <text x={coordAway.x} y={coordAway.y + 1.2} fill="#38bdf8" fontSize="2.8" fontWeight="bold" textAnchor="middle" opacity="0.5">
                        Z{zone}
                      </text>

                      {/* Home Zone Target */}
                      <circle
                        cx={coordHome.x}
                        cy={coordHome.y}
                        r="6"
                        fill="#f97316"
                        fillOpacity={hoveredZone?.zone === zone && hoveredZone?.team === 'home' ? 0.35 : 0.08}
                        stroke="#f97316"
                        strokeWidth="0.4"
                        className="cursor-pointer transition-all"
                        onClick={() => handleZoneClick(zone, 'home')}
                        onMouseEnter={() => setHoveredZone({ zone, team: 'home' })}
                        onMouseLeave={() => setHoveredZone(null)}
                      />
                      <text x={coordHome.x} y={coordHome.y + 1.2} fill="#fb923c" fontSize="2.8" fontWeight="bold" textAnchor="middle" opacity="0.5">
                        Z{zone}
                      </text>
                    </g>
                  );
                })}

                {/* === INTERACTIVE PLAYER CARDS ON COURT: AWAY TEAM (TOP) === */}
                {[1, 2, 3, 4, 5, 6].map((zone) => {
                  const data = getCourtPlayer('away', zone);
                  if (!data) return null;
                  const coord = ZONE_COORDS_AWAY[zone];
                  const player = data.player;
                  const pNum = data.number;
                  const isSelected = selectedPlayerForProfile?.id === player?.id;

                  return (
                    <g
                      key={`away_player_on_court_${zone}`}
                      className="cursor-pointer group"
                      onClick={() => {
                        if (player) setSelectedPlayerForProfile(player);
                      }}
                    >
                      {/* Outer Card Glow on selection */}
                      {isSelected && (
                        <rect
                          x={coord.x - 7.5}
                          y={coord.y - 6.5}
                          width="15"
                          height="12"
                          rx="3"
                          fill="#a855f7"
                          fillOpacity="0.4"
                          stroke="#c084fc"
                          strokeWidth="0.8"
                        />
                      )}

                      {/* Player Box */}
                      <rect
                        x={coord.x - 7}
                        y={coord.y - 6}
                        width="14"
                        height="10.5"
                        rx="2"
                        fill="#083344"
                        stroke={isSelected ? '#38bdf8' : '#06b6d4'}
                        strokeWidth={isSelected ? '0.9' : '0.6'}
                      />

                      {/* Number Badge */}
                      <circle cx={coord.x - 4} cy={coord.y - 1.5} r="2.4" fill="#06b6d4" />
                      <text x={coord.x - 4} y={coord.y - 0.7} fill="#082f49" fontSize="2.2" fontWeight="900" textAnchor="middle">
                        {pNum}
                      </text>

                      {/* Position Tag */}
                      <text x={coord.x + 2} y={coord.y - 3} fill="#7dd3fc" fontSize="1.8" fontWeight="bold" textAnchor="middle">
                        {player?.position || 'JUG'}
                      </text>

                      {/* Name preview */}
                      <text x={coord.x + 2} y={coord.y - 0.5} fill="#ffffff" fontSize="2.1" fontWeight="bold" textAnchor="middle">
                        {player?.name ? player.name.split(' ')[0].slice(0, 6) : `#${pNum}`}
                      </text>

                      {/* Height / Reach micro label */}
                      <text x={coord.x} y={coord.y + 3.2} fill="#94a3b8" fontSize="1.6" textAnchor="middle">
                        {player?.spikeReachCm ? `↑${player.spikeReachCm}cm` : `Z${zone}`}
                      </text>
                    </g>
                  );
                })}

                {/* === INTERACTIVE PLAYER CARDS ON COURT: HOME TEAM (BOTTOM) === */}
                {[1, 2, 3, 4, 5, 6].map((zone) => {
                  const data = getCourtPlayer('home', zone);
                  if (!data) return null;
                  const coord = ZONE_COORDS_HOME[zone];
                  const player = data.player;
                  const pNum = data.number;
                  const isSelected = selectedPlayerForProfile?.id === player?.id;

                  return (
                    <g
                      key={`home_player_on_court_${zone}`}
                      className="cursor-pointer group"
                      onClick={() => {
                        if (player) setSelectedPlayerForProfile(player);
                      }}
                    >
                      {/* Outer Card Glow on selection */}
                      {isSelected && (
                        <rect
                          x={coord.x - 7.5}
                          y={coord.y - 6.5}
                          width="15"
                          height="12"
                          rx="3"
                          fill="#a855f7"
                          fillOpacity="0.4"
                          stroke="#c084fc"
                          strokeWidth="0.8"
                        />
                      )}

                      {/* Player Box */}
                      <rect
                        x={coord.x - 7}
                        y={coord.y - 6}
                        width="14"
                        height="10.5"
                        rx="2"
                        fill="#431407"
                        stroke={isSelected ? '#fb923c' : '#ea580c'}
                        strokeWidth={isSelected ? '0.9' : '0.6'}
                      />

                      {/* Number Badge */}
                      <circle cx={coord.x - 4} cy={coord.y - 1.5} r="2.4" fill="#f97316" />
                      <text x={coord.x - 4} y={coord.y - 0.7} fill="#431407" fontSize="2.2" fontWeight="900" textAnchor="middle">
                        {pNum}
                      </text>

                      {/* Position Tag */}
                      <text x={coord.x + 2} y={coord.y - 3} fill="#fdba74" fontSize="1.8" fontWeight="bold" textAnchor="middle">
                        {player?.position || 'JUG'}
                      </text>

                      {/* Name preview */}
                      <text x={coord.x + 2} y={coord.y - 0.5} fill="#ffffff" fontSize="2.1" fontWeight="bold" textAnchor="middle">
                        {player?.name ? player.name.split(' ')[0].slice(0, 6) : `#${pNum}`}
                      </text>

                      {/* Height / Reach micro label */}
                      <text x={coord.x} y={coord.y + 3.2} fill="#94a3b8" fontSize="1.6" textAnchor="middle">
                        {player?.spikeReachCm ? `↑${player.spikeReachCm}cm` : `Z${zone}`}
                      </text>
                    </g>
                  );
                })}

                {/* Trajectory lines for recent actions */}
                {match.actions.map((act) => {
                  if (!act.startZone || !act.endZone) return null;
                  const isSelected = act.id === selectedActionId;
                  const isHome = act.team === 'home';
                  const startCoord = isHome ? ZONE_COORDS_HOME[act.startZone] : ZONE_COORDS_AWAY[act.startZone];
                  const endCoord = isHome ? ZONE_COORDS_AWAY[act.endZone] : ZONE_COORDS_HOME[act.endZone];

                  if (!startCoord || !endCoord) return null;

                  let strokeColor = act.evaluation === '#' ? '#22c55e' : act.evaluation === '=' ? '#ef4444' : '#eab308';
                  if (isSelected) strokeColor = '#c084fc';

                  return (
                    <g key={`trj_line_${act.id}`} onClick={() => onSelectAction(act.id)} className="cursor-pointer">
                      <line
                        x1={startCoord.x}
                        y1={startCoord.y}
                        x2={endCoord.x}
                        y2={endCoord.y}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 1.6 : 0.9}
                        strokeDasharray={act.evaluation === '=' ? '1 1' : undefined}
                      />
                      <circle cx={endCoord.x} cy={endCoord.y} r={isSelected ? 2.2 : 1.3} fill={strokeColor} />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Court Actions & Substitution Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Convención de colores:</span>
                <span className="text-emerald-400 font-semibold">● Punto (#)</span>
                <span className="text-amber-400 font-semibold">● Continuidad (+)</span>
                <span className="text-rose-400 font-semibold">● Error (=)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSidePanel('home')}
                  className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> Banco Local
                </button>
                <button
                  onClick={() => setActiveSidePanel('away')}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> Banco Rival
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT: TACTICAL COMMAND CONSOLE / ROSTER DRAWER / SELECTED PLAYER PROFILE */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* Multi-Tab Selector for Right Panel */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSidePanel('console')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                activeSidePanel === 'console'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" /> Consola Scout
            </button>
            <button
              onClick={() => setActiveSidePanel('home')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                activeSidePanel === 'home'
                  ? 'bg-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Plantel Local ({match.homePlayers.length})
            </button>
            <button
              onClick={() => setActiveSidePanel('away')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                activeSidePanel === 'away'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Plantel Rival ({match.awayPlayers.length})
            </button>
          </div>

          {/* 1. SELECTED PLAYER PROFILE INSPECTOR CARD (Floats whenever a player is clicked) */}
          {selectedPlayerForProfile && (
            <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center font-mono shadow-md">
                    #{selectedPlayerForProfile.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">{selectedPlayerForProfile.name}</h4>
                      {getPositionBadge(selectedPlayerForProfile.position)}
                    </div>
                    <span className="text-xs text-slate-400">
                      Equipo: <strong className="text-purple-300">{selectedPlayerForProfile.team === 'home' ? match.homeTeamName : match.awayTeamName}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditPlayer(selectedPlayerForProfile)}
                    className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition text-xs font-bold flex items-center gap-1"
                    title="Editar ficha completa"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedPlayerForProfile(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Physical Measurements Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Estatura</span>
                  <span className="font-bold text-white font-mono">{selectedPlayerForProfile.heightCm ? `${selectedPlayerForProfile.heightCm} cm` : '-'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Peso</span>
                  <span className="font-bold text-white font-mono">{selectedPlayerForProfile.weightKg ? `${selectedPlayerForProfile.weightKg} kg` : '-'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Salto Ataque</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedPlayerForProfile.spikeReachCm ? `${selectedPlayerForProfile.spikeReachCm} cm` : '-'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Salto Bloqueo</span>
                  <span className="font-bold text-sky-400 font-mono">{selectedPlayerForProfile.blockReachCm ? `${selectedPlayerForProfile.blockReachCm} cm` : '-'}</span>
                </div>
              </div>

              {/* Technical / Kinesiology mini notes */}
              <div className="space-y-2 text-xs">
                {selectedPlayerForProfile.hittingStyle && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                    <span className="font-bold text-amber-400 block text-[11px]">Técnica de Golpeo:</span>
                    {selectedPlayerForProfile.hittingStyle}
                  </div>
                )}
                {selectedPlayerForProfile.kinesiologyNotes && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                    <span className="font-bold text-rose-400 block text-[11px]">Kinesiología & Lesiones:</span>
                    {selectedPlayerForProfile.kinesiologyNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. TAB: LIVE SCOUTING CODE CONSOLE */}
          {activeSidePanel === 'console' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                  <Keyboard className="w-4 h-4" /> Consola de Códigos en Vivo
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">*14AH#21 | A05SM=91</span>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendCode} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="ej: a14sq.4#17 o *14AH#21 o 14s.4="
                    className="w-full bg-slate-950 text-amber-400 placeholder-slate-600 font-mono text-base px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition text-xs shrink-0 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Send className="w-4 h-4" /> Registrar
                  </button>
                </div>

                {/* Parsed Action(s) Preview Badge */}
                {parsedPreviews.length > 0 ? (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl space-y-1.5 text-xs shadow-md">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {parsedPreviews.length > 1 ? 'Acción Encadenada (2 jugadas en 1 paso)' : 'Acción Identificada'}
                      </span>
                      <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                        {inputCode.toUpperCase()}
                      </span>
                    </div>

                    {parsedPreviews.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 font-mono text-emerald-200 text-xs bg-slate-950/60 p-2 rounded-xl border border-emerald-500/20">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{p.description}</span>
                      </div>
                    ))}

                    {parsedPreviews.length > 1 && (
                      <p className="text-[10px] text-emerald-300/80 italic pt-0.5">
                        ⚡ Evaluación recíproca automática: la calidad de la recepción/defensa determinó el valor del saque/ataque.
                      </p>
                    )}
                  </div>
                ) : inputCode.length > 0 ? (
                  <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Código en curso... (ej: a14sq.4#17, *03s.10#, 09at.14#)
                  </div>
                ) : (
                  /* Live Scouting Code Shortcut Guide */
                  <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-[11px] text-slate-400 space-y-1.5">
                    <div className="font-bold text-amber-400 flex items-center justify-between text-[10px] uppercase tracking-wider">
                      <span>💡 Sintaxis Acelerada de Saque / Recepción:</span>
                      <span className="text-slate-500 font-mono">Separador punto (.)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => setInputCode('a14sq.4#17')}
                        className="bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg text-left text-slate-300 border border-slate-800 transition cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-amber-300 font-bold">a14sq.4#17</span>
                        <span className="text-[9px] text-slate-500">Saque + Rec. (#)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputCode('14sq.4=')}
                        className="bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg text-left text-slate-300 border border-slate-800 transition cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-emerald-300 font-bold">14sq.4=</span>
                        <span className="text-[9px] text-slate-500">Saque Ace (#)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputCode('*09at.10=')}
                        className="bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg text-left text-slate-300 border border-slate-800 transition cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-sky-300 font-bold">*09at.10=</span>
                        <span className="text-[9px] text-slate-500">Ataque Punto (#)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputCode('*09at.14b#')}
                        className="bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg text-left text-slate-300 border border-slate-800 transition cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-purple-300 font-bold">*09at.14b#</span>
                        <span className="text-[9px] text-slate-500">Bloqueo Punto (#)</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>

              {/* Quick Action Builder Strip */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Constructor Táctico Rápido
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-500 block text-[10px] mb-0.5">Equipo</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value as TeamSide)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      <option value="home">Local (*)</option>
                      <option value="away">Rival (A)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block text-[10px] mb-0.5">Jugador</label>
                    <select
                      value={selectedPlayerNum}
                      onChange={(e) => setSelectedPlayerNum(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs font-mono"
                    >
                      {(selectedTeam === 'home' ? match.homePlayers : match.awayPlayers).map((p) => (
                        <option key={p.id} value={p.number}>
                          #{p.number} {p.name.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block text-[10px] mb-0.5">Fundamento</label>
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value as VolleySkill)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      <option value="A">Ataque (A)</option>
                      <option value="S">Saque (S)</option>
                      <option value="R">Recepción (R)</option>
                      <option value="B">Bloqueo (B)</option>
                      <option value="D">Defensa (D)</option>
                      <option value="E">Pase (E)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block text-[10px] mb-0.5">Resultado</label>
                    <select
                      value={selectedEval}
                      onChange={(e) => setSelectedEval(e.target.value as EvaluationSymbol)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs font-mono"
                    >
                      <option value="#">Punto (#)</option>
                      <option value="+">Positivo (+)</option>
                      <option value="!">Neutro (!)</option>
                      <option value="-">Negativo (-)</option>
                      <option value="=">Error (=)</option>
                      <option value="/">Bloqueado (/)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block text-[10px] mb-0.5">Desde Z.</label>
                    <select
                      value={selectedStartZone}
                      onChange={(e) => setSelectedStartZone(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => (
                        <option key={z} value={z}>
                          Z{z}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block text-[10px] mb-0.5">Hacia Z.</label>
                    <select
                      value={selectedEndZone}
                      onChange={(e) => setSelectedEndZone(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => (
                        <option key={z} value={z}>
                          Z{z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={handleQuickAdd}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Jugada
                  </button>
                </div>
              </div>

              {/* Feed of Recent Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Feed de Jugadas ({match.actions.length})</span>
                  <span>Últimas acciones</span>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  {match.actions.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      Sin jugadas scouteadas en este set.
                    </div>
                  ) : (
                    [...match.actions].reverse().map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              act.team === 'home' ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'
                            }`}
                          >
                            {act.rawCode}
                          </span>
                          <span className="text-slate-200 truncate">{act.description}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              act.evaluation === '#'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : act.evaluation === '='
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {act.evaluation}
                          </span>
                          <button
                            onClick={() => onDeleteAction(act.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                            title="Eliminar jugada"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. TAB: ROSTER VIEW (HOME OR AWAY) */}
          {(activeSidePanel === 'home' || activeSidePanel === 'away') && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Plantel de {activeSidePanel === 'home' ? match.homeTeamName : match.awayTeamName}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Haz clic en una jugadora para ver ficha o editarla.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAddPlayer(activeSidePanel)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>

              {/* Players List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {(activeSidePanel === 'home' ? match.homePlayers : match.awayPlayers).map((player) => {
                  const isStarter = (activeSidePanel === 'home' ? match.homeRotation : match.awayRotation).includes(player.number);
                  const isSelected = selectedPlayerForProfile?.id === player.id;

                  return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayerForProfile(player)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-emerald-400 text-xs font-mono shrink-0">
                          #{player.number}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">{player.name}</span>
                            {isStarter && (
                              <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1 py-0.2 rounded border border-amber-500/30 shrink-0">
                                EN CANCHA
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getPositionBadge(player.position)}
                            {player.spikeReachCm && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Salto: {player.spikeReachCm}cm
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditPlayer(player);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
                          title="Editar ficha"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlayer(player.id, activeSidePanel);
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg transition"
                          title="Eliminar jugadora"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. MODAL FOR ADDING / EDITING PLAYER EXPEDIENT */}
      {isEditingPlayerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {playerFormData.name ? `Editar a ${playerFormData.name}` : 'Nueva Jugadora / Atleta'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Equipo: <strong className="text-white">{editingPlayerTeam === 'home' ? match.homeTeamName : match.awayTeamName}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsEditingPlayerModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayerForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-3">
                  <label className="text-slate-300 font-bold block mb-1">Dorsal #</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={99}
                    value={playerFormData.number || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, number: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-6">
                  <label className="text-slate-300 font-bold block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Gabriela Guimarães"
                    value={playerFormData.name || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-3">
                  <label className="text-slate-300 font-bold block mb-1">Posición</label>
                  <select
                    value={playerFormData.position || 'OH'}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, position: e.target.value as Player['position'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="OH">OH - Punta</option>
                    <option value="MB">MB - Central</option>
                    <option value="OPP">OPP - Opuesto</option>
                    <option value="S">S - Armador</option>
                    <option value="L">L - Líbero</option>
                  </select>
                </div>
              </div>

              {/* Physical measurements */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">Altura (cm)</label>
                  <input
                    type="number"
                    placeholder="185"
                    value={playerFormData.heightCm || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, heightCm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">Peso (kg)</label>
                  <input
                    type="number"
                    placeholder="78"
                    value={playerFormData.weightKg || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, weightKg: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">Salto Ataque</label>
                  <input
                    type="number"
                    placeholder="320"
                    value={playerFormData.spikeReachCm || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, spikeReachCm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">Salto Bloqueo</label>
                  <input
                    type="number"
                    placeholder="300"
                    value={playerFormData.blockReachCm || ''}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, blockReachCm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-1.5 text-white font-mono"
                  />
                </div>
              </div>

              {/* Hitting Technique */}
              <div>
                <label className="text-amber-400 font-bold block mb-1">Técnica de Golpeo & Preferencias</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Ataque explosivo diagonal larga, saque flotante táctico a Zona 1..."
                  value={playerFormData.hittingStyle || ''}
                  onChange={(e) => setPlayerFormData({ ...playerFormData, hittingStyle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Kinesiology */}
              <div>
                <label className="text-rose-400 font-bold block mb-1">Kinesiología & Lesiones</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Vendaje preventivo en tobillo, sobrecarga en hombro..."
                  value={playerFormData.kinesiologyNotes || ''}
                  onChange={(e) => setPlayerFormData({ ...playerFormData, kinesiologyNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingPlayerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" /> Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
};
