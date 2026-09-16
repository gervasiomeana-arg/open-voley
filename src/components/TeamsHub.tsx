import React, { useState } from 'react';
import { SavedTeam, saveTeam, deleteSavedTeam, parseRosterFromText } from '../services/teamStorage';
import { Player, TeamSide } from '../types';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Plus, 
  Save, 
  Edit3, 
  Check, 
  FileText, 
  ChevronRight,
  ClipboardPaste,
  HelpCircle,
  ArrowRight,
  Volleyball
} from 'lucide-react';

interface TeamsHubProps {
  teams: SavedTeam[];
  onTeamsUpdated: (teams: SavedTeam[]) => void;
  onSelectForMatch?: (team: SavedTeam, side: TeamSide) => void;
  onOpenPlayer360?: (player: Player) => void;
}

export const TeamsHub: React.FC<TeamsHubProps> = ({
  teams = [],
  onTeamsUpdated,
  onSelectForMatch,
  onOpenPlayer360,
}) => {
  const safeTeams = teams || [];
  const [activeTab, setActiveTab] = useState<'my_team' | 'opponent'>('my_team');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => {
    const first = safeTeams.find((t) => t.type === 'my_team');
    return first ? first.id : safeTeams[0]?.id || '';
  });

  // Create team state
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCategory, setNewTeamCategory] = useState('Primera División');
  const [newTeamGender, setNewTeamGender] = useState<'Femenino' | 'Masculino' | 'Mixto'>('Femenino');
  const [newTeamType, setNewTeamType] = useState<'my_team' | 'opponent'>('my_team');

  // Edit team metadata
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingCategory, setEditingCategory] = useState('');

  // Add / Edit Player state
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerNumber, setPlayerNumber] = useState<number>(1);
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState<Player['position']>('OH');
  const [playerStarter, setPlayerStarter] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Quick Paste Roster Modal
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const currentTeam = safeTeams.find((t) => t.id === selectedTeamId) || safeTeams.find((t) => t.type === activeTab) || safeTeams[0];
  const filteredTeams = safeTeams.filter((t) => t.type === activeTab);

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newTeam: SavedTeam = {
      id: `team_${Date.now()}`,
      name: newTeamName.trim(),
      shortName: newTeamName.trim().substring(0, 8),
      category: newTeamCategory,
      gender: newTeamGender,
      type: newTeamType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      players: [
        { id: `p_${Date.now()}_1`, number: 1, name: 'Armador/a 1', position: 'S', team: newTeamType === 'my_team' ? 'home' : 'away', starter: true },
        { id: `p_${Date.now()}_2`, number: 3, name: 'Punta 1', position: 'OH', team: newTeamType === 'my_team' ? 'home' : 'away', starter: true },
        { id: `p_${Date.now()}_3`, number: 5, name: 'Central 1', position: 'MB', team: newTeamType === 'my_team' ? 'home' : 'away', starter: true },
        { id: `p_${Date.now()}_4`, number: 7, name: 'Opuesto/a', position: 'OPP', team: newTeamType === 'my_team' ? 'home' : 'away', starter: true },
        { id: `p_${Date.now()}_5`, number: 9, name: 'Punta 2', position: 'OH', team: newTeamType === 'my_team' ? 'home' : 'away', starter: true },
        { id: `p_${Date.now()}_6`, number: 11, name: 'Central 2', position: 'MB', team: newTeamType === 'my_team' ? 'home' : 'away', starter: true },
        { id: `p_${Date.now()}_7`, number: 4, name: 'Líbero', position: 'L', team: newTeamType === 'my_team' ? 'home' : 'away', starter: true },
      ],
    };

    const updated = saveTeam(newTeam);
    onTeamsUpdated(updated);
    setSelectedTeamId(newTeam.id);
    setActiveTab(newTeam.type);
    setIsCreatingTeam(false);
    setNewTeamName('');
  };

  const handleDeleteTeam = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el equipo "${name}" y todos sus jugadores?`)) {
      const updated = deleteSavedTeam(id);
      onTeamsUpdated(updated);
      if (selectedTeamId === id) {
        const remaining = updated.filter((t) => t.type === activeTab);
        setSelectedTeamId(remaining[0]?.id || updated[0]?.id || '');
      }
    }
  };

  const handleSaveTeamMetadata = () => {
    if (!currentTeam || !editingName.trim()) return;
    const updatedTeam: SavedTeam = {
      ...currentTeam,
      name: editingName.trim(),
      category: editingCategory.trim() || currentTeam.category,
      updatedAt: new Date().toISOString(),
    };
    const updated = saveTeam(updatedTeam);
    onTeamsUpdated(updated);
    setIsEditingTeamName(false);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !playerName.trim()) return;

    let updatedPlayers: Player[];
    if (editingPlayerId) {
      updatedPlayers = (currentTeam.players || []).map((p) =>
        p.id === editingPlayerId
          ? { ...p, number: playerNumber, name: playerName.trim(), position: playerPosition, starter: playerStarter }
          : p
      );
    } else {
      const newPlayer: Player = {
        id: `p_${Date.now()}`,
        number: playerNumber,
        name: playerName.trim(),
        position: playerPosition,
        team: currentTeam.type === 'my_team' ? 'home' : 'away',
        starter: playerStarter,
      };
      updatedPlayers = [...(currentTeam.players || []), newPlayer];
    }

    const updatedTeam: SavedTeam = {
      ...currentTeam,
      players: updatedPlayers,
      updatedAt: new Date().toISOString(),
    };

    const updated = saveTeam(updatedTeam);
    onTeamsUpdated(updated);
    setIsPlayerModalOpen(false);
    setEditingPlayerId(null);
    setPlayerName('');
  };

  const handleDeletePlayer = (playerId: string) => {
    if (!currentTeam) return;
    const updatedPlayers = (currentTeam.players || []).filter((p) => p.id !== playerId);
    const updatedTeam: SavedTeam = {
      ...currentTeam,
      players: updatedPlayers,
      updatedAt: new Date().toISOString(),
    };
    const updated = saveTeam(updatedTeam);
    onTeamsUpdated(updated);
  };

  const handleQuickPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !pasteText.trim()) return;

    const parsedPlayers = parseRosterFromText(pasteText, currentTeam.type === 'my_team' ? 'home' : 'away');
    if (parsedPlayers.length === 0) {
      alert('No se detectaron jugadores válidos. Ingrese el número y el nombre en cada línea (Ej: 1 Juan Perez Armador)');
      return;
    }

    const updatedTeam: SavedTeam = {
      ...currentTeam,
      players: parsedPlayers,
      updatedAt: new Date().toISOString(),
    };

    const updated = saveTeam(updatedTeam);
    onTeamsUpdated(updated);
    setIsQuickPasteOpen(false);
    setPasteText('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Gestión de Equipos & Planteles</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Administra tus equipos propios, clubes rivales y listas completas de jugadores
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setNewTeamType(activeTab);
            setIsCreatingTeam(true);
          }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Equipo</span>
        </button>
      </div>

      {/* Main Grid: Left List + Right Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: TEAM SELECTOR (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Tabs: Mis Equipos vs Rivales */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('my_team');
                const first = safeTeams.find((t) => t.type === 'my_team');
                if (first) setSelectedTeamId(first.id);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'my_team'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Mis Equipos ({safeTeams.filter((t) => t.type === 'my_team').length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('opponent');
                const first = safeTeams.find((t) => t.type === 'opponent');
                if (first) setSelectedTeamId(first.id);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                activeTab === 'opponent'
                  ? 'bg-orange-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Rivales ({safeTeams.filter((t) => t.type === 'opponent').length})</span>
            </button>
          </div>

          {/* List of Teams in Active Tab */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => {
                const isSelected = team.id === (currentTeam?.id || selectedTeamId);
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? activeTab === 'my_team'
                          ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md ring-1 ring-cyan-400/30'
                          : 'bg-orange-950/40 border-orange-500/50 shadow-md ring-1 ring-orange-400/30'
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        activeTab === 'my_team' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {team.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{team.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {team.category} • {team.players?.length || 0} jugadores
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isSelected ? 'text-white' : 'text-slate-500'
                    }`} />
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-3">
                <Users className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs">No hay equipos registrados en esta categoría.</p>
                <button
                  onClick={() => {
                    setNewTeamType(activeTab);
                    setIsCreatingTeam(true);
                  }}
                  className="text-xs text-amber-400 font-bold hover:underline"
                >
                  + Crear primer equipo
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: TEAM DETAILS & PLAYERS (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          {currentTeam ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl">
              
              {/* Team Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="space-y-1">
                  {isEditingTeamName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-slate-800 border border-amber-500 text-white font-bold text-lg px-3 py-1.5 rounded-xl outline-none"
                      />
                      <input
                        type="text"
                        value={editingCategory}
                        placeholder="Categoría"
                        onChange={(e) => setEditingCategory(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-xl outline-none"
                      />
                      <button
                        onClick={handleSaveTeamMetadata}
                        className="p-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-white">{currentTeam.name}</h3>
                      <button
                        onClick={() => {
                          setEditingName(currentTeam.name);
                          setEditingCategory(currentTeam.category);
                          setIsEditingTeamName(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-400 transition"
                        title="Editar nombre y categoría"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      {currentTeam.category}
                    </span>
                    <span>•</span>
                    <span>{currentTeam.gender}</span>
                    <span>•</span>
                    <span>{currentTeam.players?.length || 0} jugadores en plantilla</span>
                  </div>
                </div>

                {/* Team Controls & Match loading */}
                <div className="flex flex-wrap items-center gap-2">
                  {onSelectForMatch && (
                    <>
                      <button
                        onClick={() => onSelectForMatch(currentTeam, 'home')}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        title="Cargar como Equipo Local en el Partido Activo"
                      >
                        <Volleyball className="w-3.5 h-3.5" />
                        <span>Usar como Local</span>
                      </button>

                      <button
                        onClick={() => onSelectForMatch(currentTeam, 'away')}
                        className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        title="Cargar como Equipo Visitante en el Partido Activo"
                      >
                        <Volleyball className="w-3.5 h-3.5" />
                        <span>Usar como Visitante</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDeleteTeam(currentTeam.id, currentTeam.name)}
                    className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition"
                    title="Eliminar este equipo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Player Management Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>Plantel de Jugadores</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-mono">
                        {currentTeam.players?.length || 0}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Configura las camisetas, posiciones y titulares del equipo
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsQuickPasteOpen(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                      title="Pegar lista de jugadores desde Excel, WhatsApp o texto"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pegar Roster</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingPlayerId(null);
                        setPlayerNumber(
                          Math.max(0, ...(currentTeam.players || []).map((p) => p.number)) + 1 || 1
                        );
                        setPlayerName('');
                        setPlayerPosition('OH');
                        setPlayerStarter(false);
                        setIsPlayerModalOpen(true);
                      }}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Agregar Jugador</span>
                    </button>
                  </div>
                </div>

                {/* Players Table */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3 text-center w-16">N°</th>
                          <th className="p-3">Nombre</th>
                          <th className="p-3 text-center">Posición</th>
                          <th className="p-3 text-center">Rol</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(currentTeam.players || []).map((player) => (
                          <tr key={player.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 text-amber-400 font-mono font-black border border-slate-700">
                                {player.number}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-white">
                              {player.name}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                                player.position === 'S'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : player.position === 'L'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : player.position === 'MB'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : player.position === 'OPP'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {player.position}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {player.starter ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                  ★ Titular
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Suplente
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1">
                              {onOpenPlayer360 && (
                                <button
                                  onClick={() => onOpenPlayer360(player)}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-lg text-[10px] font-black transition border border-amber-500/20"
                                  title="Ver ficha 360° completa del jugador"
                                >
                                  360°
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingPlayerId(player.id);
                                  setPlayerNumber(player.number);
                                  setPlayerName(player.name);
                                  setPlayerPosition(player.position);
                                  setPlayerStarter(!!player.starter);
                                  setIsPlayerModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                                title="Editar jugador"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                                title="Eliminar jugador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-4">
              <Users className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
              <div className="text-sm font-bold text-slate-400">Selecciona o crea un equipo para comenzar</div>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREAR EQUIPO                                                       */}
      {/* ========================================================================= */}
      {isCreatingTeam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-white">Crear Nuevo Equipo</h3>
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Equipo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Club Ciudad de Bolívar"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                  <select
                    value={newTeamType}
                    onChange={(e) => setNewTeamType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none"
                  >
                    <option value="my_team">Mi Equipo</option>
                    <option value="opponent">Rival</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Género</label>
                  <select
                    value={newTeamGender}
                    onChange={(e) => setNewTeamGender(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none"
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoría</label>
                <input
                  type="text"
                  value={newTeamCategory}
                  onChange={(e) => setNewTeamCategory(e.target.value)}
                  placeholder="Ej: Sub 18 / Liga A1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTeam(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR / EDITAR JUGADOR                                           */}
      {/* ========================================================================= */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-white">
              {editingPlayerId ? 'Editar Jugador' : 'Agregar Jugador'}
            </h3>
            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Camiseta N°</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-base font-black text-amber-400 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Posición</label>
                  <select
                    value={playerPosition}
                    onChange={(e) => setPlayerPosition(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold outline-none"
                  >
                    <option value="S">Armador/a (S)</option>
                    <option value="OH">Punta Receptor (OH)</option>
                    <option value="MB">Central (MB)</option>
                    <option value="OPP">Opuesto/a (OPP)</option>
                    <option value="L">Líbero (L)</option>
                    <option value="DS">Defensa / Zaguero (DS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Luciano De Cecco"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="starterCheck"
                  checked={playerStarter}
                  onChange={(e) => setPlayerStarter(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="starterCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Marcar como jugador titular (6 inicial)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK PASTE ROSTER                                                 */}
      {/* ========================================================================= */}
      {isQuickPasteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-cyan-400" />
                <span>Pegar Lista de Jugadores</span>
              </h3>
              <button
                onClick={() => setIsQuickPasteOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pega la lista copiada de Excel o WhatsApp con el formato: <code>N° Nombre Posición</code> (una línea por jugador).
            </p>

            <form onSubmit={handleQuickPasteSubmit} className="space-y-4">
              <textarea
                rows={8}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`1 Luciano De Cecco S\n7 Facundo Conte OH\n11 Sebastián Solé MB\n12 Bruno Lima OPP\n17 Jan Martínez OH\n8 Agustín Loser MB\n9 Santiago Danani L`}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-white font-mono outline-none focus:border-amber-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickPasteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md"
                >
                  Procesar y Cargar Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
