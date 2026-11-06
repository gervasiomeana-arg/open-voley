import React, { useState } from 'react';
import { SavedTeam, saveTeam, deleteSavedTeam, parseRosterFromText } from '../services/teamStorage';
import { Player } from '../types';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Plus, 
  X, 
  Save, 
  Edit3, 
  Check, 
  FileText, 
  Sparkles, 
  ChevronRight,
  ClipboardPaste,
  HelpCircle
} from 'lucide-react';

interface TeamsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams?: SavedTeam[];
  onTeamsUpdated: (teams: SavedTeam[]) => void;
  onSelectForMatch?: (team: SavedTeam, side: 'home' | 'away') => void;
}

export const TeamsManagerModal: React.FC<TeamsManagerModalProps> = ({
  isOpen,
  onClose,
  teams = [],
  onTeamsUpdated,
  onSelectForMatch,
}) => {
  const safeTeams = teams || [];
  const [activeTab, setActiveTab] = useState<'my_team' | 'opponent'>('my_team');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => {
    const first = safeTeams.find((t) => t.type === 'my_team');
    return first ? first.id : safeTeams[0]?.id || '';
  });

  // Create team modal state
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

  if (!isOpen) return null;

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

  const handleDeleteTeam = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este equipo de tu biblioteca?')) {
      const updated = deleteSavedTeam(id);
      onTeamsUpdated(updated);
      const remaining = updated.filter((t) => t.type === activeTab);
      if (remaining.length > 0) {
        setSelectedTeamId(remaining[0].id);
      } else if (updated.length > 0) {
        setSelectedTeamId(updated[0].id);
      }
    }
  };

  const handleOpenAddPlayer = () => {
    if (!currentTeam) return;
    const maxNum = currentTeam.players.length ? Math.max(...currentTeam.players.map((p) => p.number)) + 1 : 1;
    setPlayerNumber(maxNum);
    setPlayerName('');
    setPlayerPosition('OH');
    setPlayerStarter(currentTeam.players.length < 6);
    setEditingPlayerId(null);
    setIsPlayerModalOpen(true);
  };

  const handleOpenEditPlayer = (p: Player) => {
    setPlayerNumber(p.number);
    setPlayerName(p.name);
    setPlayerPosition(p.position);
    setPlayerStarter(!!p.starter);
    setEditingPlayerId(p.id);
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !playerName.trim()) return;

    const teamSide = currentTeam.type === 'my_team' ? 'home' : 'away';

    let updatedPlayers: Player[];
    if (editingPlayerId) {
      updatedPlayers = currentTeam.players.map((p) =>
        p.id === editingPlayerId
          ? { ...p, number: Number(playerNumber), name: playerName.trim(), position: playerPosition, starter: playerStarter }
          : p
      );
    } else {
      const newP: Player = {
        id: `p_${Date.now()}`,
        number: Number(playerNumber),
        name: playerName.trim(),
        position: playerPosition,
        team: teamSide,
        starter: playerStarter,
      };
      updatedPlayers = [...currentTeam.players, newP];
    }

    const updatedTeam = { ...currentTeam, players: updatedPlayers };
    const all = saveTeam(updatedTeam);
    onTeamsUpdated(all);
    setIsPlayerModalOpen(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (!currentTeam) return;
    const updatedPlayers = currentTeam.players.filter((p) => p.id !== playerId);
    const updatedTeam = { ...currentTeam, players: updatedPlayers };
    const all = saveTeam(updatedTeam);
    onTeamsUpdated(all);
  };

  const handleSaveQuickPaste = () => {
    if (!currentTeam || !pasteText.trim()) return;
    const parsed = parseRosterFromText(pasteText, currentTeam.type === 'my_team' ? 'home' : 'away');
    if (parsed.length === 0) {
      alert('No se detectaron nombres ni dorsales en el texto pegado.');
      return;
    }

    const updatedTeam = {
      ...currentTeam,
      players: parsed,
    };
    const all = saveTeam(updatedTeam);
    onTeamsUpdated(all);
    setIsQuickPasteOpen(false);
    setPasteText('');
  };

  const handleSaveTeamMeta = () => {
    if (!currentTeam) return;
    const updatedTeam: SavedTeam = {
      ...currentTeam,
      name: editingName.trim() || currentTeam.name,
      category: editingCategory.trim() || currentTeam.category,
      shortName: (editingName.trim() || currentTeam.name).substring(0, 8),
    };
    const all = saveTeam(updatedTeam);
    onTeamsUpdated(all);
    setIsEditingTeamName(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Biblioteca de Mis Equipos & Rivales
              </h2>
              <p className="text-xs text-slate-400">
                Guarda tus clubes y contrincantes una sola vez. Quedarán listos para seleccionarlos en cualquier partido.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewTeamType(activeTab);
                setIsCreatingTeam(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Equipo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle: Mis Equipos Propios vs Rivales */}
        <div className="px-6 pt-4 pb-2 bg-slate-900/50 flex items-center gap-3 border-b border-slate-800/80">
          <button
            onClick={() => {
              setActiveTab('my_team');
              const first = safeTeams.find((t) => t.type === 'my_team');
              if (first) setSelectedTeamId(first.id);
            }}
            className={`py-2.5 px-4 rounded-xl font-black text-xs flex items-center gap-2 transition ${
              activeTab === 'my_team'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Mis Equipos Propios ({safeTeams.filter((t) => t.type === 'my_team').length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('opponent');
              const first = safeTeams.find((t) => t.type === 'opponent');
              if (first) setSelectedTeamId(first.id);
            }}
            className={`py-2.5 px-4 rounded-xl font-black text-xs flex items-center gap-2 transition ${
              activeTab === 'opponent'
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rivales Guardados ({safeTeams.filter((t) => t.type === 'opponent').length})</span>
          </button>
        </div>

        {/* Main 2-Column Content: Team List & Selected Team Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* Left Column: Team Cards (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-800/80 p-4 space-y-2.5 overflow-y-auto bg-slate-950/40 custom-scrollbar">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              {activeTab === 'my_team' ? 'Selecciona tu Equipo' : 'Selecciona el Rival'}
            </div>

            {filteredTeams.length === 0 ? (
              <div className="p-6 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl">
                <Users className="w-6 h-6 mx-auto opacity-40" />
                <p className="text-xs">No hay equipos creados en esta sección.</p>
                <button
                  onClick={() => {
                    setNewTeamType(activeTab);
                    setIsCreatingTeam(true);
                  }}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  + Crear el primero
                </button>
              </div>
            ) : (
              filteredTeams.map((team) => {
                const isSelected = team.id === currentTeam?.id;
                return (
                  <div
                    key={team.id}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setIsEditingTeamName(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? activeTab === 'my_team'
                          ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-cyan-500/10 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-sm truncate">{team.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          {team.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-bold">
                          {team.players.length} jug.
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? (activeTab === 'my_team' ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-600'}`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Team Details & Roster (8 cols) */}
          <div className="md:col-span-8 p-5 sm:p-6 overflow-y-auto bg-slate-900/60 custom-scrollbar flex flex-col space-y-4">
            {currentTeam ? (
              <>
                {/* Team Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
                  {isEditingTeamName ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Nombre del Club"
                        className="bg-slate-900 border border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-bold w-full"
                      />
                      <input
                        type="text"
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                        placeholder="Categoría (ej: Sub 18)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white w-full sm:w-36"
                      />
                      <button
                        onClick={handleSaveTeamMeta}
                        className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" /> Guardar
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white">{currentTeam.name}</h3>
                        <button
                          onClick={() => {
                            setEditingName(currentTeam.name);
                            setEditingCategory(currentTeam.category);
                            setIsEditingTeamName(true);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Cambiar nombre"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-semibold text-amber-400">{currentTeam.category}</span>
                        <span>•</span>
                        <span>{currentTeam.gender}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-bold">{currentTeam.players.length} jugadores en plantilla</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setPasteText('');
                        setIsQuickPasteOpen(true);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
                      title="Cargar rápidamente pegando una lista de WhatsApp o Excel"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pegar Lista</span>
                    </button>

                    <button
                      onClick={handleOpenAddPlayer}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Agregar Jugador</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTeam(currentTeam.id)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                      title="Eliminar equipo de biblioteca"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Player List Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                    <span>Plantilla de Jugadores ({currentTeam.players.length})</span>
                    <span className="text-[11px] text-slate-500">Pasa el cursor para editar o eliminar</span>
                  </div>

                  {currentTeam.players.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
                      <Users className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-sm">Aún no hay jugadores en este equipo.</p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handleOpenAddPlayer}
                          className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
                        >
                          + Agregar uno a uno
                        </button>
                        <button
                          onClick={() => setIsQuickPasteOpen(true)}
                          className="text-xs bg-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-lg border border-slate-700"
                        >
                          Pegar lista de WhatsApp
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentTeam.players
                        .sort((a, b) => a.number - b.number)
                        .map((player) => (
                          <div
                            key={player.id}
                            className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between gap-3 group transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-xs font-mono shrink-0">
                                #{player.number}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                                  <span>{player.name}</span>
                                  {player.starter && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1 rounded border border-amber-500/30">
                                      TITULAR
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {player.position === 'S' && 'Armador (S)'}
                                  {player.position === 'OH' && 'Punta (OH)'}
                                  {player.position === 'MB' && 'Central (MB)'}
                                  {player.position === 'OPP' && 'Opuesto (OPP)'}
                                  {player.position === 'L' && 'Líbero (L)'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleOpenEditPlayer(player)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                title="Editar jugador"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Selecciona un equipo de la izquierda o crea uno nuevo.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Todos los cambios se guardan automáticamente en tu navegador y tu cuenta.</span>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Listo / Volver
          </button>
        </div>
      </div>

      {/* CREATE TEAM DIALOG */}
      {isCreatingTeam && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">
                {newTeamType === 'my_team' ? 'Crear Mi Equipo Propio' : 'Crear Equipo Rival'}
              </h3>
              <button onClick={() => setIsCreatingTeam(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Club o Equipo *</label>
                <input
                  type="text"
                  placeholder="Ej: Club Ciudad de Campana"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:border-amber-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={newTeamCategory}
                    onChange={(e) => setNewTeamCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Primera División">Primera División</option>
                    <option value="Sub 21">Sub 21</option>
                    <option value="Sub 18">Sub 18</option>
                    <option value="Sub 16">Sub 16</option>
                    <option value="Sub 14">Sub 14</option>
                    <option value="Maxivoley">Maxivoley</option>
                    <option value="Libre">Libre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Rama / Género</label>
                  <select
                    value={newTeamGender}
                    onChange={(e) => setNewTeamGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Equipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTeamType('my_team')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      newTeamType === 'my_team'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🛡️ Mi Equipo Propio
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTeamType('opponent')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      newTeamType === 'opponent'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    👥 Rival
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTeam(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Crear Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PASTE ROSTER MODAL */}
      {isQuickPasteOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-lg text-white">Carga Rápida de Plantilla</h3>
              </div>
              <button onClick={() => setIsQuickPasteOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pega aquí el texto que tengas en WhatsApp, Excel o notas. El sistema extraerá automáticamente el número y el nombre de cada jugador:
            </p>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono space-y-0.5">
              <div>Ejemplo aceptado:</div>
              <div className="text-amber-400">1 Camila Rodriguez (Armadora)</div>
              <div className="text-amber-400">7 Lucia Fernandez Punta</div>
              <div className="text-amber-400">11 Valentina Gomez Central</div>
              <div className="text-amber-400">4 Catalina Sosa Libero</div>
            </div>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Pega tu lista aquí..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsQuickPasteOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuickPaste}
                disabled={!pasteText.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
              >
                Generar Plantel Automático
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PLAYER MODAL */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white">
                {editingPlayerId ? 'Editar Jugador/a' : 'Agregar Jugador/a'}
              </h3>
              <button onClick={() => setIsPlayerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Dorsal *</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none text-center"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Sofia Martinez"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-amber-500 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Posición Principal</label>
                <select
                  value={playerPosition}
                  onChange={(e) => setPlayerPosition(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="OH">Punta Receptor (OH)</option>
                  <option value="MB">Central (MB)</option>
                  <option value="OPP">Opuesto (OPP)</option>
                  <option value="S">Armador / Setter (S)</option>
                  <option value="L">Líbero (L)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk_starter"
                  checked={playerStarter}
                  onChange={(e) => setPlayerStarter(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="chk_starter" className="text-xs text-slate-300 font-medium">
                  Alineación habitual (Titular)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl shadow-lg"
                >
                  Guardar Jugador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
