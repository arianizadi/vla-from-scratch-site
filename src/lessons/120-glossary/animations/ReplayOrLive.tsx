"use client";

import { AnimationFrame, Arrow, Box, Label, Path, stagger } from "@/animations";

const FRAMES = [46, 106, 166];
const FRAME_Y = 112;
/** Toy guesses against the recorded moves: close every time. */
const RECORDED = [22, 30, 18];
const GUESSED = [20, 31, 19];

const CENTRE: [number, number] = [358, 146];
const R = 74;
const NODES = [
  { label: "picture", tone: "vision" as const, angle: -90 },
  { label: "policy", tone: "ink" as const, angle: 30 },
  { label: "move", tone: "action" as const, angle: 150 },
];

function onCircle(angle: number, radius = R): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [CENTRE[0] + radius * Math.cos(a), CENTRE[1] + radius * Math.sin(a)];
}

export function ReplayOrLive() {
  return (
    <AnimationFrame
      title="Replay, or the closed loop"
      description="On the left, recorded pictures are replayed and the model's guesses are compared with the expert's moves; they look close. On the right, the robot acts live: its own move makes the next picture, which the policy reads to choose the next move. Only the live loop on new tables gives the success rate."
      steps={[
        "Replay: show recorded pictures and compare the guesses with the expert's moves.",
        "Live: the robot's own move makes its next picture. This is the closed loop.",
        "Only live runs on new tables give the success rate. A good replay can still fail live.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Path d="M226 24V246" tone="faint" width={1} dashed />
          <Label x={106} y={30} tone={step === 0 ? "ink" : "muted"} size={15} weight={700}>
            replay
          </Label>
          {FRAMES.map((x, index) => (
            <g key={x} className="a-t" style={{ opacity: step === 2 ? 0.45 : 1 }}>
              <rect className="t-vision a-fill-soft a-stroke" x={x - 26} y={FRAME_Y - 36} width={52} height={40} rx={5} strokeWidth={1.5} />
              <rect className="t-action a-fill" x={x - 4 + index * 6} y={FRAME_Y - 20} width={10} height={10} rx={2} />
              <rect className="t-action a-fill a-t" x={x - 16} y={FRAME_Y + 18} width={RECORDED[index]} height={8} rx={2} />
              <rect
                className="t-accent a-fill a-t"
                x={x - 16}
                y={FRAME_Y + 32}
                width={GUESSED[index]}
                height={8}
                rx={2}
                style={{ opacity: step >= 0 ? 1 : 0, transitionDelay: `${stagger(index, 120)}ms` }}
              />
            </g>
          ))}
          <Label x={106} y={FRAME_Y + 66} tone="muted" size={13}>
            orange: expert · violet: guess
          </Label>
          <Label x={106} y={FRAME_Y + 92} tone={step === 2 ? "failure" : "success"} size={14} weight={700} opacity={step === 0 || step === 2 ? 1 : 0}>
            {step === 2 ? "close here, yet it may fail" : "close every time"}
          </Label>

          <Label x={CENTRE[0]} y={30} tone={step >= 1 ? "ink" : "muted"} size={15} weight={700}>
            live
          </Label>
          {NODES.map((node, index) => {
            const next = NODES[(index + 1) % NODES.length];
            const [x, y] = onCircle(node.angle);
            return (
              <g key={node.label}>
                <Arrow from={onCircle(node.angle + 30)} to={onCircle(next.angle - 30)} bend={-20} tone="faint" width={2} drawn={step >= 1} flow={step === 1} delay={index * 200} />
                <Box x={x} y={y} w={76} h={32} label={node.label} tone={node.tone} filled opacity={step >= 1 ? 1 : 0.25} delay={index * 120} />
              </g>
            );
          })}
          <Label x={CENTRE[0]} y={CENTRE[1] + 4} tone="ink" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
            closed loop
          </Label>
          <Label x={CENTRE[0]} y={250} tone="success" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            count successes here
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
