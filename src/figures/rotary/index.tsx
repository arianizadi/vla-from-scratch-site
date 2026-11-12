"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  Legend,
  PlayButton,
  SERIES,
  Segmented,
  Slider,
  Stepper,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
  type SegmentedOption,
} from "@/figures/kit";
import { CountChart } from "./CountChart";
import { Dial, ScoreTrack } from "./Dial";
import { Lens, lensColumns, lensWindow } from "./Lens";
import {
  COUNT_REPRODUCED,
  LANDMARKS,
  MAX_OFFSET,
  MEASURED_DISTINCT,
  NOTEBOOK_SECTION,
  SIGNIFICANT_BITS,
  START,
  SWEEP,
  TABLE_SIZE,
  blockSize,
  clamp,
  decimals,
  distinctUpTo,
  poseOf,
  queryRange,
  stored,
  turned,
  vectorText,
  whole,
  zoneOf,
  ZONES,
  type Landmark,
  type Pose,
  type TableKind,
} from "./model";
import { TAU, wrapAngle } from "./draw";
import "./rotary.css";

const info = FIGURES.rotary;

/** One beat of Play: both positions move by one. Long enough to see the turn finish. */
const BEAT_MS = 700;
/** Autoplay waits this long after the figure has arrived (DESIGN.md, section 6). */
const ARRIVAL_MS = 400;

const TABLE_OPTIONS: readonly SegmentedOption<TableKind>[] = [
  { value: "float32", label: "float32" },
  { value: "bfloat16", label: "bfloat16" },
];

interface Sweep {
  from: number;
  to: number;
}

function rad(value: number): string {
  return `${whole(value)} rad`;
}

/** What bfloat16 does to the positions around the query, in words. */
function lensText(query: number): string {
  const zone = zoneOf(query);
  const value = stored(query, "bfloat16");
  const size = blockSize(query);
  const shared =
    size === 1
      ? `position ${query} keeps a value of its own`
      : `position ${query} shares the value ${value} with ${size - 1} ${size === 2 ? "neighbour" : "neighbours"}`;
  return `Around position ${query} bfloat16 holds ${zone.holds}: ${shared}.`;
}

const COUNT_WORDS = ["no", "one", "two", "three"];

/**
 * When the angle from key to query is more than half a turn, the arrows show
 * only what is left after whole turns: say so, or nothing when they agree.
 */
function turnsText(relative: number): string {
  const gap = wrapAngle(relative);
  if (gap === relative) return "";
  const turns = Math.round((relative - gap) / TAU);
  const count = Math.abs(turns);
  const word = COUNT_WORDS[count] ?? String(count);
  return (
    `${rad(relative)} ends where ${decimals(gap, 2)} rad does, ${word} full ${count === 1 ? "turn" : "turns"} ` +
    `${turns > 0 ? "further on" : "further back"}: the arrows are ${decimals(Math.abs(gap), 2)} rad apart, ` +
    `and cos(${whole(relative)}) = cos(${decimals(gap, 2)}).`
  );
}

/** The pair as the selected table holds it, in one or two sentences for the status line. */
function statusText(pose: Pose, offset: number, table: TableKind): string {
  const relative = pose.storedQuery - pose.storedKey;
  const pair = `Query at position ${pose.query}, key at ${pose.key}, offset ${whole(offset)}.`;
  const held =
    table === "float32"
      ? `float32 turns them by ${rad(pose.storedQuery)} and ${rad(pose.storedKey)}`
      : `bfloat16 turns them by ${rad(pose.storedQuery)} and ${rad(pose.storedKey)}`;
  const score = `relative angle ${rad(relative)}, score cos(${whole(relative)}) = ${decimals(Math.cos(relative))}`;
  const lost =
    relative !== offset
      ? relative === 0
        ? " The two tokens are turned alike, as if they were at the same position."
        : ` In float32 the relative angle would be ${rad(offset)}.`
      : "";
  const turns = turnsText(relative);
  return `${pair} ${held}: ${score}.${lost}${turns ? ` ${turns}` : ""}`;
}

/** What bfloat16 does to the pair, beside the panel B slider, so its effect on q · k is in view. */
function pairText(pose: Pose, offset: number): string {
  const storedQuery = stored(pose.query, "bfloat16");
  const storedKey = stored(pose.key, "bfloat16");
  const relative = storedQuery - storedKey;
  const held = `bfloat16 holds q at ${storedQuery} and k at ${storedKey}: q · k = cos(${whole(relative)}) = ${decimals(Math.cos(relative))}`;
  return relative === offset
    ? `${held}, as in float32.`
    : `${held}; in float32, cos(${whole(offset)}) = ${decimals(Math.cos(offset))}.`;
}

/**
 * rotary: rotary position encoding in the toy of the chapter (one pair of
 * numbers, one radian per position), and the bug of the position table
 * computed in bfloat16.
 *
 * Panel A turns a query and a key by their positions. Shifting both by the
 * same amount (Play, or the position stepper) turns both arrows together and
 * leaves the angle between them, and so the score, unchanged; changing the
 * offset changes it. With the table set to bfloat16, positions above 256 are
 * rounded first, and two tokens two positions apart can be turned alike.
 *
 * Panel B shows what bfloat16 keeps of the table: a lens on the positions
 * around the query, and the count of distinct positions over the whole table,
 * which ends at the lab notebook's 641 of 2048.
 */
export default function RotaryFigure({ caption }: FigureProps) {
  const [query, setQuery] = useState<number>(START.query);
  const [offset, setOffset] = useState<number>(START.offset);
  const [table, setTable] = useState<TableKind>("float32");
  const [playing, setPlaying] = useState(false);
  const [sweep, setSweep] = useState<Sweep | null>(null);
  const [touched, setTouched] = useState(false);

  const ids = useId();
  // The sweep animates the dial, so it starts and keeps running only while the dial is on screen,
  // not while the reader is down in panel B.
  const dialBox = useRef<HTMLDivElement>(null);
  const lensBox = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(lensBox);
  const onScreen = useInView(dialBox, { amount: 0.25 });
  const arrived = useInView(dialBox, { amount: 0.6, once: true });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const [low, high] = queryRange(offset);
  const ended = sweep !== null && query >= sweep.to;
  const running = playing && !ended && onScreen && pageVisible && !reducedMotion;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setQuery((current) => Math.min(current + 1, high)), BEAT_MS);
    return () => clearInterval(timer);
  }, [running, high]);

  // Play once, when the figure has arrived, unless the reader got there first.
  useEffect(() => {
    if (!arrived || touched || reducedMotion) return;
    const timer = setTimeout(() => {
      setSweep({ from: START.query, to: Math.min(START.query + SWEEP, high) });
      setPlaying(true);
      setTouched(true);
    }, ARRIVAL_MS);
    return () => clearTimeout(timer);
  }, [arrived, touched, reducedMotion, high]);

  /** Any change by the reader stops the sweep. */
  const interrupt = () => {
    setTouched(true);
    setPlaying(false);
  };

  const togglePlay = () => {
    setTouched(true);
    if (running) {
      setPlaying(false);
      return;
    }
    if (ended && sweep) {
      setQuery(sweep.from);
    } else if (!sweep) {
      const to = Math.min(query + SWEEP, high);
      if (to === query) return;
      setSweep({ from: query, to });
    }
    setPlaying(true);
  };

  const moveTo = (next: number) => {
    interrupt();
    setSweep(null);
    setQuery(clamp(next, low, high));
  };

  const changeOffset = (next: number) => {
    interrupt();
    setSweep(null);
    const [nextLow, nextHigh] = queryRange(next);
    setOffset(next);
    setQuery((current) => clamp(current, nextLow, nextHigh));
  };

  const goTo = (landmark: Landmark) => {
    interrupt();
    setSweep(null);
    setTable("bfloat16");
    setOffset(landmark.query - landmark.key);
    setQuery(landmark.query);
  };

  const chooseTable = (next: TableKind) => {
    interrupt();
    setTable(next);
  };

  const reset = () => {
    interrupt();
    setSweep(null);
    setQuery(START.query);
    setOffset(START.offset);
    setTable("float32");
  };

  const pose = poseOf(query, offset, table);
  const truth = poseOf(query, offset, "float32");
  const relative = pose.storedQuery - pose.storedKey;
  const score = Math.cos(relative);
  const trueScore = Math.cos(offset);
  const rounded = table === "bfloat16" && relative !== offset;
  // A dashed arrow is drawn wherever the table holds a position other than float32 does,
  // which can happen to both while the angle between them survives.
  const ghosted = pose.storedQuery !== truth.storedQuery || pose.storedKey !== truth.storedKey;
  const turns = turnsText(relative);

  let ledgerText: string;
  if (rounded && relative === 0) {
    ledgerText = "Rounded to the same position, the two tokens are turned alike: to attention they are at offset 0.";
  } else if (rounded) {
    ledgerText = "Rounding has changed the angle between them, and with it the score.";
  } else if (ghosted && offset === 0) {
    ledgerText = `bfloat16 holds position ${pose.query} as ${pose.storedQuery}; q and k are both there, so they stay turned alike.`;
  } else if (ghosted) {
    ledgerText =
      `bfloat16 has rounded both positions, q to ${pose.storedQuery} and k to ${pose.storedKey}, by the same amount, ` +
      "so here the angle between them, and the score, happen to survive.";
  } else {
    ledgerText =
      "Shift both positions by the same amount and the angle between them, and the score, stay as they are. Change the offset and the score changes.";
  }

  // The lens is drawn 640 wide until the stage is measured, and in the static HTML.
  const lensWidth = measured || 640;
  const [lensFirst, lensLast] = lensWindow(pose.query, pose.key, lensColumns(lensWidth));

  const dialLabel =
    `A circle with the query and the key drawn as arrows from its centre. The query, at position ${pose.query}, ` +
    `points at ${rad(pose.storedQuery)}; the key, at position ${pose.key}, at ${rad(pose.storedKey)}` +
    `${table === "bfloat16" ? ", as bfloat16 holds them" : ""}. The angle from key to query is ${rad(relative)}.` +
    `${turns ? ` ${turns}` : ""}`;

  const lensLabel =
    `Positions ${lensFirst} to ${lensLast}, above as float32 holds them and below as bfloat16 does. ` +
    `${lensText(query)} bfloat16 holds the query at ${stored(query, "bfloat16")} and the key at ${stored(pose.key, "bfloat16")}.`;

  const chartLabel =
    `Distinct positions counted from position 0: float32 climbs one per position to ${TABLE_SIZE}; ` +
    `bfloat16 climbs one per position up to ${ZONES[0].to}, then more slowly, and ends at ${MEASURED_DISTINCT} of ${TABLE_SIZE}.`;

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      controls={<ControlButton onClick={reset}>Reset</ControlButton>}
      status={statusText(pose, offset, table)}
      note={
        <>
          Computed in the browser. The toy is the chapter&rsquo;s: one pair of a head&rsquo;s numbers turning 1 radian
          per position, with query and key both (1, 0) before they are turned. For bfloat16 each position is rounded to{" "}
          {SIGNIFICANT_BITS} significant bits, to nearest with ties to even, as a cast does; the cosines are then
          computed in full precision. {MEASURED_DISTINCT} distinct positions of {TABLE_SIZE} is the lab
          notebook&rsquo;s count (&ldquo;{NOTEBOOK_SECTION}&rdquo;)
          {COUNT_REPRODUCED ? "; rounding every position here gives the same count" : ""}. The action-step positions
          are the lab notebook&rsquo;s, or the chapter&rsquo;s where the notebook does not list them.
        </>
      }
    >
      <div className="rot-root">
        <section className="rot-panel" aria-labelledby={`${ids}-a`}>
          <h3 className="rot-panel-title" id={`${ids}-a`}>
            <span className="rot-panel-letter">A</span> Query and key, turned by their positions
          </h3>
          <div className="rot-a">
            <div ref={dialBox} className="rot-dial-box">
              <Dial
                queryAngle={pose.storedQuery}
                keyAngle={pose.storedKey}
                trueQuery={truth.storedQuery}
                trueKey={truth.storedKey}
                label={dialLabel}
              />
              <p className="rot-small">
                One position turns an arrow 1 rad counter-clockwise.
                {ghosted ? " Dashed: where float32 would point." : ""}
                {turns ? ` ${turns}` : ""}
              </p>
            </div>
            <div className="rot-ledger">
              <table className="rot-table">
                <caption className="sr-only">The pair as {table} holds it</caption>
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col" className="num">
                      Position
                    </th>
                    <th scope="col" className="num">
                      Angle in {table}
                    </th>
                    <th scope="col" className="num">
                      Turned (1, 0)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Query q</th>
                    <td className="num">{pose.query}</td>
                    <td className="num">{rad(pose.storedQuery)}</td>
                    <td className="num">{vectorText(turned(pose.storedQuery))}</td>
                  </tr>
                  <tr>
                    <th scope="row">Key k</th>
                    <td className="num">{pose.key}</td>
                    <td className="num">{rad(pose.storedKey)}</td>
                    <td className="num">{vectorText(turned(pose.storedKey))}</td>
                  </tr>
                  <tr className="rot-table-sum">
                    <th scope="row">q − k</th>
                    <td className="num">{whole(offset)}</td>
                    <td className="num">
                      <span className={rounded ? "rot-flag" : undefined}>{rad(relative)}</span>
                    </td>
                    <td className="num"></td>
                  </tr>
                </tbody>
              </table>
              <div className="rot-score">
                <p className="rot-score-text">
                  Score q · k = cos({whole(relative)}) = <strong>{decimals(score)}</strong>
                  {rounded ? <span className="rot-score-true"> (float32: {decimals(trueScore)})</span> : null}
                </p>
                <ScoreTrack score={score} trueScore={trueScore} />
              </div>
              <p className="rot-small">{ledgerText}</p>
            </div>
          </div>
          <div className="rot-controls" role="group" aria-label="Query and key">
            <PlayButton playing={running} ended={ended && !running} onToggle={togglePlay} className="motion-reduce:hidden" />
            <Stepper
              label="position"
              value={query}
              min={low}
              max={high}
              onChange={moveTo}
              format={(value) => `q ${value}, k ${value - offset}`}
            />
            <Segmented label="Table" showLabel options={TABLE_OPTIONS} value={table} onChange={chooseTable} />
            <Slider
              label="Offset q − k"
              min={-MAX_OFFSET}
              max={MAX_OFFSET}
              value={offset}
              onChange={changeOffset}
              format={whole}
            />
          </div>
        </section>

        <section className="rot-panel rot-panel-b" aria-labelledby={`${ids}-b`}>
          <h3 className="rot-panel-title" id={`${ids}-b`}>
            <span className="rot-panel-letter">B</span> The position table in bfloat16
          </h3>
          <p className="rot-count">
            <strong>
              {MEASURED_DISTINCT} of {TABLE_SIZE}
            </strong>{" "}
            positions stay distinct in bfloat16 (lab notebook, &ldquo;{NOTEBOOK_SECTION}&rdquo;).
          </p>
          <div className="rot-controls">
            {/* The value names the key too, so the reader sees why the query stops short of an end of the table. */}
            <Slider
              label="Query position"
              min={low}
              max={high}
              value={query}
              onChange={moveTo}
              format={(value) => `q ${value}, k ${value - offset}`}
              className="rot-wide-slider"
            />
          </div>
          <p className="rot-small rot-pair-readout">{pairText(pose, offset)}</p>
          <div ref={lensBox} className="rot-lens-box" role="img" aria-label={lensLabel}>
            <Lens query={pose.query} keyPosition={pose.key} width={lensWidth} />
          </div>
          <p className="rot-small">{lensText(query)}</p>
          {COUNT_REPRODUCED ? (
            <div className="rot-chart-box">
              <Legend
                items={[
                  { label: "float32", color: SERIES[0], shape: "circle" },
                  { label: `bfloat16, ${SIGNIFICANT_BITS} significant bits`, color: SERIES[1], shape: "square" },
                ]}
              />
              <div role="img" aria-label={chartLabel}>
                <CountChart width={lensWidth} position={query} onPick={moveTo} />
              </div>
              <p className="rot-small">
                Positions 0 to {query}: {distinctUpTo(query, "float32")} distinct in float32,{" "}
                {distinctUpTo(query, "bfloat16")} in bfloat16. Drag along the chart, or use the Query position slider.
              </p>
            </div>
          ) : null}
          {LANDMARKS.length > 0 ? (
            <div className="rot-landmarks">
              <p className="rot-small">
                Shaded: the action-step tokens of two policies. Go to a pair two positions apart among them:
              </p>
              <div className="rot-landmark-buttons">
                {LANDMARKS.map((landmark) => (
                  <ControlButton key={landmark.id} onClick={() => goTo(landmark)}>
                    {landmark.policy}, positions {landmark.first}–{landmark.last}
                  </ControlButton>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </FigureFrame>
  );
}
