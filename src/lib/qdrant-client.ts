import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '@/lib/config';

export function qdrantClient() {
  return new QdrantClient({ url: config.qdrantUrl, apiKey: config.qdrantApiKey });
}

export async function ensureCollection(name: string, vectorSize: number) {
  const client = qdrantClient();
  try {
    await client.getCollection(name);
  } catch {
    await client.createCollection(name, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    } as any);
  }
}