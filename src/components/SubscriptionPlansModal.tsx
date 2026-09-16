import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  X, 
  HelpCircle, 
  MessageSquare, 
  Lock, 
  Unlock,
  KeyRound,
  ShieldAlert,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ClientUser, TrialInfo } from '../types';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: ClientUser | null;
  trialInfo?: TrialInfo | null;
  onPaymentSuccess?: (updatedUser: ClientUser, updatedTrial: TrialInfo) => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  trialInfo,
  onPaymentSuccess,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('openvoley_pricing_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [accessKeyError, setAccessKeyError] = useState('');

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [mpConfig, setMpConfig] = useState<{ publicKey: string; isConfigured: boolean } | null>(null);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    fetch('/api/mercadopago/config')
      .then((res) => res.json())
      .then((data) => setMpConfig(data))
      .catch((err) => console.warn('Could not load MP config:', err));
  }, []);

  if (!isOpen) return null;

  const handleUnlockPricing = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = accessKeyInput.trim().toUpperCase();
    if (clean === 'CAR123' || clean === 'NEXUS30') {
      setIsUnlocked(true);
      setAccessKeyError('');
      try {
        sessionStorage.setItem('openvoley_pricing_unlocked', 'true');
      } catch (e) {
        console.warn(e);
      }
    } else {
      setAccessKeyError('Clave incorrecta. Ingrese la clave válida para ver precios.');
    }
  };

  // If locked, render lock screen modal
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-white relative space-y-6 text-center">
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
              Acceso Restringido • Tarifas & Planes
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Planes & Precios OPEN VOLEY
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              La visualización de planes y pasarelas de pago se encuentra temporalmente protegida. Ingrese la clave requerida.
            </p>
          </div>

          <form onSubmit={handleUnlockPricing} className="space-y-4">
            <div className="relative text-left">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="Ingresar clave de acceso"
                value={accessKeyInput}
                onChange={(e) => {
                  setAccessKeyInput(e.target.value);
                  if (accessKeyError) setAccessKeyError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition font-mono"
                autoFocus
              />
            </div>

            {accessKeyError && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{accessKeyError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" /> Desbloquear Planes & Precios
            </button>
          </form>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            OPEN VOLEY • Panel de Administración y Ventas
          </div>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'plan-dt',
      name: 'Plan DT / Entrenador',
      tagline: 'Ideal para técnicos independientes y formativas',
      monthlyPriceArs: 18000,
      annualPriceArs: 160000,
      monthlyPriceUsd: 19,
      annualPriceUsd: 169,
      popular: false,
      color: 'border-slate-700 bg-slate-900/90',
      badge: null,
      features: [
        'Scouting en vivo con teclado rápido táctil',
        'Generación de Planilla Oficial FIVB Box Score P2',
        'Subida de videos de partidos grabados con celular',
        'Generador de tarjetas gráficas para Instagram Stories',
        'Acceso ilimitado para 1 analista / DT',
      ],
    },
    {
      id: 'plan-club-pro',
      name: 'Plan Club Pro & Liga',
      tagline: 'Para planteles de primera división y cuerpos técnicos',
      monthlyPriceArs: 35000,
      annualPriceArs: 320000,
      monthlyPriceUsd: 35,
      annualPriceUsd: 315,
      popular: true,
      color: 'border-emerald-500 bg-gradient-to-b from-slate-900 to-emerald-950/40 shadow-emerald-500/20 shadow-2xl',
      badge: '🔥 RECOMENDADO',
      features: [
        'Todo lo del Plan DT +',
        'Sincronización de Video HD y corte automático de jugadas',
        'Pizarra táctica y Telestrator sobre fotos y video',
        'Asistente IA Coach (mapas de calor y telemetría)',
        'Exportación completa a archivos .DVW (Data Volley)',
        'Hasta 5 accesos simultáneos (Estadístico + DT + Asistente)',
        'Soporte prioritario por WhatsApp',
      ],
    },
    {
      id: 'plan-federacion',
      name: 'Plan Federación / Torneo',
      tagline: 'Para asociaciones, ligas regionales y clubes multisede',
      monthlyPriceArs: 95000,
      annualPriceArs: 850000,
      monthlyPriceUsd: 99,
      annualPriceUsd: 890,
      popular: false,
      color: 'border-indigo-500/50 bg-slate-900/90',
      badge: 'INSTITUCIONAL',
      features: [
        'Licencia integral para hasta 16 equipos del torneo',
        'Tablas de posiciones y líderes estadísticos en tiempo real',
        'Consola central de supervisión para veedores de mesa',
        'Capacitación virtual en scouting para árbitros y planilleros',
        'Atención técnica dedicada 24/7 durante los fines de semana',
      ],
    },
  ];

  const handleMercadoPagoCheckout = async (plan: typeof plans[0]) => {
    setLoadingPlanId(plan.id);
    try {
      const price = currency === 'ARS'
        ? (billingCycle === 'annual' ? plan.annualPriceArs : plan.monthlyPriceArs)
        : (billingCycle === 'annual' ? plan.annualPriceUsd : plan.monthlyPriceUsd);

      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: `${plan.name} (${billingCycle === 'annual' ? 'Anual' : 'Mensual'})`,
          price,
          currency,
          billingCycle,
          userEmail: currentUser?.email || 'cliente@openvoley.com',
          userName: currentUser?.name || 'Usuario OPEN VOLEY',
        }),
      });

      const data = await res.json();

      if (data.initPoint) {
        // Redirect to Mercado Pago Checkout
        window.location.href = data.initPoint;
      } else {
        alert('No se pudo inicializar la pasarela de pago. Por favor intenta nuevamente.');
      }
    } catch (err) {
      console.error('Error initiating MP checkout:', err);
      alert('Ocurrió un error al contactar el servidor de pagos.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleAdminCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode.trim().toUpperCase() === 'CAR123' || adminCode.trim().toUpperCase() === 'NEXUS30') {
      try {
        const email = currentUser?.email || 'admin@openvoley.com';
        const res = await fetch('/api/clients/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, addDays: 30 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (currentUser && trialInfo && onPaymentSuccess) {
            const updatedUser: ClientUser = {
              ...currentUser,
              customGrantedDays: (currentUser.customGrantedDays || 0) + 30,
              isBlocked: false,
            };
            const updatedTrial: TrialInfo = {
              ...trialInfo,
              daysRemaining: (trialInfo.daysRemaining || 0) + 30,
              isExpired: false,
              totalAllowedDays: trialInfo.totalAllowedDays + 30,
            };
            localStorage.setItem('openvoley_user', JSON.stringify(updatedUser));
            localStorage.setItem('openvoley_trial', JSON.stringify(updatedTrial));
            onPaymentSuccess(updatedUser, updatedTrial);
          }
          alert('¡Suscripción extendida con éxito por 30 días!');
          onClose();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setAdminError('Clave de administrador incorrecta.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[94vh] overflow-y-auto p-5 sm:p-8 shadow-2xl text-white relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-2 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Suscripción Oficial OPEN VOLEY
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Elige tu Plan y Activa tu Temporada
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Aceptamos tarjetas de crédito, débito, saldo de <strong className="text-sky-400 font-bold">Mercado Pago</strong> y transferencias.
          </p>
        </div>

        {/* Switchers Bar: Currency & Billing Cycle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          
          {/* Monthly vs Annual */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pago Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span>Pago Anual</span>
              <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full uppercase font-black">
                20% OFF
              </span>
            </button>
          </div>

          {/* Currency ARS / USD */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center">
            <button
              onClick={() => setCurrency('ARS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                currency === 'ARS'
                  ? 'bg-sky-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇦🇷 ARS ($)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                currency === 'USD'
                  ? 'bg-indigo-500 text-white font-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌎 USD ($)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {plans.map((plan) => {
            const price = currency === 'ARS'
              ? (billingCycle === 'annual' ? plan.annualPriceArs : plan.monthlyPriceArs)
              : (billingCycle === 'annual' ? plan.annualPriceUsd : plan.monthlyPriceUsd);

            const displayPrice = currency === 'ARS'
              ? `$${price.toLocaleString('es-AR')}`
              : `$${price}`;

            const periodLabel = billingCycle === 'annual' ? '/ año' : '/ mes';
            const isLoadingThis = loadingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border p-6 flex flex-col justify-between relative transition hover:border-slate-500 ${plan.color}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-5 bg-emerald-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.tagline}</p>
                  </div>

                  <div className="py-3 border-y border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">{displayPrice}</span>
                      <span className="text-xs text-slate-400">{currency} {periodLabel}</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <div className="text-[11px] text-emerald-400 font-bold mt-1">
                        Equivale a {currency === 'ARS' ? `$${Math.round(price / 12).toLocaleString('es-AR')}` : `$${Math.round(price / 12)}`} {currency} / mes
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mercado Pago Official Button */}
                <div className="pt-6">
                  <button
                    onClick={() => handleMercadoPagoCheckout(plan)}
                    disabled={isLoadingThis}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition transform active:scale-95 shadow-xl cursor-pointer ${
                      plan.popular
                        ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-sky-400/20'
                        : 'bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-white border border-slate-700'
                    }`}
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Conectando Mercado Pago...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-extrabold text-[10px]">
                          MP
                        </div>
                        <span>Pagar con Mercado Pago</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pago Seguro SSL / Acreditación Instantánea</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alternate Payment & Admin Extension Key Bar */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">¿Necesitas pagar por Transferencia Bancaria Directa?</span>
              <span className="text-[11px] text-slate-400">Te enviamos el Alias/CBU y activamos tu cuenta manualmente.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="https://wa.me/5491112345678?text=Hola%20OPEN%20VOLEY,%20quiero%20suscribirme%20y%20pagar%20por%20transferencia%20bancaria"
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition flex-1 sm:flex-none"
            >
              <span>WhatsApp Comercial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {!showAdminInput ? (
              <button
                onClick={() => setShowAdminInput(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition border border-slate-700"
              >
                Clave Administrador
              </button>
            ) : (
              <form onSubmit={handleAdminCodeSubmit} className="flex items-center gap-1">
                <input
                  type="password"
                  placeholder="Código (CAR123)"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    if (adminError) setAdminError('');
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono w-28"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs"
                >
                  OK
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
