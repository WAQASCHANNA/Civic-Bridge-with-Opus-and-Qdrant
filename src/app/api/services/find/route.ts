import { NextRequest } from 'next/server';
import { findService, initCityServices } from '@/lib/services-index';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = (body?.query as string) ?? '';
  if (!query) return new Response('Missing query', { status: 400 });
  try {
    // Ensure the index is initialized at least once
    await initCityServices();
  } catch {}
  const result = await findService(query, 3);
  return Response.json({ result });
}