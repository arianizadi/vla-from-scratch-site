"use client";

/**
 * Section 10: grasp tolerance on both machines, one panel per machine, one
 * line per object and the four together dashed. The values are
 * tolerance("B") and tolerance("A"), as the notebook prints them.
 */

import { useState } from "react";
import { FigureFrame, Legend, OBJECT_SERIES, REFERENCE, niceTicks } from "@/figures/kit";
import { MACHINES, OBJECTS, OBJECT_IDS } from "@/data/labels";
import { tolerance } from "@/data/tolerance";
import type { Machine } from "@/data/types";
import { Panels, SHARE_AXIS, type ChartPanel, type ChartSeries } from "./Panels";

const MACHINE_ORDER: Machine[] = ["B", "A"];
const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export function ToleranceChart() {
  const [active, setActive] = useState<number | null>(null);
  const tables = MACHINE_ORDER.map((machine) => tolerance(machine));
  const offsets = [...new Set(tables.flatMap((table) => table.rows.map((row) => row.offsetMm)))].sort((a, b) => a - b);
  const maxOffset = Math.max(1, ...offsets);

  const panels: ChartPanel[] = tables.map((table) => {
    const series: ChartSeries[] = [
      ...OBJECT_IDS.map((object) => {
        const style = OBJECT_SERIES[OBJECTS[object].series];
        return {
          id: object,
          label: style.label,
          color: style.color,
          shape: style.shape,
          points: table.rows.map((row) => ({ x: row.offsetMm, y: row.percent[object] / 100 })),
        };
      }),
      {
        id: "all",
        label: "All four",
        color: REFERENCE.color,
        shape: null,
        dashed: true,
        points: table.rows.map((row) => ({ x: row.offsetMm, y: row.percent.all / 100 })),
      },
    ];
    return {
      id: table.machine,
      title: `${capital(MACHINES[table.machine].label)}, ${table.simulator}`,
      series,
      y: SHARE_AXIS,
    };
  });

  const current = active !== null && active < offsets.length ? active : null;
  let status: string;
  if (current === null) {
    status = "Move the pointer over a panel, or focus the panels and use the arrow keys, to read one offset.";
  } else {
    const offset = offsets[current];
    status = `${offset} mm offset. ${tables
      .map((table) => {
        const row = table.rows.find((candidate) => candidate.offsetMm === offset);
        if (!row) return `${capital(MACHINES[table.machine].name)}: not measured`;
        return `${capital(MACHINES[table.machine].name)}: ${OBJECT_IDS.map((object) => `${OBJECTS[object].short} ${row.percent[object]}%`).join(", ")}, all ${row.percent.all}%`;
      })
      .join(". ")}.`;
  }

  const ticks = niceTicks(0, maxOffset, 6);

  return (
    <FigureFrame
      title="Grasp tolerance on both simulator builds"
      stamp="measured"
      caption={`The scripted expert with a fixed sideways offset added to its grasp point, in a random direction, ${tables[0].episodesPerOffset} episodes per offset, the same seeds on both machines.`}
      note="The simulator build is the one known difference between the two machines; it has not been isolated as the cause."
      status={status}
    >
      <Legend
        className="mb-3"
        items={[
          ...OBJECT_IDS.map((object) => {
            const style = OBJECT_SERIES[OBJECTS[object].series];
            return { label: style.label, color: style.color, shape: style.shape };
          }),
          { label: "All four", color: REFERENCE.color, shape: "line" as const, dashed: true },
        ]}
      />
      <Panels
        panels={panels}
        x={{ domain: [0, ticks[ticks.length - 1] ?? maxOffset], ticks, format: (value) => `${value}` }}
        xLabel="Sideways offset of the grasp point (mm)"
        stops={offsets}
        active={current}
        onActive={setActive}
        columns={2}
        height={180}
        label="Grasp tolerance, one panel per machine. Use the left and right arrow keys to move between offsets."
      />
    </FigureFrame>
  );
}
