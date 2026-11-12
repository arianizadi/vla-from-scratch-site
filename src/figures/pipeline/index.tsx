"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Stepper,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { AllCommands } from "./AllCommands";
import {
  EXCHANGE_FIRST,
  EXCHANGE_LAST,
  LOOP_SUMMARY,
  PLAY_ROUNDS,
  RUN_CONFIG,
  STATION_INDEX,
  STATIONS,
  STEPS,
  firstStepAt,
  type StationId,
} from "./content";
import { Details } from "./Details";
import { Loop } from "./Loop";
import "./pipeline.css";

const info = FIGURES.pipeline;
const LAST = STEPS.length - 1;

/** How long the item stays at a step while playing: long enough to read the line under the loop. */
const DWELL_MS = 3600;
/** The exchange between simulator and server has shorter sentences. */
const EXCHANGE_DWELL_MS = 3000;

const inExchange = (step: number) => step >= EXCHANGE_FIRST && step <= EXCHANGE_LAST;

/**
 * The item travels along an arrow only forward to the next step, and never into
 * a step where it appears; going back or jumping, it appears at its station, so
 * a label is never seen moving against its arrow.
 */
const travels = (from: number, to: number) => to === from + 1 && !STEPS[to].appears;

/** "Step 8 of 10, query 1": the exchange steps say which query they belong to, so a repeat does not read as going back. */
function counter(step: number, round: number): string {
  const base = `Step ${step + 1} of ${STEPS.length}`;
  return inExchange(step) ? `${base}, query ${round + 1}` : base;
}

/**
 * pipeline: the whole loop on one plate. Eight stations, from the scripted
 * expert to the success rate, alternately a program and the files it writes.
 * One item travels through them (Play, or step with Previous and Next); its
 * label names what travels along the arrow it has just crossed. Under the loop
 * one line says what is happening; under that, the station the item is at, with
 * its command and files on demand. The stations are one tab stop: the arrow keys
 * move between them.
 *
 * Schematic: the commands and paths are the repository's own, from content.ts;
 * nothing on the plate is measured.
 */
export default function PipelineFigure({ caption }: FigureProps) {
  const [step, setStep] = useState(0);
  // Which query of the simulator-server exchange this is, while playing.
  const [round, setRound] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(false);
  // The token's identity: it changes when the item should appear rather than travel.
  const [hop, setHop] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  const uid = useId();
  const detailsId = `${uid}-details`;
  const tableId = `${uid}-table`;
  const hintId = `${uid}-hint`;

  const stage = useRef<HTMLDivElement>(null);
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const move = (from: number, to: number) => {
    const travel = travels(from, to);
    if (!travel) setHop((value) => value + 1);
    setFadeIn(!travel && !reducedMotion);
    setStep(to);
  };

  // The item moves only while the figure is on screen in a visible tab, never under reduced motion.
  const running = playing && step < LAST && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => {
        if (step === EXCHANGE_LAST && round < PLAY_ROUNDS - 1) {
          setRound(round + 1);
          setFadeIn(false);
          setStep(EXCHANGE_FIRST);
        } else {
          const travel = travels(step, step + 1);
          if (!travel) setHop((value) => value + 1);
          setFadeIn(!travel);
          setStep(step + 1);
        }
      },
      inExchange(step) ? EXCHANGE_DWELL_MS : DWELL_MS,
    );
    return () => clearTimeout(timer);
  }, [running, step, round]);

  const goTo = (next: number) => {
    setPlaying(false);
    setRound(0);
    move(step, next);
  };

  const select = (station: StationId) => {
    // A click on the station the item is already at leaves it where it is.
    if (STEPS[step].station === station) {
      setPlaying(false);
      return;
    }
    goTo(firstStepAt(station));
  };

  const toggle = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    if (step >= LAST) {
      setRound(0);
      move(step, 0);
    }
    // The command and files fold away, so the controls stay next to the loop while the item moves.
    setOpen(false);
    setPlaying(true);
  };

  const current = STEPS[step];
  const stationIndex = STATION_INDEX[current.station];
  const station = STATIONS[stationIndex];
  const text = round > 0 && current.again ? current.again : current.text;
  const where = `${stationIndex + 1}. ${station.name}`;
  // Announced: while playing only where the item is, which can be said before the next step; otherwise the sentence too.
  const announced = running
    ? `${where}: ${current.item}`
    : `${counter(step, round)}, at ${where}: ${current.item}. ${text}`;

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      status={<span className="sr-only">{announced}</span>}
      note={
        <>
          Schematic. The commands and paths are the repository&rsquo;s README recipe, with its names (dataset{" "}
          <code>pick_target_4k</code>, run <code>my_run</code>, config <code>{RUN_CONFIG}</code>). The chapters&rsquo;
          recipe makes its demonstrations with the same command without <code>--random_start --disturb_prob 0.5</code>.
          The settings quoted are the defaults the chapters describe. The moving item follows one demonstration into
          training and then one evaluation episode out of it; nothing on this plate is measured.
        </>
      }
      controls={
        <>
          <PlayButton playing={running} ended={step >= LAST} onToggle={toggle} className="motion-reduce:hidden" />
          <Stepper label="step" value={step} max={LAST} onChange={goTo} format={(value) => counter(value, round)} />
          <ControlButton
            aria-expanded={showAll}
            aria-controls={showAll ? tableId : detailsId}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show one station" : "Show every command"}
          </ControlButton>
        </>
      }
    >
      <MotionConfig reducedMotion="user">
        <div ref={stage} className="pl-root">
          <p className="sr-only">{LOOP_SUMMARY}</p>
          <p id={hintId} className="sr-only">
            The arrow keys move between the stations; the panel under the loop describes the selected one.
          </p>
          <ul className="pl-key" aria-hidden="true">
            <li>
              <svg className="pl-key-card" viewBox="0 0 18 14">
                <rect
                  x="0.5"
                  y="0.5"
                  width="17"
                  height="13"
                  rx="1.5"
                  style={{
                    fill: "var(--surface)",
                    stroke: "var(--border-strong)",
                  }}
                />
              </svg>
              a program
            </li>
            <li>
              <svg className="pl-key-card" viewBox="0 0 18 14">
                <path
                  d="M0.5 0.5 H12.5 L17.5 5.5 V13.5 H0.5 Z"
                  style={{
                    fill: "var(--surface)",
                    stroke: "var(--border-strong)",
                  }}
                />
                <path d="M12.5 0.5 V5.5 H17.5 Z" style={{ fill: "var(--border-strong)" }} />
              </svg>
              files it writes, read by the next program
            </li>
            <li>
              <span className="pl-key-token">item</span>
              what has just travelled along the arrow
            </li>
          </ul>
          <Loop
            current={current.station}
            item={current.item}
            tokenKey={`${uid}-token-${hop}`}
            fadeIn={fadeIn}
            onSelect={select}
            controlsId={showAll ? tableId : detailsId}
            hintId={hintId}
          />
          {/* What is happening now, right under the loop, so the item and the sentence are seen together. */}
          <p className="pl-now" aria-hidden="true">
            <span className="pl-now-where">
              {counter(step, round)} &middot; {where}
            </span>{" "}
            {text}
          </p>
          {showAll ? (
            <AllCommands id={tableId} current={current.station} />
          ) : (
            // In the wide layout every station's panel is drawn in the same cell and only the current one
            // is shown, so the panel keeps the height of the tallest and the controls do not move while
            // playing. In the narrow one only the current panel is drawn.
            <div id={detailsId} className="pl-details-stack">
              {STATIONS.map((item, index) => (
                <Details
                  key={item.id}
                  id={`${detailsId}-${item.id}`}
                  station={item}
                  number={index + 1}
                  hidden={index !== stationIndex}
                  open={open}
                  onToggle={() => setOpen(!open)}
                />
              ))}
            </div>
          )}
        </div>
      </MotionConfig>
    </FigureFrame>
  );
}
