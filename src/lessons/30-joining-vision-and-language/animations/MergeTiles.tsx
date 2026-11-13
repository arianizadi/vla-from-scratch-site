"use client";

import { AnimationFrame, Label, Move } from "@/animations";

const CELL = 32;
const GX = 32;
const GY = 70;
const N = 4;
const SHADES = [0.3, 0.45, 0.25, 0.4, 0.5, 0.95, 0.35, 0.3, 0.4, 0.35, 0.55, 0.3, 0.25, 0.45, 0.35, 0.5];
const STRIP_X = 300;
const STRIP_Y = 78;
const TILE = 26;

const tiles = Array.from({ length: N * N }, (_, i) => {
  const r = Math.floor(i / N);
  const c = i % N;
  const group = Math.floor(r / 2) * 2 + Math.floor(c / 2);
  const slot = (r % 2) * 2 + (c % 2);
  return { i, r, c, group, slot };
});

export function MergeTiles() {
  return (
    <AnimationFrame
      title="Fewer, wider tokens"
      description="A picture of 4 by 4 patches makes 16 tokens. Each 2 by 2 block of neighbouring patches is glued into one wider token, leaving 4 tokens, each four times wider. Fewer tokens means less work, but the cube, which filled one small patch, is now only known to lie somewhere in a bigger square."
      steps={[
        "A picture of 4 by 4 patches: 16 tokens.",
        "Group neighbours in blocks of 2 by 2.",
        "Glue each block into one wider token: 4 tokens instead of 16.",
        "Less work, but the cube is now only known to lie in a bigger square.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {tiles.map((tile) => (
            <rect
              key={`bg-${tile.i}`}
              x={GX + tile.c * CELL + 1}
              y={GY + tile.r * CELL + 1}
              width={CELL - 2}
              height={CELL - 2}
              rx={3}
              className="t-vision a-fill"
              style={{ fillOpacity: Math.round(SHADES[tile.i] * 0.5 * 100) / 100 }}
            />
          ))}
          {[0, 1, 2, 3].map((group) => (
            <rect
              key={`group-${group}`}
              x={GX + (group % 2) * 2 * CELL - 2}
              y={GY + Math.floor(group / 2) * 2 * CELL - 2}
              width={2 * CELL + 4}
              height={2 * CELL + 4}
              rx={6}
              fill="none"
              strokeWidth={step === 3 && group === 0 ? 3 : 2}
              className="a-t a-stroke"
              style={{ stroke: step === 3 && group === 0 ? "var(--mark)" : "var(--accent)", opacity: step === 1 || (step === 3 && group === 0) ? 1 : 0 }}
            />
          ))}
          <circle cx={GX + 1.3 * CELL} cy={GY + 1.35 * CELL} r={7} className="a-t t-action a-fill" style={{ opacity: step === 3 ? 1 : 0 }} />
          <Label x={GX + 2 * CELL} y={GY + 4 * CELL + 24} tone="muted" size={14}>
            picture
          </Label>

          {tiles.map((tile) => {
            const merged = step >= 2;
            const x = merged ? STRIP_X + (tile.slot - 1.5) * (TILE + 2) : GX + tile.c * CELL + CELL / 2;
            const y = merged ? STRIP_Y + tile.group * 44 : GY + tile.r * CELL + CELL / 2;
            return (
              <Move key={`t-${tile.i}`} x={x} y={y} delay={merged ? tile.group * 120 + tile.slot * 30 : 0}>
                <rect x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} rx={3} className="t-vision a-fill" style={{ fillOpacity: SHADES[tile.i] }} />
              </Move>
            );
          })}
          {[0, 1, 2, 3].map((group) => (
            <rect
              key={`strip-${group}`}
              x={STRIP_X - 2 * (TILE + 2) - 3}
              y={STRIP_Y + group * 44 - TILE / 2 - 4}
              width={4 * (TILE + 2) + 4}
              height={TILE + 8}
              rx={7}
              fill="none"
              strokeWidth={2}
              className="a-t t-accent a-stroke"
              style={{ opacity: step >= 2 ? 1 : 0, transitionDelay: step >= 2 ? `${group * 120 + 300}ms` : undefined }}
            />
          ))}

          <Label x={GX + 2 * CELL} y={40} tone="ink" size={16} weight={700} opacity={step <= 1 ? 1 : 0}>
            16 tokens
          </Label>
          <Label x={STRIP_X} y={36} tone="accent" size={16} weight={700} opacity={step >= 2 ? 1 : 0}>
            4 wider tokens
          </Label>
          <Label x={112} y={40} tone="action" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            cube: somewhere in here
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
