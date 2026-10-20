import React, { useRef, useState } from 'react';
import { MatchData, ScoutLayoutPreset, TeamSide } from '../types';
import { isScoutLayoutPreset, moveScoutSlot, resolveScoutPreset, rotationWithSetterAt, SCOUT_ROLE_LABELS, scoutRotationKey, setterPosition } from '../utils/scoutCourtLayout';

type Source = number | 'libero';
export const ScoutLayoutEditor: React.FC<{
  match: MatchData; initialTeam: TeamSide; onClose: () => void;
  onSave: (team: TeamSide, key: string, preset: ScoutLayoutPreset | null) => void;
}> = ({match,initialTeam,onClose,onSave}) => {
  const [team,setTeam]=useState(initialTeam);
  const [setterZone,setSetterZone]=useState(()=>setterPosition(initialTeam==='home'?match.homePlayers:match.awayPlayers,initialTeam==='home'?match.homeRotation:match.awayRotation));
  const [receiving,setReceiving]=useState(match.server.team!==initialTeam);
  const [source,setSource]=useState<Source | null>(null);
  const [notice,setNotice]=useState('');
  const gesture=useRef<{source: Source; x:number; y:number} | null>(null);
  const skipClick=useRef(false);
  const roster=team==='home'?match.homePlayers:match.awayPlayers;
  const currentRotation=team==='home'?match.homeRotation:match.awayRotation;
  const rotation=rotationWithSetterAt(roster,currentRotation,setterZone);
  const preset=resolveScoutPreset(match,team,rotation,receiving);
  const key=scoutRotationKey(roster,rotation,receiving);
  const valid=isScoutLayoutPreset(preset);
  const move=(from: Source,to: number)=>{
    if (!valid) return;
    onSave(team,key,moveScoutSlot(preset,from,to)); setSource(null);setNotice('Ubicación guardada para esta rotación y situación durante el partido.');
  };
  const touch=(zone:number)=>{if(source===null)setSource(zone);else if(source===zone)setSource(null);else move(source,zone);};
  const dragProps=(from:Source)=>({
    onPointerDown:(event:React.PointerEvent<HTMLButtonElement>)=>{
      gesture.current={source:from,x:event.clientX,y:event.clientY};
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerUp:(event:React.PointerEvent<HTMLButtonElement>)=>{
      const start=gesture.current;gesture.current=null;
      if(!start || Math.hypot(event.clientX-start.x,event.clientY-start.y)<10)return;
      skipClick.current=true;
      const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-edit-zone]');
      const zone=Number(target?.getAttribute('data-edit-zone'));
      if(zone>=1&&zone<=6)move(start.source,zone);
    },
    onPointerCancel:()=>{gesture.current=null;skipClick.current=false;},
    style:{touchAction:'none' as const},
  });
  const click=(next:()=>void)=>{if(skipClick.current){skipClick.current=false;return;}next();};
  const chooseTeam=(next:TeamSide)=>{
    setTeam(next);setSetterZone(setterPosition(next==='home'?match.homePlayers:match.awayPlayers,next==='home'?match.homeRotation:match.awayRotation));
    setReceiving(match.server.team!==next);setSource(null);setNotice('');
  };
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-2 text-white" role="dialog" aria-modal="true" aria-label="Ubicación por rotación">
    <section className="flex max-h-[96dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-600 bg-slate-900">
      <header className="flex items-center justify-between gap-2 border-b border-slate-700 p-3"><h2 className="font-bold">Ubicación por rotación</h2><button type="button" onClick={onClose} className="min-h-11 rounded-lg bg-amber-400 px-4 font-bold text-slate-950">Listo</button></header>
      <div className="space-y-3 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Equipo a ubicar">{(['home','away'] as const).map(t=><button type="button" key={t} onClick={()=>chooseTeam(t)} aria-pressed={team===t} className={`min-h-11 break-words rounded-lg border px-2 text-sm font-bold ${team===t?'border-white bg-slate-100 text-slate-950':'border-slate-600 bg-slate-800'}`}>{t==='home'?match.homeTeamName:match.awayTeamName}</button>)}</div>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-1 items-center gap-2 text-xs">Armador en
            <select aria-label="Rotación según posición del armador" disabled={!setterZone} value={setterZone} onChange={e=>{setSetterZone(Number(e.target.value));setSource(null);setNotice('');}} className="min-h-11 flex-1 rounded-lg bg-slate-800 p-2 text-sm font-bold">
              {!setterZone?<option value={0}>Sin armador</option>:Array.from({length:6},(_,i)=><option key={i+1} value={i+1}>P{i+1}</option>)}
            </select>
          </label>
          <div className="flex gap-1" role="group" aria-label="Situación de juego">{[false,true].map(receive=><button type="button" key={String(receive)} aria-pressed={receiving===receive} onClick={()=>{setReceiving(receive);setSource(null);setNotice('');}} className={`min-h-11 rounded-lg border px-3 text-xs font-bold ${receiving===receive?'border-white bg-slate-100 text-slate-950':'border-slate-600 bg-slate-800'}`}>{receive?'Recibe':'Saca'}</button>)}</div>
        </div>
        <p className="text-xs text-slate-300">Arrastrá el jugador, o tocá uno y después su destino. Se guarda para esta rotación; el saque y la recepción se ajustan por separado.</p>
        <div className="h-1 rounded-full bg-white" aria-label="Red" />
        <div className="grid grid-cols-3 gap-2">
          {[4,3,2,5,6,1].map(zone=>{
            const p=roster.find(p=>p.number===rotation[preset.positions[zone-1]-1]&&p.position!=='L');
            const selected=source===zone;
            return <div key={zone} data-edit-zone={zone} className="flex min-h-28 flex-col gap-1 rounded-lg border border-slate-600 p-1">
              <span className="text-center text-[10px] text-slate-300">Zona {zone}</span>
              <button type="button" disabled={!p||!valid} {...dragProps(zone)} onClick={()=>click(()=>touch(zone))} aria-pressed={selected} aria-label={`Mover ${p?SCOUT_ROLE_LABELS[p.position]+' #'+p.number:'sin jugador'} de zona ${zone}`} className={`min-h-14 flex-1 rounded-lg border-2 px-1 text-center font-bold disabled:opacity-30 ${p?.position==='S'?'bg-amber-100 text-slate-950':team==='home'?'bg-blue-600':'bg-fuchsia-600'} ${selected?'border-white ring-2 ring-amber-400':'border-transparent'}`}>
                <span className="block text-[10px]">{p?SCOUT_ROLE_LABELS[p.position]:'Sin jugador'}</span><span className="block text-2xl">{p?.number??'—'}</span>
              </button>
              {zone===preset.liberoZone && roster.some(p=>p.position==='L') && <button type="button" {...dragProps('libero')} onClick={()=>click(()=>setSource(source==='libero'?null:'libero'))} aria-pressed={source==='libero'} aria-label="Mover acceso de líberos" className={`min-h-11 rounded-lg border-2 bg-lime-300 px-1 text-xs font-black text-slate-950 ${source==='libero'?'border-slate-950 ring-2 ring-white':'border-lime-100'}`}>LÍBERO {roster.filter(p=>p.position==='L').map(p=>p.number).join(' / ')}</button>}
            </div>;
          })}
        </div>
        <p className="min-h-5 text-xs text-lime-200" role="status">{source!==null?'Elegí la zona de destino.':notice}</p>
        {!valid&&<p className="text-xs text-amber-300">Completá los seis jugadores en Formación antes de ajustar ubicaciones.</p>}
        <p className="text-[11px] text-slate-400">Esta es una ubicación para seleccionar durante el scout. No modifica la formación reglamentaria, el marcador ni acciones anteriores.</p>
        <button type="button" onClick={()=>{onSave(team,key,null);setSource(null);setNotice('Ubicación estándar restaurada para esta rotación y situación.');}} className="min-h-11 rounded-lg border border-slate-500 px-3 text-xs font-bold">Restablecer estándar</button>
      </div>
    </section>
  </div>;
};
