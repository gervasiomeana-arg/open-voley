import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Volleyball, Check, BarChart3, Video, ClipboardList, Minus, Plus } from 'lucide-react';
import { LeadRegistrationForm } from './LeadRegistrationForm';
import './welcomeLanding.css';
import { LandingScoutIllustration } from './LandingScoutIllustration';
import { AppLocale, getStoredLocale } from '../shared/locale';
interface WelcomeLandingPageProps {
    onStartFreeTrial: () => void;
    onClientLogin: () => void;
    onOpenPlansModal: () => void;
    locale?: AppLocale;
    onLocaleChange?: (locale: AppLocale) => void;
}
const ptBR: Record<string, string> = {
  "Planes": "Planos",
  "Partido": "Jogo",
  "Análisis": "Análise",
  "Vídeo": "Vídeo",
  "Scout": "Scout",
  "Vista ilustrativa": "Exemplo ilustrativo",
  "Rival": "Adversário",
  "Local": "Mandante",
  "Ataque": "Ataque",
  "Punto": "Ponto",
  "Recepción": "Recepção",
  "Saque": "Saque",
  "Bloqueo": "Bloqueio",
  "Defensa": "Defesa",
  "Rendimiento por fundamento": "Desempenho por fundamento",
  "Los datos detrás": "Os dados por trás",
  "del marcador.": "do placar.",
  "Valores de ejemplo para mostrar la lectura de una planilla.": "Valores ilustrativos de uma planilha.",
  "De la acción al vídeo": "Da ação ao vídeo",
  "Selección de jugadas": "Seleção de jogadas",
  "Saques · #9": "Saques · #9",
  "Ilustración del montaje. El vídeo se carga dentro de la app.": "Exemplo ilustrativo. O vídeo é carregado no aplicativo.",
  "Próximo entrenamiento": "Próximo treino",
  "Una práctica": "Um treino",
  "con un propósito.": "com um objetivo.",
  "Elegir el problema del partido": "Identificar o problema do jogo",
  "Preparar ejercicios": "Preparar exercícios",
  "Guardar y seguir la evolución": "Salvar e acompanhar a evolução",
  "Ilustración del recorrido de entrenamiento.": "Exemplo do planejamento de treino.",
  "Datos de ejemplo · No es un partido en vivo": "Dados ilustrativos · Não é um jogo ao vivo",
  "Ir al contenido": "Pular para o conteúdo",
  "La plataforma": "A plataforma",
  "Cómo funciona": "Como funciona",
  "Planes y precios": "Planos e preços",
  "Ingresar": "Entrar",
  "Probar gratis": "Teste grátis",
  "Leé el partido.": "Leia o jogo.",
  "Decidí mejor.": "Decida melhor.",
  "Scouting, análisis y entrenamiento de vóley, conectados.": "Scout, análise e treinamento de vôlei, integrados.",
  "Probar OPEN VOLEY": "Testar OPEN VOLEY",
  "Ver cómo funciona": "Veja como funciona",
  "7 días gratis · Sin tarjeta": "7 dias grátis · Sem cartão",
  "Tu trabajo técnico,": "Seu trabalho técnico,",
  "conectado.": "integrado.",
  "Partido ": "Jogo ",
  "Análisis ": "Análise ",
  "Vídeo ": "Vídeo ",
  "Entrenamiento": "Treinamento",
  "No termina": "Não termina",
  "cuando termina el set.": "quando o set termina.",
  "La información que registrás durante el partido se convierte en material para analizar, explicar y entrenar.": "Os dados registrados durante o jogo ajudam a analizar, explicar e treinar.",
  "De la cancha a la práctica": "Da quadra ao treino",
  "Menos datos sueltos.": "Menos dados isolados.",
  "Más decisiones.": "Mais decisões.",
  "Empezá por un partido y construí el seguimiento de tu equipo, a tu ritmo.": "Comece por um jogo e acompanhe a evolução da sua equipe no seu ritmo.",
  "Armá el partido": "Prepare o jogo",
  "Elegí los equipos, cargá las jugadoras o jugadores y definí la formación inicial.": "Escolha as equipes, cadastre atletas e defina a formação inicial.",
  "Registrá y revisá": "Registre e revise",
  "Usá el scout simple o la consola. Consultá la planilla y volvé a las acciones del partido.": "Use o scout simples ou o console. Consulte as estatísticas e reveja as ações do jogo.",
  "Llevalo al entrenamiento": "Leve para o treino",
  "Reuní evidencia en vídeo, organizá ejercicios y seguí el historial de trabajo.": "Reúna vídeos, organize exercícios e acompanhe o histórico de treinos.",
  "Consultá sobre los datos de tu equipo para orientar el análisis. Las conclusiones y decisiones quedan en manos del entrenador.": "Consulte os dados da equipe para orientar a análise. As decisões continuam nas mãos do treinador.",
  "En el banco.": "No banco.",
  "En la oficina.": "No escritório.",
  "Con tu equipo.": "Com sua equipe.",
  "Usá OPEN VOLEY desde el navegador, en computadora, tablet o celular.": "Use OPEN VOLEY no navegador, no computador, tablet ou celular.",
  "Consultar planes y precios": "Consultar planos e preços",
  "Primero conocé la plataforma.": "Primeiro conheça a plataforma.",
  "Después elegí cómo seguir.": "Depois escolha como continuar.",
  "Probá el recorrido con tu cuenta de Google o solicitá una demo para consultar cómo usarlo con tu club.": "Experimente com sua conta Google ou solicite uma demonstração para seu clube.",
  "7 días para explorar · Sin tarjeta para comenzar": "7 dias para explorar · Sem cartão para começar",
  "Hablemos de tu equipo": "Vamos falar da sua equipe",
  "Tu próximo partido": "Seu próximo jogo",
  "puede decirte más.": "pode revelar mais.",
  "Dejanos tus datos para coordinar una demo o consultar por OPEN VOLEY.": "Deixe seus dados para agendar uma demonstração ou saber mais sobre OPEN VOLEY.",
  "El juego cambia.": "O jogo muda.",
  "Tu mirada también.": "Seu olhar também.",
  "Preguntas": "Perguntas",
  "desde el banco.": "do banco.",
  "Scouting, análisis y entrenamiento de vóley.": "Scout, análise e treinamento de vôlei.",
  "Consultar por la plataforma": "Fale sobre a plataforma",
  "El partido, punto por punto.": "O jogo, ponto a ponto.",
  "Registrá acciones, seguí las rotaciones de ambos equipos y seleccioná a los líberos cuando participan.": "Registre ações, acompanhe as rotações das duas equipes e selecione os líberos quando participarem.",
  "Encontrá qué trabajar.": "Descubra o que treinar.",
  "Revisá puntos, errores y rendimiento por jugador y fundamento. Volvé del resultado a las acciones que lo explican.": "Analise pontos, erros e desempenho por atleta e fundamento. Volte dos resultados às ações do jogo.",
  "Mostrá la jugada exacta.": "Mostre a jogada exata.",
  "Vinculá el vídeo del partido y prepará selecciones de acciones para revisar con el equipo.": "Vincule o vídeo do jogo e selecione jogadas para revisar com a equipe.",
  "Del dato a la próxima práctica.": "Dos dados ao próximo treino.",
  "Organizá el trabajo técnico con evidencia del partido y guardá el historial para seguir la evolución.": "Organize o trabalho técnico com evidências do jogo e acompanhe a evolução.",
  "¿Cómo empiezo?": "Como começar?",
  "Ingresá con tu cuenta de Google. Las cuentas nuevas tienen una prueba de 7 días, sin ingresar una tarjeta.": "Entre com sua conta Google. Novas contas têm 7 dias de teste, sem cartão.",
  "¿Desde dónde puedo usarlo?": "Onde posso usar?",
  "OPEN VOLEY funciona en el navegador. Podés registrar desde celular o tablet y continuar el análisis desde la computadora.": "OPEN VOLEY funciona no navegador. Registre pelo celular ou tablet e continue a análise no computador.",
  "¿Necesito saber los códigos de scout?": "Preciso conhecer os códigos de scout?",
  "Podés registrar con botones en el modo simple o usar la consola de códigos cuando necesitás más detalle.": "Você pode registrar com botões no modo simples ou usar códigos para mais detalhes.",
  "¿Cómo consulto el precio?": "Como consultar os preços?",
  "En Planes y precios podés ver los precios mensuales actuales en pesos y dólares. Si querés conocer el producto primero, completá la solicitud de demo.": "Em Planos e preços, consulte os valores disponíveis. Para conhecer o produto, solicite uma demonstração.",
};
const translate = (text: string, locale: 'es' | 'pt-BR') => locale === 'pt-BR' ? (ptBR[text] ?? text) : text;
const steps = [
    { label: 'Scout', title: 'El partido, punto por punto.', text: 'Registrá acciones, seguí las rotaciones de ambos equipos y seleccioná a los líberos cuando participan.', icon: Volleyball },
    { label: 'Análisis', title: 'Encontrá qué trabajar.', text: 'Revisá puntos, errores y rendimiento por jugador y fundamento. Volvé del resultado a las acciones que lo explican.', icon: BarChart3 },
    { label: 'Vídeo', title: 'Mostrá la jugada exacta.', text: 'Vinculá el vídeo del partido y prepará selecciones de acciones para revisar con el equipo.', icon: Video },
    { label: 'Entrenamiento', title: 'Del dato a la próxima práctica.', text: 'Organizá el trabajo técnico con evidencia del partido y guardá el historial para seguir la evolución.', icon: ClipboardList },
];
const questions = [
    ['¿Cómo empiezo?', 'Ingresá con tu cuenta de Google. Las cuentas nuevas tienen una prueba de 7 días, sin ingresar una tarjeta.'],
    ['¿Desde dónde puedo usarlo?', 'OPEN VOLEY funciona en el navegador. Podés registrar desde celular o tablet y continuar el análisis desde la computadora.'],
    ['¿Necesito saber los códigos de scout?', 'Podés registrar con botones en el modo simple o usar la consola de códigos cuando necesitás más detalle.'],
    ['¿Cómo consulto el precio?', 'En Planes y precios podés ver los precios mensuales actuales en pesos y dólares. Si querés conocer el producto primero, completá la solicitud de demo.'],
];
function ProductIllustration({ step, locale }: {
    step: number;
    locale: 'es' | 'pt-BR';
}) {
    const t = (text: string) => translate(text, locale);
    const top = [1, 6, 5, 2, 3, 4], bottom = [4, 3, 2, 5, 6, 1];
    return <div className="ov-product" aria-label="Ilustración del flujo de OPEN VOLEY con datos de ejemplo">
   <div className="ov-product-top"><span><span className="ov-live-dot"/> OPEN VOLEY</span><span>{t("Vista ilustrativa")}</span></div>
   {step === 0 ? <><div className="ov-example-score"><span>{t("Local")}</span><strong>12 <span>-</span> 10</strong><span>{t("Rival")}</span></div><div className="ov-libero-band">L 4 · {t("Local")}</div><div className="ov-court"><div className="ov-court-side ov-court-home">{top.map((p, i) => <div key={p}><small>P{p}{i === 0 ? ' · A' : ''}</small><b>{[1, 16, 14, 7, 9, 11][i]}</b></div>)}</div><div className="ov-net"><span>RED</span></div><div className="ov-court-side ov-court-away">{bottom.map((p, i) => <div key={p}><small>P{p}{i === 2 ? ' · A' : ''}</small><b>{[8, 12, 1, 3, 5, 10][i]}</b></div>)}</div></div><div className="ov-libero-band">L 2 · {t("Rival")}</div><div className="ov-example-action"><span>{t("Local")} · #9</span><b>{t("Ataque")} <ArrowRight size={14}/> {t("Punto")}</b></div></> :
            step === 1 ? <div className="ov-analysis-example"><span className="ov-eyebrow">{t("Rendimiento por fundamento")}</span><h3>{t("Los datos detrás")}<br />{t("del marcador.")}</h3>{[['Ataque', 72], ['Recepción', 58], ['Saque', 43]].map(([name, value]) => <div className="ov-bar" key={name}><span>{t(String(name))}</span><div><i style={{ width: `${value}%` }}/></div><b>{value}%</b></div>)}<p>{t("Valores de ejemplo para mostrar la lectura de una planilla.")}</p></div> :
                step === 2 ? <div className="ov-video-example"><div className="ov-video-frame"><Video size={40}/><span>{t("De la acción al vídeo")}</span><div className="ov-video-lines"/></div><div className="ov-example-action"><span>{t("Selección de jugadas")}</span><b>{t("Saques · #9")}</b></div><div className="ov-timeline">{[1, 2, 3, 4, 5, 6].map(n => <span key={n}/>)}</div><p>{t("Ilustración del montaje. El vídeo se carga dentro de la app.")}</p></div> :
                    <div className="ov-training-example"><span className="ov-eyebrow">{t("Próximo entrenamiento")}</span><h3>{t("Una práctica")}<br />{t("con un propósito.")}</h3>{['Elegir el problema del partido', 'Preparar ejercicios', 'Guardar y seguir la evolución'].map((text, i) => <div key={text}><span>0{i + 1}</span><p>{t(text)}</p><Check size={17}/></div>)}<p className="ov-example-note">{t("Ilustración del recorrido de entrenamiento.")}</p></div>}
   <div className="ov-product-bottom"><span>{t(steps[step].label)}</span><span>{t("Datos de ejemplo · No es un partido en vivo")}</span></div>
 </div>;
}
export const WelcomeLandingPage: React.FC<WelcomeLandingPageProps> = ({ onStartFreeTrial, onClientLogin, onOpenPlansModal, locale: propLocale, onLocaleChange }) => {
    const landingRef = useRef<HTMLDivElement>(null);
    const [internalLocale, setInternalLocale] = useState<AppLocale>(() => propLocale || getStoredLocale());
    const currentLocale: AppLocale = propLocale || internalLocale;

    useEffect(() => {
      if (propLocale && propLocale !== internalLocale) {
        setInternalLocale(propLocale);
      }
    }, [propLocale]);

    useEffect(() => {
      document.documentElement.lang = currentLocale;
    }, [currentLocale]);

    const handleLanguageChange = (nextLocale: AppLocale) => {
      setInternalLocale(nextLocale);
      window.localStorage.setItem('openvoley_public_locale', nextLocale);
      document.documentElement.lang = nextLocale;
      if (onLocaleChange) {
        onLocaleChange(nextLocale);
      }
    };

    useEffect(() => {
      if (!landingRef.current || !('IntersectionObserver' in window)) return;
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (media.matches) return;
      landingRef.current.dataset.ready = 'true';
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('ov-revealed'); observer.unobserve(entry.target); }
      }), { threshold: .08 });
      const sections = landingRef.current.querySelectorAll('.ov-section, .ov-demo-grid');
      sections.forEach(el => { el.classList.add('ov-reveal-ready'); observer.observe(el); });
      return () => { observer.disconnect(); sections.forEach(el => el.classList.remove('ov-reveal-ready')); };
    }, []);
    const t = (text: string) => translate(text, currentLocale);
    const [brazilPrices, setBrazilPrices] = useState<Record<string, number | null> | null>(null);
    useEffect(() => { if (currentLocale === 'pt-BR') fetch('/api/commercial/brazil-prices').then(r => r.ok ? r.json() : Promise.reject()).then(d => setBrazilPrices(d.prices)).catch(() => setBrazilPrices(null)); }, [currentLocale]);
    const [step, setStep] = useState(0), [openQuestion, setOpenQuestion] = useState<number | null>(0);
    useEffect(() => { void fetch('/api/visitors/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: window.location.hostname, page: window.location.pathname, deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Móvil' : 'PC / Laptop', action: 'Visita Landing Oficial' }) }).catch(() => { }); }, []);
    return <div ref={landingRef} className="ov-landing">
  <a href="#contenido" className="ov-skip">{t("Ir al contenido")}</a>
  <header className="ov-header"><div className="ov-container ov-nav"><a className="ov-brand" href="#inicio" aria-label="OPEN VOLEY, inicio"><Volleyball aria-hidden="true"/><span>OPEN<span>VOLEY</span></span></a><nav aria-label="Navegación principal"><a href="#herramientas">{t("La plataforma")}</a><a href="#como-funciona">{t("Cómo funciona")}</a><button onClick={onOpenPlansModal}>{t("Planes y precios")}</button></nav><div className="ov-nav-actions"><select aria-label="Idioma / Idioma" value={currentLocale} onChange={e => handleLanguageChange(e.target.value as AppLocale)} style={{maxWidth:110, borderRadius:8, padding:6, background:"transparent", color:"inherit"}}><option value="es" style={{ color: "#101828", backgroundColor: "#ffffff" }}>Español</option><option value="pt-BR" style={{ color: "#101828", backgroundColor: "#ffffff" }}>Português BR</option></select><button className="ov-mobile-plans" onClick={onOpenPlansModal}>{t('Planes')}</button><button className="ov-login" onClick={onClientLogin}>{t("Ingresar")} <ArrowUpRight size={16}/></button><button className="ov-nav-trial" onClick={onStartFreeTrial}>{t("Probar gratis")}</button></div></div></header>
  <main id="contenido">
   <div className="ov-hero-wrap"><img className="ov-hero-backdrop" src="/media/volley-hero.webp" width="1600" height="900" alt="" aria-hidden="true" fetchPriority="high"/><section id="inicio" className="ov-hero ov-container"><div className="ov-hero-copy"><h1>{t("Leé el partido.")}<br /><span>{t("Decidí mejor.")}</span></h1><p className="ov-hero-description">{t("Scouting, análisis y entrenamiento de vóley, conectados.")}</p><div className="ov-hero-actions"><button className="ov-button ov-button-primary" onClick={onStartFreeTrial}>{t("Probar OPEN VOLEY")} <ArrowUpRight size={19}/></button><a className="ov-text-link" href="#como-funciona">{t("Ver cómo funciona")} <ArrowRight size={17}/></a></div><p className="ov-trial-note">{t("7 días gratis · Sin tarjeta")}</p></div><div className="ov-hero-visual"><div className="ov-laptop"><LandingScoutIllustration locale={currentLocale} /></div></div></section></div>
   <div className="ov-platform-strip"><div className="ov-container"><span>{t("Tu trabajo técnico,")}<br /><strong>{t("conectado.")}</strong></span><p>{t('Partido')} <ArrowRight /> {t('Scout')} <ArrowRight /> {t('Análisis')} <ArrowRight /> {t('Vídeo')} <ArrowRight /> {t('Entrenamiento')}</p></div></div>
   <section id="herramientas" className="ov-section ov-container"><div className="ov-section-heading"><div><h2>{t("No termina")}<br />{t("cuando termina el set.")}</h2></div><p>{t("La información que registrás durante el partido se convierte en material para analizar, explicar y entrenar.")}</p></div><div className="ov-tool-layout"><div className="ov-tool-list" role="tablist" aria-label="Herramientas de la plataforma">{steps.map((item, i) => { const Icon = item.icon; return <button id={`ov-tab-${i}`} key={item.label} role="tab" aria-selected={step === i} aria-controls="ov-tool-panel" tabIndex={step === i ? 0 : -1} onKeyDown={e => { if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (step + (['ArrowUp', 'ArrowLeft'].includes(e.key) ? 3 : 1)) % 4;
        setStep(next);
        document.getElementById(`ov-tab-${next}`)?.focus();
    } }} onClick={() => setStep(i)} className={step === i ? 'is-active' : ''}><span className="ov-tool-number">0{i + 1}</span><div><span className="ov-tool-label"><Icon size={18}/>{t(item.label)}</span><h3>{t(item.title)}</h3><p>{t(item.text)}</p></div><ArrowUpRight size={21}/></button>; })}</div><div id="ov-tool-panel" role="tabpanel" aria-labelledby={`ov-tab-${step}`} tabIndex={0} className="ov-tool-preview"><ProductIllustration step={step} locale={currentLocale}/></div></div></section>
   <section id="como-funciona" className="ov-method"><div className="ov-container ov-section"><div className="ov-section-heading"><div><p className="ov-eyebrow">{t("De la cancha a la práctica")}</p><h2>{t("Menos datos sueltos.")}<br />{t("Más decisiones.")}</h2></div><p>{t("Empezá por un partido y construí el seguimiento de tu equipo, a tu ritmo.")}</p></div><ol className="ov-method-steps"><li><span>01</span><h3>{t("Armá el partido")}</h3><p>{t("Elegí los equipos, cargá las jugadoras o jugadores y definí la formación inicial.")}</p></li><li><span>02</span><h3>{t("Registrá y revisá")}</h3><p>{t("Usá el scout simple o la consola. Consultá la planilla y volvé a las acciones del partido.")}</p></li><li><span>03</span><h3>{t("Llevalo al entrenamiento")}</h3><p>{t("Reuní evidencia en vídeo, organizá ejercicios y seguí el historial de trabajo.")}</p></li></ol><div className="ov-ai-note"><span>OPEN AI</span><p>{t("Consultá sobre los datos de tu equipo para orientar el análisis. Las conclusiones y decisiones quedan en manos del entrenador.")}</p><ArrowUpRight size={22}/></div></div></section>
   <section className="ov-section ov-container ov-access"><div><h2>{t("En el banco.")}<br />{t("En la oficina.")}<br /><span>{t("Con tu equipo.")}</span></h2><p>{t("Usá OPEN VOLEY desde el navegador, en computadora, tablet o celular.")}</p><button className="ov-text-link" onClick={onOpenPlansModal}>{t("Consultar planes y precios")} <ArrowUpRight size={19}/></button></div><div className="ov-access-right"><h3>{t("Primero conocé la plataforma.")}<br />{t("Después elegí cómo seguir.")}</h3><p>{t("Probá el recorrido con tu cuenta de Google o solicitá una demo para consultar cómo usarlo con tu club.")}</p><button className="ov-button ov-button-primary" onClick={onStartFreeTrial}>{t("Probar OPEN VOLEY")} <ArrowUpRight size={19}/></button><span>{t("7 días para explorar · Sin tarjeta para comenzar")}</span></div></section>
   {currentLocale === 'pt-BR' && <section className="ov-section ov-container" aria-label="Preços para o Brasil"><div className="ov-section-heading"><div><p className="ov-eyebrow">Brasil</p><h2>Planos para equipes brasileiras</h2></div><p>Todos os preços para clientes do Brasil são cobrados em dólares americanos (USD), não em reais (BRL). Valores em USD por mês. A contratação e o pagamento dependem da disponibilidade do meio de pagamento internacional.</p></div><div className="ov-tool-list" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>{[['plan-dt','Treinador'],['plan-club-pro','Clube Pro'],['plan-federacion','Federação / Torneio']].map(([id,name])=><div key={id} style={{padding:18,border:'1px solid currentColor',borderRadius:12}}><h3>{name}</h3><p>{brazilPrices?.[id] != null ? `US$ ${Number(brazilPrices[id]).toFixed(2)} / mês` : 'Preço sob consulta'}</p></div>)}</div><p style={{marginTop:16}}>Moeda de cobrança: <strong>dólar americano (USD)</strong>. Não realizamos conversão automática para reais.</p></section>}
   <section id="demo" className="ov-demo"><div className="ov-container ov-demo-grid"><div><p className="ov-eyebrow">{t("Hablemos de tu equipo")}</p><h2>{t("Tu próximo partido")}<br />{t("puede decirte más.")}</h2><p>{t("Dejanos tus datos para coordinar una demo o consultar por OPEN VOLEY.")}</p><div className="ov-demo-mark" aria-hidden="true"><Volleyball /><span>{t("El juego cambia.")}<br />{t("Tu mirada también.")}</span></div></div><LeadRegistrationForm variant="landing" locale={currentLocale}/></div></section>
   <section className="ov-section ov-container ov-faq"><div><h2>{t("Preguntas")}<br />{t("desde el banco.")}</h2></div><div>{questions.map(([title, answer], i) => <article key={title}><h3><button aria-expanded={openQuestion === i} aria-controls={`ov-answer-${i}`} onClick={() => setOpenQuestion(openQuestion === i ? null : i)}>{t(title)}{openQuestion === i ? <Minus size={18}/> : <Plus size={18}/>}</button></h3><div id={`ov-answer-${i}`} hidden={openQuestion !== i}><p>{t(answer)}</p></div></article>)}</div></section>
  </main>
  <footer className="ov-footer"><div className="ov-container"><a href="#inicio" className="ov-brand"><Volleyball aria-hidden="true"/><span>OPEN<span>VOLEY</span></span></a><p>{t("Scouting, análisis y entrenamiento de vóley.")}</p><a href="#demo">{t("Consultar por la plataforma")} <ArrowUpRight size={16}/></a><span>© {new Date().getFullYear()} OPEN VOLEY</span></div></footer>
 </div>;
};
