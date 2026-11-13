"use client";

import { AnimationFrame, Chip, Label, Thing } from "@/animations";

type Kind = "cube" | "can" | "nut";
const ROWS: { name: string; y: number; scene: Kind[]; tone: "vision" | "muted" }[] = [
  { name: "its own picture", y: 86, scene: ["cube", "can", "nut"], tone: "vision" },
  { name: "another picture", y: 196, scene: ["nut", "cube"], tone: "muted" },
];
const THUMB = { x: 16, w: 124, h: 66 };
const BAR = { x: 336, w: 124, h: 18 };

/** How surprised the model is by the true caption: a toy scale, 0 to 1. Looking model, then blind model. */
const SURPRISE = [
  [0.12, 0.12, 0.12, 0.62],
  [0, 0, 1, 0.62],
];

export function SwapPicture() {
  return (
    <AnimationFrame
      title="Swap the picture"
      description="The model reads the true caption twice: once with its own picture, once with another scene's picture, and we measure how surprised it is by the caption each time. A model that looks is barely surprised with the right picture and far more surprised with the wrong one. If both surprises are the same, the picture is not getting through."
      steps={[
        "The true caption with its own picture: the model is barely surprised.",
        "Same caption, but with another scene's picture.",
        "A model that looks is far more surprised by the wrong picture.",
        "If both bars match, the picture is not getting through.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Label x={BAR.x} y={30} tone="muted" size={14} anchor="start">
            surprise
          </Label>
          {ROWS.map((row, r) => {
            const shown = r === 0 || step >= 1;
            const top = row.y - THUMB.h / 2;
            const floor = top + THUMB.h - 12;
            const value = SURPRISE[r][step];
            return (
              <g key={row.name} className="a-t" style={{ opacity: shown ? 1 : 0 }}>
                <rect x={THUMB.x} y={top} width={THUMB.w} height={THUMB.h} rx={8} className={`t-${row.tone} a-fill-soft a-stroke`} strokeWidth={1.5} />
                {row.scene.map((kind, i) => (
                  <Thing key={kind} kind={kind} x={THUMB.x + 30 + i * 32} y={floor} size={18} tone={row.tone} />
                ))}
                <Label x={THUMB.x + THUMB.w / 2} y={row.y + THUMB.h / 2 + 14} tone="muted" size={13}>
                  {row.name}
                </Label>
                <Chip x={238} y={row.y} text="cube, can, nut" tone="language" size={14} mono={false} />
                <rect x={BAR.x} y={row.y - BAR.h / 2} width={BAR.w} height={BAR.h} rx={5} className="t-faint a-fill-soft" />
                <rect
                  x={BAR.x}
                  y={row.y - BAR.h / 2}
                  width={BAR.w}
                  height={BAR.h}
                  rx={5}
                  className={`a-t ${step === 3 ? "t-failure" : "t-accent"} a-fill`}
                  style={{ transform: `scaleX(${Math.max(0.001, value)})`, transformBox: "fill-box", transformOrigin: "left center" }}
                />
              </g>
            );
          })}
          <Label x={BAR.x + BAR.w / 2} y={196 + 32} tone="accent" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            it looks
          </Label>
          <Label x={BAR.x + BAR.w / 2} y={196 + 32} tone="failure" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            same: it is blind
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
