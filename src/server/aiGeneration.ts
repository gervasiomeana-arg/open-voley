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
export async function generateAiText(
  contents: string,
  json = false,
  env: NodeJS.ProcessEnv = process.env,
  createClient: (options: GoogleGenAIOptions) => AiClient = (options) =>
    new GoogleGenAI(options),
) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  const model = env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  if (!/^gemini-[a-zA-Z0-9._-]{1,100}$/.test(model))
    throw new Error("AI_MODEL_INVALID");
  const client = createClient({
    apiKey,
    httpOptions: { timeout: 45000, retryOptions: { attempts: 1 } },
  });
  const response = await client.models.generateContent({
    model,
    contents,
    config: {
      maxOutputTokens: 4096,
      ...(json
        ? { responseMimeType: "application/json", temperature: 0.2 }
        : {}),
    },
  });
  const text = response.text?.trim();
  if (!text) throw new Error("AI_EMPTY_RESPONSE");
  return text;
}
