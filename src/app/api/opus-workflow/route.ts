import { NextRequest } from 'next/server';
import { runOpus } from '@/lib/opus-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const result = await runOpus(body);
    return Response.json({ result });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Opus workflow not configured' }),
      { status: 501 }
    );
  }
}