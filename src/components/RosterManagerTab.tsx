import React, { useState } from 'react';
import { Player, TeamSide } from '../types';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Activity, 
  Apple, 
  Target, 
  Ruler, 
  ShieldAlert, 
  CheckCircle2, 
  Search,
  ChevronRight,
  X,
  Save,
  Zap,
  Info
} from 'lucide-react';

interface RosterManagerTabProps {
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: Player[];
  awayPlayers: Player[];
  onUpdatePlayers: (team: TeamSide, players: Player[]) => void;
  onUpdateTeamName: (team: TeamSide, newName: string) => void;
}

export const RosterManagerTab: React.FC<RosterManagerTabProps> = ({
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
  onUpdatePlayers,
  onUpdateTeamName
}) => {
  const [activeTeam, setActiveTeam] = useState<TeamSide>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Player>>({});

  const currentPlayers = activeTeam === 'home' ? homePlayers : awayPlayers;
  const currentTeamName = activeTeam === 'home' ? homeTeamName : awayTeamName;

  const filteredPlayers = currentPlayers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.number.toString().includes(searchTerm) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData({
      id: `p_${Date.now()}`,
      number: currentPlayers.length ? Math.max(...currentPlayers.map(p => p.number)) + 1 : 1,
      name: '',
      position: 'OH',
      team: activeTeam,
      starter: false,
      heightCm: 185,
      weightKg: 78,
      spikeReachCm: 320,
      blockReachCm: 300,
      hittingStyle: '',
      kinesiologyNotes: '',
      nutritionNotes: '',
      notes: ''
    });
    setSelectedPlayer(null);
    setIsEditingModalOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setSelectedPlayer(player);
    setFormData({ ...player });
    setIsEditingModalOpen(true);
  };

  const handleDeletePlayer = (id: string) => {
    if (confirm('¿Estás seguro de eliminar a esta jugadora del plantel?')) {
      const updated = currentPlayers.filter(p => p.id !== id);
      onUpdatePlayers(activeTeam, updated);
      if (selectedPlayer?.id === id) {
        setSelectedPlayer(null);
      }
    }
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.number === undefined) return;

    const newPlayer: Player = {
      id: formData.id || `p_${Date.now()}`,
      number: Number(formData.number),
      name: formData.name,
      position: (formData.position as Player['position']) || 'OH',
      team: activeTeam,
      starter: !!formData.starter,
      heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
      weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
      spikeReachCm: formData.spikeReachCm ? Number(formData.spikeReachCm) : undefined,
      blockReachCm: formData.blockReachCm ? Number(formData.blockReachCm) : undefined,
      hittingStyle: formData.hittingStyle || '',
      kinesiologyNotes: formData.kinesiologyNotes || '',
      nutritionNotes: formData.nutritionNotes || '',
      notes: formData.notes || ''
    };

    let updatedList: Player[];
    const exists = currentPlayers.some(p => p.id === newPlayer.id);
    if (exists) {
      updatedList = currentPlayers.map(p => p.id === newPlayer.id ? newPlayer : p);
    } else {
      updatedList = [...currentPlayers, newPlayer];
    }

    onUpdatePlayers(activeTeam, updatedList);
    setSelectedPlayer(newPlayer);
    setIsEditingModalOpen(false);
  };

  const getPositionBadge = (pos: Player['position']) => {
    const colors: Record<string, string> = {
      OH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      MB: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      OPP: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      S: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      L: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    const labels: Record<string, string> = {
      OH: 'Punta (OH)',
      MB: 'Central (MB)',
      OPP: 'Opuesto/a (OPP)',
      S: 'Armador/a (S)',
      L: 'Líbero (L)'
    };
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${colors[pos] || 'bg-slate-800 text-slate-300'}`}>
        {labels[pos] || pos}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Módulo de Planteles & Fichas Individuales</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestión de Planteles y Atletas
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Carga tu equipo y al rival. Define posiciones, técnica de golpeo, estado físico, antropometría, historial kinésico y nutrición.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" /> Agregar Jugadora
            </button>
          </div>
        </div>
      </div>

      {/* Team Selection Tabs & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-7 flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => { setActiveTeam('home'); setSelectedPlayer(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
              activeTeam === 'home'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>MI EQUIPO ({homeTeamName})</span>
            <span className="bg-slate-950/30 px-2 py-0.5 rounded-full text-xs">{homePlayers.length}</span>
          </button>

          <button
            onClick={() => { setActiveTeam('away'); setSelectedPlayer(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
              activeTeam === 'away'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>RIVAL ({awayTeamName})</span>
            <span className="bg-slate-950/30 px-2 py-0.5 rounded-full text-xs">{awayPlayers.length}</span>
          </button>
        </div>

        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, dorsal o posición..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white placeholder-slate-500 text-sm pl-10 pr-4 py-3 rounded-2xl focus:outline-none transition"
          />
        </div>
      </div>

      {/* Main Roster & Player Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Player List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={currentTeamName}
                onChange={(e) => onUpdateTeamName(activeTeam, e.target.value)}
                className="font-black text-lg text-white bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl focus:border-emerald-500 focus:outline-none"
                title="Haz clic para renombrar el equipo"
              />
              <span className="text-xs text-slate-500 font-mono">(Clic para editar nombre)</span>
            </div>
            <span className="text-xs text-slate-400">
              {filteredPlayers.length} Jugadoras registradas
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-40" />
                <p>No se encontraron jugadoras registradas en este plantel.</p>
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayer?.id === player.id;
                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-emerald-400 shrink-0 font-mono text-base">
                        #{player.number}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm truncate">{player.name}</h3>
                          {player.starter && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                              TITULAR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getPositionBadge(player.position)}
                          {player.heightCm && (
                            <span className="text-xs text-slate-400 font-mono">
                              {player.heightCm} cm
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(player);
                        }}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-xl transition"
                        title="Editar jugadora"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlayer(player.id);
                        }}
                        className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition"
                        title="Eliminar jugadora"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Player Card view */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          {selectedPlayer ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-slate-950 font-black text-2xl flex items-center justify-center font-mono shadow-lg shadow-emerald-500/20">
                    #{selectedPlayer.number}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedPlayer.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getPositionBadge(selectedPlayer.position)}
                      <span className="text-xs text-slate-400">
                        {activeTeam === 'home' ? homeTeamName : awayTeamName}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(selectedPlayer)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
              </div>

              {/* Physical Attributes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-emerald-400" /> Métricas Físicas y Salto
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Estatura</span>
                    <span className="font-bold text-sm text-white font-mono">
                      {selectedPlayer.heightCm ? `${selectedPlayer.heightCm} cm` : 'Sin registrar'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Peso Corporal</span>
                    <span className="font-bold text-sm text-white font-mono">
                      {selectedPlayer.weightKg ? `${selectedPlayer.weightKg} kg` : 'Sin registrar'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Alcance de Ataque</span>
                    <span className="font-bold text-sm text-emerald-400 font-mono">
                      {selectedPlayer.spikeReachCm ? `${selectedPlayer.spikeReachCm} cm` : 'Sin registrar'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Alcance de Bloqueo</span>
                    <span className="font-bold text-sm text-sky-400 font-mono">
                      {selectedPlayer.blockReachCm ? `${selectedPlayer.blockReachCm} cm` : 'Sin registrar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hitting Technique / Style */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Técnica de Golpeo / Preferencias
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPlayer.hittingStyle || 'No se han especificado características de golpeo todavía.'}
                </p>
              </div>

              {/* Kinesiology & Medical Notes */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Kinesiología y Lesiones
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPlayer.kinesiologyNotes || 'Sin antecedentes kinésicos o lesiones registradas.'}
                </p>
              </div>

              {/* Nutrition Plan */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Apple className="w-3.5 h-3.5" /> Plan de Nutrición e Hidratación
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPlayer.nutritionNotes || 'Sin plan nutricional específico asignado.'}
                </p>
              </div>

              {selectedPlayer.notes && (
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">Observaciones Tácticas:</span>
                  <p className="text-xs text-slate-300">{selectedPlayer.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 space-y-3">
              <Info className="w-10 h-10 mx-auto opacity-30 text-emerald-400" />
              <p className="text-sm">
                Haz clic en cualquier jugadora de la lista para ver su ficha completa de <strong className="text-slate-300">kinesiología, nutrición, física y golpeo</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Adding/Editing Player */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedPlayer ? 'Editar Ficha de Jugadora' : 'Nueva Jugadora'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Equipo: <strong className="text-white">{currentTeamName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Dorsal #</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={99}
                    value={formData.number || ''}
                    onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Gabriela Guimarães"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Posición</label>
                  <select
                    value={formData.position || 'OH'}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as Player['position'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="OH">OH - Punta</option>
                    <option value="MB">MB - Central</option>
                    <option value="OPP">OPP - Opuesto/a</option>
                    <option value="S">S - Armador/a</option>
                    <option value="L">L - Líbero</option>
                  </select>
                </div>
              </div>

              {/* Starter Checkbox */}
              <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <input
                  type="checkbox"
                  id="starterCheck"
                  checked={!!formData.starter}
                  onChange={(e) => setFormData({ ...formData, starter: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="starterCheck" className="text-xs font-semibold text-white cursor-pointer">
                  Marcar como jugadora Titular del 6 inicial
                </label>
              </div>

              {/* Physical Measurements */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Métricas Físicas
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      placeholder="185"
                      value={formData.heightCm || ''}
                      onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      placeholder="78"
                      value={formData.weightKg || ''}
                      onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Alcance Ataque (cm)</label>
                    <input
                      type="number"
                      placeholder="325"
                      value={formData.spikeReachCm || ''}
                      onChange={(e) => setFormData({ ...formData, spikeReachCm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Alcance Bloqueo (cm)</label>
                    <input
                      type="number"
                      placeholder="305"
                      value={formData.blockReachCm || ''}
                      onChange={(e) => setFormData({ ...formData, blockReachCm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Hitting Style & Technique */}
              <div>
                <label className="text-xs font-semibold text-amber-400 block mb-1">
                  Técnica de Golpeo / Tipos de Ataque Preferidos
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Ataque explosivo diagonal larga, saque flotado con rosca, muñequeo paralelo..."
                  value={formData.hittingStyle || ''}
                  onChange={(e) => setFormData({ ...formData, hittingStyle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Kinesiology */}
              <div>
                <label className="text-xs font-semibold text-rose-400 block mb-1">
                  Kinesiología & Lesiones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Vendaje preventivo de tobillo der, molestia en manguito rotador, plan kinésico..."
                  value={formData.kinesiologyNotes || ''}
                  onChange={(e) => setFormData({ ...formData, kinesiologyNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Nutrition */}
              <div>
                <label className="text-xs font-semibold text-emerald-400 block mb-1">
                  Plan de Nutrición e Hidratación
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Creatina 5g, hidratación con isotónico durante partidos, dieta hiperproteica..."
                  value={formData.nutritionNotes || ''}
                  onChange={(e) => setFormData({ ...formData, nutritionNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
