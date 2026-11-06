import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const isDev = process.env.NODE_ENV === 'development';
const bundlePath = path.join(process.cwd(), 'server-build', 'server.cjs');

if (!isDev && fs.existsSync(bundlePath)) {
  await import(bundlePath);
} else {
  await import('./src/server/serverCore.ts');
}
