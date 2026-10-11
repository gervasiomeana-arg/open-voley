import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, Volleyball } from 'lucide-react';

/** A public demonstration only. Never reads or writes a user's match. */
export function LandingScoutIllustration() {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReduced(media.matches); setPlaying(!media.matches); };
    update(); media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 });
    if (ref.current) observer.observe(ref.current);
    return () => { media.removeEventListener('change', update); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!playing || reduced || !visible) return;
    const timer = window.setInterval(() => setPhase(p => (p + 1) % 4), 2600);
    return () => window.clearInterval(timer);
  }, [playing, reduced, visible]);
  const labels = ['Saque · Visitante #10', 'Recepción · Local #16', 'Ataque · Local #9', 'Punto · Local #9'];
  const home = [1, 16, 14, 7, 9, 11], away = [8, 12, 1, 3, 5, 10];
  const positionsHome = [1, 6, 5, 2, 3, 4], positionsAway = [4, 3, 2, 5, 6, 1];
  const ball = [[282, 291], [174, 91], [174, 148], [226, 293]][phase];
  return <div ref={ref} className={`ov-scout-demo ov-phase-${phase}`} aria-label="Demostración ilustrada de scouting con datos de ejemplo">
    <div className="ov-scout-top"><strong>Scout simple</strong><span>LOCAL <b>{phase === 3 ? 13 : 12}</b><i>-</i><b>16</b> VISITANTE</span><small>Set 1</small></div>
    <div className="ov-scout-layout">
      <div className="ov-scout-skills" aria-hidden="true">{['Ataque', 'Recepción', 'Saque', 'Bloqueo', 'Defensa'].map((name, i) => <span key={name} className={i === (phase === 0 ? 2 : phase === 1 ? 1 : 0) ? 'is-selected' : ''}>{name}</span>)}</div>
      <svg className="ov-scout-court" viewBox="0 0 350 385" role="img" aria-label="Dos equipos enfrentados, armadores en amarillo y líberos fuera de la cancha">
        <rect x="35" y="51" width="280" height="280" fill="#111e2b" stroke="#8493a0" strokeWidth="1.5" />
        <path d="M35 145H315 M35 237H315" stroke="#61707d" strokeDasharray="4 4" />
        <path d="M26 191H324" stroke="#f6f0e5" strokeWidth="3" />
        <text x="175" y="182" className="ov-net-label">RED</text>
        {[home, away].map((team, side) => team.map((num, i) => {
          const x = 82 + (i % 3) * 92, y = side === 0 ? 91 + Math.floor(i / 3) * 57 : 234 + Math.floor(i / 3) * 57;
          const active = side === 0 && ((phase === 1 && i === 1) || (phase >= 2 && i === 4)) || side === 1 && phase === 0 && i === 5;
          const setter = side === 0 ? i === 0 : i === 2;
          return <g key={`${side}-${i}`} className={active ? 'ov-demo-player is-active' : 'ov-demo-player'}>
            <circle cx={x} cy={y} r="20" fill={setter ? '#ffbf24' : side === 0 ? '#2368ed' : '#17b8d1'} stroke={active ? '#f6f0e5' : 'transparent'} strokeWidth="3" />
            <text x={x} y={y + 6} fill={setter || side === 1 ? '#080e1a' : '#f6f0e5'}>{num}</text>
            <text className="ov-demo-position" x={x} y={y - 27}>P{(side === 0 ? positionsHome : positionsAway)[i]}{setter ? ' · A' : ''}</text>
          </g>;
        }))}
        {[{ x: 286, y: 22, n: 4 }, { x: 64, y: 364, n: 2 }].map(p => <g key={p.n}><rect x={p.x - 25} y={p.y - 15} width="50" height="30" rx="4" fill="#39265b" stroke="#9c7acf"/><text x={p.x} y={p.y + 5} className="ov-demo-libero">L {p.n}</text></g>)}
        <g className="ov-demo-ball" style={{ transform: `translate(${ball[0]}px, ${ball[1]}px)` }}><circle r="8" fill="#f6f0e5" stroke="#080e1a"/><path d="M-7 0H7 M0-7V7" stroke="#667585" strokeWidth="1"/></g>
      </svg>
      <div className="ov-scout-results" aria-hidden="true"><small>Resultado</small><span className={phase === 3 ? 'is-selected' : ''}><b>#</b> Punto</span><span><b>+</b> Continuidad</span><span><b>=</b> Error</span></div>
    </div>
    <div className="ov-scout-caption"><span><Volleyball size={14}/>{labels[phase]}</span><button type="button" onClick={() => setPlaying(p => !p)} disabled={reduced} aria-label={playing ? 'Pausar demostración' : 'Reproducir demostración'}>{playing ? <Pause size={13}/> : <Play size={13}/>}<span>{reduced ? 'Vista estática' : playing ? 'Pausar' : 'Reproducir'}</span></button></div>
    <p className="ov-scout-disclaimer">Vista ilustrativa con datos de ejemplo <ArrowRight size={12}/> A: armador · L: líbero</p>
  </div>;
}
