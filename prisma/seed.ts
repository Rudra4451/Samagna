/**
 * prisma/seed.ts
 *
 * Repeatable, Non-Destructive Pilot Demo Seed Process for BanaSetu
 * Uses upsert operations to ensure existing real records are never silently overwritten.
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ODISHA_MFP_CATALOGUE } from '../src/lib/products';
import { MAYURBHANJ_LOCATIONS } from '../src/components/map/TransitRouteMap';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting BanaSetu Pilot Demo Seed Process ---');

  // 1. Seed Authorized Multi-Role Users
  console.log('Seeding authorized demo officers with bcrypt password hashes...');
  const defaultPasswordHash = await bcrypt.hash('BanaSetu@Mayurbhanj2026', 10);

  const demoUsers = [
    {
      username: 'rami.majhi',
      fullName: 'Rami Majhi',
      fullNameOdia: 'ରାମୀ ମାଝି',
      role: UserRole.COLLECTOR,
      village: 'Badagaon',
      block: 'Karanjia',
    },
    {
      username: 'sumitra.soren',
      fullName: 'Sumitra Soren',
      fullNameOdia: 'ସୁମିତ୍ରା ସୋରେନ',
      role: UserRole.SHG_FACILITATOR,
      village: 'Badagaon',
      block: 'Karanjia',
    },
    {
      username: 'bikram.marndi',
      fullName: 'Bikram Marndi',
      fullNameOdia: 'ବିକ୍ରମ ମାର୍ଣ୍ଡି',
      role: UserRole.COLLECTION_MANAGER,
      centerId: 'LOC-KRN-01',
      block: 'Karanjia',
    },
    {
      username: 'debasis.das',
      fullName: 'Debasis Das',
      fullNameOdia: 'ଦେବାଶିଷ ଦାସ',
      role: UserRole.WAREHOUSE_MANAGER,
      centerId: 'LOC-BRP-01',
      block: 'Baripada',
    },
    {
      username: 'patnaik.supervisor',
      fullName: 'A. K. Patnaik',
      fullNameOdia: 'ଏ. କେ. ପଟ୍ଟନାୟକ',
      role: UserRole.SUPERVISOR_ADMIN,
      block: 'Baripada',
    },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        fullName: u.fullName,
        fullNameOdia: u.fullNameOdia,
        role: u.role,
        passwordHash: defaultPasswordHash,
        district: 'Mayurbhanj',
        block: u.block,
        village: u.village,
        centerId: u.centerId,
        isActive: true,
      },
    });
  }
  console.log(`  [OK] Seeded ${demoUsers.length} staff users.`);

  // 2. Seed 17 Minor Forest Produce Species Catalogue
  console.log('Seeding 17 Odisha Minor Forest Produce Species...');
  for (const prod of ODISHA_MFP_CATALOGUE) {
    await prisma.productCatalogue.upsert({
      where: { slug: prod.slug },
      update: {
        currentBenchmarkRatePerKg: prod.currentBenchmarkRatePerKg,
        allowableShrinkagePercent: prod.allowableShrinkagePercent,
      },
      create: {
        id: `PROD-${prod.slug.toUpperCase()}`,
        slug: prod.slug,
        nameEnglish: prod.nameEnglish,
        nameOdia: prod.nameOdia,
        scientificName: prod.scientificName,
        botanicalFamily: prod.botanicalFamily,
        primaryHarvestSeason: prod.primaryHarvestSeason,
        standardPackaging: prod.standardPackaging,
        typicalTareKgPerBag: prod.typicalTareKgPerBag,
        allowableShrinkagePercent: prod.allowableShrinkagePercent,
        currentBenchmarkRatePerKg: prod.currentBenchmarkRatePerKg,
        rateSource: 'TDCCOL LABHA Benchmark Notification (Illustrative Baseline)',
        isOfficialMsp: false,
        description: prod.description,
        iconSvgKey: prod.slug,
      },
    });

    // Also populate ProduceRateConfiguration
    await prisma.produceRateConfiguration.upsert({
      where: { produceName: prod.nameEnglish },
      update: {
        ratePerKg: prod.currentBenchmarkRatePerKg,
        allowableShrinkagePercent: prod.allowableShrinkagePercent,
      },
      create: {
        produceName: prod.nameEnglish,
        produceOdia: prod.nameOdia,
        scientificName: prod.scientificName,
        ratePerKg: prod.currentBenchmarkRatePerKg,
        allowableShrinkagePercent: prod.allowableShrinkagePercent,
        sourceAuthority: 'TDCCOL LABHA Benchmark Notification (Illustrative Baseline)',
        isOfficialVerified: false,
        provenanceNotes: `Illustrative test rate ₹${prod.currentBenchmarkRatePerKg}/kg with ${prod.allowableShrinkagePercent}% allowable transit loss for pilot evaluation.`,
      },
    });
  }
  console.log(`  [OK] Seeded ${ODISHA_MFP_CATALOGUE.length} botanical products.`);

  // 3. Seed Mayurbhanj Aggregation Locations
  console.log('Seeding Mayurbhanj Geographical Aggregation Centers...');
  for (const loc of MAYURBHANJ_LOCATIONS) {
    const canonicalCode =
      loc.id === 'LOC-BRP-01'
        ? 'BRP-01'
        : loc.id.startsWith('LOC-')
          ? loc.id.slice(4)
          : loc.id;

    await prisma.aggregationLocation.upsert({
      where: { code: canonicalCode },
      update: {
        id: loc.id,
        name: loc.name,
        nameOdia: loc.nameOdia,
        locationType: loc.type,
      },
      create: {
        id: loc.id,
        code: canonicalCode,
        name: loc.name,
        nameOdia: loc.nameOdia,
        district: 'Mayurbhanj',
        block: loc.block,
        gramPanchayat: loc.block,
        locationType: loc.type,
        latitude: loc.lat,
        longitude: loc.lng,
        storageCapacityKg: loc.storageCapacityKg,
        managerName: loc.manager,
        isActive: true,
      },
    });
  }
  console.log(`  [OK] Seeded ${MAYURBHANJ_LOCATIONS.length} geographical locations.`);

  // 4. Seed Pilot Demonstration Batch #BS-402
  console.log('Seeding Pilot Demonstration Batch #BS-402 (Dried Mahua Flowers)...');
  const mahuaConfig = await prisma.produceRateConfiguration.findFirst({
    where: { produceName: 'Dried Mahua Flowers' },
  });

  await prisma.batch.upsert({
    where: { id: '#BS-402' },
    update: {
      destinationDepotId: 'BRP-01',
    },
    create: {
      id: '#BS-402',
      produceConfigId: mahuaConfig?.id ?? null,
      produceName: 'Dried Mahua Flowers',
      produceOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      scientificName: 'Madhuca longifolia',
      district: 'Mayurbhanj',
      block: 'Karanjia',
      gramPanchayat: 'Badagaon',
      centerName: 'Karanjia Sub-Divisional Depot',
      destinationDepotId: 'BRP-01',
      shgName: 'Maa Tarini Tribal SHG',
      facilitatorName: 'Sumitra Soren',
      referenceRatePerKg: 42.0,
      rateSource: 'TDCCOL LABHA Notification (Illustrative Baseline)',
      ratePublishedDate: '2024-04-01',
      seasonalReadinessStatus: 'Active Spring Harvest',
      pickupRequestId: 'REQ-KRN-2024-0402',
      status: 'VERIFIED_SALEABLE',
      version: 2,
      collectors: {
        create: [
          {
            id: 'COL-CONTR-01',
            tribalId: 'OR-MAY-***-1109',
            name: 'Rami Majhi',
            nameOdia: 'ରାମୀ ମାଝି',
            gender: 'F',
            age: 38,
            village: 'Badagaon',
            villageOdia: 'ବଡ଼ଗାଁ',
            weightKg: 45.0,
            ratePerKg: 42.0,
            grossPayout: 1890.0,
            bankName: 'Odisha Gramya Bank',
            accountEnding: '4412',
            dbtRef: 'TXN-STAGED-40201',
            paymentStatus: 'READY_FOR_DISBURSEMENT',
            isSimulated: true,
            collectedDate: '2024-04-12',
            signedByFacilitator: 'Sumitra Soren',
          },
          {
            id: 'COL-CONTR-02',
            tribalId: 'OR-MAY-***-1188',
            name: 'Salge Soren',
            nameOdia: 'ସାଲଗେ ସୋରେନ',
            gender: 'F',
            age: 42,
            village: 'Badagaon',
            villageOdia: 'ବଡ଼ଗାଁ',
            weightKg: 55.0,
            ratePerKg: 42.0,
            grossPayout: 2310.0,
            bankName: 'State Bank of India',
            accountEnding: '8819',
            dbtRef: 'TXN-STAGED-40202',
            paymentStatus: 'READY_FOR_DISBURSEMENT',
            isSimulated: true,
            collectedDate: '2024-04-12',
            signedByFacilitator: 'Sumitra Soren',
          },
        ],
      },
      step1: {
        create: {
          grossWeightKg: 104.2,
          tareWeightKg: 4.2,
          netAcceptedKg: 100.0,
          grade: 'A',
          sackCount: 2,
          sealTagId: 'SEAL-MAY-8840',
          vehicleNumber: 'OD-11-K-4921',
          driverName: 'Kanhu Charan Murmu',
          tarpaulinConfirmed: true,
          transitWaybillId: 'WAYBILL-2024-KRN-402',
          observedMoisturePercent: 9.5,
          initialDestinationDepotId: 'BRP-01',
          verifiedBy: 'Bikram Marndi',
          verifiedByRole: 'COLLECTION_MANAGER',
          notes: 'Standard dry grade A flowers. Tarpaulin tied.',
        },
      },
      step2: {
        create: {
          arrivalGrossWeightKg: 102.7,
          arrivalTareWeightKg: 4.2,
          arrivalNetWeightKg: 98.5,
          storageZone: 'Rack B (Dry Stack)',
          receivingDepotId: 'BRP-01',
          shrinkagePercentAllowed: 1.5,
          shrinkageKgAllowed: 1.5,
          unexplainedVarianceKg: 0.0,
          discrepancyTriggered: false,
          verifiedBy: 'Debasis Das',
          verifiedByRole: 'WAREHOUSE_MANAGER',
          notes: 'Arrival weight 98.5 kg within 1.5% natural transit evaporation tolerance.',
        },
      },
    },
  });
  console.log('  [OK] Seeded Pilot Demonstration Batch #BS-402.');

  console.log('--- BanaSetu Pilot Demo Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
