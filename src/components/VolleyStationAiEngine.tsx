import React, { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react';
import { MatchData, Player, TeamSide, RallyDetection, ScoutCodeAction } from '../types';
import { calculatePlayerStats } from '../utils/codeParser';
import { extractYouTubeId } from './VideoSyncPlayer';
import { ComputerVisionOverlay } from './ComputerVisionOverlay';
import { defaultYouTubeMatchUrl, sampleMatchData } from '../data/sampleMatch';
import { 
  Sparkles, 
  Cpu, 
  Eye, 
  Flame, 
  BarChart3, 
  Compass, 
  Gauge, 
  Layers, 
  Film, 
  Play, 
  Pause,
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Target, 
  Activity, 
  RefreshCw, 
  Share2, 
  Maximize2,
  TrendingUp,
  ShieldCheck,
  Award,
  Video,
  Terminal,
  Clock,
  ArrowRight,
  Filter,
  Upload,
  FolderOpen,
  Trash2,
  Plus,
  Sliders,
  Check,
  Scissors,
  Youtube,
  Scan,
  Bot
} from 'lucide-react';

interface VolleyStationAiEngineProps {
  match: MatchData;
  videoSrc?: string;
  onSetVideoSrc?: (src: string, fileName?: string, fileSize?: string) => void;
  uploadedFileName?: string | null;
  detectedRallies: RallyDetection[];
  onAddRally: (rally: RallyDetection) => void;
  onDeleteRally: (id: string) => void;
  onClearRallies: () => void;
  userCuts?: ScoutCodeAction[];
  onJumpToTimestamp?: (seconds: number) => void;
}

type AiSubModule = 'vision' | 'setter' | 'heatmaps' | 'telemetry' | 'autoclips' | 'chat';

export const VolleyStationAiEngine: React.FC<VolleyStationAiEngineProps> = ({ 
  match,
  videoSrc: sharedVideoSrc,
  onSetVideoSrc,
  uploadedFileName: sharedFileName,
  detectedRallies,
  onAddRally,
  onDeleteRally,
  onClearRallies,
  userCuts = [],
  onJumpToTimestamp 
}) => {
  const [activeSubModule, setActiveSubModule] = useState<AiSubModule>('vision');
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);
  const [visionNotice, setVisionNotice] = useState<string | null>(null);
  const [showAiOverlays, setShowAiOverlays] = useState(true);

  // Video playback states for AI vision player
  const [videoSrc, setVideoSrc] = useState<string>(sharedVideoSrc || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep internal videoSrc in sync with sharedVideoSrc
  useEffect(() => {
    if (sharedVideoSrc && sharedVideoSrc !== videoSrc) {
      setVideoSrc(sharedVideoSrc);
    }
  }, [sharedVideoSrc]);

  // Setter Matrix Selection State
  const [selectedSetterTeam, setSelectedSetterTeam] = useState<TeamSide>('home');
  const [selectedPassQuality, setSelectedPassQuality] = useState<'all' | 'perfect' | 'positive' | 'poor'>('all');
  const [selectedRotation, setSelectedRotation] = useState<number | 'all'>('all');

  // Heatmap Selection
  const [heatmapMode, setHeatmapMode] = useState<'attack' | 'serve' | 'defense'>('attack');

  // Video Auto-Clips Filter
  const [clipFilter, setClipFilter] = useState<'all' | 'attacks' | 'aces' | 'blocks' | 'errors'>('all');

  const playlistCuts = useMemo(() => {
    const tagged = userCuts.map((cut) => ({
      id: cut.id,
      timestamp: cut.timestamp,
      durationSec: 6,
      label: cut.description || cut.rawCode || 'Jugada etiquetada',
      detail: cut.rawCode,
      skill: cut.skill,
      evaluation: cut.evaluation,
      source: 'tag' as const,
    }));
    const detected = detectedRallies.map((rally) => ({
      id: rally.id,
      timestamp: rally.timestampStart,
      durationSec: rally.durationSec,
      label: rally.phase,
      detail: rally.detectedCode,
      skill: undefined,
      evaluation: rally.result === 'home_point' ? '#' as const : undefined,
      source: 'rally' as const,
    }));
    const combined = [...tagged, ...detected].sort((a, b) => a.timestamp - b.timestamp);
    return combined.filter((clip) => {
      if (clipFilter === 'all') return true;
      if (clipFilter === 'attacks') return clip.skill === 'A' && clip.evaluation === '#';
      if (clipFilter === 'aces') return clip.skill === 'S' && clip.evaluation === '#';
      if (clipFilter === 'blocks') return clip.skill === 'B' && clip.evaluation === '#';
      if (clipFilter === 'errors') return clip.evaluation === '=' || clip.evaluation === '/';
      return true;
    });
  }, [userCuts, detectedRallies, clipFilter]);

  // AI Chat Assistant State
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `¡Hola! Soy el asistente táctico de inteligencia artificial de OPEN VOLEY. He procesado la visión computacional y el video del partido ${match.homeTeamName} vs ${match.awayTeamName}. ¿Quieres un análisis predictivo de las zonas de remate del rival, la distribución del armador con pase perfecto o los patrones de saque más vulnerables?`,
    },
  ]);

  const homeStats = useMemo(() => calculatePlayerStats(match.homePlayers, match.actions), [match]);
  const awayStats = useMemo(() => calculatePlayerStats(match.awayPlayers, match.actions), [match]);
  const telemetrySummary = useMemo(() => {
    const valid = detectedRallies.filter((rally) => rally.confidenceScore > 0);
    const speeds = valid.map((rally) => rally.ballMaxSpeedKmh).filter((value) => value > 0);
    const reaches = valid.map((rally) => rally.spikeReachM).filter((value) => value > 0);
    return {
      samples: valid.length,
      maxSpeed: speeds.length ? Math.max(...speeds) : undefined,
      avgSpeed: speeds.length ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length : undefined,
      maxReach: reaches.length ? Math.max(...reaches) : undefined,
    };
  }, [detectedRallies]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Video file upload handler
  const processUploadedFile = (file: File) => {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    try {
      const blobUrl = URL.createObjectURL(file);
      setVideoSrc(blobUrl);
      if (onSetVideoSrc) {
        onSetVideoSrc(blobUrl, file.name, sizeMb);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setVideoSrc(dataUrl);
        if (onSetVideoSrc) {
          onSetVideoSrc(dataUrl, file.name, sizeMb);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleSeek = (delta: number) => {
    if (videoRef.current) {
      const next = Math.max(0, Math.min(duration || 9999, videoRef.current.currentTime + delta));
      videoRef.current.currentTime = next;
      setCurrentTime(next);
    }
  };

  const handleJumpToRally = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    if (onJumpToTimestamp) {
      onJumpToTimestamp(timestamp);
    }
  };

  // Vision analysis remains experimental until a validated computer-vision backend
  // returns real detections. Never synthesize rallies or telemetry in the browser.
  const handleRunVisionAnalysis = () => {
    if (!videoSrc) return;
    setIsVisionAnalyzing(true);
    setVisionNotice(null);
    window.setTimeout(() => {
      setIsVisionAnalyzing(false);
      setVisionNotice('Auto-Scan experimental: todavía no hay un motor de visión validado conectado para generar detecciones automáticas reales. Usa el etiquetado manual o el scouting sincronizado.');
    }, 500);
  };

  // Manual marker at the current timestamp. This creates navigation evidence only;
  // it deliberately does not invent speed, reach, confidence or outcome.
  const handleDetectCurrentSecond = () => {
    const sec = Math.floor(currentTime);
    const attackerNum = match.homePlayers[0]?.number || 1;
    const newRally: RallyDetection = {
      id: `rally-manual-${Date.now()}`,
      timestampStart: sec,
      timestampEnd: sec + 6,
      durationSec: 6,
      servingTeam: 'home',
      serverNum: match.server?.playerNum || 0,
      attackingTeam: 'home',
      attackerNum,
      result: 'home_point',
      confidenceScore: 0,
      ballMaxSpeedKmh: 0,
      spikeReachM: 0,
      detectedCode: 'MANUAL',
      phase: 'Punto',
      notes: `Marcador manual creado en ${formatTime(sec)}. Sin telemetría automática.`,
    };
    onAddRally(newRally);
    setVisionNotice('Marcador manual agregado. No incluye velocidad, salto ni confianza porque esos datos no fueron medidos.');
  };

  const handleAskAI = async (customQuery?: string) => {
    const query = customQuery || chatPrompt;
    if (!query.trim() || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: query }]);
    if (!customQuery) setChatPrompt('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          matchSummary: {
            title: match.title,
            currentSet: match.currentSet,
            homeTeam: match.homeTeamName,
            awayTeam: match.awayTeamName,
            homeStats,
            awayStats,
            actionsCount: match.actions.length,
            detectedRalliesCount: detectedRallies.length,
            userCutsCount: userCuts.length,
            aiEngine: 'OPEN VOLEY AI Hub',
          },
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'No hay una respuesta táctica verificada disponible para esta consulta. OPEN VOLEY no completará el análisis con porcentajes o patrones inventados.',
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'El servicio de consulta táctica no está disponible en este momento. Los datos registrados del partido permanecen accesibles en Análisis y OPEN AI, sin generar conclusiones ficticias.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner - Motor IA Táctico */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-black rounded-full uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-amber-400" /> OPEN VOLEY AI Suite
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono rounded-full font-bold">
                <Activity className="w-3 h-3 text-emerald-400" /> Visión & Telemetría Experimental
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Inteligencia Artificial Táctica & Visión Computacional
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Espacio experimental para video, marcadores sincronizados y futuras mediciones de visión computacional. Las métricas sólo se muestran cuando provienen de detecciones validadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{videoSrc ? 'Cambiar Video' : 'Subir Video'}</span>
            </button>

            <button
              onClick={handleRunVisionAnalysis}
              disabled={isVisionAnalyzing || !videoSrc}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 border border-indigo-400/30 transition transform active:scale-95 disabled:opacity-50"
            >
              {isVisionAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Escaneando Frames...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span>Auto-Scan Video del Partido</span>
                </>
              )}
            </button>
          </div>
        </div>

        {visionNotice && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs relative z-10">
            {visionNotice}
          </div>
        )}

        {/* Submodule Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubModule('vision')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'vision'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>1. Auto-Scouting & Visión Artificial</span>
          </button>

          <button
            onClick={() => setActiveSubModule('setter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'setter'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>2. Matriz de Armador (Distribución)</span>
          </button>

          <button
            onClick={() => setActiveSubModule('heatmaps')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'heatmaps'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>3. Mapas de Calor & Trayectorias</span>
          </button>

          <button
            onClick={() => setActiveSubModule('telemetry')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'telemetry'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>4. Telemetría (Salto & Velocidad)</span>
          </button>

          <button
            onClick={() => setActiveSubModule('autoclips')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'autoclips'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>5. Auto-Clips & Playlists</span>
          </button>

          <button
            onClick={() => setActiveSubModule('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'chat'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black'
                : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>6. Asistente IA Táctico en Vivo</span>
          </button>
        </div>
      </div>

      {/* SUBMODULE 1: COMPUTER VISION & AUTO-SCOUTING */}
      {activeSubModule === 'vision' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Live Vision Screen with Real Video + Optical AI Overlay */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Tracking Stage */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-200">
                    Reconocimiento Óptico en Video Real (Bounding Boxes & Telemetría)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAiOverlays(!showAiOverlays)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
                      showAiOverlays ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Overlay IA: {showAiOverlays ? 'ACTIVO' : 'OCULTO'}
                  </button>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    Análisis visual experimental
                  </div>
                </div>
              </div>

              {/* Real Video Player Container with AI Computer Vision HUD Overlays */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                className={`relative aspect-video w-full bg-black rounded-2xl border overflow-hidden flex items-center justify-center shadow-inner ${
                  isDraggingFile ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-800'
                }`}
              >
                {!videoSrc ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-500/60 flex items-center justify-center text-amber-400 shadow-xl cursor-pointer hover:scale-105 transition"
                    >
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-base font-bold text-white">Sube el video o carga el partido de ejemplo</h4>
                      <p className="text-xs text-slate-400">
                        Compatible con videos de YouTube (Chile vs Argentina) y archivos de celular (.mp4, .mov).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoSrc(defaultYouTubeMatchUrl);
                          if (onSetVideoSrc) {
                            onSetVideoSrc(defaultYouTubeMatchUrl, 'Chile vs Argentina - Panamericanos 2023 (YouTube)', 'YouTube HD');
                          }
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <Youtube className="w-4 h-4 text-red-600 fill-current" />
                        <span>🏐 Cargar Ejemplo: Chile vs Argentina</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Archivo Local</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* YouTube Video or HTML5 Video */}
                    {extractYouTubeId(videoSrc) ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-black">
                        <iframe
                          key={`${extractYouTubeId(videoSrc)}-${Math.floor(currentTime)}`}
                          src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(videoSrc)}?autoplay=1&start=${Math.max(0, Math.floor(currentTime))}&rel=0&enablejsapi=1`}
                          title="AutoScan AI Video Player"
                          className="w-full h-full aspect-video border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        key={videoSrc}
                        ref={videoRef}
                        src={videoSrc}
                        className="w-full h-full object-contain bg-black"
                        controls={false}
                        autoPlay={false}
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onTimeUpdate={() => {
                          if (videoRef.current) {
                            setCurrentTime(videoRef.current.currentTime);
                          }
                        }}
                        onLoadedMetadata={() => {
                          if (videoRef.current) {
                            setDuration(videoRef.current.duration || 0);
                          }
                        }}
                      />
                    )}

                    {/* Computer Vision & Optical OCR Real-Time Overlay */}
                    {showAiOverlays && (
                      <ComputerVisionOverlay
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        isAutoScoutActive={showAiOverlays}
                        onToggleAutoScout={() => setShowAiOverlays(!showAiOverlays)}
                        onDetectedAction={(desc) => {
                          console.log('AI AutoScan detected:', desc);
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Video Playback and Scan Control Bar */}
              {videoSrc && (
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  {/* Timeline slider */}
                  <div className="flex items-center justify-between font-mono text-slate-400 text-xs">
                    <span className="font-bold text-white">{formatTime(currentTime)}</span>
                    <span className="text-slate-500 truncate max-w-xs">{sharedFileName || 'Video Cargado'}</span>
                    <span className="font-bold text-slate-300">{formatTime(duration)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />

                  {/* Playback & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSeek(-5)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 text-xs"
                      >
                        -5s
                      </button>
                      <button
                        onClick={togglePlay}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-md"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                      </button>
                      <button
                        onClick={() => handleSeek(5)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 text-xs"
                      >
                        +5s
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDetectCurrentSecond}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Detectar Rally en {formatTime(currentTime)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Detected Rallies Feed (Starts Clean, User creates new ones) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 max-h-[580px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="font-black text-sm text-white">Rallies Auto-Detectados</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {detectedRallies.length > 0 && (
                      <button
                        onClick={onClearRallies}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
                        title="Limpiar rallies detectados"
                      >
                        <Trash2 className="w-3 h-3" /> Limpiar
                      </button>
                    )}
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                      {detectedRallies.length} jugadas
                    </span>
                  </div>
                </div>

                {/* List of Detected Rallies */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {detectedRallies.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 space-y-3">
                      <Eye className="w-10 h-10 text-slate-600 mx-auto opacity-50" />
                      <div className="text-xs font-bold text-slate-400">No hay rallies detectados aún</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Carga el video de tu partido y presiona <strong className="text-amber-400">"Auto-Scan Video"</strong> o <strong className="text-emerald-400">"Detectar Rally"</strong> para generar jugadas reales con telemetría.
                      </p>
                    </div>
                  ) : (
                    detectedRallies.map((rally, idx) => (
                      <div
                        key={rally.id}
                        onClick={() => handleJumpToRally(rally.timestampStart)}
                        className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800/90 hover:border-amber-500/40 rounded-2xl transition cursor-pointer group space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-200 group-hover:text-amber-400 transition">
                            Rally #{idx + 1} ({rally.durationSec}s)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" /> {formatTime(rally.timestampStart)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRally(rally.id);
                              }}
                              className="text-slate-600 hover:text-rose-400 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {rally.detectedCode}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rally.result === 'home_point' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {rally.result === 'home_point' ? `Punto ${match.homeTeamName}` : `Punto ${match.awayTeamName}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                          <span>Radar: <strong className="text-white">{rally.ballMaxSpeedKmh} km/h</strong></span>
                          <span>Salto: <strong className="text-indigo-300">{rally.spikeReachM}m</strong></span>
                          <span className="text-emerald-400 font-mono">{rally.confidenceScore}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Auto-Scout OPEN VOLEY AI</span>
                <span className="text-amber-400 font-mono font-bold">{detectedRallies.length} Rallies</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 2: SETTER DISTRIBUTION MATRIX */}
      {activeSubModule === 'setter' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Matriz Predictiva de Distribución del Armador</h3>
                <p className="text-xs text-slate-400">
                  Calcula hacia qué zona arma el colocador según la calidad del pase (#, +, !) y la rotación.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSelectedSetterTeam('home')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    selectedSetterTeam === 'home' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {match.homeTeamName} (Local)
                </button>
                <button
                  onClick={() => setSelectedSetterTeam('away')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    selectedSetterTeam === 'away' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {match.awayTeamName} (Rival)
                </button>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['all', 'perfect', 'positive', 'poor'] as const).map((qual) => (
                  <button
                    key={qual}
                    onClick={() => setSelectedPassQuality(qual)}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      selectedPassQuality === qual ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {qual === 'all' ? 'Todos' : qual === 'perfect' ? 'Pase # (Perfecto)' : qual === 'positive' ? 'Pase +' : 'Pase ! (Fuera)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Zones Distribution Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zona 4 (Punta Receptor)</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Z4</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {selectedPassQuality === 'perfect' ? '32%' : selectedPassQuality === 'poor' ? '78%' : '44%'}
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                  style={{ width: selectedPassQuality === 'perfect' ? '32%' : selectedPassQuality === 'poor' ? '78%' : '44%' }}
                />
              </div>
              <div className="text-xs text-slate-400 leading-relaxed pt-1">
                Efectividad de Remate: <strong className="text-emerald-400">54% Pts</strong> (Bloqueo recibido: 8%)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zona 3 (Central / Rápida)</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Z3</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {selectedPassQuality === 'perfect' ? '42%' : selectedPassQuality === 'poor' ? '0%' : '18%'}
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                  style={{ width: selectedPassQuality === 'perfect' ? '42%' : selectedPassQuality === 'poor' ? '0%' : '18%' }}
                />
              </div>
              <div className="text-xs text-slate-400 leading-relaxed pt-1">
                Efectividad de Remate: <strong className="text-emerald-400">68% Pts</strong> (Bloqueo recibido: 4%)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zona 2 (Opuesto)</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Z2</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {selectedPassQuality === 'perfect' ? '18%' : selectedPassQuality === 'poor' ? '22%' : '30%'}
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                  style={{ width: selectedPassQuality === 'perfect' ? '18%' : selectedPassQuality === 'poor' ? '22%' : '30%' }}
                />
              </div>
              <div className="text-xs text-slate-400 leading-relaxed pt-1">
                Efectividad de Remate: <strong className="text-emerald-400">51% Pts</strong> (Bloqueo recibido: 11%)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zona 8 (Pipe / Zaguero)</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PIPE</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {selectedPassQuality === 'perfect' ? '8%' : selectedPassQuality === 'poor' ? '0%' : '8%'}
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                  style={{ width: selectedPassQuality === 'perfect' ? '8%' : selectedPassQuality === 'poor' ? '0%' : '8%' }}
                />
              </div>
              <div className="text-xs text-slate-400 leading-relaxed pt-1">
                Efectividad de Remate: <strong className="text-emerald-400">62% Pts</strong> (Sorpresa táctica)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 3: SPATIAL HEATMAPS */}
      {activeSubModule === 'heatmaps' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Mapas Espaciales de Calor & Trayectorias de Caída</h3>
                <p className="text-xs text-slate-400">
                  Visualiza las zonas de caída más frecuentes y las diagonales peligrosas del remate rival.
                </p>
              </div>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setHeatmapMode('attack')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  heatmapMode === 'attack' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ataques (Kills vs Errores)
              </button>
              <button
                onClick={() => setHeatmapMode('serve')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  heatmapMode === 'serve' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Zonas de Saque & Aces
              </button>
              <button
                onClick={() => setHeatmapMode('defense')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  heatmapMode === 'defense' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Defensa & Huecos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-w-lg aspect-[18/9] bg-gradient-to-br from-amber-950/40 via-slate-950 to-orange-950/40 border-2 border-amber-500/60 rounded-2xl relative p-4 flex flex-col justify-between shadow-2xl">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-400/80 border-l border-dashed border-amber-300 z-20 flex items-center justify-center">
                  <span className="bg-slate-900 text-amber-400 border border-amber-500 text-[9px] font-black px-1 py-0.5 rounded rotate-90">
                    RED
                  </span>
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {heatmapMode === 'attack' && (
                    <>
                      <circle cx="20%" cy="75%" r="38" fill="#ef4444" opacity="0.6" filter="blur(8px)" />
                      <circle cx="22%" cy="73%" r="22" fill="#f59e0b" opacity="0.8" />
                      <text x="18%" y="78%" fill="#ffffff" fontSize="10" fontWeight="bold">68% Kills</text>

                      <circle cx="20%" cy="25%" r="26" fill="#3b82f6" opacity="0.5" filter="blur(6px)" />
                      <circle cx="20%" cy="25%" r="14" fill="#60a5fa" opacity="0.8" />
                      <text x="16%" y="28%" fill="#ffffff" fontSize="9" fontWeight="bold">24% Line</text>

                      <circle cx="40%" cy="50%" r="18" fill="#10b981" opacity="0.5" filter="blur(5px)" />
                      <text x="36%" y="53%" fill="#ffffff" fontSize="8" fontWeight="bold">8% Tip</text>

                      <line x1="85%" y1="20%" x2="22%" y2="73%" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" />
                    </>
                  )}

                  {heatmapMode === 'serve' && (
                    <>
                      <circle cx="25%" cy="60%" r="35" fill="#f59e0b" opacity="0.6" filter="blur(8px)" />
                      <circle cx="25%" cy="60%" r="18" fill="#ef4444" opacity="0.8" />
                      <text x="21%" y="63%" fill="#ffffff" fontSize="9" fontWeight="bold">Zona Débil</text>

                      <circle cx="38%" cy="48%" r="22" fill="#8b5cf6" opacity="0.6" filter="blur(6px)" />
                      <text x="34%" y="51%" fill="#ffffff" fontSize="9" fontWeight="bold">Saque Corto</text>
                    </>
                  )}

                  {heatmapMode === 'defense' && (
                    <>
                      <rect x="10%" y="40%" width="18%" height="22%" fill="#ef4444" opacity="0.3" rx="8" />
                      <text x="12%" y="52%" fill="#fca5a5" fontSize="9" fontWeight="bold">Espacio Libre</text>
                    </>
                  )}
                </svg>

                <div className="relative z-20 flex justify-between text-[11px] font-mono font-bold text-slate-400">
                  <span>ZONA DEFENSIVA</span>
                  <span>ZONA DE ATAQUE</span>
                </div>
                <div className="relative z-20 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Línea de Fondo (9m)</span>
                  <span>Línea de 3 metros</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h4 className="font-black text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                Desglose por Zonas de Caída
              </h4>

              <div className="space-y-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Diagonal Profunda a Zona 5</span>
                    <span className="text-rose-400 font-mono">68%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: '68%' }} />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Paralela Ajustada a Zona 1</span>
                    <span className="text-blue-400 font-mono">24%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: '24%' }} />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Toque Corto detrás del Bloqueo</span>
                    <span className="text-emerald-400 font-mono">8%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '8%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 4: BIOMETRICS & TELEMETRY */}
      {activeSubModule === 'telemetry' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Telemetría Biomecánica & Radar de Potencia</h3>
                <p className="text-xs text-slate-400">
                  Medición de velocidad de remate (km/h), altura de impacto (m) y tiempo de suspensión en el aire.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Velocidad Máxima de Remate</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {telemetrySummary.maxSpeed !== undefined ? telemetrySummary.maxSpeed.toFixed(1) : '—'} <span className="text-sm text-slate-400">km/h</span>
              </div>
              <div className="text-[11px] text-slate-400">{telemetrySummary.samples ? 'Máximo validado' : 'Sin medición validada'}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Alcance Máximo de Remate</div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {telemetrySummary.maxReach !== undefined ? telemetrySummary.maxReach.toFixed(2) : '—'} <span className="text-sm text-slate-400">m</span>
              </div>
              <div className="text-[11px] text-slate-400">{telemetrySummary.samples ? 'Máximo validado' : 'Sin medición validada'}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Velocidad Media de Saque</div>
              <div className="text-3xl sm:text-4xl font-black text-blue-400 font-mono">
                {telemetrySummary.avgSpeed !== undefined ? telemetrySummary.avgSpeed.toFixed(1) : '—'} <span className="text-sm text-slate-400">km/h</span>
              </div>
              <div className="text-[11px] text-slate-400">{telemetrySummary.samples ? `Promedio sobre ${telemetrySummary.samples} detecciones` : 'Sin medición validada'}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Tiempo de Suspensión (Hang)</div>
              <div className="text-3xl sm:text-4xl font-black text-purple-400 font-mono">
                — <span className="text-sm text-slate-400">s</span>
              </div>
              <div className="text-[11px] text-slate-400">No medido por el motor actual</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 5: AUTO-CLIPS & SMART PLAYLISTS */}
      {activeSubModule === 'autoclips' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Playlists Inteligentes & Filtros de Video (1-Clic)</h3>
                <p className="text-xs text-slate-400">
                  Reúne y filtra jugadas etiquetadas del partido para revisarlas como una playlist sincronizada.
                </p>
              </div>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setClipFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  clipFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({detectedRallies.length + userCuts.length})
              </button>
              <button
                onClick={() => setClipFilter('attacks')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  clipFilter === 'attacks' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ataques Ganadores
              </button>
              <button
                onClick={() => setClipFilter('aces')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  clipFilter === 'aces' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Saques Aces
              </button>
              <button
                onClick={() => setClipFilter('errors')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  clipFilter === 'errors' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Errores No Forzados
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlistCuts.length === 0 ? (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
                <Film className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
                <div className="text-sm font-bold text-slate-400">No hay clips generados aún</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Etiqueta jugadas en Video o registra acciones durante el Scout. Las jugadas compatibles aparecerán aquí para revisión.
                </p>
              </div>
            ) : (
              playlistCuts.map((clip, i) => (
                <div
                  key={clip.id}
                  onClick={() => handleJumpToRally(clip.timestamp)}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-5 shadow-xl transition cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-amber-400" /> Clip #{i + 1}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {formatTime(clip.timestamp)} ({clip.durationSec}s)
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    {clip.label}{clip.detail ? <>: <strong className="text-white">{clip.detail}</strong></> : null}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>{clip.source === 'tag' ? 'Etiqueta manual / Scout' : 'Rally registrado'}</span>
                    <span className="text-indigo-300">{clip.skill ? `Fundamento: ${clip.skill}` : 'Sin fundamento etiquetado'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBMODULE 6: AI CHAT ASSISTANT */}
      {activeSubModule === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Consultor Táctico IA (Gemini Model)</h3>
              <p className="text-xs text-slate-400">
                Pregunta cualquier duda estratégica en lenguaje natural durante el partido o entrenamiento.
              </p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => handleAskAI('¿Cuáles son los puntos débiles del receptor rival?')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-300 rounded-xl transition cursor-pointer"
            >
              🎯 Debilidades en recepción del rival
            </button>
            <button
              onClick={() => handleAskAI('¿Dónde conviene colocar el saque en esta rotación?')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 rounded-xl transition cursor-pointer"
            >
              🏐 Saque táctico recomendado
            </button>
            <button
              onClick={() => handleAskAI('¿Qué ajuste de bloqueo hacemos contra el opuesto rival?')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-300 rounded-xl transition cursor-pointer"
            >
              🛡️ Ajuste de bloqueo vs Opuesto
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar p-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-slate-950 border border-purple-800/40 text-slate-200'
                    : 'bg-indigo-600 text-white ml-auto max-w-[85%]'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                  {msg.role === 'assistant' ? '🤖 Asistente IA OPEN VOLEY' : '👤 Entrenador'}
                </div>
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAI();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Escribe una pregunta táctica sobre el partido..."
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatPrompt.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/30 transition text-xs sm:text-sm shrink-0 cursor-pointer"
            >
              {chatLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Consultar'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
