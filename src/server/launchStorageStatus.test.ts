import assert from 'node:assert/strict';
const previous = { ...process.env }, originalFetch = globalThis.fetch;
process.env.OPENVOLEY_PERSISTENCE = 'supabase';
process.env.SUPABASE_URL = 'https://local-test.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'sb_secret_mock';
const { getLaunchStorageStatus } = await import('./launchStorageStatus');
try {
  let calls = 0;
  globalThis.fetch = (async (url: any) => {
    calls++;
    assert.match(String(url), /\/rest\/v1\/rpc\/ov_storage_ready$/);
    return new Response(JSON.stringify({ schemaVersion: 1, durable: true, backups: true }));
  }) as typeof fetch;
  const verified = await getLaunchStorageStatus();
  assert.equal(calls, 1);
  assert.equal(verified.verified, true);
  assert.equal(verified.durable, true);
  globalThis.fetch = (async () => new Response(JSON.stringify({ schemaVersion: 2, durable: true, backups: true }))) as typeof fetch;
  assert.equal((await getLaunchStorageStatus()).healthy, false, 'Unknown schema cannot be marked ready');
  globalThis.fetch = (async () => { throw new Error('private provider response'); }) as typeof fetch;
  const failed = await getLaunchStorageStatus();
  assert.equal(failed.healthy, false);
  assert.equal(failed.durable, false);
  assert.equal(JSON.stringify(failed).includes('private provider response'), false);
  console.log('Storage readiness passed: actual probe, schema validation and fail-closed provider errors.');
} finally {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
  Object.assign(process.env, previous);
}
