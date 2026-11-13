"use client";

import { AnimationFrame, Bracket, Label, Move, stagger } from "@/animations";

/* One run as a row of moments. A window is the picture at one moment plus
   the next 15 moves; every moment starts one. The windows of all runs are
   shuffled into one deck of practice cards. */

const MOMENTS = 22;
const CELL = 16;
const GAP = 3;
const LEFT = 240 - (MOMENTS * CELL + (MOMENTS - 1) * GAP) / 2;
const ROW_Y = 78;
const cellX = (index: number) => LEFT + index * (CELL + GAP);

/** Where the window starts in each step (-1: no window). */
const START = [-1, 0, 3, 3, 3];

/** The cards: six windows of this run, then mixed with cards from other runs. */
/** The shuffled deck, bottom to top: this run's six cards between five from other runs. */
const DECK = [
  { mine: false, index: 0 },
  { mine: true, index: 2 },
  { mine: true, index: 0 },
  { mine: false, index: 1 },
  { mine: true, index: 5 },
  { mine: false, index: 2 },
  { mine: true, index: 1 },
  { mine: false, index: 3 },
  { mine: true, index: 4 },
  { mine: false, index: 4 },
  { mine: true, index: 3 },
];
const PILE = { x: 240, y: 214 };

function Card({ tone }: { tone: "action" | "muted" }) {
  return (
    <>
      <rect className="t-ink a-fill-surface a-stroke" x={-26} y={-34} width={52} height={68} rx={6} strokeWidth={1.5} />
      <rect className="t-vision a-fill-soft" x={-18} y={-26} width={36} height={24} rx={3} />
      <rect className={`t-${tone} a-fill`} x={-18} y={6} width={36} height={6} rx={2} />
      <rect className={`t-${tone} a-fill`} x={-18} y={16} width={26} height={6} rx={2} opacity={0.6} />
    </>
  );
}

export function SlidingWindow() {
  return (
    <AnimationFrame
      title="One run, many practice cards"
      description="A recorded run is a row of moments. A window, one practice card, holds the picture at one moment and the next 15 moves. Sliding one moment along gives the next window, so every moment starts one. The cards from all runs are shuffled together before training."
      steps={[
        "One recorded run: a row of moments.",
        "A window: the picture at one moment, plus the next 15 moves.",
        "Slide along and you get another. Every moment starts one.",
        "So one run of about 66 moments makes about 66 practice cards…",
        "…shuffled with the cards from every other run.",
      ]}
      size={[480, 300]}
    >
      {(step) => {
        const start = START[step];
        return (
          <>
            <Label x={LEFT} y={ROW_Y - 40} tone="muted" size={14} anchor="start">
              one run, moment by moment
            </Label>
            {Array.from({ length: MOMENTS }, (_, index) => {
              const now = index === start;
              const next = start >= 0 && index > start && index <= start + 15;
              const tone = now ? "t-vision" : next ? "t-action" : "t-faint";
              return (
                <rect
                  key={index}
                  className={`a-t ${tone} ${now || next ? "a-fill" : "a-fill-soft"}`}
                  x={cellX(index)}
                  y={ROW_Y - CELL / 2}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  style={{ transitionDelay: `${stagger(index, 15)}ms`, opacity: next ? 0.75 : 1 }}
                />
              );
            })}
            <Bracket
              x1={cellX(Math.max(0, start))}
              x2={cellX(Math.max(0, start)) + CELL}
              y={ROW_Y + 22}
              tone="vision"
              opacity={start >= 0 && step <= 2 ? 1 : 0}
            />
            <Bracket
              x1={cellX(Math.max(0, start) + 1)}
              x2={cellX(Math.max(0, start) + 15) + CELL}
              y={ROW_Y + 22}
              tone="action"
              opacity={start >= 0 && step <= 2 ? 1 : 0}
            />
            <Label x={cellX(Math.max(0, start)) + CELL / 2} y={ROW_Y + 42} tone="vision" size={14} weight={700} opacity={start >= 0 && step <= 2 ? 1 : 0}>
              now
            </Label>
            <Label x={(cellX(Math.max(0, start) + 1) + cellX(Math.max(0, start) + 15) + CELL) / 2} y={ROW_Y + 42} tone="action" size={14} weight={700} opacity={start >= 0 && step <= 2 ? 1 : 0}>
              the next 15 moves
            </Label>

            {DECK.map((card, p) => {
              const pile = { x: PILE.x + (p - (DECK.length - 1) / 2) * 15, y: PILE.y + (p % 3) * 3 - 3 };
              const before = card.mine ? { x: 80 + card.index * 64, y: PILE.y } : { x: 520, y: PILE.y };
              return (
                <Move
                  key={`${card.mine ? "mine" : "other"}-${card.index}`}
                  x={step >= 4 ? pile.x : before.x}
                  y={step >= 4 ? pile.y : before.y}
                  rotate={step >= 4 ? (p - (DECK.length - 1) / 2) * 4 : 0}
                  opacity={card.mine ? (step >= 3 ? 1 : 0) : step >= 4 ? 1 : 0}
                  delay={stagger(p, 50)}
                >
                  <Card tone={card.mine ? "action" : "muted"} />
                </Move>
              );
            })}
            <Label x={240} y={282} tone="muted" size={14} opacity={step >= 4 ? 1 : 0}>
              this run&apos;s cards, mixed with all the others
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
