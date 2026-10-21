const fs = require('fs');
const path = require('path');

const enPath = path.resolve(__dirname, '../src/i18n/en.json');
const orPath = path.resolve(__dirname, '../src/i18n/or.json');

console.log('--- BanaSetu i18n Parity Audit ---');

if (!fs.existsSync(enPath) || !fs.existsSync(orPath)) {
  console.error('ERROR: i18n translation files not found at expected paths.');
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const or = JSON.parse(fs.readFileSync(orPath, 'utf-8'));

const enKeys = Object.keys(en);
const orKeys = Object.keys(or);

const missingInOr = enKeys.filter((k) => !or.hasOwnProperty(k));
const missingInEn = orKeys.filter((k) => !en.hasOwnProperty(k));

let hasErrors = false;

if (missingInOr.length > 0) {
  console.error(`Missing keys in or.json (${missingInOr.length}):`, missingInOr);
  hasErrors = true;
}

if (missingInEn.length > 0) {
  console.error(`Extra keys in or.json / missing in en.json (${missingInEn.length}):`, missingInEn);
  hasErrors = true;
}

if (!hasErrors) {
  console.log(`✓ Perfect i18n key parity! Total verified keys: ${enKeys.length}`);
  process.exit(0);
} else {
  console.error('FAIL: i18n key parity verification failed.');
  process.exit(1);
}
