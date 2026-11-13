"use client";

import { AnimationFrame, Arm, Box, Label, Path, Thing, reach, stagger } from "@/animations";

const TABLE = 250;
const BASE: [number, number] = [70, TABLE];
const LENGTHS: [number, number] = [140, 125];
const CUBE = 320;

const HOME = reach(BASE, [170, 140], LENGTHS);

/** Three slightly different reaches: the expert's speed and aim wobble a little each time. */
const PATHS = [
  `M170 140Q262 96 ${CUBE - 4} ${TABLE - 46}`,
  `M170 140Q286 118 ${CUBE + 3} ${TABLE - 46}`,
  `M170 140Q250 130 ${CUBE + 6} ${TABLE - 46}`,
];

export function ExpertPeeks() {
  return (
    <AnimationFrame
      title="A teacher that peeks"
      description="The demonstrations come from a scripted expert, a small hand-written program. It reads the cube's exact position from the simulator, which the robot being trained never gets: the robot only gets camera pictures. Small random changes in speed and aim make every demonstration a little different."
      steps={[
        "The teacher is a scripted expert: a small program, not a person.",
        "It peeks: it reads the cube's exact position from the simulator.",
        "The robot it teaches will only ever get the camera pictures.",
        "Small random wobbles in speed and aim make every run a little different.",
      ]}
      size={[480, 290]}
    >
      {(step) => (
        <>
          <Box x={110} y={40} w={156} h={44} label="scripted expert" sub="a small program" tone="ink" active={step === 0} />

          <Path d={`M188 40H${CUBE}V${TABLE - 40}`} tone="accent" width={2} dashed drawn={step >= 1} />
          <circle className="a-t t-accent a-stroke" cx={CUBE} cy={TABLE - 15} r={24} fill="none" strokeWidth={2} style={{ opacity: step >= 1 ? 1 : 0 }} />
          <Label x={CUBE + 8} y={26} tone="accent" size={14} weight={700} anchor="start" opacity={step >= 1 ? 1 : 0}>
            exact position
          </Label>

          <rect className="a-t t-vision a-fill-soft a-stroke" x={364} y={86} width={92} height={60} rx={6} strokeWidth={1.5} style={{ opacity: step >= 2 ? 1 : 0 }} />
          <rect className="a-t t-action a-fill" x={398} y={118} width={12} height={12} rx={2} style={{ opacity: step >= 2 ? 1 : 0 }} />
          <circle className="a-t t-muted a-fill" cx={430} cy={124} r={5} style={{ opacity: step >= 2 ? 1 : 0 }} />
          <Label x={410} y={164} tone="vision" size={13} opacity={step >= 2 ? 1 : 0}>
            the robot gets this
          </Label>

          {PATHS.map((d, index) => (
            <Path key={index} d={d} tone="action" width={1.5} dashed drawn={step >= 3} delay={stagger(index, 200)} />
          ))}

          <Path d={`M24 ${TABLE}H456`} tone="faint" width={2} />
          <Thing kind="cube" x={CUBE} y={TABLE} tone="action" />
          <Thing kind="can" x={410} y={TABLE} tone="muted" />
          <Arm base={BASE} lengths={LENGTHS} angles={HOME} />
        </>
      )}
    </AnimationFrame>
  );
}
