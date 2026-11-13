"use client";

import { AnimationFrame, Arm, Label, Path, Thing, reach } from "@/animations";

const BASE: [number, number] = [46, 262];
const LENGTHS: [number, number] = [170, 150];
const TABLE = 262;
const OLD = 240;
const NEW = 340;
const HOVER = 200;

const ABOVE_OLD = reach(BASE, [OLD, HOVER], LENGTHS);
const DOWN_OLD = reach(BASE, [OLD, TABLE - 4], LENGTHS);
const DOWN_NEW = reach(BASE, [NEW, TABLE - 4], LENGTHS);

const POSE = [ABOVE_OLD, DOWN_OLD, ABOVE_OLD, DOWN_NEW];
const OPEN = [1, 0, 1, 0];

export function NoRecovery() {
  return (
    <AnimationFrame
      title="Experts never show recovery"
      description="A clean demonstration reaches straight for the cube. When the cube is moved during the reach, a policy trained only on clean demonstrations closes its gripper where the cube used to be. Demonstrations in which the cube moves and the expert turns back are added. A policy trained on those turns back too and grasps the cube."
      steps={[
        "Clean demonstrations: the expert reaches straight for the cube, every time.",
        "Move the cube mid-reach. A policy trained only on clean runs closes on the old spot.",
        "Add demonstrations where the cube moves and the expert turns back.",
        "Now the policy has seen a recovery, and it turns back too.",
      ]}
      size={[480, 300]}
      hold={[2400, 2800, 2600, 3400]}
    >
      {(step) => {
        const moved = step >= 1;
        return (
          <>
            <Path d={`M0 ${TABLE}H480`} tone="faint" width={2} />
            <rect
              x={OLD - 15}
              y={TABLE - 30}
              width={30}
              height={30}
              rx={4}
              className="a-t t-muted a-stroke"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              style={{ opacity: moved ? 1 : 0 }}
            />
            <Thing kind="cube" x={moved ? NEW : OLD} y={TABLE} tone="action" active={step === 3} />

            <Path
              d={`M${OLD} ${HOVER - 46}Q${(OLD + NEW) / 2} ${HOVER - 96} ${NEW} ${HOVER - 46}`}
              tone="accent"
              width={2.5}
              dashed
              drawn={step === 2}
            />
            <Label x={(OLD + NEW) / 2 + 30} y={HOVER - 110} tone="accent" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
              a recovery demonstration
            </Label>

            <Arm base={BASE} lengths={LENGTHS} angles={POSE[step]} open={OPEN[step]} tone="ink" />

            <Label x={OLD} y={TABLE + 22} tone="failure" size={14} weight={700} opacity={step === 1 ? 1 : 0} delay={500}>
              closed on nothing
            </Label>
            <Label x={NEW} y={TABLE + 22} tone="success" size={14} weight={700} opacity={step === 3 ? 1 : 0} delay={600}>
              grasped
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
