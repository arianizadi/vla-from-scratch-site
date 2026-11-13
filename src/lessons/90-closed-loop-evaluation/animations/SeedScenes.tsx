"use client";

import { AnimationFrame, Chip, Label, Path, Thing, stagger, type ThingKind } from "@/animations";

const KINDS: ThingKind[] = ["cube", "can", "nut"];
const CARD_X = [88, 240, 392];
const CARD_W = 132;
const CARD_H = 78;

/**
 * Illustrative scenes, one per seed: the order of the objects, a small shift of
 * each, and which one is named. Fixed, so a seed always draws the same scene.
 */
const SCENES: Record<number, { order: [number, number, number]; shift: [number, number, number]; named: number }> = {
  0: { order: [0, 1, 2], shift: [-4, 3, 0], named: 2 },
  1: { order: [2, 0, 1], shift: [5, -6, 2], named: 0 },
  2: { order: [1, 2, 0], shift: [0, 4, -5], named: 1 },
  1_000_000: { order: [1, 0, 2], shift: [-6, 0, 5], named: 1 },
  1_000_001: { order: [2, 1, 0], shift: [4, -3, -2], named: 2 },
  1_000_002: { order: [0, 2, 1], shift: [2, 6, -4], named: 0 },
};

function scene(seed: number): { kind: ThingKind; x: number; named: boolean }[] {
  const { order, shift, named } = SCENES[seed];
  return order.map((k, i) => ({ kind: KINDS[k], x: [-42, 0, 42][i] + shift[i], named: i === named }));
}

const ROWS = [
  { name: "training scenes", y: 104, seeds: [0, 1, 2], text: ["0", "1", "2"], from: 0 },
  { name: "test scenes", y: 232, seeds: [1_000_000, 1_000_001, 1_000_002], text: ["1,000,000", "1,000,001", "1,000,002"], from: 2 },
];

export function SeedScenes() {
  return (
    <AnimationFrame
      title="One number, one scene"
      description="Each scene, its objects, their places and which one the instruction names, is built from one number, the seed. Training scenes use seeds counted up from zero. Test scenes start at one million, so none of them was ever trained on."
      steps={[
        "One number, a seed, builds a whole scene: the objects, their places, and which one is named.",
        "Training scenes use seeds counted up from zero.",
        "Test scenes start at one million. The robot has never seen any of them.",
      ]}
      size={[480, 300]}
      hold={[2800, 2400, 3600]}
    >
      {(step) => (
        <>
          {ROWS.map((row) => (
            <g key={row.name}>
              <Label x={20} y={row.y - 74} tone={row.from === 2 ? "accent" : "ink"} size={15} weight={700} anchor="start" opacity={step >= row.from ? 1 : 0}>
                {row.name}
              </Label>
              {row.seeds.map((seed, i) => {
                const on = row.from === 0 ? (i === 0 ? true : step >= 1) : step >= 2;
                return (
                  <g key={seed}>
                    <rect
                      className={`a-t ${row.from === 2 ? "t-accent" : "t-faint"} a-fill-soft`}
                      x={CARD_X[i] - CARD_W / 2}
                      y={row.y - CARD_H + 10}
                      width={CARD_W}
                      height={CARD_H}
                      rx={10}
                      style={{ opacity: on ? 1 : 0, transitionDelay: `${stagger(i, 90)}ms` }}
                    />
                    <Path d={`M${CARD_X[i] - 56} ${row.y - 8}H${CARD_X[i] + 56}`} tone="faint" width={1.5} opacity={on ? 1 : 0} />
                    {scene(seed).map((thing) => (
                      <Thing
                        key={thing.kind}
                        kind={thing.kind}
                        x={CARD_X[i] + thing.x}
                        y={row.y - 8}
                        size={20}
                        tone={thing.named ? "action" : "muted"}
                        active={thing.named}
                        opacity={on ? 1 : 0}
                        delay={stagger(i, 90)}
                      />
                    ))}
                    <Chip x={CARD_X[i]} y={row.y + 20} text={row.text[i]} tone="ink" variant="outline" size={13} opacity={on ? 1 : 0} delay={stagger(i, 90)} />
                  </g>
                );
              })}
            </g>
          ))}
        </>
      )}
    </AnimationFrame>
  );
}
