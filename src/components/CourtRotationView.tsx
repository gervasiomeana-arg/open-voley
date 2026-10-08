import React, { useState } from 'react';
import { MatchData, Player, TeamSide } from '../types';
export type CourtView = 'back' | 'side';
export function useCourtView(defaultView: CourtView = 'back') {
  const [view, setView] = useState<CourtView>(() => {
    try { return localStorage.getItem('openvoley.courtView') === 'side' ? 'side' : localStorage.getItem('openvoley.courtView') === 'back' ? 'back' : defaultView; } catch { return defaultView; }
  });
  const [swapped, setSwapped] = useState(() => { try { return localStorage.getItem('openvoley.courtSides') === 'swapped'; } catch { return false; } });
  return { view, swapped, onView: (next: CourtView) => { setView(next); try { localStorage.setItem('openvoley.courtView', next); } catch {} }, onSwap: () => setSwapped(previous => { const next = !previous; try { localStorage.setItem('openvoley.courtSides', next ? 'swapped' : 'normal'); } catch {} return next; }) };
}
export const CourtViewControls: React.FC<{view: CourtView; onView: (v: CourtView) => void; onSwap: () => void}> = ({view,onView,onSwap}) => <div className="flex gap-1" role="group" aria-label="Vista de la cancha">
  {(['back','side'] as const).map(v=><button type="button" key={v} aria-pressed={view===v} onClick={()=>onView(v)} className={`min-h-11 rounded-lg border px-2 text-[10px] font-bold ${view===v?'border-amber-400 bg-amber-500 text-slate-950':'border-slate-600 bg-slate-800 text-white'}`}>{v==='back'?'Desde atrás':'De costado'}</button>)}
  <button type="button" onClick={onSwap} className="min-h-11 rounded-lg border border-slate-600 bg-slate-800 px-2 text-[10px] font-bold text-white">Cambiar lados</button>
</div>;
export function courtPositionOrder(view: CourtView, half: number): number[] {
  return view === 'back' ? (half===0 ? [1,6,5,2,3,4] : [4,3,2,5,6,1]) : (half===0 ? [5,4,6,3,1,2] : [2,1,3,6,4,5]);
}
export const CourtRotationView: React.FC<{
  match: MatchData; activeTeam: TeamSide; selectedPlayer: Player | null; onPlayer: (team: TeamSide, p: Player) => void; view: CourtView; swapped: boolean;
}> = ({match,activeTeam,selectedPlayer,onPlayer,view,swapped}) => {
  const teams: TeamSide[] = swapped ? ['away','home'] : ['home','away'];
  const side = view==='side';
  const bench = (team: TeamSide, half: number) => <div data-libero-rail={`${half===0?'first':'second'}-outer-baseline`} className={`flex gap-1 ${side?'flex-col justify-center':'min-h-11 '+(half===0?'justify-end':'justify-start')}`} role="group" aria-label={`Líberos fuera de la línea de fondo de ${team==='home'?match.homeTeamName:match.awayTeamName}`}>
    {(team==='home'?match.homePlayers:match.awayPlayers).filter(p=>p.position==='L').map(p=><button type="button" key={p.id} aria-label={`Seleccionar líbero ${team==='home'?match.homeTeamName:match.awayTeamName} #${p.number}`} aria-pressed={activeTeam===team && selectedPlayer?.id===p.id} onClick={()=>onPlayer(team,p)} className={`min-h-11 min-w-11 rounded-lg border px-1 text-[10px] font-black ${activeTeam===team && selectedPlayer?.id===p.id?'border-white bg-purple-500 text-white':'border-purple-500 bg-purple-950 text-purple-200'}`}>L {p.number}</button>)}
  </div>;
  return <div data-court-view={view} className={`grid h-full min-h-0 gap-1 ${side?'grid-cols-[auto_minmax(0,1fr)_4px_minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)]':'grid-cols-1'}`} style={side?undefined:{gridTemplateRows:'auto minmax(88px,1fr) 4px minmax(88px,1fr) auto'}}>
    {teams.map((team,half)=>{
      const roster=team==='home'?match.homePlayers:match.awayPlayers,rotation=team==='home'?match.homeRotation:match.awayRotation;
      return <React.Fragment key={team}>
        {side && <div className={`min-w-0 break-words whitespace-normal text-center text-[10px] font-bold ${team==='home'?'text-blue-300':'text-fuchsia-300'}`} style={{gridColumn:half===0?2:4,gridRow:1}}>{team==='home'?match.homeTeamName:match.awayTeamName}</div>}
        <div className="min-w-0" style={side?{gridColumn:half===0?1:5,gridRow:2}:{gridRow:half===0?1:5}}>
          {!side && <div className={`break-words whitespace-normal text-[10px] font-bold ${team==='home'?'text-blue-300':'text-fuchsia-300'}`}>{team==='home'?match.homeTeamName:match.awayTeamName}</div>}
          {bench(team,half)}
        </div>
        <div className={`grid min-h-0 gap-1 ${side?'grid-cols-2 grid-rows-3':'grid-cols-3 grid-rows-2'}`} style={side?{gridColumn:half===0?2:4,gridRow:2}:{gridRow:half===0?2:4}} data-court-team={team}>
          {courtPositionOrder(view,half).map(position=>{
            const number=rotation[position-1],player=roster.find(p=>p.number===number),setter=player?.position==='S',selected=team===activeTeam && selectedPlayer?.id===player?.id;
            return <button type="button" key={position} disabled={!player || player.position==='L'} aria-label={`${team==='home'?match.homeTeamName:match.awayTeamName} P${position} #${number}${setter?', armador':''}`} aria-pressed={selected} onClick={()=>player&&onPlayer(team,player)} className={`min-h-11 min-w-0 rounded-lg border-2 font-black disabled:opacity-30 ${setter?'bg-amber-100 text-slate-950':team==='home'?'bg-blue-600 text-white':'bg-fuchsia-600 text-white'} ${selected?'border-white ring-2 ring-amber-400':'border-transparent'}`}>
              <span className="block text-[8px] leading-none">P{position}{setter?' · A':''}{team===match.server.team && position===1?' · 🏐':''}</span><span className="text-lg leading-tight">{player?.position==='L'?'—':number||'—'}</span>
            </button>;
          })}
        </div>
      </React.Fragment>;
    })}
    <div role="separator" aria-label="Red entre equipos" className="rounded-full bg-white" style={side?{gridColumn:3,gridRow:2}:{gridRow:3}} />
  </div>;
};
