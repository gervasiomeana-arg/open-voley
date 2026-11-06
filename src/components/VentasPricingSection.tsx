import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Calculator, 
  Users, 
  Award, 
  ArrowRight, 
  Globe, 
  Smartphone, 
  HelpCircle,
  BarChart3,
  Percent,
  Flame,
  Check,
  CreditCard,
  Receipt
} from 'lucide-react';
import { SubscriptionPlansModal } from './SubscriptionPlansModal';
import { CuentaCorrienteSection } from './CuentaCorrienteSection';

export const VentasPricingSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ESTRATEGIA' | 'CUENTA_CORRIENTE'>('ESTRATEGIA');
  const [showPlansModal, setShowPlansModal] = useState(false);
  // Interactive pricing calculator states
  const [openVoleyMonthlyPrice, setOpenVoleyMonthlyPrice] = useState<number>(19); // $19 USD / mes
  const [targetClubs, setTargetClubs] = useState<number>(150); // 150 clubes
  const [discountAnnual, setDiscountAnnual] = useState<number>(20); // 20% descuento por pago anual

  // Competitor standard annual prices
  const dataVolleyAnnual = 799; // USD / año
  const volleyStationAnnual = 590; // USD / año

  // Open Voley calculated annual price
  const openVoleyAnnualCalculated = Math.round(openVoleyMonthlyPrice * 12 * (1 - discountAnnual / 100));

  // Revenues
  const openVoleyAnnualRevenue = openVoleyAnnualCalculated * targetClubs;
  const dataVolleyCostForSameClubs = dataVolleyAnnual * targetClubs;
  const volleyStationCostForSameClubs = volleyStationAnnual * targetClubs;
  const totalClientSavingsVsDataVolley = dataVolleyCostForSameClubs - openVoleyAnnualRevenue;
  const savingsPercentVsDataVolley = Math.round(((dataVolleyAnnual - openVoleyAnnualCalculated) / dataVolleyAnnual) * 100);
  const savingsPercentVsVolleyStation = Math.round(((volleyStationAnnual - openVoleyAnnualCalculated) / volleyStationAnnual) * 100);

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      
      {/* Sub-Navigation Tabs within Ventas */}
      <div className="flex items-center gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 text-white shadow-lg">
        <button
          onClick={() => setActiveSubTab('ESTRATEGIA')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            activeSubTab === 'ESTRATEGIA'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Estrategia de Precios & Comparativa</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CUENTA_CORRIENTE')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            activeSubTab === 'CUENTA_CORRIENTE'
              ? 'bg-gradient-to-r from-indigo-500 to-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Cuenta Corriente & Control de 30 Días</span>
          <span className="bg-sky-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
            NUEVO
          </span>
        </button>
      </div>

      {activeSubTab === 'CUENTA_CORRIENTE' ? (
        <CuentaCorrienteSection />
      ) : (
        <>
          {/* Hero Banner: Estrategia de Ventas & Precios */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-500/30">
        <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs tracking-wider uppercase mb-2">
          <TrendingUp className="w-4 h-4" />
          <span>Estrategia Comercial & Penetración de Mercado 2026</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
          VENTAS: Análisis Comparativo de Precios & Disrupción Low-Cost
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
          Estrategia para vender <strong className="text-emerald-400 font-bold">más barato</strong> que Data Volley y VolleyStation, capturando el 95% del mercado de clubes, academias, colegios y entrenadores que no pueden pagar $800 USD/año.
        </p>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Data Volley 4</div>
            <div className="text-lg sm:text-xl font-extrabold text-rose-400">$799 - $1,199 USD/año</div>
            <div className="text-[11px] text-slate-500">Solo Windows / Dongle USB</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">VolleyStation Pro</div>
            <div className="text-lg sm:text-xl font-extrabold text-amber-400">$590 - $890 USD/año</div>
            <div className="text-[11px] text-slate-500">Caro para Sudamérica</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">OPEN VOLEY Pro</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-400">${openVoleyAnnualCalculated} USD/año</div>
            <div className="text-[11px] text-emerald-500 font-bold">Ahorro del {savingsPercentVsDataVolley}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Mercado Objetivo</div>
            <div className="text-lg sm:text-xl font-extrabold text-indigo-300">+25,000 Clubes</div>
            <div className="text-[11px] text-slate-500">Latinoamérica y Amateur</div>
          </div>
        </div>
      </div>

      {/* 1. TABLA COMPARATIVA DIRECTA: DATA VOLLEY vs VOLLEYSTATION vs OPEN VOLEY */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Matriz Comparativa de Competencia</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ¿Por qué Open Voley puede vender mucho más barato?
            </h2>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-300">
            🔥 Mejor Relación Calidad / Precio
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3.5 font-extrabold text-slate-900">Característica / Factor</th>
                <th className="p-3.5 font-bold text-slate-600 text-center">Data Volley 4 (Genius)</th>
                <th className="p-3.5 font-bold text-slate-600 text-center">VolleyStation Pro</th>
                <th className="p-3.5 font-black text-emerald-700 bg-emerald-50/80 text-center border-x border-emerald-200">
                  OPEN VOLEY (Nuestra Solución)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Precio Anual */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-3.5 font-bold text-slate-900">Precio Anual Estándar</td>
                <td className="p-3.5 text-center font-bold text-rose-600">$799 USD / año (~€750)</td>
                <td className="p-3.5 text-center font-bold text-amber-600">$590 USD / año (~€550)</td>
                <td className="p-3.5 text-center font-black text-emerald-700 bg-emerald-50/50 border-x border-emerald-200 text-base">
                  $99 - $199 USD / año
                </td>
              </tr>

              {/* Opción Mensual */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-3.5 font-bold text-slate-900">Opción de Suscripción Mensual</td>
                <td className="p-3.5 text-center text-slate-500">❌ No (Solo cobro anual)</td>
                <td className="p-3.5 text-center text-slate-500">⚠️ Limitada (~$65/mes)</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-x border-emerald-200">
                  ✅ Sí ($12 - $19 USD / mes)
                </td>
              </tr>

              {/* Compatibilidad de Dispositivos */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-3.5 font-bold text-slate-900">Plataformas y Dispositivos</td>
                <td className="p-3.5 text-center text-slate-600">Solo Windows (Legacy C++)</td>
                <td className="p-3.5 text-center text-slate-600">Windows y Mac (Desktop)</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-x border-emerald-200">
                  ✅ 100% Web (Mac, Windows, iPad, Celular)
                </td>
              </tr>

              {/* Llave USB / Dongle */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-3.5 font-bold text-slate-900">Protección y Licencias</td>
                <td className="p-3.5 text-center text-rose-600 font-semibold">Exige Dongle USB / HASP Key</td>
                <td className="p-3.5 text-center text-slate-600">Activación Online</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-x border-emerald-200">
                  ✅ Login Web Inmediato (Sin hardware)
                </td>
              </tr>

              {/* Videos Grabados con Celular */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-3.5 font-bold text-slate-900">Videos de Celular / Grabaciones Caseras</td>
                <td className="p-3.5 text-center text-slate-600">Requiere códecs y conversores</td>
                <td className="p-3.5 text-center text-slate-600">Acepta MP4 estándar</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-x border-emerald-200">
                  ✅ Arrastrar y soltar directo (MP4, MOV)
                </td>
              </tr>

              {/* Asistente de IA */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-3.5 font-bold text-slate-900">Asistente IA para Auto-Codificación</td>
                <td className="p-3.5 text-center text-slate-500">❌ Sin IA</td>
                <td className="p-3.5 text-center text-slate-500">❌ En fase experimental</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-x border-emerald-200">
                  ✅ Asistente IA (Gemini Coach integrado)
                </td>
              </tr>

              {/* Sintaxis Data Volley */}
              <tr className="hover:bg-slate-50/60">
                <td className="p-3.5 font-bold text-slate-900">Compatibilidad de Códigos Oficiales</td>
                <td className="p-3.5 text-center font-bold text-indigo-700">100% Nativo</td>
                <td className="p-3.5 text-center font-bold text-indigo-700">100% Compatible (DVW)</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-x border-emerald-200">
                  ✅ 100% Compatible (*14sq.4#17, etc.)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. SIMULADOR INTERACTIVO DE PRECIOS & INGRESOS */}
      <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3 text-amber-400">
          <Calculator className="w-6 h-6" />
          <h2 className="text-xl sm:text-2xl font-black">
            Simulador Interactivo: Precios de Venta & Proyección de Ingresos
          </h2>
        </div>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Ajusta el precio mensual que quieres cobrar y la cantidad de clubes objetivo para ver la facturación anual y cuánto dinero ahorran tus clientes respecto a Data Volley.
        </p>

        {/* Sliders Control */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
          {/* Slider 1: Precio Mensual */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Precio Mensual Open Voley</span>
              <span className="text-emerald-400 font-mono font-black text-base">${openVoleyMonthlyPrice} USD / mes</span>
            </div>
            <input
              type="range"
              min={9}
              max={49}
              step={1}
              value={openVoleyMonthlyPrice}
              onChange={(e) => setOpenVoleyMonthlyPrice(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$9 (Ultra Bajo)</span>
              <span>$19 (Recomendado)</span>
              <span>$49 (Premium)</span>
            </div>
          </div>

          {/* Slider 2: Cantidad de Clubes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Clubes / Equipos Clientes</span>
              <span className="text-amber-400 font-mono font-black text-base">{targetClubs} Clubes</span>
            </div>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={targetClubs}
              onChange={(e) => setTargetClubs(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>10 (Piloto)</span>
              <span>150 (Regional)</span>
              <span>1000 (Continental)</span>
            </div>
          </div>

          {/* Slider 3: Descuento por Pago Anual */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Descuento Anual Promocional</span>
              <span className="text-purple-400 font-mono font-black text-base">{discountAnnual}% OFF</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={discountAnnual}
              onChange={(e) => setDiscountAnnual(parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0%</span>
              <span>20% (Estándar SaaS)</span>
              <span>40% (Lanzamiento)</span>
            </div>
          </div>
        </div>

        {/* Results KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-950/60 border border-emerald-500/40 p-5 rounded-2xl">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
              Ingresos Anuales Proyectados (ARR)
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              ${openVoleyAnnualRevenue.toLocaleString()} USD / año
            </div>
            <div className="text-xs text-emerald-300 mt-2 font-semibold">
              Tarifa Anual: ${openVoleyAnnualCalculated} USD por club
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              Ahorro de los Clubes vs Data Volley
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {savingsPercentVsDataVolley}% Menos
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Ahorran ${totalClientSavingsVsDataVolley.toLocaleString()} USD en conjunto
            </div>
          </div>

          <div className="bg-indigo-950/60 border border-indigo-500/40 p-5 rounded-2xl">
            <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">
              Precio Mensual Equivalente
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-200 font-mono">
              ${Math.round(openVoleyAnnualCalculated / 12)} USD / mes
            </div>
            <div className="text-xs text-indigo-300 mt-2">
              Menos que 1 café por semana por equipo
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROPUESTA DE PLANES DE PRECIOS RECOMENDADOS */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900">
            <Sparkles className="w-3.5 h-3.5" /> PLANES DE SUSCRIPCIÓN OPEN VOLEY
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Estructura de Precios Accesibles para el Mercado
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Diseñados para romper la barrera de entrada que impone Genius Sports y facilitar la adopción masiva.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* PLAN 1: ESCOLAR & ACADEMIAS */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Plan Inicial</span>
                <h3 className="text-xl font-extrabold text-slate-900">Escuelas & Clubes Base</h3>
                <p className="text-xs text-slate-500 mt-1">Para colegios, categorías formativas y torneos locales.</p>
              </div>

              <div className="py-2 border-y border-slate-200">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 font-mono">$12</span>
                  <span className="text-xs text-slate-500">USD / mes</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-0.5">O $99 USD pago anual ($8/mes)</div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Scouting en Vivo con códigos abreviados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sube videos grabados con celular (.mp4/.mov)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Informes estadísticos básicos (Eff%, Puntos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Acceso desde cualquier navegador web</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => setShowPlansModal(true)}
              className="mt-6 w-full bg-slate-900 hover:bg-sky-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pagar Plan DT con Mercado Pago</span>
            </button>
          </div>

          {/* PLAN 2: CLUB PRO (RECOMENDADO) */}
          <div className="bg-emerald-950 text-white border-2 border-emerald-400 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-emerald-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
              Más Popular
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Plan Competitivo</span>
                <h3 className="text-xl font-extrabold text-white">Club Pro & Liga Mayor</h3>
                <p className="text-xs text-emerald-200/80 mt-1">Para clubes de primera división, ligas nacionales y entrenadores PRO.</p>
              </div>

              <div className="py-2 border-y border-emerald-800/80">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">$35.000</span>
                  <span className="text-xs text-emerald-300">ARS / mes ($35 USD)</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold mt-0.5">O $320.000 ARS pago anual (~20% OFF)</div>
              </div>

              <ul className="space-y-2.5 text-xs text-emerald-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Todo lo del Plan Inicial +</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sincronización de video HD con cortes automáticos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Asistente IA (Análisis de tendencias tácticas)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportación oficial FIVB P2, CSV y PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hasta 5 usuarios simultáneos (Estadístico + DT)</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => setShowPlansModal(true)}
              className="mt-6 w-full bg-sky-400 hover:bg-sky-300 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-lg shadow-sky-400/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="w-4 h-4 rounded-full bg-slate-950 text-sky-400 flex items-center justify-center text-[9px] font-black">MP</span>
              <span>Pagar Club Pro con Mercado Pago</span>
            </button>
          </div>

          {/* PLAN 3: FEDERACIONES & TORNEOS */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Plan Institucional</span>
                <h3 className="text-xl font-extrabold text-slate-900">Federación / Torneos</h3>
                <p className="text-xs text-slate-500 mt-1">Para asociaciones, ligas provinciales y torneos con múltiples canchas.</p>
              </div>

              <div className="py-2 border-y border-slate-200">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 font-mono">$95.000</span>
                  <span className="text-xs text-slate-500">ARS / mes ($99 USD)</span>
                </div>
                <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Incluye hasta 16 equipos del torneo</div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Licencias ilimitadas para los clubes del torneo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tablas de posiciones y líderes estadísticos en vivo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Capacitación virtual en scouting incluida</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Soporte prioritario por WhatsApp</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => setShowPlansModal(true)}
              className="mt-6 w-full bg-slate-900 hover:bg-sky-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Ver Planes & Opciones Mercado Pago</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. PLAN DE ACCIÓN DE VENTAS: CÓMO LLEGAR A LOS CLIENTES */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 text-blue-700">
          <Globe className="w-6 h-6" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Estrategia de Adquisición de Clientes (Go-To-Market)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
            <div className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
              <span>1. Prueba Gratis de 15 Días (Freemium)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Permitir a los entrenadores subir 2 videos grabados con celular y scoutear su primer partido sin tarjeta de crédito. Una vez que ven lo fácil que es, la conversión a pago es superior al 25%.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2">
            <div className="font-extrabold text-emerald-900 text-sm flex items-center gap-2">
              <span>2. Comparativa Agresiva de Costos</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              En cada propuesta comercial se muestra el ahorro directo: <strong className="text-emerald-700">"¿Por qué pagar $800 USD por Data Volley si puedes tener Open Voley por $179 USD al año en Mac y Celular?"</strong>
            </p>
          </div>

          <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-2">
            <div className="font-extrabold text-purple-900 text-sm flex items-center gap-2">
              <span>3. Alianzas con Federaciones Regionales</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ofrecer a las federaciones provinciales el sistema para digitalizar sus ligas locales a costo cero a cambio de que recomienden la suscripción PRO a los clubes participantes.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Plans Modal with Mercado Pago */}
      <SubscriptionPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />
      </>
      )}
    </div>
  );
};
