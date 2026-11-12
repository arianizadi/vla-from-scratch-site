/**
 * The figure's input and everything computed from it.
 *
 * The input is real: two of the task's instructions as the tokenizer writes
 * them inside the chat template (src/data/tokens.ts), the shortest and the
 * longest. The four states of the figure are then computed with the functions
 * in algorithm.ts: the two prompts as one padded batch or each one alone, with
 * the extra token appended to the batch or inserted after the last real token.
 * No index, count or shape below is typed in.
 */

import { displayPiece, paddedBatch, tokenizations, tokenizer, type PaddedTokenization } from "@/data/tokens";
import { appendToBatch, insertAfterLastRealToken, locate, padBatch, type Batch, type TokenPlace } from "./algorithm";

/** Where the extra token is put: at the end of the padded batch, or after each row's last real token. */
export type Placement = "append" | "insert";
/** How a prompt reaches the model: in a training batch with other prompts, or alone in a request. */
export type Arrival = "batch" | "alone";

export const PLACEMENTS: readonly Placement[] = ["append", "insert"];

export interface TokenCell {
  id: number;
  /** The token as the tokenizer writes it ("Ġcube", "<image>"). */
  piece: string;
  /** What a cell prints: the word, or the role of a special token. */
  label: string;
  /** Part of the instruction itself, as opposed to the template around it. */
  word: boolean;
}

export interface Prompt {
  /** The instruction as it is typed: "pick up the red cube". */
  text: string;
  /** The ids of the whole prompt, chat template included, without padding. */
  ids: number[];
  cells: TokenCell[];
  /** Index of the instruction's first token in the prompt; -1 when it could not be found. */
  start: number;
}

/** The token of one prompt on both paths. */
export interface Reading {
  batch: TokenPlace;
  alone: TokenPlace;
  /** How many positions the two paths are apart. */
  shift: number;
}

export interface Outcome {
  /** The two prompts as one batch, with the token. */
  batch: Batch;
  /** Each prompt alone, with the token: [followed, other]. */
  alone: [Batch, Batch];
  followed: Reading;
  other: Reading;
}

/** Special tokens are printed by their role (the names the tokens chapter gives them). */
const ROLES: Record<string, string> = {
  "<|im_start|>": "begin",
  "<image>": "image",
  "<end_of_utterance>": "end",
};

function cellLabel(piece: string): string {
  if (ROLES[piece]) return ROLES[piece];
  const special = /^<\|?(.+?)\|?>$/.exec(piece);
  if (special) return special[1];
  return displayPiece(piece).trim() || displayPiece(piece);
}

/** Index at which `needle` starts inside `haystack`, or -1. */
function indexOfRun(haystack: readonly number[], needle: readonly number[]): number {
  if (needle.length === 0) return -1;
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((value, offset) => haystack[start + offset] === value)) return start;
  }
  return -1;
}

function toPrompt(row: PaddedTokenization): Prompt {
  const real = row.mask.flatMap((value, index) => (value === 1 ? [index] : []));
  const ids = real.map((index) => row.ids[index]);
  const pieces = real.map((index) => row.pieces[index]);

  // The instruction is the longest known sentence inside the templated string.
  const instruction = tokenizations()
    .filter((sentence) => row.text.includes(sentence.text))
    .sort((a, b) => b.text.length - a.text.length)[0];
  const start = instruction ? indexOfRun(ids, instruction.ids) : -1;
  const end = start < 0 ? -1 : start + instruction.ids.length;

  return {
    text: instruction && start >= 0 ? instruction.text : row.text.trim(),
    ids,
    cells: ids.map((id, index) => ({
      id,
      piece: pieces[index],
      label: cellLabel(pieces[index]),
      word: start < 0 || (index >= start && index < end),
    })),
    start,
  };
}

const prompts = paddedBatch().map(toPrompt);
const lengths = prompts.map((prompt) => prompt.ids.length);
const shortest = Math.min(...lengths);
const longest = Math.max(...lengths);

/** The prompt the figure follows: the shortest of the batch, the one that gets padding. */
export const FOLLOWED: Prompt = prompts.find((prompt) => prompt.ids.length === shortest) ?? prompts[0];
/** The prompt it shares a batch with: the longest, which sets the padded length. */
export const OTHER: Prompt =
  prompts.find((prompt) => prompt !== FOLLOWED && prompt.ids.length === longest) ??
  prompts.find((prompt) => prompt !== FOLLOWED) ??
  FOLLOWED;

/**
 * The extra token's id. The repository adds one row to the embedding table
 * for it, so it gets the first id after the tokenizer's vocabulary.
 */
export const ACTION_TOKEN_ID = tokenizer.vocabSize;
/** The letter the chapters use for it. */
export const ACTION_TOKEN_LABEL = "A";
export const PAD_LABEL = "pad";

function place(batch: Batch, placement: Placement): Batch {
  return placement === "append"
    ? appendToBatch(batch, ACTION_TOKEN_ID)
    : insertAfterLastRealToken(batch, ACTION_TOKEN_ID);
}

function padded(rows: readonly (readonly number[])[]): Batch {
  return padBatch(rows, tokenizer.padId, tokenizer.paddingSide);
}

function reading(batch: Batch, row: number, alone: Batch): Reading {
  const inBatch = locate(batch, row, ACTION_TOKEN_ID);
  const served = locate(alone, 0, ACTION_TOKEN_ID);
  return { batch: inBatch, alone: served, shift: Math.abs(inBatch.index - served.index) };
}

function outcome(placement: Placement): Outcome {
  const batch = place(padded([FOLLOWED.ids, OTHER.ids]), placement);
  const alone: [Batch, Batch] = [place(padded([FOLLOWED.ids]), placement), place(padded([OTHER.ids]), placement)];
  return {
    batch,
    alone,
    followed: reading(batch, 0, alone[0]),
    other: reading(batch, 1, alone[1]),
  };
}

/** The four states: both placements, each with the batch and the prompts alone. */
export const OUTCOMES: Record<Placement, Outcome> = {
  append: outcome("append"),
  insert: outcome("insert"),
};

/** Columns of the drawing: the widest tensor of any state. */
export const COLUMNS = Math.max(
  ...PLACEMENTS.flatMap((placement) => [
    OUTCOMES[placement].batch.ids[0].length,
    ...OUTCOMES[placement].alone.map((batch) => batch.ids[0].length),
  ]),
);

/**
 * Leading positions that hold the same template tokens in both prompts. On a
 * narrow stage they are folded into one break cell, so that the words of the
 * instruction and the end of the row stay readable.
 */
export const FOLDED = FOLLOWED.start === OTHER.start && FOLLOWED.start > 1 ? FOLLOWED.start : 0;

/** "[2, 14]": a tensor's shape, as the chapters write it. */
export function shapeOf(batch: Batch): string {
  return `[${batch.ids.length}, ${batch.ids[0]?.length ?? 0}]`;
}

/** "1 pad", "3 pads". */
export function count(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}
