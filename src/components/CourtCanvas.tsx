import React, { useState } from 'react';
import { ScoutCodeAction, TeamSide } from '../types';

interface CourtCanvasProps {
  actions: ScoutCodeAction[];
  homeRotation: number[];
  awayRotation: number[];
  homePlayers: { number: number; name: string; position: string }[];
  awayPlayers: { number: number; name: string; position: string }[];
  selectedActionId?: string | null;
  onSelectAction?: (id: string) => void;
  onZoneClick?: (zone: number, team: TeamSide) => void;
}

// Coordinates for standard volleyball zones 1-9 on a 0..100 grid for each half
// Half A (Home): y = 50..100
// Half B (Away): y = 0..50
const ZONE_COORDS_HOME: Record<number, { x: number; y: number }> = {
  1: { x: 80, y: 85 },
  6: { x: 50, y: 85 },
  5: { x: 20, y: 85 },
  2: { x: 80, y: 62 },
  3: { x: 50, y: 62 },
  4: { x: 20, y: 62 },
  7: { x: 80, y: 95 },
  8: { x: 50, y: 95 },
  9: { x: 20, y: 95 },
};

const ZONE_COORDS_AWAY: Record<number, { x: number; y: number }> = {
  1: { x: 20, y: 15 },
  6: { x: 50, y: 15 },
  5: { x: 80, y: 15 },
  2: { x: 20, y: 38 },
  3: { x: 50, y: 38 },
  4: { x: 80, y: 38 },
  7: { x: 20, y: 5 },
  8: { x: 50, y: 5 },
  9: { x: 80, y: 5 },
};

export const CourtCanvas: React.FC<CourtCanvasProps> = ({
  actions,
  homeRotation,
  awayRotation,
  homePlayers,
  awayPlayers,
  selectedActionId,
  onSelectAction,
  onZoneClick,
}) => {
  const [hoveredZone, setHoveredZone] = useState<{ zone: number; team: TeamSide } | null>(null);

  // Helper to get action coordinate
  const getCoord = (zone: number, team: TeamSide) => {
    const table = team === 'home' ? ZONE_COORDS_HOME : ZONE_COORDS_AWAY;
    return table[zone] || { x: 50, y: 50 };
  };

  // Rotation positions mapping to court zones:
  // P1 -> Zone 1, P2 -> Zone 2, P3 -> Zone 3, P4 -> Zone 4, P5 -> Zone 5, P6 -> Zone 6
  const getPlayerInRotation = (rotation: number[], posIndex: number, playersList: typeof homePlayers) => {
    const pNum = rotation ? rotation[posIndex] : undefined;
    if (!pNum) return null;
    const player = (playersList || []).find((p) => p.number === pNum);
    return { number: pNum, name: player ? player.name.split(' ')[0] : `#${pNum}` };
  };

  return (
    <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-lg text-amber-400 flex items-center gap-2">
            🏐 Cancha Táctica 2D (FIVB Standard)
          </h3>
          <p className="text-xs text-slate-400">
            Haz clic en una zona para autocompletar códigos de ataque/saque o inspecciona trayectorias en vivo.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-slate-300">Equipo Local (Abajo)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block"></span>
            <span className="text-slate-300">Equipo Visitante (Arriba)</span>
          </div>
        </div>
      </div>

      {/* SVG Volleyball Court Container */}
      <div className="relative w-full aspect-[9/16] max-w-sm sm:max-w-md mx-auto bg-slate-950 rounded-xl p-2 border-2 border-amber-500/40 shadow-inner overflow-hidden select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background Wood/Court Fill */}
          <rect x="0" y="0" width="100" height="100" fill="#0f172a" />

          {/* Court Boundary Line (18x9m proportion) */}
          <rect x="10" y="10" width="80" height="80" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />

          {/* NET Line (Middle y = 50) */}
          <line x1="5" y1="50" x2="95" y2="50" stroke="#ef4444" strokeWidth="2" strokeDasharray="1.5 1" />
          <text x="96" y="51" fill="#ef4444" fontSize="3" fontWeight="bold" textAnchor="start">RED</text>

          {/* Attack Lines (3m lines) */}
          {/* Home 3m line (y = 66.6) */}
          <line x1="10" y1="66.6" x2="90" y2="66.6" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="1 1" />
          {/* Away 3m line (y = 33.3) */}
          <line x1="10" y1="33.3" x2="90" y2="33.3" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="1 1" />

          {/* Zone Grid Lines (3x3 grid on each half) */}
          {/* Vertical grid lines */}
          <line x1="36.6" y1="10" x2="36.6" y2="90" stroke="#334155" strokeWidth="0.5" />
          <line x1="63.3" y1="10" x2="63.3" y2="90" stroke="#334155" strokeWidth="0.5" />

          {/* Horizontal grid lines for back zone */}
          <line x1="10" y1="21.6" x2="90" y2="21.6" stroke="#334155" strokeWidth="0.5" />
          <line x1="10" y1="78.3" x2="90" y2="78.3" stroke="#334155" strokeWidth="0.5" />

          {/* Zone Click Targets and Zone Number Labels */}
          {/* AWAY ZONES (Top half) */}
          {[1, 2, 3, 4, 5, 6].map((zone) => {
            const coord = ZONE_COORDS_AWAY[zone];
            const isHovered = hoveredZone?.zone === zone && hoveredZone?.team === 'away';
            return (
              <g
                key={`away_z_${zone}`}
                onClick={() => onZoneClick && onZoneClick(zone, 'away')}
                onMouseEnter={() => setHoveredZone({ zone, team: 'away' })}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="5"
                  fill={isHovered ? '#06b6d4' : '#0284c7'}
                  fillOpacity={isHovered ? 0.6 : 0.2}
                  stroke="#38bdf8"
                  strokeWidth="0.6"
                />
                <text
                  x={coord.x}
                  y={coord.y + 1.2}
                  fill="#7dd3fc"
                  fontSize="3"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Z{zone}
                </text>
              </g>
            );
          })}

          {/* HOME ZONES (Bottom half) */}
          {[1, 2, 3, 4, 5, 6].map((zone) => {
            const coord = ZONE_COORDS_HOME[zone];
            const isHovered = hoveredZone?.zone === zone && hoveredZone?.team === 'home';
            return (
              <g
                key={`home_z_${zone}`}
                onClick={() => onZoneClick && onZoneClick(zone, 'home')}
                onMouseEnter={() => setHoveredZone({ zone, team: 'home' })}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="5"
                  fill={isHovered ? '#f97316' : '#ea580c'}
                  fillOpacity={isHovered ? 0.6 : 0.2}
                  stroke="#fb923c"
                  strokeWidth="0.6"
                />
                <text
                  x={coord.x}
                  y={coord.y + 1.2}
                  fill="#fdba74"
                  fontSize="3"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Z{zone}
                </text>
              </g>
            );
          })}

          {/* Player Rotation Circles - Away Team */}
          {[
            { posIndex: 0, zone: 1 },
            { posIndex: 1, zone: 2 },
            { posIndex: 2, zone: 3 },
            { posIndex: 3, zone: 4 },
            { posIndex: 4, zone: 5 },
            { posIndex: 5, zone: 6 },
          ].map((item) => {
            const player = getPlayerInRotation(awayRotation, item.posIndex, awayPlayers);
            if (!player) return null;
            const coord = ZONE_COORDS_AWAY[item.zone];
            return (
              <g key={`away_rot_${item.zone}`}>
                <circle cx={coord.x} cy={coord.y - 3} r="3" fill="#06b6d4" stroke="#ffffff" strokeWidth="0.5" />
                <text x={coord.x} y={coord.y - 2.2} fill="#ffffff" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                  {player.number}
                </text>
              </g>
            );
          })}

          {/* Player Rotation Circles - Home Team */}
          {[
            { posIndex: 0, zone: 1 },
            { posIndex: 1, zone: 2 },
            { posIndex: 2, zone: 3 },
            { posIndex: 3, zone: 4 },
            { posIndex: 4, zone: 5 },
            { posIndex: 5, zone: 6 },
          ].map((item) => {
            const player = getPlayerInRotation(homeRotation, item.posIndex, homePlayers);
            if (!player) return null;
            const coord = ZONE_COORDS_HOME[item.zone];
            return (
              <g key={`home_rot_${item.zone}`}>
                <circle cx={coord.x} cy={coord.y - 3} r="3" fill="#f97316" stroke="#ffffff" strokeWidth="0.5" />
                <text x={coord.x} y={coord.y - 2.2} fill="#ffffff" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                  {player.number}
                </text>
              </g>
            );
          })}

          {/* Action Trajectory Arrows for Scout Actions */}
          {actions.map((act) => {
            if (!act.startZone || !act.endZone) return null;

            const isSelected = act.id === selectedActionId;
            const isHome = act.team === 'home';
            const startCoord = getCoord(act.startZone, isHome ? 'home' : 'away');
            const endCoord = getCoord(act.endZone, isHome ? 'away' : 'home'); // target is usually across net

            let strokeColor = act.evaluation === '#' ? '#22c55e' : act.evaluation === '=' ? '#ef4444' : '#eab308';
            if (isSelected) strokeColor = '#a855f7';

            return (
              <g key={`trj_${act.id}`} onClick={() => onSelectAction && onSelectAction(act.id)} className="cursor-pointer">
                {/* Line */}
                <line
                  x1={startCoord.x}
                  y1={startCoord.y}
                  x2={endCoord.x}
                  y2={endCoord.y}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                  strokeDasharray={act.evaluation === '=' ? '1 1' : undefined}
                />
                {/* End Point Circle */}
                <circle cx={endCoord.x} cy={endCoord.y} r={isSelected ? 2 : 1.2} fill={strokeColor} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Punto (#)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Continuidad (+)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span>Error (=)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
          <span>Seleccionado</span>
        </div>
      </div>
    </div>
  );
};
