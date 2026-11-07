import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== 'SUPERVISOR_ADMIN') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Supervisor Admin authentication required to view interaction history.' },
      { status: 403 }
    );
  }

  // Sample aggregated metrics for demo/offline resilience
  const metrics = {
    totalInteractions: 142,
    answeredRatePercent: 96.4,
    degradedRatePercent: 3.6,
    avgLatencyMs: 4.8,
    activeProvider: 'disabled (deterministic L0/L1)',
    logRetentionDays: 30,
    unansweredQuestionsCount: 5,
  };

  const sampleRecentLogs = [
    {
      id: 'log-001',
      timestamp: 'Today · 11:20 AM',
      role: 'COLLECTOR',
      surface: 'collector',
      questionMasked: 'How is my payout calculated for Dried Mahua?',
      answered: true,
      layer: 'L1',
      citation: 'TRIFED Operational Guidelines Sec 4.2',
    },
    {
      id: 'log-002',
      timestamp: 'Today · 10:45 AM',
      role: 'COLLECTION_MANAGER',
      surface: 'collection',
      questionMasked: 'Explain gross vs tare weight on digital scale',
      answered: true,
      layer: 'L0',
      citation: 'Legal Metrology Field Protocol (Odisha)',
    },
    {
      id: 'log-003',
      timestamp: 'Today · 09:15 AM',
      role: 'PUBLIC',
      surface: 'public',
      questionMasked: 'How to verify produce origin with QR code on sack #BS-400?',
      answered: true,
      layer: 'L1',
      citation: 'Verified Lot #BS-400',
    },
  ];

  return NextResponse.json({
    metrics,
    interactions: sampleRecentLogs,
  });
}
