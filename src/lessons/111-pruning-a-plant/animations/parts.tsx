/**
 * Shared drawing for this lesson's animations: the potted plant on its turntable, seen from
 * above. Not an animation itself (no "use client" header), so the registry leaves it out; the
 * animations that import it carry it into their own chunks.
 */

import { Move, type Tone } from "@/animations";

const round1 = (value: number) => Math.round(value * 10) / 10;

/** A point at `deg` degrees (SVG: 0 points right, 90 points down, toward the arm) and radius `r`. */
export function polar(deg: number, r: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [round1(Math.cos(a) * r), round1(Math.sin(a) * r)];
}

export interface TopShoot {
  /** Where the shoot points on the stand before any turn, degrees (90 = toward the arm). */
  angle: number;
  /** 0 once it is cut off. Default 1. */
  opacity?: number;
  /** Wait before fading, ms. */
  delay?: number;
  tone?: Tone;
}

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

/**
 * The plant from above: the turntable (with tick marks so a turn shows), the pot, the side shoots
 * on it, and the flower in the middle, which does not visibly turn.
 */
export function PlantTop({ x, y, r, turn = 0, shoots }: { x: number; y: number; r: number; turn?: number; shoots: TopShoot[] }) {
  return (
    <>
      {/* rotate 0 is written as 0.01, so the transform keeps the same shape and every turn animates */}
      <Move x={x} y={y} rotate={turn === 0 ? 0.01 : turn}>
        <circle r={r} className="t-muted a-fill-soft a-stroke" strokeWidth={2} />
        {TICKS.map((deg) => {
          const [x1, y1] = polar(deg, r - 11);
          const [x2, y2] = polar(deg, r - 4);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} className="t-faint a-stroke" strokeWidth={2} />;
        })}
        <circle r={round1(r * 0.36)} className="t-muted a-fill-surface a-stroke" strokeWidth={2} />
        {shoots.map((shoot, i) => {
          const [x1, y1] = polar(shoot.angle, r * 0.24);
          const [x2, y2] = polar(shoot.angle, r * 0.8);
          return (
            <g
              key={i}
              className={`a-t t-${shoot.tone ?? "accent"}`}
              style={{ opacity: shoot.opacity ?? 1, transitionDelay: shoot.delay ? `${shoot.delay}ms` : undefined }}
            >
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="a-stroke" strokeWidth={4} strokeLinecap="round" />
              <circle cx={x2} cy={y2} r={7} className="a-fill-soft a-stroke" strokeWidth={1.5} />
            </g>
          );
        })}
      </Move>
      <circle cx={x} cy={y} r={round1(r * 0.16)} className="t-mark a-fill-soft a-stroke" strokeWidth={2} />
      <circle cx={x} cy={y} r={round1(r * 0.06)} className="t-mark a-fill" />
    </>
  );
}

/** A ring around something, unfilled so what it marks stays visible. Moves and fades with the frame's transition. */
export function Ring({ x, y, r, tone, opacity = 1, width = 2.5 }: { x: number; y: number; r: number; tone: Tone; opacity?: number; width?: number }) {
  return (
    <g className={`a-t t-${tone}`} style={{ transform: `translate(${x}px, ${y}px)`, opacity }}>
      <circle r={r} fill="none" className="a-stroke" strokeWidth={width} />
    </g>
  );
}
