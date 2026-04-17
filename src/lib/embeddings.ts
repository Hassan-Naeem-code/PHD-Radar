import OpenAI from "openai";

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIMS = 1536;

let _openai: OpenAI | null = null;
function client(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export function isEmbeddingsConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export { EMBED_MODEL, EMBED_DIMS };

export async function embedText(text: string): Promise<number[]> {
  if (!isEmbeddingsConfigured()) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  const truncated = text.slice(0, 30_000);
  const res = await client().embeddings.create({
    model: EMBED_MODEL,
    input: truncated,
  });
  return res.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!isEmbeddingsConfigured()) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  if (texts.length === 0) return [];
  const truncated = texts.map((t) => t.slice(0, 30_000));
  const res = await client().embeddings.create({
    model: EMBED_MODEL,
    input: truncated,
  });
  return res.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// Back-compat with existing callers.
export async function generateEmbedding(text: string): Promise<number[]> {
  return embedText(text);
}
