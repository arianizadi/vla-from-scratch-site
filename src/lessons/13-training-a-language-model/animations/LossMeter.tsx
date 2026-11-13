"use client";

import { AnimationFrame, Dot, Label, Path, scale } from "@/animations";

/** The chapter's table: loss in nats and its perplexity, the size of an equally unsure fair pick. */
const MARKS = [
  { loss: 10.8, pick: "49,280", name: "knows nothing" },
  { loss: 6.3, pick: "545", name: "start" },
  { loss: 4.1, pick: "60", name: "end" },
];

const AXIS_Y = 186;
const toX = scale([0, 11], [40, 440]);
const TICKS = [0, 2, 4, 6, 8, 10];

export function LossMeter() {
  return (
    <AnimationFrame
      title="How surprised is the model?"
      description="The loss measures how surprised the model is by the true next token. A model that knows nothing is as unsure as a blind pick among all 49,280 tokens: loss 10.8. Our small language model started training at 6.3, like a blind pick among 545, and ended at 4.1, like a pick among about 60."
      steps={[
        "Knowing nothing is a blind pick among all 49,280 tokens: loss 10.8.",
        "Early in training, loss 6.3: as unsure as a blind pick among 545.",
        "At the end, loss 4.1: the right token gets about 1 chance in 60.",
      ]}
      size={[480, 250]}
    >
      {(step) => {
        const now = MARKS[step];
        return (
          <>
            <Label x={240} y={24} tone="muted" size={14}>
              as unsure as a blind pick among
            </Label>
            <Label key={`pick-${step}`} x={240} y={64} tone="ink" size={34} weight={700} enter>
              {`${now.pick} tokens`}
            </Label>

            <Path d={`M${toX(0)} ${AXIS_Y}H${toX(11)}`} tone="faint" width={1.5} />
            {TICKS.map((tick) => (
              <g key={tick}>
                <path d={`M${toX(tick)} ${AXIS_Y}v5`} className="t-faint a-stroke" strokeWidth={1.5} />
                <Label x={toX(tick)} y={AXIS_Y + 20} tone="faint" size={13} mono>
                  {String(tick)}
                </Label>
              </g>
            ))}
            <Label x={toX(11)} y={AXIS_Y + 42} tone="faint" size={13} anchor="end">
              loss: lower means less surprised
            </Label>

            {MARKS.map((mark, index) => {
              const seen = step >= index;
              const current = step === index;
              const anchor = index === 0 ? "end" : "middle";
              const x = index === 0 ? toX(mark.loss) + 8 : toX(mark.loss);
              return (
                <g key={mark.loss}>
                  <Dot x={toX(mark.loss)} y={AXIS_Y} r={current ? 8 : 5} tone={current ? "accent" : "faint"} opacity={seen ? 1 : 0} />
                  <Label x={x} y={AXIS_Y - 26} tone={current ? "ink" : "muted"} size={15} mono weight={current ? 700 : 400} anchor={anchor} opacity={seen ? 1 : 0}>
                    {String(mark.loss)}
                  </Label>
                  <Label x={x} y={AXIS_Y - 50} tone={current ? "ink" : "faint"} size={13} anchor={anchor} opacity={seen ? 1 : 0}>
                    {mark.name}
                  </Label>
                </g>
              );
            })}
          </>
        );
      }}
    </AnimationFrame>
  );
}
