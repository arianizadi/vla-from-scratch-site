"use client";

import { AnimationFrame, Label } from "@/animations";

const NAMES = ["cube", "can", "nut"];
/** Three different training scenes (left) and one scene repeated (right), seen from above. */
const SCENES: [number, number][][] = [
  [
    [-34, -8],
    [4, 10],
    [36, -6],
  ],
  [
    [-30, 10],
    [32, -8],
    [-2, -10],
  ],
  [
    [20, 10],
    [-36, -6],
    [8, -12],
  ],
];
const ROW_Y = [78, 148, 218];
const PANEL_W = 120;
const PANEL_H = 52;
const LEFT = 90;
const RIGHT = 330;

function Shape({ index, x, y, named }: { index: number; x: number; y: number; named: boolean }) {
  const cls = `${named ? "t-action" : "t-muted"} a-fill-soft a-stroke`;
  if (index === 1) return <circle cx={x} cy={y} r={8} className={cls} strokeWidth={1.5} />;
  if (index === 2) {
    const s = 9;
    return (
      <path
        d={`M${x - s} ${y}L${x - s / 2} ${y - s * 0.87}H${x + s / 2}L${x + s} ${y}L${x + s / 2} ${y + s * 0.87}H${x - s / 2}Z`}
        className={cls}
        strokeWidth={1.5}
      />
    );
  }
  return <rect x={x - 8} y={y - 8} width={16} height={16} rx={3} className={cls} strokeWidth={1.5} />;
}

function Scene({ cx, cy, spots, named, opacity }: { cx: number; cy: number; spots: [number, number][]; named: number; opacity: number }) {
  return (
    <g className="a-t" style={{ opacity }}>
      <rect x={cx - PANEL_W / 2} y={cy - PANEL_H / 2} width={PANEL_W} height={PANEL_H} rx={9} className="t-faint a-stroke" fill="none" strokeWidth={1.5} />
      {spots.map(([x, y], i) => (
        <Shape key={i} index={i} x={cx + x} y={cy + y} named={i === named} />
      ))}
      <circle cx={cx + spots[named][0]} cy={cy + spots[named][1]} r={14} className="t-mark a-stroke" fill="none" strokeWidth={2.5} />
      <text x={cx + PANEL_W / 2 + 10} y={cy} className="a-label t-language a-fill" fontSize={14} fontWeight={700} dominantBaseline="central">
        {NAMES[named]}
      </text>
    </g>
  );
}

export function EveryObjectNamed() {
  return (
    <AnimationFrame
      title="Make the words necessary"
      description="On the left, the usual demonstrations: three different scenes, each recorded once with one object named. A policy can succeed by memorising which object goes with which scene, without reading. On the right, one scene is recorded three times, naming each object in turn. The pictures are identical, so only the words tell the runs apart, and the policy has to read them."
      steps={[
        "Usual demonstrations: each scene is recorded once, with one object named.",
        "A policy can get by memorising scenes: “this layout means the can”. No reading needed.",
        "Instead, name every object of a scene in turn: the same picture, three sentences.",
        "Now only the words tell the runs apart. Our policy learned to listen sooner.",
      ]}
      size={[480, 282]}
    >
      {(step) => (
        <>
          <Label x={LEFT + 20} y={26} tone="ink" size={14} weight={700}>
            one sentence per scene
          </Label>
          {SCENES.map((spots, i) => (
            <Scene key={`l-${i}`} cx={LEFT} cy={ROW_Y[i]} spots={spots} named={(i + 1) % 3} opacity={1} />
          ))}
          <Label x={LEFT + 20} y={266} tone="failure" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
            memorising works
          </Label>

          <Label x={RIGHT + 20} y={26} tone="ink" size={14} weight={700} opacity={step >= 2 ? 1 : 0.35}>
            every object named
          </Label>
          {ROW_Y.map((y, i) => (
            <Scene key={`r-${i}`} cx={RIGHT} cy={y} spots={SCENES[0]} named={i} opacity={step >= 2 ? 1 : 0} />
          ))}
          <Label x={RIGHT + 20} y={266} tone="success" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            only reading works
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
