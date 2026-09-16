import React, { useState } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Target, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Scale, 
  Flame, 
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Calculator,
  Compass,
  FileText,
  Sliders
} from 'lucide-react';

interface PrdAnalysisData {
  productTitle: string;
  feasibilityScore: number;
  profitabilityVerdict: 'ALTA' | 'MEDIA' | 'CONDICIONADA' | 'NO RECOMENDADA';
  verdictHeadline: string;
  executiveSummary: string;
  problemStatement: {
    targetRole: string;
    observablePain: string;
    costOfNotSolving: string;
    currentWorkaround: string;
  };
  thesisAndSwitch: {
    whyNow: string;
    switchTrigger: string;
  };
  hypothesis: {
    statement: string;
    successSignal: string;
    failureCondition: string;
  };
  mvpScope: {
    mvpFeatures: string[];
    nonGoals: string[];
    doorCheck: string;
  };
  unitEconomics: {
    suggestedPriceLatam: string;
    suggestedPriceGlobal: string;
    estimatedCac: string;
    estimatedLtv: string;
    breakEvenCustomers: number;
    grossMarginPercent: number;
    financialSummary: string;
  };
  caganFourRisks: {
    valueRisk: { level: 'BAJO' | 'MEDIO' | 'ALTO'; assessment: string };
    usabilityRisk: { level: 'BAJO' | 'MEDIO' | 'ALTO'; assessment: string };
    feasibilityRisk: { level: 'BAJO' | 'MEDIO' | 'ALTO'; assessment: string };
    viabilityRisk: { level: 'BAJO' | 'MEDIO' | 'ALTO'; assessment: string };
  };
  actionPlanNextSteps: string[];
}

const PRESET_IDEAS = [
  {
    title: 'SaaS Vóley para Clubes de Barrio & Colegios',
    idea: 'Crear un software de scouting simplificado accesible desde tablet o celular para clubes de barrio, colegios y divisiones formativas en LATAM, cobrando 25 a 35 USD/mes por club, reemplazando las planillas de papel.',
    market: 'LATAM / Argentina',
    audience: 'Clubes de Barrio, Colegios y Entrenadores de Formativas',
    model: 'SaaS mensual recurrente por club',
    price: '29 USD / mes',
  },
  {
    title: 'Análisis Predictivo de Saque con IA',
    idea: 'Desarrollar un asistente de inteligencia artificial que analice la rotación rival y recomiende en tiempo real la zona exacta y el tipo de saque más vulnerable según el receptor con peor rendimiento.',
    market: 'LATAM & Internacional',
    audience: 'Cuerpos Técnicos de Primera División y Ligas A1',
    model: 'Add-on premium en suscripción anual',
    price: '50 USD / mes adicional',
  },
  {
    title: 'Servicio de Scouting Tercerizado Remoto',
    idea: 'Plataforma donde un club sube el video de su partido grabado con un smartphone y un equipo de estadígrafos certificados le entrega el archivo .DVW y planilla P2 en menos de 12 horas.',
    market: 'LATAM / España',
    audience: 'Equipos sin analista propio de planta',
    model: 'Pago por partido / Paquete de torneo',
    price: '35 USD por partido analizado',
  },
  {
    title: 'App Móvil para Padres y Streaming en Vivo',
    idea: 'Portal para que los padres y simpatizantes sigan el tablero de puntos, rotaciones y estadísticas individuales de sus hijas/hijos en tiempo real desde el celular con micropagos o abono familiar.',
    market: 'Argentina / Brasil / México',
    audience: 'Familias y seguidores de voleibol formativo',
    model: 'B2C Suscripción familiar mensual',
    price: '4.99 USD / mes por familia',
  },
];

export const PrdFeasibilitySection: React.FC = () => {
  const [ideaInput, setIdeaInput] = useState('');
  const [targetMarket, setTargetMarket] = useState('LATAM / Argentina');
  const [targetAudience, setTargetAudience] = useState('Clubes y Entrenadores de Vóley');
  const [monetizationModel, setMonetizationModel] = useState('SaaS mensual recurrente');
  const [estimatedPrice, setEstimatedPrice] = useState('29 USD / mes');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrdAnalysisData | null>(null);
  const [copied, setCopied] = useState(false);

  // Interactive Simulator State
  const [simClubCount, setSimClubCount] = useState<number>(20);
  const [simMonthlyFee, setSimMonthlyFee] = useState<number>(35);

  const handleApplyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setIdeaInput(preset.idea);
    setTargetMarket(preset.market);
    setTargetAudience(preset.audience);
    setMonetizationModel(preset.model);
    setEstimatedPrice(preset.price);
  };

  const handleGenerateAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: ideaInput,
          targetMarket,
          targetAudience,
          monetizationModel,
          estimatedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el evaluador');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error generating PRD:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    const md = generateMarkdownText(result);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const md = generateMarkdownText(result);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = result.productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'producto';
    a.href = url;
    a.download = `${slug}.prd.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownText = (res: PrdAnalysisData) => {
    return `# PRD & Estudio de Rentabilidad: ${res.productTitle}

**Veredicto de Rentabilidad:** ${res.profitabilityVerdict} (Score: ${res.feasibilityScore}/100)
**Titular:** ${res.verdictHeadline}

---

## 1. Resumen Ejecutivo
${res.executiveSummary}

## 2. Declaración del Problema
- **Usuario afectado:** ${res.problemStatement.targetRole}
- **Dolor observable hoy:** ${res.problemStatement.observablePain}
- **Costo de no resolverlo:** ${res.problemStatement.costOfNotSolving}
- **Cómo sobreviven hoy:** ${res.problemStatement.currentWorkaround}

## 3. Tesis & Motivo de Cambio (Why Now & Switch)
- **¿Por qué ahora?:** ${res.thesisAndSwitch.whyNow}
- **Disparador de compra/cambio:** ${res.thesisAndSwitch.switchTrigger}

## 4. Hipótesis Falsable
> **Apuesta:** ${res.hypothesis.statement}
> **Señal de ÉXITO:** ${res.hypothesis.successSignal}
> **Condición de ERROR:** ${res.hypothesis.failureCondition}

## 5. Alcance de MVP & Non-Goals
### Incluido en el MVP:
${res.mvpScope.mvpFeatures.map((f) => `- [x] ${f}`).join('\n')}

### Non-Goals (Qué NO construir para no perder tiempo/dinero):
${res.mvpScope.nonGoals.map((ng) => `- [ ] ❌ ${ng}`).join('\n')}

**Tipo de Decisión:** ${res.mvpScope.doorCheck}

## 6. Unit Economics & Proyección Financiera
- **Precio Sugerido LATAM:** ${res.unitEconomics.suggestedPriceLatam}
- **Precio Sugerido Global:** ${res.unitEconomics.suggestedPriceGlobal}
- **Costo de Adquisición (CAC):** ${res.unitEconomics.estimatedCac}
- **Valor de Vida (LTV):** ${res.unitEconomics.estimatedLtv}
- **Clientes para Punto de Equilibrio:** ${res.unitEconomics.breakEvenCustomers} clientes
- **Margen Bruto Estimado:** ${res.unitEconomics.grossMarginPercent}%
- **Resumen Financiero:** ${res.unitEconomics.financialSummary}

## 7. Matriz de los 4 Riesgos de Marty Cagan
- **Riesgo de Valor:** [${res.caganFourRisks.valueRisk.level}] ${res.caganFourRisks.valueRisk.assessment}
- **Riesgo de Usabilidad:** [${res.caganFourRisks.usabilityRisk.level}] ${res.caganFourRisks.usabilityRisk.assessment}
- **Riesgo de Factibilidad:** [${res.caganFourRisks.feasibilityRisk.level}] ${res.caganFourRisks.feasibilityRisk.assessment}
- **Riesgo de Viabilidad de Negocio:** [${res.caganFourRisks.viabilityRisk.level}] ${res.caganFourRisks.viabilityRisk.assessment}

## 8. Plan de Acción Inmediato (Próximos Pasos)
${res.actionPlanNextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}
`;
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'ALTA':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Flame className="w-5 h-5 text-emerald-400" />,
          label: 'ALTA RENTABILIDAD',
        };
      case 'MEDIA':
        return {
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
          label: 'RENTABILIDAD MODERADA',
        };
      case 'CONDICIONADA':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          label: 'VIABLE CON CONDICIONES',
        };
      default:
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          label: 'RIESGOSA / NO RECOMENDADA',
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Laboratorio de Validación & Viabilidad Comercial
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Generador de PRD & Análisis de Rentabilidad
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Plantea una idea o nueva funcionalidad para <strong className="text-slate-200">OPEN VOLEY</strong> o tu negocio. El sistema aplicará la metodología formal de Product Management (problema real, hipótesis falsable, MVP y finanzas unitarias) para dictaminar si es rentable o una pérdida de tiempo.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono">
            <Compass className="w-3.5 h-3.5 text-amber-400" /> Skill: plan-create-prd
          </div>
        </div>

        {/* Preset Idea Buttons */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Ejemplos Rápidos de Ideas para Probar:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESET_IDEAS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-left p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition group space-y-1"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition truncate">
                  {preset.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.idea}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-semibold pt-1">
                  {preset.price}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerateAnalysis} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Describe la Idea, Servicio o Nueva Funcionalidad:</span>
              <span className="text-[11px] text-slate-500 font-normal">Enfócate en qué problema resuelve y a quién</span>
            </label>
            <textarea
              rows={3}
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="Ej: Quiero crear un módulo de análisis táctico automatizado donde el DT solo hace clic en 'Analizar Rival' y el sistema le da las debilidades del receptor #4 y sugiere dónde dirigir los saques..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition resize-none leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Mercado Objetivo:</label>
              <select
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="LATAM / Argentina">LATAM / Argentina</option>
                <option value="Brasil & Sudamérica">Brasil & Sudamérica</option>
                <option value="Europa / España / Italia">Europa / España / Italia</option>
                <option value="Estados Unidos (NCAA / Clubes)">Estados Unidos (NCAA / Clubes)</option>
                <option value="Global Multilenguaje">Global Multilenguaje</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Audiencia Principal:</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                placeholder="Ej. Clubes y Entrenadores"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Modelo de Monetización:</label>
              <select
                value={monetizationModel}
                onChange={(e) => setMonetizationModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="SaaS mensual recurrente">SaaS mensual recurrente</option>
                <option value="Licencia Anual por Club">Licencia Anual por Club</option>
                <option value="Pago por Partido / Torneo">Pago por Partido / Torneo</option>
                <option value="Freemium + Add-ons">Freemium + Add-ons</option>
                <option value="B2C Abono Familias / Jugadores">B2C Abono Familias / Jugadores</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Precio Estimado:</label>
              <input
                type="text"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                placeholder="Ej. 29 USD / mes"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !ideaInput.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analizando Viabilidad con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluar Rentabilidad & Generar PRD</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Verdict Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getVerdictBadge(result.profitabilityVerdict).bg}`}>
                    {getVerdictBadge(result.profitabilityVerdict).icon}
                    {getVerdictBadge(result.profitabilityVerdict).label}
                  </span>
                  <div className="text-xs font-mono text-slate-400">
                    Score de Factibilidad: <strong className="text-amber-400">{result.feasibilityScore}/100</strong>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {result.productTitle}
                </h3>
                <p className="text-sm font-semibold text-amber-400">
                  {result.verdictHeadline}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado al Portapapeles' : 'Copiar PRD'}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .prd.md</span>
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Resumen Ejecutivo & Tesis de Negocio
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {result.executiveSummary}
              </p>
            </div>

            {/* 4 Risks Grid of Marty Cagan */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-400" /> Test de Presión: Los 4 Grandes Riesgos de Producto (Marty Cagan)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">1. Riesgo de Valor</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      result.caganFourRisks.valueRisk.level === 'BAJO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {result.caganFourRisks.valueRisk.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {result.caganFourRisks.valueRisk.assessment}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">2. Riesgo de Usabilidad</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      result.caganFourRisks.usabilityRisk.level === 'BAJO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {result.caganFourRisks.usabilityRisk.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {result.caganFourRisks.usabilityRisk.assessment}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">3. Riesgo de Factibilidad</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      result.caganFourRisks.feasibilityRisk.level === 'BAJO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {result.caganFourRisks.feasibilityRisk.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {result.caganFourRisks.feasibilityRisk.assessment}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">4. Viabilidad de Negocio</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      result.caganFourRisks.viabilityRisk.level === 'BAJO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {result.caganFourRisks.viabilityRisk.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {result.caganFourRisks.viabilityRisk.assessment}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Problem vs Workaround & Falsifiable Hypothesis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem Statement Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4" /> Problema Observable & Costo Real
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Rol que sufre el dolor:</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">{result.problemStatement.targetRole}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Dolor observable en la cancha:</div>
                  <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{result.problemStatement.observablePain}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Cómo sobreviven hoy (competidor/parche):</div>
                  <div className="text-xs text-amber-300 mt-0.5 leading-relaxed">{result.problemStatement.currentWorkaround}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">¿Por qué cambiarán hoy?:</div>
                  <div className="text-xs text-emerald-300 mt-0.5 leading-relaxed">{result.thesisAndSwitch.switchTrigger}</div>
                </div>
              </div>
            </div>

            {/* Falsifiable Hypothesis Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" /> Hipótesis Falsable de Negocio
              </div>

              <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-2xl space-y-3">
                <div className="text-xs font-black text-purple-300 uppercase tracking-wide">
                  La Apuesta:
                </div>
                <p className="text-sm font-medium text-purple-100 leading-relaxed">
                  "{result.hypothesis.statement}"
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-emerald-950/20 border border-emerald-800/40 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sabremos que acertamos si:
                  </div>
                  <div className="text-xs text-emerald-200 leading-relaxed">
                    {result.hypothesis.successSignal}
                  </div>
                </div>

                <div className="bg-rose-950/20 border border-rose-800/40 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <XCircle className="w-3.5 h-3.5" /> Sabremos que nos equivocamos si:
                  </div>
                  <div className="text-xs text-rose-200 leading-relaxed">
                    {result.hypothesis.failureCondition}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MVP Definition & Non-Goals */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4" /> Alcance del Producto Mínimo Viable (MVP en 2 a 3 semanas)
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 font-mono rounded-lg border border-slate-700">
                {result.mvpScope.doorCheck}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Features IN */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Qué Construir en el MVP (Imprescindible):
                </div>
                <ul className="space-y-2">
                  {result.mvpScope.mvpFeatures.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Non-Goals OUT */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Non-Goals (Qué NO construir para no quemar plata):
                </div>
                <ul className="space-y-2">
                  {result.mvpScope.nonGoals.map((ng, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{ng}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Unit Economics & Live Financial Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <DollarSign className="w-4 h-4" /> Unit Economics & Simulador Financiero en Vivo
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-[11px] font-bold text-slate-400">Precio Sugerido LATAM</div>
                <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1">
                  {result.unitEconomics.suggestedPriceLatam}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-[11px] font-bold text-slate-400">Precio Sugerido Global</div>
                <div className="text-lg sm:text-xl font-black text-blue-400 font-mono mt-1">
                  {result.unitEconomics.suggestedPriceGlobal}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-[11px] font-bold text-slate-400">Punto de Equilibrio</div>
                <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-1">
                  {result.unitEconomics.breakEvenCustomers} clientes
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <div className="text-[11px] font-bold text-slate-400">Margen Bruto Software</div>
                <div className="text-lg sm:text-xl font-black text-purple-400 font-mono mt-1">
                  {result.unitEconomics.grossMarginPercent}%
                </div>
              </div>
            </div>

            {/* Financial Narrative */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong>Análisis de Flujo de Caja:</strong> {result.unitEconomics.financialSummary}
            </div>

            {/* Interactive Calculator Slider */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" /> Simulador Interactivo de Ingresos Recurrentes (MRR / ARR):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Cantidad de Clubes / DTs Activos:</span>
                    <span className="font-mono font-black text-amber-400">{simClubCount} clubes</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={simClubCount}
                    onChange={(e) => setSimClubCount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Precio Mensual por Club (USD):</span>
                    <span className="font-mono font-black text-emerald-400">${simMonthlyFee} USD / mes</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={120}
                    step={5}
                    value={simMonthlyFee}
                    onChange={(e) => setSimMonthlyFee(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div className="p-3 bg-slate-900 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Ingreso Mensual (MRR)</div>
                  <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                    ${(simClubCount * simMonthlyFee).toLocaleString('es-AR')} USD
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Ingreso Anual (ARR)</div>
                  <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                    ${(simClubCount * simMonthlyFee * 12).toLocaleString('es-AR')} USD
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Ganancia Neta Est. (90%)</div>
                  <div className="text-base sm:text-lg font-black text-purple-400 font-mono">
                    ${Math.round(simClubCount * simMonthlyFee * 12 * 0.9).toLocaleString('es-AR')} USD/año
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Plan (Next 3 Steps) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <ArrowRight className="w-4 h-4" /> Plan de Validación Rápida: Los Próximos 3 Pasos
            </div>
            <div className="space-y-3">
              {result.actionPlanNextSteps.map((step, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
