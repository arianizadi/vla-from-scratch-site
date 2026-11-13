"use client";

import { AnimationFrame, Dot, Label, Timeline } from "@/animations";

/** 24 control steps of 50 ms: 1.2 s. */
const STEPS = 24;
const X0 = 40;
const PITCH = 17.5;
const centre = (index: number) => X0 + index * PITCH + PITCH / 2;
const CHUNK = 15;
const EXECUTE = 8;

const ROW_A = { label: 36, dot: 60, cell: 80 };
const ROW_B = { label: 122, dot: 146 };
/** The three chunks of the lower row: where each starts and the height it is drawn at. */
const CHUNKS = [
  { start: 0, y: 168 },
  { start: 8, y: 186 },
  { start: 16, y: 204 },
];

function Cell({ x, y, tone, executed, opacity, delay }: { x: number; y: number; tone: string; executed: boolean; opacity: number; delay: number }) {
  return (
    <rect
      x={x - 7}
      y={y - 6}
      width={14}
      height={12}
      rx={3}
      className={`a-t ${tone} ${executed ? "a-fill" : "a-fill-soft a-stroke"}`}
      strokeWidth={1}
      style={{ opacity, transitionDelay: `${delay}ms` }}
    />
  );
}

export function Decisions() {
  return (
    <AnimationFrame
      title="Predict 15, execute 8, look again"
      description="Over 24 control steps, a policy that predicts one action per look decides at every step. A chunked policy decides once and gets 15 actions ahead. It executes the first 8, throws the other 7 away, then looks at the cameras again and predicts a new chunk. It decides every 0.4 s instead of every 0.05 s."
      steps={[
        "A little over a second of robot time: 24 ticks.",
        "One action per look: the policy looks and decides at every tick.",
        "A chunk: one look, 15 actions planned ahead.",
        "The robot plays the first 8. The rest are thrown away.",
        "Then it looks again and plans a fresh chunk: a few looks a second instead of twenty.",
      ]}
      size={[480, 274]}
      hold={[1800, 2200, 2200, 2400, 3600]}
    >
      {(step) => (
        <>
          <Label x={16} y={ROW_A.label} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 1 ? 1 : 0.35}>
            one action per look
          </Label>
          {Array.from({ length: STEPS }, (_, index) => (
            <g key={`a-${index}`}>
              <Dot x={centre(index)} y={ROW_A.dot} r={4.5} tone="accent" opacity={step >= 1 ? 1 : 0} delay={index * 30} />
              <Cell x={centre(index)} y={ROW_A.cell} tone="t-action" executed opacity={step >= 1 ? 1 : 0} delay={index * 30 + 60} />
            </g>
          ))}

          <Label x={16} y={ROW_B.label} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 2 ? 1 : 0.35}>
            a chunk of 15, 8 played
          </Label>
          {CHUNKS.map((chunk, c) => {
            const shown = c === 0 ? step >= 2 : step >= 4;
            const settled = c === 0 ? step >= 3 : step >= 4;
            return (
              <g key={`chunk-${c}`}>
                <Dot x={centre(chunk.start)} y={ROW_B.dot} r={6} tone="accent" opacity={shown ? 1 : 0} delay={c === 2 ? 500 : 0} />
                {Array.from({ length: CHUNK }, (_, i) => {
                  const index = chunk.start + i;
                  if (index >= STEPS) return null;
                  const executed = settled && i < EXECUTE;
                  const dropped = settled && i >= EXECUTE && c < 2;
                  return (
                    <Cell
                      key={`b-${c}-${i}`}
                      x={centre(index)}
                      y={chunk.y}
                      tone={dropped ? "t-faint" : "t-action"}
                      executed={executed}
                      opacity={shown ? (dropped ? 0.45 : 1) : 0}
                      delay={(c === 2 ? 500 : 0) + i * 30}
                    />
                  );
                })}
              </g>
            );
          })}
          <Label x={centre(11)} y={ROW_B.dot} tone="faint" size={13} opacity={step === 3 ? 1 : 0}>
            7 thrown away
          </Label>

          <Label x={472} y={ROW_A.label} tone="accent" size={13} anchor="end" opacity={step >= 1 ? 1 : 0}>
            ● a look
          </Label>
          <Timeline x={X0} y={234} w={STEPS * PITCH} ticks={["0", "0.4 s", "0.8 s", "1.2 s"]} tone="faint" fill={false} />
        </>
      )}
    </AnimationFrame>
  );
}
