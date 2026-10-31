import { RecurringSubscriptionPanel, billingRequest } from './RecurringSubscriptionPanel';
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { ClientUser, TrialInfo } from '../types';
import { MERCADO_PAGO_PAYMENT_LINK } from '../shared/paymentLink';
import { LeadRegistrationForm } from './LeadRegistrationForm';

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
  onPaymentSuccess,
}) => {
  const [catalog,setCatalog]=useState<any>(null);
  const [priceError,setPriceError]=useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  useEffect(()=>{if(!isOpen)return;setPriceError('');fetch('/api/commercial/prices').then(async r=>{if(!r.ok)throw new Error();const d=await r.json();setCatalog(d.prices)}).catch(()=>{setCatalog(null);setPriceError('No se pudieron cargar los precios. Reabrí esta ventana para reintentar.')})},[isOpen]);
  const billingCycle = 'monthly' as const;
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [mpConfig, setMpConfig] = useState<{ publicKey: string; isConfigured: boolean; subscriptionsEnabled?: boolean } | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [consent, setConsent] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    fetch('/api/mercadopago/config', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => setMpConfig(data))
      .catch((err) => console.warn('Could not load MP config:', err));
  }, []);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'plan-dt',
      name: 'Plan DT / Entrenador',
      tagline: 'Ideal para técnicos independientes y formativas',
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
    if (!currentUser) {
      alert('Inicia sesión para contratar un plan.');
      return;
    }

    if (!catalog) {alert("Esperá a que se carguen los precios.");return;}
    if (!mpConfig?.isConfigured) {
      alert('Mercado Pago no está disponible en este momento.');
      return;
    }

    if (recurring && (!consent || currency !== 'ARS')) {
      setCheckoutError('Aceptá el cobro mensual automático en pesos para continuar.'); return;
    }
    setCheckoutError('');
    setLoadingPlanId(plan.id);
    try {
      if (recurring) {
        const data = await billingRequest('/create', { planId: plan.id, currency, consent });
        if (!data.initPoint) throw new Error('No se recibió el enlace de autorización.');
        window.location.assign(data.initPoint); return;
      }
      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          currency,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo iniciar el pago');
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error('Mercado Pago no devolvió una URL de pago válida');
      }
    } catch (err) {
      console.error('Error initiating MP checkout:', err);
      setCheckoutError((err as Error).message || 'No se pudo iniciar Mercado Pago.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[94vh] overflow-y-auto p-5 sm:p-8 shadow-2xl text-white relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Suscripción Oficial OPEN VOLEY
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Elige tu Plan y Activa tu Temporada
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Elegí tu plan con pago mensual en pesos o dólares.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <span className="text-sm font-bold text-slate-300">Pago mensual</span>

          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center">
            <button
              onClick={() => setCurrency('ARS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${currency === 'ARS' ? 'bg-sky-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🇦🇷 ARS ($)
            </button>
            <button
              onClick={() => { setCurrency('USD'); setRecurring(false); setConsent(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${currency === 'USD' ? 'bg-indigo-500 text-white font-black shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🌎 USD ($)
            </button>
          </div>
        </div>

        {currentUser && <RecurringSubscriptionPanel onAccessUpdated={onPaymentSuccess} />}
        {mpConfig?.subscriptionsEnabled && currency === 'ARS' && <section className="rounded-xl border border-sky-500/40 p-4 space-y-3 text-sm">
          <label className="flex gap-3 items-start"><input type="checkbox" checked={recurring} onChange={e => { setRecurring(e.target.checked); setConsent(false); }} />
            <span>Renovación mensual automática con Mercado Pago</span></label>
          {recurring && <>
            <p>El primer cobro se solicita al autorizar. Después, Mercado Pago cobra cada mes el importe del plan elegido hasta que canceles. La autorización del medio de pago se realiza en Mercado Pago.</p>
            <label className="flex gap-3 items-start"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
              <span>Acepto los cargos mensuales en pesos del plan que seleccione. Puedo cancelar la renovación desde Mi suscripción mensual. El acceso se activa al confirmarse el pago.</span></label>
          </>}
        </section>}
        {checkoutError && <p role="alert" className="text-rose-300">{checkoutError}</p>}
        {priceError && <p role="alert" className="text-rose-300">{priceError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {plans.map((plan) => {
            const price = catalog?.[plan.id]?.[billingCycle]?.[currency] ?? 0;
            const displayPrice = !catalog ? 'Cargando…' : currency === 'ARS' ? `$${price.toLocaleString('es-AR')}` : `$${price}`;
            const periodLabel = '/ mes';
            const isLoadingThis = loadingPlanId === plan.id;

            return (
              <div key={plan.id} className={`rounded-3xl border p-6 flex flex-col justify-between relative transition hover:border-slate-500 ${plan.color}`}>
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

                <div className="pt-6">
                  <button
                    onClick={() => handleMercadoPagoCheckout(plan)}
                    disabled={!!loadingPlanId || !catalog || !mpConfig?.isConfigured || !currentUser || (recurring && !consent)}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition transform active:scale-95 shadow-xl ${plan.popular ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-sky-400/20' : 'bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-white border border-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoadingThis ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Conectando Mercado Pago...</span></>
                    ) : (
                      <><div className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-extrabold text-[10px]">MP</div><span>{recurring ? 'Suscribirme mensualmente' : 'Pagar un mes con Mercado Pago'}</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pago validado por Mercado Pago y OPEN VOLEY</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section aria-labelledby="mp-payment-link-title" className="rounded-2xl border border-sky-500/40 bg-sky-950/30 p-5 space-y-3">
          <h3 id="mp-payment-link-title" className="text-lg font-black text-white">Pago por enlace de Mercado Pago</h3>
          <p className="text-sm text-slate-300">
            Usá esta opción para el pago acordado con administración. Confirmá el importe y el concepto que aparecen en Mercado Pago antes de pagar.
          </p>
          {currentUser ? (
            <>
              <p className="text-xs text-slate-300">Cuenta de OPEN VOLEY: <strong>{currentUser.email}</strong>. Conservá el comprobante e indicá este correo al solicitar la activación.</p>
              <a
                href={MERCADO_PAGO_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby="mp-payment-link-details"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
              >
                Pagar con Mercado Pago · enlace <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </>
          ) : (
            <p className="text-sm font-bold text-sky-200">Ingresá con tu cuenta de Google en OPEN VOLEY para continuar con el pago.</p>
          )}
          <p id="mp-payment-link-details" className="text-xs leading-relaxed text-slate-300">
            Se abre Mercado Pago en otra pestaña. OPEN VOLEY no configura un débito mensual automático con esta opción. El acceso se activa después de que administración verifique el pago; abrir el enlace no activa una licencia.
          </p>
        </section>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">¿Necesitas pagar por Transferencia Bancaria Directa?</span>
              <span className="text-[11px] text-slate-400">La activación manual solo puede realizarla una cuenta administradora autorizada.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowContactForm(open => !open)}
            aria-expanded={showContactForm}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>Consultar por transferencia</span>
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>
        {showContactForm && <div><p className="text-sm text-slate-300">Tu consulta quedará registrada para administración. El formulario no realiza un pago ni activa la licencia.</p><LeadRegistrationForm /></div>}
      </div>
    </div>
  );
};
