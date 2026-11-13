"use client";

import { AnimationFrame, Arrow, Bar, Label, Path, stagger } from "@/animations";

/** The single-cube results of two learners (lab notebook, pick_cube on machine A, 200 demonstrations). */
const LEARNERS = [
  { id: "A", what: "one summary", error: 0.04, errorText: "0.040", lifted: 2 },
  { id: "B", what: "many patches", error: 0.091, errorText: "0.091", lifted: 15 },
];
const OF = 50;

const PICTURE = Array.from({ length: 16 }, (_, i) => [(i % 4) * 9, Math.floor(i / 4) * 9]);
const BASE = 248;
const BAR_H = 80;

function Picture({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 17} ${y - 17})`}>
      {PICTURE.map(([px, py], i) => (
        <rect key={i} x={px} y={py} width={8} height={8} rx={1.5} className="t-vision a-fill" style={{ fillOpacity: 0.35 + ((i * 7) % 5) * 0.13 }} />
      ))}
    </g>
  );
}

export function GradeVsRobot() {
  return (
    <AnimationFrame
      title="A good grade, a bad robot"
      description="Two learners copy the same demonstrations. Learner A squeezes each camera picture into one summary; learner B keeps it as many small patches. In training, A matches the teacher's moves more closely: a training error of 0.040 against 0.091. On the robot, with the cube in 50 new places, A lifts it twice and B 15 times."
      steps={[
        "Two learners. A squeezes each camera picture into one summary; B keeps many small patches.",
        "Training error: how far their guesses are from the teacher's moves. A gets the better grade.",
        "The real test: drive the robot with the cube in 50 new places. B lifts it far more often.",
        "A better grade in training did not make a better robot.",
      ]}
      size={[480, 296]}
      hold={[2800, 2800, 2800, 3600]}
    >
      {(step) => (
        <>
          {LEARNERS.map((learner, i) => {
            const cx = i === 0 ? 120 : 360;
            return (
              <g key={learner.id}>
                <Label x={cx - 70} y={26} tone="ink" size={15} weight={700} anchor="start">
                  {`Learner ${learner.id}`}
                </Label>
                <Picture x={cx - 52} y={66} />
                <Arrow from={[cx - 28, 66]} to={[cx + 6, 66]} tone="muted" width={1.5} />
                {i === 0 ? (
                  <rect x={cx + 16} y={57} width={18} height={18} rx={3} className="t-vision a-fill" />
                ) : (
                  <Picture x={cx + 34} y={66} />
                )}
                <Label x={cx} y={104} tone="muted" size={13}>
                  {learner.what}
                </Label>
              </g>
            );
          })}
          <Path d="M240 16V116" tone="faint" width={1.5} dashed />

          <Label x={120} y={140} tone="muted" size={13} opacity={step >= 1 ? 1 : 0}>
            training error (lower looks better)
          </Label>
          <Label x={360} y={140} tone="muted" size={13} opacity={step >= 2 ? 1 : 0}>
            {`cube lifted, out of ${OF}`}
          </Label>
          <Path d={`M60 ${BASE}H180M300 ${BASE}H420`} tone="faint" width={1.5} />
          {LEARNERS.map((learner, i) => (
            <g key={`bars-${learner.id}`}>
              <Bar
                x={90 + i * 60}
                y={BASE}
                height={BAR_H}
                value={step >= 1 ? learner.error / 0.1 : 0}
                width={30}
                tone={i === 0 && step >= 1 ? "success" : "muted"}
                label={step >= 1 ? learner.errorText : undefined}
                name={learner.id}
                delay={stagger(i, 120)}
              />
              <Bar
                x={330 + i * 60}
                y={BASE}
                height={BAR_H}
                value={step >= 2 ? learner.lifted / OF : 0}
                width={30}
                tone={i === 1 && step >= 2 ? "success" : "muted"}
                label={step >= 2 ? `${learner.lifted}` : undefined}
                name={learner.id}
                delay={stagger(i, 120)}
              />
            </g>
          ))}
          <Label x={120} y={BASE + 36} tone="success" size={13} weight={700} opacity={step >= 1 ? 1 : 0}>
            A: better grade
          </Label>
          <Label x={360} y={BASE + 36} tone="success" size={13} weight={700} opacity={step >= 2 ? 1 : 0}>
            B: better robot
          </Label>
          <rect x={20} y={124} width={440} height={164} rx={12} fill="none" className="a-t t-mark a-stroke" strokeWidth={3} style={{ opacity: step === 3 ? 1 : 0 }} />
        </>
      )}
    </AnimationFrame>
  );
}
