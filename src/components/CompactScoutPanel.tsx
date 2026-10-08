import React from 'react';
import { EvaluationSymbol, MatchData, Player, TeamSide, VolleySkill } from '../types';

export const SIMPLE_SCOUT_SKILLS: {id: VolleySkill; label: string}[] = [
  {id:'A',label:'Ataque'}, {id:'R',label:'Recepción'}, {id:'S',label:'Saque'}, {id:'B',label:'Bloqueo'}, {id:'D',label:'Defensa'},
];

export const CompactScoutPanel: React.FC<{
  match: MatchData; activeTeam: TeamSide; selectedPlayer: Player | null; skill: VolleySkill;
  outcomes: {symbol: EvaluationSymbol; label: string; colorClass: string}[];
  onPlayer: (team: TeamSide, player: Player) => void; onSkill: (skill: VolleySkill) => void;
  onEvaluate: (symbol: EvaluationSymbol) => void; onUndo: () => void; onClose: () => void;
  confirmation: string | null;
}> = ({match,activeTeam,selectedPlayer,skill,outcomes,onPlayer,onSkill,onEvaluate,onUndo,onClose,confirmation}) => {
  const set = match.sets[match.currentSet - 1] || {scoreHome:0,scoreAway:0};
  return <section aria-label="Scout simple en pantalla completa" className="fixed inset-0 z-[90] h-dvh bg-slate-950 text-white" style={{padding:'max(6px, env(safe-area-inset-top)) max(6px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left))'}}>
    <div className="mx-auto grid h-full max-w-3xl gap-1.5" style={{gridTemplateRows:'auto auto minmax(150px, 1fr) auto auto auto auto'}}>
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm">Scout simple</strong>
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg bg-slate-800 px-3 text-xs font-bold">Volver al panel</button>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-2 py-1 text-xs">
        <span className="min-w-0 truncate text-blue-300">{match.homeTeamName}</span><strong className="shrink-0 text-base">{set.scoreHome} – {set.scoreAway}</strong><span className="min-w-0 truncate text-fuchsia-300">{match.awayTeamName}</span>
        <span className="shrink-0 text-[10px]">Set {match.currentSet}</span>
      </div>
      <div className="grid min-h-0 grid-cols-2 gap-2">
        {(['home','away'] as const).map(team => {
          const roster = team === 'home' ? match.homePlayers : match.awayPlayers;
          const rotation = team === 'home' ? match.homeRotation : match.awayRotation;
          return <div key={team} className="flex min-h-0 flex-col gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1.5">
            <div className={`truncate text-[10px] font-bold ${team === 'home' ? 'text-blue-300' : 'text-fuchsia-300'}`}>{team === 'home' ? match.homeTeamName : match.awayTeamName}</div>
            <div className="text-center text-[8px] text-slate-400">RED</div>
            <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-1 border-t-2 border-white pt-1">
              {[4,3,2,5,6,1].map(position => {
                const num = rotation[position-1];
                const player = roster.find(p=>p.number===num);
                const selected = activeTeam===team && selectedPlayer?.number===num;
                const setter=player?.position==='S';
                return <button type="button" key={position} disabled={!player || player.position==='L'} aria-label={`${team === 'home' ? match.homeTeamName : match.awayTeamName} P${position} #${num}${setter?', armador':''}`} aria-pressed={selected} onClick={()=>player && onPlayer(team,player)}
                  className={`min-h-11 rounded-lg border-2 font-black disabled:opacity-30 ${setter?'bg-amber-100 text-slate-950':team==='home'?'bg-blue-600':'bg-fuchsia-600'} ${selected?'border-white ring-2 ring-amber-400':'border-transparent'}`}>
                  <span className="block text-[8px] leading-none">P{position}{setter?' · A':''}{team===match.server.team && position===1?' · 🏐':''}</span><span className="text-lg leading-tight">{player?.position==='L'?'—':num||'—'}</span>
                </button>;
              })}
            </div>
            <div className="flex min-h-11 gap-1 border-t border-slate-600 pt-1" aria-label={`Líberos fuera de cancha de ${team === 'home' ? match.homeTeamName : match.awayTeamName}`}>
              {roster.filter(p=>p.position==='L').map(p=><button type="button" key={p.id} aria-label={`Seleccionar líbero ${team} #${p.number}`} aria-pressed={activeTeam===team && selectedPlayer?.id===p.id} onClick={()=>onPlayer(team,p)} className={`min-h-11 min-w-11 rounded-lg border px-2 text-xs font-black ${activeTeam===team && selectedPlayer?.id===p.id?'bg-purple-500 border-white':'bg-purple-950 border-purple-500'}`}>L {p.number}</button>)}
            </div>
          </div>;
        })}
      </div>
      <div className="truncate rounded-lg bg-slate-900 px-2 py-1 text-xs" role="status">{selectedPlayer ? `${activeTeam==='home'?match.homeTeamName:match.awayTeamName} · #${selectedPlayer.number}` : 'Elegí receptor o líbero'} · {SIMPLE_SCOUT_SKILLS.find(s=>s.id===skill)?.label}</div>
      <div className="grid grid-cols-5 gap-1" role="group" aria-label="Fundamento">
        {SIMPLE_SCOUT_SKILLS.map(s=><button type="button" key={s.id} aria-pressed={skill===s.id} onClick={()=>onSkill(s.id)} className={`min-h-11 rounded-lg border text-[10px] font-bold ${skill===s.id?'border-amber-300 bg-amber-500 text-slate-950':'border-slate-600 bg-slate-800'}`}>{s.label}</button>)}
      </div>
      <div className={`grid gap-1 ${outcomes.length<=4?'grid-cols-2':'grid-cols-3'}`} role="group" aria-label="Evaluación">
        {outcomes.map(o=><button type="button" key={o.symbol} disabled={!selectedPlayer} onClick={()=>onEvaluate(o.symbol)} className={`min-h-11 rounded-lg border px-1 py-1 font-black disabled:opacity-30 ${o.colorClass}`}><span className="mr-1 text-lg">{o.symbol}</span><span className="text-[10px]">{o.label}</span></button>)}
      </div>
      <div className="flex items-center gap-2"><button type="button" onClick={onUndo} disabled={!match.actions.length} className="min-h-11 shrink-0 rounded-lg bg-slate-800 px-3 text-xs font-bold disabled:opacity-30">Deshacer</button><span className="truncate text-[10px] text-slate-300" role="status">{confirmation || 'A: armador · L: líbero fuera de cancha'}</span></div>
    </div>
  </section>;
};
