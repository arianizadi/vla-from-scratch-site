"use client";

import { AnimationFrame, Bracket, Label } from "@/animations";

/** A zoomed piece of the frame: 4 x 3 patches, 72 units per 16 px patch (4.5 units per pixel). */
const P = 72;
const X0 = 24;
const Y0 = 44;
const COLS = 4;
const ROWS = 3;
const PX = P / 16;

/** The cube's outline, about 16 x 18 px (the chapter's median estimate), placed across two grid lines. */
const CUBE = { x: X0 + 1.6 * P, y: Y0 + 0.55 * P, w: 16 * PX, h: 18 * PX };

/** How much of the cube's outline falls in each patch, 0..1 (computed from the drawing above). */
const SHARES = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => {
    const left = Math.max(CUBE.x, X0 + c * P);
    const right = Math.min(CUBE.x + CUBE.w, X0 + (c + 1) * P);
    const top = Math.max(CUBE.y, Y0 + r * P);
    const bottom = Math.min(CUBE.y + CUBE.h, Y0 + (r + 1) * P);
    const area = Math.max(0, right - left) * Math.max(0, bottom - top);
    return Math.round((area / (CUBE.w * CUBE.h)) * 100) / 100;
  }),
);
const MOST = Math.max(...SHARES.flat());

const PANEL = 394;

export function CubeAcrossPatches() {
  return (
    <AnimationFrame
      title="Finer than one patch"
      description="Zoomed into a camera picture, each square is one patch. The cube is about one patch wide and usually straddles the borders between patches. Knowing only which patch holds it places the cube to about 6 cm. How the cube's colour splits between neighbouring patches says much more: the robot's grasps closed about ≈ 6 mm from the object."
      steps={[
        "Zoomed in: each square is one patch.",
        "The cube is about one patch wide.",
        "It usually sits across borders. Which patch alone places it to about 6 cm.",
        "How its colour splits between patches says far more: grasps land within millimetres.",
      ]}
      size={[480, 300]}
    >
      {(step) => (
        <>
          {SHARES.map((row, r) =>
            row.map((share, c) => (
              <g key={`${r}-${c}`}>
                <rect
                  x={X0 + c * P}
                  y={Y0 + r * P}
                  width={P}
                  height={P}
                  className="a-t t-mark a-fill-soft"
                  style={{ opacity: step === 2 && share > 0 ? 0.6 : 0 }}
                />
                <rect
                  x={X0 + c * P}
                  y={Y0 + r * P}
                  width={P}
                  height={P}
                  className="a-t t-vision a-fill"
                  style={{ opacity: step === 3 ? Math.round((0.1 + 0.6 * (share / MOST)) * 100) / 100 : 0 }}
                />
              </g>
            )),
          )}
          <Bracket x1={X0} x2={X0 + P} y={Y0 - 16} label="one patch" tone="muted" opacity={step === 0 ? 1 : 0} />

          <rect
            x={CUBE.x}
            y={CUBE.y}
            width={CUBE.w}
            height={CUBE.h}
            rx={4}
            className="a-t t-vision a-fill-soft a-stroke"
            strokeWidth={2.5}
            style={{ opacity: step >= 1 ? 1 : 0, fillOpacity: step === 3 ? 0 : 0.75 }}
          />
          <path
            d={
              Array.from({ length: COLS + 1 }, (_, i) => `M${X0 + i * P} ${Y0}V${Y0 + ROWS * P}`).join("") +
              Array.from({ length: ROWS + 1 }, (_, i) => `M${X0} ${Y0 + i * P}H${X0 + COLS * P}`).join("")
            }
            className="t-faint a-stroke"
            strokeWidth={1.5}
            fill="none"
          />
          <Label x={CUBE.x + CUBE.w / 2} y={Y0 + ROWS * P + 20} tone="vision" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
            cube: about one patch
          </Label>

          <Label x={PANEL} y={110} tone="muted" size={14} opacity={step === 2 ? 1 : 0}>
            which patch alone
          </Label>
          <Label x={PANEL} y={142} tone="ink" size={26} weight={700} opacity={step === 2 ? 1 : 0}>
            ≈ 6 cm
          </Label>
          <Label x={PANEL} y={172} tone="faint" size={13} opacity={step === 2 ? 1 : 0}>
            give or take
          </Label>

          <Label x={PANEL} y={110} tone="muted" size={14} opacity={step === 3 ? 1 : 0}>
            from the split
          </Label>
          <Label x={PANEL} y={142} tone="ink" size={26} weight={700} opacity={step === 3 ? 1 : 0}>
            ≈ 6 mm
          </Label>
          <Label x={PANEL} y={172} tone="faint" size={13} opacity={step === 3 ? 1 : 0}>
            grasps landed
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
