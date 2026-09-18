import express, { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { getSessionFromRequest } from './sessionSecurity';
import { normalizeVideoRenderClips } from './videoRenderPlan';

type RenderStatus = 'queued' | 'rendering' | 'ready' | 'failed';
interface RenderJob {
  id: string;
  userId: string;
  matchId: string;
  status: RenderStatus;
  createdAt: string;
  updatedAt: string;
  fileName?: string;
  error?: string;
}

const router = Router();
const jobs = new Map<string, RenderJob>();
const ROOT = path.join(process.cwd(), '.openvoley-video-renders');
const MAX_SOURCE_BYTES = Math.max(50, Number(process.env.OPENVOLEY_MAX_VIDEO_MB) || 1500) * 1024 * 1024;

function safePart(value: unknown, fallback = 'video') {
  const cleaned = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 120);
  return cleaned || fallback;
}
function userDir(userId: string) {
  const dir = path.join(ROOT, safePart(userId, 'user'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function sourcePath(userId: string, matchId: string) {
  return path.join(userDir(userId), `source-${safePart(matchId, 'match')}.video`);
}
function ffmpegAvailable() {
  const binary = process.env.FFMPEG_PATH?.trim() || 'ffmpeg';
  const check = spawnSync(binary, ['-version'], { stdio: 'ignore' });
  return check.status === 0;
}
function run(binary: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk.toString()).slice(-8000); });
    child.once('error', reject);
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error(stderr || `ffmpeg exited ${code}`)));
  });
}

router.use((req, res, next) => {
  const session = getSessionFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Authentication required' });
  res.locals.sessionUserId = session.userId;
  return next();
});

router.get('/capabilities', (_req, res) => {
  res.json({ ffmpeg: ffmpegAvailable(), maxSourceMb: Math.floor(MAX_SOURCE_BYTES / 1024 / 1024) });
});

router.put(
  '/source/:matchId',
  express.raw({ type: ['video/*', 'application/octet-stream'], limit: MAX_SOURCE_BYTES }),
  (req, res) => {
    const userId = String(res.locals.sessionUserId);
    const matchId = safePart(req.params.matchId, 'match');
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: 'Video source required' });
    const target = sourcePath(userId, matchId);
    fs.writeFileSync(target, req.body);
    return res.json({ success: true, matchId, bytes: req.body.length });
  },
);

router.post('/render', async (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const matchId = safePart(req.body?.matchId, 'match');
  if (!ffmpegAvailable()) return res.status(503).json({ error: 'FFmpeg is not available on this server' });
  const normalized = normalizeVideoRenderClips(req.body?.clips);
  if (!normalized) return res.status(400).json({ error: 'Invalid clip list or timing' });
  const source = sourcePath(userId, matchId);
  if (!fs.existsSync(source)) return res.status(409).json({ error: 'Upload the local match video before rendering' });

  const id = `render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const jobDir = path.join(userDir(userId), id);
  fs.mkdirSync(jobDir, { recursive: true });
  const safeName = safePart(req.body?.name, 'montaje');
  const output = path.join(jobDir, `open-voley-${safeName}.mp4`);
  const job: RenderJob = { id, userId, matchId, status: 'queued', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  jobs.set(id, job);
  res.status(202).json({ jobId: id, status: job.status });

  void (async () => {
    const binary = process.env.FFMPEG_PATH?.trim() || 'ffmpeg';
    try {
      job.status = 'rendering'; job.updatedAt = new Date().toISOString();
      const parts: string[] = [];
      for (let i = 0; i < normalized.length; i += 1) {
        const clip = normalized[i];
        const part = path.join(jobDir, `clip-${String(i + 1).padStart(4, '0')}.mp4`);
        parts.push(part);
        await run(binary, ['-y', '-ss', String(clip.startSec), '-i', source, '-t', String(clip.endSec - clip.startSec), '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', part]);
      }
      const list = path.join(jobDir, 'concat.txt');
      fs.writeFileSync(list, parts.map((part) => `file '${part.replace(/'/g, "'\\''")}'`).join('\n'), 'utf-8');
      await run(binary, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', output]);
      parts.forEach((part) => { try { fs.unlinkSync(part); } catch {} });
      try { fs.unlinkSync(list); } catch {}
      job.status = 'ready'; job.fileName = path.basename(output); job.updatedAt = new Date().toISOString();
    } catch (error) {
      job.status = 'failed'; job.error = error instanceof Error ? error.message.slice(-1200) : 'Render failed'; job.updatedAt = new Date().toISOString();
    }
  })();
});

router.get('/render/:jobId', (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const job = jobs.get(String(req.params.jobId));
  if (!job || job.userId !== userId) return res.status(404).json({ error: 'Render not found' });
  res.json({ jobId: job.id, status: job.status, error: job.error, downloadUrl: job.status === 'ready' ? `/api/video-render/render/${job.id}/download` : undefined });
});

router.get('/render/:jobId/download', (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const job = jobs.get(String(req.params.jobId));
  if (!job || job.userId !== userId || job.status !== 'ready' || !job.fileName) return res.status(404).json({ error: 'Rendered video not found' });
  const file = path.join(userDir(userId), job.id, job.fileName);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Rendered video file not found' });
  return res.download(file, job.fileName);
});

export const videoRenderRouter = router;
