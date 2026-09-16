import React, { useState, useMemo } from 'react';
import { 
  Scan, 
  Activity, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Bot,
  X,
  Gauge,
  Layers,
  Crosshair
} from 'lucide-react';
import { ScoutCodeAction } from '../types';

interface ComputerVisionOverlayProps {
  isPlaying?: boolean;
  currentTime?: number;
  isAutoScoutActive: boolean;
  actions?: ScoutCodeAction[];
  onToggleAutoScout: () => void;
  onDetectedAction?: (actionDesc: string) => void;
  onAddTagFromCv?: (timestamp: number, rawCode: string, description: string) => void;
}

export const ComputerVisionOverlay: React.FC<ComputerVisionOverlayProps> = ({
  isPlaying = true,
  currentTime = 0,
  isAutoScoutActive,
  actions = [],
  onToggleAutoScout,
  onDetectedAction,
  onAddTagFromCv
}) => {
  // If AutoScout is off, render nothing on top of the video
  if (!isAutoScoutActive) {
    return null;
  }

  // Find relevant match action based on currentTime
  const currentAction = useMemo(() => {
    if (!actions || actions.length === 0) return null;
    const match = actions.find(a => Math.abs(a.timestamp - currentTime) <= 6);
    return match || actions[0] || null;
  }, [actions, currentTime]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden font-sans">
      {/* Top Professional TV Broadcast HUD Header */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Left: TV Telemetry Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 px-3.5 py-1.5 rounded-xl shadow-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5" />
              <span>AutoScout IA Activo</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
              HD Tracking
            </span>
          </div>
        </div>

        {/* Right: Deactivate Button */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={onToggleAutoScout}
            className="bg-slate-950/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Desactivar AutoScout</span>
          </button>
        </div>
      </div>

      {/* Top-Left Discreet Tactical Card (No floating bounding boxes on screen) */}
      <div className="absolute top-14 left-3 pointer-events-none max-w-xs sm:max-w-sm">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-2xl space-y-2">
          {/* Header Info */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black font-mono text-xs flex items-center justify-center shadow">
                #7
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-none">Facundo Conte</h4>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Receptor Punta • Argentina</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                *07AH#
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg">
              <span className="text-slate-400 block text-[9px]">Velocidad Remate</span>
              <span className="font-bold text-rose-400 text-xs">104.2 km/h</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg">
              <span className="text-slate-400 block text-[9px]">Altura Contacto</span>
              <span className="font-bold text-amber-300 text-xs">3.42 m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Scouting Tag Stream */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-2.5 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <div className="text-xs font-mono text-slate-200 truncate">
              <span className="text-amber-400 font-bold">[*07SH#16]</span> Saque Potencia Punto (ACE) - 98.4% OCR
            </div>
          </div>
          <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold shrink-0">
            FIVB AUTO
          </span>
        </div>
      </div>
    </div>
  );
};
