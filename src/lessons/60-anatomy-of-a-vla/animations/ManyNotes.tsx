"use client";

import { AnimationFrame, Chip, Label, Move, Path, stagger } from "@/animations";

/* A top-down view of the table, cut into 4 x 4 patches. Each patch becomes a
   note for the mover. Squeezed into one note, where things are is lost. */

const TILE_X = 24;
const TILE_Y = 44;
const PATCH = 40;
const SIDE = PATCH * 4;

const CUBE = { x: TILE_X + 58, y: TILE_Y + 102 };
const CAN = { x: TILE_X + 112, y: TILE_Y + 62 };
const NUT = { x: TILE_X + 132, y: TILE_Y + 134 };
/** An empty spot between the objects, where a policy that cannot tell them apart closes. */
const EMPTY = { x: TILE_X + 94, y: TILE_Y + 104 };

const GRID_LEFT = 284;
const GRID_TOP = 66;
const NOTE = 26;
const NOTE_GAP = 4;
const SUMMARY = { x: 340, y: 122 };

const PATCHES = Array.from({ length: 16 }, (_, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  const home = { x: TILE_X + PATCH / 2 + col * PATCH, y: TILE_Y + PATCH / 2 + row * PATCH };
  const grid = { x: GRID_LEFT + NOTE / 2 + col * (NOTE + NOTE_GAP), y: GRID_TOP + NOTE / 2 + row * (NOTE + NOTE_GAP) };
  const holds = (point: { x: number; y: number }) =>
    point.x >= home.x - PATCH / 2 && point.x < home.x + PATCH / 2 && point.y >= home.y - PATCH / 2 && point.y < home.y + PATCH / 2;
  const tone = holds(CUBE) ? "action" : holds(CAN) || holds(NUT) ? "ink" : "vision";
  return { index, home, grid, tone };
});

function gridLines(): string {
  let d = "";
  for (let i = 1; i < 4; i += 1) {
    d += `M${TILE_X + i * PATCH} ${TILE_Y}v${SIDE}M${TILE_X} ${TILE_Y + i * PATCH}h${SIDE}`;
  }
  return d;
}

const WORDS = ["pick", "red", "cube"];

export function ManyNotes() {
  return (
    <AnimationFrame
      title="One summary or many notes"
      description="The reader sees the table in 16 small squares. Squeezed into one summary note, the squares lose where things are, and the gripper closes on empty table between the objects. Kept as one note per square, plus one per word, the mover can find the red cube, and the gripper closes on it."
      steps={[
        "The reader sees the table in small squares, called patches.",
        "Squeeze every patch into one summary note…",
        "…and where things are is lost. The gripper closes on empty table.",
        "Keep one note per patch, and one per word.",
        "Now the mover can find the red cube. It closes on it.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const summary = step === 1 || step === 2;
        const many = step >= 3;
        return (
          <>
            <Label x={TILE_X} y={TILE_Y - 22} tone="muted" size={14} anchor="start">
              the table, from above
            </Label>
            <rect className="a-t t-faint a-fill-soft a-stroke" x={TILE_X} y={TILE_Y} width={SIDE} height={SIDE} rx={6} strokeWidth={1.5} />
            <rect className="a-t t-action a-fill-soft a-stroke" x={CUBE.x - 12} y={CUBE.y - 12} width={24} height={24} rx={4} strokeWidth={2} />
            <circle className="a-t t-muted a-fill-soft a-stroke" cx={CAN.x} cy={CAN.y} r={12} strokeWidth={2} />
            <path
              className="a-t t-muted a-fill-soft a-stroke"
              d={`M${NUT.x - 13} ${NUT.y}l6.5 -11h13l6.5 11l-6.5 11h-13z`}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path d={gridLines()} tone="vision" width={1.5} drawn opacity={step === 0 || many ? 0.8 : 0.25} />

            <Label x={340} y={TILE_Y - 22} tone="muted" size={14} opacity={step >= 1 ? 1 : 0}>
              what the mover gets
            </Label>

            {PATCHES.map((patch) => {
              const to = many ? patch.grid : summary ? SUMMARY : patch.home;
              return (
                <Move
                  key={patch.index}
                  x={to.x}
                  y={to.y}
                  opacity={many || step === 1 ? 1 : 0}
                  delay={stagger(patch.index, 25)}
                >
                  <rect
                    className={`t-${patch.tone} a-fill-soft a-stroke`}
                    x={-NOTE / 2}
                    y={-NOTE / 2}
                    width={NOTE}
                    height={NOTE}
                    rx={4}
                    strokeWidth={1.5}
                  />
                </Move>
              );
            })}
            <rect
              className="a-t t-accent a-fill a-stroke"
              x={SUMMARY.x - 20}
              y={SUMMARY.y - 20}
              width={40}
              height={40}
              rx={6}
              strokeWidth={1.5}
              style={{ opacity: summary ? 1 : 0, transitionDelay: summary ? "400ms" : undefined }}
            />
            <Label x={SUMMARY.x} y={SUMMARY.y + 40} tone="accent" size={14} weight={700} opacity={summary ? 1 : 0}>
              one summary note
            </Label>

            {WORDS.map((word, index) => (
              <Chip key={word} x={288 + index * 52} y={204} text={word} tone="language" size={13} opacity={many ? 1 : 0} delay={400 + stagger(index, 80)} />
            ))}
            <Label x={340} y={236} tone="muted" size={14} opacity={many ? 1 : 0} delay={500}>
              16 patch notes + 3 word notes
            </Label>

            {/* where the gripper closed */}
            <Move x={step >= 4 ? CUBE.x : EMPTY.x} y={step >= 4 ? CUBE.y : EMPTY.y} opacity={step === 2 || step >= 4 ? 1 : 0}>
              <circle className={`a-t ${step >= 4 ? "t-success" : "t-failure"} a-stroke`} r={19} fill="none" strokeWidth={3} />
            </Move>
            <Label x={TILE_X + SIDE / 2} y={TILE_Y + SIDE + 24} tone="failure" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
              closed on empty table
            </Label>
            <Label x={TILE_X + SIDE / 2} y={TILE_Y + SIDE + 24} tone="success" size={14} weight={700} opacity={step >= 4 ? 1 : 0}>
              closed on the red cube
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
