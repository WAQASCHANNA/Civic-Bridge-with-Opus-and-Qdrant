import { qdrantClient, ensureCollection } from '@/lib/qdrant-client';
import { embedText } from '@/lib/gemini';

const COLLECTION = 'city_services';

export async function initCityServices() {
  const client = qdrantClient();
  const dim = (await embedText('dimension probe')).length;
  await ensureCollection(COLLECTION, dim);

  const services = [
    {
      id: 1,
      vector: await embedText('broken streetlight, pothole, road damage'),
      payload: {
        department: 'Public Works',
        service_code: 'PW_001',
        sla_hours: 72,
        languages: ['en', 'ar', 'hi', 'ur'],
      },
    },
    {
      id: 2,
      vector: await embedText('garbage pickup missed, overflowing trash bin'),
      payload: {
        department: 'Sanitation',
        service_code: 'SAN_002',
        sla_hours: 48,
        languages: ['en', 'es'],
      },
    },
    {
      id: 3,
      vector: await embedText('water leak, broken pipe, low water pressure'),
      payload: {
        department: 'Water Services',
        service_code: 'WAT_003',
        sla_hours: 24,
        languages: ['en'],
      },
    },
  ];

  await client.upsert(COLLECTION, { points: services, wait: true });
}

export async function findService(query: string, limit = 3) {
  const client = qdrantClient();
  const vector = await embedText(query);
  const results = await client.search(COLLECTION, { vector, limit });
  return results?.[0]?.payload ?? null;
}