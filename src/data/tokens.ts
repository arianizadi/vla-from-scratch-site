/**
 * Real tokenisations, made with the tokenizer the from-scratch models use:
 * the four instructions, a few other sentences, and the four instructions as
 * one padded batch in the chat template.
 *
 *   tokenizer.name                           the tokenizer's name on the model hub
 *   tokenizations()                          every sentence with its ids and pieces
 *   tokenization("pick up the red cube")     one of them
 *   paddedBatch()                            the instructions in the chat template, padded to one length
 *
 * A piece is the token as the tokenizer writes it: "Ġ" in front stands for
 * the space before a word, "Ċ" for a line break. `displayPiece` turns both
 * into something readable.
 */

import data from "./generated/tokenizations.json";

export interface Tokenization {
  text: string;
  /** Token ids, one per piece. */
  ids: number[];
  pieces: string[];
}

/** A row of a padded batch: `mask` is 1 for a real token and 0 for padding. */
export interface PaddedTokenization extends Tokenization {
  mask: number[];
}

/** The tokenizer: its name, the size of its vocabulary, and how it pads. */
export const tokenizer: { name: string; vocabSize: number; padId: number; paddingSide: "left" | "right" } = {
  name: data.tokenizer,
  vocabSize: data.vocabSize,
  padId: data.padId,
  paddingSide: data.paddingSide as "left" | "right",
};

export function tokenizations(): Tokenization[] {
  return data.sentences;
}

export function tokenization(text: string): Tokenization | undefined {
  return data.sentences.find((sentence) => sentence.text === text);
}

/** The four instructions in the chat template, as one batch padded to the longest. */
export function paddedBatch(): PaddedTokenization[] {
  return data.chatTemplate;
}

/** A piece as a reader would write it: the leading-space mark becomes a space, the line-break mark "\n". */
export function displayPiece(piece: string): string {
  return piece.replace(/Ġ/g, " ").replace(/Ċ/g, "\\n");
}
