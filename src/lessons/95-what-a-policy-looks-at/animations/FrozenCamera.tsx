"use client";

import { AnimationFrame, Arm, Label, Thing, reach } from "@/animations";

const TABLE = 252;
const BASE: [number, number] = [238, TABLE];
const LENGTHS: [number, number] = [126, 112];
const CAN = 404;
const CUBE = 320;

/** The camera picture, seen from above, top left of the stage. */
const SCREEN = { x: 16, y: 44, w: 168, h: 124 };
const GRIP_FIRST: [number, number] = [52, 76];
const GRIP_LIVE: [number, number] = [120, 120];

const HOME = reach(BASE, [330, 120], LENGTHS);
const ABOVE = reach(BASE, [CAN + 4, 190], LENGTHS);
const DOWN_OFF = reach(BASE, [CAN + 16, TABLE - 8], LENGTHS);

export function FrozenCamera() {
  return (
    <AnimationFrame
      title="A photo taped over the windscreen"
      description="The policy's camera picture is frozen on the first frame of the try. The arm still heads for the asked-for can, so it chose its target from that first look. But it closes slightly off and fails the grasp: the last centimetres need fresh pictures."
      steps={[
        "Normally the camera picture updates as the arm moves.",
        "Now freeze it on the very first frame, for the whole try.",
        "The arm still heads for the right can: it chose from that first look.",
        "But it closes a little off and the can slips. The last centimetres need fresh pictures.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const frozen = step >= 1;
        const grip = frozen ? GRIP_FIRST : GRIP_LIVE;
        const pose = step <= 1 ? HOME : step === 2 ? ABOVE : DOWN_OFF;
        return (
          <>
            {/* The camera picture. */}
            <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={12} className="t-vision a-fill-soft a-stroke" strokeWidth={2} />
            <rect x={44} y={128} width={20} height={20} rx={3} className="t-muted a-fill-soft a-stroke" strokeWidth={2} />
            <circle cx={140} cy={138} r={11} className="t-action a-fill-soft a-stroke" strokeWidth={2.5} />
            <g className="a-t t-ink" style={{ transform: `translate(${grip[0]}px, ${grip[1]}px)` }}>
              <rect className="a-fill" x={-12} y={-10} width={24} height={5} rx={2} />
              <rect className="a-fill" x={-12} y={-7} width={5} height={17} rx={2} />
              <rect className="a-fill" x={7} y={-7} width={5} height={17} rx={2} />
            </g>
            <Label x={SCREEN.x + SCREEN.w / 2} y={24} tone="vision" size={14} weight={700} opacity={frozen ? 0 : 1}>
              camera: live
            </Label>
            <Label x={SCREEN.x + SCREEN.w / 2} y={24} tone="failure" size={14} weight={700} opacity={frozen ? 1 : 0}>
              camera: first frame only
            </Label>
            {/* Frozen: a pause badge on the picture. */}
            <g className="a-t t-failure" style={{ opacity: frozen ? 1 : 0 }}>
              <circle cx={SCREEN.x + SCREEN.w - 22} cy={SCREEN.y + 22} r={14} className="a-fill" />
              <rect x={SCREEN.x + SCREEN.w - 28} y={SCREEN.y + 15} width={4} height={14} rx={1} className="a-fill-surface" />
              <rect x={SCREEN.x + SCREEN.w - 20} y={SCREEN.y + 15} width={4} height={14} rx={1} className="a-fill-surface" />
            </g>

            {/* The robot, from the side. */}
            <line x1={190} y1={TABLE} x2={468} y2={TABLE} className="t-faint a-stroke" strokeWidth={2} />
            <Thing kind="cube" x={CUBE} y={TABLE} tone="muted" size={24} />
            <Thing kind="can" x={CAN} y={TABLE} tone="action" size={28} />
            <Arm base={BASE} lengths={LENGTHS} angles={pose} open={step >= 3 ? 0 : 1} tone="ink" />
            <Label x={CAN} y={TABLE + 22} tone="action" size={14} weight={700}>
              can
            </Label>
            <Label x={CUBE} y={TABLE + 22} tone="muted" size={14}>
              cube
            </Label>
            <Label x={460} y={36} anchor="end" tone="ink" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
              right target
            </Label>
            <Label x={460} y={36} anchor="end" tone="failure" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
              just off: it slips
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
