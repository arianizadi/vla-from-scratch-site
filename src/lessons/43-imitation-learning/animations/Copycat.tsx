"use client";

import { AnimationFrame, Dot, Label, Path } from "@/animations";

const r = (value: number) => Math.round(value * 10) / 10;
const N = 22;
const X0 = 70;
const PITCH = 17;
const BASE_Y = 150;
const xAt = (i: number) => X0 + i * PITCH;
/** One joint's command over a reach (toy): at rest for two ticks, then a smooth S-curve up. */
const value = (i: number, sign = 1) => {
  const t = Math.min(1, Math.max(0, (i - 2) / 16));
  return r(BASE_Y - sign * 100 * (t * t * (3 - 2 * t)));
};
const CURVE = Array.from({ length: N }, (_, i) => value(i));
const OTHER = Array.from({ length: N }, (_, i) => value(i, -0.9));
const line = (ys: number[]) => ys.map((y, i) => `${i === 0 ? "M" : "L"}${xAt(i)} ${y}`).join("");

export function Copycat() {
  return (
    <AnimationFrame
      title="The copycat shortcut"
      description="One joint's commands during a demonstration form a smooth curve. Guessing each command as the same as the previous one lands almost on top of the curve everywhere, with no camera needed. Only at the start, when the arm is at rest and the reach could head for one object or another, does the guess say nothing: there only the cameras can tell which way to go. The curve is a toy."
      steps={[
        "One joint's commands during a demonstration: a smooth curve.",
        "Guess each command as “same as the last one”.",
        "The guess is nearly right almost everywhere, and needs no camera.",
        "Except at the start: from rest, the reach could go either way. Only the cameras can tell.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Path d={`M${X0 - 14} ${BASE_Y + 104}H${xAt(N - 1) + 14}`} tone="faint" width={1.5} />
          <Label x={xAt(N - 1) + 10} y={BASE_Y + 122} tone="faint" size={13} anchor="end">
            {"time →"}
          </Label>
          <rect x={X0 - 12} y={30} width={PITCH * 3 + 8} height={226} rx={8} className="a-t t-mark a-fill-soft" style={{ opacity: step >= 3 ? 1 : 0 }} />
          <Label x={X0 + 14} y={20} tone="ink" size={13} weight={700} opacity={step >= 3 ? 1 : 0}>
            needs the camera
          </Label>

          <Path d={line(OTHER)} tone="faint" width={2} dashed drawn={step >= 3} />
          <Label x={xAt(N - 1)} y={OTHER[N - 1] - 26} tone="muted" size={13} anchor="end" opacity={step >= 3 ? 1 : 0}>
            another object
          </Label>

          {CURVE.map((y, i) => (
            <Dot key={`c-${i}`} x={xAt(i)} y={y} r={4.5} tone="action" delay={i * 30} />
          ))}
          <Label x={xAt(N - 1)} y={CURVE[N - 1] - 22} tone="action" size={14} anchor="end" weight={700}>
            {"the expert's commands"}
          </Label>

          {CURVE.map((_, i) =>
            i === 0 ? null : (
              <Dot
                key={`g-${i}`}
                x={xAt(i)}
                y={CURVE[i - 1]}
                r={6.5}
                tone="accent"
                hollow
                opacity={step >= 1 ? 1 : 0}
                delay={i * 30}
              />
            ),
          )}
          <Label x={xAt(9)} y={CURVE[9] + 40} tone="accent" size={14} anchor="start" weight={700} opacity={step >= 1 ? 1 : 0}>
            “same as the last”
          </Label>
          <Label x={xAt(9)} y={CURVE[9] + 60} tone="success" size={14} anchor="start" opacity={step === 2 ? 1 : 0}>
            nearly right, no camera
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
