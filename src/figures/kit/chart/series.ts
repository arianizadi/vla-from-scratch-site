/**
 * Colour and shape assignments for data charts (DESIGN.md, section 2). The
 * values are CSS variables, so a chart follows the theme without any code.
 *
 * Rules that go with them:
 *   - Series hues appear only in data charts, modality hues only in schematic
 *     figures; a figure never uses both sets.
 *   - The order is fixed and never cycled. A seventh series is not a new hue:
 *     facet the chart or group the rest.
 *   - Colour follows the entity. An object or a policy has the same colour and
 *     marker in every chart, whatever else is shown.
 *   - Never colour by object and by policy in one chart: facet by one.
 *   - Text is drawn in ink, never in a series colour.
 */

import type { MarkerShape } from "./Marker";

/** The six series colours, in their fixed order. */
export const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
] as const;

/** Marker shapes in the same order, for series that are not objects. */
export const SERIES_SHAPES: readonly MarkerShape[] = ["circle", "square", "triangle", "diamond", "hexagon", "tee"];

/** Reference series (the scripted expert, the 33% chance line): muted and dashed. */
export const REFERENCE = { color: "var(--text-muted)", dash: "4 4" } as const;

export interface SeriesStyle {
  label: string;
  color: string;
  shape: MarkerShape;
}

/** The four objects of the pick_target task. */
export const OBJECT_SERIES = {
  hex_nut: { label: "Hex nut", color: SERIES[0], shape: "hexagon" },
  cube: { label: "Cube", color: SERIES[1], shape: "square" },
  can: { label: "Can", color: SERIES[2], shape: "circle" },
  t_block: { label: "T block", color: SERIES[3], shape: "tee" },
} as const satisfies Record<string, SeriesStyle>;

/** The policies of the lab notebook. */
export const POLICY_SERIES = {
  vit_tokens: { label: "Patch-token ViT, no language", color: SERIES[0], shape: "circle" },
  clip_pooled: { label: "Pooled CLIP", color: SERIES[1], shape: "square" },
  vit_language: { label: "ViT with instruction tokens", color: SERIES[2], shape: "triangle" },
  qwen_vla: { label: "Qwen VLA", color: SERIES[3], shape: "diamond" },
  custom_vla_pretrained: { label: "Custom VLA, pretrained", color: SERIES[4], shape: "hexagon" },
  custom_vla_random: { label: "Custom VLA, random init", color: SERIES[5], shape: "tee" },
} as const satisfies Record<string, SeriesStyle>;

/** Modality hues, for schematic figures only, always with a label. */
export const MODALITY = {
  vision: "var(--vision)",
  language: "var(--language)",
  action: "var(--action)",
} as const;

/** The sequential scale (attention weights), low to high. */
export const SEQUENTIAL = [
  "var(--seq-1)",
  "var(--seq-2)",
  "var(--seq-3)",
  "var(--seq-4)",
  "var(--seq-5)",
  "var(--seq-6)",
] as const;
