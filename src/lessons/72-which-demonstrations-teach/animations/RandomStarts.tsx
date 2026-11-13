"use client";

import { AnimationFrame, Arrow, Cells, Dot, Gripper, Label, Path, Thing, stagger } from "@/animations";

const TABLE = 220;
const OBJECTS = [
  { kind: "cube" as const, x: 150 },
  { kind: "can" as const, x: 300 },
  { kind: "nut" as const, x: 420 },
];
/** One pose in mid-reach. */
const MID: [number, number] = [262, 118];
/** Where the demonstrations start: the usual pose first, then random ones. */
const STARTS: { x: number; y: number }[] = [
  { x: 120, y: 60 },
  { x: 410, y: 50 },
  { x: 56, y: 110 },
  { x: 196, y: 30 },
];


const MOMENTS = 66;

export function RandomStarts() {
  return (
    <AnimationFrame
      title="Random starts hide the giveaway"
      description="When every demonstration starts from the same pose, a pose in mid-reach fits only one goal. When each starts from a different place, the same mid-reach pose lies on the way to several objects, so the arm's pose no longer says where it is going and every moment needs the picture."
      steps={[
        "Same start every time: a pose in mid-reach fits only one goal.",
        "Now start each demonstration from a different place.",
        "The same mid-reach pose now lies on the way to several goals.",
        "So every moment needs the picture, not only the first few.",
      ]}
      size={[480, 300]}
    >
      {(step) => (
        <>
          {STARTS.map((start, index) => (
            <Path
              key={`in-${index}`}
              d={`M${start.x} ${start.y + 34}Q${(start.x + MID[0]) / 2} ${Math.min(start.y + 34, MID[1]) - 20} ${MID[0]} ${MID[1]}`}
              tone={index === 0 ? "ink" : "muted"}
              width={1.5}
              dashed
              opacity={index === 0 || step >= 2 ? 1 : 0}
              delay={stagger(index, 150)}
            />
          ))}
          {OBJECTS.map((object, index) => (
            <Arrow
              key={`out-${object.kind}`}
              from={[MID[0], MID[1] + 10]}
              to={[object.x, TABLE - 52]}
              bend={object.x < MID[0] ? 18 : object.x > MID[0] + 60 ? -18 : 0}
              tone={step >= 2 ? "accent" : "action"}
              width={2}
              drawn={index === 1 || step >= 2}
              delay={index === 1 ? 0 : 300}
            />
          ))}
          {STARTS.map((start, index) => (
            <Gripper
              key={`start-${index}`}
              x={start.x}
              y={start.y}
              size={0.75}
              tone={index === 0 ? "ink" : "muted"}
              opacity={index === 0 || step >= 1 ? 1 : 0}
              delay={stagger(index, 120)}
            />
          ))}
          <Label x={120} y={30} tone="muted" size={13} opacity={step === 0 ? 1 : 0}>
            the usual start
          </Label>

          <Dot x={MID[0]} y={MID[1]} r={7} tone="ink" />
          <Label x={MID[0] + 14} y={MID[1] - 2} tone="ink" size={14} weight={700} anchor="start">
            {step >= 2 ? "going where?" : "mid-reach"}
          </Label>

          <Path d={`M24 ${TABLE}H456`} tone="faint" width={2} />
          {OBJECTS.map((object, index) => (
            <Thing key={object.kind} kind={object.kind} x={object.x} y={TABLE} tone={step < 2 && index === 1 ? "action" : "muted"} />
          ))}

          <Cells x={240} y={276} values={Array.from({ length: MOMENTS }, () => 1)} tone="accent" cell={5} gap={1} opacity={step >= 3 ? 1 : 0} />
          <Label x={240} y={254} tone="accent" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            every moment needs the picture
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
