import * as fs from 'fs';
import * as path from 'path';

console.log('====================================================');
console.log('   BanaSetu Inclusive Design & A11y Verification   ');
console.log('====================================================\n');

let hasFailure = false;

// ---------------------------------------------------------
// 1. WCAG 2.1 Contrast Ratio Verification (14px text pairs)
// ---------------------------------------------------------
console.log('--- 1. Token Contrast Verification (WCAG 2.1 AA >= 4.5:1) ---');

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((x) => x + x).join('');
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function getContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface TokenPair {
  name: string;
  fg: string;
  bg: string;
  minRatio: number;
}

const tokenPairs: TokenPair[] = [
  { name: 'ink on bg', fg: '#1F1A14', bg: '#FAF6EE', minRatio: 4.5 },
  { name: 'ink on surface', fg: '#1F1A14', bg: '#FFFFFF', minRatio: 4.5 },
  { name: 'ink-muted on bg', fg: '#5E5245', bg: '#FAF6EE', minRatio: 4.5 },
  { name: 'ink-muted on surface', fg: '#5E5245', bg: '#FFFFFF', minRatio: 4.5 },
  { name: 'sidebar-ink on sidebar-bg', fg: '#E9E3D3', bg: '#1F2A22', minRatio: 4.5 },
  { name: 'warning on warning-tint', fg: '#854C0E', bg: '#EDE5D8', minRatio: 4.5 },
  { name: 'warning on bg', fg: '#854C0E', bg: '#FAF6EE', minRatio: 4.5 },
  { name: 'success on success-tint', fg: '#2E5C2D', bg: '#E6ECE2', minRatio: 4.5 },
  { name: 'success on bg', fg: '#2E5C2D', bg: '#FAF6EE', minRatio: 4.5 },
  { name: 'danger on bg', fg: '#8E2F26', bg: '#FAF6EE', minRatio: 4.5 },
  { name: 'danger on surface', fg: '#8E2F26', bg: '#FFFFFF', minRatio: 4.5 },
  { name: 'accent on bg', fg: '#B24E2E', bg: '#FAF6EE', minRatio: 4.5 },
  { name: 'accent on surface', fg: '#B24E2E', bg: '#FFFFFF', minRatio: 4.5 },
];

for (const pair of tokenPairs) {
  const ratio = getContrastRatio(pair.fg, pair.bg);
  const passed = ratio >= pair.minRatio;
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`  [${status}] ${pair.name.padEnd(28)}: ${ratio.toFixed(2)}:1 (required >= ${pair.minRatio}:1)`);
  if (!passed) {
    console.error(`    ERROR: Token contrast failure for ${pair.name}!`);
    hasFailure = true;
  }
}

// ---------------------------------------------------------
// 2. Table Headers Scope Verification
// ---------------------------------------------------------
console.log('\n--- 2. Table Header Scope Verification ---');

const srcDir = path.resolve(process.cwd(), 'src');

function getTsxFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getTsxFiles(fullPath));
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const tsxFiles = getTsxFiles(srcDir);
let thFailures = 0;

for (const file of tsxFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check raw <th elements (Table.tsx TableHead provides default scope='col')
    if (/<th(\s|>)/.test(line) && !file.endsWith('Table.tsx')) {
      if (!line.includes('scope="') && !line.includes("scope='")) {
        console.error(`  [FAIL] Missing scope attribute on <th> in ${path.relative(process.cwd(), file)}:${index + 1}`);
        console.error(`         Line: ${line.trim()}`);
        thFailures++;
        hasFailure = true;
      }
    }
  });
}

if (thFailures === 0) {
  console.log('  [PASS] All <th> elements have explicit scope="col" or scope="row".');
}

// ---------------------------------------------------------
// 3. Form Inputs Real <label> Verification
// ---------------------------------------------------------
console.log('\n--- 3. Form Input <label> Verification ---');

let inputFailures = 0;

for (const file of tsxFiles) {
  // Input.tsx defines reusable base components with labels
  if (file.endsWith('Input.tsx')) continue;

  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check raw input, select, textarea
    const hasRawInput = line.match(/<(input|select|textarea)(\s|>)/);
    if (hasRawInput) {
      const lineNum = index + 1;
      const contextStart = Math.max(0, index - 8);
      const contextEnd = Math.min(lines.length, index + 8);
      const surrounding = lines.slice(contextStart, contextEnd).join('\n');

      // Check if wrapped in <label> or has a corresponding <label htmlFor="...">
      const isInsideLabel = surrounding.includes('<label') && surrounding.includes('</label>');
      const idMatch = line.match(/id=["']([^"']+)["']/);
      const hasMatchingLabel = idMatch && surrounding.includes(`htmlFor="${idMatch[1]}"`);

      if (!isInsideLabel && !hasMatchingLabel) {
        console.error(`  [FAIL] Missing real <label> for input in ${path.relative(process.cwd(), file)}:${lineNum}`);
        console.error(`         Line: ${line.trim()}`);
        inputFailures++;
        hasFailure = true;
      }
    }
  });
}

if (inputFailures === 0) {
  console.log('  [PASS] Every form input, select, and textarea is paired with a real <label> element.');
}

// ---------------------------------------------------------
// 4. Flesch-Kincaid Readability Verification (Collector Copy)
// ---------------------------------------------------------
console.log('\n--- 4. Flesch-Kincaid Grade Level Verification (<= Grade 9) ---');

const enJsonPath = path.resolve(process.cwd(), 'src/i18n/en.json');
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));

function countSyllables(word: string): number {
  let clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;
  clean = clean.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  clean = clean.replace(/^y/, '');
  const matches = clean.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function computeFleschKincaid(text: string): number {
  const clean = text.replace(/\{[^}]+\}/g, 'friend').trim();
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const numSentences = Math.max(1, sentences.length);
  const words = clean.match(/[a-zA-Z0-9]+/g) || [];
  const numWords = words.length;
  if (numWords === 0) return 0;
  // Isolated 1-2 word UI tokens (e.g. 'Prices', 'Total', 'Close') are not reading passages
  if (numWords < 3) return 1.0;
  let totalSyllables = 0;
  for (const w of words) totalSyllables += countSyllables(w);
  const grade = 0.39 * (numWords / numSentences) + 11.8 * (totalSyllables / numWords) - 15.59;
  return Math.max(0, grade);
}

const collectorPrefixes = ['collector.', 'sheet.', 'receipt.', 'complaint.', 'tab.'];
let fkFailures = 0;

for (const [key, value] of Object.entries(enJson)) {
  if (typeof value !== 'string') continue;
  const isCollectorFacing = collectorPrefixes.some((p) => key.startsWith(p));
  if (isCollectorFacing) {
    const grade = computeFleschKincaid(value);
    if (grade > 9.0) {
      console.error(`  [FAIL] ${key} exceeded Grade 9 readability: Grade ${grade.toFixed(1)}`);
      console.error(`         Text: "${value}"`);
      fkFailures++;
      hasFailure = true;
    }
  }
}

if (fkFailures === 0) {
  console.log('  [PASS] All collector-facing copy is <= Grade 9 by Flesch-Kincaid.');
}

// ---------------------------------------------------------
// 5. Invariant Vocabulary Verification
// ---------------------------------------------------------
console.log('\n--- 5. Invariant Forbidden Words Verification ---');

const forbiddenTerms = ['f' + 'raud', 'th' + 'eft', 'ch' + 'eat', 'st' + 'eal'];
const forbiddenWords = new RegExp('\\b(' + forbiddenTerms.join('|') + ')\\b', 'i');
let forbiddenCount = 0;

for (const file of tsxFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (forbiddenWords.test(content)) {
    console.error(`  [FAIL] Forbidden word found in ${path.relative(process.cwd(), file)}`);
    forbiddenCount++;
    hasFailure = true;
  }
}

if (forbiddenCount === 0) {
  console.log('  [PASS] Zero forbidden punitive words in source code.');
}

console.log('\n====================================================');
if (hasFailure) {
  console.error('FAIL: Accessibility audit found one or more violations.');
  process.exit(1);
} else {
  console.log('SUCCESS: All accessibility verification checks passed!');
  process.exit(0);
}
