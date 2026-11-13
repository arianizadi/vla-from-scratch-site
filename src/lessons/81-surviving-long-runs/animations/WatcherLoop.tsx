"use client";

import { AnimationFrame, Arrow, Box, Dot, Label } from "@/animations";

const W = 156;
const H = 46;
const TOP: [number, number] = [240, 42];
const RIGHT: [number, number] = [388, 132];
const BOTTOM: [number, number] = [240, 222];
const LEFT: [number, number] = [92, 132];
const DONE: [number, number] = [404, 240];

/** Where the token sits at each step. */
const TOKEN: [number, number][] = [TOP, RIGHT, BOTTOM, LEFT, TOP, DONE];

export function WatcherLoop() {
  return (
    <AnimationFrame
      title="A watcher that restarts"
      description="A supervisor starts the run from the newest save point, lets it train, and checks the heartbeat every half minute. If the heartbeat is still beating it keeps waiting. If it has been silent for minutes, it stops the run and starts again from the newest save. It stops watching only when training reports it has finished."
      steps={[
        "The watcher starts the run from the newest save point.",
        "The run trains. Every half minute the watcher checks the heartbeat.",
        "Still beating? Keep waiting and check again.",
        "Silent for minutes? Stop the run.",
        "Start again from the newest save. Only a few minutes are lost.",
        "It stops watching only when training says it has finished.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const [tx, ty] = TOKEN[step];
        const offset = step === 5 ? -H / 2 + 1 : -H / 2 - 2;
        return (
          <>
            <Box x={TOP[0]} y={TOP[1]} w={W + 30} h={H} label="start from newest save" tone="accent" active={step === 0 || step === 4} />
            <Box x={RIGHT[0]} y={RIGHT[1]} w={W - 40} h={H} label="train" active={step === 1} />
            <Box x={BOTTOM[0]} y={BOTTOM[1]} w={W + 20} h={H} label="check the heartbeat" active={step === 2} />
            <Box x={LEFT[0]} y={LEFT[1]} w={W - 30} h={H} label="stop the run" tone="failure" active={step === 3} />
            <Box x={DONE[0]} y={DONE[1]} w={W - 60} h={H - 6} label="finished ✓" tone="success" active={step === 5} opacity={step === 5 ? 1 : 0.35} />

            <Arrow from={[TOP[0] + 96, TOP[1] + 8]} to={[RIGHT[0] - 8, RIGHT[1] - H / 2 - 6]} bend={-18} tone="ink" />
            <Arrow from={[RIGHT[0] - 14, RIGHT[1] + H / 2 + 4]} to={[BOTTOM[0] + 92, BOTTOM[1] - 10]} bend={-18} tone="ink" />
            <Arrow from={[BOTTOM[0] - 92, BOTTOM[1] - 10]} to={[LEFT[0] + 8, LEFT[1] + H / 2 + 6]} bend={-18} tone="failure" flow={step === 3} />
            <Arrow from={[LEFT[0] + 8, LEFT[1] - H / 2 - 4]} to={[TOP[0] - 96, TOP[1] + 8]} bend={-18} tone="accent" flow={step === 4} />
            <Arrow from={[BOTTOM[0] + 30, BOTTOM[1] - H / 2 - 4]} to={[RIGHT[0] - 64, RIGHT[1] + 6]} bend={-14} tone="success" flow={step === 2} />
            <Arrow from={[BOTTOM[0] + 90, BOTTOM[1] + 12]} to={[DONE[0] - 52, DONE[1]]} tone="success" opacity={step === 5 ? 1 : 0.35} />

            <Label x={LEFT[0] - 4} y={BOTTOM[1] - 8} tone="failure" size={13} anchor="middle" opacity={step === 3 ? 1 : 0}>
              silent
            </Label>
            <Label x={RIGHT[0] - 150} y={RIGHT[1] + 36} tone="success" size={13} anchor="middle" opacity={step === 2 ? 1 : 0}>
              beating
            </Label>

            <Dot x={tx} y={ty + offset} r={7} tone="mark" />
          </>
        );
      }}
    </AnimationFrame>
  );
}
