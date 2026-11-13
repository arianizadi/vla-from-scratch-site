"use client";

import { AnimationFrame, Label, stagger } from "@/animations";

/** A toy run: a prompt of 3 tokens, then 5 generation passes (the first reads the prompt). */
const PROMPT = 3;
const PASSES = 5;
const COLS = PROMPT + PASSES - 1;

const CELL = 20;
const GAP = 4;
const ROW_Y = (pass: number) => 82 + pass * (CELL + GAP);
const LEFT = [40, 284];
const COL_X = (panel: number, col: number) => LEFT[panel] + col * (CELL + GAP);

/** Token positions run through the model: re-reading everything versus keeping notes. */
const WORK_REREAD = Array.from({ length: PASSES }, (_, pass) => PROMPT + pass).reduce((sum, value) => sum + value, 0);
const WORK_KEPT = PROMPT + PASSES - 1;

/** Passes shown on each side, per step. */
const LEFT_ROWS = [1, 5, 5, 5];
const RIGHT_ROWS = [1, 1, 5, 5];

type Cell = "work" | "kept" | "none";

function cellState(panel: number, pass: number, col: number, rows: number): Cell {
  const length = PROMPT + pass;
  if (pass >= rows || col >= length) return "none";
  if (panel === 0 || pass === 0) return "work";
  return col === length - 1 ? "work" : "kept";
}

export function KeepNotes() {
  return (
    <AnimationFrame
      title="Keep notes, don't re-read"
      description="Each row is one pass of the model, each square one token it works on. Without a cache every pass works through the whole text again, 25 squares in this toy run. With a cache the model keeps the notes of earlier tokens and works out only the newest token each pass, 7 squares."
      steps={[
        "The first pass reads the prompt: 3 tokens, 3 squares of work.",
        "Without memory, every pass works through the whole text again.",
        "With a cache, old notes are kept (outlines); each pass works out only the newest token.",
        "Same text, far less work: here 25 against 7, and the gap grows with length.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Label x={COL_X(0, 3)} y={40} tone="ink" size={14} weight={700}>
            re-read every time
          </Label>
          <Label x={COL_X(1, 3)} y={40} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0.35}>
            keep old notes
          </Label>

          {[0, 1].map((panel) =>
            Array.from({ length: PASSES }, (_, pass) =>
              Array.from({ length: COLS }, (_, col) => {
                const rows = panel === 0 ? LEFT_ROWS[step] : RIGHT_ROWS[step];
                const state = cellState(panel, pass, col, rows);
                return (
                  <rect
                    key={`${panel}-${pass}-${col}`}
                    x={COL_X(panel, col) - CELL / 2}
                    y={ROW_Y(pass) - CELL / 2}
                    width={CELL}
                    height={CELL}
                    rx={4}
                    className={`a-t ${state === "work" ? "t-accent a-fill" : "t-faint a-stroke a-fill-surface"}`}
                    strokeWidth={1.5}
                    style={{
                      opacity: state === "none" ? 0 : 1,
                      transitionDelay: `${stagger(pass, 90)}ms`,
                    }}
                  />
                );
              }),
            ),
          )}

          {[0, 1].map((panel) => {
            const done = panel === 0 ? step >= 1 : step >= 2;
            return (
              <g key={`work-${panel}`}>
                <Label x={COL_X(panel, 3)} y={226} tone="muted" size={14} opacity={done ? 1 : 0}>
                  squares of work
                </Label>
                <Label
                  x={COL_X(panel, 3)}
                  y={256}
                  tone={step === 3 && panel === 1 ? "accent" : "ink"}
                  size={26}
                  weight={700}
                  opacity={done ? 1 : 0}
                >
                  {String(panel === 0 ? WORK_REREAD : WORK_KEPT)}
                </Label>
              </g>
            );
          })}
        </>
      )}
    </AnimationFrame>
  );
}
