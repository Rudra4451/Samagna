import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isEnabled = process.env.MAITRIYAM_ENABLED !== 'false';
  const isVoiceEnabled = process.env.MAITRIYAM_VOICE_ENABLED === 'true';

  return NextResponse.json({
    enabled: isEnabled,
    voiceAllowed: isVoiceEnabled,
    provider: 'disabled',
    knowledgeBaseVersion: '1.0',
    supportedLocales: ['en', 'or'],
    referenceBudgetMs: 300,
    pilotStatusUrl: '/about',
  });
}
