"use client";

import type { FigureProps } from "@/figures/kit";
import { FigurePlaceholder } from "@/figures/placeholder";

/**
 * Placeholder for the "tokenizer" figure. To build the figure, replace the
 * contents of this folder: keep a default export that takes FigureProps and
 * renders inside <FigureFrame>. Nothing outside this folder needs to change.
 * The contract is in src/figures/README.md.
 */
export default function TokenizerFigure({ caption }: FigureProps) {
  return <FigurePlaceholder id="tokenizer" caption={caption} />;
}
