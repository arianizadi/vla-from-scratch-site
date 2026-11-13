"use client";

import { AnimationFrame, Dot, Label } from "@/animations";

/** One layout seen from above, run three times; each run names a different object. */
const COLUMNS = [90, 240, 390];
const NAMES = ["cube", "can", "nut"];
/** The three objects inside a panel, relative to its centre. */
const SPOTS: [number, number][] = [
  [-36, -12],
  [8, 18],
  [40, -16],
];
const ROWS = [
  { y: 104, title: "listens to the words", tone: "success" as const, at: 1 },
  { y: 220, title: "ignores the words", tone: "failure" as const, at: 2 },
];
const PANEL_W = 130;
const PANEL_H = 70;
/** Where the ignoring policy closes: the same spot in every run. */
const IGNORED: [number, number] = [-30, -6];

function Shape({ index, x, y, named }: { index: number; x: number; y: number; named: boolean }) {
  const cls = `${named ? "t-action" : "t-muted"} a-fill-soft a-stroke`;
  if (index === 1) return <circle cx={x} cy={y} r={9} className={cls} strokeWidth={1.5} />;
  if (index === 2) {
    const s = 10;
    return (
      <path
        d={`M${x - s} ${y}L${x - s / 2} ${y - s * 0.87}H${x + s / 2}L${x + s} ${y}L${x + s / 2} ${y + s * 0.87}H${x - s / 2}Z`}
        className={cls}
        strokeWidth={1.5}
      />
    );
  }
  return <rect x={x - 9} y={y - 9} width={18} height={18} rx={3} className={cls} strokeWidth={1.5} />;
}

export function SameTable() {
  return (
    <AnimationFrame
      title="Same table, another sentence"
      description="One table layout, seen from above, is run three times, naming the cube, then the can, then the nut. A policy that listens closes its gripper at three different objects. A policy that ignores the words closes at the same place every time. With three objects, ignoring the words still hits the named one about one time in three."
      steps={[
        "One table, run three times. Each run names a different object.",
        "A policy that listens closes at three different objects.",
        "A policy that ignores the words closes at the same place every time.",
        "It still hits the named object one time in three: that is chance, not listening.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {COLUMNS.map((cx, c) => (
            <Label key={cx} x={cx} y={22} tone="language" size={14} weight={700}>
              {`“pick up the ${NAMES[c]}”`}
            </Label>
          ))}
          {ROWS.map((row) => (
            <g key={row.title}>
              <Label x={16} y={row.y - PANEL_H / 2 - 14} tone="ink" size={14} anchor="start" weight={700} opacity={step >= row.at ? 1 : 0.4}>
                {row.title}
              </Label>
              {COLUMNS.map((cx, c) => {
                const listening = row.at === 1;
                const [dx, dy] = listening ? SPOTS[c] : IGNORED;
                const hit = listening || c === 0;
                return (
                  <g key={cx}>
                    <rect x={cx - PANEL_W / 2} y={row.y - PANEL_H / 2} width={PANEL_W} height={PANEL_H} rx={10} className="t-faint a-stroke" fill="none" strokeWidth={1.5} />
                    {SPOTS.map(([sx, sy], i) => (
                      <Shape key={i} index={i} x={cx + sx} y={row.y + sy} named={i === c} />
                    ))}
                    <Dot x={cx + dx} y={row.y + dy} r={6} tone="accent" opacity={step >= row.at ? 1 : 0} delay={c * 250} />
                    <Label
                      x={cx}
                      y={row.y + PANEL_H / 2 + 13}
                      tone={hit ? "success" : "failure"}
                      size={13}
                      weight={700}
                      opacity={step >= (listening ? 1 : 3) ? 1 : 0}
                      delay={c * 250 + 300}
                    >
                      {hit ? "✓ named" : "✗ other"}
                    </Label>
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
