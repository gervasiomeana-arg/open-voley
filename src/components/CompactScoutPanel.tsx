import { CourtRotationView, CourtViewControls, CourtView } from './CourtRotationView';
import React, { useState } from 'react';
import { userStorage } from '../services/userStorage';
import { ScoutCourtLayout } from '../utils/scoutCourtLayout';
import { ScoutLayoutEditor } from './ScoutLayoutEditor';
import { EvaluationSymbol, MatchData, Player, ScoutLayoutPreset, TeamSide, VolleySkill } from '../types';

export const SIMPLE_SCOUT_SKILLS: {id: VolleySkill; label: string}[] = [
  {id:'A',label:'Ataque'}, {id:'R',label:'Recepción'}, {id:'S',label:'Saque'}, {id:'B',label:'Bloqueo'}, {id:'D',label:'Defensa'},
];

export const CompactScoutPanel: React.FC<{
  match: MatchData; activeTeam: TeamSide; selectedPlayer: Player | null; skill: VolleySkill;
  outcomes: {symbol: EvaluationSymbol; label: string; colorClass: string}[];
  onPlayer: (team: TeamSide, player: Player) => void; onSkill: (skill: VolleySkill) => void;
  onEvaluate: (symbol: EvaluationSymbol) => void; onUndo: () => void; onClose: () => void;
  onFormation?: () => void;
  onSaveScoutPreset?: (team: TeamSide, key: string, preset: ScoutLayoutPreset | null) => void;
  confirmation: string | null; view: CourtView; swapped: boolean; onView: (v: CourtView) => void; onSwap: () => void;
}> = ({match,activeTeam,selectedPlayer,skill,outcomes,onPlayer,onSkill,onEvaluate,onUndo,onClose,confirmation,view,swapped,onView,onSwap,onFormation,onSaveScoutPreset}) => {
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState<ScoutCourtLayout>(() => {
    try { return userStorage.getItem('openvoley.scoutCourtLayout') === 'rotation' ? 'rotation' : 'roles'; } catch { return 'roles'; }
  });
  const changeLayout = (next: ScoutCourtLayout) => { setLayout(next); try { userStorage.setItem('openvoley.scoutCourtLayout', next); } catch {} };
  const set = match.sets[match.currentSet - 1] || {scoreHome:0,scoreAway:0};
  return <>
  <section aria-label="Scout simple en pantalla completa" className="fixed inset-0 z-[90] h-dvh bg-slate-950 text-white" style={{padding:'max(6px, env(safe-area-inset-top)) max(6px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left))'}}>
    <div className="mx-auto grid h-full max-w-3xl gap-1.5" style={{gridTemplateRows:'auto auto minmax(150px, 1fr) auto auto auto auto'}}>
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm">Scout simple</strong>
        {onFormation && <button type="button" onClick={onFormation} className="min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-3 text-xs font-bold">Formación</button>}
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg bg-slate-800 px-3 text-xs font-bold">Volver al panel</button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl bg-slate-900 px-2 py-1 text-xs">
        <span className="min-w-0 break-words whitespace-normal font-bold text-blue-300">{match.homeTeamName}</span>
        <div className="text-center"><strong className="block text-base">{set.scoreHome} – {set.scoreAway}</strong><span className="text-[10px]">Set {match.currentSet}</span></div>
        <span className="min-w-0 break-words whitespace-normal text-right font-bold text-fuchsia-300">{match.awayTeamName}</span>
      </div>
      <div className="flex min-h-0 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <CourtViewControls view={view} onView={onView} onSwap={onSwap} />
          <div className="flex gap-1" role="group" aria-label="Ubicación para seleccionar jugadores">
            {(['roles','rotation'] as const).map(mode=><button type="button" key={mode} onClick={()=>changeLayout(mode)} aria-pressed={layout===mode} className={`min-h-11 rounded-lg border px-2 text-[10px] font-bold ${layout===mode?'border-white bg-slate-100 text-slate-950':'border-slate-600 bg-slate-800'}`}>{mode==='roles'?'Por función':'Rotación'}</button>)}
            {layout==='roles' && onSaveScoutPreset && <button type="button" onClick={()=>setEditing(true)} className="min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-2 text-[10px] font-bold">Editar ubicación</button>}
          </div>
        </div>
        <div className="min-h-0 flex-1"><CourtRotationView match={match} activeTeam={activeTeam} selectedPlayer={selectedPlayer} onPlayer={onPlayer} view={view} swapped={swapped} layout={layout} /></div>
      </div>
      <div className="truncate rounded-lg bg-slate-900 px-2 py-1 text-xs" role="status">{selectedPlayer ? `${activeTeam==='home'?match.homeTeamName:match.awayTeamName} · #${selectedPlayer.number}` : 'Elegí receptor o líbero'} · {SIMPLE_SCOUT_SKILLS.find(s=>s.id===skill)?.label}</div>
      <div className="grid grid-cols-5 gap-1" role="group" aria-label="Fundamento">
        {SIMPLE_SCOUT_SKILLS.map(s=><button type="button" key={s.id} aria-pressed={skill===s.id} onClick={()=>onSkill(s.id)} className={`min-h-11 rounded-lg border text-[10px] font-bold ${skill===s.id?'border-amber-300 bg-amber-500 text-slate-950':'border-slate-600 bg-slate-800'}`}>{s.label}</button>)}
      </div>
      <div className={`grid gap-1 ${outcomes.length<=4?'grid-cols-2':'grid-cols-3'}`} role="group" aria-label="Evaluación">
        {outcomes.map(o=><button type="button" key={o.symbol} disabled={!selectedPlayer} onClick={()=>onEvaluate(o.symbol)} className={`min-h-11 rounded-lg border px-1 py-1 font-black disabled:opacity-30 ${o.colorClass}`}><span className="mr-1 text-lg">{o.symbol}</span><span className="text-[10px]">{o.label}</span></button>)}
      </div>
      <div className="flex items-center gap-2"><button type="button" onClick={onUndo} disabled={!match.actions.length} className="min-h-11 shrink-0 rounded-lg bg-slate-800 px-3 text-xs font-bold disabled:opacity-30">Deshacer</button><span className="truncate text-[10px] text-slate-300" role="status">{confirmation || (layout==='roles'?'Ubicación por función · No cambia la rotación':'A: armador · Líberos en verde lima')}</span></div>
    </div>
  </section>
  {editing && onSaveScoutPreset && <ScoutLayoutEditor match={match} initialTeam={activeTeam} onClose={()=>setEditing(false)} onSave={onSaveScoutPreset} />}
  </>;
};
