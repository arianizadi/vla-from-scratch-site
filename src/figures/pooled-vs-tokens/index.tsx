"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Slider,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { Frame } from "./Frame";
import { Measured } from "./Measured";
import {
  AFTER,
  ALL_PLACES,
  ALL_TOKEN_NUMBERS,
  BEFORE,
  CUBE,
  DRAWING_DESCRIPTION,
  FRAME_PX,
  GRID,
  LIMIT,
  MEASURED,
  PATCH_PX,
  POOLED_MAGNIFICATION,
  TOKEN_COUNT,
  TOKEN_WIDTH,
  announcedSentence,
  averagePatch,
  between,
  compare,
  grouped,
  listed,
  onePatchOver,
  placesGive,
  placesWithSamePooled,
  placesWithSameTokens,
  pooledShare,
  pooledValues,
  samePoint,
  statusSentence,
  type Point,
} from "./model";
import { Meter, PooledChip, TokenGrid } from "./Representations";
import { styles } from "./classes";
import "./pooled-vs-tokens.css";

const info = FIGURES["pooled-vs-tokens"];

/** How long the played move takes. The cube crosses about seven patches, so each flip of a token can be followed. */
const MOVE_MS = 2400;
/** Autoplay waits this long after the figure has arrived on screen (DESIGN.md, section 6). */
const SETTLE_MS = 400;
/** Screen readers hear the state once the cube has stopped for this long, not at every pixel of a slider. */
const ANNOUNCE_MS = 500;

/**
 * pooled-vs-tokens: what reaches the action head, every patch token or one
 * pooled vector. The reader moves a cube in a camera frame and sees which of
 * the two representations changes and by how much: whole tokens switch from
 * table to cube, while in the pooled vector at most a few numbers move by a
 * 196th of that step, and a move of a whole patch changes nothing at all.
 * Under the drawing, the measured comparison of the two on the single cube.
 *
 * The drawing is a toy computed in model.ts; the measured rows come from the
 * data module.
 */
export default function PooledVsTokensFigure({ caption }: FigureProps) {
  // The first state, in the static HTML and with reduced motion: the cube already moved, the dashed outline
  // where it was. With motion allowed, the figure goes back to the start on mounting and plays the move once.
  const [now, setNow] = useState<Point>(AFTER);
  const [before, setBefore] = useState<Point>(BEFORE);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(true);
  const progress = useRef(1);
  const touched = useRef(false);

  const stage = useRef<HTMLDivElement>(null);
  const arrived = useInView(stage, { amount: 0.6, once: true });
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();
  const running = playing && onScreen && pageVisible && !reducedMotion;

  /** Play the move from the start: the cube goes from its old place to its new one. */
  const start = () => {
    progress.current = 0;
    setBefore(BEFORE);
    setNow(BEFORE);
    setEnded(false);
    setPlaying(true);
  };

  // With motion allowed, wait at the start of the move, so that the autoplay does not first snap the cube back.
  // The media query is read here, not through the hook: during hydration the hook still gives the server's answer.
  useEffect(() => {
    if (touched.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = requestAnimationFrame(() => {
      if (touched.current) return;
      progress.current = 0;
      setNow(BEFORE);
      setEnded(false);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Autoplay once, when the figure has arrived, unless the reader got there first or asked for less motion.
  useEffect(() => {
    if (!arrived || reducedMotion || touched.current) return;
    const timer = setTimeout(() => {
      if (touched.current) return;
      touched.current = true;
      start();
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [arrived, reducedMotion]);

  // The move, frame by frame, while the figure is on screen in a visible tab. Leaving pauses it where it is.
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (time: number) => {
      progress.current = Math.min(1, progress.current + (time - last) / MOVE_MS);
      last = time;
      setNow(between(BEFORE, AFTER, progress.current));
      if (progress.current >= 1) {
        setPlaying(false);
        setEnded(true);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  /** Any move by the reader stops the played one and keeps the cube where the reader put it. */
  const moveTo = (to: Point) => {
    touched.current = true;
    progress.current = 1;
    setPlaying(false);
    setEnded(true);
    setNow(to);
  };

  const toggle = () => {
    touched.current = true;
    if (playing) {
      setPlaying(false);
    } else if (ended) {
      start();
    } else {
      setPlaying(true);
    }
  };

  const change = compare(before, now);
  const counts = averagePatch(now);
  const moving = playing && !ended;
  const tokenStep = change.tokenNumbers > 0 ? 1 : 0;
  const sameTokens = placesWithSameTokens(now);
  const samePooled = placesWithSamePooled(now);
  const faintValues = listed(pooledValues(counts).map((count) => `${count}/${TOKEN_COUNT}`));

  // The visible status says everything at once; screen readers get a short sentence, once the cube has stopped.
  const announcement = moving ? "Playing the move." : announcedSentence(change, now);
  const [announced, setAnnounced] = useState(announcement);
  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(announcement), ANNOUNCE_MS);
    return () => clearTimeout(timer);
  }, [announcement]);

  const hintId = useId();

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      // The drawing is itself a grid or a table: no graph paper behind it.
      grid={false}
      caption={caption}
      controls={
        <>
          <PlayButton playing={playing} ended={ended} onToggle={toggle} className="motion-reduce:hidden" />
          <Slider
            label="Cube across"
            min={0}
            max={LIMIT.x}
            value={now.x}
            onChange={(x) => moveTo({ ...now, x })}
            format={(value) => `${value} px`}
          />
          <Slider
            label="Cube down"
            min={0}
            max={LIMIT.y}
            value={now.y}
            onChange={(y) => moveTo({ ...now, y })}
            format={(value) => `${value} px`}
          />
          {/* A whole patch across and down: every token the cube touches changes, the pooled vector does not. */}
          <ControlButton
            aria-describedby={`${hintId}-patch`}
            onClick={() => {
              setBefore(now);
              moveTo(onePatchOver(now));
            }}
          >
            Move by one patch
          </ControlButton>
          {/* aria-disabled, not disabled: a disabled button drops the keyboard focus that just pressed it. */}
          <ControlButton
            className={styles.compare}
            aria-disabled={samePoint(before, now)}
            aria-describedby={`${hintId}-mark`}
            onClick={() => {
              if (samePoint(before, now)) return;
              moveTo(now);
              setBefore(now);
            }}
          >
            Start the comparison here
          </ControlButton>
          <span id={`${hintId}-patch`} className="sr-only">
            Moves the cube {PATCH_PX} px across and {PATCH_PX} px down or up, and compares with where it was.
          </span>
          <span id={`${hintId}-mark`} className="sr-only">
            Moves the dashed outline to the cube, so both changes start again from zero.
          </span>
          <ControlButton
            onClick={() => {
              moveTo(AFTER);
              setBefore(BEFORE);
            }}
          >
            Reset
          </ControlButton>
        </>
      }
      status={
        <>
          <span aria-hidden="true">
            {moving
              ? "Playing the move: the cube slides from its dashed outline to its new place."
              : statusSentence(before, now, change)}
          </span>
          <span className="sr-only">{announced}</span>
        </>
      }
      note={
        <>
          The drawing is a toy computed in the browser, not a measurement. A token here is its patch&rsquo;s pixels as
          they are, 1 where the cube is and 0 for the table, and the pooled vector is their mean, one of several ways
          to pool. A real encoder passes the patches through learned layers first and adds a position to each, and a
          trained one can write where a patch is into the values before they are pooled. The cube&rsquo;s outline,{" "}
          {CUBE.width} by {CUBE.height} px, is the median estimated for the front camera; being one patch wide, it adds
          the same to every column of the mean wherever it is, so a sideways move leaves the pooled vector exactly as it
          was. Every count is per image: a policy that gets several images at each step, from more than one camera or
          more than one moment, cuts or pools each of them on its own. Drag the cube, click the frame, or use the
          sliders and buttons.
        </>
      }
    >
      <div ref={stage} className={styles.root}>
        <p className="sr-only">{DRAWING_DESCRIPTION}</p>
        <div className={styles.layout}>
          <div className={styles.frameHead}>
            <h3 className={styles.title}>Camera frame</h3>
            <span className={styles.small}>
              {GRID} &times; {GRID} patches of {PATCH_PX} px
            </span>
          </div>
          <div className={styles.frame}>
            <Frame now={now} before={before} onMove={moveTo} />
          </div>
          <div className={`${styles.frameDim} ${styles.small}`}>
            <span className={styles.dimension}>{FRAME_PX} px</span>
          </div>

          <div className={styles.tokHead}>
            <h3 className={styles.title}>Every patch a token</h3>
            <span className={styles.small}>{TOKEN_COUNT} tokens, in patch order</span>
          </div>
          <div className={styles.tok}>
            <TokenGrid now={now} before={before} changed={change.changed} />
          </div>

          <div className={styles.poolHead}>
            <h3 className={styles.title}>One pooled vector</h3>
            <span className={styles.small}>the mean of the {TOKEN_COUNT} tokens</span>
          </div>
          <div className={styles.pool}>
            <figure className={styles.chip}>
              <PooledChip counts={counts} changed={change.pooledChanged} magnification={1} />
              <figcaption className={styles.small}>
                as the head gets it: {faintValues}, too faint to see
              </figcaption>
            </figure>
            <figure className={styles.chip}>
              <PooledChip counts={counts} changed={change.pooledChanged} magnification={POOLED_MAGNIFICATION} />
              <figcaption className={styles.small}>the same, {POOLED_MAGNIFICATION} times brighter</figcaption>
            </figure>
          </div>

          <ul className={`${styles.key} ${styles.small}`} aria-label="Key">
            <li>
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                <rect x="1" y="1" width="12" height="12" className={styles.cube} />
              </svg>
              Cube pixels: a number of 1; the table is 0
            </li>
            <li>
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                <rect x="1.5" y="1.5" width="11" height="11" className={styles.ghost} />
              </svg>
              Where the cube was
            </li>
            <li>
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                <rect x="1" y="1" width="12" height="12" className={styles.cell} />
                <rect x="1" y="1" width="12" height="12" className={styles.changed} />
              </svg>
              Token changed by the move
            </li>
            <li>
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
                <rect x="1" y="1" width="12" height="12" className={styles.cell} />
                <circle cx="7" cy="7" r="2.5" className={styles.changedNumber} />
              </svg>
              Number changed by the move
            </li>
          </ul>

          {/* First what each representation can tell apart: the tokens say where the cube is, the pooled vector
              does not. Then what the move changed, counted in numbers on both sides, and by how much. */}
          <div className={styles.tokRead}>
            <p className={`${styles.readout} ${styles.lead}`}>
              <strong>{grouped(sameTokens)}</strong> {placesGive(sameTokens)} these tokens
              <span className={`${styles.small} ${styles.ofAll}`}>of {grouped(ALL_PLACES)} in the frame</span>
            </p>
            <p className={styles.readout}>
              Changed by the move:{" "}
              <strong>
                {grouped(change.tokenNumbers)} of {grouped(ALL_TOKEN_NUMBERS)}
              </strong>{" "}
              numbers, in {change.changed.length} of {TOKEN_COUNT} tokens
            </p>
            <p className={styles.readout}>
              Largest change of one number
              <Meter value={tokenStep} text={String(tokenStep)} />
            </p>
          </div>
          <div className={styles.poolRead}>
            <p className={`${styles.readout} ${styles.lead}`}>
              <strong>{grouped(samePooled)}</strong> {placesGive(samePooled)} this vector
              <span className={`${styles.small} ${styles.ofAll}`}>of {grouped(ALL_PLACES)} in the frame</span>
            </p>
            <p className={styles.readout}>
              Changed by the move:{" "}
              <strong>
                {change.pooledChanged.length} of {TOKEN_WIDTH}
              </strong>{" "}
              numbers
            </p>
            <p className={styles.readout}>
              Largest change of one number
              <Meter
                value={change.pooledStep / TOKEN_COUNT}
                text={change.pooledStep > 0 ? pooledShare(change) : "0"}
              />
            </p>
          </div>

          <div className={styles.tokGoes}>
            <span className={styles.arrowDown} aria-hidden="true">
              <svg viewBox="0 0 10 6" width="10" height="6">
                <path d="M0 0 L5 6 L10 0 Z" fill="currentColor" />
              </svg>
            </span>
            <span className={styles.head}>
              <span className={styles.title}>Action head</span>
              <span className={styles.small}>reads {TOKEN_COUNT} tokens per image</span>
            </span>
          </div>
          <div className={styles.poolGoes}>
            <span className={styles.arrowDown} aria-hidden="true">
              <svg viewBox="0 0 10 6" width="10" height="6">
                <path d="M0 0 L5 6 L10 0 Z" fill="currentColor" />
              </svg>
            </span>
            <span className={styles.head}>
              <span className={styles.title}>Action head</span>
              <span className={styles.small}>reads 1 vector per image</span>
            </span>
          </div>

          {MEASURED ? (
            <div className={styles.measuredArea}>
              <Measured data={MEASURED} />
            </div>
          ) : null}
        </div>
      </div>
    </FigureFrame>
  );
}
