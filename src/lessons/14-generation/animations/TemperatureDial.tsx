"use client";

import { AnimationFrame, Dot, Label, stagger } from "@/animations";
import { WORDS, chances } from "./chances";

/** One state per step: the chances, the dial position (0 cool .. 1 hot) and its name. */
const STATES = [
  { p: chances(1), dial: 0.5, name: "temperature 1" },
  { p: chances(0.5), dial: 0.15, name: "temperature 0.5: cooler" },
  { p: chances(2), dial: 0.85, name: "temperature 2: hotter" },
  { p: chances(1, 0.9), dial: 0.5, name: "temperature 1, tail cut" },
];

const ROW_Y = (index: number) => 72 + index * 36;
const BAR_LEFT = 110;
const BAR_SCALE = 280;
const DIAL_LEFT = 110;
const DIAL_W = 260;
const DIAL_Y = 234;

export function TemperatureDial() {
  return (
    <AnimationFrame
      title="The boldness dial"
      description="The chances for red, green, blue and yellow start at 0.64, 0.24, 0.09 and 0.03. At temperature 0.5 red takes 0.87 and yellow almost nothing. At temperature 2 they flatten to 0.46, 0.28, 0.17 and 0.10. Cutting the tail drops yellow and shares its chance among the other three."
      steps={[
        "The model's own chances, at temperature 1 (the four-word example).",
        "Turn the dial down: the favourite takes almost everything.",
        "Turn it up: the chances even out, and long shots get a real chance.",
        "Or cut the tail: drop the unlikeliest word and share its chance among the rest.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const state = STATES[step];
        return (
          <>
            <Label key={`name-${step}`} x={240} y={28} tone="ink" size={16} weight={700} enter>
              {state.name}
            </Label>

            {WORDS.map((word, index) => {
              const p = state.p[index];
              const cut = step === 3 && p === 0;
              return (
                <g key={word}>
                  <Label x={BAR_LEFT - 10} y={ROW_Y(index)} tone={cut ? "faint" : "ink"} size={14} anchor="end" mono>
                    {word}
                  </Label>
                  <rect
                    x={BAR_LEFT}
                    y={ROW_Y(index) - 11}
                    width={BAR_SCALE}
                    height={22}
                    rx={4}
                    className="a-t t-faint a-fill"
                    style={{ fillOpacity: 0.12 }}
                  />
                  <rect
                    x={BAR_LEFT}
                    y={ROW_Y(index) - 11}
                    width={BAR_SCALE}
                    height={22}
                    rx={4}
                    className={`a-t ${index === 0 ? "t-accent" : "t-language"} a-fill bar-grow-x`}
                    style={{
                      fillOpacity: index === 0 ? 1 : 0.5,
                      transform: `scaleX(${Math.max(0.006, p)})`,
                      transitionDelay: `${stagger(index)}ms`,
                    }}
                  />
                  <Label x={BAR_LEFT + BAR_SCALE + 12} y={ROW_Y(index)} tone={cut ? "failure" : "muted"} size={14} anchor="start" mono weight={cut ? 700 : 400}>
                    {cut ? "cut" : (Math.round(p * 100 + 1e-6) / 100).toFixed(2)}
                  </Label>
                </g>
              );
            })}

            <Label x={DIAL_LEFT - 12} y={DIAL_Y} tone="faint" size={14} anchor="end">
              cooler
            </Label>
            <Label x={DIAL_LEFT + DIAL_W + 12} y={DIAL_Y} tone="faint" size={14} anchor="start">
              hotter
            </Label>
            <rect x={DIAL_LEFT} y={DIAL_Y - 3} width={DIAL_W} height={6} rx={3} className="t-faint a-fill" style={{ fillOpacity: 0.35 }} />
            <Dot x={DIAL_LEFT + state.dial * DIAL_W} y={DIAL_Y} r={10} tone="accent" />
          </>
        );
      }}
    </AnimationFrame>
  );
}
