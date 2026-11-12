"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { paddedBatch, tokenizations, tokenizer } from "@/data/tokens";
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
import { CORPUS, EXTRA_WORD, trainBpe, type CorpusWord } from "./bpe";
import { MergeView, mergeStatus } from "./MergeView";
import { SentenceView, TokenStatus, lastWord, piecesOf } from "./SentenceView";
import "./tokenizer.css";

const info = FIGURES.tokenizer;

type View = "sentence" | "merges";

// The toy merges come first: the chapter places the figure right after the worked merges of the toy corpus.
const VIEWS = [
  { value: "merges", label: "Toy merges" },
  { value: "sentence", label: "Tokenizer used here" },
] as const;

/** One merge every 1.4 s while playing: the 0.6 s beat of the merge, then time to read the new counts. */
const STEP_MS = 1400;

const SENTENCES = tokenizations();

// The robot's instructions are the sentences the padded batch of the data module is made of.
const BATCH_TEXT = paddedBatch().map((row) => row.text);
const isInstruction = (text: string) => BATCH_TEXT.some((row) => row.includes(text));
const INSTRUCTIONS = SENTENCES.map((sentence, index) => ({ sentence, index })).filter(({ sentence }) =>
  isInstruction(sentence.text),
);
const OTHERS = SENTENCES.map((sentence, index) => ({ sentence, index })).filter(
  ({ sentence }) => !isInstruction(sentence.text),
);

const listWords = (corpus: readonly CorpusWord[]) => corpus.map(({ word, count }) => `${word} ×${count}`).join(", ");

/**
 * "A sentence becomes tokens". Two views of one idea:
 *
 *   Toy merges            byte-pair encoding on the chapter's four-word
 *                         corpus, computed in the browser, one merge per step.
 *   Tokenizer used here   a sentence, cut into the tokens and ids the models
 *                         of the tutorial receive (from the data module);
 *                         the reader picks the sentence and a token.
 */
export default function TokenizerFigure({ caption }: FigureProps) {
  const [view, setView] = useState<View>("merges");

  // Tokenizer used here.
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [tokenIndex, setTokenIndex] = useState(() => lastWord(piecesOf(SENTENCES[0])));
  const sentence = SENTENCES[sentenceIndex];

  // Toy merges.
  const [extra, setExtra] = useState(false);
  const [merges, setMerges] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fresh, setFresh] = useState(false);
  const corpus = useMemo(() => (extra ? [...CORPUS, EXTRA_WORD] : CORPUS), [extra]);
  const run = useMemo(() => trainBpe(corpus), [corpus]);
  const lastMerge = run.merges.length;
  // The two corpora end after different numbers of merges; the step shown never passes the end.
  const step = Math.min(merges, lastMerge);

  const stage = useRef<HTMLDivElement>(null);
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();
  const name = useId();
  const selectId = `${name}-sentence`;

  // The merges play only while the figure is on screen in a visible tab, and never under reduced motion.
  const running = view === "merges" && playing && step < lastMerge && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      setFresh(true);
      setMerges(step + 1);
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [running, step]);

  // The two views differ in height and the view switch sits under the stage: after a switch, scroll the page by
  // as much as the switch moved, so that it stays under the pointer instead of the page jumping.
  const viewSwitch = useRef<HTMLDivElement>(null);
  const switchTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    const before = switchTop.current;
    switchTop.current = null;
    const element = viewSwitch.current;
    if (before === null || !element) return;
    const shift = element.getBoundingClientRect().top - before;
    if (Math.abs(shift) >= 1) window.scrollBy({ top: shift, behavior: "instant" });
  }, [view]);

  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    // Play applies the next merge at once; from the end it starts over.
    setFresh(step < lastMerge);
    setMerges(step >= lastMerge ? 0 : step + 1);
    setPlaying(true);
  };

  const controls =
    view === "sentence" ? (
      <div className="fig-field">
        <label htmlFor={selectId} className="fig-label">
          Sentence
        </label>
        <span className="tk-select">
          <select
            id={selectId}
            value={sentenceIndex}
            onChange={(event) => {
              const index = Number(event.target.value);
              setSentenceIndex(index);
              setTokenIndex(lastWord(piecesOf(SENTENCES[index])));
            }}
          >
            <optgroup label="The robot's instructions">
              {INSTRUCTIONS.map(({ sentence: option, index }) => (
                <option key={index} value={index}>
                  {option.text}
                </option>
              ))}
            </optgroup>
            <optgroup label="Other sentences">
              {OTHERS.map(({ sentence: option, index }) => (
                <option key={index} value={index}>
                  {option.text}
                </option>
              ))}
            </optgroup>
          </select>
          <Glyph name="chevron" />
        </span>
      </div>
    ) : (
      <>
        <PlayButton playing={running} ended={step >= lastMerge} onToggle={togglePlay} className="motion-reduce:hidden" />
        <Stepper
          label="merge"
          value={step}
          max={lastMerge}
          format={(value, max) => (value === 0 ? "No merges yet" : `Merge ${value} of ${max}`)}
          onChange={(next) => {
            setPlaying(false);
            setFresh(next > step);
            setMerges(next);
          }}
        />
        <Toggle
          label={`Add ${EXTRA_WORD.word} ×${EXTRA_WORD.count} to the corpus`}
          checked={extra}
          onChange={(checked) => {
            // The merges are learned again from the new corpus; the step stays where it is.
            setPlaying(false);
            setFresh(false);
            setExtra(checked);
            setMerges(step);
          }}
        />
        <ControlButton
          onClick={() => {
            setPlaying(false);
            setFresh(false);
            setExtra(false);
            setMerges(0);
          }}
        >
          Reset
        </ControlButton>
      </>
    );

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      controls={
        <>
          <div ref={viewSwitch}>
            <Segmented
              label="View"
              options={VIEWS}
              value={view}
              onChange={(next) => {
                switchTop.current = viewSwitch.current?.getBoundingClientRect().top ?? null;
                setPlaying(false);
                setFresh(false);
                setView(next);
              }}
            />
          </div>
          {controls}
        </>
      }
      status={
        view === "sentence" ? <TokenStatus sentence={sentence} selected={tokenIndex} /> : mergeStatus(run, step, running)
      }
      note={
        view === "sentence" ? (
          <>
            Pieces and ids as the tokenizer published with <code>{tokenizer.name}</code> returns them; the from-scratch
            models of the tutorial use it. The ids were produced beforehand with the tokenizer&rsquo;s published files and
            are read from the site&rsquo;s data, not computed in your browser. The open box is a space: it is kept at the
            front of the token that follows it.
          </>
        ) : (
          <>
            Computed in your browser on the toy corpus of the text
            {extra ? ", with the word of its first exercise added" : ""} ({listWords(corpus)}). Pairs are counted
            inside a word, each occurrence as often as its word occurs. Of two pairs with the same count, the one
            that comes first in the corpus is merged.
          </>
        )
      }
    >
      <div ref={stage} className="tk-root">
        {view === "sentence" ? (
          <SentenceView sentence={sentence} selected={tokenIndex} onSelect={setTokenIndex} name={name} />
        ) : (
          <MergeView
            run={run}
            merges={step}
            fresh={fresh}
            onStep={(next) => {
              setPlaying(false);
              setFresh(next === step + 1);
              setMerges(next);
            }}
            name={name}
          />
        )}
      </div>
    </FigureFrame>
  );
}
