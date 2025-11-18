import { NextRequest, NextResponse } from 'next/server';
import { findService, initCityServices } from '@/lib/services-index';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }
    // Ensure city services index is ready
    try {
      await initCityServices();
    } catch {}
    // Semantic search for city service
    const service = await findService(query);

    return NextResponse.json({
      department: service?.department || 'General Services',
      service_code: service?.service_code || 'GEN_001',
      match_score: (service as any)?.score || 0.75,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Service matching failed', fallback: true },
      { status: 500 }
    );
  }
}