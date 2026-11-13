"use client";

import { AnimationFrame, Bracket, Dot, Label, Path } from "@/animations";

const X0 = 44;
const DX = 17;
const TICKS = 24;
const CELL = 13;
const TIMELINE_Y = 222;
const CHUNK_YS = [108, 160];
const PLANNED = 15;
const DONE = 8;

const tickX = (index: number) => X0 + index * DX;

function Chunk({ start, y, planned, done, dropped }: { start: number; y: number; planned: boolean; done: number; dropped: boolean }) {
  return (
    <g>
      {Array.from({ length: PLANNED }, (_, index) => {
        const executed = index < done;
        const gone = dropped && index >= DONE;
        return (
          <g
            key={index}
            className="a-t t-action"
            style={{
              transform: `translate(${tickX(start + index)}px, ${y}px)`,
              opacity: planned ? (gone ? 0.3 : 1) : 0,
              transitionDelay: `${index * 30}ms`,
            }}
          >
            <rect
              className={`a-t a-stroke ${executed ? "a-fill" : "a-fill-soft"}`}
              x={-CELL / 2}
              y={-CELL / 2}
              width={CELL}
              height={CELL}
              rx={3}
              strokeWidth={1.2}
            />
          </g>
        );
      })}
    </g>
  );
}

export function ChunkAndSteps() {
  return (
    <AnimationFrame
      title="Actions, chunks and control steps"
      description="Time runs in control steps, one action each. The model plans a chunk of 15 actions at once, the arm carries out the first 8, and then the model looks again and plans a fresh chunk from there; the unused 7 are dropped."
      steps={[
        "Time runs in ticks called control steps. Each tick, the arm gets one action.",
        "The model plans a chunk: 15 actions at once.",
        "The arm carries out the first 8…",
        "…then the model looks again and plans a fresh chunk. The unused 7 are dropped.",
        "And so on, about 20 ticks every second.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const now = step <= 1 ? 0 : step <= 3 ? DONE : DONE * 2;
        return (
          <>
            <Path d={`M${X0 - 10} ${TIMELINE_Y}H${tickX(TICKS - 1) + 10}`} tone="faint" width={2} />
            {Array.from({ length: TICKS }, (_, index) => (
              <path key={index} className="t-faint a-stroke" d={`M${tickX(index)} ${TIMELINE_Y - 5}v10`} strokeWidth={1.5} />
            ))}
            <Label x={X0 - 10} y={TIMELINE_Y + 24} tone="muted" size={13} anchor="start">
              control steps (ticks)
            </Label>
            <Dot x={tickX(now)} y={TIMELINE_Y} r={7} tone="accent" />
            <Label x={tickX(now)} y={TIMELINE_Y - 22} tone="accent" size={13} weight={700}>
              now
            </Label>

            <g className="a-t t-action" style={{ transform: `translate(${tickX(0)}px, ${TIMELINE_Y - 44}px)`, opacity: step === 0 ? 1 : 0 }}>
              <rect className="a-fill a-stroke" x={-CELL / 2} y={-CELL / 2} width={CELL} height={CELL} rx={3} strokeWidth={1.2} />
            </g>
            <Label x={tickX(0) + 14} y={TIMELINE_Y - 44} tone="action" size={14} weight={700} anchor="start" opacity={step === 0 ? 1 : 0}>
              one action
            </Label>

            <Chunk start={0} y={CHUNK_YS[0]} planned={step >= 1} done={step >= 2 ? DONE : 0} dropped={step >= 3} />
            <Bracket x1={tickX(0) - 7} x2={tickX(PLANNED - 1) + 7} y={CHUNK_YS[0] - 28} label="a chunk: 15 planned" tone="action" opacity={step === 1 ? 1 : 0} />
            <Bracket x1={tickX(0) - 7} x2={tickX(DONE - 1) + 7} y={CHUNK_YS[0] - 28} label="8 carried out" tone="action" opacity={step >= 2 ? 1 : 0} />

            <Chunk start={DONE} y={CHUNK_YS[1]} planned={step >= 3} done={step >= 4 ? DONE : 0} dropped={false} />
            <Label x={tickX(DONE + PLANNED - 1) + 4} y={CHUNK_YS[1] - 24} tone="action" size={14} weight={700} anchor="end" opacity={step >= 3 ? 1 : 0}>
              plan again
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
