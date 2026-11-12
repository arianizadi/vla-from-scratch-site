"use client";

import type { ReactNode } from "react";
import { FIGURES, type FigureId } from "./catalog";
import { FigureFrame } from "./kit/FigureFrame";

export interface FigureNoticeProps {
  id: FigureId;
  caption?: ReactNode;
  children: ReactNode;
}

/**
 * A frame with a short message where a figure would be, shown when the figure
 * failed to load or to draw. The title, the number and the caption stay, so
 * the page still reads.
 */
export function FigureNotice({ id, caption, children }: FigureNoticeProps) {
  const info = FIGURES[id];
  return (
    <FigureFrame title={info.title} stamp={info.stamp} caption={caption}>
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center text-ink-muted sm:min-h-[280px]">
        {children}
      </div>
    </FigureFrame>
  );
}
