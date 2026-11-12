"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { Machine } from "@/data/types";
import { Axis, GridLines, Marker, REFERENCE, linePath, scaleLinear, useElementSize } from "@/figures/kit";
import { ALL_OFFSETS, OBJECT_LINES, countAt, describe, offsetsOf, percentAt, rowAt, table, wilson } from "./model";
import { useSettledWidth } from "./useSettledWidth";

/** Dash of the other build's curves: dotted, so it never reads as the dashed "all four" reference. */
export const COMPARE_DASH = "2 3";

export interface ChartProps {
  machine: Machine;
  /** The other builds, drawn dotted behind the selected one. Empty when the comparison is off. */
  compare: Machine[];
  offsetMm: number;
  /** Called with a measured offset when the reader clicks or drags on the chart. */
  onPick: (offsetMm: number) => void;
  /** Text alternative of the chart. */
  label: string;
  /** Transitions on the crosshair; off under reduced motion. */
  animate: boolean;
}

const MARGIN = { top: 32, bottom: 54, left: 44 };
const LABEL_GAP = 15;

/**
 * Spreads labels that would overlap: each keeps its own height where it can
 * and is pushed apart from its neighbours by at least `gap`, inside the plot.
 */
function spread(wanted: number[], gap: number, low: number, high: number): number[] {
  const order = wanted.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const placed = order.map((entry) => entry.value);
  for (let index = 1; index < placed.length; index += 1) placed[index] = Math.max(placed[index], placed[index - 1] + gap);
  const overflow = placed.length > 0 ? placed[placed.length - 1] - high : 0;
  if (overflow > 0) {
    placed[placed.length - 1] -= overflow;
    for (let index = placed.length - 2; index >= 0; index -= 1) placed[index] = Math.min(placed[index], placed[index + 1] - gap);
  }
  if (placed.length > 0 && placed[0] < low) {
    placed[0] = low;
    for (let index = 1; index < placed.length; index += 1) placed[index] = Math.max(placed[index], placed[index - 1] + gap);
  }
  const result = new Array<number>(wanted.length);
  order.forEach((entry, position) => {
    result[entry.index] = placed[position];
  });
  return result;
}

/**
 * Grasp success against the offset: one solid line per object, the share of
 * all four as a dashed reference, and a crosshair at the slider's offset with
 * the counts' 95% intervals as whiskers where the table has counts.
 */
export function Chart({ machine, compare, offsetMm, onPick, label, animate }: ChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(box);
  const width = measured || 640;
  const narrow = width < 480;
  const height = Math.round(Math.min(340, Math.max(240, width * 0.48)));
  const right = narrow ? 64 : 80;
  const plotRight = width - right;
  const plotBottom = height - MARGIN.bottom;

  const domain: [number, number] = [ALL_OFFSETS[0] ?? 0, ALL_OFFSETS[ALL_OFFSETS.length - 1] ?? 1];
  const x = scaleLinear(domain, [MARGIN.left, plotRight]);
  const y = scaleLinear([0, 100], [plotBottom, MARGIN.top]);
  const yTicks = [0, 25, 50, 75, 100];

  const rows = [...table(machine).rows].sort((a, b) => a.offsetMm - b.offsetMm);
  const current = rowAt(machine, offsetMm);
  const last = rows[rows.length - 1];

  // Direct labels at the line ends, in ink, pushed apart where the curves end close together.
  const ends = OBJECT_LINES.map((object) => y(percentAt(last, object.id) ?? 0));
  const labelY = spread(ends, LABEL_GAP, MARGIN.top + 4, plotBottom - 2);

  const dragging = useRef(false);
  /** The measured offset under a hovering mouse: previewed, not picked. */
  const [hover, setHover] = useState<number | undefined>(undefined);
  const nearestAt = (event: PointerEvent<SVGSVGElement>): number | undefined => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return undefined;
    const at = x.invert(((event.clientX - rect.left) / rect.width) * width);
    const offsets = offsetsOf(machine);
    return offsets.reduce((best, value) => (Math.abs(value - at) < Math.abs(best - at) ? value : best), offsets[0]);
  };
  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const nearest = nearestAt(event);
    if (nearest !== undefined && nearest !== offsetMm) onPick(nearest);
  };

  const cx = x(offsetMm);
  // Only a change of the offset slides the crosshair: not the first measurement, not a resize.
  const settled = useSettledWidth(measured);
  const transition = animate && settled ? "transform 180ms var(--ease-standard)" : "none";

  // The hover preview: a faint line and a readout at the measured offset under the mouse.
  const preview = hover !== undefined && hover !== offsetMm ? rowAt(machine, hover) : undefined;
  const previewX = preview ? x(preview.offsetMm) : 0;
  const tipWidth = rows.some((row) => row.counts) ? 136 : 100;
  const tipLine = 16;
  const tipHeight = 10 + tipLine * (OBJECT_LINES.length + 1);
  const tipX = previewX + 10 + tipWidth <= plotRight ? previewX + 10 : previewX - 10 - tipWidth;

  return (
    <div ref={box}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full cursor-crosshair select-none"
        style={{ touchAction: "pan-y" }}
        role="img"
        aria-label={label}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          pick(event);
        }}
        onPointerMove={(event) => {
          if (dragging.current) pick(event);
          else if (event.pointerType === "mouse") setHover(nearestAt(event));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerLeave={() => setHover(undefined)}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <GridLines scale={y} orientation="horizontal" extent={[MARGIN.left, plotRight]} ticks={yTicks} />
        <Axis
          scale={y}
          orientation="left"
          offset={MARGIN.left}
          ticks={yTicks}
          format={(value) => `${value}%`}
          label="Grasp success"
          tickSize={0}
          hideLine
        />
        <Axis
          scale={x}
          orientation="bottom"
          offset={plotBottom}
          ticks={ALL_OFFSETS}
          format={(value) => `${value}`}
          label="Offset of the grasp point (mm)"
        />

        {/* The current offset: a crosshair, and its tick on the highlighter. */}
        <g style={{ transform: `translateX(${cx}px)`, transition }} aria-hidden="true">
          <line y1={MARGIN.top} y2={plotBottom} stroke="var(--border-strong)" strokeWidth={1} />
          <rect
            x={-12}
            y={plotBottom + 5}
            width={24}
            height={18}
            rx={2}
            fill="var(--mark)"
            stroke="var(--text)"
            strokeWidth={1}
          />
          <text y={plotBottom + 18} textAnchor="middle" className="fig-axis-text" style={{ fill: "var(--on-mark)" }}>
            {offsetMm}
          </text>
        </g>

        {/* The other builds, dotted, behind everything measured on this one. */}
        {compare.map((other) => {
          const otherRows = [...table(other).rows].sort((a, b) => a.offsetMm - b.offsetMm);
          return (
            <g key={other} aria-hidden="true">
              {OBJECT_LINES.map((object) => (
                <path
                  key={object.id}
                  d={linePath(
                    otherRows,
                    (row) => x(row.offsetMm),
                    (row) => y(percentAt(row, object.id) ?? NaN),
                  )}
                  fill="none"
                  stroke={object.style.color}
                  strokeWidth={2}
                  strokeDasharray={COMPARE_DASH}
                  strokeLinecap="round"
                />
              ))}
            </g>
          );
        })}

        {/* All four objects together: the average that hides the round objects. */}
        <path
          d={linePath(
            rows,
            (row) => x(row.offsetMm),
            (row) => y(percentAt(row, "all") ?? NaN),
          )}
          fill="none"
          stroke={REFERENCE.color}
          strokeWidth={1.5}
          strokeDasharray={REFERENCE.dash}
          aria-hidden="true"
        />

        {OBJECT_LINES.map((object) => (
          <g key={object.id} aria-hidden="true">
            <path
              d={linePath(
                rows,
                (row) => x(row.offsetMm),
                (row) => y(percentAt(row, object.id) ?? NaN),
              )}
              fill="none"
              stroke={object.style.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {rows.map((row) => {
              const value = percentAt(row, object.id);
              if (value === undefined || row.offsetMm === offsetMm) return null;
              return (
                <Marker
                  key={row.offsetMm}
                  shape={object.style.shape}
                  x={x(row.offsetMm)}
                  y={y(value)}
                  color={object.style.color}
                />
              );
            })}
          </g>
        ))}

        {/* At the current offset: whiskers (where the table has counts) and larger markers. */}
        <g aria-hidden="true">
          {OBJECT_LINES.map((object) => {
            const count = countAt(current, object.id);
            if (!count) return null;
            const [low, high] = wilson(count);
            return (
              <g key={object.id} stroke={object.style.color} strokeWidth={1.5}>
                <line x1={cx} x2={cx} y1={y(100 * low)} y2={y(100 * high)} />
                <line x1={cx - 4} x2={cx + 4} y1={y(100 * low)} y2={y(100 * low)} />
                <line x1={cx - 4} x2={cx + 4} y1={y(100 * high)} y2={y(100 * high)} />
              </g>
            );
          })}
          {OBJECT_LINES.map((object) => {
            const value = percentAt(current, object.id);
            if (value === undefined) return null;
            return (
              <Marker key={object.id} shape={object.style.shape} x={cx} y={y(value)} size={11} color={object.style.color} />
            );
          })}
        </g>

        {/* The hover preview: where a click would go, and what it would show. */}
        {preview ? (
          <g aria-hidden="true" pointerEvents="none">
            <line
              x1={previewX}
              x2={previewX}
              y1={MARGIN.top}
              y2={plotBottom}
              stroke="var(--text-faint)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <g transform={`translate(${tipX},${MARGIN.top})`}>
              <rect width={tipWidth} height={tipHeight} rx={2} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1} />
              <text x={8} y={tipLine} className="fig-axis-text" style={{ fill: "var(--text)", fontWeight: 600 }}>
                {preview.offsetMm} mm
              </text>
              {OBJECT_LINES.map((object, index) => (
                <g key={object.id} transform={`translate(8,${tipLine * (index + 2) - 4})`}>
                  <Marker shape={object.style.shape} x={4} y={0} size={8} color={object.style.color} ring={false} />
                  <text x={14} y={0} dy="0.32em" className="fig-axis-text" style={{ fill: "var(--text)" }}>
                    {object.short} {describe(preview, object.id)}
                  </text>
                </g>
              ))}
            </g>
          </g>
        ) : null}

        {/* Direct labels at the line ends. */}
        <g aria-hidden="true">
          {OBJECT_LINES.map((object, index) => {
            const end = ends[index];
            const at = labelY[index];
            const lineEnd = x(last?.offsetMm ?? domain[1]);
            const moved = Math.abs(at - end) > 2;
            return (
              <g key={object.id}>
                {moved ? (
                  <>
                    <line x1={lineEnd + 7} x2={lineEnd + 12} y1={end} y2={at} stroke="var(--text-faint)" strokeWidth={1} />
                    <circle cx={lineEnd + 7} cy={end} r={1.5} fill="var(--text-faint)" />
                  </>
                ) : null}
                <text x={lineEnd + 14} y={at} dy="0.32em" className="fig-axis-text" style={{ fill: "var(--text)" }}>
                  {object.short}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
