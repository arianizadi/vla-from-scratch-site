"use client";

import { useId, type ReactNode } from "react";
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
  /** Small print under the caption: the source of the data, a caveat, the units. */
  note?: ReactNode;
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
      <div className={`plate-stage ${grid ? "graph-paper" : ""} ${stageClassName}`}>{children}</div>
      {hasBar ? (
        <div className="plate-bar">
          {controls}
          {status !== undefined ? (
            <p aria-live="polite" className="plate-status">
              {status}
            </p>
          ) : null}
        </div>
      ) : null}
      {shownCaption || note ? (
        <figcaption className="plate-caption">
          {shownCaption ? <div>{shownCaption}</div> : null}
          {note ? <div className="plate-note">{note}</div> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
