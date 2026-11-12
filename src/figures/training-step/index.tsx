"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Slider,
  Stepper,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { Batch, BatchLegend } from "./Batch";
import { Landscape, LandscapeKey } from "./Landscape";
import {
  BATCH,
  DIVERGE_RATE,
  GRADIENT_DIGITS,
  LOSS_DIGITS,
  MINIMUM,
  MINIMUM_LOSS,
  OVERSHOOT_RATE,
  RATE,
  SQUARE_DIGITS,
  STAGES,
  STAGE_NAME,
  STEPS,
  VISIBLE_OVERSHOOT,
  ZIGZAG_RATE,
  approx,
  change,
  loss,
  lossDigits,
  num,
  overshootFactor,
  pass,
  rateText,
  regime,
  trajectory,
  type Weights,
} from "./model";
import { LossHistory, StageStrip, Worksheet } from "./Worksheet";
import "./training-step.css";

const info = FIGURES["training-step"];

/** Positions: four stages per optimisation step. */
const LAST = STEPS * STAGES.length - 1;
/** Time on each stage while playing: an explanatory beat and time to read it. */
const BEAT_MS = 1700;
/**
 * Width each drawing is laid out at until its panel is measured, and in the
 * static HTML. Whether the two drawings sit side by side is decided in CSS (a
 * container query), so the first paint already has the right layout at any
 * width; only the drawings' internal scale settles after measurement.
 */
const FALLBACK_WIDTH = 360;

function locate(position: number) {
  return { step: Math.floor(position / STAGES.length) + 1, stage: position % STAGES.length };
}

function pair(weights: Weights): string {
  return `w = ${num(weights.w)}, b = ${num(weights.b)}`;
}

/** What the rate does on this batch, with its thresholds, in terms of what the drawing shows. */
function regimeText(rate: number): string {
  const overshoot = rateText(OVERSHOOT_RATE);
  const diverge = rateText(DIVERGE_RATE);
  const factor = overshootFactor(rate);
  switch (regime(rate)) {
    case "creeps":
      return `Up to ${overshoot} no step overshoots: the weights slide down one side of the valley.`;
    case "overshoots": {
      const head = `From ${overshoot} to ${diverge} each step overshoots the valley floor and lands ${Math.round(factor * 100)}% as far past it as it was before, so the weights settle.`;
      return factor >= VISIBLE_OVERSHOOT
        ? `${head} The zigzag shows in the trail.`
        : `${head} Too little to see: from about ${rateText(ZIGZAG_RATE)} the trail zigzags.`;
    }
    case "diverges":
      return `From ${diverge} each overshoot is ${num(Math.abs(factor))} times the last: the weights swing out and the loss grows without limit.`;
  }
}

function statusText(step: number, stage: number, before: Weights, after: Weights, rate: number): string {
  const current = pass(before);
  const head = `Step ${step} of ${STEPS}, ${STAGE_NAME[STAGES[stage]].toLowerCase()}:`;
  switch (stage) {
    case 0:
      return `${head} with ${pair(before)} the model predicts ${current.rows.map((row) => num(row.prediction)).join(", ")} for the inputs ${current.rows.map((row) => num(row.x, 0)).join(", ")}.`;
    case 1:
      return `${head} the squared errors are ${current.rows.map((row) => num(row.squared, SQUARE_DIGITS)).join(", ")}; their mean, the loss, is ${approx(current.loss, LOSS_DIGITS, current.lossExact)}.`;
    case 2:
      return `${head} the gradient is ${num(current.gradient.w, GRADIENT_DIGITS)} for w and ${num(current.gradient.b, GRADIENT_DIGITS)} for b. It points the way the loss rises fastest.`;
    default: {
      const lossAfter = loss(after);
      const digits = lossDigits(current.loss, lossAfter);
      const outcome = change(current.loss, lossAfter);
      const moved =
        outcome === "unchanged" && before.w === after.w && before.b === after.b
          ? `the step rounds to zero: the weights stay at ${pair(before)} and the loss at ${num(current.loss, digits)}`
          : `the weights move from ${pair(before)} to ${pair(after)}, and the loss ${outcome === "lower" ? "falls" : outcome === "higher" ? "rises" : "stays the same,"} from ${num(current.loss, digits)} to ${num(lossAfter, digits)}`;
      // What the rate does is in the regime line under the table; the status stays short, so the
      // control bar does not grow on this stage.
      return `${head} with learning rate ${rateText(rate)} ${moved}.`;
    }
  }
}

function landscapeLabel(step: number, stage: number, before: Weights, after: Weights): string {
  const current = pass(before);
  const parts = [
    `The loss over every value of the two weights, drawn as contour lines around its lowest value, ${num(MINIMUM_LOSS)} at ${pair(MINIMUM)}.`,
    `Before step ${step} the weights are at ${pair(before)}${stage >= 1 ? `, where the loss is ${num(current.loss)}` : ""}.`,
  ];
  if (step > 1) parts.push(`The ${step - 1 === 1 ? "earlier step is" : `${step - 1} earlier steps are`} marked along the way.`);
  if (stage >= 2) {
    const length = Math.hypot(current.gradient.w, current.gradient.b);
    parts.push(`An arrow shows the gradient, length ${num(length)}, pointing uphill across the contour line.`);
  }
  if (stage >= 3) {
    parts.push(
      `The step goes the other way, drawn to the same scale, to ${pair(after)}, where the loss is ${num(loss(after))}; a dashed contour line marks that loss.`,
    );
  }
  return parts.join(" ");
}

function batchLabel(stage: number, before: Weights, after: Weights): string {
  const shown = stage >= 3 ? after : before;
  const rows = pass(shown).rows;
  const examples = BATCH.map((example) => `(${num(example.x)}, ${num(example.y)})`).join(", ");
  const line = `The model line with ${pair(shown)} predicts ${rows.map((row) => num(row.prediction)).join(", ")}.`;
  const current = pass(before);
  const extra =
    stage === 1
      ? ` Each gap between prediction and target is marked, and under the plot each error is drawn squared, as a square: ${current.rows.map((row) => num(row.squared, SQUARE_DIGITS)).join(", ")}.`
      : stage === 2
        ? ` Arrows on the gaps show which way each example pulls its prediction. Under the plot a bar for each example shows its part of the gradient for w, 2(ŷ − y)·x: ${current.rows.map((row) => num(row.gradW)).join(", ")}; an input far from 0 counts more, and the example at x = 0 not at all.`
        : stage === 3
          ? ` The line before the step, with ${pair(before)}, is drawn faint, and under the plot the squared errors after the step are drawn over those before it.`
          : "";
  return `Four examples as (input, target) points: ${examples}. ${line}${extra}`;
}

/**
 * training-step: one optimisation step of a model small enough to show every
 * number, a line w * x + b fitted to four points. A stepper walks the four
 * stages (forward, loss, backward, update) through up to eight steps; the
 * learning rate sets how far each update goes, and a large one overshoots.
 * Everything is computed in model.ts, in the browser.
 */
export default function TrainingStepFigure({ caption }: FigureProps) {
  const [rate, setRate] = useState<number>(RATE.initial);
  // null until the reader (or the one autoplay) moves: then the first state depends on reduced motion.
  const [position, setPosition] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [stopAt, setStopAt] = useState(LAST);

  const root = useRef<HTMLDivElement>(null);
  const landscapeBox = useRef<HTMLDivElement>(null);
  const batchBox = useRef<HTMLDivElement>(null);
  const landscapeWidth = useElementSize(landscapeBox).width || FALLBACK_WIDTH;
  const batchWidth = useElementSize(batchBox).width || FALLBACK_WIDTH;
  const onScreen = useInView(root, { amount: 0.25 });
  const arrived = useInView(root, { amount: 0.6, once: true });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  // With reduced motion the figure opens on its finished state: the whole of step 1.
  const shown = position ?? (reducedMotion ? STAGES.length - 1 : 0);
  const { step, stage } = locate(shown);

  const running = playing && shown < stopAt && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setPosition((current) => Math.min(stopAt, (current ?? 0) + 1));
    }, BEAT_MS);
    return () => clearInterval(timer);
  }, [running, stopAt]);

  // Autoplay once: when the figure has arrived, walk the four stages of step 1 and stop.
  const autoplayed = useRef(false);
  useEffect(() => {
    if (!arrived || reducedMotion || position !== null || autoplayed.current) return;
    const timer = setTimeout(() => {
      autoplayed.current = true;
      setPosition(0);
      setStopAt(STAGES.length - 1);
      setPlaying(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [arrived, reducedMotion, position]);

  const path = useMemo(() => trajectory(rate), [rate]);
  const before = path[step - 1];
  const after = path[step];


  const goTo = (next: number) => {
    autoplayed.current = true;
    setPlaying(false);
    setPosition(Math.max(0, Math.min(LAST, next)));
  };

  const toggle = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    autoplayed.current = true;
    if (shown >= LAST) setPosition(0);
    else setPosition(shown);
    setStopAt(LAST);
    setPlaying(true);
  };

  const stepper = (className: string) => (
    <Stepper
      label="stage"
      value={shown}
      max={LAST}
      onChange={goTo}
      format={(value) => {
        const where = locate(value);
        return `Step ${where.step}, ${STAGE_NAME[STAGES[where.stage]].toLowerCase()}`;
      }}
      className={className}
    />
  );

  // A point's loss is known from its loss stage on; the landing point's from the update, and so
  // at the next step's forward stage too.
  const known = step === 1 && stage === 0 ? 0 : step + (stage === STAGES.length - 1 ? 1 : 0);

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      grid={false}
      caption={caption}
      note={
        <>
          Computed in the browser: plain gradient descent on a batch of four made-up examples, with a squared-error
          loss. The weights are kept to two decimals after every step, so every number in the table can be checked
          by hand; a value that had to be rounded to be shown is marked &asymp;. The training loops in the chapters
          use AdamW, which rescales each weight&rsquo;s step, and clip the gradient; the four stages are the same.
        </>
      }
      status={statusText(step, stage, before, after, rate)}
      controls={
        <>
          <PlayButton playing={running} ended={shown >= LAST} onToggle={toggle} className="motion-reduce:hidden" />
          {stepper("ts-stepper ts-stepper-bar")}
          <Slider
            label="Learning rate"
            min={RATE.min}
            max={RATE.max}
            step={RATE.step}
            value={rate}
            onChange={(next) => {
              setRate(next);
              // The rate acts in the update: show it there, for the step in view.
              goTo((step - 1) * STAGES.length + STAGES.length - 1);
            }}
            format={rateText}
          />
          <ControlButton
            onClick={() => {
              autoplayed.current = true;
              setPlaying(false);
              setRate(RATE.initial);
              setPosition(null);
            }}
          >
            Reset
          </ControlButton>
        </>
      }
    >
      <div ref={root} className="ts-root">
        {/* On a phone the control bar is far below the drawings: step from here instead. */}
        <div className="ts-stepper-top">{stepper("ts-stepper")}</div>

        <StageStrip
          stage={stage}
          before={before}
          after={after}
          onSelect={(index) => goTo((step - 1) * STAGES.length + index)}
        />

        <div className="ts-panels">
          <section className="ts-panel" aria-label="Weight space">
            <p className="ts-panel-title">
              Weight space <span className="ts-panel-sub">loss for every w and b</span>
            </p>
            <LandscapeKey stage={stage} />
            <div ref={landscapeBox} className="ts-drawing">
              <Landscape
                width={landscapeWidth}
                path={path}
                step={step}
                stage={stage}
                label={landscapeLabel(step, stage, before, after)}
              />
            </div>
          </section>
          <section className="ts-panel" aria-label="The batch">
            <p className="ts-panel-title">
              The batch <span className="ts-panel-sub">four examples</span>
            </p>
            <BatchLegend stage={stage} />
            <div ref={batchBox} className="ts-drawing">
              <Batch width={batchWidth} before={before} after={after} stage={stage} label={batchLabel(stage, before, after)} />
            </div>
          </section>
        </div>

        <Worksheet stage={stage} before={before} after={after} rate={rate} />
        <Regime rate={rate} />
        <LossHistory path={path} count={known} />
      </div>
    </FigureFrame>
  );
}

/** Rates that give the longest regime texts: laid out unseen, so the line keeps its height as the rate moves. */
const REGIME_SAMPLES = [RATE.min, (OVERSHOOT_RATE + ZIGZAG_RATE) / 2, (ZIGZAG_RATE + DIVERGE_RATE) / 2, RATE.max];

/** The regime line and a scale of the learning rate with its thresholds, so the reader knows where to drag. */
function Regime({ rate }: { rate: number }) {
  const at = (value: number) => `${((value - RATE.min) / (RATE.max - RATE.min)) * 100}%`;
  const bands = [
    { from: RATE.min, to: OVERSHOOT_RATE, name: "no overshoot" },
    { from: OVERSHOOT_RATE, to: DIVERGE_RATE, name: "overshoots, settles" },
    { from: DIVERGE_RATE, to: RATE.max, name: "grows" },
  ];
  return (
    <div className="ts-regime">
      <div className="ts-regime-text">
        {REGIME_SAMPLES.map((sample) => (
          <p key={sample} className="ts-regime-ghost" aria-hidden="true">
            {regimeText(sample)}
          </p>
        ))}
        <p>{regimeText(rate)}</p>
      </div>
      <div className="ts-rate-scale" aria-hidden="true">
        <div className="ts-rate-track">
          {bands.map((band, index) => (
            <span key={band.name} className={`ts-rate-band ts-rate-band-${index}`} style={{ left: at(band.from), width: `calc(${at(band.to)} - ${at(band.from)})` }} />
          ))}
          {[OVERSHOOT_RATE, ZIGZAG_RATE, DIVERGE_RATE].map((value) => (
            <span key={value} className="ts-rate-tick" style={{ left: at(value) }} />
          ))}
          <span className="ts-rate-now" style={{ left: at(rate) }} />
        </div>
        <div className="ts-rate-names">
          {bands.map((band) => (
            <span key={band.name} style={{ left: at(band.from), width: `calc(${at(band.to)} - ${at(band.from)})` }}>
              {band.name}
            </span>
          ))}
        </div>
        <div className="ts-rate-values">
          {[OVERSHOOT_RATE, ZIGZAG_RATE, DIVERGE_RATE].map((value) => (
            <span key={value} style={{ left: at(value) }}>
              {rateText(value)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
