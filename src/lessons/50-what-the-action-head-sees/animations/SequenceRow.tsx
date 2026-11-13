"use client";

import { Arrow, AnimationFrame, Box, Label } from "@/animations";
import type { Tone } from "@/animations";

const ROW_Y = 170;
const H = 26;

interface Block {
  key: string;
  label: string;
  tone: Tone;
  cells: number;
  cell: number;
  gap: number;
  /** Which animation step fills this block. */
  at: number;
  /** Optional per-cell tones (the scene mixes words and image pieces). */
  tones?: Tone[];
}

const SCENE_TONES: Tone[] = ["language", "language", "language", "vision", "vision", "vision", "vision", "vision", "vision", "vision"];

const BLOCKS: Block[] = [
  { key: "time", label: "noise", tone: "ink", cells: 1, cell: 18, gap: 0, at: 1 },
  { key: "scene", label: "the scene", tone: "vision", cells: 10, cell: 13, gap: 3, at: 2, tones: SCENE_TONES },
  { key: "state", label: "joints", tone: "ink", cells: 1, cell: 18, gap: 0, at: 3 },
  { key: "actions", label: "15 future actions", tone: "action", cells: 15, cell: 9, gap: 3, at: 4 },
];
const BLOCK_GAP = 22;

const layout = (() => {
  const widths = BLOCKS.map((b) => b.cells * b.cell + (b.cells - 1) * b.gap);
  const total = widths.reduce((s, w) => s + w, 0) + BLOCK_GAP * (BLOCKS.length - 1);
  let x = 240 - total / 2;
  return BLOCKS.map((block, i) => {
    const left = x;
    x += widths[i] + BLOCK_GAP;
    return { ...block, left, width: widths[i], centre: left + widths[i] / 2 };
  });
})();

const HEAD_Y = 62;

export function SequenceRow() {
  return (
    <AnimationFrame
      title="What the action head reads"
      description="The action head reads a single row of tokens and nothing else: one token for how noisy the actions are, the scene as tokens handed over by the backbone (words and patches), one token for the arm's joint angles, and one slot for each of the 15 future actions. The action slots come out as the chunk of actions."
      steps={[
        "The action head reads one row of tokens. Nothing else reaches it.",
        "A token saying how noisy the actions still are.",
        "The scene, as tokens from the backbone: a few for the words, many for patches.",
        "One token for the arm's joint angles.",
        "One slot per future action. These are what come out, as the chunk.",
      ]}
      size={[480, 240]}
    >
      {(step) => (
        <>
          <Box x={240} y={HEAD_Y} w={200} h={46} label="action head" tone="accent" active={step >= 1} />
          <Arrow from={[200, ROW_Y - 22]} to={[214, HEAD_Y + 30]} tone="muted" flow={step >= 1 && step < 4} drawn={step >= 1} />
          <Arrow
            from={[266, HEAD_Y + 30]}
            to={[layout[3].centre, ROW_Y - 22]}
            tone="action"
            width={2.5}
            drawn={step >= 4}
            opacity={step >= 4 ? 1 : 0}
            delay={300}
          />

          {layout.map((block) => {
            const filled = step >= block.at;
            return (
              <g key={block.key}>
                {Array.from({ length: block.cells }, (_, i) => {
                  const x = block.left + i * (block.cell + block.gap);
                  const tone = block.tones?.[i] ?? block.tone;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={ROW_Y - H / 2}
                      width={block.cell}
                      height={H}
                      rx={3}
                      className={`a-t t-${filled ? tone : "faint"} ${filled ? "a-fill" : "cell-outline"}`}
                      style={{ transitionDelay: `${i * 30}ms`, fillOpacity: filled ? 0.85 : undefined }}
                    />
                  );
                })}
                <Label x={block.centre} y={ROW_Y + 34} tone={filled ? (block.tone === "ink" ? "ink" : block.tone) : "faint"} size={14} weight={filled ? 700 : 400}>
                  {block.label}
                </Label>
              </g>
            );
          })}
          <Label x={layout[1].centre} y={ROW_Y + 54} tone="muted" size={13} opacity={step >= 2 ? 1 : 0}>
            words + patches
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
