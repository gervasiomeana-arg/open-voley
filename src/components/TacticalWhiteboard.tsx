import { CourtViewControls, useCourtView } from './CourtRotationView';
import React, { useEffect, useRef, useState } from 'react';
import { MatchData } from '../types';

type Point = { x: number; y: number };
type Token = Point & { id: string; label: string; team: 'home' | 'away' | 'ball' };
type Stroke = { points: Point[]; arrow: boolean; color: string };
type Board = { tokens: Token[]; strokes: Stroke[] };
const COLORS = ['#ffffff', '#facc15', '#ef4444'];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function initialWhiteboard(match: MatchData): Board {
  const tokens: Token[] = [];
  for (const team of ['home', 'away'] as const) {
    const roster = team === 'home' ? match.homePlayers : match.awayPlayers;
    const rotation = team === 'home' ? match.homeRotation : match.awayRotation;
    const order = team === 'home' ? [1, 6, 5, 2, 3, 4] : [4, 3, 2, 5, 6, 1];
    order.forEach((position, i) => tokens.push({
      id: `${team}-${position}`, team, label: String(rotation?.[position - 1] || position),
      x: 90 + (i % 3) * 90, y: (team === 'home' ? 130 : 390) + Math.floor(i / 3) * 120,
    }));
    roster.filter(p => p.position === 'L').slice(0, 2).forEach((player, i) => tokens.push({
      id: `${team}-libero-${i}`, team, label: `L${player.number}`, x: team === 'home' ? 270 - i * 50 : 90 + i * 50, y: team === 'home' ? 25 : 615,
    }));
  }
  tokens.push({ id: 'ball', label: '●', team: 'ball', x: 335, y: 320 });
  return { tokens, strokes: [] };
}

export function validWhiteboard(value: unknown): value is Board {
  if (!value || typeof value !== 'object') return false;
  const b = value as Board;
  const point = (p: Point) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 360 && p.y >= 0 && p.y <= 640;
  return Array.isArray(b.tokens) && b.tokens.length >= 13 && b.tokens.length <= 17 &&
    new Set(b.tokens.map(t => t.id)).size === b.tokens.length && b.tokens.filter(t => t.team === 'ball').length === 1 &&
    b.tokens.every(t => point(t) && typeof t.id === 'string' && typeof t.label === 'string' && t.label.length < 12 && ['home', 'away', 'ball'].includes(t.team)) &&
    Array.isArray(b.strokes) && b.strokes.length <= 100 && b.strokes.every(s => s && typeof s.arrow === 'boolean' && COLORS.includes(s.color) && Array.isArray(s.points) && s.points.length <= 1000 && s.points.every(point));
}

export const TacticalWhiteboard: React.FC<{ match: MatchData }> = ({ match }) => {
  const courtView = useCourtView();
  const angle = (courtView.view === 'side' ? -90 : 0) + (courtView.swapped ? 180 : 0);
  const worldTransform = angle === -90 ? 'translate(0 360) rotate(-90)' : angle === 90 ? 'translate(640 0) rotate(90)' : angle === 180 ? 'translate(360 640) rotate(180)' : '';
  const world = useRef<SVGGElement>(null);
  const storageKey = `openvoley.whiteboard.v1.${match.id}`;
  const [board, setBoard] = useState<Board>(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (validWhiteboard(saved)) return { ...saved, tokens: saved.tokens.map(t => t.label.startsWith('L') && t.x === 23 && [140, 200, 420, 480].includes(t.y) ? { ...t, x: t.team === 'home' ? 270 - (t.y === 200 ? 50 : 0) : 90 + (t.y === 480 ? 50 : 0), y: t.team === 'home' ? 25 : 615 } : t) }; } catch { /* Start with formation. */ }
    return initialWhiteboard(match);
  });
  const [history, setHistory] = useState<Board[]>([]);
  const [tool, setTool] = useState<'move' | 'pen' | 'arrow'>('move');
  const [color, setColor] = useState(COLORS[0]);
  const [expanded, setExpanded] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  const gesture = useRef<{ pointer: number; token?: string; stroke?: number; before: Board } | null>(null);
  const latest = useRef(board);
  latest.current = board;
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(board)); setSaveMessage('Pizarra guardada en este navegador.'); }
    catch { setSaveMessage('No se pudo guardar; la pizarra sigue disponible mientras permanezcas aquí.'); }
  }, [board, storageKey]);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', close);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', close); document.body.style.overflow = previous; };
  }, [expanded]);
  const checkpoint = (before: Board) => setHistory(h => [...h.slice(-39), before]);
  const pointAt = (event: React.PointerEvent): Point | null => {
    const matrix = world.current?.getScreenCTM();
    if (!matrix || !svg.current) return null;
    const p = svg.current.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    const converted = p.matrixTransform(matrix.inverse());
    return { x: clamp(converted.x, 22, 338), y: clamp(converted.y, 22, 618) };
  };
  const begin = (event: React.PointerEvent<SVGSVGElement>) => {
    if (gesture.current || event.button !== 0) return;
    const p = pointAt(event); if (!p) return;
    const target = event.target as Element;
    const token = target.closest('[data-token]')?.getAttribute('data-token') || undefined;
    if (tool === 'move' && !token) return;
    if (tool !== 'move' && board.strokes.length >= 100) { setSaveMessage('Borrá trazos para seguir dibujando.'); return; }
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { pointer: event.pointerId, before: board, ...(tool === 'move' ? { token } : { stroke: board.strokes.length }) };
    if (tool !== 'move') setBoard(b => ({ ...b, strokes: [...b.strokes, { points: [p, p], arrow: tool === 'arrow', color }] }));
  };
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current; if (!g || g.pointer !== event.pointerId) return;
    const p = pointAt(event); if (!p) return;
    setBoard(b => g.token ? { ...b, tokens: b.tokens.map(t => t.id === g.token ? { ...t, ...p } : t) } : {
      ...b, strokes: b.strokes.map((s, i) => i !== g.stroke ? s : { ...s, points: s.arrow ? [s.points[0], p] : [...s.points.slice(-998), p] }),
    });
  };
  const finish = (event: React.PointerEvent<SVGSVGElement>, cancel = false) => {
    const g = gesture.current; if (!g || g.pointer !== event.pointerId) return;
    gesture.current = null;
    if (cancel) setBoard(g.before);
    else if (latest.current !== g.before) checkpoint(g.before);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const change = (next: Board) => { checkpoint(board); setBoard(next); };
  const button = 'min-h-11 rounded-xl border border-slate-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40';
  return <section className={expanded ? 'fixed inset-0 z-[100] overflow-y-auto bg-slate-950 p-3 sm:p-6' : 'rounded-2xl border border-slate-700 bg-slate-900 p-3 sm:p-5'}>
    <div className="mx-auto max-w-4xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-lg font-black text-white">Pizarra táctica</h2><p className="text-xs text-slate-400">Mové jugadores y pelota. Dibujá recorridos para explicar la jugada.</p></div>
        <button type="button" className={button} onClick={() => setExpanded(!expanded)}>{expanded ? 'Cerrar vista ampliada' : 'Ampliar'}</button>
      </div>
      <CourtViewControls view={courtView.view} onView={courtView.onView} onSwap={courtView.onSwap} />
      <div className="flex flex-wrap gap-2">
        {(['move', 'pen', 'arrow'] as const).map(t => <button type="button" key={t} aria-pressed={tool === t} onClick={() => setTool(t)} className={`${button} ${tool === t ? 'bg-amber-500 !text-slate-950' : 'bg-slate-800'}`}>{t === 'move' ? 'Mover' : t === 'pen' ? 'Dibujar' : 'Flecha'}</button>)}
        {COLORS.map(c => <button type="button" key={c} aria-label={`Color ${c === '#ffffff' ? 'blanco' : c === '#facc15' ? 'amarillo' : 'rojo'}`} aria-pressed={color === c} onClick={() => setColor(c)} className={`min-h-11 min-w-11 rounded-xl border-2 ${color === c ? 'border-amber-400' : 'border-slate-600'}`}><span className="mx-auto block h-5 w-5 rounded-full" style={{background: c}} /></button>)}
        <button type="button" className={button} disabled={!history.length} onClick={() => { setBoard(history[history.length - 1]); setHistory(h => h.slice(0, -1)); }}>Deshacer</button>
        <button type="button" className={button} disabled={!board.strokes.length} onClick={() => change({ ...board, strokes: [] })}>Borrar trazos</button>
        <button type="button" className={button} onClick={() => change(initialWhiteboard(match))}>Formación actual</button>
      </div>
      <p className="text-xs text-amber-200">A · Armador en amarillo claro · L · Líberos fuera de la cancha</p>
      <div className="flex justify-between gap-2 text-xs font-bold"><span className="text-blue-300">● {match.homeTeamName}</span><span className="text-pink-300">● {match.awayTeamName}</span></div>
      <svg ref={svg} viewBox={courtView.view === 'side' ? '0 0 640 360' : '0 0 360 640'} aria-label="Pizarra de vóley con jugadores de ambos equipos y pelota" className="mx-auto w-full max-w-[640px] rounded-2xl bg-sky-900" style={{touchAction: 'none', userSelect: 'none'}} onPointerDown={begin} onPointerMove={move} onPointerUp={e => finish(e)} onPointerCancel={e => finish(e, true)} onLostPointerCapture={e => { if (gesture.current?.pointer === e.pointerId) finish(e, true); }}>
        <defs>{COLORS.map((c,i) => <marker key={c} id={`whiteboard-arrow-${i}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={c} /></marker>)}</defs>
        <g ref={world} transform={worldTransform}>
        <rect x="45" y="60" width="270" height="520" fill="#ed8936" stroke="white" strokeWidth="3" />
        <path d="M45 233 H315 M45 407 H315" stroke="white" strokeWidth="3" />
        <path d="M28 320 H332" stroke="#0f172a" strokeWidth="10" /><path d="M28 320 H332" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
        <g pointerEvents="none">{board.strokes.map((s,i) => <path key={i} d={s.points.map((p,j) => `${j ? 'L' : 'M'}${p.x},${p.y}`).join(' ')} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd={s.arrow ? `url(#whiteboard-arrow-${COLORS.indexOf(s.color)})` : undefined} />)}</g>
        {board.tokens.map(t => {
          const setter = t.team !== 'ball' && (t.team === 'home' ? match.homePlayers : match.awayPlayers).some(p => p.position === 'S' && String(p.number) === t.label);
          return <g key={t.id} data-token={t.id} transform={`translate(${t.x} ${t.y}) rotate(${-angle})`} role="button" tabIndex={0} aria-label={`${t.team === 'ball' ? 'Pelota' : `${t.team === 'home' ? match.homeTeamName : match.awayTeamName} ${t.label}${setter ? ', armador' : ''}`}. Usá las flechas del teclado para mover.`} style={{cursor: tool === 'move' ? 'grab' : 'crosshair'}} onKeyDown={event => {
          const delta: Record<string, Point> = {ArrowUp:{x:0,y:-10}, ArrowDown:{x:0,y:10}, ArrowLeft:{x:-10,y:0}, ArrowRight:{x:10,y:0}};
          const d = delta[event.key]; if (!d) return; event.preventDefault(); change({ ...board, tokens: board.tokens.map(item => item.id === t.id ? {...item, x:clamp(item.x+d.x,22,338), y:clamp(item.y+d.y,22,618)} : item) });
        }}>
          <circle r="22" fill="transparent" /><circle r={t.team === 'ball' ? 15 : 19} fill={t.team === 'ball' ? '#fef08a' : setter ? '#fef3c7' : t.team === 'home' ? '#2563eb' : '#db2777'} stroke="white" strokeWidth="2" />
          {t.team === 'ball' ? <path d="M-12 -6 Q6 -10 13 5 M-5 -14 Q-10 5 7 13 M-13 7 Q4 2 7 -12" fill="none" stroke="#a16207" strokeWidth="2" pointerEvents="none" /> : <text textAnchor="middle" y="5" fill={setter ? '#0f172a' : 'white'} fontWeight="bold" fontSize={t.label.length > 2 ? 12 : 16} pointerEvents="none">{t.label}</text>}
          {setter && <g pointerEvents="none"><rect x="8" y="-26" width="15" height="14" rx="4" fill="#0f172a" /><text x="15.5" y="-15" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="bold">A</text></g>}
        </g>; })}
        </g>
      </svg>
      <p role="status" className="text-xs text-slate-400">{saveMessage}</p>
      <p className="text-xs text-slate-400">La pizarra es independiente del registro del partido. “Formación actual” vuelve a cargar las rotaciones y limpia el dibujo; podés deshacerlo.</p>
    </div>
  </section>;
};
