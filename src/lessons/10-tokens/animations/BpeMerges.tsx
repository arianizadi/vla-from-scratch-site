"use client";

import { AnimationFrame, Chip, Label, stagger } from "@/animations";

/** The chapter's toy corpus: four words, split into characters, with how often each occurs. */
const WORDS = [
  { word: "cube", count: 5 },
  { word: "cubes", count: 2 },
  { word: "tube", count: 3 },
  { word: "bed", count: 2 },
];

/** The four merges byte-pair encoding learns on it, most frequent pair first, with that pair's count. */
const MERGES = [
  { pair: ["b", "e"], count: 12 },
  { pair: ["u", "be"], count: 10 },
  { pair: ["c", "ube"], count: 7 },
  { pair: ["t", "ube"], count: 3 },
];

interface Piece {
  key: string;
  text: string;
  start: number;
  length: number;
  merged: boolean;
}

/** Each word's pieces after the first `applied` merges. */
function pieces(applied: number): Piece[][] {
  return WORDS.map(({ word }, row) => {
    let parts = word.split("").map((text, start) => ({ text, start, length: 1 }));
    let mergedAt = -1;
    MERGES.slice(0, applied).forEach(({ pair }, index) => {
      const next: typeof parts = [];
      for (let i = 0; i < parts.length; i += 1) {
        if (i + 1 < parts.length && parts[i].text === pair[0] && parts[i + 1].text === pair[1]) {
          next.push({ text: pair[0] + pair[1], start: parts[i].start, length: parts[i].length + parts[i + 1].length });
          if (index === applied - 1) mergedAt = parts[i].start;
          i += 1;
        } else next.push(parts[i]);
      }
      parts = next;
    });
    return parts.map((part) => ({
      ...part,
      key: `${row}:${part.start}:${part.length}`,
      merged: part.start === mergedAt && part.length > 1,
    }));
  });
}

const SLOT = 34;
const LEFT = 122;
const ROW_Y = [62, 112, 162, 212];
const centre = (start: number, length: number) => LEFT + (start + (length - 1) / 2) * SLOT;

export function BpeMerges() {
  return (
    <AnimationFrame
      title="Gluing the most common pairs"
      description="Four words, cube, cubes, tube and bed, start as single characters: a vocabulary of 7 tokens. The most frequent neighbouring pair is merged into a new token, then the pairs are counted again: b and e become be, u and be become ube, c and ube become cube, and t and ube become tube. Four merges give 11 tokens."
      steps={[
        "Start from single letters. The list of tokens is the 7 letters.",
        "The pair seen side by side most often is b e, 12 times. Glue it into one token: be.",
        "Count again. u be wins with 10 and becomes ube.",
        "c ube, 7 times, becomes cube.",
        "t ube becomes tube. Four glues, 11 tokens: common words are now one piece each.",
      ]}
      size={[480, 260]}
    >
      {(step) => {
        const now = pieces(step);
        const before = step > 0 ? pieces(step - 1) : now.map(() => []);
        return (
          <>
            {WORDS.map(({ count }, row) => (
              <Label key={`count-${row}`} x={78} y={ROW_Y[row]} tone="faint" anchor="end" mono>
                {`${count}×`}
              </Label>
            ))}

            {now.map((row, rowIndex) => {
              const keys = new Set(row.map((piece) => piece.key));
              const gone = before[rowIndex].filter((piece) => !keys.has(piece.key));
              return [
                ...gone.map((piece) => (
                  <Chip
                    key={piece.key}
                    x={centre(piece.start, piece.length)}
                    y={ROW_Y[rowIndex]}
                    text={piece.text}
                    tone="language"
                    size={15}
                    width={piece.length * SLOT - 6}
                    opacity={0}
                  />
                )),
                ...row.map((piece) => (
                  <Chip
                    key={piece.key}
                    x={centre(piece.start, piece.length)}
                    y={ROW_Y[rowIndex]}
                    text={piece.text}
                    tone={piece.length > 1 ? "language" : "ink"}
                    variant={piece.length > 1 ? "soft" : "outline"}
                    size={15}
                    width={piece.length * SLOT - 6}
                    active={piece.merged}
                    enter={piece.length > 1}
                    delay={piece.merged ? stagger(rowIndex, 70) : 0}
                  />
                )),
              ];
            })}

            <Label x={394} y={44} tone="muted" size={14}>
              the list has
            </Label>
            <Label key={`vocab-${step}`} x={394} y={84} tone="ink" size={40} weight={700} enter>
              {String(7 + step)}
            </Label>
            <Label x={394} y={116} tone="muted" size={14}>
              tokens
            </Label>
            {MERGES.map(({ pair, count }, index) => (
              <Label key={pair.join("")} x={394} y={150 + index * 24} tone={index === step - 1 ? "ink" : "muted"} size={14} mono opacity={index < step ? 1 : 0} weight={index === step - 1 ? 700 : 400}>
                {`${pair[0]}+${pair[1]} (${count})`}
              </Label>
            ))}
          </>
        );
      }}
    </AnimationFrame>
  );
}
