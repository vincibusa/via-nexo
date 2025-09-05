import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
export const EMBEDDINGS_MODEL =
  process.env.EMBEDDINGS_MODEL || "text-embedding-3-small";
export const MAX_TOKENS = parseInt(process.env.MAX_TOKENS_RESPONSE || "500");
export const TEMPERATURE = parseFloat(process.env.TEMPERATURE || "0.7");

export const config = {
  model: DEFAULT_MODEL,
  embeddings: EMBEDDINGS_MODEL,
  maxTokens: MAX_TOKENS,
  temperature: TEMPERATURE,
};

export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDINGS_MODEL,
      input: text,
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

export async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: {
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
  }
) {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: options?.maxTokens || MAX_TOKENS,
      temperature: options?.temperature || TEMPERATURE,
      stream: options?.stream || false,
    });

    return response;
  } catch (error) {
    console.error("Error creating chat completion:", error);
    throw new Error("Failed to create chat completion");
  }
}
