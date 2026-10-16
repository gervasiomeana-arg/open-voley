import React, { useMemo } from "react";
import { Activity, X } from "lucide-react";
import type { ScoutCodeAction } from "../types";
interface ComputerVisionOverlayProps {
  isPlaying?: boolean;
  currentTime?: number;
  isAutoScoutActive: boolean;
  actions?: ScoutCodeAction[];
  onToggleAutoScout: () => void;
}
// Registered scouting tags are evidence. This overlay does not run OCR, identify athletes,
// measure speed/reach, or generate new actions from video frames.
export const ComputerVisionOverlay: React.FC<ComputerVisionOverlayProps> = ({
  currentTime = 0,
  isAutoScoutActive,
  actions = [],
  onToggleAutoScout,
}) => {
  const currentAction = useMemo(
    () =>
      actions
        .filter(
          (a) =>
            Number.isFinite(a.timestamp) &&
            Math.abs(a.timestamp - currentTime) <= 2,
        )
        .sort(
          (a, b) =>
            Math.abs(a.timestamp - currentTime) -
            Math.abs(b.timestamp - currentTime),
        )[0] || null,
    [actions, currentTime],
  );
  if (!isAutoScoutActive) return null;
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
        <div className="rounded-xl border border-slate-600 bg-slate-950/95 p-3 text-xs text-slate-200">
          <strong className="flex items-center gap-2">
            <Activity size={15} />
            Acciones registradas
          </strong>
          <p className="mt-1">
            Etiquetas de scouting · sin detección automática
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleAutoScout}
          aria-label="Ocultar acciones registradas"
          className="pointer-events-auto rounded-xl border border-slate-600 bg-slate-950/95 p-2 text-white"
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="absolute bottom-3 left-3 right-3 rounded-xl border border-slate-600 bg-slate-950/95 p-3 text-xs text-slate-100"
        aria-live="polite"
      >
        {currentAction ? (
          <>
            <strong>
              {currentAction.team === "home" ? "Local" : "Rival"} · #
              {currentAction.playerNum}
              {currentAction.playerName ? ` · ${currentAction.playerName}` : ""}
            </strong>
            <p className="mt-1">
              {currentAction.description ||
                `${currentAction.skill} ${currentAction.evaluation}`}
            </p>
            <p className="mt-1 font-mono text-amber-300">
              {currentAction.rawCode} · {currentAction.timestamp.toFixed(1)} s
            </p>
          </>
        ) : (
          <p>Sin acción registrada en este instante.</p>
        )}
      </div>
    </div>
  );
};
