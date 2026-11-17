"use client";

import { AnimationFrame, Chip, Dot, Label } from "@/animations";
import { PlantSide, Ring, shootTip, type SideShoot } from "./parts";

const PX = 90;
const SHOOTS: SideShoot[] = [
  { y: 124, side: 1 },
  { y: 174, side: 1 },
  { y: 224, side: 1 },
];
const MIDDLE = shootTip(PX, SHOOTS[1]);
const LOWEST = shootTip(PX, SHOOTS[2]);

const ROWS = [
  { field: "see", value: "2 shoots", y: 64, from: 1 },
  { field: "so", value: "2nd of 2, the lowest", y: 88, from: 2 },
  { field: "next", value: "cut the lowest shoot", y: 112, from: 2 },
];

/** 108 three-shoot plants: 105 where the note said "2 shoots", 3 where it counted right. */
const COLS = 12;
const GRID = Array.from({ length: 108 }, (_, i) => ({
  x: 262 + (i % COLS) * 15,
  y: 170 + Math.floor(i / COLS) * 14,
  wrong: i < 105,
}));

export function CountMiss() {
  return (
    <AnimationFrame
      title="The note that could not count"
      description="A plant with three shoots and the instruction 'cut the second shoot from the top'. The stage-1 note says 2 shoots, so it counts down to the lowest shoot, while the middle one was meant. Over 108 three-shoot plants it wrote 2 shoots for 105."
      steps={[
        "Three shoots, and the instruction: the second from the top.",
        "The stage-1 note says “2 shoots”.",
        "So it counts down to the lowest shoot. The middle one was meant.",
        "It wrote “2 shoots” for 105 of 108 plants that had three.",
      ]}
      size={[480, 336]}
      hold={[2400, 2400, 3000, 4200]}
    >
      {(step) => (
        <>
          <Chip x={240} y={22} text="cut the second shoot from the top" tone="language" mono={false} size={14} />
          <PlantSide x={PX} base={306} top={76} shoots={SHOOTS} />
          <Ring x={MIDDLE[0]} y={MIDDLE[1]} r={13} tone="success" dashed opacity={step >= 2 ? 1 : 0} />
          <Label x={MIDDLE[0] + 22} y={MIDDLE[1]} tone="success" size={14} anchor="start" weight={700} opacity={step >= 2 ? 1 : 0}>
            meant
          </Label>
          <Ring x={LOWEST[0]} y={LOWEST[1]} r={13} tone="failure" opacity={step >= 2 ? 1 : 0} />
          <Label x={LOWEST[0] + 22} y={LOWEST[1]} tone="failure" size={14} anchor="start" weight={700} opacity={step >= 2 ? 1 : 0}>
            cut
          </Label>

          {/* The note */}
          <rect x={232} y={46} width={236} height={84} rx={10} className="t-language a-fill-soft a-stroke a-t" strokeWidth={1.5} style={{ opacity: step >= 1 ? 1 : 0.35 }} />
          {ROWS.map((row) => (
            <g key={row.field}>
              <Label x={244} y={row.y} tone="muted" size={14} anchor="start" weight={700} opacity={step >= row.from ? 1 : 0}>
                {row.field}
              </Label>
              <Label
                x={288}
                y={row.y}
                tone={row.field === "see" ? "failure" : "ink"}
                size={14}
                anchor="start"
                weight={row.field === "see" ? 700 : 400}
                opacity={step >= row.from ? 1 : 0}
              >
                {row.value}
              </Label>
            </g>
          ))}

          {/* 108 three-shoot plants */}
          <Label x={344} y={152} tone="muted" size={13} opacity={step >= 3 ? 1 : 0}>
            108 plants with three shoots
          </Label>
          {GRID.map((dot, i) => (
            <Dot key={i} x={dot.x} y={dot.y} r={4.5} tone={dot.wrong ? "failure" : "success"} opacity={step >= 3 ? 1 : 0} delay={Math.floor(i / COLS) * 60} />
          ))}
          <Label x={344} y={306} tone="failure" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={500}>
            “2 shoots” on 105 of them
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
