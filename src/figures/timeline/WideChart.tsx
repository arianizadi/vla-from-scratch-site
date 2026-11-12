"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { ENTRIES, LINKS, OFF_CHART_LINKS, type Entry } from "./entries";
import { AXIS_HEIGHT, laneBottom, linkPath, stubPath, type WideLayout } from "./layout";
import { MarkerShape, StrandMarker } from "./StrandMarker";
import type { EntryState, LinkState } from "./state";

export interface ChartProps {
  visible: ReadonlySet<string>;
  focusId: string | null;
  /** The entry that takes Tab focus (roving tab index). */
  tabId: string | null;
  entryState: (id: string) => EntryState;
  linkState: (from: string, to: string) => LinkState;
  onSelect: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>, id: string) => void;
  /** Called with each entry's button; returns the cleanup for when the button goes. */
  registerEntry: (id: string, element: HTMLButtonElement | null) => (() => void) | undefined;
  entryLabel: (entry: Entry) => string;
  /** id of the element that describes the focused entry. */
  detailsId: string;
}

/**
 * Years left to right, one lane per strand, lines from each entry to the
 * earlier work it builds on. The lines and the axis are SVG; the entries are
 * HTML buttons on top, so they take keyboard focus and the focus ring.
 *
 * `onMeasure` receives the width of every name as it is drawn when selected
 * (the widest it gets), measured from a hidden copy once the fonts are in, so
 * the layout can space the years by the real label widths.
 */
export function WideChart({
  layout,
  onMeasure,
  ...props
}: ChartProps & { layout: WideLayout; onMeasure: (widths: ReadonlyMap<string, number>) => void }) {
  const { width, height, lanes, entries, scale, axisY } = layout;
  const { visible, focusId, tabId, entryState, linkState, onSelect, onKeyDown, registerEntry, entryLabel, detailsId } = props;
  const focused = focusId ? entries.get(focusId) : undefined;
  const axisLine = axisY + 6;
  const laneById = new Map(lanes.map((lane) => [lane.id, lane]));

  const measureRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) return;
    let cancelled = false;
    const read = () => {
      if (cancelled) return;
      const widths = new Map<string, number>();
      element.querySelectorAll<HTMLElement>("[data-measure]").forEach((span) => {
        widths.set(span.dataset.measure as string, Math.ceil(span.getBoundingClientRect().width));
      });
      onMeasure(widths);
    };
    read();
    document.fonts?.ready.then(read, () => undefined);
    return () => {
      cancelled = true;
    };
  }, [onMeasure]);

  // Tick labels that would run into each other are left out (the tick stays); the focused entry's year always has one.
  const TICK_LABEL_ROOM = 34;
  const labelled = new Set<number>();
  if (focused) labelled.add(focused.entry.year);
  for (const year of scale.ticks) {
    const x = scale.x(year);
    if ([...labelled].every((other) => other === year || Math.abs(scale.x(other) - x) >= TICK_LABEL_ROOM)) labelled.add(year);
  }

  // The axis line, interrupted at each break.
  const axisSegments: [number, number][] = [];
  let from = 0;
  for (const item of scale.breaks) {
    axisSegments.push([from, item.x - 7]);
    from = item.x + 7;
  }
  axisSegments.push([from, width]);

  return (
    <div className="tl-wide" style={{ height }}>
      <div ref={measureRef} className="tl-measure" aria-hidden="true">
        {ENTRIES.map((entry) => (
          <span key={entry.id} data-measure={entry.id} className="tl-entry-name">
            {entry.name}
          </span>
        ))}
      </div>

      <svg className="tl-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        {lanes.slice(1).map((lane) => (
          <line key={lane.id} x1={0} x2={width} y1={lane.top - 5} y2={lane.top - 5} className="tl-lane-rule" />
        ))}

        {focused ? <line x1={focused.x} x2={focused.x} y1={0} y2={axisLine} className="tl-year-guide" /> : null}

        {LINKS.map((link) => {
          const a = entries.get(link.from);
          const b = entries.get(link.to);
          if (!a || !b) return null;
          const shown = visible.has(link.from) && visible.has(link.to);
          return (
            <path
              key={`${link.from}-${link.to}`}
              d={linkPath(a.x, a.y, b.x, b.y)}
              className="tl-link"
              data-state={linkState(link.from, link.to)}
              data-inferred={link.inferred ? "true" : undefined}
              data-hidden={shown ? undefined : "true"}
            />
          );
        })}

        {OFF_CHART_LINKS.map((link) => {
          const b = entries.get(link.to);
          const lane = laneById.get(link.strand);
          if (!b || !lane) return null;
          const x1 = b.x - 26;
          const y1 = laneBottom(lane);
          const state = entryState(link.to);
          return (
            <g
              key={`${link.strand}-${link.to}`}
              className="tl-stub"
              // On the focused entry's lineage when it feeds the focused entry or one of its ancestors.
              data-state={state === "focus" || state === "ancestor" ? "lineage" : state === "plain" ? "plain" : "other"}
              data-hidden={visible.has(link.to) ? undefined : "true"}
            >
              <path d={stubPath(x1, y1, b.x, b.y)} className="tl-link" />
              <circle cx={x1} cy={y1} r={3.5} className="tl-stub-end" />
            </g>
          );
        })}

        {[...entries.values()].map((placed) => (
          <g
            key={placed.entry.id}
            transform={`translate(${placed.x},${placed.y})`}
            className="tl-dot"
            data-state={entryState(placed.entry.id)}
            data-hidden={visible.has(placed.entry.id) ? undefined : "true"}
          >
            <MarkerShape strand={placed.entry.strand} r={placed.entry.id === focusId ? 6.5 : 5.5} />
          </g>
        ))}

        {axisSegments.map(([x1, x2]) => (
          <line key={x1} x1={x1} x2={x2} y1={axisLine} y2={axisLine} className="tl-axis-line" />
        ))}
        {scale.breaks.map((item) => (
          <g key={item.before} transform={`translate(${item.x},${axisLine})`} className="tl-axis-break">
            <line x1={-9} x2={-5} y1={5} y2={-5} />
            <line x1={5} x2={9} y1={5} y2={-5} />
          </g>
        ))}
        {scale.minorTicks.map((year) => (
          <line key={year} x1={scale.x(year)} x2={scale.x(year)} y1={axisLine} y2={axisLine + 3} className="tl-axis-line" />
        ))}
        {scale.ticks.map((year) => (
          <g key={year} transform={`translate(${scale.x(year)},${axisLine})`}>
            <line y1={0} y2={6} className="tl-axis-line" />
            {labelled.has(year) ? (
              <text y={AXIS_HEIGHT - 8} textAnchor="middle" className="fig-axis-text" data-focus={focused?.entry.year === year ? "true" : undefined}>
                {year}
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      {lanes.map((lane) => (
        <p key={lane.id} className="tl-lane-label" style={{ top: lane.top }}>
          <StrandMarker strand={lane.id} size={11} />
          {lane.label}
        </p>
      ))}

      {[...entries.values()].map((placed) => {
        const id = placed.entry.id;
        const shown = visible.has(id);
        const pressed = id === focusId;
        return (
          <button
            key={id}
            ref={(element) => registerEntry(id, element)}
            type="button"
            className="tl-entry"
            data-state={entryState(id)}
            data-hidden={shown ? undefined : "true"}
            style={{ left: placed.left, top: placed.y - 11, width: placed.width }}
            tabIndex={shown && id === tabId ? 0 : -1}
            aria-pressed={pressed}
            aria-controls={pressed ? detailsId : undefined}
            aria-label={entryLabel(placed.entry)}
            disabled={!shown}
            onClick={() => onSelect(id)}
            onFocus={() => {
              if (!pressed) onSelect(id);
            }}
            onKeyDown={(event) => onKeyDown(event, id)}
          >
            <span className="tl-entry-name">{placed.entry.name}</span>
          </button>
        );
      })}
    </div>
  );
}
