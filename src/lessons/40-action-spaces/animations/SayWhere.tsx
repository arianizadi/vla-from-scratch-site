"use client";

import { AnimationFrame, Bracket, Dot, Label, Path } from "@/animations";
import { COUNT, ERRORS, SUMMED } from "./drift";

const X0 = 40;
const X1 = 440;
const xAt = (index: number) => Math.round((X0 + ((index + 1) / COUNT) * (X1 - X0)) * 10) / 10;
/** Units per error spread. */
const K = 5;
const ROW_A = 92;
const ROW_B = 178;
const yA = (index: number) => Math.round((ROW_A + ERRORS[index] * K) * 10) / 10;
const yB = (index: number) => Math.round((ROW_B + SUMMED[index] * K) * 10) / 10;
const END_B = yB(COUNT - 1);

export function SayWhere() {
  return (
    <AnimationFrame
      title="Say where, not how far"
      description="Two arms follow the same dashed line with the same 40 small random errors, one per command. When every command names the spot itself, each error stands alone and the dots stay close to the line. When every command is a change added to the last, the errors add up and the dots drift far from the line by the end. The errors are toy values."
      steps={[
        "The plan: follow the dashed line. Every command is off by a small random amount.",
        "Say where: each command names a spot. Its error stands alone, so the path stays close.",
        "Say how far: each command adds to the last one, so the errors add up too.",
        "Same small errors, bigger miss. That is why our actions name absolute targets.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          <Label x={X0} y={36} tone="ink" size={14} anchor="start" weight={700}>
            say where
          </Label>
          <Path d={`M${X0} ${ROW_A}H${X1}`} tone="faint" dashed width={2} drawn />
          {ERRORS.map((_, index) => (
            <Dot key={`a-${index}`} x={xAt(index)} y={yA(index)} r={3.5} tone="action" opacity={step >= 1 ? 1 : 0} delay={index * 25} />
          ))}

          <Label x={X0} y={130} tone="ink" size={14} anchor="start" weight={700}>
            say how far
          </Label>
          <Path d={`M${X0} ${ROW_B}H${X1}`} tone="faint" dashed width={2} drawn />
          {SUMMED.map((_, index) => (
            <Dot key={`b-${index}`} x={xAt(index)} y={yB(index)} r={3.5} tone="accent" opacity={step >= 2 ? 1 : 0} delay={index * 25} />
          ))}

          <Path d={`M${X1 + 14} ${ROW_B}V${END_B}`} tone="failure" width={2} drawn={step >= 3} />
          <Label x={X1 + 2} y={END_B + 18} tone="failure" size={14} anchor="end" weight={700} opacity={step >= 3 ? 1 : 0}>
            drifted off
          </Label>
          <Bracket x1={X0} x2={X1} y={252} label="40 commands, 2 seconds" tone="faint" opacity={step === 0 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
