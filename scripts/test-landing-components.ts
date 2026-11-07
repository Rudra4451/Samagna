import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('======================================================');
console.log('   Samagna Landing Components Unit & Architecture QA  ');
console.log('======================================================\n');

const LANDING_DIR = path.join(process.cwd(), 'src', 'components', 'landing');

console.log('--- 1. File Presence & Modular Component Structure ---');
const REQUIRED_COMPONENTS = [
  'LandingHero.tsx',
  'LandingHeader.tsx',
  'CurvedDivider.tsx',
  'PathwaysSection.tsx',
  'ValueChainSection.tsx',
  'ProduceCatalogueSection.tsx',
  'TraceabilitySection.tsx',
  'GovernanceSection.tsx',
  'LandingFooter.tsx',
];

for (const comp of REQUIRED_COMPONENTS) {
  const filePath = path.join(LANDING_DIR, comp);
  assert(fs.existsSync(filePath), `Component exists: ${comp}`);
}

console.log('\n--- 2. Server vs. Client Component Separation ---');
const SERVER_COMPONENTS = [
  'CurvedDivider.tsx',
  'PathwaysSection.tsx',
  'ValueChainSection.tsx',
  'GovernanceSection.tsx',
  'LandingFooter.tsx',
];

for (const comp of SERVER_COMPONENTS) {
  const content = fs.readFileSync(path.join(LANDING_DIR, comp), 'utf-8');
  assert(!content.startsWith("'use client'"), `Server Component (zero client bundle): ${comp}`);
}

const CLIENT_COMPONENTS = [
  'LandingHero.tsx',
  'LandingHeader.tsx',
  'ProduceCatalogueSection.tsx',
  'TraceabilitySection.tsx',
];

for (const comp of CLIENT_COMPONENTS) {
  const content = fs.readFileSync(path.join(LANDING_DIR, comp), 'utf-8');
  assert(content.startsWith("'use client'"), `Client Component (interactive): ${comp}`);
}

console.log('\n--- 3. Accessibility & Semantic ARIA Invariants ---');
const headerContent = fs.readFileSync(path.join(LANDING_DIR, 'LandingHeader.tsx'), 'utf-8');
assert(headerContent.includes('role="dialog"'), 'LandingHeader implements accessible modal dialog');
assert(headerContent.includes('aria-modal="true"'), 'LandingHeader sets aria-modal="true"');
assert(headerContent.includes('aria-expanded='), 'LandingHeader mobile menu toggle sets aria-expanded');
assert(headerContent.includes('handleKeyDown'), 'LandingHeader implements Escape key and focus trap handler');

const catalogueContent = fs.readFileSync(path.join(LANDING_DIR, 'ProduceCatalogueSection.tsx'), 'utf-8');
assert(catalogueContent.includes('role="tablist"'), 'ProduceCatalogueSection implements role="tablist"');
assert(catalogueContent.includes('role="tab"'), 'ProduceCatalogueSection implements role="tab" on category filters');
assert(catalogueContent.includes('aria-selected='), 'ProduceCatalogueSection sets dynamic aria-selected');

console.log('\n--- 4. Odia Typography & Language Tagging ---');
for (const comp of REQUIRED_COMPONENTS) {
  const content = fs.readFileSync(path.join(LANDING_DIR, comp), 'utf-8');
  const odiaChars = /[\u0B00-\u0B7F]/;
  if (odiaChars.test(content)) {
    assert(content.includes('lang="or"'), `${comp}: Odia text has explicit lang="or" attribute`);
  }
}

console.log('\n--- 5. Non-Accusatory Shrinkage Vocabulary Invariant ---');
const FORBIDDEN_WORDS = [/theft/i, /fraud/i, /cheat/i, /steal/i];
for (const comp of REQUIRED_COMPONENTS) {
  const content = fs.readFileSync(path.join(LANDING_DIR, comp), 'utf-8');
  let hasForbidden = false;
  for (const regex of FORBIDDEN_WORDS) {
    if (regex.test(content)) {
      hasForbidden = true;
      assert(false, `${comp} contains forbidden word matching ${regex}`);
    }
  }
  if (!hasForbidden) {
    assert(true, `${comp} complies with non-punitive vocabulary invariant`);
  }
}

console.log('\n--- 6. Public Landing Page Assembly Verification ---');
const pageContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'page.tsx'), 'utf-8');
for (const comp of REQUIRED_COMPONENTS) {
  const name = comp.replace('.tsx', '');
  assert(pageContent.includes(name), `src/app/page.tsx imports and renders <${name} />`);
}

console.log('\n--- 7. Error and 404 Pages Verification ---');
const notFoundPath = path.join(process.cwd(), 'src', 'app', 'not-found.tsx');
const errorPath = path.join(process.cwd(), 'src', 'app', 'error.tsx');
assert(fs.existsSync(notFoundPath), 'src/app/not-found.tsx exists');
assert(fs.existsSync(errorPath), 'src/app/error.tsx exists');

const notFoundContent = fs.readFileSync(notFoundPath, 'utf-8');
assert(notFoundContent.includes('lang="or"'), 'not-found.tsx supports Odia localization');
assert(notFoundContent.includes('Return to Home'), 'not-found.tsx provides clear home return path');

const errorContent = fs.readFileSync(errorPath, 'utf-8');
assert(errorContent.includes("'use client'"), 'error.tsx is a client error boundary');
assert(errorContent.includes('reset()') || errorContent.includes('reset: () => void'), 'error.tsx provides reset recovery action');

console.log('\n======================================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed.`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
