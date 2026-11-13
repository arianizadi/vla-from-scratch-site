"use client";

import { AnimationFrame, Arrow, Label, stagger } from "@/animations";

/* Left: demonstrations, each a different scene. Right: practice, counted in
   passes through every card (epochs). */

const TILE_W = 42;
const TILE_H = 30;
const COLS = 4;
const ROWS = 3;
const GRID_LEFT = 30;
const GRID_TOP = 70;

/** Fixed, made-up object places per scene (fractions of the tile), the first one named. */
const SCENES = Array.from({ length: COLS * ROWS }, (_, index) => {
  const a = ((index * 7 + 3) % 10) / 10;
  const b = ((index * 3 + 5) % 10) / 10;
  const c = ((index * 9 + 1) % 10) / 10;
  return [
    { x: 0.15 + 0.7 * a, y: 0.3 + 0.4 * b },
    { x: 0.15 + 0.7 * c, y: 0.3 + 0.4 * a },
    { x: 0.15 + 0.7 * b, y: 0.3 + 0.4 * c },
  ];
});

const BAR_X = 362;
/** What the practice readout shows in steps 1 to 3. */
const READOUTS = [
  { big: "5M", small: "practice cards drawn" },
  { big: "1", small: "pass: every card seen once" },
  { big: "×19", small: "passes over all of it" },
];

export function TwoDials() {
  return (
    <AnimationFrame
      title="Two dials: scenes and practice"
      description="Two numbers are set before training. The number of demonstrations says how many different scenes the robot gets to learn from. The number of training examples says how much it practises on them. One pass through every practice card is an epoch; the long runs here went through about 19."
      steps={[
        "Dial one: demonstrations. Here, 4000 different scenes to learn from.",
        "Dial two: practice. Here, 5 million practice cards drawn from them.",
        "Going once through every card is one pass, an epoch.",
        "Our long runs went through all the cards about 19 times.",
      ]}
      size={[480, 212]}
    >
      {(step) => (
        <>
          <Label x={GRID_LEFT} y={36} tone="ink" size={15} weight={700} anchor="start">
            demonstrations
          </Label>
          {SCENES.map((objects, index) => {
            const col = index % COLS;
            const row = Math.floor(index / COLS);
            const x = GRID_LEFT + col * (TILE_W + 6);
            const y = GRID_TOP + row * (TILE_H + 6);
            return (
              <g key={index} className="a-t" style={{ opacity: 1, transitionDelay: `${stagger(index, 40)}ms` }}>
                <rect className="t-faint a-fill-soft a-stroke" x={x} y={y} width={TILE_W} height={TILE_H} rx={4} strokeWidth={1.2} />
                <rect
                  className="a-t t-accent a-stroke"
                  x={x - 2}
                  y={y - 2}
                  width={TILE_W + 4}
                  height={TILE_H + 4}
                  rx={5}
                  fill="none"
                  strokeWidth={2}
                  style={{ opacity: step >= 2 ? 1 : 0, transitionDelay: step >= 2 ? `${index * 90}ms` : "0ms" }}
                />
                {objects.map((object, k) => (
                  <circle
                    key={k}
                    className={k === 0 ? "t-action a-fill" : "t-muted a-fill"}
                    cx={x + object.x * TILE_W}
                    cy={y + object.y * TILE_H}
                    r={3.2}
                  />
                ))}
              </g>
            );
          })}
          <Label x={GRID_LEFT} y={GRID_TOP + ROWS * (TILE_H + 6) + 14} tone="muted" size={13} anchor="start">
            4000 different scenes
          </Label>

          <Arrow from={[GRID_LEFT + COLS * (TILE_W + 6) + 6, 124]} to={[BAR_X - 86, 124]} tone="accent" width={2} drawn={step >= 1} flow={step === 1} />

          <Label x={BAR_X} y={36} tone="ink" size={15} weight={700} opacity={step >= 1 ? 1 : 0}>
            practice
          </Label>
          {READOUTS.map((readout, index) => (
            <g key={readout.big}>
              <Label x={BAR_X} y={112} tone="accent" size={48} weight={700} opacity={step === index + 1 ? 1 : 0}>
                {readout.big}
              </Label>
              <Label x={BAR_X} y={152} tone="muted" size={14} opacity={step === index + 1 ? 1 : 0}>
                {readout.small}
              </Label>
            </g>
          ))}
        </>
      )}
    </AnimationFrame>
  );
}
