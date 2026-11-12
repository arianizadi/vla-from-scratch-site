/**
 * Geometry of the wide timeline: years left to right, one lane per strand.
 *
 * The year axis is ordered but not linear. Most entries fall in the last few
 * years, so equal widths per year would squeeze them into a corner and leave
 * the early decades empty. Instead each year with entries is given the room
 * its labels need: a year is placed far enough after the earlier ones that a
 * label does not run into the entry two places after it in the same lane (so
 * a lane needs about two rows, plus one for each further entry of one year).
 * A year without entries takes a narrow fixed width, and a stretch of more than
 * MAX_GAP_YEARS without one is cut out and drawn as an axis break. The whole
 * axis is then scaled to the stage, keeping every label inside it: a label
 * always runs to the right of its dot.
 *
 * Inside a lane, labels that would still overlap go to a further row; the
 * lane is as tall as it needs.
 */

import { STRANDS, YEARS, type Entry, type StrandId } from "./entries";

/** A gap between two consecutive years with entries longer than this is cut out of the axis. */
export const MAX_GAP_YEARS = 5;

export const ROW_HEIGHT = 26;
export const LANE_HEADER = 22;
export const LANE_GAP = 10;
export const AXIS_HEIGHT = 30;
/** The dot sits this far inside the entry's button, from its left edge. */
export const DOT_INSET = 10;
/** Space kept between two labels in one row. */
const LABEL_GAP = 8;
/** Smallest distance between two years with entries: room for their tick labels. */
const MIN_YEAR_STEP = 44;
/** Width of a year without entries inside an unbroken stretch. */
const EMPTY_YEAR = 10;
/** Width of a cut-out stretch. */
const BREAK_WIDTH = 30;
/** Rows a lane is planned for when spacing the years (more where one year has more entries in it). */
const PLANNED_ROWS = 2;

/** Width of a label's button in px, from the name alone: used until the real widths are measured. */
export function estimateLabelWidth(name: string): number {
  return Math.ceil(name.length * 7.1) + DOT_INSET + 20;
}

/** Width of an entry's button, given the measured width of its name (text and padding) when there is one. */
export type LabelWidth = (entry: Entry) => number;

export interface AxisBreak {
  /** Last year before and first year after the break. */
  before: number;
  after: number;
  /** Centre of the break, in px. */
  x: number;
}

export interface TimeScale {
  x: (year: number) => number;
  breaks: AxisBreak[];
  /** Years with entries: they get a labelled tick. */
  ticks: number[];
  /** Years without entries inside an unbroken stretch: a short unlabelled tick. */
  minorTicks: number[];
}

/**
 * Positions of the years in px before scaling, from 0: each year with entries
 * far enough after the earlier ones for the labels in every lane (see the file
 * comment), each empty year EMPTY_YEAR wide, a long gap BREAK_WIDTH.
 */
function plannedPositions(entries: readonly Entry[], width: LabelWidth): { at: Map<number, number>; breaks: { before: number; after: number; at: number }[]; empty: Map<number, number> } {
  const lanes = STRANDS.map((strand) =>
    entries.filter((entry) => entry.strand === strand.id).sort((a, b) => a.year - b.year),
  );
  const rowsFor = lanes.map((lane) => {
    const perYear = new Map<number, number>();
    for (const entry of lane) perYear.set(entry.year, (perYear.get(entry.year) ?? 0) + 1);
    return Math.max(PLANNED_ROWS, ...perYear.values());
  });

  const at = new Map<number, number>();
  const empty = new Map<number, number>();
  const breaks: { before: number; after: number; at: number }[] = [];
  YEARS.forEach((year, index) => {
    let position = 0;
    if (index > 0) {
      const previous = YEARS[index - 1];
      const start = at.get(previous) ?? 0;
      const gap = year - previous;
      if (gap > MAX_GAP_YEARS) {
        breaks.push({ before: previous, after: year, at: start + MIN_YEAR_STEP / 2 + BREAK_WIDTH / 2 });
        position = start + MIN_YEAR_STEP + BREAK_WIDTH;
      } else {
        for (let y = previous + 1; y < year; y += 1) empty.set(y, start + MIN_YEAR_STEP / 2 + (y - previous - 0.5) * EMPTY_YEAR);
        position = start + MIN_YEAR_STEP + (gap - 1) * EMPTY_YEAR;
      }
    }
    lanes.forEach((lane, laneIndex) => {
      const rows = rowsFor[laneIndex];
      lane.forEach((entry, i) => {
        if (entry.year !== year) return;
        const before = lane[i - rows];
        if (before && before.year < year) {
          position = Math.max(position, (at.get(before.year) ?? 0) + width(before) + LABEL_GAP);
        }
      });
    });
    at.set(year, position);
  });
  return { at, breaks, empty };
}

/** The time scale over YEARS, from `left` to the stage width, with every label kept inside the stage. */
export function timeScale(left: number, stageWidth: number, entries: readonly Entry[], width: LabelWidth): TimeScale {
  const { at, breaks, empty } = plannedPositions(entries, width);
  // The largest factor at which every label still ends inside the stage.
  let factor = Infinity;
  for (const entry of entries) {
    const planned = at.get(entry.year) ?? 0;
    if (planned > 0) factor = Math.min(factor, (stageWidth - 2 - left - width(entry) + DOT_INSET) / planned);
  }
  if (!Number.isFinite(factor) || factor <= 0) factor = 1;

  const scaled = (planned: number) => left + planned * factor;
  const x = (year: number) => {
    const known = at.get(year) ?? empty.get(year);
    if (known !== undefined) return scaled(known);
    const before = YEARS.filter((y) => y < year).pop();
    return scaled(before === undefined ? 0 : (at.get(before) ?? 0));
  };

  return {
    x,
    breaks: breaks.map((item) => ({ before: item.before, after: item.after, x: scaled(item.at) })),
    ticks: [...YEARS],
    minorTicks: [...empty.keys()],
  };
}

export interface PlacedEntry {
  entry: Entry;
  /** Dot centre. */
  x: number;
  y: number;
  /** Left edge and width of the button. */
  left: number;
  width: number;
}

export interface PlacedLane {
  id: StrandId;
  label: string;
  top: number;
  height: number;
}

export interface WideLayout {
  width: number;
  height: number;
  lanes: PlacedLane[];
  entries: Map<string, PlacedEntry>;
  scale: TimeScale;
  /** Top of the axis line. */
  axisY: number;
}

export function wideLayout(width: number, entries: readonly Entry[], labelWidth: LabelWidth): WideLayout {
  const left = DOT_INSET + 2;
  const scale = timeScale(left, width, entries, labelWidth);

  const lanes: PlacedLane[] = [];
  const placed = new Map<string, PlacedEntry>();
  let top = 0;

  for (const strand of STRANDS) {
    const members = entries
      .filter((entry) => entry.strand === strand.id)
      .map((entry, index) => {
        const x = scale.x(entry.year);
        return { entry, index, x, w: labelWidth(entry), start: x - DOT_INSET };
      })
      .sort((a, b) => a.start - b.start || a.index - b.index);

    // Greedy rows: each label goes into the first row where it does not overlap the one before it.
    const rowEnds: number[] = [];
    const rows = new Map<string, number>();
    for (const member of members) {
      let row = rowEnds.findIndex((end) => end + LABEL_GAP <= member.start);
      if (row === -1) {
        row = rowEnds.length;
        rowEnds.push(0);
      }
      rowEnds[row] = member.start + member.w;
      rows.set(member.entry.id, row);
    }

    const rowCount = Math.max(1, rowEnds.length);
    const height = LANE_HEADER + rowCount * ROW_HEIGHT;
    lanes.push({ id: strand.id, label: strand.label, top, height });

    for (const member of members) {
      const row = rows.get(member.entry.id) ?? 0;
      placed.set(member.entry.id, {
        entry: member.entry,
        x: member.x,
        y: top + LANE_HEADER + row * ROW_HEIGHT + ROW_HEIGHT / 2,
        left: member.start,
        width: member.w,
      });
    }
    top += height + LANE_GAP;
  }

  const axisY = top;
  return { width, height: axisY + AXIS_HEIGHT, lanes, entries: placed, scale, axisY };
}

/** y of the rule under a lane: where a line from a part of that strand that is not on the timeline starts. */
export function laneBottom(lane: PlacedLane): number {
  return lane.top + lane.height + LANE_GAP - 5;
}

/** A curve from the earlier entry's dot to the later one's, leaving and arriving horizontally. */
export function linkPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  if (Math.abs(dx) < 4) {
    // Same year: bow out to the left so the line does not run through the labels.
    const bow = 18 + Math.min(24, Math.abs(y2 - y1) / 4);
    return `M${x1},${y1} C${x1 - bow},${y1} ${x2 - bow},${y2} ${x2},${y2}`;
  }
  const c = dx / 2;
  return `M${x1},${y1} C${x1 + c},${y1} ${x2 - c},${y2} ${x2},${y2}`;
}

/** A curve from a point on a lane's edge down (or up) into an entry's dot, arriving horizontally. */
export function stubPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x1 + (x2 - x1) / 3},${y2} ${x2},${y2}`;
}

/** A curve from an earlier row to a later one in the narrow, top-to-bottom layout. */
export function linkPathVertical(x1: number, y1: number, x2: number, y2: number): string {
  const c = (y2 - y1) / 2;
  return `M${x1},${y1} C${x1},${y1 + c} ${x2},${y2 - c} ${x2},${y2}`;
}
