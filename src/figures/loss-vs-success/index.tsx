"use client";

import type { FigureProps } from "@/figures/kit";
import { FigurePlaceholder } from "@/figures/placeholder";

/**
 * Placeholder for the "loss-vs-success" figure. To build the figure, replace the
 * contents of this folder: keep a default export that takes FigureProps and
 * renders inside <FigureFrame>. Nothing outside this folder needs to change.
 * The contract is in src/figures/README.md.
 */
export default function LossVsSuccessFigure({ caption }: FigureProps) {
  return <FigurePlaceholder id="loss-vs-success" caption={caption} />;
}
