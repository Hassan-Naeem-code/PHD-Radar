import { EMBED_DIMS } from "./embeddings";

const INDEX = process.env.PINECONE_INDEX || "phdradar";
const CONTROL_API = "https://api.pinecone.io";

export function isPineconeConfigured(): boolean {
  return Boolean(process.env.PINECONE_API_KEY);
}

function key(): string {
  const k = process.env.PINECONE_API_KEY;
  if (!k) throw new Error("PINECONE_API_KEY not configured");
  return k;
}

let cachedHost: { host: string; at: number } | null = null;
const HOST_TTL_MS = 60 * 60 * 1000;

async function getIndexHost(): Promise<string> {
  if (cachedHost && Date.now() - cachedHost.at < HOST_TTL_MS) {
    return cachedHost.host;
  }
  const res = await fetch(`${CONTROL_API}/indexes/${INDEX}`, {
    headers: { "Api-Key": key(), "X-Pinecone-API-Version": "2024-10" },
  });
  if (!res.ok) throw new Error(`Pinecone describe index failed: ${res.status}`);
  const data = (await res.json()) as { host: string };
  cachedHost = { host: data.host, at: Date.now() };
  return data.host;
}

async function ensureIndexExists(): Promise<void> {
  const listRes = await fetch(`${CONTROL_API}/indexes`, {
    headers: { "Api-Key": key(), "X-Pinecone-API-Version": "2024-10" },
  });
  if (!listRes.ok) return;
  const data = (await listRes.json()) as { indexes?: Array<{ name: string }> };
  if (data.indexes?.some((i) => i.name === INDEX)) return;

  await fetch(`${CONTROL_API}/indexes`, {
    method: "POST",
    headers: {
      "Api-Key": key(),
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2024-10",
    },
    body: JSON.stringify({
      name: INDEX,
      dimension: EMBED_DIMS,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    }),
  });
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean | string[]>;
}

export async function upsertVectors(
  namespace: string,
  vectors: PineconeVector[]
): Promise<void> {
  if (vectors.length === 0) return;
  await ensureIndexExists();
  const host = await getIndexHost();

  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    const res = await fetch(`https://${host}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": key(),
        "Content-Type": "application/json",
        "X-Pinecone-API-Version": "2024-10",
      },
      body: JSON.stringify({ vectors: batch, namespace }),
    });
    if (!res.ok) {
      throw new Error(`Pinecone upsert failed: ${res.status} ${await res.text()}`);
    }
  }
}

export interface PineconeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export async function queryVectors(
  namespace: string,
  vector: number[],
  topK = 10,
  filter?: Record<string, unknown>
): Promise<PineconeMatch[]> {
  const host = await getIndexHost();
  const res = await fetch(`https://${host}/query`, {
    method: "POST",
    headers: {
      "Api-Key": key(),
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2024-10",
    },
    body: JSON.stringify({
      namespace,
      vector,
      topK,
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Pinecone query failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { matches?: PineconeMatch[] };
  return data.matches ?? [];
}

export async function deleteVectors(
  namespace: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const host = await getIndexHost();
  await fetch(`https://${host}/vectors/delete`, {
    method: "POST",
    headers: {
      "Api-Key": key(),
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2024-10",
    },
    body: JSON.stringify({ ids, namespace }),
  });
}
