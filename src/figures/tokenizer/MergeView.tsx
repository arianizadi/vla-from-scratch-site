import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { ControlButton } from "@/figures/kit";
import { NEW_WORDS, encode, idOf, pairStarts, type BpeRun, type PairCount, type SplitWord, type VocabularyEntry } from "./bpe";
import { Chip, Dimension, TokenWithId } from "./parts";

const kindOf = (token: string) => (token.length === 1 ? "char" : "token");

/** "5 + 2 + 3": what each word that holds the pair adds to its count. */
export function sumOf(pair: PairCount): string {
  return pair.parts.join(" + ");
}

/**
 * What the status line says after a number of merges. `brief` is the short
 * form used while the merges play, so that a screen reader is not handed a
 * paragraph every step; the full form follows when the playing stops.
 */
export function mergeStatus(run: BpeRun, merges: number, brief = false): string {
  const state = run.states[merges];
  const total = run.merges.length;
  const made = merges > 0 ? run.merges[merges - 1] : null;
  if (brief) {
    return made ? `Merge ${merges} of ${total}: ${made.left} + ${made.right} becomes ${made.token}.` : "No merges yet.";
  }
  const [next, second] = state.pairs;

  const start = run.states[0];
  const sizes = made
    ? ` Vocabulary ${state.vocabulary.length} tokens; the corpus takes ${state.length} tokens, ${start.length} before any merge.`
    : ` Vocabulary ${state.vocabulary.length} tokens; the corpus takes ${state.length} tokens.`;
  const before = made
    ? `Merge ${merges} of ${total}: ${made.left} + ${made.right} becomes ${made.token}, id ${made.id}.${sizes}`
    : `No merges yet: every token is one character.${sizes}`;
  if (!next) return `${before} No pairs are left: every word is one token.`;

  const tie =
    second && second.count === next.count
      ? ` It ties with ${second.left} ${second.right}; the pair that comes first in the corpus is merged.`
      : "";
  const sum = next.parts.length > 1 ? ` (${sumOf(next)})` : "";
  return `${before} Most frequent pair${made ? " now" : ""}: ${next.left} ${next.right}, ${next.count} times${sum}.${tie}`;
}

/** A word of the corpus as chips, with the pair that will be merged next highlighted where it occurs. */
function Symbols({
  word,
  next,
  newest,
  fresh,
}: {
  word: SplitWord;
  next?: PairCount;
  newest?: string;
  fresh: boolean;
}) {
  const starts = new Set(next ? pairStarts(word.symbols, next.left, next.right) : []);
  const chips: ReactNode[] = [];
  let offset = 0;
  const chip = (symbol: string) => {
    const key = `${offset}-${symbol.length}`;
    offset += symbol.length;
    return <Chip key={key} text={symbol} kind={kindOf(symbol)} fresh={fresh && symbol === newest} />;
  };

  for (let index = 0; index < word.symbols.length; index += 1) {
    if (starts.has(index)) {
      const key = `pair-${offset}`;
      chips.push(
        <span key={key} className="tk-pair">
          {chip(word.symbols[index])}
          {chip(word.symbols[index + 1])}
        </span>,
      );
      index += 1;
    } else {
      chips.push(chip(word.symbols[index]));
    }
  }
  return <span className="tk-symbols">{chips}</span>;
}

function Vocabulary({
  entries,
  newest,
  fresh,
  hidden,
}: {
  entries: VocabularyEntry[];
  newest?: string;
  fresh?: boolean;
  hidden?: boolean;
}) {
  return (
    <div className={hidden ? "tk-ghost" : undefined} aria-hidden={hidden || undefined}>
      <div className="tk-fit">
        <ol className="tk-vocabulary" aria-label={hidden ? undefined : "Tokens of the vocabulary, in id order"}>
          {entries.map((entry) => (
            <li key={entry.token}>
              <TokenWithId
                text={entry.token}
                id={entry.id}
                kind={kindOf(entry.token)}
                fresh={Boolean(fresh) && entry.token === newest}
              />
            </li>
          ))}
        </ol>
        <Dimension>{entries.length} tokens</Dimension>
      </div>
    </div>
  );
}

/**
 * The one setting of byte-pair encoding, laid out over the whole run: after
 * each number of merges, how large the vocabulary is and how many tokens the
 * corpus takes. Two rows of columns, each on its own scale from zero; the
 * column of the current step is highlighted, and its number jumps there.
 */
function Ledger({ run, merges, onStep }: { run: BpeRun; merges: number; onStep: (merges: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  // Which sides of the box have columns scrolled out of sight: a fade on that edge says there is more.
  const [hidden, setHidden] = useState({ start: false, end: false });
  const measure = useCallback(() => {
    const element = box.current;
    if (!element) return;
    const start = element.scrollLeft > 1;
    const end = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
    setHidden((was) => (was.start === start && was.end === end ? was : { start, end }));
  }, []);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure, run]);
  // Keep the current column in sight: scroll the box sideways only, never the page.
  useEffect(() => {
    const element = box.current;
    const current = element?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!element || !current) return;
    // The row labels stay pinned at the left edge, so a column is in sight only to the right of them.
    const head = element.querySelector<HTMLElement>(".tk-ledger-head")?.getBoundingClientRect().width ?? 0;
    const frame = element.getBoundingClientRect();
    const cell = current.getBoundingClientRect();
    const left = cell.left - frame.left;
    const right = cell.right - frame.left;
    if (left < head) element.scrollLeft += left - head - 4;
    else if (right > element.clientWidth) element.scrollLeft += right - element.clientWidth + 4;
    measure();
  }, [merges, run, measure]);

  const vocabularyMax = Math.max(...run.states.map((state) => state.vocabulary.length));
  const lengthMax = Math.max(...run.states.map((state) => state.length));
  const rows = [
    { key: "vocabulary", label: "Vocabulary", value: (k: number) => run.states[k].vocabulary.length, max: vocabularyMax },
    { key: "length", label: "Corpus", value: (k: number) => run.states[k].length, max: lengthMax },
  ];

  return (
    // Scrolls sideways inside its own box when a long run does not fit; every column holds a button, so the
    // keyboard reaches (and scrolls to) each of them.
    <div
      className="tk-ledger-frame"
      data-hidden-start={hidden.start ? "" : undefined}
      data-hidden-end={hidden.end ? "" : undefined}
    >
      <div ref={box} className="tk-ledger-box" onScroll={measure}>
        <table className="tk-ledger">
          <caption className="sr-only">Vocabulary size and corpus length after each number of merges</caption>
          <thead>
            <tr>
              <th scope="row" className="tk-ledger-head">
                Merges
              </th>
              {run.states.map((state) => (
                <th key={state.merges} scope="col">
                  <button
                    type="button"
                    className="tk-ledger-step"
                    aria-pressed={state.merges === merges}
                    aria-label={`Show the corpus after ${state.merges} ${state.merges === 1 ? "merge" : "merges"}`}
                    onClick={() => onStep(state.merges)}
                  >
                    {state.merges}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="tk-ledger-head">
                  {row.label}
                  <span className="tk-ledger-unit">tokens</span>
                </th>
                {run.states.map((state) => (
                  <td key={state.merges} data-current={state.merges === merges ? "" : undefined}>
                    <span className="tk-ledger-cell">
                      <span
                        className="tk-ledger-bar"
                        style={
                          {
                            "--share": row.value(state.merges) / row.max,
                          } as CSSProperties
                        }
                        aria-hidden="true"
                      />
                      <span className="tk-ledger-value">{row.value(state.merges)}</span>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface MergeViewProps {
  /** The whole run on the current corpus. */
  run: BpeRun;
  /** How many merges have been applied. */
  merges: number;
  /** The last change was a step forward: the token it made is animated in. */
  fresh: boolean;
  /** Jump to the corpus after a number of merges. */
  onStep: (merges: number) => void;
  /** Unique within the page: names the labels. */
  name: string;
}

/**
 * Byte-pair encoding on the toy corpus after a number of merges: the corpus
 * as it is now written, how often each pair of neighbouring tokens occurs in
 * it, the vocabulary, and three new words encoded with the merges so far.
 */
export function MergeView({ run, merges, fresh, onStep, name }: MergeViewProps) {
  // On a narrow frame the vocabulary and the encoded words wait behind a button, so that the parts that change
  // at every merge (the corpus, the pair counts, the ledger) sit close to the controls. A wide frame shows all.
  const [more, setMore] = useState(false);
  const state = run.states[merges];
  const last = run.states[run.states.length - 1];
  const next: PairCount | undefined = state.pairs[0];
  const newest = merges > 0 ? run.merges[merges - 1].token : undefined;
  const first: PairCount | undefined = run.states[0].pairs[0];
  const scale = first?.count ?? 1;
  const rows = Math.max(...run.states.map(({ pairs }) => pairs.length));

  return (
    <div className="tk-merges">
      <ul className="tk-key tk-area-key" aria-label="Key">
        <li>
          <Chip text="c" kind="char" />
          one character
        </li>
        <li>
          <Chip text="be" />
          token made by a merge
        </li>
        <li>
          <span className="tk-pair">
            <Chip text="b" kind="char" />
            <Chip text="e" kind="char" />
          </span>
          pair merged next
        </li>
      </ul>

      <section className="tk-block tk-area-corpus" aria-labelledby={`${name}-corpus`}>
        <p id={`${name}-corpus`} className="tk-label">
          Corpus: {state.wordCount} words, written with {state.length} tokens
        </p>
        <ul className="tk-corpus">
          {state.words.map((word) => (
            <li key={word.word} className="tk-word">
              <span className="tk-word-count">
                {word.count} <span aria-hidden="true">&times;</span>
                <span className="sr-only">times</span>
              </span>
              <Symbols word={word} next={next} newest={newest} fresh={fresh} />
            </li>
          ))}
        </ul>
      </section>

      <section className="tk-block tk-area-pairs" aria-labelledby={`${name}-pairs`}>
        <p id={`${name}-pairs`} className="tk-label">
          Pairs of neighbouring tokens in this corpus, counted
        </p>
        <div className="tk-pairs-box" style={{ "--rows": rows } as CSSProperties}>
          {next ? (
            <table className="tk-pairs" aria-labelledby={`${name}-pairs`}>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Pair</th>
                  <th scope="col">Count</th>
                </tr>
              </thead>
              <tbody>
                {state.pairs.map((pair, index) => (
                  <tr key={`${pair.left}+${pair.right}`} data-next={index === 0 ? "" : undefined}>
                    <th scope="row">
                      <span className={index === 0 ? "tk-pair" : "tk-symbols"}>
                        <Chip text={pair.left} kind={kindOf(pair.left)} />
                        <Chip text={pair.right} kind={kindOf(pair.right)} />
                      </span>
                      {index === 0 ? <span className="sr-only"> (merged next)</span> : null}
                    </th>
                    <td>
                      <span className="tk-bar-row">
                        <span
                          className="tk-bar"
                          style={{ "--share": pair.count / scale } as CSSProperties}
                          aria-hidden="true"
                        />
                        <span className="tk-bar-count">{pair.count}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="tk-none">No pairs are left: every word is one token.</p>
          )}
        </div>
      </section>

      <section className="tk-block tk-area-ledger" aria-labelledby={`${name}-ledger`}>
        <p id={`${name}-ledger`} className="tk-label">
          Each merge adds a token and shortens the corpus
        </p>
        <Ledger run={run} merges={merges} onStep={onStep} />
      </section>

      <ControlButton
        className="tk-more tk-area-more"
        aria-expanded={more}
        aria-controls={`${name}-vocabulary-block ${name}-words-block`}
        onClick={() => setMore((open) => !open)}
      >
        {more ? "Hide the vocabulary and the new words" : "Show the vocabulary and the new words"}
      </ControlButton>

      <section
        id={`${name}-vocabulary-block`}
        className="tk-block tk-area-vocabulary tk-foldable"
        data-folded={more ? undefined : ""}
        aria-labelledby={`${name}-vocabulary`}
      >
        <p id={`${name}-vocabulary`} className="tk-label">
          Vocabulary: the characters, then one token per merge
        </p>
        <div className="tk-stack">
          <Vocabulary entries={last.vocabulary} hidden />
          <Vocabulary entries={state.vocabulary} newest={newest} fresh={fresh} />
        </div>
      </section>

      <section
        id={`${name}-words-block`}
        className="tk-block tk-area-words tk-foldable"
        data-folded={more ? undefined : ""}
        aria-labelledby={`${name}-words`}
      >
        <p id={`${name}-words`} className="tk-label">
          {merges > 0 ? "New text, encoded with these merges" : "New text, before any merge"}
        </p>
        <ul className="tk-encodings">
          {NEW_WORDS.map((word) => (
            <li key={word} className="tk-encoding">
              <span className="tk-plain">{word}</span>
              <span className="tk-arrow">
                <Glyph name="arrow-right" />
                <span className="sr-only">becomes</span>
              </span>
              <span className="tk-symbols">
                {encode(word, run.merges, merges).map((token, index) => (
                  <TokenWithId
                    // Positions are stable enough here: a row is redrawn whole when its tokens change.
                    key={`${index}-${token}`}
                    text={token}
                    id={idOf(token, state.vocabulary)}
                    kind={kindOf(token)}
                    fresh={fresh && token === newest}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
