"use client";

import { AnimationFrame, Box, Label, Path } from "@/animations";

const BASE = 112;
const START = 24;
const STOP = 252;
const END = 456;
const BEAT = 38;

/** A pulse trace: one blip per new log line, every BEAT units, until STOP. */
function pulse(): string {
  let d = `M${START} ${BASE}`;
  for (let x = START; x + BEAT <= STOP; x += BEAT) {
    d += `H${x + 14}L${x + 19} ${BASE - 34}L${x + 25} ${BASE + 18}L${x + 29} ${BASE}`;
  }
  return `${d}H${STOP}`;
}
const ALIVE = pulse();

export function Heartbeat() {
  return (
    <AnimationFrame
      title="A crash is loud, a hang is silent"
      description="A pulse trace: every new progress line is a beat. Then something gets stuck and the program waits forever; the trace goes flat. The program has not crashed and shows no error, so from outside it still looks alive, while no work is being done."
      steps={[
        "While training moves, a progress line appears every second or so. Each line is a beat.",
        "Something gets stuck. The program waits, forever. The trace goes flat.",
        "No error and no crash: the program still exists, so it looks alive. Only the heartbeat tells.",
      ]}
      size={[480, 260]}
      hold={[2600, 2600, 3600]}
    >
      {(step) => (
        <>
          <Label x={START} y={40} tone="muted" size={14} anchor="start">
            new progress lines
          </Label>
          <Path d={ALIVE} tone="success" width={2.5} />
          <Path d={`M${STOP} ${BASE}H${END}`} tone="failure" width={2.5} drawn={step >= 1} />
          <Label x={(STOP + END) / 2} y={BASE - 22} tone="failure" size={14} weight={700} opacity={step >= 1 ? 1 : 0}>
            flat: waiting forever
          </Label>

          <Box x={130} y={206} w={196} h={58} label="the program" sub="still running" tone="muted" opacity={step >= 2 ? 1 : 0} />
          <Box x={350} y={206} w={196} h={58} label="the heartbeat" sub="silent for minutes" tone="failure" active opacity={step >= 2 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
