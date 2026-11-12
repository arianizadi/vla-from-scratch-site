import type { CSSProperties } from "react";
import { displayPiece, tokenizations, tokenizer, type Tokenization } from "@/data/tokens";
import { niceTicks } from "@/figures/kit";
import { Chip, Dimension, PieceQuote, formatCount, spokenPiece } from "./parts";

const WORD_START = /^[A-Za-z0-9]/;
const WORD_END = /[A-Za-z0-9]$/;

/** The pieces of a sentence as text: a leading space is a real space. */
export function piecesOf(sentence: Tokenization): string[] {
  return sentence.pieces.map(displayPiece);
}

/**
 * The token indices of each word. A piece that has no space in front and
 * follows a letter continues the word before it, so a group of two or more
 * is one word that the tokenizer cut into several tokens.
 */
export function wordGroups(pieces: readonly string[]): number[][] {
  const groups: number[][] = [];
  pieces.forEach((piece, index) => {
    const previous = pieces[index - 1];
    if (previous !== undefined && WORD_START.test(piece) && WORD_END.test(previous)) {
      groups[groups.length - 1].push(index);
    } else {
      groups.push([index]);
    }
  });
  return groups;
}

/** The last token that is a word: for an instruction, the noun of the object. */
export function lastWord(pieces: readonly string[]): number {
  for (let index = pieces.length - 1; index >= 0; index -= 1) {
    if (WORD_START.test(pieces[index].trimStart())) return index;
  }
  return 0;
}

export interface Variant {
  text: string;
  id: number;
  /** How it differs from the piece it is a variant of. */
  differences: string[];
}

/**
 * Other pieces in the tokenised sentences that spell the same word as this
 * one with a different space in front or a different capital, each of them a
 * vocabulary entry of its own.
 */
export function variantsOf(piece: string): Variant[] {
  const word = piece.trim().toLowerCase();
  const found = new Map<string, number>();
  for (const sentence of tokenizations()) {
    piecesOf(sentence).forEach((other, index) => {
      if (other !== piece && other.trim().toLowerCase() === word) found.set(other, sentence.ids[index]);
    });
  }
  return [...found].map(([text, id]) => {
    const differences: string[] = [];
    if (text.startsWith(" ") && !piece.startsWith(" ")) differences.push("with a space in front");
    if (!text.startsWith(" ") && piece.startsWith(" ")) differences.push("without the space in front");
    if (text.trim() !== piece.trim()) {
      differences.push(text.trim() === text.trim().toLowerCase() ? "in lower case" : "with a capital");
    }
    return { text, id, differences };
  });
}

/** What the status line says about the selected token. */
export function TokenStatus({ sentence, selected }: { sentence: Tokenization; selected: number }) {
  const pieces = piecesOf(sentence);
  const piece = pieces[selected];
  return (
    <>
      Token {selected + 1} of {pieces.length}: <PieceQuote text={piece} />, id {sentence.ids[selected]}.
      {variantsOf(piece).map((variant) => (
        <span key={variant.text}>
          {" "}
          The same word {variant.differences.join(" and ")} is another entry: <PieceQuote text={variant.text} />, id{" "}
          {variant.id}.
        </span>
      ))}
    </>
  );
}

export interface SentenceViewProps {
  sentence: Tokenization;
  /** Index of the selected token. */
  selected: number;
  onSelect: (index: number) => void;
  /** Unique within the page: names the radio group and the labels. */
  name: string;
}

/**
 * A sentence as the tokenizer used here cuts it: the string, its tokens with
 * their ids, and where the selected id lies in the vocabulary.
 */
export function SentenceView({ sentence, selected, onSelect, name }: SentenceViewProps) {
  const pieces = piecesOf(sentence);
  const groups = wordGroups(pieces);
  const count = pieces.length;
  const characters = [...sentence.text].length;
  const lastId = tokenizer.vocabSize - 1;
  const at = (id: number): CSSProperties => ({ "--at": `${((id / lastId) * 100).toFixed(3)}%` }) as CSSProperties;
  const places = [...new Set(sentence.ids)];
  const selectedId = sentence.ids[selected];
  // The ids of the word the selected token belongs to are drawn taller, so the selection still reads where
  // marks run together.
  const selectedGroup = groups.find((indices) => indices.includes(selected)) ?? [selected];
  const group = new Set(selectedGroup.map((index) => sentence.ids[index]));
  // Ids within the first 2 % of the line: their marks lie a few pixels apart at most, or on top of each other.
  const crowded = places.filter((id) => id < lastId * 0.02).length;
  // Round graduations of the id line, and the last id at its end.
  const graduations = niceTicks(0, lastId, 4).filter((id) => id > 0 && lastId - id > lastId / 10);
  // The pieces of this sentence with the smallest and the largest id, among those of two or more characters
  // (a single character is a byte, listed before every merge).
  const merged = pieces.map((piece, index) => ({ piece, id: sentence.ids[index] })).filter(({ piece }) => [...piece].length > 1);
  const smallest = merged.reduce<(typeof merged)[number] | undefined>((a, b) => (a && a.id <= b.id ? a : b), undefined);
  const largest = merged.reduce<(typeof merged)[number] | undefined>((a, b) => (a && a.id >= b.id ? a : b), undefined);

  return (
    <div className="tk-blocks">
      <p className="sr-only">
        {`The sentence "${sentence.text}", ${characters} characters, becomes ${count} tokens: `}
        {pieces.map((piece, index) => `${spokenPiece(piece)} id ${sentence.ids[index]}`).join(", ")}
        {`. The vocabulary has ${formatCount(tokenizer.vocabSize)} tokens, ids 0 to ${formatCount(lastId)}; padding is id ${tokenizer.padId}.`}
      </p>
      <section className="tk-block" aria-labelledby={`${name}-string`}>
        <p id={`${name}-string`} className="tk-label">
          The sentence, as a string
        </p>
        <div className="tk-string">
          {/* The quotes hang outside the text, and the dimension line is inset by one character on each side, so
              the graduations and the dimension both measure the characters of the string only. */}
          <p className="tk-string-line">
            <span className="tk-quote" aria-hidden="true">
              &quot;
            </span>
            <span className="tk-string-text">{sentence.text}</span>
            <span className="tk-quote" aria-hidden="true">
              &quot;
            </span>
          </p>
          <div className="tk-string-dim">
            <Dimension>{characters} characters</Dimension>
          </div>
        </div>
      </section>

      <section className="tk-block" aria-labelledby={`${name}-tokens`}>
        <p id={`${name}-tokens`} className="tk-label">
          Its tokens, each with its id
        </p>
        <div className="tk-fit">
          <div role="radiogroup" aria-labelledby={`${name}-tokens`} className="tk-strip">
            {groups.map((group) => (
              <span key={group[0]} className="tk-group" data-split={group.length > 1 ? "" : undefined}>
                {group.length > 1 ? <span className="tk-group-note">one word, {group.length} tokens</span> : null}
                {group.map((index) => (
                  <label key={index} className="tk-token">
                    <input
                      type="radio"
                      name={name}
                      className="sr-only"
                      checked={index === selected}
                      onChange={() => onSelect(index)}
                      aria-label={`Token ${index + 1} of ${count}: ${spokenPiece(pieces[index])}, id ${sentence.ids[index]}`}
                    />
                    <span className="tk-token-body" aria-hidden="true">
                      <Chip text={pieces[index]} />
                      <span className="tk-token-id">{sentence.ids[index]}</span>
                    </span>
                  </label>
                ))}
              </span>
            ))}
          </div>
          <Dimension>{count} tokens</Dimension>
        </div>
      </section>

      <section className="tk-block" aria-labelledby={`${name}-vocabulary`}>
        <p id={`${name}-vocabulary`} className="tk-label">
          The vocabulary, in id order: where this sentence&rsquo;s tokens are
        </p>
        <div
          className="tk-track"
          role="img"
          aria-label={`A line from id 0 to id ${formatCount(lastId)}, with a mark at each of the ${places.length} ids this sentence uses.${crowded > 1 ? ` ${crowded} of them lie within the first 2 percent of the line, where their marks lie close together or on top of each other.` : ""} The selected token, ${spokenPiece(pieces[selected])}, is id ${selectedId}.`}
        >
          <span className="tk-track-base" />
          {[0, ...graduations, lastId].map((id) => (
            <span
              key={`g-${id}`}
              className="tk-grad"
              style={at(id)}
              data-end={id === 0 ? "start" : id === lastId ? "end" : undefined}
              data-near-end={id !== lastId && lastId - id < lastId / 4 ? "" : undefined}
            >
              {formatCount(id)}
            </span>
          ))}
          {places.map((id) => (
            <span key={id} className="tk-tick" style={at(id)} data-group={group.has(id) ? "" : undefined} />
          ))}
          <span className="tk-stem" style={at(selectedId)} />
          <span className="tk-flag" style={at(selectedId)}>
            {selectedId}
          </span>
        </div>
        <Dimension>
          {formatCount(tokenizer.vocabSize)} tokens
        </Dimension>
        <p className="tk-aside">
          An id is a token&rsquo;s place in this list. Apart from the special tokens, the list holds the single
          bytes first and then one token per merge, in the order the merges were learned: a piece that was frequent
          in the text the tokenizer was trained on was merged early and has a small id.
          {smallest && largest && smallest.id !== largest.id ? (
            <>
              {" "}
              In this sentence, <PieceQuote text={smallest.piece} /> has id {smallest.id} and{" "}
              <PieceQuote text={largest.piece} /> id {largest.id}.
            </>
          ) : null}
        </p>
        <p className="tk-aside">
          Padding, which fills a short row of a batch up to the length of the longest, is a token like any other:
          id {tokenizer.padId}.
        </p>
      </section>
    </div>
  );
}
