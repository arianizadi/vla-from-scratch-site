"use client";

import { AnimationFrame, Arrow, Cells, Chip, Label, Move, stagger } from "@/animations";

/** The toy vocabulary from the merges, in id order. */
const VOCAB = ["b", "c", "d", "e", "s", "t", "u", "be", "ube", "cube", "tube"];

/** A fixed, made-up row of numbers per token (an embedding table starts random and is learned). */
const ROWS = VOCAB.map((_, row) => Array.from({ length: 6 }, (_, col) => ((row * 7 + col * 5 + row * col * 3) % 11) / 10));

const TOP = 40;
const ROW_H = 20;
const rowY = (id: number) => TOP + id * ROW_H;
const TABLE_X = 262;

/** "cubes" encodes as cube, s: ids 9 and 4. */
const INPUT = [
  { text: "cube", id: 9, y: 96 },
  { text: "s", id: 4, y: 176 },
];

export function EmbeddingLookup() {
  return (
    <AnimationFrame
      title="An id is a row number"
      description="The word cubes arrives as two ids, 9 for cube and 4 for s. The model's embedding table has one row of numbers per token in the vocabulary. Id 9 selects the row for cube and id 4 the row for s; the model copies those rows out and works with the vectors from then on."
      steps={[
        "cubes arrives as two ids: 9 (cube) and 4 (s).",
        "The table has one row per token. Id 9 points at row 9.",
        "The model copies that row out: a list of numbers for cube.",
        "Same for id 4. A real table has tens of thousands of rows.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Label x={TABLE_X + 4} y={TOP - 22} tone="muted" size={14}>
            embedding table
          </Label>
          {VOCAB.map((token, id) => {
            const lit = (step >= 1 && id === 9) || (step >= 3 && id === 4);
            return (
              <g key={token}>
                <Label x={TABLE_X - 72} y={rowY(id)} tone="faint" size={13} anchor="end" mono>
                  {String(id)}
                </Label>
                <Label x={TABLE_X - 64} y={rowY(id)} tone={lit ? "ink" : "muted"} size={13} anchor="start" mono weight={lit ? 700 : 400}>
                  {token}
                </Label>
                <Cells x={TABLE_X + 20} y={rowY(id)} values={ROWS[id]} tone={lit ? "mark" : "language"} cell={14} gap={3} opacity={lit ? 1 : 0.55} />
              </g>
            );
          })}

          {INPUT.map((input, index) => {
            const pointing = index === 0 ? step >= 1 : step >= 3;
            return (
              <g key={input.text}>
                <Chip x={56} y={input.y} text={String(input.id)} tone="ink" variant="outline" size={16} sub={input.text} />
                <Arrow from={[80, input.y]} to={[TABLE_X - 84, rowY(input.id)]} bend={index === 0 ? -14 : 14} tone="ink" drawn={pointing} />
              </g>
            );
          })}

          {INPUT.map((input, index) => {
            const out = index === 0 ? step >= 2 : step >= 3;
            return (
              <Move key={`out-${input.text}`} x={out ? 418 : TABLE_X + 20} y={out ? input.y : rowY(input.id)} opacity={out ? 1 : 0} delay={index === 1 ? 500 : 0}>
                <Cells x={0} y={0} values={ROWS[input.id]} tone="language" cell={12} gap={3} />
                <Label x={0} y={22} tone="muted" size={13}>
                  {`numbers for ${input.text}`}
                </Label>
              </Move>
            );
          })}
          <Label x={418} y={TOP - 22} tone="muted" size={14} opacity={step >= 2 ? 1 : 0} delay={stagger(2)}>
            to the model
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
