"use client";

import { AnimationFrame, Label } from "@/animations";

/**
 * The scripted expert with its grasp shifted sideways on purpose: share of
 * tries that still lift the object, per offset (0, 1, 2, 3 cm). From the
 * chapter's tolerance measurement, rounded.
 */
const OBJECTS = [
  { name: "T block", y: 106, lifted: [100, 100, 98, 76] },
  { name: "can", y: 214, lifted: [100, 94, 29, 3] },
];
const CX = 104;
const PER_CM = 10;
const TRACK_X = 222;
const TRACK_W = 196;

function TBlock({ y }: { y: number }) {
  return (
    <path
      d={`M${CX - 30} ${y - 22}H${CX + 30}V${y - 8}H${CX + 8}V${y + 24}H${CX - 8}V${y - 8}H${CX - 30}Z`}
      className="t-muted a-fill-soft a-stroke"
      strokeWidth={2}
      strokeLinejoin="round"
    />
  );
}

/** Two fingers from above, closing across the object, shifted by `offset` cm. */
function Fingers({ y, offset }: { y: number; offset: number }) {
  return (
    <g className="a-t t-ink" style={{ transform: `translate(${CX + offset * PER_CM}px, ${y}px)` }}>
      <rect className="a-fill" x={-8} y={-38} width={16} height={7} rx={2} />
      <rect className="a-fill" x={-8} y={31} width={16} height={7} rx={2} />
      <line x1={0} y1={-30} x2={0} y2={30} className="a-stroke" strokeWidth={1.5} strokeDasharray="3 4" />
    </g>
  );
}

export function Tolerance() {
  return (
    <AnimationFrame
      title="How much error a grasp forgives"
      description="The hand-written expert grasps a T block and a can, seen from above, with its grasp shifted sideways on purpose by 0, 1, 2 and 3 centimetres. Bars show how often the object is still lifted. The T block forgives 2 centimetres (98%); the round can drops to 29% at 2 centimetres and 3% at 3."
      steps={[
        "The expert grasps dead centre. Both objects lift every time.",
        "Shift its grasp 1 cm sideways. Both still lift almost always.",
        "At 2 cm the T block still lifts. The round can mostly slips out.",
        "At 3 cm both suffer. Each object forgives its own amount of error.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Label x={20} y={26} tone="muted" size={14} anchor="start">
            grasp shifted by
          </Label>
          <Label x={152} y={26} tone="accent" size={16} weight={700} anchor="start">
            {`${step} cm`}
          </Label>
          <Label x={TRACK_X} y={26} tone="muted" size={14} anchor="start">
            how often it still lifts
          </Label>

          {OBJECTS.map((object) => {
            const value = object.lifted[step];
            const good = value >= 90;
            return (
              <g key={object.name}>
                {object.name === "can" ? (
                  <circle cx={CX} cy={object.y} r={21} className="t-muted a-fill-soft a-stroke" strokeWidth={2} />
                ) : (
                  <TBlock y={object.y} />
                )}
                <line x1={CX} y1={object.y - 44} x2={CX} y2={object.y + 44} className="t-faint a-stroke" strokeWidth={1} />
                <Fingers y={object.y} offset={step} />
                <Label x={CX} y={object.y + 56} tone="ink" size={14} weight={700}>
                  {object.name}
                </Label>

                <rect x={TRACK_X} y={object.y - 12} width={TRACK_W} height={24} rx={6} className="t-faint a-fill-soft" />
                <g className={`a-t ${good ? "t-success" : "t-failure"}`} style={{ transform: `translate(${TRACK_X}px, ${object.y - 12}px) scale(${Math.max(0.02, value / 100)}, 1)` }}>
                  <rect className="a-fill" x={0} y={0} width={TRACK_W} height={24} />
                </g>
                <Label x={TRACK_X + TRACK_W + 8} y={object.y} tone="ink" size={15} weight={700} anchor="start">
                  {`${value}%`}
                </Label>
              </g>
            );
          })}
        </>
      )}
    </AnimationFrame>
  );
}
