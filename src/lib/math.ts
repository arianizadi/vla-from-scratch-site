/**
 * KaTeX for the lessons' "The math, step by step": a formula whose symbols
 * wear the colour of their meaning, and inline $...$ in plain text.
 * Server only (build time). Output is HTML with MathML beside it, so screen
 * readers read the formula and not the drawing.
 */

import katex from "katex";
import type { MathTone } from "@/lessons/define";

/** The order symbols take colours in when the author picks none. */
export const DEFAULT_TONES: MathTone[] = ["accent", "action", "vision", "language", "success"];

const OPTIONS = {
  output: "htmlAndMathml",
  strict: "ignore",
  throwOnError: true,
  trust: (context: { command: string }) => context.command === "\\htmlClass",
} as const;

export function renderTex(tex: string, displayMode = false): string {
  return katex.renderToString(tex, { ...OPTIONS, displayMode });
}

/** The error KaTeX gives for this LaTeX, or undefined when it renders. */
export function texError(tex: string): string | undefined {
  try {
    katex.renderToString(tex, { ...OPTIONS, displayMode: true });
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message.split("\n")[0] : String(error);
  }
}

interface Token {
  text: string;
  start: number;
  end: number;
}

const TOKEN = /\\[a-zA-Z]+|\\[\s\S]|\s+|[\s\S]/g;
/** Commands whose braced argument is text, not symbols. */
const TEXT_COMMANDS = new Set([
  "\\text",
  "\\textrm",
  "\\textbf",
  "\\textit",
  "\\mathrm",
  "\\operatorname",
  "\\mbox",
  "\\begin", // environment names: never wrap a letter of {bmatrix}
  "\\end",
]);

function tokens(tex: string): Token[] {
  return [...tex.matchAll(TOKEN)]
    .map((match) => ({ text: match[0], start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }))
    .filter((token) => !/^\s+$/.test(token.text));
}

/**
 * The formula with every occurrence of each symbol wrapped in
 * \htmlClass{msym-<tone>}{...}. Matching is by LaTeX token, longest symbol
 * first, so `x_t` wins over `x`, and `x` never matches inside `\max` or
 * inside \text{...}.
 */
export function colourSymbols(formula: string, symbols: { tex: string; tone: MathTone }[]): string {
  const source = tokens(formula);
  const candidates = symbols
    .map((symbol) => ({ ...symbol, tokens: tokens(symbol.tex).map((token) => token.text) }))
    .filter((symbol) => symbol.tokens.length > 0)
    .sort((a, b) => b.tokens.length - a.tokens.length);

  let out = "";
  let cursor = 0;
  let textDepth = 0;
  let pendingText = false;
  let depth = 0;
  const textOpenedAt: number[] = [];

  for (let index = 0; index < source.length; ) {
    const token = source[index];
    if (TEXT_COMMANDS.has(token.text)) pendingText = true;
    if (token.text === "{") {
      depth += 1;
      if (pendingText) {
        textOpenedAt.push(depth);
        textDepth += 1;
        pendingText = false;
      }
    } else if (token.text === "}") {
      if (textOpenedAt[textOpenedAt.length - 1] === depth) {
        textOpenedAt.pop();
        textDepth -= 1;
      }
      depth -= 1;
    } else if (!TEXT_COMMANDS.has(token.text)) {
      pendingText = false;
    }

    if (textDepth === 0 && token.text !== "{" && token.text !== "}") {
      const hit = candidates.find((symbol) =>
        symbol.tokens.every((text, offset) => source[index + offset]?.text === text),
      );
      if (hit) {
        const first = source[index];
        const last = source[index + hit.tokens.length - 1];
        const before = source[index - 1]?.text;
        const wrapped = `\\htmlClass{msym-${hit.tone}}{${formula.slice(first.start, last.end)}}`;
        out += formula.slice(cursor, first.start) + (before === "_" || before === "^" ? `{${wrapped}}` : wrapped);
        cursor = last.end;
        index += hit.tokens.length;
        continue;
      }
    }
    index += 1;
  }
  const coloured = out + formula.slice(cursor);
  // Colouring must never break a formula: fall back to the plain one if KaTeX rejects the wrapped version.
  return texError(coloured) === undefined ? coloured : formula;
}

/**
 * Inline maths as pieces a line may break between: a list such as "1.65, 1.11, 1.22" becomes
 * "1.65," "1.11," "1.22" (split at commas outside braces and \left...\right). KaTeX keeps each
 * piece on one line, so an unsplit list runs off a phone screen.
 */
export function inlinePieces(tex: string): string[] {
  const pieces: string[] = [];
  let depth = 0;
  let start = 0;
  const token = /\\left\b|\\right\b|\\[a-zA-Z]+|\\[\s\S]|[{}]|,/g;
  for (const match of tex.matchAll(token)) {
    const text = match[0];
    const index = match.index ?? 0;
    if (text === "{" || text === "\\left") depth += 1;
    else if (text === "}" || text === "\\right") depth = Math.max(0, depth - 1);
    else if (text === "," && depth === 0) {
      pieces.push(tex.slice(start, index + 1));
      start = index + 1;
    }
  }
  pieces.push(tex.slice(start));
  const trimmed = pieces.map((piece) => piece.trim()).filter((piece) => piece !== "" && piece !== ",");
  // Every piece must render on its own; otherwise keep the formula whole.
  return trimmed.length > 1 && trimmed.every((piece) => texError(piece) === undefined) ? trimmed : [tex];
}

/** Splits text into plain parts and $...$ maths. */
export function splitMath(text: string): { math: boolean; text: string }[] {
  const parts: { math: boolean; text: string }[] = [];
  const pattern = /\$([^$]+)\$/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ math: false, text: text.slice(last, index) });
    parts.push({ math: true, text: match[1] });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ math: false, text: text.slice(last) });
  return parts;
}

/** The steps of a worked example: one per line, or one per sentence when written as one paragraph. */
export function exampleSteps(example: string): string[] {
  const lines = example
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  // Protect $...$ while splitting on sentence ends, so "0.5." inside maths stays whole.
  const masked = example.replace(/\$[^$]+\$/g, (math) => math.replace(/[.!?]/g, "\u0000"));
  const sentences: string[] = [];
  let start = 0;
  for (const match of masked.matchAll(/[.!?](?=\s+[A-Z$(])/g)) {
    const end = (match.index ?? 0) + 1;
    sentences.push(example.slice(start, end).trim());
    start = end;
  }
  sentences.push(example.slice(start).trim());
  return sentences.filter(Boolean);
}
