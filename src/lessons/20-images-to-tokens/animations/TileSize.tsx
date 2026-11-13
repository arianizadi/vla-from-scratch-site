"use client";

import { AnimationFrame, Label } from "@/animations";
import { GRID, PATCHES } from "./scene";

const FX = 24;
const FY = 60;
const CELL = 14;
const SIDE = GRID * CELL;

/** Three patch sizes for the same picture: patches per side and the token count, (side)². */
const SIZES = [
  { across: 7, tokens: 49, y: 96 },
  { across: 14, tokens: 196, y: 150 },
  { across: 28, tokens: 784, y: 204 },
];
const BAR_X = 262;
const BAR_MAX = 160;

const lines = (across: number) => {
  const step = SIDE / across;
  return Array.from({ length: across - 1 }, (_, i) => {
    const offset = Math.round((i + 1) * step * 100) / 100;
    return `M${FX + offset} ${FY}V${FY + SIDE}M${FX} ${FY + offset}H${FX + SIDE}`;
  }).join("");
};

export function TileSize() {
  return (
    <AnimationFrame
      title="Smaller patches, many more tokens"
      description="The same camera picture is cut three ways. With 7 patches per side it makes 49 tokens. Halving the patch side gives 14 per side and 196 tokens, four times as many. Halving again gives 28 per side and 784 tokens. Smaller patches show finer detail, but every token adds work."
      steps={[
        "Big patches: 7 across, 7 down, so 49 tokens.",
        "Halve the patch side: 14 across, 196 tokens. Four times as many.",
        "Halve again: 28 across, 784 tokens.",
        "Finer patches see more detail, and every extra token costs work.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const current = Math.min(step, 2);
        return (
          <>
            <g className="t-vision">
              {PATCHES.map((row, r) =>
                row.map((value, c) => (
                  <rect
                    key={`${r}-${c}`}
                    x={FX + c * CELL}
                    y={FY + r * CELL}
                    width={CELL}
                    height={CELL}
                    className="a-fill"
                    style={{ fillOpacity: Math.round((0.12 + 0.88 * value) * 100) / 100 }}
                  />
                )),
              )}
            </g>
            {SIZES.map((size, i) => (
              <path
                key={size.across}
                d={lines(size.across)}
                className="a-t"
                style={{ stroke: "var(--surface)", opacity: i === current ? 1 : 0 }}
                strokeWidth={i === 2 ? 1 : 2}
                fill="none"
              />
            ))}
            <rect x={FX} y={FY} width={SIDE} height={SIDE} rx={2} fill="none" className="t-faint a-stroke" strokeWidth={1.5} />
            {SIZES.map((size, i) => (
              <Label key={`t-${size.across}`} x={FX + SIDE / 2} y={36} tone="vision" weight={700} opacity={i === current ? 1 : 0}>
                {`${size.across} × ${size.across} patches`}
              </Label>
            ))}

            <Label x={BAR_X} y={60} tone="muted" size={14} anchor="start">
              tokens per picture
            </Label>
            {SIZES.map((size, i) => {
              const width = Math.max(6, Math.round((size.tokens / 784) * BAR_MAX));
              const shown = i <= current;
              return (
                <g key={`bar-${size.across}`}>
                  <rect
                    x={BAR_X}
                    y={size.y - 12}
                    width={width}
                    height={24}
                    rx={5}
                    className={`a-t ${i === current ? "t-accent" : "t-faint"} a-fill`}
                    style={{ transform: `scaleX(${shown ? 1 : 0})`, transformBox: "fill-box", transformOrigin: "left center" }}
                  />
                  <Label x={BAR_X + width + 10} y={size.y} tone="ink" size={15} weight={700} anchor="start" opacity={shown ? 1 : 0}>
                    {String(size.tokens)}
                  </Label>
                </g>
              );
            })}
            <Label x={BAR_X + 96} y={256} tone="accent" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
              halve the patch: × 4 tokens
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
