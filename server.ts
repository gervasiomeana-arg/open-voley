import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';
const bundlePath = path.join(process.cwd(), 'server-build', 'server.cjs');

if (isProduction && fs.existsSync(bundlePath)) {
  await import(bundlePath);
} else {
  await import('./src/server/serverCore.ts');
}
