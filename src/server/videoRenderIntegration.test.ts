import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import express from "express";
const ffmpeg = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
if (
  spawnSync(ffmpeg, ["-version"], { stdio: "ignore", timeout: 5000 }).status !==
  0
)
  throw new Error(
    "This integration check requires a real FFmpeg installation.",
  );
const cwd = process.cwd(),
  temp = fs.mkdtempSync(path.join(os.tmpdir(), "ov-video-integration-"));
process.chdir(temp);
process.env.OPENVOLEY_PERSISTENCE = "sqlite";
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SECRET_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.OPENVOLEY_DB_PATH = path.join(temp, "test.db");
process.env.SESSION_SECRET = "video-integration-only-secret-over-32-characters";
const { saveAccounts } = await import("./accountStore");
const { createSessionToken } = await import("./sessionSecurity");
const { videoRenderRouter } = await import("./videoRenderRouter");
const account = (id: string) => ({
  id,
  email: id + "@example.test",
  name: id,
  firstLoginDate: new Date().toISOString(),
  trialDurationDays: 7,
  customGrantedDays: 0,
});
await saveAccounts([account("user-a"), account("user-b")]);
const a = await createSessionToken({
    userId: "user-a",
    email: "user-a@example.test",
  }),
  b = await createSessionToken({
    userId: "user-b",
    email: "user-b@example.test",
  });
const app = express();
app.use(express.json());
app.use("/api/video-render", videoRenderRouter);
app.use((e: any, _q: any, r: any, _n: any) =>
  r.status(500).json({ error: "test failure" }),
);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address();
assert.ok(address && typeof address !== "string");
const root = `http://127.0.0.1:${address.port}/api/video-render`;
async function request(
  route: string,
  method = "GET",
  body?: unknown,
  token = a,
) {
  return fetch(root + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
try {
  assert.equal(
    (await request("/capabilities", "GET", undefined, "")).status,
    401,
  );
  const cap = await (await request("/capabilities")).json();
  assert.equal(cap.ffmpeg, true);
  assert.equal(cap.persistent, false);
  assert.equal(
    (
      await request("/render", "POST", {
        matchId: "m",
        clips: [{ startSec: 0, endSec: -1 }],
      })
    ).status,
    400,
  );
  const source = path.join(temp, "original.mp4");
  const generated = spawnSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc=size=640x360:rate=25",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=44100",
      "-t",
      "4",
      "-c:v",
      "libx264",
      "-threads",
      "1",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      source,
    ],
    { stdio: "ignore", timeout: 30000 },
  );
  assert.equal(generated.status, 0);
  const upload = await fetch(root + "/source/m", {
    method: "PUT",
    headers: { Authorization: `Bearer ${a}`, "Content-Type": "video/mp4" },
    body: fs.readFileSync(source),
  });
  assert.equal(upload.status, 200);
  const render = await request("/render", "POST", {
    matchId: "m",
    name: "real-test",
    clips: [
      { startSec: 0, endSec: 1 },
      { startSec: 2, endSec: 3 },
    ],
  });
  assert.equal(render.status, 202);
  const { jobId } = await render.json();
  assert.equal(
    (await request(`/render/${jobId}`, "GET", undefined, b)).status,
    404,
  );
  const replace = await fetch(root + "/source/m", {
    method: "PUT",
    headers: { Authorization: `Bearer ${a}`, "Content-Type": "video/mp4" },
    body: fs.readFileSync(source),
  });
  assert.equal(replace.status, 409);
  let job: any;
  for (let i = 0; i < 200; i++) {
    job = await (await request(`/render/${jobId}`)).json();
    if (job.status === "ready" || job.status === "failed") break;
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.equal(job.status, "ready", job.error);
  assert.equal(
    (await request(`/render/${jobId}/download`, "GET", undefined, b)).status,
    404,
  );
  const downloaded = await request(`/render/${jobId}/download`);
  assert.equal(downloaded.status, 200);
  assert.match(downloaded.headers.get("content-type") || "", /video\/mp4/);
  const output = path.join(temp, "download.mp4");
  fs.writeFileSync(output, Buffer.from(await downloaded.arrayBuffer()));
  const probe = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=codec_type",
      "-of",
      "json",
      output,
    ],
    { encoding: "utf8", timeout: 5000 },
  );
  assert.equal(probe.status, 0);
  const info = JSON.parse(probe.stdout);
  assert.ok(
    Number(info.format.duration) > 1.8 && Number(info.format.duration) < 2.5,
  );
  assert.ok(info.streams.some((s: any) => s.codec_type === "video"));
  assert.ok(info.streams.some((s: any) => s.codec_type === "audio"));
  console.log(
    "Real local MP4 integration passed: source upload, two cuts with audio, download, duration check, authentication, cross-account isolation and concurrent replacement blocked.",
  );
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  process.chdir(cwd);
  fs.rmSync(temp, { recursive: true, force: true });
}
