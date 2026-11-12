/**
 * The figure's model: the grasp-tolerance tables of the data module, arranged
 * for drawing. Nothing here states a number; every value is read from
 * `tolerance(machine)` and the labels from `labels.ts`.
 */

import { formatCount } from "@/data/format";
import { MACHINES, OBJECTS, OBJECT_IDS } from "@/data/labels";
import { tolerance, type ToleranceRow, type ToleranceTable } from "@/data/tolerance";
import type { Count, Machine, ObjectId } from "@/data/types";
import { OBJECT_SERIES, type SeriesStyle } from "@/figures/kit";

/** The machine the data module reports by default (the one the second-round results come from) first. */
const DEFAULT_MACHINE: Machine = tolerance().machine;
export const MACHINE_ORDER: Machine[] = [
  DEFAULT_MACHINE,
  ...(Object.keys(MACHINES) as Machine[]).filter((machine) => machine !== DEFAULT_MACHINE),
];

export interface ObjectLine {
  id: ObjectId;
  /** "Hex nut". */
  short: string;
  /** "blue hex nut". */
  label: string;
  style: SeriesStyle;
}

/** A short name inside a sentence: "hex nut", but "T block" keeps its capital. */
export function inSentence(short: string): string {
  return /^[A-Z][a-z]/.test(short) ? short.charAt(0).toLowerCase() + short.slice(1) : short;
}

/** The objects in the order every chart uses, with their fixed colour and marker. */
export const OBJECT_LINES: ObjectLine[] = OBJECT_IDS.map((id) => ({
  id,
  short: OBJECTS[id].short,
  label: OBJECTS[id].label,
  style: OBJECT_SERIES[OBJECTS[id].series],
}));

export function table(machine: Machine): ToleranceTable {
  return tolerance(machine);
}

/** The offsets a table measured, in mm, in increasing order. */
export function offsetsOf(machine: Machine): number[] {
  return tolerance(machine)
    .rows.map((row) => row.offsetMm)
    .sort((a, b) => a - b);
}

/** Every offset either table measured, for the shared x axis. */
export const ALL_OFFSETS: number[] = [...new Set(MACHINE_ORDER.flatMap(offsetsOf))].sort((a, b) => a - b);

export function rowAt(machine: Machine, offsetMm: number): ToleranceRow | undefined {
  return tolerance(machine).rows.find((row) => row.offsetMm === offsetMm);
}

/** The measured offset of a table nearest to a value: keeps the slider on a measured point when the table changes or is refreshed. */
export function nearestOffset(machine: Machine, offsetMm: number): number {
  const offsets = offsetsOf(machine);
  return offsets.reduce(
    (best, candidate) => (Math.abs(candidate - offsetMm) < Math.abs(best - offsetMm) ? candidate : best),
    offsets[0] ?? 0,
  );
}

/** Success in percent of one object (or of all four) at one offset, as the notebook prints it. */
export function percentAt(row: ToleranceRow | undefined, column: ObjectId | "all"): number | undefined {
  return row?.percent[column];
}

export function countAt(row: ToleranceRow | undefined, column: ObjectId | "all"): Count | undefined {
  return row?.counts?.[column];
}

/** "70%", or "70% (50/71)" where the table has the counts. */
export function describe(row: ToleranceRow | undefined, column: ObjectId | "all"): string {
  const percent = percentAt(row, column);
  if (percent === undefined) return "not measured";
  const count = countAt(row, column);
  return count ? `${percent}% (${formatCount(count.successes, count.episodes)})` : `${percent}%`;
}

const Z = 1.959964;

/**
 * Wilson 95% interval of a success count, as shares between 0 and 1: the
 * interval the lab notebook uses for every success rate. Drawn as a whisker,
 * never printed (the notebook prints no interval for this table).
 */
export function wilson({ successes, episodes }: Count): [number, number] {
  if (episodes <= 0) return [0, 1];
  const p = successes / episodes;
  const z2 = Z * Z;
  const denominator = 1 + z2 / episodes;
  const centre = (p + z2 / (2 * episodes)) / denominator;
  const half = (Z * Math.sqrt((p * (1 - p)) / episodes + z2 / (4 * episodes * episodes))) / denominator;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/**
 * The objects whose column is the same on every machine at every offset the
 * tables share, compared cell by cell. Empty when there is one machine or the
 * tables share no offset.
 */
export function identicalAcrossMachines(): ObjectLine[] {
  if (MACHINE_ORDER.length < 2) return [];
  const shared = offsetsOf(MACHINE_ORDER[0]).filter((offset) =>
    MACHINE_ORDER.every((machine) => rowAt(machine, offset) !== undefined),
  );
  if (shared.length === 0) return [];
  return OBJECT_LINES.filter((object) =>
    shared.every((offset) => {
      const values = MACHINE_ORDER.map((machine) => percentAt(rowAt(machine, offset), object.id));
      return values.every((value) => value !== undefined && value === values[0]);
    }),
  );
}

/** "the cube and the T block", "the hex nut, the cube and the can". */
export function nameList(objects: readonly ObjectLine[]): string {
  const names = objects.map((object) => `the ${inSentence(object.short)}`);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
}

/** "Machine B". */
export function machineName(machine: Machine): string {
  const { name } = MACHINES[machine];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** The episodes behind each object's column, where the table has counts: "71 name the hex nut, 75 the cube, ...". */
export function episodesPerObject(machine: Machine): string | undefined {
  const rows = tolerance(machine).rows;
  const episodes = OBJECT_LINES.map((object) => {
    const values = new Set(rows.map((row) => row.counts?.[object.id]?.episodes));
    const [only] = [...values];
    return values.size === 1 && only !== undefined ? only : undefined;
  });
  if (episodes.some((value) => value === undefined)) return undefined;
  const parts = OBJECT_LINES.map((object, index) =>
    index === 0 ? `${episodes[index]} name the ${inSentence(object.short)}` : `${episodes[index]} the ${inSentence(object.short)}`,
  );
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
}
