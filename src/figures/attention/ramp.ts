import type { CSSProperties } from "react";
import { SEQUENTIAL } from "@/figures/kit";

/**
 * The shade of a weight: the design's sequential scale, re-stepped for this
 * figure. Five steps of 0.2, each a flat fill with the ink that reads on it.
 *
 *   - The scale's first step is left out. It is the surface colour in the dark
 *     theme and almost white in the light one, so a low weight drawn in it
 *     could not be told from an empty cell. The lowest weights start at the
 *     second step, and every shaded cell also has an edge of ink at 30%
 *     (--cell-edge in attention.css). A cell outside the sequence is
 *     a dashed outline with nothing in it.
 *   - The middle step is the fourth colour moved 22% towards the fifth. The
 *     fourth colour by itself gives its number 4.2:1 in the dark theme; moved,
 *     it gives 4.8:1 in both themes with the dark ink.
 *   - A masked cell is not on the scale at all: it is hatched (see HATCH).
 *
 * Contrast of each number on its fill, light / dark theme:
 *   11.6 / 9.4, 8.3 / 6.3, 4.8 / 4.8, 5.5 / 7.4, 12.0 / 12.8.
 */
export interface ShadeStep {
  /** Background of the cell. */
  fill: string;
  /** Colour of the number printed on it. */
  ink: string;
}

export const SHADE_STEPS: readonly ShadeStep[] = [
  { fill: SEQUENTIAL[1], ink: "var(--text)" },
  { fill: SEQUENTIAL[2], ink: "var(--text)" },
  // The one fill that needs the dark ink in both themes: --on-mark is that ink.
  { fill: `color-mix(in oklab, ${SEQUENTIAL[3]} 78%, ${SEQUENTIAL[4]})`, ink: "var(--on-mark)" },
  { fill: SEQUENTIAL[4], ink: "var(--on-accent)" },
  { fill: SEQUENTIAL[5], ink: "var(--on-accent)" },
];

/**
 * The step a weight is drawn in. The weight is rounded to two decimals first,
 * as the cell prints it, so a cell that reads 0.60 is never shaded as 0.59.
 */
export function shadeOf(weight: number): ShadeStep {
  const hundredths = Math.round(weight * 100);
  const index = Math.min(SHADE_STEPS.length - 1, Math.floor(hundredths / (100 / SHADE_STEPS.length)));
  return SHADE_STEPS[Math.max(0, index)];
}

/** A masked cell: thin diagonal lines on the surface, the mark of "nothing may be read here". */
export const HATCH: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(135deg, var(--border-strong) 0 1px, transparent 1px 6px)",
};
