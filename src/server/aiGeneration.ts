import {
  GoogleGenAI,
  type GenerateContentParameters,
  type GoogleGenAIOptions,
} from "@google/genai";
interface AiClient {
  models: {
    generateContent(
      params: GenerateContentParameters,
    ): Promise<{ text?: string }>;
  };
}
interface AiRuntime {
  now: () => number;
  delay: (ms: number) => Promise<void>;
}
const runtime: AiRuntime = {
  now: () => performance.now(),
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};
export async function generateAiText(
  contents: string,
  json = false,
  env: NodeJS.ProcessEnv = process.env,
  createClient: (options: GoogleGenAIOptions) => AiClient = (options) =>
    new GoogleGenAI(options),
  timing: AiRuntime = runtime,
) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  const model = env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  if (!/^gemini-[a-zA-Z0-9._-]{1,100}$/.test(model))
    throw new Error("AI_MODEL_INVALID");
  const deadline = timing.now() + 45000;
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - timing.now();
    if (remaining <= 0) {
      const error = new Error("AI_TIMEOUT");
      error.name = "TimeoutError";
      throw error;
    }
    const client = createClient({
      apiKey,
      // The SDK itself must not multiply our two bounded attempts.
      httpOptions: { timeout: Math.max(1, Math.floor(remaining)), retryOptions: { attempts: 1 } },
    });
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          maxOutputTokens: 4096,
          ...(json ? { responseMimeType: "application/json", temperature: 0.2 } : {}),
        },
      });
      const text = response.text?.trim();
      if (!text) throw new Error("AI_EMPTY_RESPONSE");
      return text;
    } catch (error) {
      const status = Number((error as { status?: unknown } | null)?.status);
      // Only a temporary 503 is retried, once, within the original 45-second budget.
      if (attempt === 0 && status === 503 && deadline - timing.now() > 1500) {
        await timing.delay(1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("AI_UNAVAILABLE");
}
