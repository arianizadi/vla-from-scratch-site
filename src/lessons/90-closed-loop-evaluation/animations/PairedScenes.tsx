"use client";

import { AnimationFrame, Label, stagger } from "@/animations";

/** A toy: two policies on the same 20 scenes, 1 = success. */
const A = [1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1];
const B = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1];
const DISAGREE = A.map((a, i) => a !== B[i]);
const B_WINS = A.filter((a, i) => a === 0 && B[i] === 1).length;
const A_WINS = A.filter((a, i) => a === 1 && B[i] === 0).length;
const SPLITS = B_WINS + A_WINS;

/** Two-sided sign test: how often a fair coin splits SPLITS disagreements at least this unevenly. */
function choose(n: number, k: number): number {
  let out = 1;
  for (let i = 0; i < k; i += 1) out = (out * (n - i)) / (i + 1);
  return out;
}
const TAIL = Math.min(1, (2 * Array.from({ length: Math.min(A_WINS, B_WINS) + 1 }, (_, k) => choose(SPLITS, k)).reduce((s, v) => s + v, 0)) / 2 ** SPLITS);
const IN_100 = Math.round(TAIL * 100);

const CELL = 17;
const GAP = 3;
const X0 = 58;
const cx = (i: number) => X0 + i * (CELL + GAP);
const ROW_Y = [92, 132];

export function PairedScenes() {
  return (
    <AnimationFrame
      title="Same scenes, compared in pairs"
      description={`A toy: policies A and B each try the same 20 scenes. Where both succeed or both fail, the scene says nothing about which is better. They disagree on ${SPLITS} scenes, and B wins ${B_WINS} of them. A fair coin splits ${SPLITS} tosses that unevenly only about ${IN_100} times in 100, so B is probably better.`}
      steps={[
        "A toy: policies A and B try the same 20 scenes. Filled is success.",
        "Where both succeed or both fail, the scene says nothing about which is better.",
        `Only the ${SPLITS} scenes where they disagree count.`,
        `B wins ${B_WINS} of the ${SPLITS}. A fair coin splits that unevenly only about ${IN_100} times in 100.`,
      ]}
      size={[480, 240]}
    >
      {(step) => (
        <>
          {["A", "B"].map((name, row) => (
            <Label key={name} x={34} y={ROW_Y[row]} tone="ink" size={16} weight={700}>
              {name}
            </Label>
          ))}
          {A.map((_, i) => {
            const fade = step >= 1 && !DISAGREE[i] ? 0.25 : 1;
            const lit = step >= 2 && DISAGREE[i];
            return (
              <g key={i}>
                <rect
                  className="a-t t-mark a-fill-soft"
                  x={cx(i) - 3}
                  y={ROW_Y[0] - CELL / 2 - 5}
                  width={CELL + 6}
                  height={ROW_Y[1] - ROW_Y[0] + CELL + 10}
                  rx={5}
                  style={{ opacity: lit ? 1 : 0, transitionDelay: `${stagger(i, 30)}ms` }}
                />
                {[A[i], B[i]].map((ok, row) => (
                  <rect
                    key={row}
                    className={`a-t ${ok ? "t-success a-fill" : "t-failure a-fill-soft a-stroke"}`}
                    x={cx(i)}
                    y={ROW_Y[row] - CELL / 2}
                    width={CELL}
                    height={CELL}
                    rx={3}
                    style={{ opacity: fade }}
                  />
                ))}
              </g>
            );
          })}
          <Label x={240} y={36} tone="muted" size={14}>
            the same 20 scenes →
          </Label>

          <Label x={150} y={188} tone="success" size={22} weight={700} opacity={step >= 3 ? 1 : 0}>
            {`B: ${B_WINS}`}
          </Label>
          <Label x={150} y={212} tone="muted" size={13} opacity={step >= 3 ? 1 : 0}>
            only B succeeded
          </Label>
          <Label x={330} y={188} tone="ink" size={22} weight={700} opacity={step >= 3 ? 1 : 0}>
            {`A: ${A_WINS}`}
          </Label>
          <Label x={330} y={212} tone="muted" size={13} opacity={step >= 3 ? 1 : 0}>
            only A succeeded
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
