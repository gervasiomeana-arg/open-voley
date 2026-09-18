import React, { useState, useEffect } from 'react';
import { MatchData, Player, ScoutCodeAction, TeamSide, ClientUser, TrialInfo, RallyDetection, UserRole } from './types';
import { sampleMatchData } from './data/sampleMatch';
import { ResearchTab } from './components/ResearchTab';
import { UnifiedTacticalHub } from './components/UnifiedTacticalHub';
import { BoxScoreReport } from './components/BoxScoreReport';
import { VideoSyncPlayer } from './components/VideoSyncPlayer';
import { VolleyStationAiEngine } from './components/VolleyStationAiEngine';
import { ExportImportModal } from './components/ExportImportModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { TrialExpiredScreen } from './components/TrialExpiredScreen';
import { TrialHeaderBadge } from './components/TrialHeaderBadge';
import { SubscriptionPlansModal } from './components/SubscriptionPlansModal';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { Sidebar, TabType } from './components/Sidebar';
import { MatchCenter } from './components/MatchCenter';
import { MatchPreparationModal } from './components/MatchPreparationModal';
import { FinishMatchModal } from './components/FinishMatchModal';
import { TeamsManagerModal } from './components/TeamsManagerModal';
import { NewMatchModal } from './components/NewMatchModal';
import { SavedMatchesModal } from './components/SavedMatchesModal';
import { QuickGuideModal } from './components/QuickGuideModal';
import { EliteAnalyticsHub } from './components/EliteAnalyticsHub';
import { HomeDashboard } from './components/HomeDashboard';
import { TeamsHub } from './components/TeamsHub';
import { SettingsHub } from './components/SettingsHub';
import { CompetitionCenter } from './components/CompetitionCenter';
import { TrainingCenter } from './components/TrainingCenter';
import { OpenAiCenter } from './components/OpenAiCenter';
import { Player360Modal } from './components/Player360Modal';
import { GlobalQuickActionModal } from './components/GlobalQuickActionModal';
import { GlobalCommandPalette } from './components/GlobalCommandPalette';
import { sampleCompetitions } from './data/sampleCompetitionAndTraining';
import { 
  getSavedTeams, 
  saveTeam, 
  SavedTeam, 
  getSavedMatches, 
  saveMatchRecord, 
  SavedMatchRecord,
  getCurrentMatch,
  saveCurrentMatch
} from './services/teamStorage';
import { getAuthenticatedSession, logoutAuthenticatedSession } from './services/authSession';
import { enrichActionsWithRallyContext } from './utils/rallyContext';
import { 
  Menu, 
  Download, 
  RotateCcw, 
  Volleyball,
  Sparkles,
  FileSearch,
  Terminal,
  BarChart2,
  Video,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Users,
  FolderKanban,
  Save,
  PlusCircle,
  Printer,
  TrendingUp,
  Home,
  Settings,
  Play,
  ArrowLeft,
  Trophy,
  Dumbbell,
  Activity
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [matchesSubTab, setMatchesSubTab] = useState<'center' | 'scout' | 'boxscore' | 'info'>('center');
  const [teamsSubTab, setTeamsSubTab] = useState<'rosters' | 'training'>('rosters');
  const [analysisSubTab, setAnalysisSubTab] = useState<'reports' | 'video'>('reports');
  const [aiSubTab, setAiSubTab] = useState<'coach' | 'telemetry'>('coach');

  // Player 360 modal state
  const [selectedPlayerFor360, setSelectedPlayerFor360] = useState<Player | null>(null);
  const [isPlayer360Open, setIsPlayer360Open] = useState(false);

  // Global Quick Action modal state ("+ CREAR")
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);

  // Global Command Palette state (⌘K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Role Management
  const [currentRole, setCurrentRole] = useState<UserRole>('Entrenador');

  // Training Focus problem transferred from AI Coach to Training Center
  const [trainingFocusProblem, setTrainingFocusProblem] = useState<string | undefined>(undefined);
  const [trainingEvidenceContext, setTrainingEvidenceContext] = useState<TrainingEvidenceContext | undefined>(undefined);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [isResearchUnlocked, setIsResearchUnlocked] = useState(false);
  const [match, setMatch] = useState<MatchData>(() => {
    const active = getCurrentMatch();
    return active || sampleMatchData;
  });
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [evidenceRallyIds, setEvidenceRallyIds] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isExistingClientMode, setIsExistingClientMode] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<{ message: string; planName?: string } | null>(null);

  // Workflow Modals State
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [isNewMatchModalOpen, setIsNewMatchModalOpen] = useState(false);
  const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
  const [isFinishMatchModalOpen, setIsFinishMatchModalOpen] = useState(false);
  const [isSavedMatchesModalOpen, setIsSavedMatchesModalOpen] = useState(false);
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState(false);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(() => getSavedTeams());
  const [savedMatches, setSavedMatches] = useState<SavedMatchRecord[]>(() => getSavedMatches());
  const [floatingToast, setFloatingToast] = useState<{ title: string; subtitle?: string } | null>(null);

  // Sync current active match to localStorage so Scout and all views always use currentMatch
  useEffect(() => {
    if (match) {
      saveCurrentMatch(match);
    }
  }, [match]);

  // Ensure entering OPEN AI reloads exactly the same persisted currentMatch from storage
  useEffect(() => {
    if (activeTab === 'ai') {
      const persisted = getCurrentMatch();
      if (persisted) {
        setMatch(persisted);
      }
    }
  }, [activeTab]);

  // Shared Video & Cuts State (Persists across tab switching and reloads)
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<string | null>(null);
  
  const [userCuts, setUserCuts] = useState<ScoutCodeAction[]>(() => {
    try {
      const stored = localStorage.getItem('openvoley_user_cuts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [aiRallies, setAiRallies] = useState<RallyDetection[]>(() => {
    try {
      const stored = localStorage.getItem('openvoley_ai_rallies');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync user cuts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('openvoley_user_cuts', JSON.stringify(userCuts));
    } catch (e) {
      console.warn('Could not save user cuts:', e);
    }
  }, [userCuts]);

  // Sync AI rallies to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('openvoley_ai_rallies', JSON.stringify(aiRallies));
    } catch (e) {
      console.warn('Could not save AI rallies:', e);
    }
  }, [aiRallies]);

  const handleSetVideoSrc = (src: string, fileName?: string, fileSize?: string) => {
    setVideoSrc(src);
    if (fileName !== undefined) setVideoFileName(fileName);
    if (fileSize !== undefined) setVideoFileSize(fileSize);
  };

  const handleAddUserCut = (cut: ScoutCodeAction) => {
    setUserCuts((prev) => [cut, ...prev]);
  };

  const handleDeleteUserCut = (id: string) => {
    setUserCuts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearUserCuts = () => {
    setUserCuts([]);
  };

  const handleAddAiRally = (rally: RallyDetection) => {
    setAiRallies((prev) => [rally, ...prev]);
  };

  const handleDeleteAiRally = (id: string) => {
    setAiRallies((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAiRallies = () => {
    setAiRallies([]);
  };

  // Authentication is server-authoritative. Browser storage is never accepted as identity.
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const syncVerifiedSession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentStatus =
        searchParams.get('payment_status') ||
        searchParams.get('collection_status') ||
        searchParams.get('status');
      const paymentId =
        searchParams.get('payment_id') ||
        searchParams.get('collection_id') ||
        searchParams.get('data.id');

      try {
        if (paymentStatus === 'approved' && paymentId) {
          const confirmation = await fetch('/api/mercadopago/confirm-payment', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId }),
          });

          const confirmationData = await confirmation.json().catch(() => ({}));
          if (!confirmation.ok) {
            console.warn('Mercado Pago confirmation was not completed:', confirmationData);
          } else if (!cancelled) {
            setPaymentSuccessToast({
              message: confirmationData.alreadyProcessed
                ? 'Pago verificado. Tu licencia ya estaba acreditada.'
                : `Pago verificado. Licencia acreditada${confirmationData.grantedDays ? ` +${confirmationData.grantedDays} días` : ''}.`,
              planName: confirmationData.plan || undefined,
            });
            window.setTimeout(() => setPaymentSuccessToast(null), 8000);
          }
        }

        const session = await getAuthenticatedSession();
        if (cancelled) return;

        if (session) {
          setCurrentUser(session.user);
          setTrialInfo(session.trial);
        } else {
          setCurrentUser(null);
          setTrialInfo(null);
        }
      } catch (error) {
        console.error('Could not synchronize verified OPEN VOLEY session:', error);
        if (!cancelled) {
          setCurrentUser(null);
          setTrialInfo(null);
        }
      } finally {
        if (paymentStatus) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    void syncVerifiedSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (user: ClientUser, trial: TrialInfo) => {
    // GoogleAuthModal obtains these values only from /api/auth/me after the HttpOnly
    // session cookie has been created and verified by the backend.
    setCurrentUser(user);
    setTrialInfo(trial);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    void logoutAuthenticatedSession().finally(() => {
      setCurrentUser(null);
      setTrialInfo(null);
      setShowAuthModal(false);
    });
  };

  // Handlers for scouting actions
  const handleAddAction = (action: ScoutCodeAction | ScoutCodeAction[]) => {
    const incomingActions = Array.isArray(action) ? action : [action];
    setMatch((prev) => {
      const newActions = enrichActionsWithRallyContext(prev.actions || [], incomingActions);
      const updatedActions = [...(prev.actions || []), ...newActions];
      const curSet = Math.max(1, prev.currentSet || 1);
      const setIdx = curSet - 1;
      const updatedSets = [...(prev.sets || [])];

      while (updatedSets.length <= setIdx) {
        updatedSets.push({
          setNumber: updatedSets.length + 1,
          scoreHome: 0,
          scoreAway: 0,
        });
      }
      updatedSets[setIdx] = { ...updatedSets[setIdx] };

      // Auto-increment score if any terminal action scored a point (#), direct error (=), or block point (/)
      for (const act of newActions) {
        if (act.evaluation === '#') {
          if (act.team === 'home') {
            updatedSets[setIdx].scoreHome = (updatedSets[setIdx].scoreHome || 0) + 1;
          } else {
            updatedSets[setIdx].scoreAway = (updatedSets[setIdx].scoreAway || 0) + 1;
          }
        } else if (act.evaluation === '=' || act.evaluation === '/') {
          if (act.team === 'home') {
            updatedSets[setIdx].scoreAway = (updatedSets[setIdx].scoreAway || 0) + 1;
          } else {
            updatedSets[setIdx].scoreHome = (updatedSets[setIdx].scoreHome || 0) + 1;
          }
        }
      }

      const updatedMatch = {
        ...prev,
        sets: updatedSets,
        actions: updatedActions,
      };

      try {
        saveCurrentMatch(updatedMatch);
        const saved = getSavedMatches();
        const existingIdx = saved.findIndex((m) => m.id === prev.id);
        if (existingIdx >= 0) {
          saveMatchRecord({
            ...saved[existingIdx],
            matchData: updatedMatch,
            actionsCount: updatedActions.length,
            updatedAt: new Date().toISOString(),
          });
          setSavedMatches(getSavedMatches());
        }
      } catch {
        // ignore
      }

      return updatedMatch;
    });
  };

  const handleDeleteAction = (id: string) => {
    setMatch((prev) => {
      const targetAction = (prev.actions || []).find((a) => a.id === id);
      const updatedActions = (prev.actions || []).filter((a) => a.id !== id);
      const curSet = Math.max(1, prev.currentSet || 1);
      const setIdx = curSet - 1;
      const updatedSets = [...(prev.sets || [])];

      if (updatedSets[setIdx] && targetAction) {
        updatedSets[setIdx] = { ...updatedSets[setIdx] };
        if (targetAction.evaluation === '#') {
          if (targetAction.team === 'home') {
            updatedSets[setIdx].scoreHome = Math.max(0, (updatedSets[setIdx].scoreHome || 0) - 1);
          } else {
            updatedSets[setIdx].scoreAway = Math.max(0, (updatedSets[setIdx].scoreAway || 0) - 1);
          }
        } else if (targetAction.evaluation === '=' || targetAction.evaluation === '/') {
          if (targetAction.team === 'home') {
            updatedSets[setIdx].scoreAway = Math.max(0, (updatedSets[setIdx].scoreAway || 0) - 1);
          } else {
            updatedSets[setIdx].scoreHome = Math.max(0, (updatedSets[setIdx].scoreHome || 0) - 1);
          }
        }
      }

      const updatedMatch = {
        ...prev,
        sets: updatedSets,
        actions: updatedActions,
      };

      try {
        saveCurrentMatch(updatedMatch);
        const saved = getSavedMatches();
        const existingIdx = saved.findIndex((m) => m.id === prev.id);
        if (existingIdx >= 0) {
          saveMatchRecord({
            ...saved[existingIdx],
            matchData: updatedMatch,
            actionsCount: updatedActions.length,
            updatedAt: new Date().toISOString(),
          });
          setSavedMatches(getSavedMatches());
        }
      } catch {
        // ignore
      }

      return updatedMatch;
    });
  };

  const handleScoreChange = (homeScore: number, awayScore: number) => {
    setMatch((prev) => {
      const curSet = Math.max(1, prev.currentSet || 1);
      const setIdx = curSet - 1;
      const updatedSets = [...(prev.sets || [])];

      while (updatedSets.length <= setIdx) {
        updatedSets.push({
          setNumber: updatedSets.length + 1,
          scoreHome: 0,
          scoreAway: 0,
        });
      }

      updatedSets[setIdx] = {
        ...updatedSets[setIdx],
        scoreHome: Math.max(0, homeScore),
        scoreAway: Math.max(0, awayScore),
      };

      const updatedMatch = {
        ...prev,
        sets: updatedSets,
      };

      try {
        saveCurrentMatch(updatedMatch);
        const saved = getSavedMatches();
        const existingIdx = saved.findIndex((m) => m.id === prev.id);
        if (existingIdx >= 0) {
          saveMatchRecord({
            ...saved[existingIdx],
            matchData: updatedMatch,
            actionsCount: (updatedMatch.actions || []).length,
            updatedAt: new Date().toISOString(),
          });
          setSavedMatches(getSavedMatches());
        }
      } catch {
        // ignore
      }

      return updatedMatch;
    });
  };

  const handleRotateTeam = (team: TeamSide) => {
    setMatch((prev) => {
      if (team === 'home') {
        const rot = [...prev.homeRotation];
        const last = rot.pop()!;
        rot.unshift(last);
        return { ...prev, homeRotation: rot };
      } else {
        const rot = [...prev.awayRotation];
        const last = rot.pop()!;
        rot.unshift(last);
        return { ...prev, awayRotation: rot };
      }
    });
  };

  const handleUpdatePlayers = (team: TeamSide, players: Player[]) => {
    setMatch((prev) => ({
      ...prev,
      [team === 'home' ? 'homePlayers' : 'awayPlayers']: players,
    }));
  };

  const handleUpdateTeamName = (team: TeamSide, newName: string) => {
    setMatch((prev) => ({
      ...prev,
      [team === 'home' ? 'homeTeamName' : 'awayTeamName']: newName,
    }));
  };

  const handleResetMatch = () => {
    setMatch(sampleMatchData);
    saveCurrentMatch(sampleMatchData);
    setFloatingToast({
      title: 'Partido reiniciado',
      subtitle: 'Se cargaron los datos de muestra iniciales (Argentina vs Chile)',
    });
  };

  // Workflow Handlers: New Match, Save Match, Load Match, Teams
  const handleBackToMatchCenter = () => {
    setActiveTab('match');
    setMatchesSubTab('center');
  };

  const handleMatchCenterNavigate = (destination: 'scout' | 'video' | 'stats' | 'ai') => {
    if (destination === 'scout') {
      setActiveTab('match');
      setMatchesSubTab('scout');
    } else if (destination === 'video') {
      setActiveTab('analysis');
      setAnalysisSubTab('video');
    } else if (destination === 'stats') {
      setActiveTab('match');
      setMatchesSubTab('boxscore');
    } else if (destination === 'ai') {
      const persisted = getCurrentMatch();
      if (persisted) {
        setMatch(persisted);
      }
      setActiveTab('ai');
    }
  };

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'ai') {
      const persisted = getCurrentMatch();
      if (persisted) {
        setMatch(persisted);
      }
    }
    setActiveTab(tab);
    if (tab === 'match') {
      setMatchesSubTab('center');
    }
  };

  const handleOpenPlayer360 = (player: Player) => {
    setSelectedPlayerFor360(player);
    setIsPlayer360Open(true);
  };

  const handleQuickAction = (actionKey: 'match' | 'training' | 'player' | 'team' | 'competition' | 'video') => {
    setIsQuickActionModalOpen(false);
    if (actionKey === 'match') {
      setIsNewMatchModalOpen(true);
    } else if (actionKey === 'training') {
      setActiveTab('team');
      setTeamsSubTab('training');
    } else if (actionKey === 'player' || actionKey === 'team') {
      setActiveTab('team');
      setTeamsSubTab('rosters');
    } else if (actionKey === 'competition') {
      setActiveTab('competition');
    } else if (actionKey === 'video') {
      setActiveTab('analysis');
      setAnalysisSubTab('video');
    }
  };

  const handleCommandNavigate = (tab: TabType) => {
    setActiveTab(tab);
    setIsCommandPaletteOpen(false);
  };

  const handleStartNewMatch = (
    newMatch: MatchData,
    videoConfig: { src: string; fileName?: string; fileSize?: string }
  ) => {
    setMatch(newMatch);
    saveCurrentMatch(newMatch);
    if (videoConfig.src) {
      setVideoSrc(videoConfig.src);
      setVideoFileName(videoConfig.fileName || null);
      setVideoFileSize(videoConfig.fileSize || null);
    }
    setSelectedActionId(null);
    setActiveTab('match');
    setMatchesSubTab('scout');
    setIsNewMatchModalOpen(false);

    try {
      saveMatchRecord({
        id: newMatch.id,
        title: `${newMatch.homeTeamName} vs ${newMatch.awayTeamName}`,
        date: newMatch.date,
        competition: newMatch.competition,
        homeTeamName: newMatch.homeTeamName,
        awayTeamName: newMatch.awayTeamName,
        finalScore: '0-0 (En curso)',
        videoFileName: videoConfig.fileName,
        videoSrc: videoConfig.src,
        matchData: newMatch,
        updatedAt: new Date().toISOString(),
      });
      setSavedMatches(getSavedMatches());
    } catch {
      // ignore
    }

    setFloatingToast({
      title: '¡Partido Iniciado!',
      subtitle: `${newMatch.homeTeamName} vs ${newMatch.awayTeamName} - Scouting en Cancha Activo`,
    });
  };

  const handleSavePreparation = (data: {
    homeRotation: number[];
    awayRotation: number[];
    serverTeam: TeamSide;
    serverPlayerNum: number;
    startScoutingImmediately?: boolean;
  }) => {
    setMatch((prev) => ({
      ...prev,
      homeRotation: data.homeRotation,
      awayRotation: data.awayRotation,
      server: {
        team: data.serverTeam,
        playerNum: data.serverPlayerNum,
      },
      isPrepared: true,
      status: 'in_progress',
    }));
    setIsPreparationModalOpen(false);

    if (data.startScoutingImmediately) {
      setActiveTab('match');
      setMatchesSubTab('scout');
    }

    setFloatingToast({
      title: '¡Partido Preparado!',
      subtitle: `Saque inicial: ${data.serverTeam === 'home' ? match.homeTeamName : match.awayTeamName} #${data.serverPlayerNum}`,
    });
  };

  const handleConfirmFinishMatch = (winner: TeamSide) => {
    setMatch((prev) => ({
      ...prev,
      isFinished: true,
      winner,
      status: 'finished',
    }));
    setIsFinishMatchModalOpen(false);
    setFloatingToast({
      title: '¡Partido Finalizado!',
      subtitle: `Ganador: ${winner === 'home' ? match.homeTeamName : match.awayTeamName}`,
    });
    handleSaveCurrentMatch();
  };

  const handleReopenMatch = () => {
    setMatch((prev) => ({
      ...prev,
      isFinished: false,
      winner: undefined,
      status: 'in_progress',
    }));
    setFloatingToast({
      title: 'Partido Reabierto',
      subtitle: 'El partido ha vuelto a estado activo.',
    });
  };

  const handleSaveCurrentMatch = () => {
    try {
      const currentScoreStr = match.sets && match.sets.length > 0
        ? `${match.sets[match.currentSet - 1]?.scoreHome || 0}-${match.sets[match.currentSet - 1]?.scoreAway || 0}`
        : '0-0';

      saveMatchRecord({
        id: match.id || `match_${Date.now()}`,
        title: `${match.homeTeamName} vs ${match.awayTeamName}`,
        date: match.date || new Date().toISOString().split('T')[0],
        competition: match.competition || 'Torneo Oficial',
        homeTeamName: match.homeTeamName,
        awayTeamName: match.awayTeamName,
        finalScore: currentScoreStr,
        videoFileName: videoFileName || undefined,
        videoSrc: videoSrc || undefined,
        matchData: match,
        updatedAt: new Date().toISOString(),
      });

      setSavedMatches(getSavedMatches());
      setFloatingToast({
        title: '¡Partido Guardado con Éxito!',
        subtitle: `Puedes continuar cuando quieras o iniciar el siguiente partido.`,
      });
    } catch (e) {
      console.error('Error saving match:', e);
      setFloatingToast({
        title: 'Error al guardar partido',
        subtitle: 'Intenta nuevamente.',
      });
    }
  };

  const handleLoadSavedMatch = (record: SavedMatchRecord) => {
    setMatch(record.matchData);
    saveCurrentMatch(record.matchData);
    if (record.videoSrc) {
      setVideoSrc(record.videoSrc);
    }
    if (record.videoFileName) {
      setVideoFileName(record.videoFileName);
    }
    setIsSavedMatchesModalOpen(false);
    setActiveTab('match');
    setMatchesSubTab('center');
    setFloatingToast({
      title: 'Partido Cargado',
      subtitle: `${record.homeTeamName} vs ${record.awayTeamName} cargado en el Centro del Partido.`,
    });
  };

  const handleRefreshTeams = () => {
    setSavedTeams(getSavedTeams());
  };

  const handleZoneClick = (zone: number, team: TeamSide) => {
    setActiveTab('match');
    setMatchesSubTab('scout');
  };

  const handleSelectTeamForMatch = (team: SavedTeam, side: TeamSide) => {
    if (side === 'home') {
      setMatch((prev) => ({
        ...prev,
        homeTeamName: team.name,
        homePlayers: team.players.map((p) => ({ ...p, team: 'home' })),
      }));
      setFloatingToast({
        title: 'Equipo Local Asignado',
        subtitle: `${team.name} asignado como Local con sus ${team.players.length} jugadores.`,
      });
    } else {
      setMatch((prev) => ({
        ...prev,
        awayTeamName: team.name,
        awayPlayers: team.players.map((p) => ({ ...p, team: 'away' })),
      }));
      setFloatingToast({
        title: 'Equipo Visitante Asignado',
        subtitle: `${team.name} asignado como Visitante con sus ${team.players.length} jugadores.`,
      });
    }
  };

  // Tab Titles map for top bar
  const tabTitles: Record<TabType, { title: string; subtitle: string; icon: any; color: string }> = {
    home: {
      title: '1. Inicio',
      subtitle: 'Panel central de partido activo, accesos directos y estado de la plataforma',
      icon: Home,
      color: 'text-amber-400',
    },
    team: {
      title: '2. Equipo & Planteles',
      subtitle: 'Gestión de planteles propios, clubes rivales, fichas Player 360° y entrenamientos',
      icon: Users,
      color: 'text-cyan-400',
    },
    competition: {
      title: '3. Competición',
      subtitle: 'Gestión de torneos, fixtures de partidos, sedes y tablas oficiales de posiciones',
      icon: Trophy,
      color: 'text-amber-400',
    },
    match: {
      title: matchesSubTab === 'center' ? '4. Centro del Partido' : '4. Partido',
      subtitle: matchesSubTab === 'center'
        ? `${match.homeTeamName} vs ${match.awayTeamName} • Hub de mando, scouting en vivo, video, estadísticas e IA`
        : 'Cancha 2D táctica, consola de scouting en vivo, planilla oficial FIVB e información',
      icon: Volleyball,
      color: 'text-orange-400',
    },
    analysis: {
      title: '5. Análisis & Video',
      subtitle: 'Informes tácticos de élite, distribución de armador, scouting de saque y video sincronizado HD',
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    ai: {
      title: '6. OPEN AI Coach',
      subtitle: 'Visión artificial, telemetría, detección automática de rallies y asistente táctico interactivo',
      icon: Sparkles,
      color: 'text-purple-400',
    },
    settings: {
      title: '7. Configuración',
      subtitle: 'Preferencias de scouting, exportaciones oficiales .DVW, respaldos y cuenta',
      icon: Settings,
      color: 'text-slate-400',
    },
  };

  const currentTabMeta = tabTitles[activeTab] || tabTitles.home;
  const CurrentTabIcon = currentTabMeta.icon;

  const mobileNavItems: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'competition', label: 'Torneos', icon: Trophy },
    { id: 'match', label: 'Partido', icon: Volleyball },
    { id: 'analysis', label: 'Análisis', icon: TrendingUp },
    { id: 'ai', label: 'OPEN AI', icon: Sparkles },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  // ==========================================
  // IF USER IS NOT LOGGED IN -> SHOW WELCOME LANDING PAGE
  // ==========================================
  if (!currentUser) {
    return (
      <>
        <WelcomeLandingPage
          onStartFreeTrial={() => {
            setIsExistingClientMode(false);
            setShowAuthModal(true);
          }}
          onClientLogin={() => {
            setIsExistingClientMode(true);
            setShowAuthModal(true);
          }}
          onOpenPlansModal={() => setIsPlansModalOpen(true)}
        />

        {/* Google Authentication Modal */}
        {showAuthModal && (
          <GoogleAuthModal
            onLoginSuccess={handleLoginSuccess}
            onClose={() => setShowAuthModal(false)}
            isExistingClientLogin={isExistingClientMode}
          />
        )}

        {/* Subscription Plans Modal */}
        <SubscriptionPlansModal
          isOpen={isPlansModalOpen}
          onClose={() => setIsPlansModalOpen(false)}
          currentUser={currentUser}
          trialInfo={trialInfo}
        />
      </>
    );
  }

  const currentSetData = (match.sets && match.sets[match.currentSet - 1]) || { scoreHome: 0, scoreAway: 0 };
  const homeSetsWon = match.sets ? match.sets.filter((s) => s.winner === 'home').length : 0;
  const awaySetsWon = match.sets ? match.sets.filter((s) => s.winner === 'away').length : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Left Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        currentUser={currentUser}
        trialInfo={trialInfo}
        currentRole={currentRole}
        onChangeRole={(role) => setCurrentRole(role)}
        onLogout={handleLogout}
        onOpenPlans={() => setIsPlansModalOpen(true)}
        onOpenNewMatch={() => setIsNewMatchModalOpen(true)}
        onOpenQuickAction={() => setIsQuickActionModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area Wrapper - Adjusts with Sidebar width */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-60'
        }`}
      >
        {/* Floating Toast Notification */}
        {floatingToast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-amber-400">{floatingToast.title}</div>
              {floatingToast.subtitle && (
                <div className="text-[11px] text-slate-300">{floatingToast.subtitle}</div>
              )}
            </div>
            <button
              onClick={() => setFloatingToast(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Payment Success Floating Toast Notification */}
        {paymentSuccessToast && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-300 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
            <div>
              <div className="font-black text-xs uppercase tracking-wide">¡Pago de Mercado Pago Aprobado!</div>
              <div className="text-xs font-medium">{paymentSuccessToast.message}</div>
            </div>
            <button
              onClick={() => setPaymentSuccessToast(null)}
              className="p-1 hover:bg-emerald-600 rounded-lg text-slate-950 font-black ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
          <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
            
            {/* Left: Mobile Toggle & Current View Breadcrumb */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 border border-slate-700 transition min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Abrir menú completo de navegación"
                aria-label="Abrir menú lateral"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="p-1.5 sm:p-2 bg-slate-800 rounded-xl border border-slate-700/60 hidden sm:flex shrink-0">
                  <CurrentTabIcon className={`w-4 h-4 ${currentTabMeta.color}`} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-extrabold text-xs sm:text-base tracking-tight text-white truncate">
                    {currentTabMeta.title}
                  </h1>
                  <p className="text-[11px] text-slate-400 hidden md:block truncate">
                    {currentTabMeta.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions & User Trial Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {currentUser && trialInfo && (
                <TrialHeaderBadge
                  user={currentUser}
                  trial={trialInfo}
                  onLogout={handleLogout}
                  onOpenPlans={() => setIsPlansModalOpen(true)}
                />
              )}

              {/* Botón Principal: + Nuevo Partido */}
              <button
                onClick={() => setIsNewMatchModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                title="Configurar y arrancar un nuevo partido"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>+ Nuevo Partido</span>
              </button>

              {/* Botón de Ayuda */}
              <button
                onClick={() => setIsQuickGuideOpen(true)}
                className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-black text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 border border-indigo-500/50 shadow-sm transition cursor-pointer"
                title="¿Cómo funciona? Guía y ayuda interactiva"
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
                <span className="hidden sm:inline">Ayuda</span>
              </button>
            </div>
          </div>
        </header>

        {/* Barra Superior Contextual del Partido: Discreta, informativa, con retorno rápido [ ← Centro del Partido ] */}
        {!(activeTab === 'match' && matchesSubTab === 'center') && (
          <div className="bg-slate-900 border-b border-amber-500/30 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 shadow-md sticky top-[53px] sm:top-[57px] z-20 backdrop-blur-md">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-white truncate">
                <span className="truncate">{match.homeTeamName}</span>
                <span className="font-mono text-amber-400 px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 text-xs font-black">
                  {homeSetsWon} - {awaySetsWon}
                </span>
                <span className="truncate">{match.awayTeamName}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <span>•</span>
                <span className="text-amber-400 font-bold">SET {match.currentSet}</span>
                <span>({currentSetData.scoreHome} - {currentSetData.scoreAway})</span>
                <span className="text-slate-500 hidden md:inline">• {match.actions?.length || 0} jugadas</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleBackToMatchCenter}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white font-black text-xs px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Volver a la pantalla principal del Centro del Partido"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Centro del Partido</span>
              </button>

              {!(activeTab === 'match' && matchesSubTab === 'scout') && (
                <button
                  onClick={() => {
                    setActiveTab('match');
                    setMatchesSubTab('scout');
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer hidden md:flex shadow-sm shadow-amber-500/20"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Scout</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Main Content */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-[1600px] mx-auto pb-24 lg:pb-8">
          
          {/* TAB 1: INICIO */}
          {activeTab === 'home' && (
            <HomeDashboard
              match={match}
              savedMatches={savedMatches}
              savedTeams={savedTeams}
              onContinueScouting={() => {
                setActiveTab('match');
                setMatchesSubTab('scout');
              }}
              onOpenMatchCenter={() => {
                setActiveTab('match');
                setMatchesSubTab('center');
              }}
              onOpenBoxScore={() => {
                setActiveTab('match');
                setMatchesSubTab('boxscore');
              }}
              onOpenAnalytics={() => {
                setActiveTab('analysis');
                setAnalysisSubTab('reports');
              }}
              onOpenVideo={() => {
                setActiveTab('analysis');
                setAnalysisSubTab('video');
              }}
              onOpenAi={() => {
                const persisted = getCurrentMatch();
                if (persisted) {
                  setMatch(persisted);
                }
                setActiveTab('ai');
                setAiSubTab('coach');
              }}
              onOpenNewMatch={() => setIsNewMatchModalOpen(true)}
              onOpenTeams={() => {
                setActiveTab('team');
                setTeamsSubTab('rosters');
              }}
              onLoadSavedMatch={handleLoadSavedMatch}
            />
          )}

          {/* TAB 4: PARTIDO */}
          {activeTab === 'match' && (
            <div className="space-y-4">
              {/* Sub-bar for Matches: Centro del Partido, Cancha 2D / Scouting en vivo, Planilla Oficial FIVB, Info del Partido */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setMatchesSubTab('center')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      matchesSubTab === 'center'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Volleyball className="w-4 h-4" />
                    <span>Centro del Partido</span>
                  </button>

                  <button
                    onClick={() => setMatchesSubTab('scout')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      matchesSubTab === 'scout'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Cancha 2D & Scouting en Vivo</span>
                  </button>

                  <button
                    onClick={() => setMatchesSubTab('boxscore')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      matchesSubTab === 'boxscore'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Planilla Oficial FIVB P2</span>
                  </button>

                  <button
                    onClick={() => setMatchesSubTab('info')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      matchesSubTab === 'info'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" />
                    <span>Información & Historial</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveCurrentMatch}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                    title="Guardar partido en historial"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guardar Partido</span>
                  </button>

                  <button
                    onClick={() => setIsNewMatchModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nuevo Partido</span>
                  </button>
                </div>
              </div>

              {/* Sub-view 1: CENTRO DEL PARTIDO (Vista general y comando central del partido) */}
              {matchesSubTab === 'center' && (
                <MatchCenter
                  match={match}
                  onNavigateTo={handleMatchCenterNavigate}
                  onOpenNewMatch={() => setIsNewMatchModalOpen(true)}
                  onOpenSavedMatches={() => setIsSavedMatchesModalOpen(true)}
                  onSaveMatch={handleSaveCurrentMatch}
                  onOpenPreparation={() => setIsPreparationModalOpen(true)}
                  onOpenFinishMatch={() => setIsFinishMatchModalOpen(true)}
                  onReopenMatch={handleReopenMatch}
                />
              )}

              {/* Sub-view 2: Live Scouting on 2D Court */}
              {matchesSubTab === 'scout' && (
                <UnifiedTacticalHub
                  key={match.id}
                  match={match}
                  onAddAction={handleAddAction}
                  onDeleteAction={handleDeleteAction}
                  onScoreChange={handleScoreChange}
                  onSetScoreWinner={() => {}}
                  onRotateTeam={handleRotateTeam}
                  onUpdatePlayers={handleUpdatePlayers}
                  onUpdateTeamName={handleUpdateTeamName}
                  selectedActionId={selectedActionId}
                  onSelectAction={(id) => setSelectedActionId(id)}
                  handleZoneClick={handleZoneClick}
                  onOpenNewMatch={() => setIsNewMatchModalOpen(true)}
                  onOpenTeamsManager={() => {
                    setActiveTab('team');
                    setTeamsSubTab('rosters');
                  }}
                  onOpenHelp={() => setIsQuickGuideOpen(true)}
                  onSaveMatch={handleSaveCurrentMatch}
                  onBackToMatchCenter={handleBackToMatchCenter}
                />
              )}

              {/* Sub-view 3: FIVB Boxscore P2 */}
              {matchesSubTab === 'boxscore' && (
                <BoxScoreReport 
                  match={match} 
                  onOpenNewMatch={() => setIsNewMatchModalOpen(true)}
                  onBackToMatchCenter={handleBackToMatchCenter}
                />
              )}

              {/* Sub-view: Match Info & History */}
              {matchesSubTab === 'info' && (
                <div className="space-y-6">
                  {/* Current Match Info Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Partido Activo</div>
                        <h3 className="text-2xl font-black text-white">{match.homeTeamName} vs {match.awayTeamName}</h3>
                        <p className="text-xs text-slate-400">{match.competition} • {match.category} • Fecha: {match.date}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMatchesSubTab('scout')}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Ir al Scouting en Cancha</span>
                        </button>
                        <button
                          onClick={() => setIsExportModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition"
                        >
                          <Download className="w-4 h-4" />
                          <span>Exportar .DVW</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                        <div className="text-[11px] text-slate-400 font-bold uppercase">Marcador de Sets</div>
                        <div className="text-2xl font-black text-amber-400 font-mono mt-1">{homeSetsWon} - {awaySetsWon}</div>
                      </div>

                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                        <div className="text-[11px] text-slate-400 font-bold uppercase">Set Actual</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">Set {match.currentSet}</div>
                      </div>

                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                        <div className="text-[11px] text-slate-400 font-bold uppercase">Puntos del Set</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">{currentSetData.scoreHome} - {currentSetData.scoreAway}</div>
                      </div>

                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                        <div className="text-[11px] text-slate-400 font-bold uppercase">Jugadas Registradas</div>
                        <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{match.actions?.length || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Saved Matches History */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-amber-400" />
                        <span>Historial de Partidos Guardados</span>
                      </h4>
                      <button
                        onClick={() => setIsSavedMatchesModalOpen(true)}
                        className="text-xs text-amber-400 font-bold hover:underline"
                      >
                        Abrir gestor completo ({savedMatches.length})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {savedMatches.slice(0, 6).map((m) => (
                        <div
                          key={m.id}
                          className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 rounded-2xl transition space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{m.date}</span>
                              <span className="font-mono font-bold text-amber-400">{m.finalScore}</span>
                            </div>
                            <div className="font-bold text-white text-sm mt-1">{m.title}</div>
                            <div className="text-[11px] text-slate-400">{m.competition}</div>
                          </div>

                          <button
                            onClick={() => handleLoadSavedMatch(m)}
                            className="w-full mt-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs py-2 rounded-xl border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Cargar este Partido</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EQUIPO & PLANTELES */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setTeamsSubTab('rosters')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      teamsSubTab === 'rosters'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Planteles & Jugadores</span>
                  </button>
                  <button
                    onClick={() => setTeamsSubTab('training')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      teamsSubTab === 'training'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Entrenamientos & Ejercicios</span>
                    {trainingFocusProblem && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </button>
                </div>
              </div>

              {teamsSubTab === 'rosters' ? (
                <TeamsHub
                  teams={savedTeams}
                  onTeamsUpdated={(updated) => setSavedTeams(updated)}
                  onSelectForMatch={handleSelectTeamForMatch}
                  onOpenPlayer360={handleOpenPlayer360}
                />
              ) : (
                <TrainingCenter
                  match={match}
                  initialFocusProblem={trainingFocusProblem}
                  evidenceContext={trainingEvidenceContext}
                  onNavigateToMatch={() => {
                    setActiveTab('match');
                    setMatchesSubTab('scout');
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 3: COMPETICIÓN */}
          {activeTab === 'competition' && (
            <CompetitionCenter
              onOpenMatch={(matchId) => {
                setActiveTab('match');
                setMatchesSubTab('center');
              }}
              onOpenTeamRoster={(teamName) => {
                setActiveTab('team');
                setTeamsSubTab('rosters');
              }}
            />
          )}

          {/* TAB 5: ANÁLISIS & VIDEO */}
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setAnalysisSubTab('reports')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      analysisSubTab === 'reports'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Informes Tácticos de Élite</span>
                  </button>
                  <button
                    onClick={() => setAnalysisSubTab('video')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      analysisSubTab === 'video'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Sincronizado & Cortes</span>
                    {userCuts.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-emerald-950/70 text-emerald-300 rounded text-[10px] font-mono">
                        {userCuts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {analysisSubTab === 'reports' ? (
                <EliteAnalyticsHub
                  match={match}
                  currentMatch={match}
                  onOpenNewMatch={() => setIsNewMatchModalOpen(true)}
                />
              ) : (
                <VideoSyncPlayer
                  actions={match.actions}
                  videoSrc={videoSrc}
                  onSetVideoSrc={handleSetVideoSrc}
                  uploadedFileName={videoFileName}
                  uploadedFileSize={videoFileSize}
                  userCuts={userCuts}
                  onAddCut={handleAddUserCut}
                  onDeleteCut={handleDeleteUserCut}
                  onClearCuts={handleClearUserCuts}
                  match={match}
                  focusRallyIds={evidenceRallyIds}
                />
              )}
            </div>
          )}

          {/* TAB 6: OPEN AI */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setAiSubTab('coach')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      aiSubTab === 'coach'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>OPEN AI Coach & Asistente</span>
                  </button>
                  <button
                    onClick={() => setAiSubTab('telemetry')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
                      aiSubTab === 'telemetry'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Visión Artificial & Telemetría</span>
                    {aiRallies.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 rounded text-[10px] font-mono">
                        {aiRallies.length} rallies
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {aiSubTab === 'coach' ? (
                <OpenAiCenter
                  match={match}
                  currentMatch={match}
                  onGenerateTraining={(context) => {
                    setTrainingEvidenceContext(context);
                    setTrainingFocusProblem(context.description);
                    setActiveTab('team');
                    setTeamsSubTab('training');
                  }}
                  onOpenVideoClips={(rallyIds) => {
                    setEvidenceRallyIds(rallyIds || []);
                    setActiveTab('analysis');
                    setAnalysisSubTab('video');
                  }}
                  onOpenTactics={() => {
                    setActiveTab('analysis');
                    setAnalysisSubTab('reports');
                  }}
                  onOpenPlayer360={(playerNum) => {
                    const pl = [...match.homePlayers, ...match.awayPlayers].find((p) => p.number === playerNum);
                    if (pl) handleOpenPlayer360(pl);
                  }}
                />
              ) : (
                <VolleyStationAiEngine
                  match={match}
                  videoSrc={videoSrc}
                  onSetVideoSrc={handleSetVideoSrc}
                  uploadedFileName={videoFileName}
                  detectedRallies={aiRallies}
                  onAddRally={handleAddAiRally}
                  onDeleteRally={handleDeleteAiRally}
                  onClearRallies={handleClearAiRallies}
                  userCuts={userCuts}
                  onJumpToTimestamp={(sec) => {
                    setActiveTab('analysis');
                    setAnalysisSubTab('video');
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 7: CONFIGURACIÓN */}
          {activeTab === 'settings' && (
            <SettingsHub
              match={match}
              currentUser={currentUser}
              trialInfo={trialInfo}
              onLogout={handleLogout}
              onOpenPlans={() => setIsPlansModalOpen(true)}
              onOpenHelp={() => setIsQuickGuideOpen(true)}
              onResetMatch={handleResetMatch}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              isResearchUnlocked={isResearchUnlocked}
              onUnlockResearchSuccess={() => setIsResearchUnlocked(true)}
            />
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar (Thumb friendly for mobile devices) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[58px] min-h-[46px] ${
                  isActive
                    ? item.id === 'ai'
                      ? 'text-purple-400 font-black'
                      : 'text-amber-400 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition-transform ${
                  isActive 
                    ? item.id === 'ai' 
                      ? 'bg-purple-500/20 scale-110' 
                      : 'bg-amber-500/20 scale-110' 
                    : ''
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 hidden lg:flex">
          <p>OPEN VOLEY - Plataforma Profesional de Scouting y Análisis Táctico FIVB & Motor Táctico AI</p>
          <p className="text-[11px] text-slate-600">Desarrollado por <strong className="text-slate-400">NEXUS</strong></p>
        </footer>
      </div>

      {/* DVW Export Modal */}
      <ExportImportModal
        match={match}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* 7-Day Trial Expired Lockout Screen */}
      {currentUser && trialInfo && (trialInfo.isExpired || trialInfo.daysRemaining <= 0 || currentUser.isBlocked) && (
        <TrialExpiredScreen
          user={currentUser}
          trial={trialInfo}
          onLogout={handleLogout}
          onExtendSuccess={(updatedUser, updatedTrial) => {
            setCurrentUser(updatedUser);
            setTrialInfo(updatedTrial);
          }}
        />
      )}

      {/* Mercado Pago Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        currentUser={currentUser}
        trialInfo={trialInfo}
        onPaymentSuccess={(updatedUser, updatedTrial) => {
          setCurrentUser(updatedUser);
          setTrialInfo(updatedTrial);
          setIsPlansModalOpen(false);
          setPaymentSuccessToast({
            message: '¡Licencia extendida exitosamente!',
          });
          setTimeout(() => setPaymentSuccessToast(null), 6000);
        }}
      />

      {/* 1. Teams Manager Modal (Biblioteca de Equipos Propios y Rivales) */}
      {isTeamsModalOpen && (
        <TeamsManagerModal
          isOpen={isTeamsModalOpen}
          onClose={() => setIsTeamsModalOpen(false)}
          teams={savedTeams}
          onSelectForMatch={(team, side) => {
            setIsTeamsModalOpen(false);
            setIsNewMatchModalOpen(true);
          }}
          onTeamsUpdated={handleRefreshTeams}
        />
      )}

      {/* 2. New Match Setup Wizard Modal (Asistente Simplificado Paso 5) */}
      {isNewMatchModalOpen && (
        <NewMatchModal
          isOpen={isNewMatchModalOpen}
          onClose={() => setIsNewMatchModalOpen(false)}
          savedTeams={savedTeams}
          recentMatches={savedMatches}
          onTeamsUpdated={handleRefreshTeams}
          onStartMatch={handleStartNewMatch}
          onOpenTeamsManager={() => {
            setIsNewMatchModalOpen(false);
            setIsTeamsModalOpen(true);
          }}
        />
      )}

      {/* 3. Saved Matches History Modal (Historial & Carga) */}
      {isSavedMatchesModalOpen && (
        <SavedMatchesModal
          isOpen={isSavedMatchesModalOpen}
          onClose={() => setIsSavedMatchesModalOpen(false)}
          matches={savedMatches}
          onMatchesUpdated={(updated) => setSavedMatches(updated)}
          onLoadMatch={handleLoadSavedMatch}
          onOpenNewMatch={() => {
            setIsSavedMatchesModalOpen(false);
            setIsNewMatchModalOpen(true);
          }}
        />
      )}

      {/* 4. Quick Guide & Help Modal (Botón de Ayuda con Guía Paso a Paso) */}
      {isQuickGuideOpen && (
        <QuickGuideModal
          isOpen={isQuickGuideOpen}
          onClose={() => setIsQuickGuideOpen(false)}
          onOpenNewMatch={() => {
            setIsQuickGuideOpen(false);
            setIsNewMatchModalOpen(true);
          }}
          onOpenTeamsManager={() => {
            setIsQuickGuideOpen(false);
            setIsTeamsModalOpen(true);
          }}
        />
      )}

      {/* 5. Global Command Palette (⌘K) */}
      {isCommandPaletteOpen && (
        <GlobalCommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={handleCommandNavigate}
          onOpenNewMatch={() => setIsNewMatchModalOpen(true)}
          onOpenNewTraining={() => {
            setActiveTab('team');
            setTeamsSubTab('training');
          }}
          onOpenUploadVideo={() => {
            setActiveTab('analysis');
            setAnalysisSubTab('video');
          }}
          onSelectPlayer={(p) => handleOpenPlayer360(p)}
          players={[...(match.homePlayers || []), ...(match.awayPlayers || [])]}
          match={match}
          competitions={sampleCompetitions}
        />
      )}

      {/* 6. Global Quick Action Modal ("+ CREAR") */}
      {isQuickActionModalOpen && (
        <GlobalQuickActionModal
          isOpen={isQuickActionModalOpen}
          onClose={() => setIsQuickActionModalOpen(false)}
          onAction={handleQuickAction}
        />
      )}

      {/* 7. Player 360° Profile Modal */}
      {isPlayer360Open && selectedPlayerFor360 && (
        <Player360Modal
          player={selectedPlayerFor360}
          isOpen={isPlayer360Open}
          onClose={() => {
            setIsPlayer360Open(false);
            setSelectedPlayerFor360(null);
          }}
          match={match}
          onPlayClip={() => {
            setIsPlayer360Open(false);
            setActiveTab('analysis');
            setAnalysisSubTab('video');
          }}
          onGenerateSpecificTraining={(problem) => {
            setIsPlayer360Open(false);
            setTrainingFocusProblem(problem);
            setActiveTab('team');
            setTeamsSubTab('training');
          }}
        />
      )}

      {/* 8. Match Preparation Wizard Modal */}
      {isPreparationModalOpen && (
        <MatchPreparationModal
          isOpen={isPreparationModalOpen}
          onClose={() => setIsPreparationModalOpen(false)}
          match={match}
          onSavePreparation={handleSavePreparation}
        />
      )}

      {/* 9. Finish Match Modal */}
      {isFinishMatchModalOpen && (
        <FinishMatchModal
          isOpen={isFinishMatchModalOpen}
          onClose={() => setIsFinishMatchModalOpen(false)}
          match={match}
          onConfirmFinish={handleConfirmFinishMatch}
        />
      )}
    </div>
  );
}
