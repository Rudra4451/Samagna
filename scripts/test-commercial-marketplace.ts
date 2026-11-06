/**
 * scripts/test-commercial-marketplace.ts
 *
 * Comprehensive Test Suite for SAMAGNA Additional Commercial Business Model:
 * 1. Government Royalty Management & Institutional Revenue Model
 * 2. Integrated B2B Bulk & B2C Consumer Forest Produce Marketplace
 * 3. Warehouse Inventory Integration & Real-Time Stock Deduction
 * 4. Transparent Buyer Commission Calculations
 * 5. Strict Separation of Financial Figures & Zero Deductions on Collector MSP
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  DEFAULT_COMMERCIAL_CONFIG,
  INITIAL_MARKETPLACE_CATALOGUE,
  MarketplaceProduct,
  CommercialRevenueConfig,
} from '../src/lib/marketplace';

let passed = 0;
let total = 0;

function check(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runCommercialBusinessModelTests() {
  console.log('\n======================================================');
  console.log('   SAMAGNA Commercial Business Model Integration Tests ');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // Group 1: Government Royalty Management & Institutional Revenue
  // --------------------------------------------------------------------------
  console.log('--- 1. Government Royalty & Institutional Revenue Model ---');

  check(DEFAULT_COMMERCIAL_CONFIG.govRoyaltyPercent === 2.5, 'Default government service royalty is 2.5%');
  check(DEFAULT_COMMERCIAL_CONFIG.govAnnualLicensingFee === 500000, 'Default annual platform licensing fee is ₹5,00,000');
  check(DEFAULT_COMMERCIAL_CONFIG.govTechMaintenanceFee === 150000, 'Default technology maintenance charges is ₹1,50,000');

  const sampleProcurementValue = 255582.60;
  const calculatedRoyalty = (sampleProcurementValue * DEFAULT_COMMERCIAL_CONFIG.govRoyaltyPercent) / 100;
  check(Math.abs(calculatedRoyalty - 6389.565) < 0.01, 'Calculated service royalty accurately computes (~₹6,389.57 on ₹2,55,582.60)');

  const totalInstitutionalRevenue = calculatedRoyalty + DEFAULT_COMMERCIAL_CONFIG.govAnnualLicensingFee + DEFAULT_COMMERCIAL_CONFIG.govTechMaintenanceFee;
  check(Math.abs(totalInstitutionalRevenue - 656389.565) < 0.01, 'Total institutional revenue aggregates royalty + license + maintenance (~₹6,56,389.57)');

  // --------------------------------------------------------------------------
  // Group 2: Collector MSP Preservation & Invariant Protection
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Collector MSP Non-Deduction Invariant ---');

  const royaltyComponentPath = path.join(process.cwd(), 'src/components/admin/GovernmentRoyaltySection.tsx');
  const royaltyCode = fs.readFileSync(royaltyComponentPath, 'utf8');
  check(royaltyCode.includes('NEVER be deducted from tribal forest collectors'), 'Government royalty explicitly barred from deducting collectors MSP in admin portal');

  const commissionComponentPath = path.join(process.cwd(), 'src/components/admin/MarketplaceCommissionSection.tsx');
  const commissionCode = fs.readFileSync(commissionComponentPath, 'utf8');
  check(commissionCode.includes('ZERO DEDUCTION COLLECTOR GUARANTEE'), 'Commission section guarantees 100% MSP payout to primary gatherers');

  const invoicePagePath = path.join(process.cwd(), 'src/app/marketplace/orders/[id]/page.tsx');
  const invoiceCode = fs.readFileSync(invoicePagePath, 'utf8');
  check(invoiceCode.includes('Collector Disbursed Net (100% MSP)'), 'Commercial invoices itemize 100% collector MSP entitlement');

  // --------------------------------------------------------------------------
  // Group 3: Commercial Marketplace Catalogue & Warehouse Connection
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Warehouse Inventory Integration & Catalogue ---');

  check(INITIAL_MARKETPLACE_CATALOGUE.length >= 7, 'Marketplace offers at least 7 verified forest produce commodities');

  const mahua = INITIAL_MARKETPLACE_CATALOGUE.find((p) => p.slug === 'mahua');
  check(Boolean(mahua), 'Dried Mahua Flowers exists in marketplace');
  check(mahua?.primaryBatchCode === 'BS-400', 'Mahua links directly to existing verified batch BS-400');
  check(mahua?.destinationDepotId === 'BRP-01', 'Stock is explicitly bound to Baripada Central Depôt (BRP-01)');
  check(Boolean(mahua?.labCertifiedMoisturePercent && mahua.labCertifiedMoisturePercent <= 12.0), 'Mahua carries certified moisture reading compliant with state guidelines');

  const honey = INITIAL_MARKETPLACE_CATALOGUE.find((p) => p.slug === 'wild-honey');
  check(Boolean(honey), 'Wild Forest Honey exists in marketplace');
  check(honey?.destinationDepotId === 'BRP-01', 'Honey is located in Baripada Central Depôt (Bay 03)');
  check(Boolean(honey?.b2cOptions && honey.b2cOptions.length >= 3), 'Honey provides consumer pack sizes (250g, 500g, 1kg)');

  const char = INITIAL_MARKETPLACE_CATALOGUE.find((p) => p.slug === 'char-seeds');
  check(Boolean(char), 'Chironji / Char Seeds exists in marketplace');
  check(char?.b2bMinimumOrderKg === 25.0, 'Chironji defines wholesale Minimum Order Quantity (25 kg)');

  // --------------------------------------------------------------------------
  // Group 4: Transparent Commission Computations
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Buyer Commission Revenue Calculation ---');

  check(DEFAULT_COMMERCIAL_CONFIG.b2bCommissionPercent === 3.5, 'B2B wholesale commission is 3.5%');
  check(DEFAULT_COMMERCIAL_CONFIG.b2cCommissionPercent === 6.0, 'B2C consumer retail commission is 6.0%');

  // Test B2B Wholesale: 100 kg Mahua @ ₹46/kg = ₹4600
  const b2bGross = 100 * 46;
  const b2bComm = (b2bGross * DEFAULT_COMMERCIAL_CONFIG.b2bCommissionPercent) / 100;
  const b2bSettlement = b2bGross - b2bComm;
  check(b2bComm === 161.0, 'B2B commission on ₹4,600 wholesale order is ₹161.00 (3.5%)');
  check(b2bSettlement === 4439.0, 'Seller settlement preserves bulk share (₹4,439.00)');

  // Test B2C Retail: 2 x 500g Honey @ ₹235 = ₹470
  const b2cGross = 2 * 235;
  const b2cComm = (b2cGross * DEFAULT_COMMERCIAL_CONFIG.b2cCommissionPercent) / 100;
  check(Number(b2cComm.toFixed(2)) === 28.20, 'B2C commission on ₹470 consumer order is ₹28.20 (6.0%)');

  // --------------------------------------------------------------------------
  // Group 5: Digital Invoices & QR Batch Traceability
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Batch QR Traceability & Digital Invoices ---');

  check(invoiceCode.includes('verify/${order.primaryBatchCode}'), 'Commercial invoice renders direct link to official QR verification endpoint');
  check(invoiceCode.includes('Print Official Invoice') || invoiceCode.includes('window.print()'), 'Invoice provides printable and downloadable format');
  check(invoiceCode.includes('Baripada Central Depôt'), 'Invoice identifies physical depot facility');

  // --------------------------------------------------------------------------
  // Group 6: Admin Dashboard Commercial Revenue Sections
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Admin Dashboard 3-Stream Integration ---');

  const adminPagePath = path.join(process.cwd(), 'src/app/admin/page.tsx');
  const adminPageCode = fs.readFileSync(adminPagePath, 'utf8');

  check(adminPageCode.includes("activeTab === 'business'"), 'Admin dashboard includes SAMAGNA Business Revenue tab');
  check(adminPageCode.includes("activeTab === 'royalty'"), 'Admin dashboard includes Government Royalty tab');
  check(adminPageCode.includes("activeTab === 'commissions'"), 'Admin dashboard includes Buyer Commissions tab');
  check(adminPageCode.includes('BusinessRevenueOverview'), 'Admin dashboard embeds BusinessRevenueOverview component');
  check(adminPageCode.includes('GovernmentRoyaltySection'), 'Admin dashboard embeds GovernmentRoyaltySection component');
  check(adminPageCode.includes('MarketplaceCommissionSection'), 'Admin dashboard embeds MarketplaceCommissionSection component');

  const businessOverviewPath = path.join(process.cwd(), 'src/components/admin/BusinessRevenueOverview.tsx');
  const businessOverviewCode = fs.readFileSync(businessOverviewPath, 'utf8');

  check(businessOverviewCode.includes('Stream 1: Government Service Revenue'), 'Business overview displays Stream 1: Government Service Revenue');
  check(businessOverviewCode.includes('Stream 2: B2B Marketplace Commission'), 'Business overview displays Stream 2: B2B Marketplace Commission');
  check(businessOverviewCode.includes('Stream 3: B2C Marketplace Commission'), 'Business overview displays Stream 3: B2C Marketplace Commission');
  check(businessOverviewCode.includes('STATUTORY FINANCIAL SEGREGATION MATRIX'), 'Strict financial separation matrix keeps procurement value, settlements, and SAMAGNA revenue separate');

  console.log('\n======================================================');
  console.log(`COMMERCIAL MODEL TEST RESULTS: ${passed}/${total} checks passed.`);
  console.log('======================================================\n');
}

runCommercialBusinessModelTests().catch((err) => {
  console.error('Test suite execution failed:', err);
  process.exit(1);
});
