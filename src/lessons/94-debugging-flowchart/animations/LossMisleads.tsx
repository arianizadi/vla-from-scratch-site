"use client";

import { AnimationFrame, Label, type Tone } from "@/animations";

/**
 * Two policies on the one-cube task (from the chapter): A ended training with
 * an error of 0.040 and succeeded 2 times in 50; B ended at 0.058 and
 * succeeded 37 times in 50.
 */
const BASE = 222;
const MAX = 150;
const PANELS = [
  {
    name: "training loss",
    hint: "lower looks better",
    x: 128,
    bars: [
      { who: "A", value: 0.04, text: "0.040" },
      { who: "B", value: 0.058, text: "0.058" },
    ],
    top: 0.06,
  },
  {
    name: "successes on the robot",
    hint: "out of 50 tries",
    x: 352,
    bars: [
      { who: "A", value: 2, text: "2" },
      { who: "B", value: 37, text: "37" },
    ],
    top: 50,
  },
];

function Bar({ x, height, tone, shown, delay }: { x: number; height: number; tone: Tone; shown: boolean; delay: number }) {
  return (
    <g
      className={`a-t t-${tone}`}
      style={{ transform: `translate(${x - 22}px, ${BASE}px) scale(1, ${shown ? -Math.max(0.01, height / MAX) : -0.01})`, transitionDelay: `${delay}ms` }}
    >
      <rect className="a-fill" x={0} y={0} width={44} height={MAX} rx={4} />
    </g>
  );
}

export function LossMisleads() {
  return (
    <AnimationFrame
      title="A score that points the wrong way"
      description="Two policies on the same one-cube task. Policy A ended training with the lower error, 0.040 against 0.058 for policy B, so by that score A looks better. On the robot, A succeeded 2 times in 50 and B 37 times in 50. The training loss pointed the wrong way, so it cannot tell you what to fix."
      steps={[
        "Two policies finish training. A ends with the lower error.",
        "By that score, A looks like the better one.",
        "On the robot: A succeeds 2 times in 50. B succeeds 37 times.",
        "The training loss pointed the wrong way. It can’t tell you what to fix.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {PANELS.map((panel, p) => {
            const shown = p === 0 ? true : step >= 2;
            return (
              <g key={panel.name}>
                <Label x={panel.x} y={26} tone="ink" size={15} weight={700}>
                  {panel.name}
                </Label>
                <Label x={panel.x} y={46} tone="muted" size={13}>
                  {panel.hint}
                </Label>
                <line x1={panel.x - 90} y1={BASE} x2={panel.x + 90} y2={BASE} className="t-faint a-stroke" strokeWidth={1.5} />
                {panel.bars.map((bar, b) => {
                  const bx = panel.x + (b === 0 ? -40 : 40);
                  const h = (bar.value / panel.top) * MAX;
                  const good = p === 1 && b === 1;
                  const tone: Tone = p === 0 ? (b === 0 && step === 1 ? "accent" : "muted") : good ? "success" : "failure";
                  return (
                    <g key={bar.who}>
                      <Bar x={bx} height={h} tone={tone} shown={shown} delay={b * 120} />
                      <Label x={bx} y={BASE - h - 14} tone="ink" size={14} weight={700} mono opacity={shown ? 1 : 0} delay={300 + b * 120}>
                        {bar.text}
                      </Label>
                      <Label x={bx} y={BASE + 20} tone="ink" size={15} weight={700}>
                        {bar.who}
                      </Label>
                    </g>
                  );
                })}
              </g>
            );
          })}
          <rect x={48} y={60} width={80} height={194} rx={10} className="a-t t-mark a-stroke" fill="none" strokeWidth={3} style={{ opacity: step === 1 ? 1 : 0 }} />
          <Label x={240} y={262} tone="failure" size={14} weight={700} opacity={step === 3 ? 1 : 0}>
            lower error, far fewer successes
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
