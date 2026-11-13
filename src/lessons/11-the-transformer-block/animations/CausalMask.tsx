"use client";

import { AnimationFrame, Label, stagger } from "@/animations";

const TOKENS = ["pick", "up", "the", "red", "cube"];
/**
 * Scores of each reading token (row) against each token it reads from
 * (column). Toy numbers, except the last row: cube's scores from the
 * chapter's worked example.
 */
const SCORES = [
  [1.0, 0.6, 0.2, 0.9, 0.4],
  [0.8, 1.2, 0.3, 0.5, 0.7],
  [0.9, 0.7, 0.6, 1.4, 0.8],
  [0.3, 0.2, 0.4, 1.0, 1.2],
  [0.5, 0.1, 0.2, 2.0, 1.0],
];

function softmax(values: number[]): number[] {
  const top = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - top));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => Math.round((value / total) * 1000) / 1000);
}

const OPEN = SCORES.map((row) => softmax(row));
const MASKED = SCORES.map((row, query) => {
  const kept = softmax(row.slice(0, query + 1));
  return row.map((_, key) => (key <= query ? kept[key] : 0));
});

const CELL = 34;
const GAP = 4;
const LEFT = 130;
const TOP = 64;
const colX = (key: number) => LEFT + CELL / 2 + key * (CELL + GAP);
const rowY = (query: number) => TOP + CELL / 2 + query * (CELL + GAP);
const shade = (weight: number) => Math.round((0.1 + 0.9 * Math.min(1, weight / 0.6)) * 100) / 100;

const THE = 2;
const RED = 3;

export function CausalMask() {
  return (
    <AnimationFrame
      title="Covering the answers"
      description="A grid of attention shares for pick up the red cube: rows are the words listening, columns the words they listen to. In training every place guesses the next word, so the must guess red and must not see it. The causal mask covers every later word, so its share becomes exactly 0, and each row spreads its attention over itself and earlier words only: the hears pick, up and the."
      steps={[
        "Each row is a word listening; each column a word it listens to. Darker is a bigger share (made-up).",
        "Training asks every place for the next word. the must guess red, so it must not see red.",
        "The mask covers every later word: its share drops to exactly 0.",
        "Each row now listens only to itself and earlier words. the hears pick, up and the.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const masked = step >= 2;
        return (
          <>
            <Label x={colX(2)} y={18} tone="muted" size={13}>
              listens to
            </Label>
            {TOKENS.map((token, index) => (
              <Label key={`col-${token}`} x={colX(index)} y={44} tone={step === 1 && index === RED ? "ink" : "muted"} size={13} mono weight={step === 1 && index === RED ? 700 : 400}>
                {token}
              </Label>
            ))}
            {TOKENS.map((token, index) => (
              <Label
                key={`row-${token}`}
                x={LEFT - 12}
                y={rowY(index)}
                tone={step >= 1 && index === THE ? "ink" : "muted"}
                size={13}
                anchor="end"
                mono
                weight={step >= 1 && index === THE ? 700 : 400}
              >
                {token}
              </Label>
            ))}

            {TOKENS.map((_, query) =>
              TOKENS.map((__, key) => {
                const later = key > query;
                const weight = masked ? MASKED[query][key] : OPEN[query][key];
                const dim = step === 3 && query !== THE;
                return (
                  <g key={`${query}-${key}`}>
                    <rect
                      x={colX(key) - CELL / 2}
                      y={rowY(query) - CELL / 2}
                      width={CELL}
                      height={CELL}
                      rx={4}
                      className={`a-t ${masked && later ? "t-faint" : "t-language"} a-fill`}
                      style={{
                        fillOpacity: masked && later ? 0.12 : shade(weight),
                        opacity: dim ? 0.3 : 1,
                        transitionDelay: masked && later ? `${stagger(query + key, 40)}ms` : undefined,
                      }}
                    />
                    {later ? (
                      <Label x={colX(key)} y={rowY(query)} tone="faint" size={13} mono opacity={masked ? (dim ? 0.3 : 1) : 0} delay={stagger(query + key, 40)}>
                        0
                      </Label>
                    ) : null}
                  </g>
                );
              }),
            )}

            <rect
              x={colX(RED) - CELL / 2 - 4}
              y={rowY(THE) - CELL / 2 - 4}
              width={CELL + 8}
              height={CELL + 8}
              rx={7}
              className="a-t chip-ring"
              style={{ opacity: step === 1 ? 1 : 0 }}
            />
            <rect
              x={colX(0) - CELL / 2 - 4}
              y={rowY(THE) - CELL / 2 - 4}
              width={3 * CELL + 2 * GAP + 8}
              height={CELL + 8}
              rx={7}
              className="a-t chip-ring"
              style={{ opacity: step === 3 ? 1 : 0 }}
            />

            <Label x={LEFT + 5 * (CELL + GAP) + 10} y={rowY(THE) - 10} tone="ink" size={14} anchor="start" opacity={step === 1 ? 1 : 0}>
              must guess
            </Label>
            <Label x={LEFT + 5 * (CELL + GAP) + 10} y={rowY(THE) + 10} tone="ink" size={14} anchor="start" weight={700} mono opacity={step === 1 ? 1 : 0}>
              red
            </Label>
            <Label x={LEFT + 5 * (CELL + GAP) + 10} y={rowY(1)} tone="faint" size={14} anchor="start" opacity={step === 2 ? 1 : 0}>
              later words: 0
            </Label>
            <Label x={LEFT + 5 * (CELL + GAP) + 10} y={rowY(THE)} tone="ink" size={14} anchor="start" opacity={step === 3 ? 1 : 0}>
              adds up to 1
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
