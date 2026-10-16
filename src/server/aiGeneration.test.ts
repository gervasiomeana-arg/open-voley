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
assert.equal(options.httpOptions.timeout, 45000);
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
