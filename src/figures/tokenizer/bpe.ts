/**
 * Byte-pair encoding on a toy corpus, as chapter 10 describes it: start from
 * single characters and repeatedly merge the most frequent adjacent pair into
 * a new token. Pairs are counted inside words only, weighted by how often the
 * word occurs.
 *
 * Nothing here is looked up: the figure calls `trainBpe` on the corpus and
 * draws what comes back, so changing the corpus changes every count, every
 * merge and every id.
 */

export interface CorpusWord {
  word: string;
  /** How often the word occurs in the corpus. */
  count: number;
}

/**
 * The corpus of the chapter's worked example. These four words and their
 * counts are the input of the toy, not a result.
 */
export const CORPUS: readonly CorpusWord[] = [
  { word: "cube", count: 5 },
  { word: "cubes", count: 2 },
  { word: "tube", count: 3 },
  { word: "bed", count: 2 },
];

/** The word the chapter's first exercise adds to the corpus. */
export const EXTRA_WORD: CorpusWord = { word: "tub", count: 4 };

/**
 * New words encoded with the learned merges: the three of the chapter's
 * worked example, and one of its first exercise, which the extra word changes.
 */
export const NEW_WORDS: readonly string[] = ["cubes", "cubed", "bud", "tubed"];

/** A word of the corpus as the tokens it is currently written with. */
export interface SplitWord extends CorpusWord {
  symbols: string[];
}

/** An adjacent pair of tokens and how often it occurs in the corpus. */
export interface PairCount {
  left: string;
  right: string;
  /** Occurrences, each weighted by its word's count. */
  count: number;
  /** What each word that contains the pair adds to the count, in corpus order. */
  parts: number[];
}

export interface VocabularyEntry {
  token: string;
  id: number;
  /** The merge that made the token (1 is the first), or null for a character. */
  merge: number | null;
}

export interface Merge {
  left: string;
  right: string;
  /** The new token: left and right joined. */
  token: string;
  /** Its id: the characters come first, then the merges in the order they were learned. */
  id: number;
  /** How often the pair occurred when it was merged. */
  count: number;
}

/** The corpus after a number of merges, and what the next merge will be chosen from. */
export interface BpeState {
  /** How many merges have been applied. */
  merges: number;
  words: SplitWord[];
  /** Pair counts in this corpus: most frequent first, ties in the order the pairs first appear. */
  pairs: PairCount[];
  vocabulary: VocabularyEntry[];
  /** Tokens needed to write the whole corpus: every word's tokens times its count. */
  length: number;
  /** Number of words in the corpus, counted with repetition. */
  wordCount: number;
}

export interface BpeRun {
  /** states[k] is the corpus after k merges; the last state has no pairs left. */
  states: BpeState[];
  /** merges[k - 1] is the merge that leads from states[k - 1] to states[k]. */
  merges: Merge[];
}

/** Replaces every adjacent (left, right) by the joined token, left to right. */
export function applyMerge(symbols: readonly string[], left: string, right: string): string[] {
  const merged: string[] = [];
  let index = 0;
  while (index < symbols.length) {
    if (index < symbols.length - 1 && symbols[index] === left && symbols[index + 1] === right) {
      merged.push(left + right);
      index += 2;
    } else {
      merged.push(symbols[index]);
      index += 1;
    }
  }
  return merged;
}

/**
 * Positions at which (left, right) starts in a word, the way `applyMerge`
 * will consume them: left to right, never overlapping.
 */
export function pairStarts(symbols: readonly string[], left: string, right: string): number[] {
  const starts: number[] = [];
  let index = 0;
  while (index < symbols.length - 1) {
    if (symbols[index] === left && symbols[index + 1] === right) {
      starts.push(index);
      index += 2;
    } else {
      index += 1;
    }
  }
  return starts;
}

/**
 * Every adjacent pair with its count. A pair is never counted across a word
 * boundary. The most frequent pair is first; pairs with equal counts keep the
 * order in which they first appear in the corpus, so the first of a tie is
 * the one that gets merged.
 */
export function countPairs(words: readonly SplitWord[]): PairCount[] {
  const found = new Map<string, PairCount>();
  for (const { symbols, count } of words) {
    const inThisWord = new Map<string, number>();
    for (let index = 0; index < symbols.length - 1; index += 1) {
      const left = symbols[index];
      const right = symbols[index + 1];
      const key = `${left}\u0000${right}`;
      let pair = found.get(key);
      if (!pair) {
        pair = { left, right, count: 0, parts: [] };
        found.set(key, pair);
      }
      pair.count += count;
      inThisWord.set(key, (inThisWord.get(key) ?? 0) + count);
    }
    for (const [key, amount] of inThisWord) found.get(key)?.parts.push(amount);
  }
  // Array.prototype.sort is stable: equal counts stay in order of first appearance.
  return [...found.values()].sort((a, b) => b.count - a.count);
}

function corpusLength(words: readonly SplitWord[]): number {
  return words.reduce((total, { symbols, count }) => total + symbols.length * count, 0);
}

/**
 * Runs byte-pair encoding on a corpus until no pair is left, which is when
 * every word has become a single token. Returns the corpus after every merge.
 */
export function trainBpe(corpus: readonly CorpusWord[]): BpeRun {
  let words: SplitWord[] = corpus.map(({ word, count }) => ({ word, count, symbols: [...word] }));
  const characters = [...new Set(words.flatMap(({ symbols }) => symbols))].sort();
  let vocabulary: VocabularyEntry[] = characters.map((token, id) => ({ token, id, merge: null }));
  const wordCount = corpus.reduce((total, { count }) => total + count, 0);

  const states: BpeState[] = [];
  const merges: Merge[] = [];

  for (;;) {
    const pairs = countPairs(words);
    states.push({ merges: merges.length, words, pairs, vocabulary, length: corpusLength(words), wordCount });
    if (pairs.length === 0) break;

    const { left, right, count } = pairs[0];
    const merge: Merge = { left, right, token: left + right, id: vocabulary.length, count };
    merges.push(merge);
    words = words.map((word) => ({ ...word, symbols: applyMerge(word.symbols, left, right) }));
    vocabulary = [...vocabulary, { token: merge.token, id: merge.id, merge: merges.length }];
  }

  return { states, merges };
}

/**
 * Encodes text with the first `count` merges: split it into characters, then
 * apply the merges in the order they were learned.
 */
export function encode(text: string, merges: readonly Merge[], count: number = merges.length): string[] {
  let symbols = [...text];
  for (const { left, right } of merges.slice(0, count)) symbols = applyMerge(symbols, left, right);
  return symbols;
}

/** The id of a token in a vocabulary, or null when the vocabulary does not have it. */
export function idOf(token: string, vocabulary: readonly VocabularyEntry[]): number | null {
  return vocabulary.find((entry) => entry.token === token)?.id ?? null;
}
