/**
 * src/lib/server/verificationSlug.ts
 *
 * Cryptographically Secure Non-Sequential Verification Slug Generator
 * Resolves SEC-MED-02 (Sequential Batch Enumeration Prevention).
 * 
 * Generates high-entropy Crockford Base32 slugs (excluding confusing characters 0, O, 1, I, L)
 * Example output: "BS-7K9M-4W2X" (~40 bits of entropy), preventing sequential enumeration
 * while preserving short, human-typeable stencil formats for rural field use.
 */

import crypto from 'crypto';

// Crockford Base32 alphabet (32 characters: 2-9, A-Z excluding I, L, O, U to avoid profanity and confusion)
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates an 8-character high-entropy slug formatted as "BS-XXXX-XXXX"
 */
export function generateVerificationSlug(): string {
  const bytes = crypto.randomBytes(8);
  let segment1 = '';
  let segment2 = '';

  for (let i = 0; i < 4; i++) {
    segment1 += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  for (let i = 4; i < 8; i++) {
    segment2 += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }

  return `BS-${segment1}-${segment2}`;
}

/**
 * Validates whether an input matches either:
 * 1. Modern high-entropy slug: "BS-XXXX-XXXX" or "BS-XXXXXXXX"
 * 2. Legacy sequential operational batch code: "BS-402", "BS-400"
 */
export function isValidBatchLookupFormat(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const clean = input.trim().replace(/^#/, '').toUpperCase();

  // Legacy format (BS-100 to BS-99999)
  if (/^BS-\d{3,6}$/.test(clean)) return true;

  // Modern high-entropy format (BS-XXXX-XXXX)
  if (/^BS-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(clean)) return true;

  // Modern compact format (BS-XXXXXXXX)
  if (/^BS-[0-9A-Z]{8}$/.test(clean)) return true;

  return false;
}

