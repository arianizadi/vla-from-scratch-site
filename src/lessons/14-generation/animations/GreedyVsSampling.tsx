"use client";

import { AnimationFrame, Chip, Label, stagger } from "@/animations";
import { WORDS, chances } from "./chances";

const P = chances(1);
const ROW_Y = (index: number) => 36 + index * 30;
const BAR_LEFT = 104;
const BAR_SCALE = 300;

/** Five picks each. The sampled ones are a fixed, plausible run of draws. */
const GREEDY = ["red", "red", "red", "red", "red"];
const SAMPLED = ["red", "green", "red", "red", "blue"];
const PICK_X = (index: number) => 150 + index * 68;
const GREEDY_Y = 186;
const SAMPLED_Y = 240;

export function GreedyVsSampling() {
  return (
    <AnimationFrame
      title="Take the favourite, or roll a die"
      description="Four next words have the chances 0.64 for red, 0.24 for green, 0.09 for blue and 0.03 for yellow. Greedy picking takes red every time. Sampling draws in proportion to the chances: red most often, but green and blue sometimes too."
      steps={[
        "Chances for the next word (a made-up example of four).",
        "Greedy picking takes the top word every time: same prompt, same text.",
        "Sampling rolls a die weighted by the chances: red most often, but not always.",
      ]}
      size={[480, 270]}
    >
      {(step) => (
        <>
          {WORDS.map((word, index) => (
            <g key={word}>
              <Label x={BAR_LEFT - 10} y={ROW_Y(index)} tone="ink" size={14} anchor="end" mono>
                {word}
              </Label>
              <rect
                x={BAR_LEFT}
                y={ROW_Y(index) - 10}
                width={Math.max(2, P[index] * BAR_SCALE)}
                height={20}
                rx={4}
                className={`a-t ${index === 0 ? "t-accent" : "t-language"} a-fill`}
                style={{ fillOpacity: index === 0 ? 1 : 0.45 }}
              />
              <Label x={BAR_LEFT + P[index] * BAR_SCALE + 8} y={ROW_Y(index)} tone="muted" size={14} anchor="start" mono>
                {P[index].toFixed(2)}
              </Label>
            </g>
          ))}

          <Label x={24} y={GREEDY_Y} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 1 ? 1 : 0}>
            greedy
          </Label>
          {GREEDY.map((word, index) => (
            <Chip
              key={`g-${index}`}
              x={PICK_X(index)}
              y={GREEDY_Y}
              text={word}
              tone="accent"
              size={14}
              width={60}
              opacity={step >= 1 ? 1 : 0}
              delay={stagger(index, 120)}
            />
          ))}

          <Label x={24} y={SAMPLED_Y} tone="ink" size={14} anchor="start" weight={700} opacity={step >= 2 ? 1 : 0}>
            sampling
          </Label>
          {SAMPLED.map((word, index) => (
            <Chip
              key={`s-${index}`}
              x={PICK_X(index)}
              y={SAMPLED_Y}
              text={word}
              tone={word === "red" ? "accent" : "language"}
              size={14}
              width={60}
              opacity={step >= 2 ? 1 : 0}
              delay={stagger(index, 120)}
            />
          ))}
        </>
      )}
    </AnimationFrame>
  );
}
