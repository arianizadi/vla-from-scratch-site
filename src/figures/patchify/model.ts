/**
 * What the figure cuts and how: the camera frames a policy receives, the two
 * patch sizes, and the arithmetic of a patch grid (which patch a pixel falls
 * in, which token a patch becomes, how much of a patch an object covers).
 *
 * Nothing here is measured. The frames and the from-scratch VLM's patch come
 * from the data module; the policies' patch and the processors are settings
 * that the chapter text states (see POLICY_PATCH and POLICY_PROCESSORS).
 */

import { frames, type FrameInfo } from "@/data/files";
import { stageResults } from "@/data/notebook";
import type { ObjectMask } from "./segment";

// ---------------------------------------------------------------- patch sizes

export type PatchId = "policy" | "vlm";

/** What the processor does to the 0 to 255 values before the vision transformer sees them. */
export type PixelRange = "none" | "simple_vlm";

export interface Processor {
  /** The configs that use it. */
  configs: string[];
  range: PixelRange;
}

export interface PatchOption {
  id: PatchId;
  /** Side of one patch in pixels. */
  patch: number;
  /** Width of the vector one patch becomes. */
  width: number;
  /** Who cuts the frame this way, for the control, the table and the note. */
  who: string;
  /** The pixel range each config using this vision transformer hands it. */
  processors: Processor[];
}

/**
 * The policies' vision transformer (`dp_vit.yaml`): patch 16 px, `hidden_dim: 256`.
 * The data module does not carry these two settings; they are copied from the
 * chapter "Images Become Tokens", which states them ("Image 224 px, patch 16 px",
 * "hidden_dim: 256") and says that the three other `dp_vit*` configs set the same values.
 */
const POLICY_PATCH = { patch: 16, width: 256 } as const;

/**
 * Which processor each config uses, from the table of processors in the chapter
 * "Images Become Tokens" (`data.processor`): `simple_vlm` divides by 255 and then
 * normalises with mean 0.5 and standard deviation 0.5, to [-1, 1], for `custom_vlm`,
 * `dp_vit_lang` and `dp_vit_lang_reactive`; `"none"` hands the ViT 0 to 255 as
 * float32 for `dp_vit` and `dp_vit_reactive`. The data module does not carry them.
 */
const POLICY_PROCESSORS: Processor[] = [
  { configs: ["dp_vit", "dp_vit_reactive"], range: "none" },
  { configs: ["dp_vit_lang", "dp_vit_lang_reactive"], range: "simple_vlm" },
];
const VLM_PROCESSORS: Processor[] = [{ configs: ["custom_vlm"], range: "simple_vlm" }];

/** The from-scratch VLM's vision transformer, from the notebook's table of from-scratch stages. */
const vlmVit = stageResults.rows.find((row) => "vit" in row && row.vit)?.vit;

export const PATCH_OPTIONS: PatchOption[] = [
  {
    id: "policy",
    patch: POLICY_PATCH.patch,
    width: POLICY_PATCH.width,
    who: "the patch-token policies",
    processors: POLICY_PROCESSORS,
  },
  ...(vlmVit
    ? [{ id: "vlm" as const, patch: vlmVit.patch, width: vlmVit.width, who: "from-scratch VLM", processors: VLM_PROCESSORS }]
    : []),
];

/** One value of the frame as the vision transformer receives it under a pixel range (computed, not measured). */
export function scaled(value: number, range: PixelRange): number {
  return range === "none" ? value : (value / 255 - 0.5) / 0.5;
}

export function patchOption(id: PatchId): PatchOption {
  return PATCH_OPTIONS.find((option) => option.id === id) ?? PATCH_OPTIONS[0];
}

// ---------------------------------------------------------------- frames

/** The frames at the size a policy receives them, one per camera, in the data module's order. */
export const INPUT_FRAMES: FrameInfo[] = frames({ kind: "input" }).filter((frame) => frame.width === frame.height);

export function cameraName(frame: FrameInfo): string {
  if (frame.camera === "front") return "Front camera";
  if (frame.camera === "wrist") return "Wrist camera";
  // A camera the data module does not name: its place in the list, never its file id.
  const place = INPUT_FRAMES.findIndex((entry) => entry.id === frame.id);
  return place >= 0 ? `Camera ${place + 1}` : "Camera";
}

// ---------------------------------------------------------------- the grid

export interface Grid {
  /** Side of the frame in pixels. */
  size: number;
  /** Side of a patch in pixels. */
  patch: number;
  /** Patches per side. */
  side: number;
  /** Patches in all: the number of tokens. */
  tokens: number;
}

/** The patch grid of a square frame. A frame that does not divide evenly loses its last partial row and column, as a strided convolution does. */
export function gridOf(size: number, patch: number): Grid {
  const side = Math.floor(size / patch);
  return { size, patch, side, tokens: side * side };
}

export interface Cell {
  row: number;
  col: number;
  /** Position in the sequence: patches are read row by row. */
  token: number;
  /** First pixel of the patch, x and y. */
  x: number;
  y: number;
}

export function cellOfToken(grid: Grid, token: number): Cell {
  const clamped = Math.max(0, Math.min(grid.tokens - 1, token));
  const row = Math.floor(clamped / grid.side);
  const col = clamped % grid.side;
  return { row, col, token: clamped, x: col * grid.patch, y: row * grid.patch };
}

/** The patch a pixel falls in. */
export function tokenAt(grid: Grid, x: number, y: number): number {
  const col = Math.max(0, Math.min(grid.side - 1, Math.floor(x / grid.patch)));
  const row = Math.max(0, Math.min(grid.side - 1, Math.floor(y / grid.patch)));
  return row * grid.side + col;
}

/** The centre of a patch, in pixels: kept as the focus, so that a new patch size lands on the same place. */
export function centreOf(grid: Grid, token: number): { x: number; y: number } {
  const cell = cellOfToken(grid, token);
  return { x: cell.x + grid.patch / 2, y: cell.y + grid.patch / 2 };
}

// ---------------------------------------------------------------- what is shown

/** A square of patches: its first row and column and its side, in patches. */
export interface Window {
  row0: number;
  col0: number;
  n: number;
}

export function wholeFrame(grid: Grid): Window {
  return { row0: 0, col0: 0, n: grid.side };
}

/** The patches the object touches with one more patch on every side, as a square inside the frame. */
export function windowAround(grid: Grid, coverage: Coverage): Window {
  const rows = coverage.tokens.map((token) => Math.floor(token / grid.side));
  const cols = coverage.tokens.map((token) => token % grid.side);
  const n = Math.min(grid.side, Math.max(Math.max(...rows) - Math.min(...rows), Math.max(...cols) - Math.min(...cols)) + 3);
  const place = (first: number, last: number) => {
    const start = Math.round((first + last) / 2 - (n - 1) / 2);
    return Math.max(0, Math.min(grid.side - n, start));
  };
  return { row0: place(Math.min(...rows), Math.max(...rows)), col0: place(Math.min(...cols), Math.max(...cols)), n };
}

// ---------------------------------------------------------------- an object on the grid

export interface Coverage {
  /** Object pixels in each patch the object touches, by token. */
  byToken: Map<number, number>;
  /** The touched tokens in sequence order. */
  tokens: number[];
  /** Rows and columns of patches the object spans. */
  rows: number;
  cols: number;
  /** The token whose patch the object covers most, and that share of the patch. */
  best: number;
  bestShare: number;
}

export function coverageOf(grid: Grid, mask: ObjectMask): Coverage {
  const byToken = new Map<number, number>();
  for (const index of mask.pixels) {
    const x = index % mask.frameSize;
    const y = Math.floor(index / mask.frameSize);
    if (x >= grid.side * grid.patch || y >= grid.side * grid.patch) continue;
    const token = tokenAt(grid, x, y);
    byToken.set(token, (byToken.get(token) ?? 0) + 1);
  }
  const tokens = [...byToken.keys()].sort((a, b) => a - b);
  const rows = new Set(tokens.map((token) => Math.floor(token / grid.side))).size;
  const cols = new Set(tokens.map((token) => token % grid.side)).size;
  let best = tokens[0] ?? 0;
  for (const token of tokens) if ((byToken.get(token) ?? 0) > (byToken.get(best) ?? 0)) best = token;
  return { byToken, tokens, rows, cols, best, bestShare: (byToken.get(best) ?? 0) / (grid.patch * grid.patch) };
}

// ---------------------------------------------------------------- words and numbers

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** A count as the chapters write it: 50,176. */
export function count(value: number): string {
  return whole.format(value);
}

/** A share of a patch or a frame, computed here (not measured): whole percent, or one decimal under 1%. */
export function share(value: number): string {
  if (value > 0 && value < 0.01) return `${(value * 100).toFixed(1)}%`;
  return `${Math.round(value * 100)}%`;
}

/** "tokens 75, 76, 89 and 90"; long lists are cut after `limit`. */
export function listTokens(tokens: number[], limit = 12): string {
  if (tokens.length === 0) return "no tokens";
  const shown = tokens.slice(0, limit).map(String);
  const word = tokens.length === 1 ? "token" : "tokens";
  if (tokens.length > limit) return `${word} ${shown.join(", ")} and ${tokens.length - limit} more`;
  if (shown.length === 1) return `${word} ${shown[0]}`;
  return `${word} ${shown.slice(0, -1).join(", ")} and ${shown.at(-1)}`;
}
