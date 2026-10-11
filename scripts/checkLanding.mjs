import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
for (const match of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)) {
  assert.ok(fs.existsSync(path.join('dist', match[1])), `Missing public asset: ${match[1]}`);
}
const css = fs.readdirSync('dist/assets').filter(n => n.endsWith('.css')).map(n => fs.readFileSync(`dist/assets/${n}`, 'utf8')).join('');
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /barlow-condensed-bold\.woff/);
assert.match(fs.readFileSync('dist/robots.txt', 'utf8'), /Sitemap: https:\/\/open-voley-2026\.ai\.studio\/sitemap\.xml/);
assert.match(fs.readFileSync('dist/sitemap.xml', 'utf8'), /<loc>https:\/\/open-voley-2026\.ai\.studio\/<\/loc>/);
console.log('Landing checks passed: initial HTML, headings, structured data, navigation, consent, assets and index files.');
