"use client";

import { AnimationFrame, Arrow, Box, Cells, Label, stagger } from "@/animations";

const FILE: [number, number] = [240, 34];
const ROUTES = [
  { name: "training", x: 120, skips: -1 },
  { name: "real use", x: 360, skips: 1 },
];
const STEPS = ["open", "rescale", "centre"];
const stepY = (i: number) => 92 + i * 48;
const OUT_Y = 246;
const PICTURE = [0.2, 0.45, 0.7, 0.35, 0.9, 0.55];
const BLOWN = [0, 0, 0, 0, 0, 0];

export function TwoPaths() {
  return (
    <AnimationFrame
      title="Same picture, two routes"
      description="One picture file goes into the model by two routes: the training route and the route used in real use. Each prepares the picture in steps: open it, rescale the brightness, centre it. Here the real-use route skipped the rescale step, raising no error, so its output is washed out. Comparing what both routes produce shows the mismatch before any model is involved."
      steps={[
        "One picture file, two routes into the model: training and real use.",
        "Each route prepares it in steps. Here one route skipped a step, with no error.",
        "What comes out differs: to the model, a washed-out picture.",
        "Compare both outputs for the same file. They must match exactly.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <rect x={FILE[0] - 26} y={FILE[1] - 18} width={52} height={36} rx={5} className="t-vision a-fill-soft a-stroke" strokeWidth={1.5} />
          <Label x={FILE[0] + 38} y={FILE[1]} tone="vision" size={13} anchor="start">
            one picture
          </Label>
          {ROUTES.map((route, r) => (
            <g key={route.name}>
              <Arrow from={[FILE[0] + (r === 0 ? -30 : 30), FILE[1] + 6]} to={[route.x + (r === 0 ? 40 : -40), stepY(0) - 16]} tone="faint" />
              <Label x={route.x} y={58} tone="ink" size={14} weight={700} anchor={r === 0 ? "end" : "start"}>
                {route.name}
              </Label>
              {STEPS.map((name, i) => {
                const skipped = i === route.skips;
                return (
                  <Box
                    key={name}
                    x={route.x}
                    y={stepY(i)}
                    w={140}
                    h={34}
                    label={skipped ? `${name}: skipped` : name}
                    tone={skipped ? "failure" : "ink"}
                    active={skipped && step === 1}
                    opacity={step >= 1 ? (skipped ? 0.75 : 1) : 0}
                    delay={stagger(i, 120)}
                  />
                );
              })}
              <Cells x={route.x} y={OUT_Y} values={r === 0 ? PICTURE : BLOWN} tone="vision" cell={14} gap={3} opacity={step >= 2 ? 1 : 0} />
            </g>
          ))}
          <Label x={240} y={OUT_Y} tone="failure" size={26} weight={700} opacity={step === 3 ? 1 : 0}>
            ≠
          </Label>
          <Label x={120} y={OUT_Y + 26} tone="muted" size={13} opacity={step >= 2 ? 1 : 0}>
            as trained
          </Label>
          <Label x={360} y={OUT_Y + 26} tone="failure" size={13} weight={700} opacity={step >= 2 ? 1 : 0}>
            washed out
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
