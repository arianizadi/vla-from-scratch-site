"use client";

import { useEffect, useRef, useState } from "react";
import { Axis } from "./chart/Axis";
import { GridLines } from "./chart/GridLines";
import { Legend } from "./chart/Legend";
import { linePath, type Curve } from "./chart/line";
import { Marker } from "./chart/Marker";
import { scaleLinear } from "./chart/scale";
import { REFERENCE, SERIES } from "./chart/series";
import { ControlButton, PlayButton } from "./controls/PlayButton";
import { Segmented } from "./controls/Segmented";
import { Slider } from "./controls/Slider";
import { Stepper } from "./controls/Stepper";
import { Toggle } from "./controls/Toggle";
import { FigureFrame } from "./FigureFrame";
import { chartHeight, useElementSize, useInView, usePageVisible, useReducedMotion } from "./hooks";
import type { FigureProps } from "./index";

const LAST = 12;
const FLOOR = 0.08;
const CURVES = [
  { value: "linear", label: "Linear" },
  { value: "step", label: "Step" },
  { value: "monotone", label: "Smooth" },
] as const;

/** A toy curve: it falls from 1 towards a floor, faster for a smaller time constant. */
function curveValue(step: number, timeConstant: number): number {
  return FLOOR + (1 - FLOOR) * Math.exp(-step / timeConstant);
}

/**
 * A working figure made only of kit parts, shown at the end of /figures. It is
 * the reference for figure authors: the frame, every control, the chart
 * primitives, sizing from the container, pausing off screen and the
 * reduced-motion behaviour, in about 200 lines. Its data is a formula, so it
 * is stamped "computed".
 */
/** The chart's height: 42% of its width, between 220 and 320 px. */
const HEIGHT = { min: 220, ratio: 0.42, max: 320 } as const;

export function KitSpecimen({ caption }: FigureProps) {
  const [timeConstant, setTimeConstant] = useState(3);
  const [curve, setCurve] = useState<Curve>("linear");
  const [showGrid, setShowGrid] = useState(true);
  const [step, setStep] = useState(LAST);
  const [playing, setPlaying] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stage);
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  // The timeline runs until its last step, only while the figure is on screen
  // in a visible tab, and never under reduced motion.
  const running = playing && step < LAST && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setStep((current) => Math.min(LAST, current + 1)), 450);
    return () => clearInterval(timer);
  }, [running]);

  // Until the container is measured (and in the static HTML) the chart is drawn 640 wide. Its box
  // already has its final height, from the same rule in CSS (chartHeight), so nothing below the
  // figure moves when it is redrawn at the real width; until then the drawing sits inside that box.
  const width = measured || 640;
  const height = Math.round(Math.min(HEIGHT.max, Math.max(HEIGHT.min, width * HEIGHT.ratio)));
  const margin = { top: 30, right: 20, bottom: 54, left: 44 };
  const x = scaleLinear([0, LAST], [margin.left, width - margin.right]);
  const y = scaleLinear([0, 1], [height - margin.bottom, margin.top]);
  const xTicks = width < 420 ? [0, 4, 8, 12] : [0, 2, 4, 6, 8, 10, 12];
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const points = Array.from({ length: LAST + 1 }, (_, index) => ({ step: index, value: curveValue(index, timeConstant) }));
  const current = points[step];
  const labelOnLeft = x(current.step) > width - margin.right - 96;

  const toggle = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    if (step >= LAST) setStep(0);
    setPlaying(true);
  };

  return (
    <FigureFrame
      title="Kit specimen"
      stamp="computed"
      caption={caption}
      note="A toy curve, value = 0.08 + 0.92 exp(-step / time constant). Nothing here is measured."
      status={`Step ${current.step} of ${LAST}: value ${current.value.toFixed(2)}.`}
      controls={
        <>
          <PlayButton playing={running} ended={step >= LAST} onToggle={toggle} className="motion-reduce:hidden" />
          <Stepper
            label="step"
            value={step}
            max={LAST}
            onChange={(next) => {
              setPlaying(false);
              setStep(next);
            }}
          />
          <Slider
            label="Time constant"
            min={1}
            max={8}
            step={0.5}
            value={timeConstant}
            onChange={setTimeConstant}
            format={(value) => `${value.toFixed(1)} steps`}
          />
          <Segmented label="Line" showLabel options={CURVES} value={curve} onChange={setCurve} />
          <Toggle label="Gridlines" checked={showGrid} onChange={setShowGrid} />
          <ControlButton
            onClick={() => {
              setPlaying(false);
              setStep(LAST);
              setTimeConstant(3);
              setCurve("linear");
              setShowGrid(true);
            }}
          >
            Reset
          </ControlButton>
        </>
      }
    >
      <Legend
        items={[
          { label: "Toy curve", color: SERIES[0], shape: "circle" },
          { label: "Floor", color: REFERENCE.color, dashed: true },
        ]}
      />
      <div ref={stage} className="mt-2 [container-type:inline-size]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full"
          style={chartHeight(HEIGHT)}
          role="img"
          aria-label={`A toy curve falling from 1 towards ${FLOOR} over ${LAST} steps. At step ${current.step} its value is ${current.value.toFixed(2)}.`}
        >
          {showGrid ? <GridLines scale={y} orientation="horizontal" extent={[margin.left, width - margin.right]} ticks={yTicks} /> : null}
          <Axis scale={x} orientation="bottom" offset={height - margin.bottom} ticks={xTicks} label="Step" />
          <Axis
            scale={y}
            orientation="left"
            offset={margin.left}
            ticks={yTicks}
            format={(value) => value.toFixed(2)}
            label="Value"
            tickSize={0}
            hideLine
          />
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={y(FLOOR)}
            y2={y(FLOOR)}
            stroke={REFERENCE.color}
            strokeWidth={1.5}
            strokeDasharray={REFERENCE.dash}
          />
          <path
            d={linePath(
              points,
              (point) => x(point.step),
              (point) => y(point.value),
              { curve },
            )}
            fill="none"
            stroke={SERIES[0]}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <line
            x1={x(current.step)}
            x2={x(current.step)}
            y1={margin.top}
            y2={height - margin.bottom}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />
          <Marker x={x(current.step)} y={y(current.value)} size={10} color={SERIES[0]} />
          <text
            x={x(current.step) + (labelOnLeft ? -10 : 10)}
            y={y(current.value) - 10}
            textAnchor={labelOnLeft ? "end" : "start"}
            className="fig-axis-text"
            style={{ fill: "var(--text)", stroke: "var(--surface)", strokeWidth: 3, paintOrder: "stroke" }}
          >
            {current.value.toFixed(2)}
          </text>
        </svg>
      </div>
    </FigureFrame>
  );
}
