"use client";

import { AnimationFrame, Bar, Box, Label, stagger } from "@/animations";

const COLS = 16;
const ROWS = 8;
const CELL = 12;
const GAP = 3;
const GRID_X = 24;
const GRID_Y = 50;
const TRAINING = 10;
const HELPERS = 12;

const cellX = (i: number) => GRID_X + (i % COLS) * (CELL + GAP);
const cellY = (i: number) => GRID_Y + Math.floor(i / COLS) * (CELL + GAP);
const CORES = Array.from({ length: COLS * ROWS }, (_, i) => i);
const HELPER_X = (i: number) => GRID_X + 9 + i * 20;

/** Training speed as a share of its speed alone: the chapter's 1069 and 410 samples per second. */
const SPEED = [1, 1, 410 / 1069, 1];

export function ThreadFlood() {
  return (
    <AnimationFrame
      title="Crowding a shared machine"
      description="A grid of processor cores; training uses a few of them. Twelve helper jobs start, and by default each one starts a thread for every core. Every core becomes crowded and training waits its turn, running at well under half its speed. With each helper capped at a few threads, they fit, and training gets its speed back."
      steps={[
        "Each square is one processor core. Training uses a few.",
        "Twelve helper jobs start. By default each one starts a thread for every core.",
        "Every core is crowded. Training waits its turn and runs at well under half speed.",
        "Capped at a few threads each, the helpers fit, and training gets its speed back.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const flooded = step === 2;
        return (
          <>
            <Label x={GRID_X} y={28} tone="muted" size={14} anchor="start">
              processor cores
            </Label>
            {CORES.map((i) => (
              <rect key={`core-${i}`} className="t-faint a-fill-soft" x={cellX(i)} y={cellY(i)} width={CELL} height={CELL} rx={2} />
            ))}
            {CORES.slice(TRAINING).map((i) => {
              const busy = flooded || (step === 3 && i < TRAINING + HELPERS);
              return (
                <rect
                  key={`helper-core-${i}`}
                  className="a-t t-action a-fill"
                  x={cellX(i)}
                  y={cellY(i)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  style={{ opacity: busy ? 0.85 : 0, transitionDelay: `${flooded ? stagger(i % 9, 40) : 0}ms` }}
                />
              );
            })}
            {CORES.slice(0, TRAINING).map((i) => (
              <rect key={`train-core-${i}`} className="t-accent a-fill" x={cellX(i)} y={cellY(i)} width={CELL} height={CELL} rx={2} />
            ))}

            <rect className="t-accent a-fill" x={GRID_X} y={182} width={12} height={12} rx={2} />
            <Label x={GRID_X + 18} y={188} tone="ink" size={14} anchor="start">
              training
            </Label>
            <rect className="t-action a-fill a-t" x={GRID_X + 100} y={182} width={12} height={12} rx={2} style={{ opacity: step >= 1 ? 1 : 0 }} />
            <Label x={GRID_X + 118} y={188} tone="ink" size={14} anchor="start" opacity={step >= 1 ? 1 : 0}>
              helper jobs
            </Label>

            {Array.from({ length: HELPERS }, (_, i) => (
              <Box key={`helper-${i}`} x={HELPER_X(i)} y={232} w={16} h={28} radius={4} tone="action" filled opacity={step >= 1 ? 1 : 0} delay={stagger(i, 40)} />
            ))}
            <Label x={GRID_X} y={210} tone="muted" size={13} anchor="start" opacity={step >= 1 ? 1 : 0}>
              {step === 3 ? "a few threads each" : "a thread per core, each"}
            </Label>

            <Bar x={400} y={222} height={150} value={SPEED[step]} width={48} tone={flooded ? "failure" : "accent"} />
            <Label x={400} y={244} tone="ink" size={14} weight={700}>
              training speed
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
