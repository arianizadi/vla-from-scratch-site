"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Stamp } from "../catalog";
import { useFigureSlot } from "./slot";
import { StampMark } from "./StampMark";

export interface FigureFrameProps {
  /** Title in the header strip. */
  title: string;
  /** What kind of statement the figure makes: measured, computed or schematic. */
  stamp: Stamp;
  /** The stage: the drawing itself. */
  children: ReactNode;
  /** The sentence under the figure. Pass the component's `caption` prop through. */
  caption?: ReactNode;
  /** Controls under the stage: PlayButton, Stepper, Slider, Segmented, Toggle. */
  controls?: ReactNode;
  /** Announced politely to screen readers when it changes: the current step, the selected value. */
  status?: ReactNode;
  /**
   * Small print under the caption: the source of the data, a caveat, the units.
   * Folded behind "How this was measured" (or "About this figure" for a figure
   * that measures nothing), so the plate reads as its drawing and its point.
   */
  note?: ReactNode;
  /**
   * One line above the drawing: the point of the figure, built from the data
   * module's labels and values ("As served 1/100; told the expert's first
   * action 22/100; ..."). The first thing a reader sees in the plate.
   */
  takeaway?: ReactNode;
  /** Graph paper behind the stage. Defaults to on for schematic figures, off for charts. */
  grid?: boolean;
  /** "41.2". Normally left out: a chapter supplies it through the slot. */
  number?: string;
  /** Anchor id. Normally left out, as above. */
  id?: string;
  className?: string;
  /** Extra classes for the stage, for example a minimum height or "overflow-x-auto". */
  stageClassName?: string;
}

/**
 * The frame every figure, diagram and chart on the site is drawn in: a header
 * strip (number, title, stamp), the stage, an optional control bar, the caption
 * and an optional note. Padding, borders and type come from DESIGN.md, so a
 * figure only supplies what goes inside.
 */
export function FigureFrame({
  title,
  stamp,
  children,
  caption,
  controls,
  status,
  note,
  takeaway,
  grid = stamp === "schematic",
  number,
  id,
  className = "",
  stageClassName = "",
}: FigureFrameProps) {
  const slot = useFigureSlot();
  const titleId = useId();
  const shownNumber = number ?? slot?.number;
  const shownCaption = slot?.caption ?? caption;
  const hasBar = controls !== undefined || status !== undefined;

  return (
    <figure id={id ?? slot?.anchor} aria-labelledby={titleId} className={`plate wide ${className}`}>
      <div className="plate-header">
        {shownNumber ? <span className="plate-number">Fig. {shownNumber}</span> : null}
        <span id={titleId} className="plate-title">
          {title}
        </span>
        <StampMark stamp={stamp} />
      </div>
      {takeaway ? <p className="plate-takeaway">{takeaway}</p> : null}
      <div className={`plate-stage ${grid ? "graph-paper" : ""} ${stageClassName}`}>{children}</div>
      {hasBar ? (
        <div className="plate-bar">
          {controls}
          {status !== undefined ? <StatusLine status={status} /> : null}
        </div>
      ) : null}
      {shownCaption || note ? (
        <figcaption className="plate-caption">
          {shownCaption ? <div>{shownCaption}</div> : null}
          {note ? (
            <details className="plate-note">
              <summary>{stamp === "measured" ? "How this was measured" : "About this figure"}</summary>
              <div className="plate-note-body">{note}</div>
            </details>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** How long the status must stay the same before it is announced. */
const SETTLE_MS = 700;

/**
 * The status line. Sighted readers see it change at once; screen readers hear
 * it once it has settled, so a figure that plays (a new step every frame) is
 * announced when it pauses or ends, not on every frame, and a step taken by
 * hand is announced once. The first status is never announced: it is what the
 * figure shows on arrival, and the caption already says it.
 */
function StatusLine({ status }: { status: ReactNode }) {
  const shown = useRef<HTMLParagraphElement>(null);
  const last = useRef<string | null>(null);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    const text = shown.current?.textContent?.trim() ?? "";
    if (last.current === null) {
      last.current = text;
      return;
    }
    if (text === last.current) return;
    last.current = text;
    const timer = window.setTimeout(() => setAnnounced(text), SETTLE_MS);
    return () => window.clearTimeout(timer);
  });

  return (
    <>
      <p ref={shown} aria-hidden="true" className="plate-status">
        {status}
      </p>
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </>
  );
}
