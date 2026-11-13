"use client";

import { AnimationFrame, Bracket, Dot, Label, Path } from "@/animations";
import { CHANNELS } from "./channels";

const ZERO = 300;
const RAW_UNIT = 95;
const NORM_UNIT = 42;
const ROW_Y = [70, 120, 170, 222];
const tidy = (value: number) => Math.round(value * 10) / 10;
/** A small fixed vertical offset per dot, so dots on the same value stay visible. */
const jitter = (index: number) => ((index * 5) % 7) - 3;

function xOf(step: number, value: number, mean: number, std: number): number {
  if (step === 0) return tidy(ZERO + value * RAW_UNIT);
  if (step === 1) return tidy(ZERO + (value - mean) * RAW_UNIT);
  return tidy(ZERO + ((value - mean) / Math.max(std, 1e-8)) * NORM_UNIT);
}

export function Normalise() {
  return (
    <AnimationFrame
      title="Normalising each number"
      description="Three numbers of the action across many moments, with toy values: a stiff joint that sits far from zero and barely moves, a busy joint that swings around zero, and the gripper, which is only open (1) or closed (0). Subtracting each one's average centres all three on zero; dividing by how much each one varies gives them about the same spread: one common scale for the policy. The policy's answers are stretched back before they reach the arm."
      steps={[
        "Three numbers of the action over many moments (toy values). One barely moves; the gripper is only 0 or 1.",
        "Subtract each one's average: all three are centred on zero.",
        "Divide each by how much it varies: now they spread about the same.",
        "Now all three share one scale. Answers are stretched back before they reach the arm.",
      ]}
      size={[480, 260]}
    >
      {(step) => (
        <>
          <Path d={`M${ZERO} 44V240`} tone="faint" width={1.5} dashed drawn />
          <Label x={ZERO} y={30} tone="faint" size={13} mono>
            0
          </Label>

          {CHANNELS.map((channel, row) => (
            <g key={channel.name}>
              <Label x={16} y={ROW_Y[row]} tone="ink" size={14} anchor="start" weight={700}>
                {channel.name}
              </Label>
              {channel.raw.map((value, index) => (
                <Dot
                  key={index}
                  x={xOf(Math.min(step, 2), value, channel.mean, channel.std)}
                  y={ROW_Y[row] + jitter(index)}
                  r={4.5}
                  tone="action"
                  opacity={0.85}
                  delay={row * 120 + index * 10}
                />
              ))}
            </g>
          ))}

          <Bracket x1={ZERO - 2 * NORM_UNIT} x2={ZERO + 2 * NORM_UNIT} y={ROW_Y[3] - 8} label="one common scale" tone="accent" below opacity={step >= 3 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
