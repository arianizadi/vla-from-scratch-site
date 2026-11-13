"use client";

import { AnimationFrame, Arm, Label, Path, Thing, reach, stagger } from "@/animations";

const TABLE = 186;
const BASE: [number, number] = [84, TABLE];
const LENGTHS: [number, number] = [130, 110];
const CUBE = 300;

const POSES = [
  reach(BASE, [176, 96], LENGTHS),
  reach(BASE, [CUBE, 140], LENGTHS),
  reach(BASE, [CUBE, TABLE - 8], LENGTHS),
  reach(BASE, [CUBE, 120], LENGTHS),
];

/** Six recorded moments: where the gripper is in each little picture (0 far, 1 at the cube) and how high. */
const FRAMES = [
  { reach: 0, up: 1 },
  { reach: 0.35, up: 0.9 },
  { reach: 0.7, up: 0.6 },
  { reach: 1, up: 0.15 },
  { reach: 1, up: 0.15 },
  { reach: 1, up: 0.7 },
];
/** The step from which each frame is on the strip. */
const FRAME_FROM = [0, 1, 1, 2, 2, 3];

const STRIP_LEFT = 132;
const STRIP_STEP = 56;
const TILE_W = 46;
const TILE_H = 32;
const PICTURE_Y = 236;
const ACTION_Y = 270;

export function RecordEpisode() {
  return (
    <AnimationFrame
      title="One demonstration, recorded"
      description="An expert picks up the red cube while a recorder runs. At every moment it stores what the cameras saw and the command the expert sent next. One run of the task is about 66 such moments, 20 every second."
      steps={[
        "An expert picks up the red cube. The recorder is running.",
        "Every moment, it stores what the cameras saw…",
        "…and the command the expert sent next.",
        "One run: about 66 such moments, 20 every second.",
      ]}
      size={[480, 296]}
    >
      {(step) => (
        <>
          <Path d={`M24 ${TABLE}H456`} tone="faint" width={2} />
          <Thing kind="cube" x={CUBE} y={step >= 3 ? TABLE - 58 : TABLE} tone="action" />
          <Thing kind="can" x={372} y={TABLE} tone="muted" />
          <Arm base={BASE} lengths={LENGTHS} angles={POSES[step]} open={step >= 3 ? 0.75 : 1} />

          <circle className="a-t t-failure a-fill" cx={444} cy={28} r={6} style={{ opacity: step <= 2 ? 1 : 0.3 }} />
          <Label x={432} y={28} tone="muted" size={13} anchor="end">
            recording
          </Label>

          <Label x={STRIP_LEFT - 34} y={PICTURE_Y} tone="vision" size={14} anchor="end">
            saw
          </Label>
          <Label x={STRIP_LEFT - 34} y={ACTION_Y} tone="action" size={14} anchor="end" opacity={step >= 2 ? 1 : 0}>
            did next
          </Label>

          {FRAMES.map((frame, index) => {
            const cx = STRIP_LEFT + index * STRIP_STEP;
            const shown = step >= FRAME_FROM[index];
            const gx = cx - 14 + frame.reach * 22;
            const gy = PICTURE_Y - 8 + (1 - frame.up) * 12;
            return (
              <g key={index} className="a-t" style={{ opacity: shown ? 1 : 0, transitionDelay: `${stagger(index % 2, 120)}ms` }}>
                <rect className="t-vision a-fill-soft a-stroke" x={cx - TILE_W / 2} y={PICTURE_Y - TILE_H / 2} width={TILE_W} height={TILE_H} rx={4} strokeWidth={1.5} />
                <rect className="t-action a-fill" x={cx + 6} y={PICTURE_Y + 4} width={8} height={8} rx={1.5} />
                <circle className="t-ink a-fill" cx={gx} cy={gy} r={3} />
                <rect
                  className="a-t t-action a-fill"
                  x={cx - TILE_W / 2}
                  y={ACTION_Y - 6}
                  width={TILE_W}
                  height={12}
                  rx={3}
                  style={{ opacity: step >= 2 ? 0.35 + 0.1 * index : 0, transitionDelay: `${stagger(index, 60)}ms` }}
                />
              </g>
            );
          })}
          <Label x={STRIP_LEFT + 6 * STRIP_STEP - 8} y={PICTURE_Y + 18} tone="muted" size={15} weight={700} opacity={step >= 3 ? 1 : 0}>
            …
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
