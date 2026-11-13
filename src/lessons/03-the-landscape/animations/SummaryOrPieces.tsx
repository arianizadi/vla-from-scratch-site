"use client";

import { AnimationFrame, Arrow, Gripper, Label, Path, stagger } from "@/animations";

const GRID = { x: 70, y: 150, cell: 30 };
const SHADE = [0.1, 0.15, 0.1, 0.2, 0.3, 0.9, 0.1, 0.25, 0.15];
const CUBE = 5;
const UPPER_Y = 66;
const LOWER_Y = 228;
const SUMMARY: [number, number] = [214, UPPER_Y];
const ROW = { x: 214, cell: 15, gap: 3 };
const RESULT_X = 404;

function gridAt(index: number): [number, number] {
  return [GRID.x + ((index % 3) - 1) * GRID.cell, GRID.y + (Math.floor(index / 3) - 1) * GRID.cell];
}

function rowAt(index: number): [number, number] {
  const span = SHADE.length * ROW.cell + (SHADE.length - 1) * ROW.gap;
  return [ROW.x - span / 2 + index * (ROW.cell + ROW.gap) + ROW.cell / 2, LOWER_Y];
}

function Patch({ at, size, cube, shade, opacity, delay, ring }: { at: [number, number]; size: number; cube: boolean; shade: number; opacity: number; delay: number; ring?: boolean }) {
  return (
    <g className={`a-t ${cube ? "t-action" : "t-vision"}`} style={{ transform: `translate(${at[0]}px, ${at[1]}px)`, opacity, transitionDelay: `${delay}ms` }}>
      <rect className="a-t a-fill" x={-size / 2} y={-size / 2} width={size} height={size} rx={3} style={{ fillOpacity: 0.18 + 0.8 * shade }} />
      {ring ? <rect className="a-t chip-ring" x={-size / 2 - 4} y={-size / 2 - 4} width={size + 8} height={size + 8} rx={6} /> : null}
    </g>
  );
}

/** A small table with the cube and a gripper that closes on target or beside it. */
function Result({ y, offset, shown, ok }: { y: number; offset: number; shown: boolean; ok: boolean }) {
  return (
    <g className="a-t" style={{ opacity: shown ? 1 : 0 }}>
      <Path d={`M${RESULT_X - 54} ${y + 16}H${RESULT_X + 54}`} tone="faint" width={2} />
      <g className="a-t t-action" style={{ transform: `translate(${RESULT_X}px, ${y + 16}px)` }}>
        <rect className="a-fill-soft a-stroke" x={-12} y={-24} width={24} height={24} rx={3} strokeWidth={1.5} />
      </g>
      <Gripper x={RESULT_X + (shown ? offset : 0)} y={y + 14 - 32 - (shown ? 0 : 20)} open={shown ? 0.72 : 1} size={0.76} tone="ink" />
      <Label x={RESULT_X} y={y - 34} tone={ok ? "success" : "failure"} size={14} weight={700}>
        {ok ? "on target" : "a few cm off"}
      </Label>
    </g>
  );
}

export function SummaryOrPieces() {
  return (
    <AnimationFrame
      title="One summary, or every patch"
      description="A camera picture is cut into nine patches, one of which shows the cube. Squeezed into one summary, the picture still says a cube is there but blurs where, and the grasp lands a few centimetres off. Handed every patch, the action head can find the cube's patch and the grasp lands on target."
      steps={[
        "A picture as patches. One patch shows the cube.",
        "Option 1: squeeze every patch into one summary.",
        "The summary knows a cube is there, but not quite where. The grasp lands off.",
        "Option 2: hand the action head every patch.",
        "It can find the cube's patch, and the grasp lands on target.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          {SHADE.map((shade, index) => (
            <Patch key={`grid-${index}`} at={gridAt(index)} size={GRID.cell - 3} cube={index === CUBE} shade={shade} opacity={1} delay={0} />
          ))}
          <Label x={GRID.x} y={GRID.y + 64} tone="vision" size={14} weight={700}>
            picture
          </Label>

          {SHADE.map((shade, index) => (
            <Patch
              key={`up-${index}`}
              at={step >= 1 ? SUMMARY : gridAt(index)}
              size={step >= 1 ? 12 : GRID.cell - 3}
              cube={index === CUBE}
              shade={shade}
              opacity={step === 1 ? 0.6 : 0}
              delay={stagger(index, 40)}
            />
          ))}
          <g className="a-t t-vision" style={{ transform: `translate(${SUMMARY[0]}px, ${SUMMARY[1]}px)`, opacity: step >= 1 ? 1 : 0, transitionDelay: step >= 1 ? "500ms" : undefined }}>
            <rect className="a-fill" x={-15} y={-15} width={30} height={30} rx={4} style={{ fillOpacity: 0.45 }} />
          </g>
          <Label x={SUMMARY[0]} y={SUMMARY[1] + 32} tone="muted" size={14} opacity={step >= 1 ? 1 : 0}>
            one summary
          </Label>
          <Arrow from={[GRID.x + 52, GRID.y - 40]} to={[SUMMARY[0] - 26, SUMMARY[1] + 4]} tone="faint" width={1.5} drawn={step >= 1} />
          <Arrow from={[SUMMARY[0] + 24, SUMMARY[1]]} to={[RESULT_X - 64, SUMMARY[1]]} tone="faint" width={1.5} drawn={step >= 2} />
          <Result y={UPPER_Y + 4} offset={-30} shown={step >= 2} ok={false} />

          {SHADE.map((shade, index) => (
            <Patch
              key={`low-${index}`}
              at={step >= 3 ? rowAt(index) : gridAt(index)}
              size={step >= 3 ? ROW.cell : GRID.cell - 3}
              cube={index === CUBE}
              shade={shade}
              opacity={step >= 3 ? 1 : 0}
              delay={stagger(index, 40)}
              ring={index === CUBE && step >= 4}
            />
          ))}
          <Label x={ROW.x} y={LOWER_Y + 26} tone="muted" size={14} opacity={step >= 3 ? 1 : 0}>
            every patch
          </Label>
          <Arrow from={[GRID.x + 52, GRID.y + 40]} to={[ROW.x - 92, LOWER_Y - 6]} tone="faint" width={1.5} drawn={step >= 3} />
          <Arrow from={[ROW.x + 90, LOWER_Y]} to={[RESULT_X - 64, LOWER_Y]} tone="faint" width={1.5} drawn={step >= 4} />
          <Result y={LOWER_Y - 14} offset={0} shown={step >= 4} ok />
        </>
      )}
    </AnimationFrame>
  );
}
