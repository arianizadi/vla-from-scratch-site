"use client";

import { AnimationFrame, Cells, Label, Move, Path, stagger } from "@/animations";

/** A small 2 x 2 picture whose four patches are followed. */
const PIECES = [
  { name: "A", r: 0, c: 0, x: 140 },
  { name: "B", r: 0, c: 1, x: 220 },
  { name: "C", r: 1, c: 0, x: 300 },
  { name: "D", r: 1, c: 1, x: 380 },
];
const SHADES = [0.25, 0.55, 0.85, 0.45];
const MINI = { x: 30, y: 92, cell: 30 };
const TOKEN_Y = 150;
const TOP = TOKEN_Y - 40;

/** Made-up values for each token and each place tag. */
const values = (seed: number) => Array.from({ length: 4 }, (_, i) => ((seed * 5 + i * 7 + seed * i) % 9) / 8);
const PLACES = ["top left", "top right", "low left", "low right"];

/** Every pair of tokens, for the arcs of "every patch reads every other". */
const PAIRS = PIECES.flatMap((a, i) => PIECES.slice(i + 1).map((b) => [a.x, b.x] as const));
const arc = ([x1, x2]: readonly [number, number]) => {
  const h = 14 + (x2 - x1) * 0.18;
  return `M${x1} ${TOP}Q${(x1 + x2) / 2} ${TOP - h} ${x2} ${TOP}`;
};

export function PositionAdd() {
  return (
    <AnimationFrame
      title="Every patch gets a place tag"
      description="A small picture of four patches is laid out as a row of four tokens. In the row, nothing says which patch was top left. The model keeps one learned place tag for every spot in the grid and adds it to the token from that spot. Then every patch token can compare itself with every other one."
      steps={[
        "Four patches from a picture, laid out as a row of tokens.",
        "In a row, nothing says which one was top left.",
        "The model keeps a learned place tag for every spot in the grid.",
        "Each tag is added to its patch's token: now the token knows its spot.",
        "Then every patch can compare notes with every other one.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Label x={MINI.x + MINI.cell} y={MINI.y - 22} tone="muted" size={14}>
            picture
          </Label>
          {PIECES.map((piece, i) => (
            <g key={`mini-${piece.name}`}>
              <rect
                x={MINI.x + piece.c * MINI.cell}
                y={MINI.y + piece.r * MINI.cell}
                width={MINI.cell - 2}
                height={MINI.cell - 2}
                rx={3}
                className="t-vision a-fill"
                style={{ fillOpacity: SHADES[i] }}
              />
              <Label x={MINI.x + piece.c * MINI.cell + MINI.cell / 2 - 1} y={MINI.y + piece.r * MINI.cell + MINI.cell / 2 - 1} tone="ink" size={13} weight={700}>
                {piece.name}
              </Label>
            </g>
          ))}

          {PAIRS.map((pair, i) => (
            <Path key={`${pair[0]}-${pair[1]}`} d={arc(pair)} tone="accent" width={1.5} drawn={step >= 4} opacity={step >= 4 ? 1 : 0} delay={stagger(i, 60)} />
          ))}

          {PIECES.map((piece, i) => (
            <g key={piece.name}>
              <Cells x={step >= 3 ? piece.x - 8 : piece.x} y={TOKEN_Y} values={values(i + 3).map((v) => (v + SHADES[i]) / 2)} tone="vision" cell={12} gap={3} direction="column" />
              <Label x={piece.x} y={TOKEN_Y + 46} tone="vision" size={14} weight={700}>
                {`patch ${piece.name}`}
              </Label>
              <Label x={piece.x} y={TOKEN_Y + 70} tone="failure" size={16} weight={700} opacity={step === 1 ? 1 : 0} delay={stagger(i, 80)}>
                ?
              </Label>
              <Label x={piece.x} y={TOKEN_Y + 70} tone="accent" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={stagger(i, 80) + 300}>
                {PLACES[i]}
              </Label>
              <Move x={step >= 3 ? piece.x + 8 : piece.x} y={step >= 3 ? TOKEN_Y : 246} opacity={step >= 2 ? 1 : 0} delay={stagger(i, 80)}>
                <Cells x={0} y={0} values={values(i + 11)} tone="accent" cell={12} gap={3} direction="column" />
              </Move>
            </g>
          ))}
          <Label x={64} y={246} tone="accent" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            place tags
          </Label>
          <Label x={260} y={36} tone="accent" size={14} weight={700} opacity={step >= 4 ? 1 : 0}>
            every patch reads every other
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
