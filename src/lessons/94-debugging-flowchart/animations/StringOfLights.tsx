"use client";

import { AnimationFrame, Arrow, Box, Label, stagger } from "@/animations";

/** The chain a policy sits at the end of: down the left, up the right. */
const LINKS = [
  { name: "task", x: 112, y: 46 },
  { name: "expert", x: 112, y: 102 },
  { name: "examples", x: 112, y: 158 },
  { name: "data prep", x: 112, y: 214 },
  { name: "training", x: 290, y: 214 },
  { name: "serving", x: 290, y: 158 },
  { name: "robot", x: 290, y: 102 },
  { name: "success check", x: 290, y: 46 },
];
const W = 140;
const H = 36;
/** The broken link in each step: none, data prep, training, serving; the last step asks which. */
const BREAK = [-1, 3, 4, 5, -2];
const BULB: [number, number] = [428, 46];

export function StringOfLights() {
  return (
    <AnimationFrame
      title="One dark bulb at the end"
      description="A robot policy sits at the end of a chain: task, expert, examples, data preparation, training, serving, the robot and the success check. When every link works, the signal reaches the end and the score lights up. Break the data preparation, stop training too early or break the serving code, and the score goes dark in the same way each time, so the score alone never says which link broke."
      steps={[
        "Every link works: the signal reaches the end and the score lights up.",
        "Break the data prep: the score drops to almost zero.",
        "Stop training too early instead: the same almost-zero.",
        "Break the serving code: the same almost-zero again.",
        "A dark score says something broke. It never says which link.",
      ]}
      size={[480, 260]}
    >
      {(step) => {
        const broken = BREAK[step];
        const asking = broken === -2;
        const ok = broken === -1;
        return (
          <>
            {LINKS.slice(1).map((link, index) => {
              const from = LINKS[index];
              const across = from.x !== link.x;
              const down = link.y > from.y;
              return (
                <Arrow
                  key={`arrow-${link.name}`}
                  from={across ? [from.x + W / 2 + 4, from.y] : [from.x, from.y + (down ? H / 2 + 3 : -H / 2 - 3)]}
                  to={across ? [link.x - W / 2 - 4, link.y] : [link.x, link.y + (down ? -H / 2 - 3 : H / 2 + 3)]}
                  tone="faint"
                  width={1.5}
                />
              );
            })}
            <Arrow from={[LINKS[7].x + W / 2 + 4, 46]} to={[BULB[0] - 24, 46]} tone="faint" width={1.5} />

            {LINKS.map((link, index) => {
              const lit = ok || (!asking && index < broken);
              const isBroken = index === broken;
              const suspect = asking && index >= 3 && index <= 5;
              return (
                <g key={link.name}>
                  <Box
                    x={link.x}
                    y={link.y}
                    w={W}
                    h={H}
                    label={link.name}
                    tone={isBroken ? "failure" : lit ? "accent" : suspect ? "ink" : "faint"}
                    filled={isBroken || lit}
                    active={suspect}
                    delay={lit ? stagger(index, 90) : 0}
                  />
                  <Label
                    x={link.x < 200 ? link.x - W / 2 - 14 : link.x + W / 2 + 14}
                    y={link.y}
                    tone={suspect ? "ink" : "failure"}
                    size={18}
                    weight={700}
                    anchor={link.x < 200 ? "end" : "start"}
                    opacity={isBroken || suspect ? 1 : 0}
                  >
                    {suspect ? "?" : "✕"}
                  </Label>
                </g>
              );
            })}

            {/* The score: a bulb that lights only when every link works. */}
            <g className={`a-t ${ok ? "t-mark" : "t-faint"}`}>
              <circle cx={BULB[0]} cy={BULB[1]} r={20} className="a-fill a-stroke" strokeWidth={2} style={{ fillOpacity: ok ? 1 : 0.25, transitionDelay: ok ? "700ms" : "0ms" }} />
            </g>
            <Label x={BULB[0]} y={BULB[1] + 38} tone="muted" size={14}>
              score
            </Label>
            <Label x={BULB[0]} y={BULB[1] + 60} tone="failure" size={16} weight={700} opacity={ok ? 0 : 1}>
              ≈ 0
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
