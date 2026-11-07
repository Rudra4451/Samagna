/**
 * src/lib/assistant/matcher.ts
 * 
 * Maitriyam v0: Deterministic Pure Offline Matcher.
 * 
 * Invariants:
 * 1. Synchronous, deterministic execution. Zero randomness, zero clocks.
 * 2. Unicode NFC normalisation.
 * 3. Normalises Odia script digits (U+0B66 to U+0B6F) to standard ASCII.
 * 4. Filters candidate entries strictly by user role and UI surface.
 * 5. Weighted scoring combining token overlap and character trigram similarity.
 * 6. Pinned tie-breaking: score descending, then entry ID ascending.
 */

export interface KnowledgeEntry {
  id: string;
  intent: string;
  locale: string;
  questions: string[];
  answer: string;
  sourceRef: string;
  roles: string[];
  surfaces: string[];
  reviewed: boolean;
  version: string;
  owner: string;
  updatedAt: string;
}

export interface MatchResult {
  entry: KnowledgeEntry | null;
  score: number;
  matchedQuestion?: string;
  relevantTopics: KnowledgeEntry[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

const ODIA_DIGITS: Record<string, string> = {
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

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'of', 'for', 'to',
  'and', 'or', 'what', 'how', 'why', 'who', 'tell', 'me', 'please', 'can', 'you',
  'ଏହି', 'କଣ', 'କିପରି', 'କାହିଁକି', 'କି', 'ର', 'କୁ', 'ରେ', 'ମୋ', 'ମୋର', 'ଏବଂ'
]);

/**
 * Normalises input text: NFC form, maps Odia digits, strips punctuation, lowercases.
 */
export function normaliseText(input: string): string {
  if (!input) return '';
  let str = input.normalize('NFC').trim().toLowerCase();

  // Map Odia script digits
  str = str.replace(/[\u0B66-\u0B6F]/g, (ch) => ODIA_DIGITS[ch] || ch);

  // Replace punctuation with spaces
  str = str.replace(/[?.,!/\\;:'"()[\]{}#@^&*~`_+=<>\-—|]/g, ' ');

  // Collapse multiple spaces
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Generates character trigrams from normalised string.
 */
export function generateTrigrams(text: string): Set<string> {
  const trigrams = new Set<string>();
  const padded = `  ${text}  `;
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Computes Jaccard character-trigram similarity between two strings.
 */
export function trigramSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1.0;

  const t1 = generateTrigrams(str1);
  const t2 = generateTrigrams(str2);

  let intersection = 0;
  t1.forEach((tri) => {
    if (t2.has(tri)) intersection++;
  });

  const union = t1.size + t2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Tokenises string into meaningful tokens, excluding stop-words.
 */
export function tokenise(text: string): string[] {
  return normaliseText(text)
    .split(' ')
    .filter((tok) => tok.length > 0 && !STOP_WORDS.has(tok));
}

/**
 * Computes weighted token overlap ratio between query tokens and reference tokens.
 */
export function tokenOverlap(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;
  const targetSet = new Set(targetTokens);

  let matches = 0;
  queryTokens.forEach((tok) => {
    if (targetSet.has(tok)) {
      matches++;
    }
  });

  return matches / Math.max(queryTokens.length, 1);
}

/**
 * Evaluates candidate query against target reference question.
 * Formula: 0.55 * TokenOverlap + 0.45 * TrigramSimilarity
 */
export function scoreQuery(normQuery: string, queryTokens: string[], targetQ: string): number {
  const normTarget = normaliseText(targetQ);
  if (normQuery === normTarget) return 1.0;

  const targetTokens = tokenise(targetQ);
  const overlap = tokenOverlap(queryTokens, targetTokens);
  const trigram = trigramSimilarity(normQuery, normTarget);

  return 0.55 * overlap + 0.45 * trigram;
}

/**
 * Pure, deterministic knowledge matcher.
 */
export function matchKnowledgeBase(
  rawQuery: string,
  entries: KnowledgeEntry[],
  role: string,
  surface: string,
  locale: string = 'en',
  threshold: number = 0.42
): MatchResult {
  const normQuery = normaliseText(rawQuery);
  const queryTokens = tokenise(rawQuery);

  if (!normQuery || queryTokens.length === 0) {
    return {
      entry: null,
      score: 0,
      relevantTopics: entries.slice(0, 5),
      confidence: 'NONE',
    };
  }

  // 1. Role and Surface Scoping
  const candidates = entries.filter((entry) => {
    const roleMatches =
      entry.roles.includes('PUBLIC') ||
      entry.roles.includes(role.toUpperCase()) ||
      role.toUpperCase() === 'SUPERVISOR_ADMIN';
    const surfaceMatches =
      entry.surfaces.includes('all') ||
      entry.surfaces.includes(surface.toLowerCase());
    const localeMatches = entry.locale === locale;

    return roleMatches && surfaceMatches && localeMatches;
  });

  // 2. Score every question in candidates
  interface ScoredCandidate {
    entry: KnowledgeEntry;
    bestScore: number;
    bestQuestion: string;
  }

  const scored: ScoredCandidate[] = candidates.map((entry) => {
    let bestScore = 0;
    let bestQuestion = entry.questions[0] || '';

    for (const q of entry.questions) {
      const s = scoreQuery(normQuery, queryTokens, q);
      if (s > bestScore) {
        bestScore = s;
        bestQuestion = q;
      }
    }

    return { entry, bestScore, bestQuestion };
  });

  // 3. Deterministic Sorting: score desc, then entry id asc (tie-break rule)
  scored.sort((a, b) => {
    if (Math.abs(b.bestScore - a.bestScore) > 0.0001) {
      return b.bestScore - a.bestScore;
    }
    return a.entry.id.localeCompare(b.entry.id);
  });

  const best = scored[0];
  const relevantTopics = scored.slice(0, 5).map((s) => s.entry);

  if (!best || best.bestScore < threshold) {
    return {
      entry: null,
      score: best ? best.bestScore : 0,
      relevantTopics,
      confidence: best && best.bestScore > 0.25 ? 'LOW' : 'NONE',
    };
  }

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (best.bestScore >= 0.75) confidence = 'HIGH';
  else if (best.bestScore >= threshold) confidence = 'MEDIUM';

  return {
    entry: best.entry,
    score: best.bestScore,
    matchedQuestion: best.bestQuestion,
    relevantTopics,
    confidence,
  };
}
