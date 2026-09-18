export interface VideoRenderClip {
  startSec: number;
  endSec: number;
}

export function normalizeVideoRenderClips(value: unknown): VideoRenderClip[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 500) return null;
  const clips = value.map((clip) => {
    const item = clip as { startSec?: unknown; endSec?: unknown };
    return {
      startSec: Math.max(0, Number(item?.startSec)),
      endSec: Math.max(0, Number(item?.endSec)),
    };
  });
  if (clips.some((clip) =>
    !Number.isFinite(clip.startSec) ||
    !Number.isFinite(clip.endSec) ||
    clip.endSec <= clip.startSec ||
    clip.endSec - clip.startSec > 120
  )) return null;
  return clips;
}

export function estimateVideoRenderDuration(clips: VideoRenderClip[]): number {
  return clips.reduce((sum, clip) => sum + (clip.endSec - clip.startSec), 0);
}
