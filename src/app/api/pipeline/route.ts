import { NextRequest, NextResponse } from 'next/server';
import { processIntake, translateForResident } from '@/lib/gemini';
import { findService, initCityServices } from '@/lib/services-index';
import { createCivicWorkflow, executeWorkflow } from '@/lib/opus-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { type, data, language = 'en' } = await req.json();
    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
    }
    if (!['voice', 'image', 'document'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // 1. Extract understanding (multimodal)
    const extraction = await processIntake({ type, data, language });

    // 2. Ensure and query city services via Qdrant
    try {
      await initCityServices();
    } catch {}
    const service = await findService(extraction?.issue_type ?? '');
    const deptName = service?.department ?? 'General Services';

    // 3. Execute Opus workflow
    let workflowId: string | undefined = process.env.OPUS_WORKFLOW_ID;
    if (!workflowId) {
      try {
        workflowId = await createCivicWorkflow();
      } catch {}
    }
    if (!workflowId) {
      throw new Error('Opus workflow unavailable');
    }
    const jobId = await executeWorkflow(workflowId, {
      intake: { type, language },
      extraction,
      service,
    });

    // 4. Generate audit
    const confidence = typeof extraction?.confidence === 'number' ? extraction.confidence : 0.7;
    const audit = {
      timestamp: new Date().toISOString(),
      job_id: jobId,
      extracted: extraction,
      department: service,
      confidence,
    };

    const translation = await translateForResident(
      `Your request has been sent to ${deptName}. Reference: ${jobId}`,
      language
    );

    return NextResponse.json({ success: true, audit, translation });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}