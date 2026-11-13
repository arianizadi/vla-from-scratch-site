"use client";

import { AnimationFrame, Chip, Label } from "@/animations";
import { CloseMark, TopObject, type TopKind } from "./topdown";

/* A sketch from above: three layouts, and where a first-round policy closed
   its gripper in each. The positions are made up; the pattern (a cloud of
   closes that does not follow the objects) is what the measurements showed. */

type Layout = Record<TopKind, [number, number]>;

const LAYOUTS: Layout[] = [
  { can: [104, 96], cube: [332, 214], nut: [392, 96] },
  { can: [372, 222], cube: [118, 214], nut: [262, 82] },
  { can: [196, 232], cube: [404, 152], nut: [96, 126] },
];
/** Where the gripper closed in each layout, then in many more. */
const CLOSES: [number, number][] = [
  [236, 152], [256, 164], [226, 166],
  [248, 144], [214, 156], [266, 150], [240, 178], [222, 140], [258, 180], [276, 166], [204, 174], [244, 130],
];
/** Where the can stood in the other layouts. */
const MORE_CANS: [number, number][] = [
  [70, 200], [420, 70], [150, 60], [330, 120], [420, 236], [66, 160], [316, 66], [170, 120], [400, 180],
];

export function IgnoresScene() {
  return (
    <AnimationFrame
      title="Where the first robots closed their hand"
      description="Seen from above, three layouts of the same three objects, with the can named each time. In every layout the robot closed its hand in about the same place near the middle of the table, wherever the can stood. Over many layouts the closing points form one cloud in the middle while the can stood all over the table: the robot ignored the scene."
      steps={[
        "Layout 1: the can is top left. The hand closes near the middle of the table.",
        "Layout 2: the can is bottom right. The hand closes near the middle again.",
        "Layout 3: the can is near the bottom. Same place again.",
        "Over many layouts: one cloud of closes in the middle, wherever the can stood.",
      ]}
      size={[480, 290]}
      hold={[2400, 2400, 2400, 3600]}
    >
      {(step) => {
        const layout = LAYOUTS[Math.min(step, 2)];
        const all = step === 3;
        return (
          <>
            <Chip x={240} y={22} text="pick up the can" tone="language" size={14} mono={false} />
            <rect x={44} y={46} width={392} height={226} rx={14} fill="none" className="t-faint a-stroke" strokeWidth={1.5} strokeDasharray="5 5" />

            {MORE_CANS.map(([x, y], i) => (
              <TopObject key={`can-${i}`} kind="can" x={x} y={y} tone="action" ghost opacity={all ? 0.8 : 0} delay={i * 40} />
            ))}
            {(Object.keys(layout) as TopKind[]).map((kind) => (
              <TopObject key={kind} kind={kind} x={layout[kind][0]} y={layout[kind][1]} tone={kind === "can" ? "action" : "muted"} opacity={all && kind !== "can" ? 0 : 1} />
            ))}
            {CLOSES.map(([x, y], i) => {
              const shown = all || i <= step;
              const current = !all && i === step;
              return <CloseMark key={i} x={x} y={y} tone={current ? "failure" : "muted"} opacity={shown ? 1 : 0} delay={all ? i * 40 : 300} />;
            })}
            <Label x={240} y={258} tone="failure" size={14} weight={700} opacity={all ? 1 : 0}>
              the hand closed here, whatever the scene
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
