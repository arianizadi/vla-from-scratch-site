/**
 * What happens to a batch of prompts between the tokenizer and the model, on
 * plain arrays: padding to one length, and the two ways an extra token has
 * been added to every row. The figure runs these on real token ids; nothing
 * here is drawn or looked up.
 *
 * The functions mirror the tutorial repository:
 *
 *   padBatch                   the tokenizer called with padding=True
 *   appendToBatch              the code before the fix: one more column, after the padding
 *   insertAfterLastRealToken   insert_after_last_real_token in
 *                              vla_foundry/models/vision_language_backbones/base.py
 */

/** A batch as a model receives it: both arrays are [batch, tokens]. */
export interface Batch {
  /** input_ids. */
  ids: number[][];
  /** attention_mask: 1 for a real token, 0 for padding. */
  mask: number[][];
}

/** Pads every prompt to the longest one in the batch. A batch of one prompt gets no padding. */
export function padBatch(prompts: readonly (readonly number[])[], padId: number, side: "left" | "right" = "right"): Batch {
  const length = Math.max(0, ...prompts.map((prompt) => prompt.length));
  const ids: number[][] = [];
  const mask: number[][] = [];
  for (const prompt of prompts) {
    const pads = new Array<number>(length - prompt.length).fill(padId);
    const zeros = new Array<number>(length - prompt.length).fill(0);
    const ones = new Array<number>(prompt.length).fill(1);
    ids.push(side === "right" ? [...prompt, ...pads] : [...pads, ...prompt]);
    mask.push(side === "right" ? [...ones, ...zeros] : [...zeros, ...ones]);
  }
  return { ids, mask };
}

/**
 * The extra token as one more column at the end of the padded batch:
 * torch.cat([input_ids, extra], dim=1). In a padded row it lands after the
 * padding.
 */
export function appendToBatch(batch: Batch, tokenId: number): Batch {
  return {
    ids: batch.ids.map((row) => [...row, tokenId]),
    mask: batch.mask.map((row) => [...row, 1]),
  };
}

/**
 * The extra token directly after each row's last real token; the padding
 * moves to the end. As in the repository: concatenate, then reorder every row
 * with a stable argsort on (mask == 0), so that real tokens come first and
 * keep their order.
 */
export function insertAfterLastRealToken(batch: Batch, tokenId: number): Batch {
  const { ids, mask } = appendToBatch(batch, tokenId);
  const order = mask.map((row) => stableArgsort(row.map((value) => (value === 0 ? 1 : 0))));
  return { ids: gather(ids, order), mask: gather(mask, order) };
}

/** torch.argsort(keys, stable=True) for one row: the indices that sort it, ties in their first order. */
function stableArgsort(keys: readonly number[]): number[] {
  // Array.prototype.sort is stable.
  return keys.map((_, index) => index).sort((a, b) => keys[a] - keys[b]);
}

/** torch.gather(values, 1, order). */
function gather(values: readonly (readonly number[])[], order: readonly (readonly number[])[]): number[][] {
  return values.map((row, r) => order[r].map((index) => row[index]));
}

/** Where a token sits in one row of a batch, and how much padding comes before it. */
export interface TokenPlace {
  /** Index of the token in its row; -1 if the row does not hold it. */
  index: number;
  /** Padding positions before the token: under a causal mask it attends to all of them. */
  padsBefore: number;
  /** Padding positions after the token. */
  padsAfter: number;
  /** Indices of the row's padding positions. */
  pads: number[];
  /** Length of the row. */
  length: number;
}

export function locate(batch: Batch, row: number, tokenId: number): TokenPlace {
  const mask = batch.mask[row];
  const index = batch.ids[row].indexOf(tokenId);
  const pads = mask.flatMap((value, position) => (value === 0 ? [position] : []));
  const padsBefore = pads.filter((position) => position < index).length;
  return { index, padsBefore, padsAfter: pads.length - padsBefore, pads, length: mask.length };
}
