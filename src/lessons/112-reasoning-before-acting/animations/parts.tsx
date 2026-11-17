/**
 * Shared drawing for this lesson's animations: the potted plant seen from the side (where height on
 * the stem reads at a glance) and from above (where turning reads at a glance), and a ring. Not an
 * animation itself (no "use client" header), so the registry leaves it out; the animations that
 * import it carry it into their own chunks.
 */

import { Move, type Tone } from "@/animations";

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Five petals around a centre: the flower, in plain ink tones (yellow is the highlighter, kept for "this one, now"). */
const PETALS = [-90, -18, 54, 126, 198];

function Flower({ x, y, size = 1, tone = "muted" }: { x: number; y: number; size?: number; tone?: Tone }) {
  return (
    <g>
      {PETALS.map((deg) => {
        const [px, py] = polar(deg, 6 * size);
        return <circle key={deg} cx={round1(x + px)} cy={round1(y + py)} r={round1(4.6 * size)} className={`t-${tone} a-fill-soft a-stroke`} strokeWidth={1.5} />;
      })}
      <circle cx={x} cy={y} r={round1(3 * size)} className="t-ink a-fill" />
    </g>
  );
}

export interface SideShoot {
  /** Where the shoot leaves the main stem, as a y coordinate. */
  y: number;
  /** 1 points right, -1 left. Default 1. */
  side?: 1 | -1;
  /** Length along the shoot. Default 46. */
  len?: number;
  tone?: Tone;
  /** 0 once it is cut off (its stub stays). Default 1. */
  opacity?: number;
  delay?: number;
}

/** The tip of a side shoot, where a ring or the jaws go. */
export function shootTip(x: number, shoot: SideShoot): [number, number] {
  const len = shoot.len ?? 46;
  const side = shoot.side ?? 1;
  return [round1(x + side * len * 0.9), round1(shoot.y - len * 0.42)];
}

/**
 * The plant from the side: pot, main stem, the flower on top, the side shoots at their heights.
 * `base` is the bottom of the pot, `top` the flower's centre.
 */
export function PlantSide({
  x,
  base,
  top,
  shoots,
  flowerTone = "muted",
  opacity = 1,
}: {
  x: number;
  base: number;
  top: number;
  shoots: SideShoot[];
  flowerTone?: Tone;
  opacity?: number;
}) {
  const rim = base - 26;
  return (
    <g className="a-t" style={{ opacity }}>
      <path
        d={`M${x - 22} ${rim}L${x + 22} ${rim}L${x + 16} ${base}L${x - 16} ${base}Z`}
        className="t-muted a-fill-soft a-stroke"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <line x1={x} y1={rim} x2={x} y2={top + 8} className="t-ink a-stroke" strokeWidth={3} strokeLinecap="round" />
      {shoots.map((shoot, i) => {
        const side = shoot.side ?? 1;
        const [tx, ty] = shootTip(x, shoot);
        return (
          <g key={i}>
            <line x1={x} y1={shoot.y} x2={round1(x + side * 7)} y2={round1(shoot.y - 3)} className="t-ink a-stroke" strokeWidth={3} strokeLinecap="round" />
            <g
              className={`a-t t-${shoot.tone ?? "ink"}`}
              style={{ opacity: shoot.opacity ?? 1, transitionDelay: shoot.delay ? `${shoot.delay}ms` : undefined }}
            >
              <line x1={x} y1={shoot.y} x2={tx} y2={ty} className="a-stroke" strokeWidth={3} strokeLinecap="round" />
              <circle cx={tx} cy={ty} r={6} className="a-fill-soft a-stroke" strokeWidth={1.5} />
            </g>
          </g>
        );
      })}
      <Flower x={x} y={top} tone={flowerTone} />
    </g>
  );
}

/** A point at `deg` degrees (SVG: 0 points right, 90 points down, toward the arm) and radius `r`. */
export function polar(deg: number, r: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [round1(Math.cos(a) * r), round1(Math.sin(a) * r)];
}

export interface TopShoot {
  /** Where the shoot points on the stand before any turn, degrees (90 = toward the arm). */
  angle: number;
  tone?: Tone;
  opacity?: number;
  delay?: number;
}

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

/**
 * The plant from above: the turntable with tick marks (so a turn shows), the pot, the side shoots,
 * an optional card stuck in the pot (`card`, its angle before any turn), and the flower in the middle.
 */
export function PlantTop({
  x,
  y,
  r,
  turn = 0,
  shoots,
  card,
  cardOpacity = 1,
}: {
  x: number;
  y: number;
  r: number;
  turn?: number;
  shoots: TopShoot[];
  card?: number;
  cardOpacity?: number;
}) {
  const pot = round1(r * 0.36);
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
        <circle r={pot} className="t-muted a-fill-surface a-stroke" strokeWidth={2} />
        {shoots.map((shoot, i) => {
          const [x1, y1] = polar(shoot.angle, r * 0.24);
          const [x2, y2] = polar(shoot.angle, r * 0.8);
          return (
            <g
              key={i}
              className={`a-t t-${shoot.tone ?? "ink"}`}
              style={{ opacity: shoot.opacity ?? 1, transitionDelay: shoot.delay ? `${shoot.delay}ms` : undefined }}
            >
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="a-stroke" strokeWidth={4} strokeLinecap="round" />
              <circle cx={x2} cy={y2} r={7} className="a-fill-soft a-stroke" strokeWidth={1.5} />
            </g>
          );
        })}
        {card !== undefined ? (
          <g transform={`rotate(${card + 90})`} className="a-t t-language" style={{ opacity: cardOpacity }}>
            {/* the card stands on the pot's rim, its written face outward */}
            <rect x={-11} y={-pot - 9} width={22} height={9} rx={2} className="a-fill a-stroke" strokeWidth={1.5} />
          </g>
        ) : null}
      </Move>
      <Flower x={x} y={y} size={round1(r / 64)} />
    </>
  );
}

/** A ring around something, unfilled so what it marks stays visible. Moves and fades with the frame's transition. */
export function Ring({
  x,
  y,
  r,
  tone,
  opacity = 1,
  width = 2.5,
  dashed = false,
}: {
  x: number;
  y: number;
  r: number;
  tone: Tone;
  opacity?: number;
  width?: number;
  dashed?: boolean;
}) {
  return (
    <g className={`a-t t-${tone}`} style={{ transform: `translate(${x}px, ${y}px)`, opacity }}>
      <circle r={r} fill="none" className="a-stroke" strokeWidth={width} strokeDasharray={dashed ? "4 3" : undefined} />
    </g>
  );
}
