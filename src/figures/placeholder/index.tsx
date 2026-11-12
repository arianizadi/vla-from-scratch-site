"use client";

import { useRef } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { FIGURES, showsSentence, type FigureId } from "../catalog";
import { FigureFrame } from "../kit/FigureFrame";
import { useInView } from "../kit/hooks";
import type { FigureProps } from "../kit";
import { Sketch } from "./sketches";

export interface FigurePlaceholderProps extends FigureProps {
  id: FigureId;
}

/**
 * Stands in for a figure that is not built yet: the figure's title and stamp,
 * a sketch of its type that plays once when it arrives on screen, what it will
 * show (the words of STYLE.md) and the chapter's caption.
 *
 * Each folder in src/figures starts as this component under its own id.
 */
export function FigurePlaceholder({ id, caption }: FigurePlaceholderProps) {
  const stage = useRef<HTMLDivElement>(null);
  const arrived = useInView(stage, { amount: 0.6, once: true });
  const info = FIGURES[id];

  return (
    <FigureFrame title={info.title} stamp={info.stamp} caption={caption}>
      <div ref={stage} className="fig-placeholder">
        <svg
          className="fig-sketch"
          viewBox="0 0 480 180"
          data-play={arrived}
          aria-hidden="true"
          focusable="false"
        >
          <Sketch id={id} />
        </svg>
        <div className="fig-placeholder-text">
          <p className="fig-placeholder-tags">
            <span className="label inline-flex items-center gap-1.5 rounded-control border border-line px-1.5 py-0.5 whitespace-nowrap text-warning">
              <Glyph name="clock" />
              In preparation
            </span>
            <code>{id}</code>
          </p>
          <p>
            <span className="sr-only">This interactive figure is not built yet. It will show: </span>
            {showsSentence(id)}
          </p>
        </div>
      </div>
    </FigureFrame>
  );
}
