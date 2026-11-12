"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { niceTicks, scaleLinear, useElementSize } from "@/figures/kit";

export interface TimelineProps {
  /** Number of control steps; the steps run from 0 to steps - 1. */
  steps: number;
  step: number;
  /** Opening of the fingers at each step, 1 open to 0 closed; null while the rollout loads. */
  grip: readonly number[] | null;
  /** Steps at which the gripper was told to close. */
  closes: readonly number[];
  /** Step at which the named object was moved, if it was. */
  moved: number | null;
  onChange: (step: number) => void;
  /** Read by a screen reader as the slider's value: "Step 40, 2.00 s". */
  valueText: string;
}

const HEIGHT = 76;
const BAND_TOP = 18;
const BAND_HEIGHT = 30;
const AXIS_Y = BAND_TOP + BAND_HEIGHT + 4;

/**
 * The rollout on a time axis, and the control that moves through it: the
 * opening of the fingers at every step, a mark at each close and at the move,
 * and the current step on the highlighter. It is a slider: drag or click it,
 * or use the arrow keys (one step), Page Up and Page Down (ten), Home and End.
 */
export function Timeline({ steps, step, grip, closes, moved, onChange, valueText }: TimelineProps) {
  const box = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(box);
  const width = measured || 640;
  const last = Math.max(1, steps - 1);
  const margin = { left: 8, right: 8 };
  const x = scaleLinear([0, last], [margin.left, width - margin.right]);
  const ticks = niceTicks(0, last, width < 420 ? 4 : 8);
  const band = (value: number) => BAND_TOP + BAND_HEIGHT * (1 - value);

  const area = grip
    ? `M${x(0)},${BAND_TOP + BAND_HEIGHT} ${grip.map((value, index) => `L${x(index).toFixed(1)},${band(value).toFixed(1)}`).join(" ")} L${x(grip.length - 1)},${BAND_TOP + BAND_HEIGHT} Z`
    : null;
  const outline = grip ? grip.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${band(value).toFixed(1)}`).join(" ") : null;

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = rect.width > 0 ? width / rect.width : 1;
    const value = Math.round(x.invert((event.clientX - rect.left) * scale));
    onChange(Math.min(last, Math.max(0, value)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: step - 1,
      ArrowDown: step - 1,
      ArrowRight: step + 1,
      ArrowUp: step + 1,
      PageDown: step - 10,
      PageUp: step + 10,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(Math.min(last, Math.max(0, next)));
  };

  const cursor = x(Math.min(last, Math.max(0, step)));
  const labelWidth = String(step).length * 7 + 10;
  const labelX = Math.min(width - labelWidth, Math.max(0, cursor - labelWidth / 2));

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label="Control step"
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={step}
      aria-valuetext={valueText}
      className="ar-timeline"
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        fromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event);
      }}
    >
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} width="100%" height={HEIGHT} aria-hidden="true" className="block">
        <rect
          x={margin.left}
          y={BAND_TOP}
          width={width - margin.left - margin.right}
          height={BAND_HEIGHT}
          className="ar-timeline-track"
        />
        {area ? <path d={area} className="ar-timeline-area" /> : null}
        {outline ? <path d={outline} className="ar-timeline-line" /> : null}
        {moved !== null ? (
          <g>
            <line x1={x(moved)} x2={x(moved)} y1={BAND_TOP - 4} y2={BAND_TOP + BAND_HEIGHT} className="ar-timeline-moved" />
            <path d={`M${x(moved) - 4},${BAND_TOP - 9} h8 l-4,6 z`} className="ar-timeline-moved-mark" />
          </g>
        ) : null}
        {closes.map((close) => (
          <g key={close}>
            <line x1={x(close)} x2={x(close)} y1={BAND_TOP} y2={BAND_TOP + BAND_HEIGHT} className="ar-timeline-close" />
            <circle cx={x(close)} cy={BAND_TOP + BAND_HEIGHT} r={3.5} className="ar-timeline-close-mark" />
          </g>
        ))}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={AXIS_Y - 3} y2={AXIS_Y} className="ar-timeline-tick" />
            <text x={x(tick)} y={AXIS_Y + 14} textAnchor="middle" className="fig-axis-text">
              {tick}
            </text>
          </g>
        ))}
        <line x1={cursor} x2={cursor} y1={BAND_TOP - 2} y2={BAND_TOP + BAND_HEIGHT + 2} className="ar-timeline-cursor" />
        <rect x={labelX} y={0} width={labelWidth} height={15} rx={2} className="ar-timeline-label" />
        <text x={labelX + labelWidth / 2} y={11.5} textAnchor="middle" className="ar-timeline-label-text">
          {step}
        </text>
      </svg>
    </div>
  );
}
