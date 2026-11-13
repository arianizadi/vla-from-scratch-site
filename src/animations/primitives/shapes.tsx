import type { ReactNode } from "react";
import { at, round, textWidth, toneClass, type Animated, type Tone } from "./shared";

/* Every primitive is positioned by its centre (x, y) unless it says otherwise,
   and moves there with the frame's transition when x or y changes between
   steps. Nothing here holds state: a step's drawing is a pure function of the
   step number. */

export interface MoveProps extends Animated {
  x?: number;
  y?: number;
  scale?: number;
  /** Degrees, clockwise. */
  rotate?: number;
  children: ReactNode;
  className?: string;
}

/** Moves, scales, turns or fades a group of shapes together. */
export function Move({ x = 0, y = 0, scale, rotate, opacity, delay, enter, children, className = "" }: MoveProps) {
  return (
    <g className={`a-t ${enter ? "a-enter" : ""} ${className}`} style={at(x, y, { opacity, delay, scale, rotate })}>
      {children}
    </g>
  );
}

export interface ChipProps extends Animated {
  x: number;
  y: number;
  /** The text on the chip: a token, a word, an id. */
  text: string;
  tone?: Tone;
  /** soft: tinted fill (default); solid: filled with the tone; outline: paper with a border. */
  variant?: "soft" | "solid" | "outline";
  /** Font size in SVG units. Default 16. */
  size?: number;
  /** Monospaced text, for tokens and ids. Default true. */
  mono?: boolean;
  /** Fixed width; default fits the text. */
  width?: number;
  /** Ring it with the highlighter: "this one, now". */
  active?: boolean;
  /** A small line under the chip, such as the token's id. */
  sub?: string;
  scale?: number;
}

/** A token, a word or an id as a rounded chip. The workhorse of text animations. */
export function Chip({
  x,
  y,
  text,
  tone = "language",
  variant = "soft",
  size = 16,
  mono = true,
  width,
  active = false,
  sub,
  opacity,
  delay,
  scale,
  enter,
}: ChipProps) {
  const w = width ?? Math.max(size * 1.8, textWidth(text, size, mono) + size * 1.2);
  const h = size * 1.9;
  return (
    <g className={`a-t ${toneClass(tone)} chip chip-${variant} ${enter ? "a-enter" : ""}`} style={at(x, y, { opacity, delay, scale })}>
      {active ? (
        <rect
          className="a-t chip-ring"
          x={round(-w / 2 - 4)}
          y={round(-h / 2 - 4)}
          width={round(w + 8)}
          height={round(h + 8)}
          rx={9}
        />
      ) : null}
      <rect className="a-t chip-body" x={round(-w / 2)} y={round(-h / 2)} width={round(w)} height={round(h)} rx={6} />
      <text className={`a-t chip-text ${mono ? "a-mono" : ""}`} y={0.5} fontSize={size} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
      {sub !== undefined ? (
        <text className="a-t chip-sub a-mono" y={round(h / 2 + size * 0.95)} fontSize={Math.max(13, size * 0.82)} textAnchor="middle" dominantBaseline="central">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export interface LabelProps extends Animated {
  x: number;
  y: number;
  children: ReactNode;
  tone?: Tone;
  /** Font size in SVG units. Default 15; never below 13. */
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: 400 | 600 | 700;
  mono?: boolean;
}

/** A line of text in the drawing: a caption on a shape, an axis name, a value. */
export function Label({ x, y, children, tone = "muted", size = 15, anchor = "middle", weight = 400, mono = false, opacity, delay, enter }: LabelProps) {
  return (
    <g className={`a-t ${toneClass(tone)} ${enter ? "a-enter" : ""}`} style={at(x, y, { opacity, delay })}>
      <text
        className={`a-label ${mono ? "a-mono" : ""}`}
        fontSize={Math.max(13, size)}
        fontWeight={weight}
        textAnchor={anchor}
        dominantBaseline="central"
      >
        {children}
      </text>
    </g>
  );
}

export interface DotProps extends Animated {
  x: number;
  y: number;
  /** Radius. Default 5. */
  r?: number;
  tone?: Tone;
  /** Draw as a ring instead of a filled dot. */
  hollow?: boolean;
  scale?: number;
}

/** A point: a sample, a position, a particle of noise. */
export function Dot({ x, y, r = 5, tone = "ink", hollow = false, opacity, delay, scale, enter }: DotProps) {
  return (
    <g className={`a-t ${toneClass(tone)} ${enter ? "a-enter" : ""}`} style={at(x, y, { opacity, delay, scale })}>
      <circle r={r} className={hollow ? "a-stroke a-fill-surface" : "a-fill"} strokeWidth={hollow ? 2 : undefined} />
    </g>
  );
}

export interface BoxProps extends Animated {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Name of the part: "Tokenizer", "Model". */
  label?: string;
  /** Second, smaller line. */
  sub?: string;
  tone?: Tone;
  /** Tinted fill instead of paper. */
  filled?: boolean;
  /** Highlighted as the part working now. */
  active?: boolean;
  /** Corner radius. Default 10. */
  radius?: number;
  scale?: number;
}

/** A part of a system: a model, a tokenizer, a table. */
export function Box({ x, y, w, h, label, sub, tone = "ink", filled = false, active = false, radius = 10, opacity, delay, scale }: BoxProps) {
  return (
    <g className={`a-t ${toneClass(tone)} box ${filled ? "box-filled" : ""} ${active ? "box-active" : ""}`} style={at(x, y, { opacity, delay, scale })}>
      <rect className="a-t box-body" x={round(-w / 2)} y={round(-h / 2)} width={w} height={h} rx={radius} />
      {label ? (
        <text className="box-label" y={sub ? -9 : 0.5} fontSize={15} fontWeight={700} textAnchor="middle" dominantBaseline="central">
          {label}
        </text>
      ) : null}
      {sub ? (
        <text className="box-sub" y={11} fontSize={13} textAnchor="middle" dominantBaseline="central">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export interface CellsProps extends Animated {
  /** Centre of the strip. */
  x: number;
  y: number;
  /** One value per cell, 0 to 1: drawn as the strength of the tone. */
  values: number[];
  tone?: Tone;
  /** Cell side. Default 14. */
  cell?: number;
  gap?: number;
  /** Lay the cells out in a row (default) or a column. */
  direction?: "row" | "column";
  /** Outline every cell, for an empty slot. */
  outline?: boolean;
}

/** A vector (a row of numbers) as a strip of shaded cells: embeddings, hidden states, actions. */
export function Cells({ x, y, values, tone = "language", cell = 14, gap = 3, direction = "row", outline = false, opacity, delay }: CellsProps) {
  const span = values.length * cell + (values.length - 1) * gap;
  return (
    <g className={`a-t ${toneClass(tone)}`} style={at(x, y, { opacity, delay })}>
      {values.map((value, index) => {
        const offset = -span / 2 + index * (cell + gap);
        const cx = direction === "row" ? offset : -cell / 2;
        const cy = direction === "row" ? -cell / 2 : offset;
        return (
          <rect
            key={index}
            className={`a-t ${outline ? "cell-outline" : "a-fill"}`}
            x={round(cx)}
            y={round(cy)}
            width={cell}
            height={cell}
            rx={3}
            style={{ fillOpacity: outline ? undefined : round(0.14 + 0.86 * Math.min(1, Math.max(0, value))) }}
          />
        );
      })}
    </g>
  );
}

type Point = [number, number];

export interface ArrowProps extends Animated {
  from: Point;
  to: Point;
  /** Bend the arrow sideways by this many units (negative bends the other way). */
  bend?: number;
  tone?: Tone;
  /** Draw the line in (true) or keep it hidden (false). Default true. */
  drawn?: boolean;
  /** A moving dash along the arrow: "something flows here". */
  flow?: boolean;
  dashed?: boolean;
  /** Line width. Default 2. */
  width?: number;
  /** Arrowhead at the end. Default true. */
  head?: boolean;
}

function quadratic(from: Point, to: Point, bend: number): { d: string; control: Point } {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) || 1;
  const control: Point = [mx - (dy / length) * bend, my + (dx / length) * bend];
  return {
    d: `M${round(from[0])} ${round(from[1])} Q${round(control[0])} ${round(control[1])} ${round(to[0])} ${round(to[1])}`,
    control,
  };
}

/**
 * An arrow from one point to another that draws itself in. Use it for "goes
 * into", "becomes", "reads". With `flow` a dash travels along it while the
 * animation plays.
 */
export function Arrow({ from, to, bend = 0, tone = "muted", drawn = true, flow = false, dashed = false, width = 2, head = true, opacity, delay = 0 }: ArrowProps) {
  const { d, control } = quadratic(from, to, bend);
  const angle = Math.atan2(to[1] - control[1], to[0] - control[0]);
  const size = 5 + width * 1.5;
  const tip = to;
  const left: Point = [tip[0] - size * Math.cos(angle - 0.45), tip[1] - size * Math.sin(angle - 0.45)];
  const right: Point = [tip[0] - size * Math.cos(angle + 0.45), tip[1] - size * Math.sin(angle + 0.45)];
  const plain = dashed || flow;
  return (
    <g className={toneClass(tone)} style={{ opacity: opacity ?? 1 }}>
      <path
        d={d}
        className={`a-stroke ${plain ? "a-t" : "a-draw"} ${flow ? "a-flow" : ""}`}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={flow ? "0.04 0.03" : dashed ? "0.02 0.025" : 1}
        style={
          plain
            ? { opacity: drawn ? 1 : 0, transitionDelay: delay ? `${delay}ms` : undefined }
            : { strokeDashoffset: drawn ? 0 : 1, transitionDelay: delay ? `${delay}ms` : undefined }
        }
      />
      {head ? (
        <path
          d={`M${round(left[0])} ${round(left[1])} L${round(tip[0])} ${round(tip[1])} L${round(right[0])} ${round(right[1])}`}
          className="a-stroke a-t"
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: drawn ? 1 : 0, transitionDelay: `${delay + (drawn && !plain ? 500 : 0)}ms` }}
        />
      ) : null}
    </g>
  );
}

export interface PathProps extends Animated {
  /** SVG path data. */
  d: string;
  tone?: Tone;
  /** Draw it in (true) or hide it (false). Default true. */
  drawn?: boolean;
  width?: number;
  dashed?: boolean;
  /** Fill the shape with the tone's tint instead of stroking only. */
  fill?: boolean;
}

/** Any line or outline that draws itself in: a trajectory, a curve, a boundary. */
export function Path({ d, tone = "ink", drawn = true, width = 2, dashed = false, fill = false, opacity, delay }: PathProps) {
  return (
    <path
      d={d}
      className={`${toneClass(tone)} a-stroke ${dashed ? "a-t" : "a-draw"} ${fill ? "a-fill-soft" : ""}`}
      fill={fill ? undefined : "none"}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={dashed ? "0.015 0.02" : 1}
      style={{
        strokeDashoffset: dashed ? undefined : drawn ? 0 : 1,
        opacity: (opacity ?? 1) * (dashed && !drawn ? 0 : 1),
        transitionDelay: delay ? `${delay}ms` : undefined,
      }}
    />
  );
}

export interface BracketProps extends Animated {
  /** Left and right ends, and the height of the line. */
  x1: number;
  x2: number;
  y: number;
  label?: string;
  tone?: Tone;
  /** Put the label under the line instead of above it. */
  below?: boolean;
}

/** A dimension line with end ticks and a label: a length, a count, a span. */
export function Bracket({ x1, x2, y, label, tone = "muted", below = false, opacity, delay }: BracketProps) {
  return (
    <g className={`a-t ${toneClass(tone)}`} style={{ opacity: opacity ?? 1, transitionDelay: delay ? `${delay}ms` : undefined }}>
      <path d={`M${x1} ${y - 6}v12M${x2} ${y - 6}v12M${x1} ${y}H${x2}`} className="a-stroke" strokeWidth={1.5} fill="none" />
      {label ? (
        <text className="a-label" x={(x1 + x2) / 2} y={below ? y + 16 : y - 14} fontSize={14} textAnchor="middle" dominantBaseline="central">
          {label}
        </text>
      ) : null}
    </g>
  );
}
