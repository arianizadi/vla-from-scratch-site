import { at, round, toneClass, type Animated, type Tone } from "./shared";

/* Small charts for explanations: axes, a line that draws in, bars that grow,
   and a timeline with a moving marker. These are sketches of an idea; a chart
   of measured numbers belongs in the lab page's figure kit (src/figures/kit). */

export interface AxesProps extends Animated {
  /** Plot area: left, top, width, height. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Name of the horizontal axis, under it. */
  xLabel?: string;
  /** Name of the vertical axis, above its top end. */
  yLabel?: string;
  /** Tick labels spread evenly along the horizontal axis. */
  xTicks?: string[];
}

/** Two axis lines with names and optional ticks. Coordinates are the plot area's corners. */
export function Axes({ x, y, w, h, xLabel, yLabel, xTicks = [], opacity, delay }: AxesProps) {
  return (
    <g className="a-t t-faint" style={{ opacity: opacity ?? 1, transitionDelay: delay ? `${delay}ms` : undefined }}>
      <path d={`M${x} ${y}V${y + h}H${x + w}`} className="a-stroke" strokeWidth={1.5} fill="none" />
      {xTicks.map((tick, index) => {
        const tx = xTicks.length === 1 ? x + w / 2 : x + (index / (xTicks.length - 1)) * w;
        return (
          <g key={index}>
            <path d={`M${round(tx)} ${y + h}v5`} className="a-stroke" strokeWidth={1.5} />
            <text className="a-label" x={round(tx)} y={y + h + 18} fontSize={13} textAnchor="middle" dominantBaseline="central">
              {tick}
            </text>
          </g>
        );
      })}
      {xLabel ? (
        <text className="a-label" x={x + w} y={y + h + (xTicks.length ? 38 : 18)} fontSize={13} textAnchor="end" dominantBaseline="central">
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text className="a-label" x={x} y={y - 14} fontSize={13} textAnchor="start" dominantBaseline="central">
          {yLabel}
        </text>
      ) : null}
    </g>
  );
}

export interface LineProps extends Animated {
  /** Points in drawing units (map data with scale() from motion.ts). */
  points: [number, number][];
  tone?: Tone;
  drawn?: boolean;
  width?: number;
  dashed?: boolean;
  /** Draw a dot on every point. */
  dots?: boolean;
}

/** A polyline that draws itself in: a curve, a path through space, a trend. */
export function Line({ points, tone = "accent", drawn = true, width = 2.5, dashed = false, dots = false, opacity, delay }: LineProps) {
  const d = points.map(([px, py], index) => `${index === 0 ? "M" : "L"}${round(px)} ${round(py)}`).join("");
  return (
    <g className={toneClass(tone)} style={{ opacity: opacity ?? 1 }}>
      <path
        d={d}
        className={`a-stroke ${dashed ? "a-t" : "a-draw"}`}
        fill="none"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={dashed ? "0.015 0.02" : 1}
        style={{
          strokeDashoffset: dashed ? undefined : drawn ? 0 : 1,
          opacity: dashed && !drawn ? 0 : 1,
          transitionDelay: delay ? `${delay}ms` : undefined,
        }}
      />
      {dots
        ? points.map(([px, py], index) => (
            <circle
              key={index}
              cx={round(px)}
              cy={round(py)}
              r={4}
              className="a-fill a-t"
              style={{ opacity: drawn ? 1 : 0, transitionDelay: `${(delay ?? 0) + (index / Math.max(1, points.length - 1)) * 700}ms` }}
            />
          ))
        : null}
    </g>
  );
}

export interface BarProps extends Animated {
  /** Centre of the bar's foot, on the baseline. */
  x: number;
  y: number;
  /** Full height in drawing units; `value` (0 to 1) is the share drawn. */
  height: number;
  value: number;
  width?: number;
  tone?: Tone;
  /** Text above the bar, such as its value. */
  label?: string;
  /** Text under the baseline, such as its name. */
  name?: string;
}

/** A bar that grows from the baseline to `value` of `height`. */
export function Bar({ x, y, height, value, width = 28, tone = "accent", label, name, opacity, delay }: BarProps) {
  const v = Math.min(1, Math.max(0, value));
  const top = -height * v;
  return (
    <g className={toneClass(tone)} style={at(x, y, { opacity })}>
      <rect
        className="a-t a-fill bar-grow"
        x={-width / 2}
        y={-height}
        width={width}
        height={height}
        rx={4}
        style={{ transform: `scaleY(${round(v)})`, transitionDelay: delay ? `${delay}ms` : undefined }}
      />
      {label ? (
        <g className="a-t" style={{ transform: `translate(0px, ${round(top - 14)}px)`, transitionDelay: delay ? `${delay}ms` : undefined }}>
          <text className="a-label a-label-strong" fontSize={14} fontWeight={700} textAnchor="middle" dominantBaseline="central">
            {label}
          </text>
        </g>
      ) : null}
      {name ? (
        <text className="a-label t-muted" y={16} fontSize={13} textAnchor="middle" dominantBaseline="central">
          {name}
        </text>
      ) : null}
    </g>
  );
}

export interface TimelineProps extends Animated {
  /** Left end and height of the track, and its length. */
  x: number;
  y: number;
  w: number;
  /** Tick labels spread evenly along the track. */
  ticks: string[];
  /** Where the marker is, 0 to 1 along the track; leave out for no marker. */
  marker?: number;
  tone?: Tone;
  /** Fill the track up to the marker. */
  fill?: boolean;
}

/** A time track with ticks and a marker that slides along it: training steps, control steps, flow steps. */
export function Timeline({ x, y, w, ticks, marker, tone = "accent", fill = true, opacity, delay }: TimelineProps) {
  const m = marker === undefined ? undefined : Math.min(1, Math.max(0, marker));
  return (
    <g style={{ opacity: opacity ?? 1 }}>
      <rect x={x} y={y - 3} width={w} height={6} rx={3} className="t-faint a-fill-soft" />
      {fill && m !== undefined ? (
        <rect
          x={x}
          y={y - 3}
          width={w}
          height={6}
          rx={3}
          className={`${toneClass(tone)} a-fill a-t bar-grow-x`}
          style={{ transform: `scaleX(${round(m)})`, transitionDelay: delay ? `${delay}ms` : undefined }}
        />
      ) : null}
      {ticks.map((tick, index) => {
        const tx = ticks.length === 1 ? x : x + (index / (ticks.length - 1)) * w;
        return (
          <text key={index} className="a-label t-muted" x={round(tx)} y={y + 20} fontSize={13} textAnchor="middle" dominantBaseline="central">
            {tick}
          </text>
        );
      })}
      {m !== undefined ? (
        <g className={`a-t ${toneClass(tone)}`} style={at(x + m * w, y, { delay })}>
          <circle r={8} className="a-fill-surface a-stroke" strokeWidth={3} />
        </g>
      ) : null}
    </g>
  );
}
