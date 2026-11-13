/**
 * What the old position table did to a position: round it to bfloat16's
 * 8 significant bits, ties to even, as PyTorch does. 427, 428 and 429 all
 * become 428.
 */
export function toBfloat16(value: number): number {
  if (value === 0) return 0;
  const exponent = Math.floor(Math.log2(Math.abs(value)));
  const spacing = 2 ** (exponent - 7);
  const scaled = value / spacing;
  const floor = Math.floor(scaled);
  const rest = scaled - floor;
  const rounded = rest > 0.5 || (rest === 0.5 && floor % 2 === 1) ? floor + 1 : floor;
  return rounded * spacing;
}

/** The action-step tokens of dp_vit_lang_reactive: positions 426 to 440. */
export const ACTION_POSITIONS = Array.from({ length: 15 }, (_, index) => 426 + index);

/** Each token's position under the old table, and its place in the pile of tokens that share it (0 = first). */
export const COLLAPSED = (() => {
  const seen = new Map<number, number>();
  return ACTION_POSITIONS.map((position) => {
    const rounded = toBfloat16(position);
    const stack = seen.get(rounded) ?? 0;
    seen.set(rounded, stack + 1);
    return { position, rounded, stack };
  });
})();

export const DISTINCT_AFTER = new Set(COLLAPSED.map((token) => token.rounded)).size;
