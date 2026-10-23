/**
 * Defensible CSV Cell Sanitization & RFC 4180 Escaping (Fix 1 - CWE-1236 Formula Injection)
 *
 * 1. Handles null, undefined, empty values safely as empty quotes `""`.
 * 2. Recognizes legitimate numeric values (including negative floats/integers e.g. -12.5, -0.05, 0, 42)
 *    so they remain numeric, preserving spreadsheet calculations and formatting.
 * 3. Detects formula injection trigger characters: '=', '+', '-', '@', tab ('\t'), or carriage return ('\r')
 *    (both at string start and after leading whitespace).
 * 4. Neutralizes formula triggers by prefixing with a single quote `'` per OWASP recommendations,
 *    instructing spreadsheet engines (Excel, Calc) to treat the cell strictly as literal text.
 * 5. Escapes internal double quotes by doubling them `""` per RFC 4180.
 * 6. Preserves UTF-8 Unicode (Odia script), commas, and embedded newlines within quoted fields.
 *
 * Known Limitations & Defense-in-Depth:
 * - In non-Excel spreadsheet consumers (e.g. LibreOffice Calc or raw text parsers), the prepended `'`
 *   may be rendered literally in the grid.
 * - End users should keep DDE / external data connections disabled in office suites.
 */
export function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  // Pure finite number (e.g. 42, -1.5, 0)
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return '""';
    return `"${val}"`;
  }

  // Boolean
  if (typeof val === 'boolean') {
    return `"${val}"`;
  }

  let str = String(val);
  if (str.length === 0) {
    return '""';
  }

  // Check if string is a pure normal numeric value (e.g. "-12.5", "-0.05", "100")
  // Normal negative numbers and standard integers/floats must remain numeric for spreadsheet math
  const isPureNumber = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(str.trim());
  if (isPureNumber) {
    return `"${str.trim()}"`;
  }

  // Check for dangerous spreadsheet formula injection prefixes
  // Triggers: '=', '+', '-', '@', '\t' (0x09), '\r' (0x0D), or leading whitespace followed by triggers
  const trimmedLeading = str.replace(/^[ \t\r\n]+/, '');
  const startsWithDangerousChar =
    /^[=+\-@\t\r]/.test(str) ||
    /^[=+\-@\t\r]/.test(trimmedLeading);

  if (startsWithDangerousChar) {
    // Prefix with single quote to force spreadsheet to treat as string literal
    str = `'${str}`;
  }

  // RFC 4180: Enclose in double quotes and escape internal quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
}

export function escapeCsvField(val: unknown): string {
  return sanitizeCsvCell(val);
}
