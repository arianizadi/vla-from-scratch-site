/**
 * Grasp tolerance: the scripted expert with a fixed sideways offset added to
 * its grasp point, in a random direction, and how often the grasp still
 * succeeds, per object.
 *
 *   tolerance("B")           the table measured on machine B, from the export, with counts
 *   tolerance("A")           the table measured on machine A, from the lab notebook
 *   toleranceAt("B", 20)     one row: success at a 20 mm offset
 *
 * The two machines differ in the simulator build, and the can and the hex nut
 * are much easier to grasp on machine B. All second-round results come from
 * machine B.
 */

import generated from "./generated/tolerance.json";
import { fixed } from "./format";
import { simulatorMachineB, toleranceMachineA } from "./notebook";
import type { Count, Machine, ObjectId, Task } from "./types";

type Column = ObjectId | "all";

/** The columns in the notebook's order. */
export const TOLERANCE_COLUMNS: Column[] = ["cube", "tblock", "can", "hex", "all"];

export interface ToleranceRow {
  /** The sideways offset of the grasp point, in mm. */
  offsetMm: number;
  /** Success in percent, per object and for all four together: whole numbers, as the notebook prints them. */
  percent: Record<Column, number>;
  /** The successes and episodes behind them, where the export has them (machine B). */
  counts?: Record<Column, Count>;
}

export interface ToleranceTable {
  machine: Machine;
  task: Task;
  /** The simulator build, as the notebook names it. */
  simulator: string;
  episodesPerOffset: number;
  /** The notebook section the table is in. */
  section: string;
  rows: ToleranceRow[];
}

const measured = generated.offsets as unknown as ({ offsetMm: number } & Record<Column, Count>)[];

const tables: Record<Machine, ToleranceTable> = {
  A: {
    machine: "A",
    task: toleranceMachineA.task,
    simulator: toleranceMachineA.simulator,
    episodesPerOffset: toleranceMachineA.episodesPerOffset,
    section: toleranceMachineA.section,
    rows: toleranceMachineA.rows.map(({ offsetMm, cube, tblock, can, hex, all }) => ({
      offsetMm,
      percent: { cube, tblock, can, hex, all },
    })),
  },
  B: {
    machine: "B",
    task: generated.task as Task,
    simulator: simulatorMachineB,
    episodesPerOffset: generated.episodesPerOffset,
    section: generated.section,
    rows: measured.map(({ offsetMm, ...counts }) => ({
      offsetMm,
      percent: Object.fromEntries(
        TOLERANCE_COLUMNS.map((column) => [column, Number(fixed((100 * counts[column].successes) / counts[column].episodes))]),
      ) as Record<Column, number>,
      counts,
    })),
  },
};

/** The grasp-tolerance table of a machine. Machine B is where the second-round results were measured. */
export function tolerance(machine: Machine = "B"): ToleranceTable {
  return tables[machine];
}

/** One row of a table: the success rates at an offset. */
export function toleranceAt(machine: Machine, offsetMm: number): ToleranceRow | undefined {
  return tables[machine].rows.find((row) => row.offsetMm === offsetMm);
}
