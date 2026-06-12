/**
 * Parses a date string in any of the supported formats and normalizes it
 * to the canonical storage format: YYYY-MM-DD
 *
 * Accepted formats:
 *  - MMDDYY       e.g. 011590  → 1990-01-15
 *  - DDMMYY       e.g. 150190  → 1990-01-15
 *  - YYMMDD       e.g. 900115  → 1990-01-15
 *  - MMDDYYYY     e.g. 01151990
 *  - DDMMYYYY     e.g. 15011990
 *  - YYYYMMDD     e.g. 19900115
 *  - MM/DD/YYYY   e.g. 01/15/1990
 *  - DD/MM/YYYY   e.g. 15/01/1990
 *  - MM-DD-YYYY   e.g. 01-15-1990
 *  - DD-MM-YYYY   e.g. 15-01-1990
 *  - YYYY-MM-DD          e.g. 1990-01-15  (already canonical — passed through)
 *  - YYYY-MM-DDTHH:mm:ss.sssZ  ISO DateTime (already transformed — passed through)
 *
 * Returns the normalized YYYY-MM-DD string, or null if parsing fails.
 */
export function parseFlexibleDate(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const raw = input.trim();

  // ── ISO DateTime (already transformed by @Transform, e.g. "2026-06-01T00:00:00.000Z") ─
  const isoDateTimeMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoDateTimeMatch) {
    // Strip the time portion and re-validate the date part
    return parseFlexibleDate(isoDateTimeMatch[1]);
  }

  // Helper: build YYYY-MM-DD from parts
  const build = (y: number, m: number, d: number): string | null => {
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    // Expand 2-digit year: 00-29 → 2000-2029, 30-99 → 1930-1999
    const year = y < 100 ? (y <= 29 ? 2000 + y : 1900 + y) : y;
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // ── ISO canonical: YYYY-MM-DD ────────────────────────────────────────────
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return build(+isoMatch[1], +isoMatch[2], +isoMatch[3]);
  }

  // ── Slash-separated: MM/DD/YYYY or DD/MM/YYYY ────────────────────────────
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, a, b, y] = slashMatch;
    // Prefer MM/DD/YYYY (US format). If month part > 12 assume DD/MM/YYYY.
    const aNum = +a, bNum = +b, yNum = +y;
    if (aNum > 12) return build(yNum, bNum, aNum); // DD/MM/YYYY
    return build(yNum, aNum, bNum);                // MM/DD/YYYY
  }

  // ── Hyphen-separated: MM-DD-YYYY or DD-MM-YYYY ───────────────────────────
  const hyphenMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (hyphenMatch) {
    const [, a, b, y] = hyphenMatch;
    const aNum = +a, bNum = +b, yNum = +y;
    if (aNum > 12) return build(yNum, bNum, aNum);
    return build(yNum, aNum, bNum);
  }

  // ── 6-digit compact: MMDDYY | DDMMYY | YYMMDD ───────────────────────────
  if (/^\d{6}$/.test(raw)) {
    const a = +raw.slice(0, 2), b = +raw.slice(2, 4), c = +raw.slice(4, 6);

    // YYMMDD: first two digits ≤ 99, second two look like a month (01-12)
    if (b >= 1 && b <= 12 && a <= 99 && c >= 1 && c <= 31) {
      // Could be YYMMDD or MMDDYY or DDMMYY — try all and pick first valid
      const candidates: Array<string | null> = [
        build(c, a, b), // YYMMDD → year=c treated as 2-digit? No, c is day here
        build(a, b, c), // MMDDYY → month=a, day=b, year=c
        build(a, c, b), // MMYYDD? skip
      ];
      // YYMMDD
      const yymmdd = build(a, b, c); // Y=a, M=b, D=c
      const mmddyy = build(c, a, b); // Y=c, M=a, D=b
      const ddmmyy = build(c, b, a); // Y=c, M=b, D=a

      // Priority: DDMMYY (most common in India/Europe), MMDDYY (US), YYMMDD
      for (const attempt of [ddmmyy, mmddyy, yymmdd]) {
        if (attempt) return attempt;
      }
    }
    return null;
  }

  // ── 8-digit compact: DDMMYYYY | MMDDYYYY | YYYYMMDD ─────────────────────
  if (/^\d{8}$/.test(raw)) {
    const a = +raw.slice(0, 2), b = +raw.slice(2, 4), y8 = +raw.slice(4, 8);
    const yFront = +raw.slice(0, 4), mFront = +raw.slice(4, 6), dFront = +raw.slice(6, 8);

    // YYYYMMDD
    const yyyymmdd = build(yFront, mFront, dFront);
    // DDMMYYYY
    const ddmmyyyy = build(y8, b, a);
    // MMDDYYYY
    const mmddyyyy = build(y8, a, b);

    // Priority: YYYYMMDD, DDMMYYYY, MMDDYYYY
    for (const attempt of [yyyymmdd, ddmmyyyy, mmddyyyy]) {
      if (attempt) return attempt;
    }
  }

  return null;
}

/**
 * Validates whether the input can be parsed into a valid date using
 * parseFlexibleDate().
 */
export function isValidFlexibleDate(input: string): boolean {
  return parseFlexibleDate(input) !== null;
}

/**
 * Parses a flexible date input and returns a full ISO 8601 DateTime string
 * anchored at midnight UTC (e.g. "1990-01-15T00:00:00.000Z").
 *
 * This is the format expected by Prisma DateTime fields when passed as a string.
 * Returns null if the input cannot be parsed.
 *
 * @example
 *   parseDateToDateTime("15011990") // "1990-01-15T00:00:00.000Z"
 *   parseDateToDateTime("1990-01-15") // "1990-01-15T00:00:00.000Z"
 *   parseDateToDateTime("15/01/1990") // "1990-01-15T00:00:00.000Z"
 */
export function parseDateToDateTime(input: string): string | null {
  const date = parseFlexibleDate(input);
  if (!date) return null;
  return `${date}T00:00:00.000Z`;
}

