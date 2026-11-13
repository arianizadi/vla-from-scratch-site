"use client";

import { Arrow, AnimationFrame, Cells, Chip, Label, Move, stagger } from "@/animations";

/** Three positions of "pick up the", with the ids of the tokenizer used here. */
const IDS = ["18188", "614", "260"];
const ROW_Y = [92, 148, 204];

/** Made-up numbers for the drawing: a token's vector before and after the blocks. */
const BEFORE = [
  [0.8, 0.2, 0.5, 0.3],
  [0.3, 0.7, 0.2, 0.6],
  [0.5, 0.4, 0.9, 0.1],
];
const AFTER = [
  [0.5, 0.6, 0.3, 0.8],
  [0.7, 0.3, 0.6, 0.4],
  [0.2, 0.8, 0.5, 0.6],
];
/** A sketch of each position's scores: a handful of the 49,280, one clearly highest. */
const SCORES = [
  [0.3, 0.5, 1, 0.2, 0.4],
  [0.4, 0.2, 0.3, 1, 0.5],
  [1, 0.4, 0.2, 0.5, 0.3],
];

const ID_X = 50;
const VEC_X = 150;
const BOX_X = 260;
const BOX_W = 80;
const OUT_X = 358;
const LOGIT_X = 440;
const BAR_W = 6;
const BAR_GAP = 3;
const BAR_H = 34;

export function IdsToLogits() {
  return (
    <AnimationFrame
      title="From numbers to a guess"
      description="Three token ids go into the language model. Each opens its row of the table, a list of numbers. The lists pass through a stack of blocks, built alike but tuned differently. At the end each place gives a score to every possible next token, and the highest score is the best guess."
      steps={[
        "Three token ids go in, one per place in the sentence.",
        "Each id opens its row of the table: a list of numbers.",
        "The lists pass through a stack of blocks, one after another.",
        "Each place scores every possible next token. The tallest bar is the best guess.",
      ]}
      size={[480, 260]}
    >
      {(step) => (
        <>
          <Label x={ID_X} y={40} tone="muted" size={14}>
            ids
          </Label>
          <Label x={VEC_X} y={40} tone="muted" size={14} opacity={step >= 1 ? 1 : 0}>
            numbers
          </Label>
          <Label x={BOX_X} y={40} tone="ink" size={14} weight={700}>
            blocks
          </Label>
          <Label x={LOGIT_X} y={40} tone="muted" size={14} opacity={step >= 3 ? 1 : 0}>
            scores
          </Label>

          <rect x={BOX_X - BOX_W / 2} y={60} width={BOX_W} height={176} rx={10} className={`a-t ${step === 2 ? "t-accent" : "t-faint"} a-stroke a-fill-surface`} strokeWidth={1.5} />
          {Array.from({ length: 12 }, (_, index) => (
            <rect
              key={index}
              x={BOX_X - 30 + index * 5.2}
              y={70}
              width={2.6}
              height={156}
              rx={1.3}
              className={`a-t ${step === 2 ? "t-accent" : "t-faint"} a-fill`}
              style={{ fillOpacity: 0.55, transitionDelay: step === 2 ? `${index * 30}ms` : undefined }}
            />
          ))}

          {IDS.map((id, row) => {
            const y = ROW_Y[row];
            return (
              <g key={id}>
                <Chip x={ID_X} y={y} text={id} tone="ink" variant="outline" size={14} />
                <Arrow from={[ID_X + 34, y]} to={[VEC_X - 36, y]} tone="faint" width={1.5} drawn={step >= 1} delay={stagger(row, 60)} />
                <Move x={step >= 1 ? VEC_X : ID_X} y={y} opacity={step >= 1 ? 1 : 0} delay={stagger(row, 60)}>
                  <Cells x={0} y={0} values={BEFORE[row]} tone="language" cell={13} gap={3} />
                </Move>
                <Arrow from={[VEC_X + 36, y]} to={[BOX_X - BOX_W / 2 - 6, y]} tone="faint" width={1.5} drawn={step >= 2} delay={stagger(row, 60)} />
                <Arrow from={[BOX_X + BOX_W / 2 + 6, y]} to={[OUT_X - 36, y]} tone="faint" width={1.5} drawn={step >= 2} delay={300 + stagger(row, 60)} />
                <Move x={step >= 2 ? OUT_X : BOX_X} y={y} opacity={step >= 2 ? 1 : 0} delay={200 + stagger(row, 60)}>
                  <Cells x={0} y={0} values={AFTER[row]} tone="language" cell={13} gap={3} />
                </Move>
                <Arrow from={[OUT_X + 36, y]} to={[LOGIT_X - 30, y]} tone="faint" width={1.5} drawn={step >= 3} delay={stagger(row, 60)} />
                {SCORES[row].map((value, index) => {
                  const top = value === 1;
                  const h = BAR_H * value;
                  return (
                    <rect
                      key={index}
                      x={LOGIT_X - 20 + index * (BAR_W + BAR_GAP)}
                      y={y + BAR_H / 2 - h}
                      width={BAR_W}
                      height={h}
                      rx={1.5}
                      className={`a-t ${top ? "t-accent" : "t-faint"} a-fill`}
                      style={{ opacity: step >= 3 ? 1 : 0, transitionDelay: `${stagger(row, 80) + index * 30}ms` }}
                    />
                  );
                })}
              </g>
            );
          })}
        </>
      )}
    </AnimationFrame>
  );
}
