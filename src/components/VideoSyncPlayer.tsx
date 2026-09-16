import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { ScoutCodeAction, VolleySkill, EvaluationSymbol, MatchData } from '../types';
import { VolleyballMediaStudio } from './VolleyballMediaStudio';
import { ComputerVisionOverlay } from './ComputerVisionOverlay';
import { sampleMatchData, defaultYouTubeMatchUrl, defaultYouTubeMatchTitle } from '../data/sampleMatch';
import { 
  Play, 
  Pause, 
  Film, 
  Filter, 
  Clock, 
  Upload, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Rewind,
  FastForward,
  AlertCircle,
  Scissors,
  Check,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Instagram,
  Youtube,
  ExternalLink,
  Scan,
  Eye,
  Bot,
  Sparkles
} from 'lucide-react';

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = urlOrId.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId.trim())) {
    return urlOrId.trim();
  }
  return null;
}

interface VideoSyncPlayerProps {
  actions: ScoutCodeAction[];
  videoSrc: string;
  onSetVideoSrc: (src: string, fileName?: string, fileSize?: string) => void;
  uploadedFileName: string | null;
  uploadedFileSize: string | null;
  userCuts: ScoutCodeAction[];
  onAddCut: (action: ScoutCodeAction) => void;
  onDeleteCut: (id: string) => void;
  onClearCuts: () => void;
  match?: MatchData;
}

export const VideoSyncPlayer: React.FC<VideoSyncPlayerProps> = ({
  videoSrc,
  onSetVideoSrc,
  uploadedFileName,
  uploadedFileSize,
  userCuts,
  onAddCut,
  onDeleteCut,
  onClearCuts,
  match = sampleMatchData,
}) => {
  // Video Sub-Tab: Video Player vs Volleyball Scout Media Studio
  const [activeMediaTab, setActiveMediaTab] = useState<'video_cuts' | 'media_studio'>('video_cuts');

  // Video playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [filterSkill, setFilterSkill] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<ScoutCodeAction | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [customYtInput, setCustomYtInput] = useState<string>('');
  const [showYtInputModal, setShowYtInputModal] = useState<boolean>(false);
  const [isAutoScoutCvActive, setIsAutoScoutCvActive] = useState<boolean>(false);

  // New Tag Form state
  const [tagPlayerName, setTagPlayerName] = useState<string>('Jugador');
  const [tagPlayerNum, setTagPlayerNum] = useState<number>(1);
  const [tagSkill, setTagSkill] = useState<VolleySkill>('A');
  const [tagEval, setTagEval] = useState<EvaluationSymbol>('#');
  const [tagTeam, setTagTeam] = useState<'home' | 'away'>('home');
  const [tagDescription, setTagDescription] = useState<string>('Ataque punto diagonal');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if current source is YouTube
  const youtubeId = extractYouTubeId(videoSrc);

  // Filter user tags
  const filteredActions = userCuts.filter((act) => {
    if (filterSkill === 'ALL') return true;
    return act.skill === filterSkill;
  });

  // Reload video element on source change (if not YouTube)
  useEffect(() => {
    if (videoRef.current && videoSrc && !youtubeId) {
      videoRef.current.load();
    }
  }, [videoSrc, youtubeId]);

  // Load Chile vs Argentina example match
  const handleLoadPanamExample = () => {
    onSetVideoSrc(defaultYouTubeMatchUrl, 'Chile vs Argentina - Panamericanos 2023 (YouTube)', 'YouTube HD 1080p');
    setCurrentTime(18);
    setVideoError(null);

    // Clear and reload fresh sample cuts to guarantee synchronization
    onClearCuts();
    sampleMatchData.actions.forEach((act) => {
      onAddCut(act);
    });
    if (sampleMatchData.actions.length > 0) {
      setSelectedAction(sampleMatchData.actions[0]);
    }
  };

  const handleApplyCustomYouTube = (urlToUse?: string) => {
    const targetUrl = urlToUse || customYtInput.trim();
    if (!targetUrl) return;
    const yId = extractYouTubeId(targetUrl);
    if (!yId) {
      setVideoError('Enlace de YouTube no válido. Asegúrate de que sea del formato: https://www.youtube.com/watch?v=... o youtu.be/...');
      return;
    }
    onSetVideoSrc(`https://www.youtube.com/watch?v=ok56D8DFLl8`, 'Video YouTube de Vóley', 'YouTube Stream');
    setShowYtInputModal(false);
    setCustomYtInput('');
    setVideoError(null);
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Playback handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
              setVideoError('Haz clic sobre el reproductor para habilitar el video.');
            });
          }
        });
      }
    }
  };

  const handleSeek = (deltaSeconds: number) => {
    const next = Math.max(0, Math.min(duration || 9999, currentTime + deltaSeconds));
    setCurrentTime(next);
    if (videoRef.current) {
      videoRef.current.currentTime = next;
    }
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const next = !isMuted;
      videoRef.current.muted = next;
      setIsMuted(next);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  // Jump to tagged clip
  const handleSelectClip = (act: ScoutCodeAction) => {
    setSelectedAction(act);
    setIsPlaying(true);
    setVideoError(null);
    setCurrentTime(act.timestamp);

    if (videoRef.current) {
      try {
        videoRef.current.currentTime = act.timestamp;
        videoRef.current.play().catch(() => {});
      } catch {
        // Safe seek
      }
    }
  };

  // Process uploaded video file (e.g. phone recording .mp4/.mov)
  const processFile = (file: File) => {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setVideoError(null);
    setIsPlaying(false);
    setCurrentTime(0);

    try {
      const blobUrl = URL.createObjectURL(file);
      onSetVideoSrc(blobUrl, file.name, sizeMb);
    } catch {
      // FileReader fallback
      setIsReadingFile(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setIsReadingFile(false);
        const dataUrl = event.target?.result as string;
        onSetVideoSrc(dataUrl, file.name, sizeMb);
      };
      reader.onerror = () => {
        setIsReadingFile(false);
        setVideoError('Error al procesar el archivo. Prueba con un formato .mp4 estándar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  // Add new tag at current timestamp
  const handleAddTag = () => {
    const sec = Math.floor(currentTime);
    const prefix = tagTeam === 'home' ? '*' : 'a';
    const numPadded = tagPlayerNum < 10 ? `0${tagPlayerNum}` : `${tagPlayerNum}`;
    const rawCode = `${prefix}${numPadded}${tagSkill.toLowerCase()}${tagEval}`;

    const newAction: ScoutCodeAction = {
      id: `cut-${Date.now()}`,
      setNumber: 1,
      scoreHome: 0,
      scoreAway: 0,
      team: tagTeam,
      playerNum: tagPlayerNum,
      playerName: tagPlayerName.trim() || `Jugador #${tagPlayerNum}`,
      skill: tagSkill,
      evaluation: tagEval,
      rawCode: rawCode,
      timestamp: sec,
      rotationHome: [1, 7, 8, 12, 4, 9],
      rotationAway: [4, 9, 16, 11, 10, 3],
      description: tagDescription.trim() || `${tagSkill} ${tagEval} a los ${formatTime(sec)}`
    };

    onAddCut(newAction);
    setSelectedAction(newAction);
    setShowAddModal(false);
  };

  const handleDeleteTag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteCut(id);
    if (selectedAction?.id === id) {
      setSelectedAction(null);
    }
  };

  const handleExportCuts = () => {
    if (userCuts.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userCuts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `montaje_jugadas_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* MEDIA MODE SWITCHER BAR */}
      <div className="bg-slate-900 p-2 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 pl-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            🎬
          </div>
          <div>
            <span className="text-xs font-black text-white block">Centro de Medios & Video Análisis</span>
            <span className="text-[11px] text-slate-400">Alterna entre sincronización de video y trabajo con imágenes/telestrator</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveMediaTab('video_cuts')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition ${
              activeMediaTab === 'video_cuts'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Sincronización & Cortes de Video</span>
          </button>

          <button
            onClick={() => setActiveMediaTab('media_studio')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition ${
              activeMediaTab === 'media_studio'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/30 scale-[1.02]'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Instagram className="w-4 h-4 text-rose-500" />
            <span>📸 Tarjetas Redes & Telestrator de Fotos</span>
          </button>
        </div>
      </div>

      {/* RENDER MEDIA STUDIO IF SELECTED */}
      {activeMediaTab === 'media_studio' ? (
        <VolleyballMediaStudio match={match} videoSrc={videoSrc} />
      ) : (
        <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6 animate-fadeIn">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs tracking-wider uppercase mb-1">
                <Film className="w-4 h-4" />
                <span>Módulo de Video HD & Etiquetado de Partido</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Sincronización de Video & Montaje de Jugadas
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sube el video de tu partido (grabado con celular, cámara o enlace de YouTube) y crea los cortes tácticos en tiempo real.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Preset Example Match Button */}
              <button
                onClick={handleLoadPanamExample}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-lg shadow-amber-500/5"
                title="Cargar Partido Panamericanos 2023 (Chile vs Argentina)"
              >
                <Youtube className="w-4 h-4 text-red-500 fill-current" />
                <span>🏐 Cargar Ejemplo: Chile vs Argentina</span>
              </button>

              {/* YouTube Link Button */}
              <button
                onClick={() => setShowYtInputModal(true)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Youtube className="w-4 h-4 text-rose-400" />
                <span>Enlace YouTube</span>
              </button>

              {/* File Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4 stroke-[3]" />
                <span>{videoSrc ? 'Subir Archivo MP4' : 'Subir Archivo de Video'}</span>
              </button>
            </div>
          </div>

          {/* YouTube Input Modal */}
          {showYtInputModal && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>Pegar Enlace de Video de YouTube</span>
                </div>
                <button 
                  onClick={() => setShowYtInputModal(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Cerrar
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Pega la URL de cualquier partido transmitido en YouTube (público o no listado de tu club):
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=ok56D8DFLl8"
                  value={customYtInput}
                  onChange={(e) => setCustomYtInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => handleApplyCustomYouTube()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Cargar Video
                </button>
              </div>
            </div>
          )}

      {/* Main Video & Playlist Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Video Player Canvas & Advanced Playback Bar */}
        <div className="lg:col-span-2 space-y-4">
          <div 
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleDrop}
            className={`relative bg-black rounded-3xl overflow-hidden min-h-[340px] sm:min-h-[440px] aspect-video border shadow-2xl flex items-center justify-center group ${
              isDraggingFile ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-800'
            }`}
          >
            {/* IF NO VIDEO IS LOADED: Clean Upload Dropzone with Example Promo */}
            {!videoSrc && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-3xl bg-slate-900 border-2 border-dashed border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-xl hover:scale-105 transition transform cursor-pointer"
                >
                  <Upload className="w-10 h-10" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-lg font-black text-white">
                    Arrastra aquí el video de tu partido o cárgalo desde YouTube
                  </h3>
                  <p className="text-xs text-slate-400">
                    Soporta videos grabados con celular (.mp4, .mov, .webm) o partidos oficiales de YouTube sincronizados segundo a segundo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleLoadPanamExample}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Youtube className="w-4 h-4 text-red-600 fill-current" />
                    <span>Cargar Partido de Ejemplo (Chile vs Argentina)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Seleccionar Archivo Local</span>
                  </button>
                </div>
              </div>
            )}

            {/* IF YOUTUBE VIDEO: Render Interactive YouTube Embed Player */}
            {videoSrc && youtubeId && (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <iframe
                  key={`${youtubeId}-${Math.floor(currentTime)}`}
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&start=${Math.max(0, Math.floor(currentTime))}&rel=0&enablejsapi=1`}
                  title="YouTube Video Player Match"
                  className="w-full h-full aspect-video border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}

            {/* IF NATIVE HTML5 VIDEO: Direct Player */}
            {videoSrc && !youtubeId && (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <video
                  key={videoSrc}
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain bg-black"
                  controls
                  autoPlay={false}
                  muted={isMuted}
                  playsInline
                  preload="auto"
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
                      setVideoError(null);
                    }
                  }}
                  onError={() => {
                    setVideoError(
                      'No se pudo reproducir este archivo. Verifica que sea un formato de video compatible (.mp4 / .mov / .webm).'
                    );
                  }}
                >
                  Tu navegador no soporta la reproducción directa de este video.
                </video>

                {/* Loading spinner */}
                {isReadingFile && (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 z-30">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="text-xs font-bold text-emerald-300">Cargando video de partido...</span>
                  </div>
                )}
              </div>
            )}

            {/* Computer Vision & Optical OCR Live Overlay */}
            {videoSrc && (
              <ComputerVisionOverlay
                isPlaying={isPlaying}
                currentTime={currentTime}
                isAutoScoutActive={isAutoScoutCvActive}
                onToggleAutoScout={() => setIsAutoScoutCvActive(!isAutoScoutCvActive)}
                onDetectedAction={(desc) => {
                  console.log('CV AutoScout Play Detected:', desc);
                }}
              />
            )}

            {/* Error Message */}
            {videoError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <div className="text-sm font-bold text-white max-w-sm">{videoError}</div>
                <div className="flex gap-2">
                  <button
                    onClick={handleLoadPanamExample}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-lg"
                  >
                    Usar Partido de Ejemplo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    Elegir Archivo Local
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline & Tagging Control Bar */}
          {videoSrc && (
            <>
              {/* Active Match Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white truncate max-w-md">
                    {uploadedFileName || 'Partido en Reproducción'}
                  </span>
                </div>
                {youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <span>Ver en YouTube Oficial</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Timeline Slider */}
              <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="font-bold text-white">{formatTime(currentTime)}</span>
                  <span className="text-slate-500">
                    Segundo {Math.floor(currentTime)}
                  </span>
                  <span className="font-bold text-slate-300">{duration > 0 ? formatTime(duration) : 'Tiempo Vivo'}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 3600}
                  step={1}
                  value={currentTime}
                  onChange={handleSliderChange}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Quick Playback & Tagging Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSeek(-10)}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                    title="Retroceder 10s"
                  >
                    <Rewind className="w-3.5 h-3.5" /> -10s
                  </button>
                  <button
                    onClick={() => handleSeek(10)}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                    title="Avanzar 10s"
                  >
                    +10s <FastForward className="w-3.5 h-3.5" />
                  </button>

                  {!youtubeId && (
                    <button
                      onClick={togglePlay}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                    </button>
                  )}

                  {/* Playback speed selector for HTML5 video */}
                  {!youtubeId && (
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                      {[0.5, 1, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleChangePlaybackRate(rate)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            playbackRate === rate ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tag Button & Volume */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddModal(!showAddModal)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
                  >
                    <Scissors className="w-4 h-4 stroke-[2.5]" />
                    <span>➕ Etiquetar Jugada en {formatTime(currentTime)}</span>
                  </button>

                  {!youtubeId && (
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <button
                        onClick={handleToggleMute}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        title={isMuted ? 'Desmutear' : 'Mutear'}
                      >
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-14 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Modal / Quick Form to tag a play at current timestamp */}
          {showAddModal && (
            <div className="bg-slate-950 border border-amber-500/60 p-4 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <Scissors className="w-4 h-4" />
                  <span>Nuevo Corte Táctico en el Segundo {Math.floor(currentTime)} ({formatTime(currentTime)})</span>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕ Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Equipo</label>
                  <select
                    value={tagTeam}
                    onChange={(e) => setTagTeam(e.target.value as 'home' | 'away')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-bold"
                  >
                    <option value="home">Argentina (*)</option>
                    <option value="away">Chile (a)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nº y Nombre Jugador</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={tagPlayerNum}
                      onChange={(e) => setTagPlayerNum(parseInt(e.target.value) || 1)}
                      className="w-14 bg-slate-900 border border-slate-800 rounded-xl p-2 text-center text-amber-400 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Nombre..."
                      value={tagPlayerName}
                      onChange={(e) => setTagPlayerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Fundamento & Efecto</label>
                  <div className="flex gap-1.5">
                    <select
                      value={tagSkill}
                      onChange={(e) => setTagSkill(e.target.value as VolleySkill)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-bold"
                    >
                      <option value="A">Ataque (A)</option>
                      <option value="S">Saque (S)</option>
                      <option value="B">Bloqueo (B)</option>
                      <option value="R">Recepción (R)</option>
                      <option value="D">Defensa (D)</option>
                      <option value="E">Armado (E)</option>
                    </select>

                    <select
                      value={tagEval}
                      onChange={(e) => setTagEval(e.target.value as EvaluationSymbol)}
                      className="w-20 bg-slate-900 border border-slate-800 rounded-xl p-2 text-amber-400 font-bold text-center"
                    >
                      <option value="#"># Punto / Perfecto</option>
                      <option value="+">+ Positivo</option>
                      <option value="!">! Neutro</option>
                      <option value="-">- Negativo</option>
                      <option value="=">= Error / Punto Rival</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Descripción</label>
                  <input
                    type="text"
                    placeholder="Ej: Ataque diagonal z4..."
                    value={tagDescription}
                    onChange={(e) => setTagDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleAddTag}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Corte en la Lista</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Montaje de Jugadas (Starts clean or populates with user's tags) */}
        <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col h-full max-h-[580px]">
          <div className="space-y-2 border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>Montaje de Jugadas ({filteredActions.length})</span>
              <div className="flex items-center gap-2">
                {userCuts.length > 0 && (
                  <>
                    <button
                      onClick={handleExportCuts}
                      className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 cursor-pointer"
                      title="Descargar JSON"
                    >
                      <Download className="w-3 h-3" /> Exportar
                    </button>
                    <button
                      onClick={onClearCuts}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 cursor-pointer"
                      title="Limpiar montaje"
                    >
                      <Trash2 className="w-3 h-3" /> Limpiar
                    </button>
                  </>
                )}
                {videoSrc && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nuevo Corte
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Skill */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
              <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-semibold focus:outline-none pr-1"
              >
                <option value="ALL">Todos los Fundamentos ({userCuts.length})</option>
                <option value="A">Ataques (A)</option>
                <option value="S">Saques (S)</option>
                <option value="B">Bloqueos (B)</option>
                <option value="R">Recepciones (R)</option>
                <option value="D">Defensas (D)</option>
                <option value="E">Armados (E)</option>
              </select>
            </div>
          </div>

          {/* List of Clips */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filteredActions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-3">
                <Scissors className="w-8 h-8 text-slate-600 opacity-60" />
                <div className="text-xs font-bold text-slate-400">No hay jugadas etiquetadas aún</div>
                <p className="text-[11px] text-slate-500 max-w-[220px]">
                  Carga el partido de ejemplo o presiona <strong className="text-amber-400">"➕ Etiquetar Jugada"</strong> para crear cortes tácticos.
                </p>
                <button
                  type="button"
                  onClick={handleLoadPanamExample}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  🏐 Cargar Cortes de Chile vs Argentina
                </button>
              </div>
            ) : (
              filteredActions.map((act) => {
                const isSelected = selectedAction?.id === act.id;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleSelectClip(act)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        act.team === 'home' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {act.playerNum}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white truncate">
                            {act.playerName || `Jugador #${act.playerNum}`}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-950 text-emerald-400 rounded border border-slate-800">
                            {act.rawCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {act.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 font-mono text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>{formatTime(act.timestamp)}</span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteTag(act.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Eliminar corte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Helper */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>💾 Guardado persistente automático</span>
            <span className="text-emerald-400 font-mono font-bold">{userCuts.length} cortes guardados</span>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};

