"use client";

import { AnimationFrame, Dot, Label, Move } from "@/animations";

/** One demonstration of 66 frames (0 to 65), drawn one cell per frame. */
const FRAMES = 66;
const CHUNK = 15;
const X0 = 20;
const PITCH = 6;
const cellX = (frame: number) => X0 + frame * PITCH;
const STRIP_Y = 120;

/** Where the window is anchored in each step (none in the first). */
const ANCHORS = [0, 10, 30, 58, 58];

export function TrainingWindow() {
  return (
    <AnimationFrame
      title="A training window"
      description="A recorded demonstration, a few seconds long, is cut like a film into overlapping clips. Each clip holds what the robot saw at one frame and the 15 actions the expert took from there. The clip slides one frame at a time, so every frame becomes a training example. Near the end the future runs out: the gap is filled with copies and not graded. 1500 demonstrations became about 100,000 examples."
      steps={[
        "One recorded demonstration: a few seconds, one frame per tick.",
        "One example: what the robot saw at one frame, and the 15 actions that followed.",
        "Slide one frame along: every frame makes its own example.",
        "Near the end the future runs out. Copies fill the gap, and they are not graded.",
        "So 1500 demonstrations became about 100,000 examples.",
      ]}
      size={[480, 250]}
    >
      {(step) => {
        const anchor = ANCHORS[step];
        const open = step >= 1;
        const left = cellX(anchor) - 4;
        const right = cellX(anchor + CHUNK - 1) + PITCH - 1 + 4;
        const atEnd = anchor + CHUNK > FRAMES;
        return (
          <>
            {Array.from({ length: FRAMES + 7 }, (_, frame) => {
              const real = frame < FRAMES;
              const inWindow = open && frame >= anchor && frame < anchor + CHUNK;
              if (!real) {
                return (
                  <rect
                    key={frame}
                    x={cellX(frame)}
                    y={STRIP_Y - 11}
                    width={PITCH - 1}
                    height={22}
                    rx={1.5}
                    className="a-t t-faint cell-outline"
                    style={{ opacity: inWindow ? 1 : 0, transitionDelay: `${(frame - FRAMES) * 40 + 300}ms` }}
                  />
                );
              }
              return (
                <rect
                  key={frame}
                  x={cellX(frame)}
                  y={STRIP_Y - 11}
                  width={PITCH - 1}
                  height={22}
                  rx={1.5}
                  className={`a-t ${inWindow ? "t-action a-fill" : "t-faint a-fill-soft"}`}
                />
              );
            })}

            <Move x={left} y={0} opacity={open ? 1 : 0}>
              <rect
                x={0}
                y={STRIP_Y - 17}
                width={right - left}
                height={34}
                rx={6}
                className="a-t t-accent a-stroke"
                fill="none"
                strokeWidth={2}
              />
            </Move>

            <Move x={cellX(anchor) + (PITCH - 1) / 2} y={0} opacity={open ? 1 : 0}>
              <Dot x={0} y={STRIP_Y - 36} r={6} tone="vision" />
              <Label x={0} y={STRIP_Y - 58} tone="vision" size={14} weight={700}>
                what it saw
              </Label>
            </Move>

            <Label
              x={atEnd ? right : left}
              y={STRIP_Y + 32}
              tone="action"
              size={14}
              anchor={atEnd ? "end" : "start"}
              weight={700}
              opacity={open ? 1 : 0}
            >
              15 actions to predict
            </Label>
            <Label x={right} y={STRIP_Y + 54} tone="muted" size={13} anchor="end" opacity={atEnd && open ? 1 : 0}>
              copies, not graded
            </Label>

            <Label x={X0} y={STRIP_Y + 82} tone="faint" size={13} anchor="start">
              start
            </Label>
            <Label x={cellX(FRAMES - 1) + PITCH} y={STRIP_Y + 82} tone="faint" size={13} anchor="end">
              end
            </Label>

            <Label x={240} y={228} tone="ink" size={16} weight={700} opacity={step >= 4 ? 1 : 0}>
              1500 demonstrations → about 100,000 examples
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
