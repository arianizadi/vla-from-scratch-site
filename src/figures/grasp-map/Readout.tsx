"use client";

import { formatCount, formatMm, formatPercent, formatSlope } from "@/data/format";
import { OBJECTS, OBJECT_IDS, instructionFor } from "@/data/labels";
import { setup } from "@/data/notebook";
import type { Evaluation, Moved } from "@/data/types";
import { FailMark, seriesOf } from "./Map";
import type { Dot, Reference } from "./model";
import { Marker } from "@/figures/kit";

export interface Stat {
  label: string;
  value: string;
  /** A line under the value: the chance level, what the number means. */
  hint?: string;
  /** The number that goes with what the map is centred on. */
  active?: boolean;
}

/**
 * The evaluation's numbers: success, how often the gripper closed at the
 * named object, the median distances, the slope. The counts are the lab
 * notebook's; the rest are computed from the same evaluation's export, and the
 * notebook prints some of them, not all (the figure's note says so).
 * For a moved object, the counts over the episodes in which it could be moved.
 */
export function statsFor(evaluation: Evaluation | undefined, moved: Moved | null, reference: Reference): Stat[] {
  if (moved) {
    const stats: Stat[] = [
      { label: "Lifted", value: formatCount(moved.successes, moved.episodes), hint: "of the episodes in which it was moved" },
    ];
    if (moved.fromOldMm !== null) {
      stats.push({ label: "Median distance to where it stood", value: formatMm(moved.fromOldMm), active: reference === "named" });
    }
    if (moved.fromNewMm !== null) {
      stats.push({ label: "Median distance to where it was put", value: formatMm(moved.fromNewMm), active: reference === "moved_to" });
    }
    stats.push({ label: "Second attempt", value: formatCount(moved.retried, moved.episodes) });
    return stats;
  }
  if (!evaluation) return [];
  const stats: Stat[] = [{ label: "Lifted", value: formatCount(evaluation.successes, evaluation.episodes) }];
  if (evaluation.named !== null) {
    stats.push({
      label: "Closed at the named object",
      value: formatPercent(evaluation.named),
      hint: `chance ${setup.chance.percent}%`,
    });
  }
  if (evaluation.missMm !== null) {
    stats.push({ label: "Median distance to the named object", value: formatMm(evaluation.missMm), active: reference === "named" });
  }
  if (evaluation.missNearestMm !== null) {
    stats.push({
      label: "Median distance to the nearest object",
      value: formatMm(evaluation.missNearestMm),
      active: reference === "nearest",
    });
  }
  if (evaluation.within10 !== null) {
    stats.push({ label: "Within 10 mm of the named object", value: formatPercent(evaluation.within10) });
  }
  if (evaluation.slope !== null) {
    stats.push({ label: "Slope", value: formatSlope(evaluation.slope), hint: "1 follows the object, 0 ignores it" });
  }
  return stats;
}

export function Stats({ stats }: { stats: readonly Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="gm-stats">
      {stats.map((stat) => (
        <div key={stat.label} className={stat.active ? "gm-stat gm-stat-active" : "gm-stat"}>
          <dt>{stat.label}</dt>
          <dd>
            <span className="gm-stat-value">{stat.value}</span>
            {stat.hint ? <span className="gm-stat-hint">{stat.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The key: shape and colour give the named object; filled where it was lifted, hollow and slashed where it was not. */
export function Key() {
  return (
    <ul className="fig-legend gm-key" aria-label="Legend: shape and colour give the named object; a filled mark was lifted, a hollow slashed mark was not">
      <li className="gm-key-head">Named object</li>
      {OBJECT_IDS.map((id) => {
        const series = seriesOf(id);
        return (
          <li key={id}>
            <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">
              <Marker x={0} y={0} size={10} shape={series.shape} color={series.color} />
            </svg>
            {OBJECTS[id].short}
          </li>
        );
      })}
      <li className="gm-key-break">
        <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">
          <Marker x={0} y={0} size={10} shape="circle" color="var(--text-muted)" />
        </svg>
        Lifted
      </li>
      <li>
        <svg width={16} height={16} viewBox="-8 -8 16 16" aria-hidden="true" focusable="false">
          <FailMark size={10} shape="circle" color="var(--text-muted)" />
        </svg>
        Not lifted
      </li>
    </ul>
  );
}

/** One episode in words: its instruction, its outcome and where the gripper closed. */
export function episodeText(dot: Dot, disturbance: boolean): string {
  const object = OBJECTS[dot.target].label;
  const parts = [
    `Layout ${dot.seed}, “${instructionFor(dot.target)}”: ${dot.success ? "lifted" : "not lifted"}.`,
    `The gripper first closed ${formatMm(dot.toNamed)} from the ${object}${disturbance ? " where it stood" : ""}`,
  ];
  if (dot.toMovedTo !== null) parts[1] += `, ${formatMm(dot.toMovedTo)} from where it was put`;
  if (dot.nearest && dot.toNearest !== null) {
    parts[1] +=
      dot.nearest === dot.target
        ? dot.moved
          ? `; the nearest object was the ${object} itself, ${formatMm(dot.toNearest)} away.`
          : `; it was the nearest object.`
        : `; the nearest object was the ${OBJECTS[dot.nearest].label}, ${formatMm(dot.toNearest)} away.`;
  } else {
    parts[1] += ".";
  }
  if (dot.closes !== null && dot.closes >= 2) parts.push(`The gripper closed ${dot.closes} times.`);
  return parts.join(" ");
}
