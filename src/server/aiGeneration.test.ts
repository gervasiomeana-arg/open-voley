import assert from "node:assert/strict";
import { generateAiText } from "./aiGeneration";
let calls = 0,
  options: any,
  params: any;
const client = (o: any) => {
  options = o;
  return {
    models: {
      async generateContent(p: any) {
        calls++;
        params = p;
        return { text: "  Análisis de los datos registrados.  " };
      },
    },
  };
};
await assert.rejects(
  () => generateAiText("consulta", false, {}, client),
  /AI_NOT_CONFIGURED/,
);
assert.equal(calls, 0);
const env = { GEMINI_API_KEY: "test-only-private-key" };
assert.equal(
  await generateAiText("Contexto real", false, env, client),
  "Análisis de los datos registrados.",
);
assert.equal(params.model, "gemini-3.8-flash");
assert.equal(params.contents, "Contexto real");
assert.ok(options.httpOptions.timeout <= 45000 && options.httpOptions.timeout > 44000);
assert.equal(options.httpOptions.retryOptions.attempts, 1);
assert.equal(params.config.maxOutputTokens, 4096);
await generateAiText(
  "JSON",
  true,
  { ...env, GEMINI_MODEL: "gemini-custom" },
  client,
);
assert.equal(params.model, "gemini-custom");
assert.equal(params.config.responseMimeType, "application/json");
await assert.rejects(
  () =>
    generateAiText(
      "context",
      false,
      { ...env, GEMINI_MODEL: "https://invalid.test" },
      client,
    ),
  /AI_MODEL_INVALID/,
);
await assert.rejects(
  () =>
    generateAiText("context", false, env, () => ({
      models: {
        async generateContent() {
          return { text: " " };
        },
      },
    })),
  /AI_EMPTY_RESPONSE/,
);
await assert.rejects(
  () =>
    generateAiText("context", false, env, () => ({
      models: {
        async generateContent() {
          throw new Error("provider unavailable");
        },
      },
    })),
  /provider unavailable/,
);
console.log(
  "AI request configuration, bounded timeout/retries, model override and real error propagation passed (mock provider; no live API request).",
);

// A short overload may recover. Keep the same model/context and one total deadline.
let fakeNow=0, attempts=0, waits:number[]=[], timeouts:number[]=[];
const timing={now:()=>fakeNow,delay:async(ms:number)=>{waits.push(ms);fakeNow+=ms;}};
const overloaded=Object.assign(new Error('private provider details'),{status:503});
assert.equal(await generateAiText('same context',false,env,(o:any)=>{timeouts.push(o.httpOptions.timeout);return {models:{async generateContent(p:any){attempts++;assert.equal(p.model,'gemini-3.8-flash');assert.equal(p.contents,'same context');if(attempts===1){fakeNow+=20000;throw overloaded;}return {text:'Recovered'};}}};},timing),'Recovered');
assert.equal(attempts,2);assert.deepEqual(waits,[1000]);assert.deepEqual(timeouts,[45000,24000]);
// Continuous overload stops at two; auth, quota and malformed requests are never retried.
for(const status of [503,401,403,400,404,429,500]){
 attempts=0;fakeNow=0;waits=[];
 await assert.rejects(()=>generateAiText('context',false,env,()=>({models:{async generateContent(){attempts++;throw Object.assign(new Error('provider failed'),{status});}}}),timing));
 assert.equal(attempts,status===503?2:1);assert.equal(waits.length,status===503?1:0);
}
// No second attempt when the first already consumed the available wait budget.
attempts=0;fakeNow=0;waits=[];
await assert.rejects(()=>generateAiText('context',false,env,()=>({models:{async generateContent(){attempts++;fakeNow+=44000;throw overloaded;}}}),timing));
assert.equal(attempts,1);assert.equal(waits.length,0);
// Scheduler delay can also exhaust the deadline; do not start another provider call.
attempts=0;fakeNow=0;
await assert.rejects(()=>generateAiText('context',false,env,()=>({models:{async generateContent(){attempts++;throw overloaded;}}}),{now:()=>fakeNow,delay:async()=>{fakeNow=46000;}}),/AI_TIMEOUT/);
assert.equal(attempts,1);
console.log('503 recovery passed: one retry, same model/context, remaining-time budget, no retry storms or auth/quota retries.');
