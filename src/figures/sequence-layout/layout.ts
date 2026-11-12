/**
 * Where every cell goes. One cell is one token, and every cell of the figure
 * has the same size, in the prompt and in the action head, so areas compare.
 *
 * Blocks flow in sequence order, left to right and then onto the next line,
 * like words. An image block is drawn as its patch grid (14 x 14 or 16 x 16);
 * any other block is a row of cells that wraps at 32. Under each block are its
 * label and its count; over a part made of several blocks is a bracket.
 *
 * Two marks need room of their own: a token that names the object stands
 * taller than its row (raise), and a scored target has a bar under it (under).
 */

import { formatCount, type Block, type Panel, type Part } from "./model";

export interface PlacedBlock {
  block: Block;
  x: number;
  /** Top of the first row of cells. */
  y: number;
  cols: number;
  rows: number;
  /** Size of the cells drawn, without the trailing gap. */
  w: number;
  h: number;
}

export interface Bracket {
  key: string;
  x1: number;
  x2: number;
  /** y of the bracket line. */
  y: number;
  /** Written on the first segment of a part only. */
  label: string | null;
}

export interface Geometry {
  width: number;
  height: number;
  /** Distance from one cell to the next. */
  pitch: number;
  /** Side of a cell. */
  cell: number;
  /** How far a cell that names the object reaches above its row; 0 when the panel has none. */
  raise: number;
  /** Room between the cells and the labels for the target bars; 0 when the panel has none. */
  under: number;
  placed: PlacedBlock[];
  brackets: Bracket[];
}

const LINE_HEIGHT = 15;
const LABEL_BAND = 8 + 2 * LINE_HEIGHT;
const BRACKET_BAND = 26;
const LINE_GAP = 14;
const GAP_IN_PART = 10;
const GAP_BETWEEN_PARTS = 22;
const LONGEST_ROW = 32;

/** About the width of a label at 13 px in the narrow interface face. */
export function textWidth(text: string): number {
  return Math.ceil(text.length * 6.4) + 2;
}

export function pitchFor(width: number): number {
  if (width >= 720) return 8;
  if (width >= 560) return 7;
  // Phones keep 5 px cells: the widest grids (16 x 16 patches) still fit two to a line.
  if (width >= 280) return 6;
  return 5;
}

export function bracketText(part: Part): string {
  return `${part.label}, ${part.detail ?? formatCount(part.n)}`;
}

export function blockNote(block: Block): string {
  return block.note ?? formatCount(block.n);
}

export function layoutPanel(panel: Panel, width: number): Geometry {
  const pitch = pitchFor(width);
  const cell = pitch - 1;
  const rowCells = Math.max(
    8,
    Math.min(LONGEST_ROW, Math.floor(width / pitch)),
  );
  const bracketBand = panel.parts.some((part) => part.bracket)
    ? BRACKET_BAND
    : 0;
  const raise = panel.blocks.some((block) => block.styles.includes("key"))
    ? Math.max(3, Math.round(cell * 0.6))
    : 0;
  const under = panel.blocks.some((block) => block.targets?.some(Boolean))
    ? 5
    : 0;

  interface Item {
    block: Block;
    cols: number;
    rows: number;
    w: number;
    h: number;
    slot: number;
    gap: number;
    x: number;
    line: number;
  }

  const items: Item[] = [];
  let x = 0;
  let line = 0;
  for (const block of panel.blocks) {
    const cols = block.side ?? Math.min(block.n, rowCells);
    const rows = block.side ?? Math.ceil(block.n / cols);
    const w = cols * pitch - 1;
    const h = rows * pitch - 1;
    const part = panel.parts[block.part];
    const alone =
      panel.blocks.filter((b) => b.part === block.part).length === 1;
    let slot = Math.max(w, textWidth(block.label), textWidth(blockNote(block)));
    if (part.bracket && alone)
      slot = Math.max(slot, textWidth(bracketText(part)));
    const previous = items[items.length - 1];
    let gap =
      previous && previous.line === line
        ? previous.block.part === block.part
          ? GAP_IN_PART
          : GAP_BETWEEN_PARTS
        : 0;
    if (previous && x + gap + slot > width) {
      line += 1;
      x = 0;
      gap = 0;
    }
    items.push({ block, cols, rows, w, h, slot, gap, x: x + gap, line });
    x += gap + slot;
  }

  const lines = line + 1;
  const tops: number[] = [];
  let top = 0;
  for (let l = 0; l < lines; l += 1) {
    tops.push(top);
    const tallest = Math.max(
      0,
      ...items.filter((item) => item.line === l).map((item) => item.h),
    );
    top +=
      bracketBand +
      raise +
      tallest +
      under +
      LABEL_BAND +
      (l < lines - 1 ? LINE_GAP : 0);
  }

  const placed: PlacedBlock[] = items.map((item) => ({
    block: item.block,
    x: item.x,
    y: tops[item.line] + bracketBand + raise,
    cols: item.cols,
    rows: item.rows,
    w: item.w,
    h: item.h,
  }));

  const brackets: Bracket[] = [];
  panel.parts.forEach((part, index) => {
    if (!part.bracket) return;
    let first = true;
    for (let l = 0; l < lines; l += 1) {
      const onLine = items.filter(
        (item) => item.block.part === index && item.line === l,
      );
      if (onLine.length === 0) continue;
      const x1 = Math.min(...onLine.map((item) => item.x));
      const x2 = Math.max(...onLine.map((item) => item.x + item.w));
      brackets.push({
        key: `${index}:${l}`,
        x1,
        x2,
        y: tops[l] + 17,
        label: first ? bracketText(part) : null,
      });
      first = false;
    }
  });

  return {
    width,
    height: Math.max(top, 1),
    pitch,
    cell,
    raise,
    under,
    placed,
    brackets,
  };
}

/** The top-left corner of the cell of a position, or null when the position is not drawn. */
export function cellAt(
  geometry: Geometry,
  index: number,
): { x: number; y: number; placed: PlacedBlock } | null {
  for (const placed of geometry.placed) {
    const offset = index - placed.block.start;
    if (offset >= 0 && offset < placed.block.n) {
      return {
        x: placed.x + (offset % placed.cols) * geometry.pitch,
        y: placed.y + Math.floor(offset / placed.cols) * geometry.pitch,
        placed,
      };
    }
  }
  return null;
}

/** The position under a point of the drawing, or null between cells' blocks. */
export function hitTest(
  geometry: Geometry,
  px: number,
  py: number,
): number | null {
  const { pitch } = geometry;
  for (const placed of geometry.placed) {
    if (px < placed.x - 1 || py < placed.y - 1) continue;
    if (
      px > placed.x + placed.cols * pitch ||
      py > placed.y + placed.rows * pitch
    )
      continue;
    const col = Math.min(
      placed.cols - 1,
      Math.max(0, Math.floor((px - placed.x) / pitch)),
    );
    const row = Math.min(
      placed.rows - 1,
      Math.max(0, Math.floor((py - placed.y) / pitch)),
    );
    const offset = row * placed.cols + col;
    if (offset < placed.block.n) return placed.block.start + offset;
  }
  return null;
}
