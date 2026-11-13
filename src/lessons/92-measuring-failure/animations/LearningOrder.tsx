"use client";

import { useId } from "react";
import { AnimationFrame, Dot, Label, Path, stagger, type Tone } from "@/animations";

/**
 * A sketch of the order the chapter measured, checkpoint by checkpoint: the
 * policy first heads for the named object, then lands close to it, then
 * succeeds. Shapes only (smooth steps), no measured values.
 */
const PLOT_X = 176;
const PLOT_W = 280;
const ROW_H = 46;
const ROWS: { name: string; y: number; centre: number; tone: Tone }[] = [
  { name: "heads for the can", y: 72, centre: 0.32, tone: "accent" },
  { name: "lands close to it", y: 144, centre: 0.55, tone: "action" },
  { name: "succeeds", y: 216, centre: 0.76, tone: "success" },
];
/** Where the "now" line stands in each step, as a share of training. */
const NOW = [0.12, 0.44, 0.66, 0.92];

const r = (value: number) => Math.round(value * 10) / 10;
const level = (t: number, centre: number) => 1 / (1 + Math.exp(-(t - centre) * 22));
const px = (t: number) => r(PLOT_X + t * PLOT_W);
const py = (row: number, t: number) => r(ROWS[row].y + ROW_H / 2 - level(t, ROWS[row].centre) * ROW_H);

function curve(row: number): string {
  const points: string[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40;
    points.push(`${i === 0 ? "M" : "L"}${px(t)} ${py(row, t)}`);
  }
  return points.join("");
}

export function LearningOrder() {
  const clip = `learning-order-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    <AnimationFrame
      title="What improves first"
      description="A sketch of three readings over training, checked at saved stages. Early on all three are low. The policy first starts heading for the named object, then its misses shrink so it lands close, and only after both does success climb. A success rate of zero can hide the first two changes."
      steps={[
        "Early in training it closes at random. All three readings are low.",
        "First it starts heading for the right object. Success still reads zero.",
        "Next its misses shrink: it lands close to the can.",
        "Only then does success climb. The zero had hidden real progress.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const now = NOW[step];
        return (
          <>
            <defs>
              <clipPath id={clip}>
                <rect className="a-t" x={0} y={0} width={PLOT_W} height={290} style={{ transform: `translate(${PLOT_X}px, 0px) scale(${now}, 1)` }} />
              </clipPath>
            </defs>
            {ROWS.map((row, index) => (
              <g key={row.name}>
                <Label x={16} y={row.y} tone="ink" size={15} weight={700} anchor="start">
                  {row.name}
                </Label>
                <line
                  x1={PLOT_X}
                  y1={row.y + ROW_H / 2}
                  x2={PLOT_X + PLOT_W}
                  y2={row.y + ROW_H / 2}
                  className="t-faint a-stroke"
                  strokeWidth={1}
                />
                <Path d={curve(index)} tone="faint" width={2} dashed />
                <path d={curve(index)} className={`t-${row.tone} a-stroke`} strokeWidth={3} fill="none" clipPath={`url(#${clip})`} />
                <Dot x={px(now)} y={py(index, now)} r={7} tone={row.tone} delay={stagger(index, 60)} />
              </g>
            ))}
            <g className="a-t t-ink" style={{ transform: `translate(${px(now)}px, 0px)` }}>
              <line x1={0} y1={42} x2={0} y2={244} className="a-stroke" strokeWidth={1.5} strokeDasharray="4 4" />
            </g>
            <Label x={PLOT_X} y={266} tone="muted" size={14} anchor="start">
              early
            </Label>
            <Label x={PLOT_X + PLOT_W / 2} y={266} tone="muted" size={14}>
              training →
            </Label>
            <Label x={PLOT_X + PLOT_W} y={266} tone="muted" size={14} anchor="end">
              late
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
