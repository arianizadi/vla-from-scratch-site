"use client";

import { AnimationFrame, Arrow, Cells, Label, Move, stagger } from "@/animations";

/** A schematic frame of 7 x 7 patches (the real grid is 14 x 14): a wall, a table, and the cube at row 4, column 2. */
const N = 7;
const CUBE: [number, number] = [4, 2];
const shade = (r: number, c: number) => (r === CUBE[0] && c === CUBE[1] ? 1 : r < 3 ? 0.15 : 0.3 + (((r * 3 + c * 5) % 4) / 3) * 0.15);

const FRAME = { x: 22, y: 80, cell: 20 };
const GRID = { x: 252, y: 44, cell: 11, gap: 3 };
const VECTOR = { x: 300, y: 226 };
const POOLED = [0.7, 0.2, 0.9, 0.4, 0.55, 0.1, 0.8, 0.35];

const cellAt = (r: number, c: number): [number, number] => [
  GRID.x + c * (GRID.cell + GRID.gap) + GRID.cell / 2,
  GRID.y + r * (GRID.cell + GRID.gap) + GRID.cell / 2,
];
const ALL = Array.from({ length: N * N }, (_, i) => [Math.floor(i / N), i % N] as const);

export function PooledVsPatches() {
  return (
    <AnimationFrame
      title="A summary or the whole map"
      description="One camera picture is handed on two ways. As patch tokens it stays a grid, one token per patch, so the cube's patch is still its own input. Pooled, all the patches are blended into one summary vector, which has no slot that says where anything was."
      steps={[
        "One camera picture, cut into patches.",
        "Patch tokens: one per patch, still laid out as a grid.",
        "Pooled: all of them blended into one summary vector.",
        "The grid still says where the cube is. The summary has no slot for where.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Label x={FRAME.x + (N * FRAME.cell) / 2} y={FRAME.y - 20} tone="muted" size={14}>
            one picture
          </Label>
          <g className="t-vision">
            {ALL.map(([r, c]) => (
              <rect
                key={`f-${r}-${c}`}
                x={FRAME.x + c * FRAME.cell}
                y={FRAME.y + r * FRAME.cell}
                width={FRAME.cell}
                height={FRAME.cell}
                className="a-fill"
                style={{ fillOpacity: Math.round((0.12 + 0.88 * shade(r, c)) * 100) / 100 }}
              />
            ))}
          </g>
          <rect x={FRAME.x} y={FRAME.y} width={N * FRAME.cell} height={N * FRAME.cell} rx={2} fill="none" className="t-faint a-stroke" strokeWidth={1.5} />

          <Arrow from={[FRAME.x + N * FRAME.cell + 8, 130]} to={[GRID.x - 10, 92]} tone="faint" drawn={step >= 1} opacity={step >= 1 ? 1 : 0} />
          <Arrow from={[FRAME.x + N * FRAME.cell + 8, 170]} to={[VECTOR.x - 74, VECTOR.y]} tone="faint" drawn={step >= 2} opacity={step >= 2 ? 1 : 0} />

          {ALL.map(([r, c], i) => {
            const [x, y] = cellAt(r, c);
            return (
              <g key={`t-${r}-${c}`}>
                <Move x={x} y={y} opacity={step >= 1 ? 1 : 0} delay={step === 1 ? stagger(r, 60) : 0}>
                  <rect x={-GRID.cell / 2} y={-GRID.cell / 2} width={GRID.cell} height={GRID.cell} rx={2} className="t-vision a-fill" style={{ fillOpacity: Math.round((0.2 + 0.8 * shade(r, c)) * 100) / 100 }} />
                </Move>
                <Move x={step >= 2 ? VECTOR.x : x} y={step >= 2 ? VECTOR.y : y} opacity={step === 2 ? 0.5 : 0} delay={step === 2 ? (i % 8) * 20 : 0}>
                  <rect x={-GRID.cell / 2} y={-GRID.cell / 2} width={GRID.cell} height={GRID.cell} rx={2} className="t-vision a-fill" style={{ fillOpacity: 0.5 }} />
                </Move>
              </g>
            );
          })}
          <rect
            x={cellAt(...CUBE)[0] - GRID.cell / 2 - 3}
            y={cellAt(...CUBE)[1] - GRID.cell / 2 - 3}
            width={GRID.cell + 6}
            height={GRID.cell + 6}
            rx={3}
            fill="none"
            className="a-t"
            style={{ stroke: "var(--mark)", opacity: step === 3 ? 1 : 0 }}
            strokeWidth={3}
          />

          <Label x={362} y={64} tone="vision" size={15} weight={700} anchor="start" opacity={step >= 1 ? 1 : 0}>
            patch tokens
          </Label>
          <Label x={362} y={88} tone="muted" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
            one per patch
          </Label>
          <Label x={362} y={112} tone="ink" size={14} weight={700} anchor="start" opacity={step === 3 ? 1 : 0}>
            keeps where
          </Label>

          <Cells x={VECTOR.x} y={VECTOR.y} values={POOLED} tone="vision" cell={12} gap={3} opacity={step >= 2 ? 1 : 0} delay={step === 2 ? 450 : 0} />
          <Label x={372} y={206} tone="vision" size={15} weight={700} anchor="start" opacity={step >= 2 ? 1 : 0}>
            pooled
          </Label>
          <Label x={372} y={230} tone="muted" size={14} anchor="start" opacity={step >= 2 ? 1 : 0}>
            one summary
          </Label>
          <Label x={372} y={254} tone="failure" size={14} weight={700} anchor="start" opacity={step === 3 ? 1 : 0}>
            where is lost
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
