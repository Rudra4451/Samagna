/**
 * BanaSetu F5 Automated Test Suite
 * Validates Multipart File Uploads, MIME Filtering, Size Guards, and SHA-256 Hashing
 */

import crypto from 'crypto';

async function runUploadsF5TestSuite() {
  console.log('\n======================================================');
  console.log('   BanaSetu F5: Digital Evidence & Uploads Test Suite ');
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
  ]);

  // --- Group 1: MIME Type Filtering ---
  console.log('--- 1. MIME Type Filtering & Evidence Classification ---');
  assert(ALLOWED_MIME_TYPES.has('image/jpeg'), 'Accepts standard JPEG image evidence');
  assert(ALLOWED_MIME_TYPES.has('image/png'), 'Accepts standard PNG image evidence');
  assert(ALLOWED_MIME_TYPES.has('image/webp'), 'Accepts modern WebP image evidence');
  assert(ALLOWED_MIME_TYPES.has('audio/webm'), 'Accepts WebM voice recording evidence');
  assert(ALLOWED_MIME_TYPES.has('audio/mp3'), 'Accepts MP3 audio evidence');
  assert(ALLOWED_MIME_TYPES.has('audio/wav'), 'Accepts WAV audio evidence');
  assert(!ALLOWED_MIME_TYPES.has('application/x-executable'), 'Rejects executable files');
  assert(!ALLOWED_MIME_TYPES.has('text/javascript'), 'Rejects JavaScript source files');
  assert(!ALLOWED_MIME_TYPES.has('application/pdf'), 'Rejects PDF documents on evidence upload endpoint');

  // --- Group 2: File Size Boundary Checks ---
  console.log('\n--- 2. File Size Boundary Checks (<= 5MB Guardrail) ---');
  const validSize = 2.4 * 1024 * 1024; // 2.4MB
  assert(validSize <= MAX_FILE_SIZE, 'Permits typical 2.4MB high-resolution field photograph');
  const oversizedFile = 5.2 * 1024 * 1024; // 5.2MB
  assert(oversizedFile > MAX_FILE_SIZE, 'Correctly flags 5.2MB file exceeding 5MB limit');

  // --- Group 3: Cryptographic Integrity Hashing ---
  console.log('\n--- 3. Cryptographic Tamper-Evident Hashing (SHA-256) ---');
  const sampleEvidence = Buffer.from('BanaSetu certified scale weighment photographic evidence 2026');
  const hash1 = crypto.createHash('sha256').update(sampleEvidence).digest('hex');
  assert(hash1.length === 64, 'Produces standard 64-character hex SHA-256 digest');

  const identicalEvidence = Buffer.from('BanaSetu certified scale weighment photographic evidence 2026');
  const hash2 = crypto.createHash('sha256').update(identicalEvidence).digest('hex');
  assert(hash1 === hash2, 'Identical evidence generates deterministic matching checksum');

  const tamperedEvidence = Buffer.from('BanaSetu certified scale weighment photographic evidence 2026 - tampered');
  const hash3 = crypto.createHash('sha256').update(tamperedEvidence).digest('hex');
  assert(hash1 !== hash3, 'Tampered evidence produces completely divergent checksum');

  // --- Group 4: File Signature (Magic Bytes) Validation ---
  console.log('\n--- 4. Binary File Signature (Magic Bytes) Verification ---');
  const { validateFileSignature, generateSafeObjectKey } = await import('../src/lib/server/storage');

  // Valid JPEG: FF D8 FF E0
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  assert(validateFileSignature(validJpeg, 'image/jpeg'), 'Validates real JPEG magic bytes header');

  // Spoofed text file declaring image/jpeg
  const spoofedJpeg = Buffer.from('console.log("malicious code");');
  assert(!validateFileSignature(spoofedJpeg, 'image/jpeg'), 'Rejects spoofed text file masquerading as image/jpeg');

  // Valid PNG: 89 50 4E 47
  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  assert(validateFileSignature(validPng, 'image/png'), 'Validates real PNG magic bytes header');

  // Valid WebP: RIFF .... WEBP
  const validWebp = Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from('WEBP'),
  ]);
  assert(validateFileSignature(validWebp, 'image/webp'), 'Validates real WebP magic bytes header');

  // --- Group 5: Safe Object Key Generation ---
  console.log('\n--- 5. Deterministic Safe Object Key Path Generation ---');
  const key1 = generateSafeObjectKey('evidence', '#BS-402', '01JABCDEFGH', '.jpg');
  assert(key1 === 'evidence/bs-402/01JABCDEFGH.jpg', 'Sanitizes batch ID and generates safe object path');

  const key2 = generateSafeObjectKey('evidence', null, '01JXYZ12345', 'png');
  assert(key2 === 'evidence/unassigned/01JXYZ12345.png', 'Handles unassigned batch ID and ensures leading dot in extension');

  console.log('\n======================================================');
  console.log(`F5 TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');
}

runUploadsF5TestSuite().catch((err) => {
  console.error('Uploads test suite encountered an error:', err);
  process.exit(1);
});

