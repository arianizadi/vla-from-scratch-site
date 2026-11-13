"use client";

import { AnimationFrame, Dot, Label, Path, scale } from "@/animations";

/** Training progress in examples seen: the pretrained backbone starts to look after 0.25M, the one from scratch after about 1.0M, of 3M. */
const X0 = 40;
const X1 = 440;
const xAt = scale([0, 3], [X0, X1]);
const LANES = [
  { name: "pretrained on captions", onset: 0.25, y: 98, from: 1 },
  { name: "from scratch", onset: 1.0, y: 182, from: 2 },
];

export function HeadStart() {
  return (
    <AnimationFrame
      title="A head start, not a shortcut"
      description="The same robot model was trained twice on the same demonstrations. The copy whose backbone was pretrained on captions started using the camera early in training. The copy trained from scratch got there about four times later. By the end of training both worked."
      steps={[
        "The same robot model, trained twice on the same demonstrations.",
        "Pretrained on captions: it starts using the camera early.",
        "From scratch: it gets there about four times later.",
        "By the end, both work. The main gain is the earlier start.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          {LANES.map((lane) => {
            const shown = step >= lane.from;
            const at = xAt(lane.onset);
            return (
              <g key={lane.name}>
                <Label x={X0} y={lane.y - 30} tone="ink" size={15} weight={700} anchor="start">
                  {lane.name}
                </Label>
                <Path d={`M${X0} ${lane.y}H${X1}`} tone="faint" width={2} dashed drawn />
                <Path d={`M${at} ${lane.y}H${X1}`} tone="accent" width={5} drawn={shown} delay={300} />
                <Dot x={at} y={lane.y} r={8} tone="accent" opacity={shown ? 1 : 0} />
                <Label x={at - 6} y={lane.y + 26} tone="accent" size={14} weight={700} anchor="start" opacity={shown ? 1 : 0}>
                  {lane.from === 1 ? "starts looking" : "starts looking, about 4 × later"}
                </Label>
                <Label x={X1} y={lane.y - 30} tone="success" size={15} weight={700} anchor="end" opacity={step === 3 ? 1 : 0}>
                  works ✓
                </Label>
              </g>
            );
          })}
          <Path d={`M${X0} 236H${X1}`} tone="faint" width={1.5} />
          <Label x={X0} y={252} tone="faint" size={13} anchor="start">
            start of training
          </Label>
          <Label x={X1} y={252} tone="faint" size={13} anchor="end">
            end
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
