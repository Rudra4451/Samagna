import { NextResponse } from 'next/server';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

// Illustrative baseline records with explicit provenance metadata
// (Decoupled from hardcoded policy in compliance with F1 rules)
const ILLUSTRATIVE_RATE_REGISTRY = [
  {
    id: 'RATE-CFG-MAHUA-2024',
    produceName: 'Dried Mahua Flowers',
    produceOdia: 'ମହୁଲ',
    scientificName: 'Madhuca longifolia',
    ratePerKg: 42.0,
    allowableShrinkagePercent: 1.5,
    effectiveFrom: '2024-04-01T00:00:00.000Z',
    effectiveTo: '2025-03-31T23:59:59.000Z',
    sourceAuthority: 'TDCCOL LABHA Scheme Seasonal Procurement Guideline (Illustrative Test Baseline)',
    isOfficialVerified: false,
    provenanceNotes:
      'Rate ₹42.00/kg and 1.5% allowable natural shrinkage are illustrative test parameters for Mayurbhanj district field evaluation. Official government notifications must be verified before production settlement.',
  },
  {
    id: 'RATE-CFG-TAMARIND-2024',
    produceName: 'Seeded Tamarind',
    produceOdia: 'ତେନ୍ତୁଳି',
    scientificName: 'Tamarindus indica',
    ratePerKg: 36.0,
    allowableShrinkagePercent: 2.0,
    effectiveFrom: '2024-04-01T00:00:00.000Z',
    effectiveTo: '2025-03-31T23:59:59.000Z',
    sourceAuthority: 'TDCCOL LABHA Scheme Seasonal Procurement Guideline (Illustrative Test Baseline)',
    isOfficialVerified: false,
    provenanceNotes:
      'Rate ₹36.00/kg and 2.0% allowable transit loss are illustrative test data.',
  },
  {
    id: 'RATE-CFG-SAL-2024',
    produceName: 'Sal Seeds',
    produceOdia: 'ଶାଳ ମଞ୍ଜି',
    scientificName: 'Shorea robusta',
    ratePerKg: 28.0,
    allowableShrinkagePercent: 1.0,
    effectiveFrom: '2024-04-01T00:00:00.000Z',
    effectiveTo: '2025-03-31T23:59:59.000Z',
    sourceAuthority: 'TDCCOL LABHA Scheme Seasonal Procurement Guideline (Illustrative Test Baseline)',
    isOfficialVerified: false,
    provenanceNotes:
      'Rate ₹28.00/kg and 1.0% allowable transit loss are illustrative test data.',
  },
];

export async function GET() {
  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      const dbRates = await prisma.produceRateConfiguration.findMany({
        orderBy: { produceName: 'asc' },
      });

      if (dbRates.length > 0) {
        return NextResponse.json({
          source: 'DATABASE_POSTGRESQL',
          rates: dbRates,
          count: dbRates.length,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn('Database query for rates fell back to illustrative registry:', err?.message);
    }
  }

  return NextResponse.json({
    source: 'ILLUSTRATIVE_REGISTRY_FALLBACK',
    rates: ILLUSTRATIVE_RATE_REGISTRY,
    count: ILLUSTRATIVE_RATE_REGISTRY.length,
    disclaimer:
      'Rates and loss thresholds are stored with provenance. Not hardcoded government policy.',
    timestamp: new Date().toISOString(),
  });
}
