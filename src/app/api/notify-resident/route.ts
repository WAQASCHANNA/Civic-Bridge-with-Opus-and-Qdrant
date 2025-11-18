import { NextRequest, NextResponse } from 'next/server';
import { translateForResident } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { resident_language, jobId, issue_type } = await req.json();

    if (!resident_language || !jobId) {
      return NextResponse.json(
        { error: 'Missing resident_language or jobId' },
        { status: 400 }
      );
    }
    const resolvedIssue = issue_type || 'request';

    // Generate message in resident's language
    const message = await translateForResident(
      `Your request about "${resolvedIssue}" has been submitted. Reference: ${jobId}. You will receive updates within 72 hours.`,
      resident_language
    );

    // TODO: Integrate WhatsApp/Twilio here
    console.log('📱 Notification sent:', { language: resident_language, message });

    return NextResponse.json({
      success: true,
      message: 'Notification queued',
      translated_message: message,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}