import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
const html = fs.readFileSync('dist/index.html', 'utf8');
assert.equal((html.match(/<h1[ >]/g) || []).length, 1, 'One public H1 in initial HTML');
assert.match(html, /Leé el partido\./);
assert.match(html, /Decidí mejor\./);
assert.ok((html.match(/<h2[ >]/g) || []).length >= 4, 'Public sections in initial HTML');
assert.match(html, /<link rel="canonical" href="https:\/\/open-voley-2026\.ai\.studio\/"/);
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
assert.equal(schema['@type'], 'WebApplication');
assert.equal(schema.url, 'https://open-voley-2026.ai.studio/');
assert.match(html, /name="consent"/);
assert.match(html, /<input(?=[^>]*name="email")(?=[^>]*type="email")[^>]*>/);
assert.match(html, /href="#como-funciona"/);
assert.match(html, /aria-label="Reproducir demostración"/);
assert.doesNotMatch(html, /<script[^>]+src="https:\/\/accounts.google.com\/gsi\/client"/, 'Google SDK loads only when sign-in is opened');
const manifest = JSON.parse(fs.readFileSync('dist/.vite/manifest.json', 'utf8'));
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports || []) visit(dependency);
}
visit('index.html');
assert.ok(!initial.has('src/App.tsx'), 'Private application must not be in the public static import graph');
assert.ok(manifest['src/App.tsx']?.isDynamicEntry, 'Private application remains available after verified login');
const initialJs = [...initial].map(key => manifest[key].file).filter(file => file.endsWith('.js'));
const compressedBytes = initialJs.reduce((sum, file) => sum + gzipSync(fs.readFileSync(path.join('dist', file))).length, 0);
assert.ok(compressedBytes < 150_000, `Initial JavaScript budget exceeded: ${compressedBytes} gzip bytes`);
console.log(`Public initial JavaScript: ${compressedBytes} gzip bytes; private application deferred.`);
for (const match of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)) {
  assert.ok(fs.existsSync(path.join('dist', match[1])), `Missing public asset: ${match[1]}`);
}
const css = fs.readdirSync('dist/assets').filter(n => n.endsWith('.css')).map(n => fs.readFileSync(`dist/assets/${n}`, 'utf8')).join('');
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /barlow-condensed-bold\.woff/);
assert.match(fs.readFileSync('dist/robots.txt', 'utf8'), /Sitemap: https:\/\/open-voley-2026\.ai\.studio\/sitemap\.xml/);
assert.match(fs.readFileSync('dist/sitemap.xml', 'utf8'), /<loc>https:\/\/open-voley-2026\.ai\.studio\/<\/loc>/);
console.log('Landing checks passed: initial HTML, headings, structured data, navigation, consent, assets and index files.');
