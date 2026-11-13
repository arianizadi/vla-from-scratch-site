"use client";

import { AnimationFrame, Dot, Label, Path, stagger } from "@/animations";
import { CAN, CUBE, NUT, TABLE, TopTable } from "./table";

const START: [number, number] = [52, 84];
const CLOSE: [number, number] = [196, 182];
const OBJECTS = [
  { name: "cube", at: CUBE, nearest: false },
  { name: "can", at: CAN, nearest: true },
  { name: "nut", at: NUT, nearest: false },
];

/** Toy tally: which of 12 tries closed at the can. A guesser gets about a third. */
const GUESSING = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0];
const PANEL = 324;
const dotX = (i: number) => PANEL + 12 + (i % 6) * 22;

/** Viewfinder corners around the table: "the scene is recorded now". */
function corners(): string {
  const { x, y, w, h } = TABLE;
  const l = 18;
  const a = x - 6;
  const b = y - 6;
  const c = x + w + 6;
  const d = y + h + 6;
  return `M${a} ${b + l}V${b}H${a + l}M${c - l} ${b}H${c}V${b + l}M${c} ${d - l}V${d}H${c - l}M${a + l} ${d}H${a}V${d - l}`;
}

export function Snapshot() {
  return (
    <AnimationFrame
      title="A snapshot at the first close"
      description="Seen from above, the gripper moves toward the can. The moment it first closes, a recorder notes where the gripper and every object are. The nearest object is the can, the one that was asked for. Over twelve toy tries, a policy that guesses closes nearest the can about one time in three; one that looks does so every time."
      steps={[
        "The instruction asks for the can. The arm sets off.",
        "The instant the gripper first closes, a recorder notes every position.",
        "Measure from the gripper to each object. The nearest is the can: right object.",
        "Repeat many times. A guesser picks the asked-for object about 1 time in 3.",
      ]}
      size={[480, 290]}
    >
      {(step) => {
        const at = step >= 1 ? CLOSE : START;
        const closed = step >= 1;
        return (
          <>
            <TopTable dimOthers={step === 2} />
            <Path d={`M${START[0]} ${START[1]}Q${120} ${110} ${CLOSE[0]} ${CLOSE[1]}`} tone="action" dashed drawn={step >= 1} />

            {OBJECTS.map((object, index) => (
              <Path
                key={object.name}
                d={`M${CLOSE[0]} ${CLOSE[1]}L${object.at[0]} ${object.at[1]}`}
                tone={object.nearest ? "action" : "faint"}
                width={object.nearest ? 3 : 1.5}
                drawn={step === 2}
                delay={stagger(index, 140)}
              />
            ))}
            <Label x={228} y={214} tone="action" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0} delay={500}>
              nearest
            </Label>

            {/* The gripper from above: a palm and two jaws that close. */}
            <g className="a-t t-ink" style={{ transform: `translate(${at[0]}px, ${at[1]}px)` }}>
              <rect className="a-fill" x={-17} y={-15} width={34} height={6} rx={3} />
              <g className="a-t" style={{ transform: `translate(${closed ? 7 : 0}px, 0px)` }}>
                <rect className="a-fill" x={-17} y={-12} width={6} height={24} rx={2} />
              </g>
              <g className="a-t" style={{ transform: `translate(${closed ? -7 : 0}px, 0px)` }}>
                <rect className="a-fill" x={11} y={-12} width={6} height={24} rx={2} />
              </g>
            </g>

            <Path d={corners()} tone="accent" width={3} drawn={step === 1} />
            <Label x={TABLE.x + TABLE.w - 8} y={64} tone="accent" size={14} weight={700} anchor="end" opacity={step === 1 ? 1 : 0}>
              snapshot
            </Label>

            {/* The tally over many tries. */}
            <Label x={PANEL} y={72} tone="muted" size={14} anchor="start" opacity={step >= 3 ? 1 : 0}>
              12 tries each
            </Label>
            <Label x={PANEL} y={104} tone="ink" size={15} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
              guessing
            </Label>
            {GUESSING.map((hit, i) => (
              <Dot
                key={`g-${i}`}
                x={dotX(i)}
                y={i < 6 ? 130 : 152}
                r={7}
                tone={hit ? "action" : "faint"}
                hollow={!hit}
                opacity={step >= 3 ? 1 : 0}
                delay={stagger(i, 40)}
              />
            ))}
            <Label x={PANEL} y={180} tone="muted" size={14} anchor="start" opacity={step >= 3 ? 1 : 0} delay={500}>
              4 at the can: 1 in 3
            </Label>
            <Label x={PANEL} y={212} tone="ink" size={15} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0} delay={300}>
              looking
            </Label>
            {GUESSING.map((_, i) => (
              <Dot key={`l-${i}`} x={dotX(i)} y={i < 6 ? 238 : 260} r={7} tone="action" opacity={step >= 3 ? 1 : 0} delay={300 + stagger(i, 40)} />
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
