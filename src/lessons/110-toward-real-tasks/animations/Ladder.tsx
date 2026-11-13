"use client";

import { AnimationFrame, Chip, Label, Move, Path, stagger } from "@/animations";

/** The rungs toward pruning, in order, with the group each belongs to and how it went (lab notebook, steps 1-8). */
const RUNGS = [
  { text: "follow a moving object", group: 1, status: "learned" },
  { text: "tell look-alikes apart", group: 1, status: "learned" },
  { text: "see past leaves in the way", group: 1, status: "learned" },
  { text: "grip a thin stem from the side", group: 2, status: "hard" },
  { text: "cut the stem", group: 2, status: "learned" },
  { text: "cut a shoot, spare the flower", group: 3, status: "learned" },
  { text: "turn the plant first", group: 3, status: "learned" },
  { text: "prune the whole plant", group: 3, status: "partly" },
] as const;

const TOP = 34;
const GAP = 34;
const RISE = 9;
const yOf = (index: number) => TOP + (RUNGS.length - 1 - index) * GAP;
const xOf = (index: number) => 30 + index * RISE;
/** The highest rung reached at the end of each step (-1: still at the bottom). */
const REACHED = [-1, 2, 4, 7];

/** The staircase outline: a tread under each rung, a riser between them. */
const STAIRS = RUNGS.map((_, i) => {
  const y = yOf(i) + 15;
  const x = xOf(i) - 14;
  return `${i === 0 ? `M${x - 8} ${y}` : `V${y}`}H${x + 26}`;
}).join("");

export function Ladder() {
  return (
    <AnimationFrame
      title="One new difficulty per rung"
      description="The pruning task split into eight rungs, climbed from the bottom. First seeing: follow a moving object, tell look-alikes apart, see past leaves. Then the hand: grip a thin stem from the side, which stayed hard, and cut it. Then the plant: cut a shoot without touching the flower, turn the plant first, and prune the whole plant, which works partly so far."
      steps={[
        "The final task, split into rungs. Each adds one new difficulty.",
        "First, seeing: a moving object, look-alikes, leaves in the way.",
        "Then the hand: grip a thin stem from the side, then cut it.",
        "Then the plant: cut a shoot, turn the plant, prune them all.",
      ]}
      size={[480, 324]}
      hold={[2400, 2600, 2600, 3600]}
    >
      {(step) => {
        const top = REACHED[step];
        const climber = top < 0 ? { x: xOf(0) - 20, y: yOf(0) + 32 } : { x: xOf(top), y: yOf(top) };
        return (
          <>
            <Path d={STAIRS} tone="faint" width={2} />
            {RUNGS.map((rung, i) => {
              const lit = i <= top;
              const now = lit && rung.group === step;
              const y = yOf(i);
              const x = xOf(i);
              const delay = stagger(i - RUNGS.findIndex((r) => r.group === rung.group), 260);
              return (
                <g key={rung.text}>
                  <Move x={x} y={y} delay={delay}>
                    <circle r={10} className={`a-t ${lit ? "t-ink a-fill" : "t-faint a-fill-surface a-stroke"}`} strokeWidth={2} style={{ transitionDelay: `${delay}ms` }} />
                  </Move>
                  <Label x={x + 22} y={y} tone={lit ? "ink" : "muted"} size={15} anchor="start" weight={now ? 700 : 400} delay={delay}>
                    {rung.text}
                  </Label>
                  <Chip
                    x={428}
                    y={y}
                    text={rung.status}
                    mono={false}
                    size={13}
                    width={72}
                    tone={rung.status === "learned" ? "success" : rung.status === "hard" ? "failure" : "mark"}
                    opacity={lit ? 1 : 0}
                    delay={delay + 250}
                  />
                </g>
              );
            })}
            <Move x={climber.x} y={climber.y}>
              <circle r={16} fill="none" className="t-accent a-stroke" strokeWidth={3} />
            </Move>
            <Label x={84} y={yOf(0) + 32} tone="muted" size={13} anchor="start" opacity={step === 0 ? 1 : 0}>
              start here
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
