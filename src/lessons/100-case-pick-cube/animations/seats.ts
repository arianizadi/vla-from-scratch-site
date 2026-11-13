/**
 * The rounding bug of the position table, computed: a seat number stored with
 * 8 significant bits (bfloat16) is rounded to the nearest number it can hold,
 * ties to even. From 256 to 511 that is every 2nd number, from 512 to 1023
 * every 4th, so neighbouring seats share a number, more so further down a
 * long row.
 */

export function bfloat16(value: number): number {
  if (value === 0) return 0;
  const exponent = Math.floor(Math.log2(Math.abs(value)));
  const spacing = 2 ** (exponent - 7);
  const quotient = value / spacing;
  const floor = Math.floor(quotient);
  const rest = quotient - floor;
  const rounded = rest > 0.5 || (rest === 0.5 && floor % 2 === 1) ? floor + 1 : floor;
  return rounded * spacing;
}

/** The last pieces of each row: the robot's action slots (the chapter: 426 on without memory, 787 on with it). */
export const SHORT_ROW = Array.from({ length: 8 }, (_, i) => 426 + i);
export const LONG_ROW = Array.from({ length: 8 }, (_, i) => 787 + i);
