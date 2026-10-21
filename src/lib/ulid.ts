/**
 * Crockford's Base32 encoding characters (excludes I, L, O, U to avoid confusion)
 */
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;

/**
 * Generate a 26-character universally unique lexicographically sortable identifier (ULID).
 * 48 bits timestamp (10 chars) + 80 bits randomness (16 chars).
 */
export function generateULID(timestamp: number = Date.now()): string {
  // 1. Time component (10 chars)
  let timeStr = '';
  let time = timestamp;
  for (let i = 9; i >= 0; i--) {
    const mod = time % ENCODING_LEN;
    timeStr = ENCODING.charAt(mod) + timeStr;
    time = Math.floor(time / ENCODING_LEN);
  }

  // 2. Random component (16 chars)
  let randStr = '';
  for (let i = 0; i < 16; i++) {
    const rand = Math.floor(Math.random() * ENCODING_LEN);
    randStr += ENCODING.charAt(rand);
  }

  return timeStr + randStr;
}

/**
 * Extract timestamp in milliseconds from a ULID string.
 */
export function decodeULIDTime(ulid: string): number {
  const timePart = ulid.slice(0, 10);
  let time = 0;
  for (let i = 0; i < 10; i++) {
    const char = timePart.charAt(i);
    const index = ENCODING.indexOf(char);
    if (index === -1) return 0;
    time = time * ENCODING_LEN + index;
  }
  return time;
}
