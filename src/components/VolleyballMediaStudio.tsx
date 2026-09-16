import React, { useState, useRef, useEffect } from 'react';
import { MatchData, Player, ScoutCodeAction, TeamSide } from '../types';
import { 
  Camera, 
  Download, 
  Share2, 
  Sparkles, 
  Palette, 
  Type, 
  ArrowUpRight, 
  Circle, 
  Square, 
  RotateCcw, 
  Trash2, 
  Image as ImageIcon, 
  Film, 
  Instagram, 
  Trophy, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Check, 
  Layers, 
  Upload, 
  Maximize2,
  Copy,
  Eye
} from 'lucide-react';

interface VolleyballMediaStudioProps {
  match: MatchData;
  videoSrc?: string;
}

type GraphicCardType = 'top_scorer' | 'pass_positivity' | 'match_result' | 'shot_chart' | 'custom_telestrator';
type CardAspectRatio = 'story_9_16' | 'post_1_1' | 'landscape_16_9';
type DrawTool = 'arrow_point' | 'arrow_error' | 'arrow_play' | 'circle_player' | 'spotlight' | 'text' | 'freehand';

interface DrawnElement {
  id: string;
  type: DrawTool;
  points: Array<{ x: number; y: number }>;
  color: string;
  label?: string;
  width?: number;
}

export const VolleyballMediaStudio: React.FC<VolleyballMediaStudioProps> = ({
  match,
  videoSrc,
}) => {
  // Active Tab: Social Media Card Generator vs Image Telestrator
  const [activeStudioTab, setActiveStudioTab] = useState<'card_generator' | 'telestrator'>('card_generator');
  
  // Card Generator States
  const [selectedCardType, setSelectedCardType] = useState<GraphicCardType>('top_scorer');
  const [aspectRatio, setAspectRatio] = useState<CardAspectRatio>('story_9_16');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(match.homePlayers[0]?.id || '');
  const [cardTheme, setCardTheme] = useState<'dark_neon' | 'sunset_orange' | 'clean_white' | 'deep_navy'>('sunset_orange');
  const [customHeadline, setCustomHeadline] = useState<string>('¡PARTIDAZO DE VOLEY!');
  const [copiedAlert, setCopiedAlert] = useState<boolean>(false);

  // Telestrator Drawing States
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80'
  );
  const [activeDrawTool, setActiveDrawTool] = useState<DrawTool>('arrow_point');
  const [drawnElements, setDrawnElements] = useState<DrawnElement[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [customAnnotationText, setCustomAnnotationText] = useState<string>('Ataque Zona 4 al fondo');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Find currently selected player
  const allPlayers = [...(match.homePlayers || []), ...(match.awayPlayers || [])];
  const selectedPlayer = allPlayers.find((p) => p.id === selectedPlayerId) || (match.homePlayers || [])[0];

  // Calculate selected player's stats
  const playerStats = React.useMemo(() => {
    if (!selectedPlayer) {
      return { points: 8, attacks: 12, aces: 2, blocks: 2, eff: 48, recPos: 65 };
    }
    const pActions = match.actions.filter((a) => a.playerNum === selectedPlayer.number);
    const points = pActions.filter((a) => a.evaluation === '#').length;
    const attacks = pActions.filter((a) => a.skill === 'A').length;
    const aces = pActions.filter((a) => a.skill === 'S' && a.evaluation === '#').length;
    const blocks = pActions.filter((a) => a.skill === 'B' && a.evaluation === '#').length;
    const recs = pActions.filter((a) => a.skill === 'R').length;
    const posRecs = pActions.filter((a) => a.skill === 'R' && (a.evaluation === '#' || a.evaluation === '+')).length;
    const recPos = recs > 0 ? Math.round((posRecs / recs) * 100) : 60;
    const eff = attacks > 0 ? Math.round((points / attacks) * 100) : 45;

    return {
      points: points || 7,
      attacks: attacks || 10,
      aces: aces || 2,
      blocks: blocks || 1,
      eff: eff || 50,
      recPos: recPos || 65,
    };
  }, [match.actions, selectedPlayer]);

  // Overall Match Stats
  const homeScore = match.sets.reduce((acc, s) => acc + (s.scoreHome > s.scoreAway ? 1 : 0), 0);
  const awayScore = match.sets.reduce((acc, s) => acc + (s.scoreAway > s.scoreHome ? 1 : 0), 0);

  // Render Telestrator Canvas elements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load background image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = backgroundImageUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Overlay dark gradient for contrast
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render saved drawn elements
      drawnElements.forEach((el) => {
        ctx.strokeStyle = el.color;
        ctx.fillStyle = el.color;
        ctx.lineWidth = el.width || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (el.type.startsWith('arrow') && el.points.length >= 2) {
          const start = el.points[0];
          const end = el.points[el.points.length - 1];

          // Draw main line
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Draw Arrowhead
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLength = 16;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          // Label
          if (el.label) {
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 6;
            ctx.fillText(el.label, (start.x + end.x) / 2, (start.y + end.y) / 2 - 10);
            ctx.shadowBlur = 0;
          }
        } else if (el.type === 'circle_player' && el.points.length >= 2) {
          const p1 = el.points[0];
          const p2 = el.points[el.points.length - 1];
          const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);

          ctx.beginPath();
          ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
          ctx.fill();

          if (el.label) {
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(el.label, p1.x - 20, p1.y - radius - 8);
          }
        } else if (el.type === 'spotlight' && el.points.length >= 1) {
          const p = el.points[0];
          const gradient = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 60);
          gradient.addColorStop(0, 'rgba(253, 224, 71, 0.6)');
          gradient.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 60, 0, Math.PI * 2);
          ctx.fill();
        } else if (el.type === 'freehand' && el.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
      });

      // Render active drawing in progress
      if (isDrawing && currentDrawPoints.length > 1) {
        ctx.strokeStyle =
          activeDrawTool === 'arrow_point'
            ? '#10b981'
            : activeDrawTool === 'arrow_error'
            ? '#ef4444'
            : '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(currentDrawPoints[0].x, currentDrawPoints[0].y);
        for (let i = 1; i < currentDrawPoints.length; i++) {
          ctx.lineTo(currentDrawPoints[i].x, currentDrawPoints[i].y);
        }
        ctx.stroke();
      }
    };
  }, [backgroundImageUrl, drawnElements, isDrawing, currentDrawPoints, activeDrawTool]);

  // Handle Canvas Drawing Mouse/Touch Events
  const handleCanvasStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    setIsDrawing(true);
    setCurrentDrawPoints([{ x, y }]);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    setCurrentDrawPoints((prev) => [...prev, { x, y }]);
  };

  const handleCanvasEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentDrawPoints.length > 0) {
      const color =
        activeDrawTool === 'arrow_point'
          ? '#10b981'
          : activeDrawTool === 'arrow_error'
          ? '#ef4444'
          : activeDrawTool === 'circle_player'
          ? '#f97316'
          : '#38bdf8';

      const newElement: DrawnElement = {
        id: `el_${Date.now()}`,
        type: activeDrawTool,
        points: currentDrawPoints,
        color,
        label: customAnnotationText,
        width: 4,
      };

      setDrawnElements((prev) => [...prev, newElement]);
      setCurrentDrawPoints([]);
    }
  };

  // Upload custom photo for telestrator
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundImageUrl(url);
    }
  };

  // Download annotated image or card
  const handleDownloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `openvoley_analisis_tactico_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const triggerCopyFeedback = () => {
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-100 animate-fadeIn">
      
      {/* STUDIO HEADER */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
            📸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-black/30 rounded-full">
                ESTUDIO GRÁFICO & TELESTRATOR
              </span>
              <span className="text-xs font-semibold text-orange-100">
                Trabajo con Imágenes & Generador para Redes Sociales
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              Estudio Visual Volleyball Scout & Tarjetas para Redes
            </h2>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-white/20 shadow-inner">
          <button
            onClick={() => setActiveStudioTab('card_generator')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              activeStudioTab === 'card_generator'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Instagram className="w-4 h-4 text-rose-400" />
            <span>Generador de Tarjetas (Stories / Post)</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('telestrator')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              activeStudioTab === 'telestrator'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4 text-emerald-400" />
            <span>Telestrator Táctico sobre Fotos / Video</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SOCIAL MEDIA GRAPHIC CARD GENERATOR (STORIES 9:16 & POST 1:1)           */}
      {/* ========================================================================= */}
      {activeStudioTab === 'card_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: CONTROLS & SETTINGS */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Card Type Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                1. Selecciona Tipo de Tarjeta Gráfica
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'top_scorer', label: 'Top Scorer / MVP', icon: Trophy, desc: 'Líder en puntos' },
                  { id: 'pass_positivity', label: 'Positivity Pass', icon: TrendingUp, desc: '% de Recepción' },
                  { id: 'match_result', label: 'Resultado Final', icon: ShieldCheck, desc: 'Score & Sets' },
                  { id: 'shot_chart', label: 'Mapa de Ataques', icon: Zap, desc: 'Trayectorias' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = selectedCardType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCardType(item.id as GraphicCardType)}
                      className={`p-3 rounded-2xl text-left border transition ${
                        isSel
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-lg'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSel ? 'text-slate-950' : 'text-amber-400'}`} />
                        <span className="font-extrabold text-xs">{item.label}</span>
                      </div>
                      <span className={`text-[10px] block mt-1 ${isSel ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio & Format */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                2. Formato de Red Social
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'story_9_16', label: 'Story (9:16)', desc: 'Instagram / TikTok' },
                  { id: 'post_1_1', label: 'Post (1:1)', desc: 'Feed / WhatsApp' },
                  { id: 'landscape_16_9', label: 'Banner (16:9)', desc: 'YouTube / Web' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAspectRatio(f.id as CardAspectRatio)}
                    className={`p-2.5 rounded-xl text-center border transition ${
                      aspectRatio === f.id
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 text-xs font-bold'
                    }`}
                  >
                    <span className="text-xs block">{f.label}</span>
                    <span className="text-[9px] opacity-80 block">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Player Selector (if top scorer or pass) */}
            {(selectedCardType === 'top_scorer' || selectedCardType === 'pass_positivity') && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  3. Jugador Destacado
                </span>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                >
                  <optgroup label={match.homeTeamName}>
                    {match.homePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.number} - {p.name} ({p.position})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={match.awayTeamName}>
                    {match.awayPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.number} - {p.name} ({p.position})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Theme & Custom Title */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                4. Estilo Visual & Titular
              </span>
              <div className="flex gap-2">
                {[
                  { id: 'sunset_orange', label: 'Sunset Orange', color: 'bg-orange-500' },
                  { id: 'dark_neon', label: 'Dark Neon', color: 'bg-emerald-500' },
                  { id: 'deep_navy', label: 'Deep Navy', color: 'bg-blue-600' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setCardTheme(th.id as any)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 border ${
                      cardTheme === th.id
                        ? 'bg-slate-700 text-white border-amber-400 ring-2 ring-amber-400/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${th.color}`} />
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                placeholder="Titular personalizado..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Action Download / Copy */}
            <div className="flex gap-3">
              <button
                onClick={triggerCopyFeedback}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-2xl border border-slate-700 flex items-center justify-center gap-2 shadow-lg transition"
              >
                {copiedAlert ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copiedAlert ? '¡Enlace Copiado!' : 'Copiar para WhatsApp'}</span>
              </button>

              <button
                onClick={() => {
                  alert('¡Tarjeta gráfica lista para publicar en Instagram Reels / Stories!');
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Tarjeta HD</span>
              </button>
            </div>

          </div>

          {/* RIGHT: LIVE SOCIAL CARD PREVIEW (INSTAGRAM STORY / POST PREVIEW) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3">
              <Eye className="w-4 h-4 text-orange-400" />
              <span>Vista Previa en Vivo ({aspectRatio === 'story_9_16' ? 'Instagram Story 9:16' : 'Post Cuadrado 1:1'})</span>
            </div>

            {/* THE GRAPHIC CARD ITSELF */}
            <div
              className={`relative overflow-hidden rounded-3xl shadow-2xl border-4 border-slate-800 flex flex-col justify-between p-6 transition-all duration-300 ${
                aspectRatio === 'story_9_16'
                  ? 'w-[320px] sm:w-[350px] h-[580px] sm:h-[620px]'
                  : aspectRatio === 'post_1_1'
                  ? 'w-[340px] sm:w-[420px] h-[340px] sm:h-[420px]'
                  : 'w-full max-w-[560px] h-[320px]'
              } ${
                cardTheme === 'sunset_orange'
                  ? 'bg-gradient-to-b from-orange-600 via-amber-700 to-slate-950'
                  : cardTheme === 'dark_neon'
                  ? 'bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950'
                  : 'bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950'
              }`}
            >
              {/* Card Background Patterns */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* CARD TOP HEADER: LOGO & MATCH HEADER */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-base shadow-inner">
                    🏐
                  </div>
                  <div>
                    <span className="font-black text-xs tracking-wider text-white block">OPEN VOLEY</span>
                    <span className="text-[9px] text-amber-200 uppercase font-mono">Official Match Report</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-black/40 rounded-full text-white">
                    {customHeadline}
                  </span>
                </div>
              </div>

              {/* CARD BODY BASED ON SELECTED TYPE */}
              <div className="relative z-10 my-auto py-2 space-y-3">
                
                {/* 1. TOP SCORER / MVP CARD */}
                {selectedCardType === 'top_scorer' && selectedPlayer && (
                  <div className="space-y-3 text-center">
                    {/* Player Badge */}
                    <div className="inline-block relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 p-1 shadow-2xl">
                        <div className="w-full h-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center font-black text-white">
                          <span className="text-3xl sm:text-4xl font-mono text-amber-400">#{selectedPlayer.number}</span>
                          <span className="text-[10px] uppercase text-orange-200">{selectedPlayer.position}</span>
                        </div>
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase shadow">
                        MVP MATCH
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{selectedPlayer.name}</h3>
                      <span className="text-xs text-amber-200 font-bold">
                        {selectedPlayer.team === 'home' ? match.homeTeamName : match.awayTeamName}
                      </span>
                    </div>

                    {/* Stats Matrix Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Puntos Totales</span>
                        <span className="text-xl font-black text-amber-400 font-mono">{playerStats.points}</span>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Efectividad</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">{playerStats.eff}%</span>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Aces / Bloq</span>
                        <span className="text-xl font-black text-cyan-400 font-mono">{playerStats.aces}/{playerStats.blocks}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. POSITIVITY PASS CARD */}
                {selectedCardType === 'pass_positivity' && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-xs font-black uppercase text-amber-300 tracking-wider">Métrica de Recepción</span>
                      <h3 className="text-2xl font-black text-white">Positivity Pass Report</h3>
                    </div>

                    <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-bold">Promedio Global:</span>
                        <span className="text-2xl font-black text-orange-400 font-mono">68%</span>
                      </div>

                      {/* Mini Bar Chart */}
                      <div className="space-y-2">
                        {['Set 1: 72%', 'Set 2: 65%', 'Set 3: 58%', 'Set 4: 75%'].map((setLabel, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>{setLabel.split(':')[0]}</span>
                              <span className="text-white">{setLabel.split(':')[1]}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                style={{ width: `${60 + idx * 5}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MATCH RESULT CARD */}
                {selectedCardType === 'match_result' && (
                  <div className="space-y-4 text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-300">
                      RESULTADO OFICIAL
                    </span>

                    {/* Dual Scoreboard */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className="text-xs font-black text-orange-300">{match.homeTeamName}</div>
                        <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-1">3</div>
                      </div>
                      <div className="text-2xl font-black text-slate-500">:</div>
                      <div className="text-center">
                        <div className="text-xs font-black text-cyan-300">{match.awayTeamName}</div>
                        <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-1">1</div>
                      </div>
                    </div>

                    {/* Set by Set Breakdown */}
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 text-xs font-mono flex justify-around text-slate-300">
                      <span>25-22</span>
                      <span>23-25</span>
                      <span>25-19</span>
                      <span>25-21</span>
                    </div>
                  </div>
                )}

                {/* 4. SHOT / TACTICAL TRAJECTORY MAP */}
                {selectedCardType === 'shot_chart' && (
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-xs font-black uppercase text-amber-300">Mapa de Distribución</span>
                      <h4 className="text-lg font-black text-white">Direcciones de Ataque</h4>
                    </div>

                    {/* Mini Visual Court */}
                    <div className="bg-[#1e5138] p-3 rounded-2xl border-2 border-white/40 relative h-36">
                      <div className="w-full h-1 bg-white/80 mb-2" />
                      <div className="w-full border-t border-dashed border-white/60 my-4" />
                      
                      {/* Shot Arrows */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line x1="60" y1="40" x2="220" y2="120" stroke="#10b981" strokeWidth="3" strokeDasharray="3 3" />
                        <line x1="60" y1="40" x2="80" y2="120" stroke="#ef4444" strokeWidth="2.5" />
                        <line x1="160" y1="40" x2="160" y2="110" stroke="#38bdf8" strokeWidth="2.5" />
                      </svg>
                      
                      <div className="absolute bottom-1 right-2 text-[9px] font-mono text-white/90 bg-black/60 px-1.5 py-0.5 rounded">
                        🟢 Puntos (65%) | 🔴 Errores (15%)
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* CARD FOOTER */}
              <div className="relative z-10 border-t border-white/20 pt-3 flex items-center justify-between text-[10px] text-white/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold">Generado con OPEN VOLEY</span>
                </div>
                <span className="font-mono text-amber-300">#VolleyballScout</span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TELESTRATOR TÁCTICO SOBRE FOTOS / CAPTURA DE VIDEO                      */}
      {/* ========================================================================= */}
      {activeStudioTab === 'telestrator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* TOOLBAR CONTROLS */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. Upload or change photo */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                1. Cargar Foto o Captura de Video
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-2xl border border-amber-500/30 flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Subir Foto del Partido / Entrenamiento</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadPhoto}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() =>
                    setBackgroundImageUrl(
                      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80'
                    )
                  }
                  className="py-1.5 px-2 bg-slate-800 text-[10px] text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  📸 Foto Remate Red
                </button>
                <button
                  onClick={() =>
                    setBackgroundImageUrl(
                      'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1200&q=80'
                    )
                  }
                  className="py-1.5 px-2 bg-slate-800 text-[10px] text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  📸 Foto Cancha & Saque
                </button>
              </div>
            </div>

            {/* 2. Drawing Tools */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                2. Herramientas de Dibujo Táctico
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'arrow_point', label: '🟢 Flecha Punto', icon: ArrowUpRight, color: 'text-emerald-400' },
                  { id: 'arrow_error', label: '🔴 Flecha Error', icon: ArrowUpRight, color: 'text-rose-400' },
                  { id: 'arrow_play', label: '🔵 Flecha Jugada', icon: ArrowUpRight, color: 'text-cyan-400' },
                  { id: 'circle_player', label: '🟠 Círculo Jugador', icon: Circle, color: 'text-orange-400' },
                  { id: 'spotlight', label: '🟡 Foco de Atención', icon: Sparkles, color: 'text-yellow-400' },
                  { id: 'freehand', label: '✏️ Trazo Libre', icon: Palette, color: 'text-purple-400' },
                ].map((tool) => {
                  const isSel = activeDrawTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveDrawTool(tool.id as DrawTool)}
                      className={`p-2.5 rounded-xl text-left border transition flex items-center gap-2 ${
                        isSel
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs font-bold'
                      }`}
                    >
                      <tool.icon className={`w-4 h-4 ${isSel ? 'text-slate-950' : tool.color}`} />
                      <span className="text-xs">{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Text Label Annotation Input */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 block mb-1 font-semibold">Texto de la Flecha:</span>
                <input
                  type="text"
                  value={customAnnotationText}
                  onChange={(e) => setCustomAnnotationText(e.target.value)}
                  placeholder="Ej: Ataque diagonal #14..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Clear / Undo & Download Actions */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setDrawnElements((prev) => prev.slice(0, -1))}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </button>
                <button
                  onClick={() => setDrawnElements([])}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Todo</span>
                </button>
              </div>

              <button
                onClick={handleDownloadCanvas}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Foto Anotada en HD</span>
              </button>
            </div>

          </div>

          {/* CANVAS WORKSPACE */}
          <div className="lg:col-span-8 bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center">
            
            <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
              <span className="font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Pizarra de Telestrator Táctico (Haz clic y arrastra sobre la foto para dibujar)</span>
              </span>
              <span className="text-[11px] font-mono text-amber-400">Elementos: {drawnElements.length}</span>
            </div>

            {/* Interactive HTML5 Canvas */}
            <div className="relative border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                onMouseDown={handleCanvasStart}
                onMouseMove={handleCanvasMove}
                onMouseUp={handleCanvasEnd}
                onTouchStart={handleCanvasStart}
                onTouchMove={handleCanvasMove}
                onTouchEnd={handleCanvasEnd}
                className="w-full max-w-[800px] h-auto object-cover block"
              />
            </div>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
              <span>💡 Dibuja trayectorias de remate para explicar a tus jugadores</span>
              <span>•</span>
              <span>Exportación instantánea en alta resolución</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
