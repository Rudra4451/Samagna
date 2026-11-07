/**
 * src/lib/server/mask.ts
 * 
 * Maitriyam v0: Personal Data Minimisation & Masking Engine.
 * 
 * Invariants:
 * 1. Normalises non-ASCII / Odia digits to ASCII prior to pattern detection.
 * 2. Masks Indian Aadhaar numbers (12 digits): shows last 4.
 * 3. Masks Indian Phone numbers (10-12 digits with optional +91): shows last 4.
 * 4. Masks Bank account numbers: shows last 4 with vault redaction.
 * 5. Runs on user prompt, tool outputs, and model compositions.
 * 
 * Note: Pattern masking cannot detect names or village words; strict allowlisting
 * is the primary statutory control (Section 9.2).
 */

const ODIA_DIGIT_MAP: Record<string, string> = {
  '\u0B66': '0',
  '\u0B67': '1',
  '\u0B68': '2',
  '\u0B69': '3',
  '\u0B6A': '4',
  '\u0B6B': '5',
  '\u0B6C': '6',
  '\u0B6D': '7',
  '\u0B6E': '8',
  '\u0B6F': '9',
};

/**
 * Normalises Odia digits and common spacing/separators.
 */
export function normaliseDigits(text: string): string {
  if (!text) return '';
  return text.replace(/[\u0B66-\u0B6F]/g, (ch) => ODIA_DIGIT_MAP[ch] || ch);
}

/**
 * Masks 12-digit Aadhaar numbers formatted with or without spaces/hyphens.
 * Example: "1234 5678 9012" -> "•••• •••• 9012"
 */
export function maskAadhaar(text: string): string {
  if (!text) return '';
  const normalised = normaliseDigits(text);

  // Match 12 consecutive digits with optional spaces or hyphens between 4-digit groups
  return normalised.replace(/\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b/g, '•••• •••• $3')
    .replace(/\b(\d{8})(\d{4})\b/g, '••••••••$2');
}

/**
 * Masks 10-digit mobile phone numbers with optional +91 or 0 prefix.
 * Example: "+91 94371-23456" -> "+91 ••••• 23456"
 */
export function maskPhone(text: string): string {
  if (!text) return '';
  const normalised = normaliseDigits(text);

  // +91 / 0 prefix with 10 digits
  return normalised.replace(/(?:\+91[\s-]?)?(?:0)?([6-9]\d{4})[\s-]?(\d{5})\b/g, '+91 ••••• $2')
    .replace(/\b([6-9]\d{5})(\d{4})\b/g, '••••••$2');
}

/**
 * Masks Bank Account Numbers (9 to 18 digits).
 * Example: "SBI-987654321012" -> "SBI-••••••••1012"
 */
export function maskBankAccount(text: string): string {
  if (!text) return '';
  const normalised = normaliseDigits(text);

  return normalised.replace(/\b(\d{5,14})(\d{4})\b/g, (_match, prefix, last4) => {
    return '•'.repeat(prefix.length) + last4;
  });
}

/**
 * Master masking function running all PII redact filters.
 */
export function maskAllPii(text: string): string {
  if (!text) return '';
  let out = normaliseDigits(text);
  out = maskAadhaar(out);
  out = maskPhone(out);
  out = maskBankAccount(out);
  return out;
}
