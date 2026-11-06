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
export const DEFAULT_AI_MODEL = "gemini-3.5-flash";
export const DEFAULT_AI_FALLBACK_MODEL = "gemini-3.6-flash";

function sanitizeModel(m: string | undefined, defaultVal: string): string {
  const trimmed = m?.trim();
  if (!trimmed) return defaultVal;
  // gemini-3.8-flash is experiencing severe infrastructure saturation (503/504) on Google's end.
  // Safely remap it to gemini-3.5-flash so calls succeed immediately without timing out.
  if (trimmed === "gemini-3.8-flash" || trimmed === "gemini-3.8") return defaultVal;
  return trimmed;
}

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
  const configuredModel = sanitizeModel(env.GEMINI_MODEL, DEFAULT_AI_MODEL);
  const fallbackModel = sanitizeModel(env.GEMINI_FALLBACK_MODEL, DEFAULT_AI_FALLBACK_MODEL);
  if (!/^gemini-[a-zA-Z0-9._-]{1,100}$/.test(configuredModel))
    throw new Error("AI_MODEL_INVALID");
  if (!/^gemini-[a-zA-Z0-9._-]{1,100}$/.test(fallbackModel))
    throw new Error("AI_MODEL_INVALID");

  const deadline = timing.now() + 45000;
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - timing.now();
    if (remaining <= 0) {
      const error = new Error("AI_TIMEOUT");
      error.name = "TimeoutError";
      throw error;
    }
    const model = attempt === 0
      ? configuredModel
      : (configuredModel === fallbackModel ? DEFAULT_AI_FALLBACK_MODEL : fallbackModel);

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
      // Temporary 503 (Unavailable) or 504 (Gateway Timeout) is retried with fallback model
      if (attempt === 0 && (status === 503 || status === 504) && deadline - timing.now() > 1500) {
        await timing.delay(1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("AI_UNAVAILABLE");
}
