"use client";

import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { fixed } from "@/data/format";
import { Axis, GridLines, Marker, REFERENCE, SERIES, extent, linePath, niceTicks, scaleLinear } from "@/figures/kit";
import { styles } from "./styles";
import { JOINTS, type RolloutModel } from "./model";

export interface RolloutChartProps {
  /** Null while the rollout loads: the axes frame is drawn, without data. */
  model: RolloutModel | null;
  /** Number of control steps to lay the axis out for while loading. */
  steps: number;
  joint: number;
  step: number;
  onStep: (step: number) => void;
  /** Control steps per second, for the axis label. */
  hz: number | null;
  width: number;
  /** What the chart says, for the slider's value text. */
  valueText: string;
  /** Text of the note at the policy's first query. */
  firstQueryNote: string[];
  /** Shown over the frame while the rollout loads or when it failed; the axes are drawn at the default width meanwhile. */
  loadingText: string | null;
}

const PREDICTION = SERIES[0];

/** An annotation: a 1px leader from a 3px dot at the data to the text, on the side with room. */
function CloseNote({ at, y, toLeft, text }: { at: number; y: number; toLeft: boolean; text: string }) {
  const sign = toLeft ? -1 : 1;
  return (
    <g>
      <circle cx={at + sign * 5} cy={y} r={1.5} fill="var(--text-faint)" />
      <line x1={at + sign * 5} x2={at + sign * 20} y1={y} y2={y} stroke="var(--text-faint)" />
      <text x={at + sign * 24} y={y} dy="0.32em" textAnchor={toLeft ? "end" : "start"} className={styles.annotation}>
        {text}
      </text>
    </g>
  );
}

/**
 * Three panels on one control-step axis: a joint target, the gripper command,
 * and the miss of "repeat the previous action" over the seven joints. The
 * wrapper is a slider over the control steps: arrow keys, Page Up and Down,
 * Home and End, or the pointer.
 */
/** Below this width the chart draws its narrow layout (copycat.css has the same number). */
const NARROW = 480;
const jointHeight = (narrow: boolean) => (narrow ? 112 : 150);
const missHeight = (narrow: boolean) => (narrow ? 92 : 112);
/** The drawn height of the chart: the three panels, their gaps and the axis under them. */
const chartHeightFor = (narrow: boolean) => 26 + jointHeight(narrow) + 40 + 40 + 40 + missHeight(narrow) + 52;

export function RolloutChart({
  model,
  steps,
  joint,
  step,
  onStep,
  hz,
  width,
  valueText,
  firstQueryNote,
  loadingText,
}: RolloutChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const narrow = width < NARROW;
  const margin = { left: 52, right: 14 };
  const n = Math.max(1, model?.rows.length ?? steps);
  const last = n - 1;

  // Panels, top to bottom. Each left-axis label sits 14px above its panel.
  const jointTop = 26;
  const jointBottom = jointTop + jointHeight(narrow);
  const gripTop = jointBottom + 40;
  const gripBottom = gripTop + 40;
  const missTop = gripBottom + 40;
  const missBottom = missTop + missHeight(narrow);
  const height = chartHeightFor(narrow);

  const x = scaleLinear([-0.5, n - 0.5], [margin.left, width - margin.right]);
  const pitch = x(1) - x(0);
  const barWidth = Math.max(1, Math.min(10, pitch - 2));
  const xTicks = niceTicks(0, last, narrow ? 4 : 8);

  // Joint panel: the range of this joint over the rollout, the hold command included.
  const jointValues = model
    ? [...model.rows.flatMap((row) => [row.action[joint], row.previous[joint]]), model.hold[joint]]
    : [0, 1];
  const [jLow, jHigh] = extent(jointValues);
  const pad = (jHigh - jLow || 1) * 0.08;
  const yJoint = scaleLinear([jLow - pad, jHigh + pad], [jointBottom, jointTop], { nice: true });
  const jointTicks = yJoint.ticks(narrow ? 3 : 4);
  const yGrip = scaleLinear([0, 1], [gripBottom, gripTop]);
  // Headroom above the tallest bar holds the note at the first query.
  const yMiss = scaleLinear([0, (model?.missMax || 1) * 1.5], [missBottom, missTop], { nice: true });
  const missTicks = yMiss.ticks(3);
  const tickDecimals = (ticks: number[]) => Math.max(0, ...ticks.map((t) => (String(t).split(".")[1] ?? "").length));
  const jointFormat = (value: number) => fixed(value, tickDecimals(jointTicks));

  const rows = model?.rows ?? [];
  const firstQuery = model?.firstQuery ?? 0;
  const current = rows[Math.min(step, rows.length - 1)];
  const cx = x(step);

  const stepAt = (clientX: number) => {
    const element = box.current;
    if (!element) return step;
    const rect = element.getBoundingClientRect();
    const local = ((clientX - rect.left) / (rect.width || 1)) * width;
    return Math.max(0, Math.min(last, Math.round(x.invert(local))));
  };
  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!model) return;
    if (event.type === "pointerdown") event.currentTarget.setPointerCapture(event.pointerId);
    // A mouse moves the cursor by hovering; touch and pen move it while pressed, so the page still scrolls.
    if (event.type === "pointermove" && event.pointerType !== "mouse" && event.buttons === 0) return;
    const next = stepAt(event.clientX);
    if (next !== step) onStep(next);
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: step + 1,
      ArrowUp: step + 1,
      ArrowLeft: step - 1,
      ArrowDown: step - 1,
      PageUp: step + 10,
      PageDown: step - 10,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    onStep(Math.max(0, Math.min(last, moves[event.key])));
  };

  const predictionLine = (pick: (values: number[]) => number, y: (value: number) => number, curve: "linear" | "step") =>
    linePath(
      rows,
      (row) => x(row.step),
      (row) => y(pick(row.previous)),
      { curve },
    );
  const expertLine = (pick: (values: number[]) => number, y: (value: number) => number, curve: "linear" | "step") =>
    linePath(
      rows,
      (row) => x(row.step),
      (row) => y(pick(row.action)),
      { curve },
    );
  const pickJoint = (values: number[]) => values[joint];
  const pickGrip = (values: number[]) => values[JOINTS];

  const band = firstQuery > 0 ? { x0: x(-0.5), x1: x(firstQuery - 0.5) } : null;
  const first = rows[firstQuery];
  const noteX = x(firstQuery) + barWidth / 2 + 18;
  const noteOnLeft = noteX > width - margin.right - 150;
  const noteY = missTop + 10;

  const gripNotes = (model?.gripChanges ?? []).filter((change) => change.step >= firstQuery);

  // The gap at the first query in the joint panel: the slot's command against the expert's, as a dimension line.
  const gap = first
    ? { from: yJoint(first.previous[joint]), to: yJoint(first.action[joint]), size: first.action[joint] - first.previous[joint] }
    : null;
  const gapX = x(firstQuery) + Math.max(pitch, 8) / 2 + 6;
  const showGap = gap !== null && Math.abs(gap.to - gap.from) >= 8;

  return (
    <div
      ref={box}
      className={styles.chart}
      role="slider"
      tabIndex={0}
      aria-label="Control step of the rollout"
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={step}
      aria-valuetext={valueText}
      aria-disabled={model ? undefined : true}
      onKeyDown={onKey}
      onPointerDown={onPointer}
      onPointerMove={onPointer}
    >
      {/* Drawn at the default width before the first measurement and in the static HTML: the frame already reads. */}
      {/* Its height is the final one from the start (copycat.css picks it by the box's width), so the page
          does not move when the chart is redrawn at the measured width. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        focusable="false"
        style={{ "--h-wide": `${chartHeightFor(false)}px`, "--h-narrow": `${chartHeightFor(true)}px` } as CSSProperties}
      >
          {band ? (
            <g>
              <rect
                x={band.x0}
                width={band.x1 - band.x0}
                y={jointTop}
                height={missBottom - jointTop}
                fill="var(--surface-2)"
              />
              {band.x1 - band.x0 > 64 ? (
                <text x={band.x0 + 6} y={jointTop + 15} className={styles.annotationMuted}>
                  Expert drives
                </text>
              ) : null}
            </g>
          ) : null}

          {/* Joint target */}
          <GridLines
            scale={yJoint}
            orientation="horizontal"
            extent={[margin.left, width - margin.right]}
            ticks={jointTicks}
          />
          <Axis
            scale={yJoint}
            orientation="left"
            offset={margin.left}
            ticks={jointTicks}
            format={jointFormat}
            label={`Joint ${joint + 1} target (rad)`}
            tickSize={0}
            hideLine
          />
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={jointBottom}
            y2={jointBottom}
            stroke="var(--border-strong)"
          />

          {/* Gripper command */}
          <Axis
            scale={yGrip}
            orientation="left"
            offset={margin.left}
            ticks={[0, 1]}
            format={(value) => (value === 1 ? "open" : "closed")}
            label="Gripper command"
            tickSize={0}
            hideLine
          />
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={gripBottom}
            y2={gripBottom}
            stroke="var(--border-strong)"
          />
          <line x1={margin.left} x2={width - margin.right} y1={gripTop} y2={gripTop} stroke="var(--grid)" />

          {/* Miss of the repeat, seven joints */}
          <GridLines
            scale={yMiss}
            orientation="horizontal"
            extent={[margin.left, width - margin.right]}
            ticks={missTicks}
          />
          <Axis
            scale={yMiss}
            orientation="left"
            offset={margin.left}
            ticks={missTicks}
            format={(value) => fixed(value, tickDecimals(missTicks))}
            label="Miss of the repeat, seven joints (rad)"
            tickSize={0}
            hideLine
          />
          <Axis
            scale={x}
            orientation="bottom"
            offset={missBottom}
            ticks={xTicks}
            label={hz ? `Control step (${hz} per second)` : "Control step"}
          />

          {model ? (
            <>
              {/* The current step: the highlighter behind its bar, a hairline through the panels above. */}
              <rect
                x={cx - Math.max(pitch, 6) / 2}
                width={Math.max(pitch, 6)}
                y={missTop - 4}
                height={missBottom - missTop + 4}
                fill="var(--mark)"
                stroke="var(--text)"
                strokeWidth={1}
              />
              {/* The hairline skips the gap between the panels, where the gripper panel's label sits. */}
              <line x1={cx} x2={cx} y1={jointTop} y2={jointBottom} stroke="var(--text)" strokeWidth={1} opacity={0.55} />
              <line x1={cx} x2={cx} y1={gripTop} y2={gripBottom} stroke="var(--text)" strokeWidth={1} opacity={0.55} />

              <path
                d={predictionLine(pickJoint, yJoint, "linear")}
                fill="none"
                stroke={PREDICTION}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <path
                d={expertLine(pickJoint, yJoint, "linear")}
                fill="none"
                stroke={REFERENCE.color}
                strokeWidth={2}
                strokeDasharray={REFERENCE.dash}
              />
              <path d={predictionLine(pickGrip, yGrip, "step")} fill="none" stroke={PREDICTION} strokeWidth={2} />
              <path
                d={expertLine(pickGrip, yGrip, "step")}
                fill="none"
                stroke={REFERENCE.color}
                strokeWidth={2}
                strokeDasharray={REFERENCE.dash}
              />

              {rows.map((row) => {
                const top = yMiss(row.miss);
                return (
                  <rect
                    key={row.step}
                    x={x(row.step) - barWidth / 2}
                    width={barWidth}
                    y={Math.min(top, missBottom - 1)}
                    height={Math.max(1, missBottom - top)}
                    fill={PREDICTION}
                    opacity={row.expertDrives ? 0.3 : 1}
                  />
                );
              })}

              {current ? (
                <>
                  <Marker x={cx} y={yJoint(current.previous[joint])} color={PREDICTION} size={9} />
                  <Marker x={cx} y={yJoint(current.action[joint])} color={REFERENCE.color} size={9} hollow />
                  <Marker x={cx} y={yGrip(current.previous[JOINTS])} color={PREDICTION} size={9} />
                  <Marker x={cx} y={yGrip(current.action[JOINTS])} color={REFERENCE.color} size={9} hollow />
                </>
              ) : null}

              {/* The gripper: the repeat lags each change of the command by one step. */}
              {gripNotes.map((change) => {
                const verb = change.closes ? "closes" : "opens";
                return (
                  <CloseNote
                    key={change.step}
                    at={x(change.step)}
                    y={(gripTop + gripBottom) / 2}
                    toLeft={x(change.step) - margin.left > width - margin.right - x(change.step)}
                    text={narrow ? `Step ${change.step}: one step late` : `Step ${change.step}: the repeat ${verb} one step late`}
                  />
                );
              })}

              {/* The gap at the first query, in the joint panel. */}
              {showGap && gap ? (
                <g>
                  <line x1={gapX} x2={gapX} y1={gap.from} y2={gap.to} stroke="var(--text-faint)" strokeWidth={1} />
                  <line x1={gapX - 3} x2={gapX + 3} y1={gap.from} y2={gap.from} stroke="var(--text-faint)" strokeWidth={1} />
                  <line x1={gapX - 3} x2={gapX + 3} y1={gap.to} y2={gap.to} stroke="var(--text-faint)" strokeWidth={1} />
                  <text
                    x={gapX + 6}
                    y={(gap.from + gap.to) / 2}
                    dy="0.32em"
                    className={styles.annotation}
                  >
                    {`${gap.size >= 0 ? "+" : "\u2212"}${fixed(Math.abs(gap.size), 3)} rad${narrow ? "" : `, joint ${joint + 1} at step ${firstQuery}`}`}
                  </text>
                </g>
              ) : null}

              {/* The policy's first query. */}
              {first ? (
                <g>
                  <path
                    d={`M${x(firstQuery)},${yMiss(first.miss) - 2}V${noteY - 4}H${noteOnLeft ? x(firstQuery) - 14 : noteX - 4}`}
                    fill="none"
                    strokeWidth={1}
                    stroke="var(--text-faint)"
                  />
                  <circle cx={x(firstQuery)} cy={yMiss(first.miss) - 2} r={1.5} fill="var(--text-faint)" />
                  {firstQueryNote.map((line, index) => (
                    <text
                      key={line}
                      x={noteOnLeft ? x(firstQuery) - 18 : noteX}
                      y={noteY + index * 16}
                      textAnchor={noteOnLeft ? "end" : "start"}
                      className={index === 0 ? styles.annotation : styles.annotationMuted}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              ) : null}
            </>
          ) : null}
      </svg>
      {loadingText ? <p className={styles.loading}>{loadingText}</p> : null}
    </div>
  );
}
