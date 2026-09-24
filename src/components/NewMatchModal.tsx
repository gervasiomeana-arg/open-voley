import React, { useState, useEffect, useMemo } from 'react';
import { MatchData, Player, TeamSide } from '../types';
import { 
  SavedTeam, 
  saveTeam, 
  getSavedTeams, 
  getSavedMatches, 
  SavedMatchRecord 
} from '../services/teamStorage';
import { 
  PlusCircle, 
  Users, 
  Video, 
  Calendar, 
  Clock, 
  Trophy, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  X, 
  Upload, 
  Youtube, 
  Play, 
  Shield, 
  Sparkles, 
  RotateCcw, 
  Search, 
  Zap, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Star, 
  Volleyball, 
  AlertTriangle, 
  Edit2, 
  MapPin 
} from 'lucide-react';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTeams?: SavedTeam[];
  recentMatches?: SavedMatchRecord[];
  onOpenTeamsManager?: () => void;
  onTeamsUpdated?: () => void;
  onStartMatch: (newMatch: MatchData, videoInfo: { src: string; fileName?: string; fileSize?: string }) => void;
}

const DRAFT_STORAGE_KEY = 'openvoley_new_match_draft_v2';
const RECENT_TEAM_KEY = 'openvoley_recent_home_team_id';

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  savedTeams = [],
  recentMatches = [],
  onOpenTeamsManager,
  onTeamsUpdated,
  onStartMatch,
}) => {
  const safeTeams = savedTeams.length > 0 ? savedTeams : getSavedTeams();
  const effectiveRecentMatches = recentMatches.length > 0 ? recentMatches : getSavedMatches();

  // Wizard Step: 1 (Equipo) | 2 (Rival) | 3 (Fecha/Hora) | 4 (Plantilla) | 5 (Listo)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Draft notification
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  // Teams Separation
  const myTeams = useMemo(() => safeTeams.filter((t) => t.type === 'my_team'), [safeTeams]);
  const opponentTeams = useMemo(() => safeTeams.filter((t) => t.type === 'opponent'), [safeTeams]);

  // Favorite / Recent Team ID
  const defaultRecentTeamId = useMemo(() => {
    try {
      const storedId = localStorage.getItem(RECENT_TEAM_KEY);
      if (storedId && safeTeams.some((t) => t.id === storedId)) {
        return storedId;
      }
    } catch {
      // ignore
    }
    return myTeams[0]?.id || safeTeams[0]?.id || '';
  }, [safeTeams, myTeams]);

  // Step 1: Home Team Selection & Inline Creator
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string>(defaultRecentTeamId);
  const [isCreatingHomeTeam, setIsCreatingHomeTeam] = useState(false);
  const [newHomeTeamName, setNewHomeTeamName] = useState('');
  const [newHomeTeamCategory, setNewHomeTeamCategory] = useState('Primera División');
  const [newHomeTeamGender, setNewHomeTeamGender] = useState<'Femenino' | 'Masculino' | 'Mixto'>('Femenino');
  const [duplicateTeamWarning, setDuplicateTeamWarning] = useState<SavedTeam | null>(null);

  // Step 2: Opponent Selection & Inline Creator
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string>(() => {
    const opp = opponentTeams[0] || safeTeams.find((t) => t.id !== defaultRecentTeamId);
    return opp?.id || '';
  });
  const [rivalSearchQuery, setRivalSearchQuery] = useState('');
  const [isCreatingOpponent, setIsCreatingOpponent] = useState(false);
  const [newOpponentName, setNewOpponentName] = useState('');
  const [newOpponentCategory, setNewOpponentCategory] = useState('Primera División');
  const [duplicateOpponentWarning, setDuplicateOpponentWarning] = useState<SavedTeam | null>(null);

  // Step 3: Date & Time
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [matchTime, setMatchTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(Math.ceil(now.getMinutes() / 15) * 15 % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  // Step 4: Roster Selection
  const selectedHomeTeam = useMemo(
    () => safeTeams.find((t) => t.id === selectedHomeTeamId) || myTeams[0] || safeTeams[0],
    [safeTeams, selectedHomeTeamId, myTeams]
  );
  const selectedAwayTeam = useMemo(
    () => safeTeams.find((t) => t.id === selectedAwayTeamId) || opponentTeams[0] || safeTeams.find((t) => t.id !== selectedHomeTeam?.id),
    [safeTeams, selectedAwayTeamId, opponentTeams, selectedHomeTeam]
  );

  // Filtered opponents based on search
  const filteredOpponents = useMemo(() => {
    const q = rivalSearchQuery.toLowerCase().trim();
    const list = opponentTeams.length > 0 ? opponentTeams : safeTeams.filter((t) => t.id !== selectedHomeTeamId);
    if (!q) return list;
    return list.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [opponentTeams, safeTeams, selectedHomeTeamId, rivalSearchQuery]);

  // Selected player IDs for home team
  const [selectedHomePlayerIds, setSelectedHomePlayerIds] = useState<string[]>([]);
  const [selectedAwayPlayerIds, setSelectedAwayPlayerIds] = useState<string[]>([]);
  const [rosterSide, setRosterSide] = useState<TeamSide>('home');
  const [isEditingRoster, setIsEditingRoster] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newPlayerNumber, setNewPlayerNumber] = useState<number>(1);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState<Player['position']>('OH');

  // Step 5: Advanced Options (Collapsible)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [competition, setCompetition] = useState('Liga / Torneo Oficial');
  const [venue, setVenue] = useState('Estadio Principal');
  const [videoMode, setVideoMode] = useState<'youtube' | 'file' | 'none'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);

  // Initial Rotations
  const getInitialRotation = (team?: SavedTeam): number[] => {
    if (!team || !team.players || !team.players.length) return [1, 2, 3, 4, 5, 6];
    const nonLiberos = team.players.filter((p) => p.position !== 'L');
    const starters = nonLiberos.filter((p) => p.starter);
    if (starters.length >= 6) {
      return starters.slice(0, 6).map((p) => p.number);
    }
    const combined = [...starters, ...nonLiberos.filter((p) => !p.starter)];
    if (combined.length >= 6) {
      return combined.slice(0, 6).map((p) => p.number);
    }
    // Pad with sequential numbers if fewer than 6
    const nums = combined.map((p) => p.number);
    for (let i = 1; nums.length < 6; i++) {
      if (!nums.includes(i)) nums.push(i);
    }
    return nums.slice(0, 6);
  };

  const [homeRotation, setHomeRotation] = useState<number[]>(() => getInitialRotation(selectedHomeTeam));
  const [awayRotation, setAwayRotation] = useState<number[]>(() => getInitialRotation(selectedAwayTeam));

  // Sync roster selection when home team changes
  useEffect(() => {
    if (selectedHomeTeam?.players) {
      setSelectedHomePlayerIds(selectedHomeTeam.players.map((p) => p.id));
      setHomeRotation(getInitialRotation(selectedHomeTeam));
    }
  }, [selectedHomeTeam?.id]);

  useEffect(() => {
    if (selectedAwayTeam?.players) {
      setSelectedAwayPlayerIds(selectedAwayTeam.players.map((p) => p.id));
      setAwayRotation(getInitialRotation(selectedAwayTeam));
    }
  }, [selectedAwayTeam?.id]);

  const rosterTeam = rosterSide === 'home' ? selectedHomeTeam : selectedAwayTeam;
  const selectedRosterIds = rosterSide === 'home' ? selectedHomePlayerIds : selectedAwayPlayerIds;
  const setSelectedRosterIds = rosterSide === 'home' ? setSelectedHomePlayerIds : setSelectedAwayPlayerIds;

  const handleEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setNewPlayerNumber(player.number);
    setNewPlayerName(player.name);
    setNewPlayerPosition(player.position);
    setIsEditingRoster(true);
  };

  // Load draft on mount if exists
  useEffect(() => {
    if (!isOpen) return;
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        // Only consider drafts saved in the last 48 hours
        if (draft && draft.timestamp && Date.now() - draft.timestamp < 48 * 3600 * 1000) {
          setHasDraftNotice(true);
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Auto-save draft on changes
  useEffect(() => {
    if (!isOpen) return;
    try {
      const draftData = {
        currentStep,
        selectedHomeTeamId,
        selectedAwayTeamId,
        matchDate,
        matchTime,
        competition,
        venue,
        videoMode,
        youtubeUrl,
        selectedHomePlayerIds,
        selectedAwayPlayerIds,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    } catch {
      // ignore
    }
  }, [
    isOpen,
    currentStep,
    selectedHomeTeamId,
    selectedAwayTeamId,
    matchDate,
    matchTime,
    competition,
    venue,
    videoMode,
    youtubeUrl,
    selectedHomePlayerIds,
    selectedAwayPlayerIds,
  ]);

  const handleRestoreDraft = () => {
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft.selectedHomeTeamId) setSelectedHomeTeamId(draft.selectedHomeTeamId);
        if (draft.selectedAwayTeamId) setSelectedAwayTeamId(draft.selectedAwayTeamId);
        if (draft.matchDate) setMatchDate(draft.matchDate);
        if (draft.matchTime) setMatchTime(draft.matchTime);
        if (draft.competition) setCompetition(draft.competition);
        if (draft.venue) setVenue(draft.venue);
        if (draft.videoMode) setVideoMode(draft.videoMode);
        if (draft.youtubeUrl) setYoutubeUrl(draft.youtubeUrl);
        if (draft.selectedHomePlayerIds) setSelectedHomePlayerIds(draft.selectedHomePlayerIds);
        if (draft.selectedAwayPlayerIds) setSelectedAwayPlayerIds(draft.selectedAwayPlayerIds);
        if (draft.currentStep) setCurrentStep(draft.currentStep);
      }
    } catch {
      // ignore
    }
    setHasDraftNotice(false);
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setHasDraftNotice(false);
  };

  // Clear draft helper on finish or cancel
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // ==========================================
  // DUPLICATE / REPEAT MATCH FEATURE (Section 14 & 15)
  // ==========================================
  const handleDuplicateMatch = (record: SavedMatchRecord) => {
    const srcMatch = record.matchData;
    if (!srcMatch) return;

    // Find or restore home & away teams
    const foundHome = safeTeams.find((t) => t.name.toLowerCase() === srcMatch.homeTeamName.toLowerCase());
    const foundAway = safeTeams.find((t) => t.name.toLowerCase() === srcMatch.awayTeamName.toLowerCase());

    if (foundHome) setSelectedHomeTeamId(foundHome.id);
    if (foundAway) setSelectedAwayTeamId(foundAway.id);

    setCompetition(srcMatch.competition || 'Liga / Torneo Oficial');
    setMatchDate(new Date().toISOString().split('T')[0]);

    if (srcMatch.homePlayers && srcMatch.homePlayers.length > 0) {
      setSelectedHomePlayerIds(srcMatch.homePlayers.map((p) => p.id));
    }
    if (srcMatch.awayPlayers) setSelectedAwayPlayerIds(srcMatch.awayPlayers.map((p) => p.id));
    if (srcMatch.homeRotation && srcMatch.homeRotation.length === 6) {
      setHomeRotation(srcMatch.homeRotation);
    }
    if (srcMatch.awayRotation && srcMatch.awayRotation.length === 6) {
      setAwayRotation(srcMatch.awayRotation);
    }

    if (record.videoSrc) {
      if (record.videoSrc.includes('youtube.com') || record.videoSrc.includes('youtu.be')) {
        setVideoMode('youtube');
        setYoutubeUrl(record.videoSrc);
      }
    }

    // Advance directly to Step 5 (PARTIDO LISTO)
    setCurrentStep(5);
  };

  // ==========================================
  // QUICK MATCH IN 1-CLICK (Section 21)
  // ==========================================
  const handleQuickMatch = () => {
    if (!selectedHomeTeam || !selectedAwayTeam) return;

    // Roster is fully selected
    const homePlayerIds = selectedHomeTeam.players.map((p) => p.id);
    setSelectedHomePlayerIds(homePlayerIds);
    setSelectedAwayPlayerIds(selectedAwayTeam.players.map((p) => p.id));
    setMatchDate(new Date().toISOString().split('T')[0]);

    // Jump straight to ready
    setCurrentStep(5);
  };

  // ==========================================
  // PREVENT DUPLICATES & INLINE CREATION (Section 16)
  // ==========================================
  const handleCheckHomeTeamDuplicate = (name: string) => {
    setNewHomeTeamName(name);
    if (!name.trim()) {
      setDuplicateTeamWarning(null);
      return;
    }
    const matchFound = safeTeams.find(
      (t) => t.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    setDuplicateTeamWarning(matchFound || null);
  };

  const handleCreateHomeTeam = () => {
    if (!newHomeTeamName.trim()) return;

    // Check duplicate
    if (duplicateTeamWarning) {
      setSelectedHomeTeamId(duplicateTeamWarning.id);
      setIsCreatingHomeTeam(false);
      setNewHomeTeamName('');
      setDuplicateTeamWarning(null);
      return;
    }

    // Default 12 players
    const defaultPlayers: Player[] = [
      { id: `hp_${Date.now()}_1`, number: 1, name: 'Capitana', position: 'S', team: 'home', starter: true },
      { id: `hp_${Date.now()}_7`, number: 7, name: 'Punta Receptora 1', position: 'OH', team: 'home', starter: true },
      { id: `hp_${Date.now()}_9`, number: 9, name: 'Opuesta Titular', position: 'OPP', team: 'home', starter: true },
      { id: `hp_${Date.now()}_11`, number: 11, name: 'Central 1', position: 'MB', team: 'home', starter: true },
      { id: `hp_${Date.now()}_14`, number: 14, name: 'Punta Receptora 2', position: 'OH', team: 'home', starter: true },
      { id: `hp_${Date.now()}_16`, number: 16, name: 'Central 2', position: 'MB', team: 'home', starter: true },
      { id: `hp_${Date.now()}_4`, number: 4, name: 'Líbero', position: 'L', team: 'home', starter: true },
      { id: `hp_${Date.now()}_2`, number: 2, name: 'Armadora Suplente', position: 'S', team: 'home', starter: false },
      { id: `hp_${Date.now()}_5`, number: 5, name: 'Punta Suplente', position: 'OH', team: 'home', starter: false },
      { id: `hp_${Date.now()}_8`, number: 8, name: 'Central Suplente', position: 'MB', team: 'home', starter: false },
    ];

    const newTeam: SavedTeam = {
      id: `team_${Date.now()}`,
      name: newHomeTeamName.trim(),
      shortName: newHomeTeamName.trim().slice(0, 8),
      category: newHomeTeamCategory,
      gender: newHomeTeamGender,
      type: 'my_team',
      players: defaultPlayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTeam(newTeam);
    if (onTeamsUpdated) onTeamsUpdated();

    setSelectedHomeTeamId(newTeam.id);
    setIsCreatingHomeTeam(false);
    setNewHomeTeamName('');
    setDuplicateTeamWarning(null);
  };

  const handleCheckOpponentDuplicate = (name: string) => {
    setNewOpponentName(name);
    if (!name.trim()) {
      setDuplicateOpponentWarning(null);
      return;
    }
    const matchFound = safeTeams.find(
      (t) => t.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    setDuplicateOpponentWarning(matchFound || null);
  };

  const handleCreateOpponent = () => {
    if (!newOpponentName.trim()) return;

    if (duplicateOpponentWarning) {
      setSelectedAwayTeamId(duplicateOpponentWarning.id);
      setIsCreatingOpponent(false);
      setNewOpponentName('');
      setDuplicateOpponentWarning(null);
      return;
    }

    const defaultAwayPlayers: Player[] = [
      { id: `ap_${Date.now()}_1`, number: 1, name: 'Armador Rival', position: 'S', team: 'away', starter: true },
      { id: `ap_${Date.now()}_3`, number: 3, name: 'Punta Rival 1', position: 'OH', team: 'away', starter: true },
      { id: `ap_${Date.now()}_5`, number: 5, name: 'Central Rival 1', position: 'MB', team: 'away', starter: true },
      { id: `ap_${Date.now()}_8`, number: 8, name: 'Opuesto Rival', position: 'OPP', team: 'away', starter: true },
      { id: `ap_${Date.now()}_10`, number: 10, name: 'Punta Rival 2', position: 'OH', team: 'away', starter: true },
      { id: `ap_${Date.now()}_12`, number: 12, name: 'Central Rival 2', position: 'MB', team: 'away', starter: true },
      { id: `ap_${Date.now()}_2`, number: 2, name: 'Líbero Rival', position: 'L', team: 'away', starter: true },
    ];

    const newOppTeam: SavedTeam = {
      id: `team_opp_${Date.now()}`,
      name: newOpponentName.trim(),
      shortName: newOpponentName.trim().slice(0, 8),
      category: newOpponentCategory || selectedHomeTeam?.category || 'Primera División',
      gender: selectedHomeTeam?.gender || 'Femenino',
      type: 'opponent',
      players: defaultAwayPlayers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTeam(newOppTeam);
    if (onTeamsUpdated) onTeamsUpdated();

    setSelectedAwayTeamId(newOppTeam.id);
    setIsCreatingOpponent(false);
    setNewOpponentName('');
    setDuplicateOpponentWarning(null);
  };

  // Add or edit a player on the team currently shown in Step 4.
  const handleAddQuickPlayer = () => {
    if (!newPlayerName.trim() || !rosterTeam) return;

    if (rosterTeam.players.some((p) => p.number === newPlayerNumber && p.id !== editingPlayerId)) return;

    const newPlayer: Player = {
      id: editingPlayerId || `p_custom_${Date.now()}`,
      number: newPlayerNumber,
      name: newPlayerName.trim(),
      position: newPlayerPosition,
      team: rosterSide,
      starter: editingPlayerId
        ? rosterTeam.players.find((p) => p.id === editingPlayerId)?.starter ?? false
        : selectedRosterIds.length < 6,
    };

    const updatedPlayers = editingPlayerId
      ? rosterTeam.players.map((p) => p.id === editingPlayerId ? { ...p, ...newPlayer } : p)
      : [...rosterTeam.players, newPlayer];
    const updatedTeam: SavedTeam = {
      ...rosterTeam,
      players: updatedPlayers,
      updatedAt: new Date().toISOString(),
    };

    saveTeam(updatedTeam);
    if (onTeamsUpdated) onTeamsUpdated();

    if (!editingPlayerId) setSelectedRosterIds((prev) => [...prev, newPlayer.id]);
    setEditingPlayerId(null);
    setNewPlayerName('');
    setNewPlayerNumber(newPlayerNumber + 1);
  };

  // ==========================================
  // FINAL CREATION: BUILD MATCH (0-0, Set 1)
  // ==========================================
  const handleCreateMatchFinal = () => {
    if (!selectedHomeTeam || !selectedAwayTeam) return;

    // Filter convoked players
    const activeHomePlayers: Player[] = (selectedHomeTeam.players || [])
      .filter((p) => selectedHomePlayerIds.includes(p.id))
      .map((p) => ({ ...p, team: 'home' as TeamSide }));

    const activeAwayPlayers: Player[] = (selectedAwayTeam.players || [])
      .filter((p) => selectedAwayPlayerIds.includes(p.id))
      .map((p) => ({ ...p, team: 'away' as TeamSide }));

    // Ensure initial rotations are valid numbers
    const hasValidRotation = (rotation: number[], players: Player[]) =>
      rotation.length === 6 && rotation.every((number) => players.some((p) => p.number === number && p.position !== 'L'));
    const validHomeRot = hasValidRotation(homeRotation, activeHomePlayers)
      ? homeRotation : getInitialRotation({ ...selectedHomeTeam, players: activeHomePlayers });
    const validAwayRot = hasValidRotation(awayRotation, activeAwayPlayers)
      ? awayRotation : getInitialRotation({ ...selectedAwayTeam, players: activeAwayPlayers });

    const newMatch: MatchData = {
      id: `match_${Date.now()}`,
      title: `${selectedHomeTeam.name} vs ${selectedAwayTeam.name}`,
      date: matchDate || new Date().toISOString().split('T')[0],
      competition: competition || 'Torneo Oficial',
      category: selectedHomeTeam.category || 'Primera División',
      venue: venue || 'Estadio Principal',
      homeTeamName: selectedHomeTeam.name,
      awayTeamName: selectedAwayTeam.name,
      currentSet: 1,
      sets: [
        { setNumber: 1, scoreHome: 0, scoreAway: 0 },
        { setNumber: 2, scoreHome: 0, scoreAway: 0 },
        { setNumber: 3, scoreHome: 0, scoreAway: 0 },
        { setNumber: 4, scoreHome: 0, scoreAway: 0 },
        { setNumber: 5, scoreHome: 0, scoreAway: 0 },
      ],
      homePlayers: activeHomePlayers,
      awayPlayers: activeAwayPlayers,
      actions: [],
      homeRotation: validHomeRot,
      awayRotation: validAwayRot,
      server: { team: 'home', playerNum: validHomeRot[0] || 1 },
      isPrepared: true,
      status: 'in_progress',
    };

    // Video config
    let finalVideoSrc = '';
    let videoFileName: string | undefined = undefined;
    let videoFileSize: string | undefined = undefined;

    if (videoMode === 'youtube' && youtubeUrl.trim()) {
      finalVideoSrc = youtubeUrl.trim();
      videoFileName = 'Enlace de YouTube';
    } else if (videoMode === 'file' && localVideoFile) {
      finalVideoSrc = URL.createObjectURL(localVideoFile);
      videoFileName = localVideoFile.name;
      videoFileSize = `${(localVideoFile.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Save recent home team id for future matches
    try {
      localStorage.setItem(RECENT_TEAM_KEY, selectedHomeTeam.id);
    } catch {
      // ignore
    }

    clearDraft();
    onStartMatch(newMatch, {
      src: finalVideoSrc,
      fileName: videoFileName,
      fileSize: videoFileSize,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        
        {/* =========================================================================
            HEADER & COMPACT PROGRESS BAR (1 EQUIPO • 2 RIVAL • 3 FECHA • 4 PLANTILLA • 5 LISTO)
            ========================================================================= */}
        <div className="border-b border-slate-800 bg-slate-900/95">
          <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                <Volleyball className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  Nuevo Partido
                </h2>
                <p className="text-[11px] text-slate-400">
                  Configuración rápida en 60 segundos
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Cerrar asistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Compact Progress Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
            {[
              { num: 1, label: 'Equipo' },
              { num: 2, label: 'Rival' },
              { num: 3, label: 'Fecha' },
              { num: 4, label: 'Plantilla' },
              { num: 5, label: 'Listo' },
            ].map((stepItem, idx) => {
              const isActive = currentStep === stepItem.num;
              const isPast = currentStep > stepItem.num;

              return (
                <React.Fragment key={stepItem.num}>
                  <button
                    onClick={() => {
                      // Allow moving back to any previous step without losing data
                      if (stepItem.num < currentStep) {
                        setCurrentStep(stepItem.num as any);
                      }
                    }}
                    disabled={stepItem.num > currentStep}
                    className={`flex items-center gap-1.5 transition ${
                      isActive
                        ? 'text-amber-400 font-extrabold cursor-default'
                        : isPast
                        ? 'text-slate-300 hover:text-white cursor-pointer'
                        : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : isPast
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : stepItem.num}
                    </span>
                    <span className="hidden xs:inline">{stepItem.label}</span>
                  </button>

                  {idx < 4 && (
                    <div
                      className={`h-0.5 flex-1 mx-1.5 sm:mx-2 rounded ${
                        currentStep > idx + 1 ? 'bg-amber-500/60' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Draft Notice Banner (Autoguardado - Section 20) */}
        {hasDraftNotice && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Tienes un partido guardado temporalmente en preparación.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreDraft}
                className="underline font-bold hover:text-white cursor-pointer"
              >
                Recuperar
              </button>
              <span className="text-slate-500">·</span>
              <button
                onClick={handleDiscardDraft}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL BODY: CONVERSATIONAL PROGRESSIVE STEPS
            ========================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

          {/* =====================================================================
              PASO 1 — EQUIPO: ¿QUÉ EQUIPO VAS A SCOUTEAR?
              ===================================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Question header */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  Paso 1 de 5
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  ¿Qué equipo vas a ascoutear?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona tu equipo de la biblioteca o crea uno nuevo con 1 clic.
                </p>
              </div>

              {/* Quick Actions Bar: Modo Rápido & Partidos Recientes */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                {effectiveRecentMatches.length > 0 && (
                  <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Partido Reciente: {effectiveRecentMatches[0].homeTeamName} vs {effectiveRecentMatches[0].awayTeamName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Reutiliza equipos y alineaciones con marcador en limpio (0-0)
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDuplicateMatch(effectiveRecentMatches[0])}
                      className="bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>[ Repetir Partido ]</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Teams List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Mis Equipos Registrados</span>
                  <button
                    onClick={() => setIsCreatingHomeTeam(!isCreatingHomeTeam)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Crear Equipo</span>
                  </button>
                </div>

                {/* Inline Team Creator */}
                {isCreatingHomeTeam && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Crear Nuevo Equipo Propio</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre del Club / Equipo</label>
                        <input
                          type="text"
                          value={newHomeTeamName}
                          onChange={(e) => handleCheckHomeTeamDuplicate(e.target.value)}
                          placeholder="Ej: Club Ciudad de Campana"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Categoría</label>
                        <input
                          type="text"
                          value={newHomeTeamCategory}
                          onChange={(e) => setNewHomeTeamCategory(e.target.value)}
                          placeholder="Sub 18 / Primera"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Duplicate warning (Section 16) */}
                    {duplicateTeamWarning && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Ya existe un equipo llamado "{duplicateTeamWarning.name}".
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHomeTeamId(duplicateTeamWarning.id);
                            setIsCreatingHomeTeam(false);
                            setNewHomeTeamName('');
                            setDuplicateTeamWarning(null);
                          }}
                          className="font-bold underline hover:text-white"
                        >
                          Usar este equipo
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingHomeTeam(false);
                          setNewHomeTeamName('');
                          setDuplicateTeamWarning(null);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateHomeTeam}
                        disabled={!newHomeTeamName.trim()}
                        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-xl shadow transition cursor-pointer"
                      >
                        Guardar y Seleccionar
                      </button>
                    </div>
                  </div>
                )}

                {/* Team Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(myTeams.length > 0 ? myTeams : safeTeams).map((team) => {
                    const isSelected = selectedHomeTeamId === team.id;
                    const isFavorite = team.id === defaultRecentTeamId;

                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedHomeTeamId(team.id)}
                        className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-900 border border-slate-800 text-amber-400'
                            }`}
                          >
                            {team.name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white truncate block">
                                {team.name}
                              </span>
                              {isFavorite && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold shrink-0">
                                  ⭐ Habitual
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {team.category} · {team.players?.length || 0} jugadoras
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =====================================================================
              PASO 2 — RIVAL: ¿CONTRA QUIÉN?
              ===================================================================== */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Question header */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1">
                  Paso 2 de 5
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  ¿Contra quién juegan?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona el rival de tu base de datos o agrégalo en segundos.
                </p>
              </div>

              {/* Search and Quick Add */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={rivalSearchQuery}
                      onChange={(e) => setRivalSearchQuery(e.target.value)}
                      placeholder="Buscar rival por nombre o categoría..."
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setIsCreatingOpponent(!isCreatingOpponent)}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Nuevo Rival</span>
                  </button>
                </div>

                {/* Inline Opponent Creator */}
                {isCreatingOpponent && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>Registrar Nuevo Equipo Rival</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre del Rival</label>
                        <input
                          type="text"
                          value={newOpponentName}
                          onChange={(e) => handleCheckOpponentDuplicate(e.target.value)}
                          placeholder="Ej: Boca Juniors / Chile / Vélez"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Categoría</label>
                        <input
                          type="text"
                          value={newOpponentCategory}
                          onChange={(e) => setNewOpponentCategory(e.target.value)}
                          placeholder={selectedHomeTeam?.category || 'Primera'}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Duplicate Warning */}
                    {duplicateOpponentWarning && (
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
                          Este rival ya existe en tu base de datos: "{duplicateOpponentWarning.name}".
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAwayTeamId(duplicateOpponentWarning.id);
                            setIsCreatingOpponent(false);
                            setNewOpponentName('');
                            setDuplicateOpponentWarning(null);
                          }}
                          className="font-bold underline hover:text-white"
                        >
                          Usar este rival
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingOpponent(false);
                          setNewOpponentName('');
                          setDuplicateOpponentWarning(null);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateOpponent}
                        disabled={!newOpponentName.trim()}
                        className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-xl shadow transition cursor-pointer"
                      >
                        Crear Rival y Seleccionar
                      </button>
                    </div>
                  </div>
                )}

                {/* Opponent Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredOpponents.map((opp) => {
                    const isSelected = selectedAwayTeamId === opp.id;

                    return (
                      <button
                        key={opp.id}
                        type="button"
                        onClick={() => setSelectedAwayTeamId(opp.id)}
                        className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-900 border border-slate-800 text-cyan-400'
                            }`}
                          >
                            {opp.name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <span className="font-bold text-sm text-white truncate block">
                              {opp.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {opp.category} · {opp.players?.length || 0} jugadoras
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  {filteredOpponents.length === 0 && (
                    <div className="sm:col-span-2 text-center py-6 text-xs text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800">
                      No se encontraron rivales coincidentes. Haz clic en <strong>+ Nuevo Rival</strong> para agregarlo.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* =====================================================================
              PASO 3 — FECHA Y HORA: ¿CUÁNDO?
              ===================================================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Question header */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  Paso 3 de 5
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  ¿Cuándo se juega?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Valores predeterminados cargados automáticamente para ahorrar tiempo.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Fecha del Encuentro
                      </span>
                      <button
                        type="button"
                        onClick={() => setMatchDate(new Date().toISOString().split('T')[0])}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Hoy
                      </button>
                    </label>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>

                  {/* Hora */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Hora de Inicio
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          setMatchTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                        }}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Ahora
                      </button>
                    </label>
                    <input
                      type="time"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    El encuentro quedará agendado para <strong>{matchDate}</strong> a las <strong>{matchTime} hs</strong>.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* =====================================================================
              PASO 4 — PLANTILLA: ¿QUÉ JUGADORES PARTICIPAN?
              ===================================================================== */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Question header */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  Paso 4 de 5
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  ¿Qué jugadoras participan?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Elegí las convocadas y editá las jugadoras de cada equipo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Equipo cuya plantilla se edita">
                {(['home', 'away'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => {
                      setRosterSide(side);
                      setIsEditingRoster(false);
                      setEditingPlayerId(null);
                      setNewPlayerName('');
                    }}
                    aria-pressed={rosterSide === side}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left truncate ${rosterSide === side ? 'border-amber-500 bg-amber-500/15 text-white' : 'border-slate-700 bg-slate-950 text-slate-400'}`}
                  >
                    {side === 'home' ? 'Mi equipo' : 'Rival'}: {side === 'home' ? selectedHomeTeam?.name : selectedAwayTeam?.name}
                  </button>
                ))}
              </div>

              {/* Roster Controls: USAR PLANTILLA HABITUAL */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-white">
                    {selectedRosterIds.length} de {rosterTeam?.players.length || 0} convocadas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (rosterTeam?.players) {
                        setSelectedRosterIds(rosterTeam.players.map((p) => p.id));
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Convocar a todas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingRoster(!isEditingRoster)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isEditingRoster ? 'Ocultar Editor' : 'Editar / + Jugadora'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Add Player Editor */}
              {isEditingRoster && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5 animate-in fade-in">
                  <div className="text-xs font-bold text-slate-300">
                    {editingPlayerId ? 'Editar jugadora' : '+ Agregar jugadora'} de {rosterTeam?.name}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={newPlayerNumber}
                        onChange={(e) => setNewPlayerNumber(parseInt(e.target.value, 10) || 1)}
                        placeholder="Nº"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Nombre y Apellido"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <select
                        value={newPlayerPosition}
                        onChange={(e) => setNewPlayerPosition(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-amber-400 font-bold"
                      >
                        <option value="S">Armadora (S)</option>
                        <option value="OH">Punta (OH)</option>
                        <option value="MB">Central (MB)</option>
                        <option value="OPP">Opuesta (OPP)</option>
                        <option value="L">Líbero (L)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddQuickPlayer}
                      disabled={!newPlayerName.trim() || rosterTeam?.players.some((p) => p.number === newPlayerNumber && p.id !== editingPlayerId)}
                      className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-3 py-1 rounded-xl transition cursor-pointer"
                    >
                      {editingPlayerId ? 'Guardar cambios' : '+ Agregar y convocar'}
                    </button>
                  </div>
                  {rosterTeam?.players.some((p) => p.number === newPlayerNumber && p.id !== editingPlayerId) && (
                    <p className="text-xs text-amber-400">Ese número ya pertenece a otra jugadora del equipo.</p>
                  )}
                  {editingPlayerId && (
                    <button type="button" className="text-xs text-slate-400 underline" onClick={() => { setEditingPlayerId(null); setNewPlayerName(''); }}>
                      Cancelar edición
                    </button>
                  )}
                </div>
              )}

              {/* Roster Cards with Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {(rosterTeam?.players || []).map((player) => {
                  const isChecked = selectedRosterIds.includes(player.id);

                  return (
                    <div
                      key={player.id}
                      onClick={() => {
                        setSelectedRosterIds((prev) =>
                          prev.includes(player.id)
                            ? prev.filter((id) => id !== player.id)
                            : [...prev, player.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-slate-900 border-amber-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            isChecked
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          #{player.number}
                        </span>

                        <div className="min-w-0">
                          <span className="font-bold text-xs truncate block text-white">
                            {player.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {player.position} {player.starter ? '· Titular' : ''}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isChecked
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <button
                        type="button"
                        aria-label={`Editar ${player.name}`}
                        onClick={(event) => { event.stopPropagation(); handleEditPlayer(player); }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {selectedRosterIds.length === 0 && (
                <p className="text-xs text-amber-400" role="alert">Convocá al menos una jugadora de {rosterTeam?.name} para continuar.</p>
              )}

            </div>
          )}

          {/* =====================================================================
              PASO 5 — LISTO: PARTIDO LISTO & CONFIGURACIÓN AVANZADA
              ===================================================================== */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Question header */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                  Paso 5 de 5
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  ¡Partido Listo!
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revisa el resumen y presiona Crear Partido para ir directo al Centro del Partido.
                </p>
              </div>

              {/* Match Summary Showcase Box */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                
                {/* Scoreboard Preview */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/80">
                  {/* Home Team */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
                      {selectedHomeTeam?.name?.charAt(0) || 'L'}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Local
                      </span>
                      <span className="text-base sm:text-lg font-black text-white leading-tight">
                        {selectedHomeTeam?.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {selectedHomePlayerIds.length} convocadas
                      </span>
                    </div>
                  </div>

                  <div className="text-center px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono font-bold text-slate-400">
                    VS
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Visitante
                      </span>
                      <span className="text-base sm:text-lg font-black text-white leading-tight">
                        {selectedAwayTeam?.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {selectedAwayPlayerIds.length} convocadas
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg">
                      {selectedAwayTeam?.name?.charAt(0) || 'V'}
                    </div>
                  </div>
                </div>

                {/* Metadata Summary Chips */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{matchDate}</span>
                  </span>

                  <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{matchTime} hs</span>
                  </span>

                  <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{competition}</span>
                  </span>
                </div>
              </div>

              {/* =================================================================
                  SECCIÓN 7: CONFIGURACIÓN AVANZADA (OPCIONAL)
                  ================================================================= */}
              <div className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>[ Configuración Avanzada (Opcional) ]</span>
                  </span>
                  {isAdvancedOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isAdvancedOpen && (
                  <div className="p-4 border-t border-slate-800 space-y-4 text-xs">
                    {/* Torneo & Sede */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Torneo / Competencia
                        </label>
                        <input
                          type="text"
                          value={competition}
                          onChange={(e) => setCompetition(e.target.value)}
                          placeholder="Ej: Liga Metropolitana Sub 18"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">
                          Sede / Cancha
                        </label>
                        <input
                          type="text"
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          placeholder="Ej: Cancha Central Club Ciudad"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Video Mode Selection */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <label className="text-[10px] font-bold text-slate-400 block">
                        Vinculación de Video (Opcional):
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setVideoMode('youtube')}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            videoMode === 'youtube'
                              ? 'bg-amber-500/20 border-amber-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Youtube className="w-4 h-4 mx-auto mb-1 text-red-500" />
                          <span className="text-[11px] font-bold block">YouTube</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVideoMode('file')}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            videoMode === 'file'
                              ? 'bg-amber-500/20 border-amber-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                          <span className="text-[11px] font-bold block">Archivo MP4</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVideoMode('none')}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            videoMode === 'none'
                              ? 'bg-amber-500/20 border-amber-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Play className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                          <span className="text-[11px] font-bold block">Sin Video</span>
                        </button>
                      </div>

                      {videoMode === 'youtube' && (
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                        />
                      )}

                      {videoMode === 'file' && (
                        <div className="bg-slate-900 p-3 rounded-xl border border-dashed border-slate-700 text-center">
                          <label className="text-amber-400 font-bold text-xs cursor-pointer hover:underline inline-block">
                            Seleccionar video (.mp4/.mov)
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/webm"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setLocalVideoFile(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          {localVideoFile && (
                            <div className="text-[11px] text-emerald-400 mt-1">
                              {localVideoFile.name} ({(localVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Initial Rotations (P1 to P6) */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>Alineación Inicial Titular (Set 1)</span>
                        <span className="text-amber-400 text-[10px]">P1 = Saque</span>
                      </div>

                      <div className="grid grid-cols-6 gap-1.5 text-center">
                        {[1, 2, 3, 4, 5, 6].map((pos, idx) => {
                          const currentNum = homeRotation[idx] || 1;
                          return (
                            <div key={`rot_pos_${pos}`} className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-mono block">P{pos}</span>
                              <select
                                value={currentNum}
                                onChange={(e) => {
                                  const newRot = [...homeRotation];
                                  newRot[idx] = parseInt(e.target.value, 10);
                                  setHomeRotation(newRot);
                                }}
                                className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-xs rounded px-1 py-0.5 mt-1 text-center"
                              >
                                {selectedHomeTeam?.players
                                  .filter((p) => p.position !== 'L')
                                  .map((p) => (
                                    <option key={p.id} value={p.number}>
                                      #{p.number}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* =========================================================================
            MODAL FOOTER CONTROLS: PRIMARY DOMINANT CTA + SECONDARY ACTIONS
            ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          
          {/* Back Button (Section 19: Permitir volver atrás sin perder información) */}
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* Forward / Final CTAs */}
          <div className="flex items-center gap-2">
            
            {/* Step 1 CTA */}
            {currentStep === 1 && (
              <div className="flex items-center gap-2">
                {selectedHomeTeam && selectedAwayTeam && (
                  <button
                    type="button"
                    onClick={handleQuickMatch}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
                    title="Crear directamente con valores habituales"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>[ Partido Rápido ]</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selectedHomeTeam) {
                      setCurrentStep(2);
                    }
                  }}
                  disabled={!selectedHomeTeam}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Continuar al Rival</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2 CTA */}
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedAwayTeam) {
                    setCurrentStep(3);
                  }
                }}
                disabled={!selectedAwayTeam}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Continuar a Fecha</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Step 3 CTA */}
            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Continuar a Plantilla</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Step 4 CTA */}
            {currentStep === 4 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedHomePlayerIds.length === 0) {
                    setRosterSide('home');
                    return;
                  }
                  if (selectedAwayPlayerIds.length === 0) {
                    setRosterSide('away');
                    return;
                  }
                  setCurrentStep(5);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Confirmar Plantilla</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Step 5 CTA: CREAR PARTIDO (Primary Dominant CTA - Section 8) */}
            {currentStep === 5 && (
              <button
                type="button"
                onClick={handleCreateMatchFinal}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-xl shadow-amber-500/25 flex items-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <Volleyball className="w-4 h-4 fill-current" />
                <span>[ CREAR PARTIDO ]</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
