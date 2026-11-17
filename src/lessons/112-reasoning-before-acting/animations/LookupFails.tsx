"use client";

import { AnimationFrame, Chip, Label, stagger } from "@/animations";
import { PlantSide, Ring, shootTip, type SideShoot } from "./parts";

const A = 130;
const B = 350;
const BASE = 216;
const TOP = 64;

/** Three shoots (top, middle, lowest) and two shoots (top, lowest), from the top down. */
const THREE: SideShoot[] = [
  { y: 104, side: 1 },
  { y: 140, side: -1 },
  { y: 176, side: 1 },
];
const TWO: SideShoot[] = [
  { y: 112, side: -1 },
  { y: 168, side: 1 },
];

const KINDS = [
  { text: "count down", x: A, y: 296 },
  { text: "if the flower is…", x: B, y: 296 },
  { text: "all except…", x: A, y: 330 },
  { text: "read the label", x: B, y: 330 },
];

export function LookupFails() {
  return (
    <AnimationFrame
      title="Same words, different shoot"
      description="The instruction 'cut the second shoot from the top' means the middle shoot on a plant with three shoots and the lowest on a plant with two. A word lookup must give one answer, so it is right on one plant and wrong on the other. Four kinds of task work like this: counting down, the flower's colour, all except one, and a hidden label. The best word lookup is right 42 to 65% of the time."
      steps={[
        "The instruction: cut the second shoot from the top.",
        "Count down on a plant with three shoots: the middle one.",
        "The same words on a plant with two shoots: the lowest one.",
        "A word lookup gives one answer, so it misses one of the two plants.",
        "Four kinds of task hide the answer like this. A lookup is right 42–65% of the time.",
      ]}
      size={[480, 372]}
      hold={[2400, 2600, 2600, 3000, 4200]}
    >
      {(step) => (
        <>
          <Chip x={240} y={24} text="cut the second shoot from the top" tone="language" mono={false} size={14} />

          <PlantSide x={A} base={BASE} top={TOP} shoots={THREE} />
          <PlantSide x={B} base={BASE} top={TOP} shoots={TWO} />
          <Label x={A} y={236} tone="muted" size={14}>
            three shoots
          </Label>
          <Label x={B} y={236} tone="muted" size={14}>
            two shoots
          </Label>

          {/* Counting from the top, beside each tip */}
          {THREE.map((shoot, i) => {
            const [tx, ty] = shootTip(A, shoot);
            const side = shoot.side ?? 1;
            return (
              <Label key={`a${i}`} x={tx + side * 22} y={ty} tone="ink" size={14} weight={700} opacity={step >= 1 ? 1 : 0} delay={stagger(i, 160)}>
                {String(i + 1)}
              </Label>
            );
          })}
          {TWO.map((shoot, i) => {
            const [tx, ty] = shootTip(B, shoot);
            const side = shoot.side ?? 1;
            return (
              <Label key={`b${i}`} x={tx + side * 22} y={ty} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0} delay={stagger(i, 160)}>
                {String(i + 1)}
              </Label>
            );
          })}

          {/* The shoot each plant means */}
          {(() => {
            const [ax, ay] = shootTip(A, THREE[1]);
            const [bx, by] = shootTip(B, TWO[1]);
            return (
              <>
                <Ring x={ax} y={ay} r={13} tone="accent" opacity={step >= 1 ? 1 : 0} />
                <Ring x={bx} y={by} r={13} tone="accent" opacity={step >= 2 ? 1 : 0} />
              </>
            );
          })()}

          {/* A lookup that always answers "the middle" */}
          <Label x={A} y={262} tone="success" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            lookup “middle”: right
          </Label>
          <Label x={B} y={262} tone="failure" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={150}>
            lookup “middle”: wrong
          </Label>

          {/* The four kinds, and the ceiling */}
          {KINDS.map((kind, i) => (
            <Chip
              key={kind.text}
              x={kind.x}
              y={kind.y}
              text={kind.text}
              tone="ink"
              variant="outline"
              mono={false}
              size={14}
              opacity={step >= 4 ? 1 : 0}
              delay={stagger(i, 90)}
            />
          ))}
          <Label x={240} y={358} tone="ink" size={14} weight={700} opacity={step >= 4 ? 1 : 0} delay={400}>
            best word lookup: right 42–65% of the time
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
