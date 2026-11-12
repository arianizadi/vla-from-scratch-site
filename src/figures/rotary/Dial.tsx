"use client";

import { useState } from "react";
import { arcPath, polar, round2, sectorPath, wrapAngle } from "./draw";
import { decimals, whole } from "./model";

/** Half the side of the drawing, in px; the centre of the circle is (0, 0). */
const HALF = 124;
/** Radius of the circle, of the query arrow, of the key arrow and of the angle between them. */
const RADIUS = 96;
const QUERY_LENGTH = 92;
const KEY_LENGTH = 66;
const ARC_RADIUS = 34;

/**
 * An angle that changes by the shortest way round: when the target moves by
 * one radian the drawing turns one radian, and when it jumps by hundreds the
 * drawing does not spin. Only the shown angle is unwrapped; what it shows is
 * always the target modulo a full turn.
 */
function useShownAngle(target: number): number {
  const [state, setState] = useState({ target, shown: target });
  if (state.target !== target) {
    const shown = state.shown + wrapAngle(target - state.shown);
    setState({ target, shown });
    return shown;
  }
  return state.shown;
}

/** A CSS rotation for a counter-clockwise angle in radians (the SVG y axis points down). */
function turn(angle: number): string {
  return `rotate(${round2((-angle * 180) / Math.PI)}deg)`;
}

/** The same rotation undone, for text that has to stay upright inside a turned group. */
function upright(angle: number): string {
  return `rotate(${round2((angle * 180) / Math.PI)}deg)`;
}

interface ArrowProps {
  angle: number;
  length: number;
  label: string;
  /** Solid head for the query, open head for the key. */
  head: "solid" | "open";
  /** The true angle, drawn dashed behind a rounded one. */
  ghost?: boolean;
}

function Arrow({ angle, length, label, head, ghost = false }: ArrowProps) {
  const shown = useShownAngle(angle);
  const headPath = `M${length},0L${length - 11},-5.5L${length - 11},5.5Z`;
  return (
    <g className="rot-turn" style={{ transform: turn(shown) }}>
      <line
        x1={0}
        y1={0}
        x2={length - (ghost ? 2 : 9)}
        y2={0}
        className={ghost ? "rot-ghost" : "rot-shaft"}
        strokeDasharray={ghost ? "3 3" : undefined}
      />
      {ghost ? null : <path d={headPath} className={head === "solid" ? "rot-head" : "rot-head rot-head-open"} />}
      {ghost || !label ? null : (
        <text
          x={length + (label.length > 1 ? 18 : 13)}
          y={0}
          dy="0.35em"
          textAnchor="middle"
          className="rot-turn rot-dial-label"
          style={{ transform: upright(shown) }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Where the "0" of an empty angle sits: beside the shafts, not on them. */
const BESIDE = 0.5;

/**
 * The angle between key and query: a sector from the key's direction, turning
 * with it. The sector is always the gap the reader sees between the arrows,
 * the angle brought into (-pi, pi]; when the stored angle is larger, its label
 * is that gap (the full angle and the dropped turns are in the text beside).
 */
function Between({ keyAngle, relative }: { keyAngle: number; relative: number }) {
  const shown = useShownAngle(keyAngle);
  const gap = wrapAngle(relative);
  const none = Math.abs(gap) < 1e-9;
  const [lx, ly] = polar(0, 0, ARC_RADIUS + 16, none ? BESIDE : gap / 2);
  const text = none ? "0" : gap === relative ? whole(relative) : decimals(gap, 2);
  return (
    <g className="rot-turn" style={{ transform: turn(shown) }}>
      {none ? null : (
        <>
          <path d={sectorPath(0, 0, ARC_RADIUS, 0, gap)} className="rot-sector" />
          <path d={arcPath(0, 0, ARC_RADIUS, 0, gap)} className="rot-arc" />
        </>
      )}
      <text
        x={lx}
        y={ly}
        dy="0.35em"
        textAnchor="middle"
        className="rot-turn rot-dial-value"
        style={{ transform: upright(shown) }}
      >
        {text}
      </text>
    </g>
  );
}

export interface DialProps {
  /** Angles as the selected table holds them, in radians. */
  queryAngle: number;
  keyAngle: number;
  /** The true angles; drawn dashed when the table holds something else. */
  trueQuery: number;
  trueKey: number;
  label: string;
}

/**
 * The plane of one pair of numbers: the query and the key as arrows turned by
 * their positions, and the angle from key to query. The whole drawing is
 * centred on (0, 0), so every turn is a rotation about the origin.
 */
export function Dial({ queryAngle, keyAngle, trueQuery, trueKey, label }: DialProps) {
  const relative = queryAngle - keyAngle;
  const ghostQuery = trueQuery !== queryAngle;
  const ghostKey = trueKey !== keyAngle;
  const together = Math.abs(wrapAngle(relative)) < 1e-9;
  const [zeroX, zeroY] = polar(0, 0, RADIUS + 10, 0);
  return (
    <svg
      viewBox={`${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}`}
      width={HALF * 2}
      height={HALF * 2}
      className="rot-dial"
      role="img"
      aria-label={label}
    >
      <line x1={-RADIUS - 8} x2={RADIUS + 4} y1={0} y2={0} className="rot-axis" />
      <line x1={0} x2={0} y1={-RADIUS - 8} y2={RADIUS + 8} className="rot-axis" />
      <circle cx={0} cy={0} r={RADIUS} className="rot-circle" />
      <text x={zeroX} y={zeroY} dy="0.35em" className="rot-dial-tick">
        0
      </text>
      {ghostKey ? <Arrow angle={trueKey} length={KEY_LENGTH} label="" head="open" ghost /> : null}
      {ghostQuery ? <Arrow angle={trueQuery} length={QUERY_LENGTH} label="" head="solid" ghost /> : null}
      <Between keyAngle={keyAngle} relative={relative} />
      {/* When the two point the same way, the key's label would sit on the query's shaft: one label at the tip says both. */}
      <Arrow angle={keyAngle} length={KEY_LENGTH} label={together ? "" : "k"} head="open" />
      <Arrow angle={queryAngle} length={QUERY_LENGTH} label={together ? "q, k" : "q"} head="solid" />
      <circle cx={0} cy={0} r={3} className="rot-hub" />
    </svg>
  );
}

/** The score as a dot on a track from −1 to 1, with the true score as a ring when the table rounds it away. */
export function ScoreTrack({ score, trueScore }: { score: number; trueScore: number }) {
  const width = 240;
  const left = 14;
  const right = width - 14;
  const x = (value: number) => round2(left + ((value + 1) / 2) * (right - left));
  const differs = Math.abs(score - trueScore) > 5e-4;
  return (
    <svg viewBox={`0 0 ${width} 40`} width={width} height={40} className="rot-track" aria-hidden="true">
      <line x1={left} x2={right} y1={14} y2={14} className="rot-track-line" />
      {[-1, 0, 1].map((tick) => (
        <g key={tick}>
          <line x1={x(tick)} x2={x(tick)} y1={9} y2={19} className="rot-track-tick" />
          <text x={x(tick)} y={34} textAnchor="middle" className="fig-axis-text">
            {whole(tick)}
          </text>
        </g>
      ))}
      {differs ? <circle cx={x(trueScore)} cy={14} r={5} className="rot-track-true" /> : null}
      <circle cx={0} cy={14} r={6} className="rot-slide rot-track-dot" style={{ transform: `translateX(${x(score)}px)` }} />
    </svg>
  );
}
