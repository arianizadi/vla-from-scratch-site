"use client";

import { AnimationFrame, Label, Timeline } from "@/animations";

/* Where the gripper first closed, drawn as 12 tries per checkpoint on a
   top-down table. The shares come from the chapter's 4000-demonstration run;
   the dot positions are drawn, not measured. */

const TILE = { x: 30, y: 36, w: 250, h: 170 };
const NAMED = { x: TILE.x + 70, y: TILE.y + 112 };
const OTHERS = [
  { x: TILE.x + 150, y: TILE.y + 52 },
  { x: TILE.x + 206, y: TILE.y + 124 },
];

/** Checkpoints: training examples seen (millions) and the share that closed at the named object. */
const CHECKS = [
  { at: 1.0, share: 35 },
  { at: 1.5, share: 61 },
  { at: 2.0, share: 95 },
  { at: 3.0, share: 100 },
];
const TRIES = 12;

function place(j: number, centre: { x: number; y: number }) {
  const angle = j * 2.39996;
  const radius = 18 + (j % 3) * 5;
  return { x: Math.round(centre.x + Math.cos(angle) * radius), y: Math.round(centre.y + Math.sin(angle) * radius * 0.8) };
}

export function LooksLate() {
  return (
    <AnimationFrame
      title="It learns to look late"
      description="Twelve tries per checkpoint, drawn on the table from above. After 1 million training examples the gripper closes at the named object 35% of the time, about what luck gives with three objects. At 1.5 million it is 61%, at 2 million 95%, and at 3 million every time."
      steps={[
        "After 1M examples: the arm moves well, but picks one of the three at random. 35%.",
        "At 1.5M something changes: 61% at the named object.",
        "At 2M it is clearly looking: 95%.",
        "At 3M: every time.",
      ]}
      size={[480, 280]}
    >
      {(step) => {
        const check = CHECKS[step];
        const onNamed = Math.round((TRIES * check.share) / 100);
        return (
          <>
            <Label x={TILE.x} y={TILE.y - 18} tone="muted" size={13} anchor="start">
              where the gripper closed, from above
            </Label>
            <rect className="a-t t-faint a-fill-soft a-stroke" x={TILE.x} y={TILE.y} width={TILE.w} height={TILE.h} rx={8} strokeWidth={1.5} />
            <rect className="a-t t-action a-fill-soft a-stroke" x={NAMED.x - 13} y={NAMED.y - 13} width={26} height={26} rx={4} strokeWidth={2} />
            <circle className="a-t t-muted a-fill-soft a-stroke" cx={OTHERS[0].x} cy={OTHERS[0].y} r={13} strokeWidth={2} />
            <path
              className="a-t t-muted a-fill-soft a-stroke"
              d={`M${OTHERS[1].x - 14} ${OTHERS[1].y}l7 -12h14l7 12l-7 12h-14z`}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Label x={NAMED.x} y={NAMED.y + 42} tone="action" size={13} weight={700}>
              named
            </Label>

            {Array.from({ length: TRIES }, (_, j) => {
              const target = j < onNamed ? NAMED : OTHERS[j % 2];
              const p = place(j, target);
              return (
                <circle
                  key={j}
                  className="a-t t-accent a-fill"
                  r={3.5}
                  style={{ transform: `translate(${p.x}px, ${p.y}px)`, transitionDelay: `${j * 30}ms` }}
                />
              );
            })}

            <Label x={374} y={92} tone="ink" size={44} weight={700}>
              {`${check.share}%`}
            </Label>
            <Label x={374} y={130} tone="muted" size={14}>
              closed at the named one
            </Label>
            <Label x={374} y={154} tone="faint" size={13}>
              luck: 33%
            </Label>

            <Timeline x={40} y={244} w={400} ticks={["0", "1M", "2M", "3M"]} marker={check.at / 3} tone="accent" />
          </>
        );
      }}
    </AnimationFrame>
  );
}
