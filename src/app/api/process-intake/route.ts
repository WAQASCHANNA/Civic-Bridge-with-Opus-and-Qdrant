import { NextRequest, NextResponse } from 'next/server';
import { processIntake, translateForResident } from '@/lib/gemini';
import { createCivicWorkflow, executeWorkflow, waitForJobCompletion } from '@/lib/opus-client';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ logs: ['Service ready'] });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let type: 'voice' | 'image' | 'document' = 'document';
    let data: string = '';
    let language: string = 'en';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const rawType = (formData.get('type') as string) ?? 'file';
      const file = formData.get('file') as File | null;
      const note = (formData.get('note') as string) ?? '';
      const lang = (formData.get('language') as string) ?? 'en';
      language = lang;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        data = `data:${file.type};base64,` + buf.toString('base64');
        type = rawType === 'audio' ? 'voice' : rawType === 'image' ? 'image' : 'document';
      } else {
        type = 'document';
        data = note || `${rawType} intake received`;
      }
    } else {
      const body = await req.json();
      type = body?.type ?? 'document';
      data = body?.data ?? '';
      language = body?.language ?? 'en';
    }

    // 1. Process with Gemini
    const extraction = await processIntake({ type, data, language });

    // 2. Execute Opus workflow (use existing workflow or create)
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
      workflow_input: { type, data, language },
      extract_issue_text: extraction,
      timestamp: new Date().toISOString(),
    });

    // 3. Wait for completion & get audit
    const audit = await waitForJobCompletion(jobId);

    // 4. Return success message
    const message = await translateForResident(
      `Request submitted to ${
        (audit as any)?.department?.department || 'city services'
      }. Reference: ${jobId}`,
      language
    );

    return NextResponse.json({ success: true, jobId, audit, message });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}