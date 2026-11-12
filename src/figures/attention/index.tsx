"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Segmented,
  Stepper,
  Toggle,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { ChangeNote, Matrix, ShadeKey, type RowChange, type Stage } from "./Matrix";
import { CHAPTER_VECTORS, LENGTH, SCALE, TOKENS, attention, drawVectors, formatNumber, readRow, sameWeights } from "./model";
import { Readout, phraseText, quote, stepPhrase } from "./Readout";
import "./attention.css";

const info = FIGURES.attention;

const STAGES = ["scores", "mask", "softmax per row"] as const;
const LAST_STAGE: Stage = 2;

/** One step every 1.6 s while playing: the 0.6 s beat, then time to read the numbers. */
const STEP_MS = 1600;

type Source = "chapter" | "drawn";


/**
 * "An attention matrix". The sentence of chapter 11, one token per word, with
 * a query and a key of four numbers per token. The figure computes, in the
 * browser, the scores (query times key over √4), applies the causal mask and
 * takes a softmax per row, one step at a time. The reader can
 *
 *   - step (or play) through scores, mask, softmax;
 *   - switch the causal mask off, and see every row spread over the sentence;
 *   - focus a row and read its computation in full;
 *   - grow the sequence one token at a time, and see that with the mask on a
 *     new last row leaves every earlier row unchanged (chapter 14, the cache);
 *   - swap the chapter's hand-picked vectors for a seeded random draw, to see
 *     that none of this depends on the numbers.
 */
export default function AttentionFigure({ caption }: FigureProps) {
  const [stage, setStage] = useState<Stage>(LAST_STAGE);
  const [playing, setPlaying] = useState(false);
  const [causal, setCausal] = useState(true);
  const [length, setLength] = useState<number>(LENGTH);
  const [focus, setFocus] = useState<number>(LENGTH - 1);
  const [source, setSource] = useState<Source>("chapter");
  const [seed, setSeed] = useState(1);

  const vectors = useMemo(() => (source === "chapter" ? CHAPTER_VECTORS : drawVectors(seed)), [source, seed]);
  const rows = useMemo(() => attention(vectors, length, causal), [vectors, length, causal]);
  // The focused row never lies outside the sequence; it comes back when the sequence grows again.
  const reader = Math.min(focus, length - 1);
  const reading = rows[reader];

  // Each row against the same row before the last token was added.
  const changes = useMemo<RowChange[] | null>(() => {
    if (stage !== 2 || length < 2) return null;
    return rows.map((row, index) =>
      index === length - 1 ? "new" : sameWeights(row, readRow(vectors, index, length - 1, causal)) ? "same" : "changed",
    );
  }, [rows, vectors, length, causal, stage]);

  // Play pauses when the whole figure leaves the screen, not the stage alone: on a phone the stage is
  // taller than the screen, and a reader at the control bar has scrolled most of it away.
  const figureRef = useRef<HTMLElement | null>(null);
  const rootRef = useCallback((element: HTMLDivElement | null) => {
    figureRef.current = element?.closest("figure") ?? null;
  }, []);
  const onScreen = useInView(figureRef, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  // The steps play only while the figure is on screen in a visible tab, and never under reduced motion.
  const active = playing && stage < LAST_STAGE;
  const running = active && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setStage((current) => Math.min(LAST_STAGE, current + 1) as Stage), STEP_MS);
    return () => clearTimeout(timer);
  }, [running, stage]);

  // On the reader's intent (`active`), not on whether the timer runs right now: while the figure is
  // paused off screen the button still says Pause, and a click always does what it says.
  const togglePlay = () => {
    if (active) {
      setPlaying(false);
      return;
    }
    // From the end, play starts again at the scores.
    if (stage >= LAST_STAGE) setStage(0);
    setPlaying(true);
  };

  const token = quote(TOKENS[reader]);
  const last = quote(TOKENS[length - 1]);
  const changed = changes ? changes.filter((change) => change === "changed").length : 0;
  const sequence = TOKENS.slice(0, length).join(" ");

  const summary =
    stage === 0
      ? `Attention scores for "${sequence}", query times key over ${SCALE}. Rows are the reading tokens, columns the tokens read.`
      : stage === 1
        ? `Attention scores for "${sequence}" with the causal mask ${causal ? "applied: every score above the diagonal is minus infinity" : "off: no score is changed"}. Rows are the reading tokens, columns the tokens read.`
        : `Attention weights for "${sequence}", causal mask ${causal ? "on: every weight above the diagonal is 0" : "off: every row spreads over the whole sequence"}. Each row adds up to 1. Rows are the reading tokens, columns the tokens read.`;

  const cacheSentence =
    changes && length > 1
      ? changed === 0
        ? ` Adding ${last} left every earlier row unchanged.`
        : ` Adding ${last} changed ${changed === length - 1 ? "every earlier row" : `${changed} of the ${length - 1} earlier rows`}.`
      : "";

  const status = `Step ${stage + 1} of 3, ${STAGES[stage]}. Mask ${causal ? "on" : "off"}, ${length} ${length === 1 ? "token" : "tokens"}. ${
    stage === 2
      ? `${token} reads ${reading.weights
          .map((weight, read) => `${quote(TOKENS[read])} ${reading.mask[read] === 0 ? formatNumber(weight, 3) : "0"}`)
          .join(", ")}.`
      : stage === 0
        ? `Scores of ${token}: ${reading.scores.map((score, read) => `${quote(TOKENS[read])} ${formatNumber(score, 2)}`).join(", ")}.`
        : phraseText(stepPhrase(reader, reading, stage, causal))
  }${cacheSentence}`;

  const note =
    source === "chapter"
      ? `Computed in your browser; nothing is measured or learned. Queries and keys of four numbers, picked by hand so that the row of ${quote("cube")} gives the chapter's worked example. Scores are divided by √4 = ${SCALE}.`
      : `Computed in your browser; nothing is measured or learned. Queries and keys of four numbers, each drawn from a normal distribution with seed ${seed} and rounded to one decimal. Scores are divided by √4 = ${SCALE}.`;

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      note={note}
      status={status}
      controls={
        <>
          <PlayButton playing={active} ended={stage >= LAST_STAGE} onToggle={togglePlay} className="motion-reduce:hidden" />
          <Stepper
            label="step"
            value={stage}
            max={LAST_STAGE}
            format={(value) => `${value + 1} of 3: ${STAGES[value]}`}
            onChange={(next) => {
              setPlaying(false);
              setStage(next as Stage);
            }}
          />
          <Toggle label="Causal mask" checked={causal} onChange={setCausal} />
          <Stepper
            label="sequence length"
            value={length}
            min={1}
            max={LENGTH}
            format={(value, max) => `${value} of ${max} tokens`}
            onChange={setLength}
          />
          <Segmented
            label="Queries and keys"
            showLabel
            options={[
              { value: "chapter", label: "Chapter's example" },
              { value: "drawn", label: `Seed ${seed}` },
            ]}
            value={source}
            onChange={setSource}
          />
          {source === "drawn" ? (
            <ControlButton onClick={() => setSeed((current) => current + 1)}>Next seed</ControlButton>
          ) : null}
          <ControlButton
            onClick={() => {
              setPlaying(false);
              setStage(LAST_STAGE);
              setCausal(true);
              setLength(LENGTH);
              setFocus(LENGTH - 1);
              setSource("chapter");
              setSeed(1);
            }}
          >
            Reset
          </ControlButton>
        </>
      }
    >
      <div ref={rootRef} className="at-root">
        <div className="at-layout">
          <div className="at-matrix-block">
            <p className="at-label">
              Rows: the token reading (its query). Columns: the token read (its key).
            </p>
            <div className="at-scroll">
              <Matrix rows={rows} stage={stage} focused={reader} onFocus={setFocus} changes={changes} summary={summary} />
            </div>
            <ShadeKey stage={stage} />
            <ChangeNote changes={changes} length={length} cacheSentence={cacheSentence.trim()} />
          </div>
          <Readout reader={reader} reading={reading} vectors={vectors} stage={stage} causal={causal} />
        </div>
      </div>
    </FigureFrame>
  );
}
