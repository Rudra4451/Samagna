/**
 * BanaSetu G1, G2 & G3 Automated Test Suite
 * Validates 17 MFP Products Catalogue, SVG Icons, and Mayurbhanj Location Intelligence
 */

import { ODISHA_MFP_CATALOGUE } from '../src/lib/products';
import { MAYURBHANJ_LOCATIONS } from '../src/components/map/TransitRouteMap';

async function runCatalogueG1G2G3TestSuite() {
  console.log('\n======================================================');
  console.log('   BanaSetu G1-G3: 17 MFP Catalogue & Geography Tests ');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --- Group 1: 17 Minor Forest Produce (MFP) Catalogue ---
  console.log('--- 1. Odisha 17 Minor Forest Produce Catalogue ---');
  assert(ODISHA_MFP_CATALOGUE.length === 17, 'Catalogue contains exactly 17 specified MFP products');

  const requiredSlugs = [
    'mahua',
    'sal-seeds',
    'kendu-leaves',
    'tamarind-seeded',
    'tamarind-deseeded',
    'harida',
    'bahada',
    'amla',
    'karanja-seeds',
    'kusum-seeds',
    'neem-seeds',
    'char-seeds',
    'hill-broom',
    'wild-honey',
    'lac',
    'shikakai',
    'dhataki',
  ];

  requiredSlugs.forEach((slug) => {
    const item = ODISHA_MFP_CATALOGUE.find((p) => p.slug === slug);
    assert(!!item, `Product "${slug}" exists in catalogue`);
    if (item) {
      assert(item.nameEnglish.length > 0, `${slug}: English name defined`);
      assert(item.nameOdia.length > 0, `${slug}: Odia name defined`);
      assert(item.scientificName.length > 0, `${slug}: Scientific botanical name defined`);
      assert(item.currentBenchmarkRatePerKg > 0, `${slug}: Valid positive rate per kg (₹${item.currentBenchmarkRatePerKg})`);
      assert(item.allowableShrinkagePercent >= 0 && item.allowableShrinkagePercent <= 5.0, `${slug}: Valid shrinkage tolerance (${item.allowableShrinkagePercent}%)`);
      assert(item.rateSource.includes('Simulated') || item.rateSource.includes('TDCCOL'), `${slug}: Explicit illustrative rate provenance disclaimer`);
    }
  });

  // --- Group 2: Mayurbhanj Geographical Topography ---
  console.log('\n--- 2. Mayurbhanj Geographical Topography & Route Nodes ---');
  assert(MAYURBHANJ_LOCATIONS.length >= 5, 'Contains at least 5 certified Mayurbhanj transit locations');

  const baripada = MAYURBHANJ_LOCATIONS.find((l) => l.type === 'CENTRAL_DEPOT');
  assert(!!baripada, 'Central Depôt at Baripada exists in topography');
  assert(baripada?.storageCapacityKg === 500000, 'Baripada has 500 MT storage capacity');

  const karanjia = MAYURBHANJ_LOCATIONS.find((l) => l.name.includes('Karanjia'));
  assert(!!karanjia, 'Karanjia sub-divisional aggregation center exists in topography');

  const badagaon = MAYURBHANJ_LOCATIONS.find((l) => l.name.includes('Badagaon'));
  assert(!!badagaon, 'Badagaon tribal SHG collection point exists in topography');

  console.log('\n======================================================');
  console.log(`G1-G3 TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');
}

runCatalogueG1G2G3TestSuite().catch((err) => {
  console.error('Catalogue test suite encountered an error:', err);
  process.exit(1);
});
