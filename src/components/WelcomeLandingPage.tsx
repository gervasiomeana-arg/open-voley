import React, { useState, useEffect } from 'react';
import { 
  Volleyball, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Layers, 
  Video, 
  BarChart3, 
  Share2, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Award, 
  Clock, 
  Users, 
  CreditCard,
  ChevronRight,
  LogIn,
  Check,
  Flame,
  Star,
  FileSpreadsheet,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { SubscriptionPlansModal } from './SubscriptionPlansModal';
import ZoomTextTunnel from './ZoomTextTunnel';

interface WelcomeLandingPageProps {
  onStartFreeTrial: () => void;
  onClientLogin: () => void;
  onOpenPlansModal: () => void;
}

export const WelcomeLandingPage: React.FC<WelcomeLandingPageProps> = ({
  onStartFreeTrial,
  onClientLogin,
  onOpenPlansModal,
}) => {
  const [activeTab, setActiveTab] = useState<'scout' | 'video' | 'ai' | 'media'>('scout');

  // Comparison Lock State
  const [isComparisonUnlocked, setIsComparisonUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('openvoley_pricing_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [compKeyInput, setCompKeyInput] = useState('');
  const [compKeyError, setCompKeyError] = useState('');

  // Auto-track visitor lead to openvoley.com
  useEffect(() => {
    try {
      fetch('/api/visitors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: window.location.hostname || 'openvoley.com',
          page: window.location.pathname || '/',
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Móvil' : 'PC / Laptop',
          action: 'Visita Landing Oficial',
        }),
      }).catch((e) => console.warn('Visitor beacon notice:', e));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleUnlockComparison = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = compKeyInput.trim().toUpperCase();
    if (clean === 'CAR123' || clean === 'NEXUS30') {
      setIsComparisonUnlocked(true);
      setCompKeyError('');
      try {
        sessionStorage.setItem('openvoley_pricing_unlocked', 'true');
      } catch (e) {
        console.warn(e);
      }
    } else {
      setCompKeyError('Clave incorrecta. Ingrese la clave válida para ver la comparativa.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20">
              <Volleyball className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                  OPEN<span className="text-amber-400">VOLEY</span>
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v2.8 PRO
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block">
                Software de Scouting Profesional & Análisis Táctico
              </p>
            </div>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onOpenPlansModal}
              className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              <span>Ver Planes & Precios</span>
            </button>

            {/* BOTÓN 1: Clientes Existentes (Ya pagaron o tienen cuenta) */}
            <button
              onClick={onClientLogin}
              className="bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Soy Cliente /</span>
              <span>Iniciar Sesión</span>
            </button>

            {/* BOTÓN 2: CTA Principal - Prueba Gratis de 7 Días */}
            <button
              onClick={onStartFreeTrial}
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Probar 7 Días Gratis</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Propuesta de Valor Disruptiva con Imagen de Fondo */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800 bg-slate-950 min-h-[85vh] flex items-center justify-center">
        {/* Background Image Container - Highly Visible & Vivid */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://plus.unsplash.com/premium_photo-1661963404614-74802f16a7a0?fm=jpg&q=85&w=3000&auto=format&fit=crop"
            alt="Fondo Vóley Oficial"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-85 scale-100"
          />
          {/* Elegant Dark Overlay with Backdrop Blur for Perfect Readability */}
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950" />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-amber-500/20 blur-3xl rounded-full pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-black shadow-inner animate-fade-in">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>SUITE PROFESIONAL DE VIDEOANÁLISIS & SCOUTING FIVB</span>
          </div>

          {/* Infinite Zoom Text Tunnel Display */}
          <div className="relative w-full max-w-3xl mx-auto h-28 sm:h-36 md:h-44 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden flex items-center justify-center p-4">
            {/* Soft backdrop ambient glow */}
            <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
            
            <ZoomTextTunnel
              texts={["SCOUTING", "ANÁLISIS", "ESTADÍSTICAS", "ENTRENADOR", "OPEN VOLEY"]}
              color="#F59E0B"
              hold={700}
              maxScale={32}
              font={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(32px, 7vw, 80px)",
                letterSpacing: "-0.03em",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            />
          </div>

          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
              BIENVENIDO A <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">OPEN VOLEY</span>
            </h1>
            <p className="text-lg sm:text-2xl font-bold text-amber-300/90 max-w-3xl mx-auto">
              La plataforma inteligente de scouting y videoanálisis que revoluciona el vóleibol.
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Diseñado exclusivamente por y para entrenadores de vóley. Sin dongles USB físicos, sin instalaciones pesadas y con <strong className="text-white">compatibilidad nativa DataVolley (.DVW) y planillas oficiales FIVB</strong>.
          </p>

          {/* CTA Action Block */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartFreeTrial}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-3 transition transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 fill-slate-950" />
              <span>Comenzar Prueba Gratis de 7 Días</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onClientLogin}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-base px-7 py-4 rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-sky-400" />
              <span>Ya tengo Cuenta / Iniciar Sesión</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400 pt-2 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sin tarjeta requerida</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Acceso directo con Google</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Web: PC, Mac, iPad y Celular</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 DETAILED SERVICES SECTION: SERVICIOS QUE BRINDA OPEN VOLEY */}
      <section className="py-16 sm:py-24 bg-slate-900/90 border-b border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>Módulos y Capacidades Profesionales</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ¿Qué servicios y herramientas te brinda OPEN VOLEY?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-3xl mx-auto">
              Una suite integral diseñada para cubrir cada etapa del trabajo técnico: desde el registro del punto en vivo hasta la charla táctica con video y estadísticas FIVB.
            </p>
          </div>

          {/* 5 Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Scouting Táctico en Vivo */}
            <div className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">Módulo 1</span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Scouting en Vivo & Consola Internacional
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Registra cada punto, saque, recepción, armado, ataque, bloqueo y defensa en tiempo real con rotaciones exactas (P1 a P6).
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Codificación rápida estándar (<code className="text-amber-300 font-mono">*07AH#</code>)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Modo interactivo táctil para celular y tablet sin memorizar códigos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Control de zonas de cancha (1 a 9) y trayectorias</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Videoanálisis HD & Montaje */}
            <div className="bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-110 transition">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">Módulo 2</span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Video Sincronizado & Montaje de Jugadas
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Vincula el video del partido (archivos MP4 de tu celular o transmisiones de YouTube) con cada jugada registrada en el scout.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Salto instantáneo al video exacto con un solo clic</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Filtros tácticos: *"Ver todos los ataques en diagonal del opuesto"*</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Herramientas de dibujo en pantalla (Telestrator) para charlas técnicas</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Planilla Oficial FIVB Box Score */}
            <div className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Módulo 3</span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Planilla Oficial FIVB P2 & Estadísticas
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Cálculo automatizado en tiempo real de todas las métricas reglamentarias de la Federación Internacional de Voleibol.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eficacia y eficiencia neta de ataque y bloqueo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Porcentajes de recepción Positiva (+) y Perfecta (#)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportación directa a PDF e impresión para el DT y jugadores</span>
                </li>
              </ul>
            </div>

            {/* Card 4: Compatibilidad .DVW */}
            <div className="bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl transition duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider">Módulo 4</span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Intercambio & Archivos Oficiales .DVW
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Cero barreras de formato. Abre cualquier scout previo y exporta tus partidos para compartirlos con otras instituciones.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Importación de archivos Data Volley (.dvw)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Exportación de partidos en formato estándar internacional</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Intercambio fluido con ligas nacionales y selecciones</span>
                </li>
              </ul>
            </div>

            {/* Card 5: IA Coach & Inteligencia Táctica */}
            <div className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl transition duration-200 group lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 self-start sm:self-auto">
                  Módulo 5 • Tecnología Avanzada
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Inteligencia Táctica & HUD de Visión Asistida
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Asistente analítico inteligente que detecta debilidades en la recepción contraria, tendencias de distribución del armador en momentos de presión (clutch) y efectividad por zona de ataque.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Detección de patrones del colocador</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Mapa de calor y telemetría de saques rivales</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Trust Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">
                ¿Listo para profesionalizar el análisis de tu equipo?
              </h4>
              <p className="text-xs sm:text-sm text-slate-400">
                Inicia en 10 segundos con tu cuenta de Google y accede a todas las funciones sin límites.
              </p>
            </div>
            <button
              onClick={onStartFreeTrial}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Probar OPEN VOLEY Ahora</span>
            </button>
          </div>

        </div>
      </section>

      {/* 3. Live Interactive Feature Showcase Tabs */}
      <section className="py-16 sm:py-24 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Todo lo que necesitas en una sola plataforma
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Diseñado por y para entrenadores, analistas y estadísticos de vóley de todos los niveles.
            </p>
          </div>

          {/* Feature Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 max-w-3xl mx-auto">
            <button
              onClick={() => setActiveTab('scout')}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'scout'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Scouting & Planilla</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video & Telestrator</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>IA Coach & Táctica</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Media Studio & Redes</span>
            </button>
          </div>

          {/* Active Tab Showcase Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {activeTab === 'scout' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Scouting Rápido & Código DataVolley</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Teclado Táctil y Código Oficial sin Complicaciones
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Carga acciones en vivo durante el partido con botones gigantes o escribiendo código estándar (ej: <code className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-mono">18a#</code>).
                    Genera la planilla oficial FIVB P2 Box Score con 1 clic en PDF o Excel.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Estadísticas de Eficacia, Errores y Aceptación por Rotación.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Exportación e importación de archivos estándar <code>.DVW</code>.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Planilla de Kinesiología y Ficha Técnica de Jugadores.</span>
                    </li>
                  </ul>
                  <button
                    onClick={onStartFreeTrial}
                    className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold text-sm"
                  >
                    <span>Probar el Scouting en Vivo gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner">
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                      <span className="text-amber-400 font-bold">SET 1: NUEVO HORIZONTE (25) vs CLUB RIVAL (21)</span>
                      <span className="text-emerald-400 font-bold">FIVB P2 READY</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">ATAQUE</div>
                        <div className="text-base font-black text-white">58% Efic.</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">RECEPCIÓN</div>
                        <div className="text-base font-black text-emerald-400">72% Pos.</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">BLOQUEO</div>
                        <div className="text-base font-black text-sky-400">9 Pts</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">SAQUE</div>
                        <div className="text-base font-black text-amber-400">5 Aces</div>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                      ▶ <code>*04S#01A</code> | Saque Punto Directo - Zona 1 hacia Zona 5
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs">
                    <Video className="w-4 h-4" />
                    <span>Sincronizador & Video Clips HD</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Sube el video de tu celular y corta jugadas al instante
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Sube el archivo MP4 grabado con la cámara del club. Al hacer clic en cualquier punto de la planilla, el video saltará exactamente a esa jugada con cámara lenta y herramientas de dibujo táctico (Telestrator).
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Filtro por jugador (Ej: "Ver todos los ataques de punta de #7").</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Telestrator profesional: flechas, círculos y zonas de bloqueo sobre el video.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Exportación de cortes en MP4 para enviar por WhatsApp a los jugadores.</span>
                    </li>
                  </ul>
                  <button
                    onClick={onStartFreeTrial}
                    className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-bold text-sm"
                  >
                    <span>Probar el sincronizador de video</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                  <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    <div className="z-10 text-center space-y-2">
                      <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                        <Play className="w-7 h-7 fill-amber-400 ml-1" />
                      </div>
                      <div className="text-xs font-bold text-white">Sincronización Automática con Código Scout</div>
                      <div className="text-[10px] text-emerald-400 font-mono">00:14:32 • Remate Diagonal #12 (Punto)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>IA Coach & Detección de Patrones</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Inteligencia Artificial que Analiza las Tendencias del Rival
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Nuestro motor de IA analiza automáticamente hacia dónde arma el rival en situaciones de K1, qué diagonales prefiere su opuesto en momentos calientes y genera reportes tácticos listos para la charla técnica.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Mapa de calor de ataque y zonas débiles de la recepción rival.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Sugerencias automáticas de ajustes de bloqueo y defensa.</span>
                    </li>
                  </ul>
                  <button
                    onClick={onStartFreeTrial}
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm"
                  >
                    <span>Ver la IA Coach en acción</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 text-slate-950 font-black flex items-center justify-center text-xs">
                      AI
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Diagnóstico del Asistente Táctico</div>
                      <div className="text-[10px] text-slate-400">Análisis basado en 42 ataques del set</div>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-900/50 text-xs text-indigo-200 leading-relaxed">
                    "El atacante opuesto rival (#9) define el <strong>78%</strong> de las pelotas separadas hacia la diagonal corta (Zona 4/5). Se recomienda cerrar la línea con el central y liberar al líbero para defensa de cajón."
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 font-bold text-xs">
                    <Share2 className="w-4 h-4" />
                    <span>Media Studio para Redes Sociales</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Crea Placas de Partido y Estadísticas para Instagram
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Potencia la imagen de tu club. Genera placas automáticas de "MVP del Partido", "Resultado Final" y "Líderes de Puntos" con el escudo y colores de tu equipo listas para descargar y publicar.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Formatos listos para Instagram Story (9:16) y Feed (1:1).</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Personalización de sponsors, tipografías y colores del club.</span>
                    </li>
                  </ul>
                  <button
                    onClick={onStartFreeTrial}
                    className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-bold text-sm"
                  >
                    <span>Diseñar placas de partido gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
                  <div className="w-56 mx-auto bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">★ MVP DEL PARTIDO ★</div>
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-400 mx-auto flex items-center justify-center text-xl font-black text-white">
                      #10
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Facundo Conte</div>
                      <div className="text-[10px] text-slate-400">Receptor Punta</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-950/80 p-2 rounded-lg font-mono">
                      <div>24 Pts Totales</div>
                      <div className="text-emerald-400">4 Aces Directos</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Comparison Table: OPEN VOLEY vs Data Volley (Password Protected) */}
      <section className="py-16 sm:py-20 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Comparativa Transparente & Tarifas</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ¿Por qué los clubes se están cambiando a OPEN VOLEY?
            </h2>
          </div>

          {!isComparisonUnlocked ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl space-y-6 relative overflow-hidden">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Acceso Restringido • Comparativa Comercial
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Comparativa de Mercado & Precios
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  El análisis de tarifas y costos frente a Data Volley 4 y VolleyStation se encuentra temporalmente protegido. Ingrese la clave para desbloquear.
                </p>
              </div>

              <form onSubmit={handleUnlockComparison} className="space-y-4 max-w-sm mx-auto">
                <div className="relative text-left">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="Clave de acceso (ej: CAR123)"
                    value={compKeyInput}
                    onChange={(e) => {
                      setCompKeyInput(e.target.value);
                      if (compKeyError) setCompKeyError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-mono"
                  />
                </div>

                {compKeyError && (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{compKeyError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" /> Desbloquear Comparativa
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between px-6 text-xs text-slate-400">
                <span className="flex items-center gap-2 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Comparativa desbloqueada con clave de acceso
                </span>
                <button
                  onClick={() => {
                    setIsComparisonUnlocked(false);
                    sessionStorage.removeItem('openvoley_pricing_unlocked');
                  }}
                  className="text-slate-500 hover:text-rose-400 font-bold flex items-center gap-1 transition"
                >
                  <Lock className="w-3.5 h-3.5" /> Volver a Proteger
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="p-4 font-bold">Característica</th>
                      <th className="p-4 font-bold text-rose-400">Data Volley 4</th>
                      <th className="p-4 font-bold text-slate-300">VolleyStation</th>
                      <th className="p-4 font-black text-amber-400 bg-amber-500/10">OPEN VOLEY PRO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="p-4 font-medium">Costo Anual</td>
                      <td className="p-4 text-rose-400 font-bold">$799 - $1,199 USD</td>
                      <td className="p-4 text-slate-400">$590 USD</td>
                      <td className="p-4 text-emerald-400 font-black bg-amber-500/5">Desde $35.000 ARS / mes (~$35 USD)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Prueba Gratuita</td>
                      <td className="p-4 text-rose-400">No (Solo demo limitada)</td>
                      <td className="p-4 text-slate-400">Requiere tarjeta</td>
                      <td className="p-4 text-emerald-400 font-bold bg-amber-500/5">✓ 7 Días 100% Gratis con Google</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Dispositivos</td>
                      <td className="p-4 text-rose-400">Solo Windows (Dongle USB)</td>
                      <td className="p-4 text-slate-400">Mac y Windows</td>
                      <td className="p-4 text-emerald-400 font-bold bg-amber-500/5">✓ Web: PC, Mac, iPad, Android y Móvil</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Formas de Pago</td>
                      <td className="p-4 text-slate-400">Tarjeta en USD internacional</td>
                      <td className="p-4 text-slate-400">Tarjeta en USD internacional</td>
                      <td className="p-4 text-sky-400 font-bold bg-amber-500/5">✓ Mercado Pago (Pesos), Tarjetas y CBU</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Inteligencia Artificial</td>
                      <td className="p-4 text-rose-400">No disponible</td>
                      <td className="p-4 text-rose-400">No disponible</td>
                      <td className="p-4 text-amber-400 font-bold bg-amber-500/5">✓ IA Coach & Detección de Patrones</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Compatibilidad de Archivos</td>
                      <td className="p-4 text-slate-400">Propietario</td>
                      <td className="p-4 text-slate-400">Importa DVW</td>
                      <td className="p-4 text-emerald-400 font-bold bg-amber-500/5">✓ Exporta e Importa .DVW Oficial</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Final Call to Action Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
            <Volleyball className="w-8 h-8 animate-bounce" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Comienza a analizar tus partidos hoy mismo
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Activa tus <strong className="text-amber-400">7 días de prueba completa</strong> en menos de 10 segundos con tu cuenta de Google. Sin compromisos ni tarjetas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartFreeTrial}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 fill-slate-950" />
              <span>Activar Prueba Gratis de 7 Días</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onClientLogin}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-base px-6 py-4 rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-sky-400" />
              <span>Acceso para Clientes Registrados</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center text-xs text-slate-500 space-y-2">
        <div className="font-mono font-bold text-slate-400">
          OPEN VOLEY © 2026 • Plataforma de Scouting y Video Análisis
        </div>
        <p>Integración oficial con Mercado Pago Checkout Pro y autenticación segura con Google OAuth.</p>
      </footer>
    </div>
  );
};
