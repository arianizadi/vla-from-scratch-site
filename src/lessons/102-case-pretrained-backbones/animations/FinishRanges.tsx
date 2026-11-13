"use client";

import { AnimationFrame, Dot, Label, Path, scale, type Tone } from "@/animations";

/** Wilson 95% interval for k successes in n tries, in percent, rounded. */
function wilson(k: number, n: number): [number, number] {
  const z = 1.96;
  const p = k / n;
  const centre = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / (1 + (z * z) / n);
  return [Math.round((centre - half) * 1000) / 10, Math.round((centre + half) * 1000) / 10];
}

/** Final scores, averaged weights, 100 tries each (lab notebook, "From-scratch VLA, every token, no history"). */
const RUNS: { name: string; tone: Tone; k: number; y: number }[] = [
  { name: "pretrained", tone: "accent", k: 87, y: 106 },
  { name: "blank", tone: "ink", k: 85, y: 176 },
];
const N = 100;
const sx = scale([60, 100], [120, 440]);
const TICKS = [60, 70, 80, 90, 100];

export function FinishRanges() {
  return (
    <AnimationFrame
      title="The same finish, within the wobble"
      description="At the end of training the pretrained robot lifted the object in 87 of 100 tries and the blank one in 85. A test of 100 tries wobbles by chance, so each score comes with a band of values that are just as believable: about 79 to 92 and 77 to 91. The bands overlap almost entirely, so with one training run each the two cannot be ranked."
      steps={[
        "At the end of training: 87 and 85 lifts in 100 tries.",
        "One test of 100 tries wobbles. Each score has a band of equally believable values.",
        "The bands overlap almost entirely. One run each cannot rank them.",
        "On this simple task, pretraining bought an earlier start, not a better finish.",
      ]}
      size={[480, 270]}
      hold={[2400, 2800, 2800, 3800]}
    >
      {(step) => (
        <>
          <Path d={`M${sx(60)} 228H${sx(100)}`} tone="faint" width={1.5} />
          {TICKS.map((tick) => (
            <g key={tick}>
              <Path d={`M${sx(tick)} 228v5`} tone="faint" width={1.5} />
              <Label x={sx(tick)} y={246} tone="muted" size={13}>
                {`${tick}`}
              </Label>
            </g>
          ))}
          <Label x={sx(100)} y={26} tone="muted" size={13} anchor="end">
            lifted, out of 100 tries
          </Label>
          <rect
            x={sx(Math.max(...RUNS.map((r) => wilson(r.k, N)[0])))}
            y={88}
            width={sx(Math.min(...RUNS.map((r) => wilson(r.k, N)[1]))) - sx(Math.max(...RUNS.map((r) => wilson(r.k, N)[0])))}
            height={106}
            rx={8}
            className="a-t t-mark a-fill-soft"
            style={{ opacity: step === 2 ? 0.7 : 0 }}
          />
          {RUNS.map((run) => {
            const [low, high] = wilson(run.k, N);
            return (
              <g key={run.name}>
                <Label x={104} y={run.y} tone={run.tone} size={15} weight={700} anchor="end">
                  {run.name}
                </Label>
                <rect
                  x={sx(low)}
                  y={run.y - 12}
                  width={sx(high) - sx(low)}
                  height={24}
                  rx={12}
                  className={`a-t t-${run.tone} a-fill-soft`}
                  style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scaleX(1)" : "scaleX(0.2)", transformBox: "fill-box", transformOrigin: "50% 50%" }}
                />
                <Dot x={sx(run.k)} y={run.y} r={7} tone={run.tone} />
                <Label x={sx(run.k)} y={run.y - 26} tone={run.tone} size={15} weight={700}>
                  {`${run.k}`}
                </Label>
                <Label x={sx(low)} y={run.y + 26} tone="muted" size={13} opacity={step >= 1 ? 1 : 0}>
                  {`${Math.round(low)}`}
                </Label>
                <Label x={sx(high)} y={run.y + 26} tone="muted" size={13} opacity={step >= 1 ? 1 : 0}>
                  {`${Math.round(high)}`}
                </Label>
              </g>
            );
          })}
          <Label x={240} y={52} tone="accent" size={14} weight={700} anchor="middle" opacity={step === 3 ? 1 : 0}>
            {"earlier start ≠ better finish"}
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
