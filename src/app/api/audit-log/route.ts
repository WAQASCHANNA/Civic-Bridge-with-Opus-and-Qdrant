import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory store for demo (use database in production)
const auditStore = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const auditData = await req.json();
    const jobId = auditData.job_id as string;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
    }

    // Store audit trail
    auditStore.set(jobId, {
      ...auditData,
      timestamp: new Date().toISOString(),
      status: 'completed',
    });

    // Generate PDF report (optional enhancement)
    // await generatePDFAudit(auditData);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Audit trail logged',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}

// GET endpoint to retrieve audit
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }
  const audit = auditStore.get(jobId);

  if (!audit) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(audit);
}