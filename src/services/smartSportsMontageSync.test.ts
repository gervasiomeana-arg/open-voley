import assert from 'node:assert/strict';
import { SmartSportsMontage } from '../types';
import { SMART_SPORTS_MONTAGES_KEY } from './smartSportsMontageStorage';
import { syncSmartSportsMontages } from './smartSportsMontageSync';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key:string) { return this.data.get(key) ?? null; }
  key(index:number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key:string) { this.data.delete(key); }
  setItem(key:string, value:string) { this.data.set(key, value); }
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });

function montage(id:string, name:string, updatedAt='2026-09-18T20:00:00.000Z'): SmartSportsMontage {
  return {
    id, name, matchId:'m1', matchTitle:'A vs B',
    createdAt:'2026-09-18T19:00:00.000Z', updatedAt,
    preRoll:3, postRoll:3, actionIds:['a1'],
  };
}

localStorage.setItem(SMART_SPORTS_MONTAGES_KEY, JSON.stringify([montage('local-1','Local')]));
const writes: SmartSportsMontage[] = [];
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async (input, init) => {
  const url = String(input);
  if (url === '/api/smart-sports-montages' && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify({ montages: [] }), { status:200, headers:{'Content-Type':'application/json'} });
  }
  if (url.includes('/api/smart-sports-montages/') && init?.method === 'PUT') {
    writes.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ success:true }), { status:200, headers:{'Content-Type':'application/json'} });
  }
  throw new Error('Unexpected request: ' + url);
}) as typeof fetch;

const mergedLocal = await syncSmartSportsMontages();
assert.equal(mergedLocal[0].id, 'local-1');
assert.equal(writes[0].id, 'local-1');

localStorage.setItem(SMART_SPORTS_MONTAGES_KEY, JSON.stringify([]));
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async (input, init) => {
  const url = String(input);
  if (url === '/api/smart-sports-montages' && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify({ montages:[montage('remote-1','Remote')] }), { status:200, headers:{'Content-Type':'application/json'} });
  }
  throw new Error('Unexpected request: ' + url);
}) as typeof fetch;

const mergedRemote = await syncSmartSportsMontages();
assert.equal(mergedRemote[0].id, 'remote-1');

localStorage.setItem(SMART_SPORTS_MONTAGES_KEY, JSON.stringify([
  montage('same','Local newer','2026-09-18T22:00:00.000Z'),
]));
(globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = (async (input, init) => {
  const url = String(input);
  if (url === '/api/smart-sports-montages' && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify({ montages:[montage('same','Remote older','2026-09-18T21:00:00.000Z')] }), { status:200, headers:{'Content-Type':'application/json'} });
  }
  if (url.includes('/api/smart-sports-montages/') && init?.method === 'PUT') {
    return new Response(JSON.stringify({ success:true }), { status:200, headers:{'Content-Type':'application/json'} });
  }
  throw new Error('Unexpected request: ' + url);
}) as typeof fetch;
const conflict = await syncSmartSportsMontages();
assert.equal(conflict[0].name, 'Local newer');

console.log('Smart sports montage sync tests passed');
