"use client";

import { AnimationFrame, Arm, Cells, Chip, Label, Path, Thing, reach } from "@/animations";

const TABLE = 220;
const BASE: [number, number] = [70, TABLE];
const LENGTHS: [number, number] = [150, 130];
const HOME_TIP: [number, number] = [150, 100];
const OBJECTS = [
  { kind: "cube" as const, x: 230, named: false },
  { kind: "can" as const, x: 320, named: true },
  { kind: "nut" as const, x: 410, named: false },
];

const bend = (x: number): [number, number] => [(HOME_TIP[0] + x) / 2 + 10, 70];
const pathTo = (x: number) => {
  const [cx, cy] = bend(x);
  return `M${HOME_TIP[0]} ${HOME_TIP[1]}Q${cx} ${cy} ${x} ${TABLE - 46}`;
};
/** A point part of the way along the path to x. */
const along = (x: number, t: number): [number, number] => {
  const [cx, cy] = bend(x);
  const end: [number, number] = [x, TABLE - 46];
  return [
    Math.round((1 - t) ** 2 * HOME_TIP[0] + 2 * (1 - t) * t * cx + t * t * end[0]),
    Math.round((1 - t) ** 2 * HOME_TIP[1] + 2 * (1 - t) * t * cy + t * t * end[1]),
  ];
};

const HOME = reach(BASE, HOME_TIP, LENGTHS);
const PARTWAY = reach(BASE, along(320, 0.5), LENGTHS);

const MOMENTS = 66;
const EARLY = 8;

export function Giveaway() {
  return (
    <AnimationFrame
      title="The pose gives the goal away"
      description="At the first moment the arm could be heading to any of three objects, so choosing needs the instruction and the picture. A few moments later, starting from the usual pose, the arm's own position already says it is heading for the can. Only about the first 8 of about 66 moments need the picture to choose."
      steps={[
        "First moment: the arm could be heading to any of the three.",
        "To choose, it has to read the instruction and look at the picture.",
        "A few moments in, the arm's own pose already says where it is going.",
        "So only the first few moments teach it to look.",
      ]}
      size={[480, 300]}
    >
      {(step) => (
        <>
          <Chip x={340} y={30} text="pick up the green can" tone="language" size={14} mono={false} opacity={step >= 1 ? 1 : 0} />

          {OBJECTS.map((object) => (
            <Path
              key={object.x}
              d={pathTo(object.x)}
              tone={object.named && step >= 1 ? "action" : "faint"}
              width={object.named && step >= 1 ? 2 : 1.5}
              dashed
              opacity={step >= 2 && !object.named ? 0 : 1}
            />
          ))}

          <Path d={`M24 ${TABLE}H456`} tone="faint" width={2} />
          {OBJECTS.map((object) => (
            <Thing key={object.kind} kind={object.kind} x={object.x} y={TABLE} tone={object.named && step >= 1 ? "action" : "muted"} active={object.named && step >= 1} />
          ))}
          <Arm base={BASE} lengths={LENGTHS} angles={step >= 2 ? PARTWAY : HOME} />

          <Label x={240} y={TABLE + 22} tone="muted" size={14} opacity={step === 0 ? 1 : 0}>
            which one?
          </Label>
          <Label x={456} y={70} tone="ink" size={14} weight={700} anchor="end" opacity={step === 2 ? 1 : 0}>
            the pose says: the can
          </Label>

          <Cells
            x={240}
            y={276}
            values={Array.from({ length: MOMENTS }, (_, index) => (index < EARLY ? 1 : 0.1))}
            tone="accent"
            cell={5}
            gap={1}
            opacity={step >= 3 ? 1 : 0}
          />
          <Label x={240} y={254} tone="accent" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            only the first 8 of about 66 moments need the picture
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
