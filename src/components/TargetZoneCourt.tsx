import React from 'react';

export const TARGET_ZONE_ORDER = [4, 3, 2, 7, 8, 9, 5, 6, 1] as const;

export const TargetZoneCourt: React.FC<{
  selectedZone: number | null;
  onSelect: (zone: number | null) => void;
}> = ({ selectedZone, onSelect }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-slate-300">Zona de destino (1–9)</span>
      {selectedZone !== null && <button type="button" onClick={() => onSelect(null)} className="min-h-11 rounded-lg px-3 text-xs text-slate-300 hover:bg-slate-800">Limpiar Z{selectedZone}</button>}
    </div>
    <div role="group" aria-label="Cancha de destino, vista desde el fondo con la red arriba" className="w-full max-w-[300px] rounded-xl border border-sky-700 bg-sky-900 p-3">
      <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-sky-100">Red</div>
      <div aria-hidden="true" className="mb-2 h-4 border-x-4 border-red-500 bg-slate-950" style={{backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '8px 6px'}} />
      <div className="grid grid-cols-3 overflow-hidden border-2 border-white bg-orange-400">
        {TARGET_ZONE_ORDER.map((zone, index) => <button
          key={zone} type="button" aria-label={`Zona destino ${zone}`} aria-pressed={selectedZone === zone}
          onClick={() => onSelect(selectedZone === zone ? null : zone)}
          className={`relative min-h-[64px] border-white/80 text-2xl font-black transition focus-visible:z-10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-300 ${index % 3 !== 2 ? 'border-r border-dashed' : ''} ${index < 6 ? 'border-b border-dashed' : ''} ${selectedZone === zone ? 'bg-amber-200 text-slate-950 ring-4 ring-inset ring-slate-900' : 'text-slate-950 hover:bg-orange-300'}`}
        >{zone}{selectedZone === zone && <span aria-hidden="true" className="absolute right-1 top-0.5 text-xs">✓</span>}</button>)}
      </div>
      <div className="mt-2 text-center text-[10px] text-sky-100">Fondo de cancha</div>
    </div>
    <p className="text-[11px] text-slate-400">Tocá donde llegó la pelota. Volvé a tocar para quitar la zona.</p>
  </div>
);
