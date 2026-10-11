import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
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
let activeUploads=0;
const uploading=new Set<string>();
const MAX_USER_BYTES=Math.max(500,Number(process.env.OPENVOLEY_VIDEO_QUOTA_MB)||2000)*1024*1024;
function directoryBytes(dir:string):number { return fs.existsSync(dir) ? fs.readdirSync(dir,{withFileTypes:true}).reduce((sum,item)=>sum+(item.isDirectory()?directoryBytes(path.join(dir,item.name)):fs.statSync(path.join(dir,item.name)).size),0) : 0; }
const MAX_SOURCE_BYTES = Math.min(1500, Math.max(50, Number(process.env.OPENVOLEY_MAX_VIDEO_MB) || 250)) * 1024 * 1024;

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
    const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: 10*60*1000, killSignal:'SIGKILL' });
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

router.put('/source/:matchId', async (req,res)=>{
 const userId=String(res.locals.sessionUserId);
 if(activeUploads>=2 || uploading.has(userId))return res.status(429).json({error:'Ya hay una carga en curso. Intentá más tarde.'});
 if(!/^(video\/|application\/octet-stream)/.test(String(req.headers['content-type']||'')))return res.status(415).json({error:'Se requiere un archivo de video.'});
 const used=directoryBytes(userDir(userId));
 const limit=Math.min(MAX_SOURCE_BYTES,MAX_USER_BYTES-used);
 if(limit<=0)return res.status(413).json({error:'Cuota de videos alcanzada.'});
 const target=sourcePath(userId,safePart(req.params.matchId,'match')),temp=target+'.'+randomUUID()+'.upload';
 let bytes=0;activeUploads+=1;uploading.add(userId);
 const timeout=setTimeout(()=>req.destroy(),120000);
 try {
  const guard=new Transform({transform(chunk,_encoding,callback){bytes+=chunk.length;callback(bytes>limit?new Error('Video exceeds size or quota limit'):null,chunk)}});
  await pipeline(req,guard,fs.createWriteStream(temp,{flags:'wx',mode:0o600}));
  if(!bytes)throw new Error('Empty video');fs.renameSync(temp,target);
  return res.json({success:true,matchId:req.params.matchId,bytes});
 } catch {try{fs.unlinkSync(temp)}catch{};if(!res.headersSent && !res.destroyed)return res.status(413).json({error:'No se pudo cargar el video: revisá el tamaño, la cuota y la conexión.'});}
 finally{clearTimeout(timeout);activeUploads-=1;uploading.delete(userId)}
});

router.post('/render', async (req, res) => {
  const userId = String(res.locals.sessionUserId);
  const running=[...jobs.values()].filter(j=>j.status==='queued'||j.status==='rendering');
  if(running.length>=2 || running.some(j=>j.userId===userId))return res.status(429).json({error:'Hay un montaje en proceso. Intentá más tarde.'});
  for(const [id,job] of jobs)if(!['queued','rendering'].includes(job.status) && Date.now()-Date.parse(job.updatedAt)>86400000){fs.rmSync(path.join(userDir(job.userId),id),{recursive:true,force:true});jobs.delete(id)}
  if(jobs.size>=500 || directoryBytes(userDir(userId))>=MAX_USER_BYTES)return res.status(429).json({error:'Cuota de montajes alcanzada.'});
  const matchId = safePart(req.body?.matchId, 'match');
  if (!ffmpegAvailable()) return res.status(503).json({ error: 'FFmpeg is not available on this server' });
  const normalized = normalizeVideoRenderClips(req.body?.clips);
  if (!normalized || normalized.reduce((sum,c)=>sum+c.endSec-c.startSec,0)>3600) return res.status(400).json({ error: 'Invalid clip list or timing' });
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
        if(directoryBytes(userDir(userId))>=MAX_USER_BYTES)throw new Error('Video quota reached');
        const clip = normalized[i];
        const part = path.join(jobDir, `clip-${String(i + 1).padStart(4, '0')}.mp4`);
        parts.push(part);
        await run(binary, ['-y', '-ss', String(clip.startSec), '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm,avi,mpegts,mpeg,ogg', '-i', source, '-t', String(clip.endSec - clip.startSec), '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', part]);
      }
      const list = path.join(jobDir, 'concat.txt');
      fs.writeFileSync(list, parts.map((part) => `file '${part.replace(/'/g, "'\\''")}'`).join('\n'), 'utf-8');
      await run(binary, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', output]);
      parts.forEach((part) => { try { fs.unlinkSync(part); } catch {} });
      try { fs.unlinkSync(list); } catch {}
      job.status = 'ready'; job.fileName = path.basename(output); job.updatedAt = new Date().toISOString();
    } catch (error) {
      try{fs.rmSync(jobDir,{recursive:true,force:true})}catch{}
      console.error('Video render failed:',error);
      job.status = 'failed'; job.error = 'No se pudo generar el montaje. Revisá el formato, los tiempos y la cuota.'; job.updatedAt = new Date().toISOString();
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
