"use client";

import { useEffect, useRef, useState } from "react";
import { MACHINES } from "@/data/labels";
import type { Machine } from "@/data/types";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  REFERENCE,
  Segmented,
  Slider,
  Toggle,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { Chart, COMPARE_DASH } from "./Chart";
import { DataTable } from "./DataTable";
import { Key, type KeyItem } from "./Key";
import { CUBE_WIDTH_MM, CYLINDERS, FINGER_SPAN_MM, GEOMETRY_SOURCE } from "./geometry";
import {
  MACHINE_ORDER,
  OBJECT_LINES,
  describe,
  inSentence,
  episodesPerObject,
  identicalAcrossMachines,
  machineName,
  nameList,
  nearestOffset,
  offsetsOf,
  percentAt,
  rowAt,
  table,
} from "./model";
import { PlanCell } from "./PlanCell";

const info = FIGURES.tolerance;

/** The offset the figure opens at: the chapters' "within 2 cm", or the measured offset nearest to it. */
const OPENING_OFFSET_MM = 20;
/** Time on each offset while playing. Longer than the gripper's 500 ms move. */
const BEAT_MS = 1100;

/** "hex nut 70%, cube 93%, can 29%, T block 98%". */
function readout(machine: Machine, offsetMm: number): string {
  const row = rowAt(machine, offsetMm);
  return OBJECT_LINES.map((object) => `${inSentence(object.short)} ${describe(row, object.id)}`).join(", ");
}

/**
 * The notebook's account of the difference between the builds, with the
 * columns that differ found by comparing the tables, not typed in.
 */
function cylinderSentence(): string {
  if (CYLINDERS.length === 0) return "";
  const shapes = `${capitalise(nameList(CYLINDERS))} ${CYLINDERS.length > 1 ? "have cylindrical collision shapes" : "has a cylindrical collision shape"}, the lab notebook says`;
  if (MACHINE_ORDER.length < 2 || DIFFERING.length === 0) return `${shapes}.`;
  const same = DIFFERING.length === CYLINDERS.length && DIFFERING.every((object) => CYLINDERS.includes(object));
  const differ = same
    ? `, and ${CYLINDERS.length > 1 ? "theirs are the columns" : "its is the column"} that ${CYLINDERS.length > 1 ? "differ" : "differs"} between the simulator builds`
    : `; the columns of ${nameList(DIFFERING)} differ between the simulator builds`;
  return `${shapes}${differ}. The build is the one known difference between the machines; it has not been isolated as the cause.`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The chart's text alternative: every measured point of every curve. */
function chartLabel(machine: Machine, compare: Machine[]): string {
  const curves = (of: Machine) => {
    const rows = [...table(of).rows].sort((a, b) => a.offsetMm - b.offsetMm);
    const curve = (column: (typeof OBJECT_LINES)[number]["id"] | "all", name: string) =>
      `${name}: ${rows.map((row) => `${percentAt(row, column)}% at ${row.offsetMm} mm`).join(", ")}.`;
    return [...OBJECT_LINES.map((object) => curve(object.id, object.short)), curve("all", "All four objects")].join(" ");
  };
  const main = `Grasp success of the scripted expert against the sideways offset of its grasp point, one line per object, ${machineName(machine)} (${table(machine).simulator}). ${curves(machine)}`;
  const others = compare.map((other) => `Dotted, ${machineName(other)} (${table(other).simulator}): ${curves(other)}`);
  return [main, ...others].join(" ");
}

/** The objects whose columns are the same on every build, compared cell by cell. */
const IDENTICAL = identicalAcrossMachines();
const DIFFERING = OBJECT_LINES.filter((object) => !IDENTICAL.includes(object));

export default function ToleranceFigure({ caption }: FigureProps) {
  const [machine, setMachine] = useState<Machine>(MACHINE_ORDER[0]);
  const [pickedMm, setOffsetMm] = useState(() => nearestOffset(MACHINE_ORDER[0], OPENING_OFFSET_MM));
  // Always a measured offset of the table shown, even after the data is refreshed under an open page.
  const offsetMm = nearestOffset(machine, pickedMm);
  const [comparing, setComparing] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [playing, setPlaying] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const onScreen = useInView(root, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const offsets = offsetsOf(machine);
  const index = Math.max(0, offsets.indexOf(offsetMm));
  const lastIndex = offsets.length - 1;
  const compare = comparing ? MACHINE_ORDER.filter((other) => other !== machine) : [];

  // Playing walks the offsets one measured step at a time, only on screen, in a visible tab, never under reduced motion.
  const running = playing && index < lastIndex && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setOffsetMm((current) => {
        const list = offsetsOf(machine);
        const at = list.indexOf(nearestOffset(machine, current));
        return list[Math.min(list.length - 1, at + 1)] ?? current;
      });
    }, BEAT_MS);
    return () => clearInterval(timer);
  }, [running, machine]);

  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    if (index >= lastIndex) setOffsetMm(offsets[0]);
    setPlaying(true);
  };

  const pickOffset = (next: number) => {
    setPlaying(false);
    setOffsetMm(next);
  };

  const data = table(machine);
  const allFour = (of: Machine) => {
    const row = rowAt(of, offsetMm);
    return percentAt(row, "all") === undefined ? "" : `; all four ${describe(row, "all")}`;
  };
  const status =
    `At ${offsetMm} mm on ${MACHINES[machine].name}: ${readout(machine, offsetMm)}${allFour(machine)}.` +
    compare.map((other) => ` ${machineName(other)}: ${readout(other, offsetMm)}${allFour(other)}.`).join("");

  const keyItems: KeyItem[] = [
    ...OBJECT_LINES.map((object) => ({ label: object.short, color: object.style.color, shape: object.style.shape })),
    { label: "All four objects", color: REFERENCE.color, dash: REFERENCE.dash },
    ...compare.map((other) => ({ label: `${machineName(other)} (${table(other).simulator})`, color: REFERENCE.color, dash: COMPARE_DASH })),
  ];

  const perObject = episodesPerObject(machine);
  const hasCounts = data.rows.some((row) => row.counts);
  const note = [
    `The scripted expert with a fixed sideways offset added to its grasp point, in a random direction; ${data.episodesPerOffset} episodes per offset` +
      (perObject ? `, of which ${perObject}` : "") +
      `, measured on ${MACHINES[machine].label} with ${data.simulator}.`,
    hasCounts
      ? "Whiskers and the bars under each object: Wilson 95% intervals of the counts."
      : "The notebook gives this build as percentages only, so it has no intervals.",
    `In the plan views only the cube is to scale: its ${CUBE_WIDTH_MM} mm collision box and the ${FINGER_SPAN_MM} mm span of the open fingers are given in the chapter \u201c${GEOMETRY_SOURCE}\u201d. No source gives the size of the other objects, so they are thinner outlines drawn at the cube's width, each labelled, and the direction of the offset is one of many.`,
    cylinderSentence(),
    compare.length > 0 && IDENTICAL.length > 0
      ? `The ${IDENTICAL.length > 1 ? "columns" : "column"} of ${nameList(IDENTICAL)} ${IDENTICAL.length > 1 ? "are" : "is"} identical on ${MACHINE_ORDER.length > 2 ? "every build" : "both builds"}, so ${IDENTICAL.length > 1 ? "their" : "its"} dotted ${IDENTICAL.length > 1 ? "curves lie" : "curve lies"} under the solid ${IDENTICAL.length > 1 ? "ones" : "one"}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const animate = !reducedMotion;

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      status={status}
      note={note}
      controls={
        <>
          <PlayButton playing={running} ended={index >= lastIndex} onToggle={togglePlay} className="motion-reduce:hidden" />
          <Slider
            label="Offset"
            min={0}
            max={lastIndex}
            value={index}
            onChange={(next) => pickOffset(offsets[next] ?? offsetMm)}
            format={(value) => `${offsets[value] ?? offsetMm} mm`}
          />
          {MACHINE_ORDER.length > 1 ? (
            <>
              <Segmented
                label="Measured on"
                showLabel
                options={MACHINE_ORDER.map((value) => ({ value, label: machineName(value) }))}
                value={machine}
                onChange={(next) => {
                  setMachine(next);
                  setOffsetMm(nearestOffset(next, offsetMm));
                }}
              />
              <Toggle label="Compare builds" checked={comparing} onChange={setComparing} />
            </>
          ) : null}
          <ControlButton aria-expanded={showTable} onClick={() => setShowTable((shown) => !shown)}>
            {showTable ? "Hide table" : "Show as table"}
          </ControlButton>
        </>
      }
    >
      <div ref={root}>
        <Key items={keyItems} />
        <div className="mt-2">
          <Chart
            machine={machine}
            compare={compare}
            offsetMm={offsetMm}
            onPick={pickOffset}
            label={chartLabel(machine, compare)}
            animate={animate}
          />
        </div>

        <p className="m-0 mt-1 label text-ink-muted">Click, tap or drag across the chart to pick an offset; with a mouse, hovering previews one.</p>

        <p className="m-0 mt-5 label text-ink-muted">
          The gripper {offsetMm} mm from the expert&apos;s grasp point, seen from above, and how often the grasp still lifts
          the object
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          {OBJECT_LINES.map((object) => (
            <PlanCell
              key={object.id}
              object={object}
              machine={machine}
              compare={compare}
              offsetMm={offsetMm}
              animate={animate}
            />
          ))}
        </ul>

        {showTable ? <DataTable machine={machine} offsetMm={offsetMm} /> : null}
      </div>
    </FigureFrame>
  );
}
