/**
 * A made-up camera frame for the drawings, one brightness per 16 px patch of a
 * 224 x 224 render (14 x 14 patches): a darker wall, a lighter table, and a
 * bright cube about one patch across. Deterministic, so the server and the
 * browser draw the same picture.
 */

export const GRID = 14;

/** The patch the cube mostly falls in (row, column). */
export const CUBE: [number, number] = [8, 5];

function brightness(row: number, col: number): number {
  if ((row === 8 || row === 9) && (col === 5 || col === 6)) return row === 8 && col === 5 ? 1 : 0.78;
  if (row >= 6 && row <= 9 && col === 10) return 0.62;
  const wall = row < 5;
  const base = wall ? 0.16 : 0.34 + (row - 5) * 0.02;
  const texture = (((row * 7 + col * 3) % 5) / 4) * 0.12;
  return Math.round((base + texture) * 100) / 100;
}

/** Brightness 0..1 of every patch, row by row. */
export const PATCHES: number[][] = Array.from({ length: GRID }, (_, row) => Array.from({ length: GRID }, (_, col) => brightness(row, col)));
