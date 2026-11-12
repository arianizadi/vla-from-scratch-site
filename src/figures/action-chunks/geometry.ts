/**
 * Where everything in the timeline sits, in px of the drawing's own width.
 *
 * Time runs to the right, one cell per control step. Every chunk is a row of
 * cells that begins at the step it is planned at, so successive chunks step
 * down and to the right. The rows always share the same box: with one action
 * executed per chunk there is a row for every control step and the rows are
 * thin; with the whole chunk executed there are two or three.
 */

/** From this width on the wide window is drawn. Matches the container query in index.tsx. */
export const WIDE_FROM = 400;

const WIDE = { steps: 40, box: 200, side: 12 } as const;
const NARROW = { steps: 30, box: 168, side: 10 } as const;

/** Space above the first row: two dimension lines with their labels. */
const TOP = 54;
/** The overall dimension (the whole chunk) and the split one (executed, discarded). */
const OVERALL_Y = 19;
const SPLIT_Y = 42;
/** Tallest a cell is drawn. */
const CELL_MAX = 16;

/** Control steps the timeline shows at a given width of the drawing. */
export function windowSteps(width: number): number {
  return width >= WIDE_FROM ? WIDE.steps : NARROW.steps;
}

/** Height of the drawing at a given width. */
export function drawingHeight(width: number): number {
  return TOP + (width >= WIDE_FROM ? WIDE.box : NARROW.box) + 56;
}

export interface ChunkRow {
  /** 0 for the first chunk of the episode. */
  index: number;
  /** The control step it is planned at; its first action runs in that step. */
  start: number;
  /** Top of its cells. */
  y: number;
  /** Cells that fall inside the window. */
  cells: number;
}

export interface Layout {
  width: number;
  height: number;
  /** Control steps in the window. */
  steps: number;
  /** x of the boundary before control step `step`: the moment `step` steps are done. */
  x: (step: number) => number;
  /** Width of one control step. */
  cell: number;
  /** Space between two cells of a row. */
  gap: number;
  cellHeight: number;
  rows: ChunkRow[];
  /** Top of the first row and bottom of the last. */
  top: number;
  bottom: number;
  /** y of the time axis. */
  axis: number;
  overallY: number;
  splitY: number;
}

export function layout(width: number, executed: number, chunk: number): Layout {
  const wide = width >= WIDE_FROM;
  const { steps, box, side } = wide ? WIDE : NARROW;
  const cell = (width - 2 * side) / steps;
  const x = (step: number) => side + step * cell;

  const count = Math.ceil(steps / executed);
  // A row and the space under it share box / count; a cell is never much taller than it is wide.
  const share = box / count;
  const cellHeight = Math.min(CELL_MAX, Math.max(8, cell * 1.3), share >= 20 ? CELL_MAX : share * 0.78);
  const pitch = count > 1 ? (box - cellHeight) / (count - 1) : 0;

  const rows: ChunkRow[] = Array.from({ length: count }, (_, index) => {
    const start = index * executed;
    return { index, start, y: TOP + index * pitch, cells: Math.min(chunk, steps - start) };
  });

  const axis = TOP + box + 12;
  return {
    width,
    height: drawingHeight(width),
    steps,
    x,
    cell,
    gap: cell >= 10 ? 2 : 1.5,
    cellHeight,
    rows,
    top: TOP,
    bottom: TOP + box,
    axis,
    overallY: OVERALL_Y,
    splitY: SPLIT_Y,
  };
}

/** The dash pattern of a discarded cell; undefined where rows are too thin to carry one (a lighter outline instead). */
export function cutDash(g: Layout): string | undefined {
  return g.cellHeight >= 9 ? "3 2" : undefined;
}

/** Rough width of a label set in the 13px condensed face of the plate, for deciding where it fits. */
export function textWidth(text: string): number {
  return text.length * 5.3;
}
