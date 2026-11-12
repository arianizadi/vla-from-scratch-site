import type { ReactNode } from "react";

const PUNCTUATION: Record<string, string> = {
  ".": "full stop",
  ",": "comma",
  ":": "colon",
};

/** A piece in words, for a screen reader: a leading space cannot be heard, so it is named. */
export function spokenPiece(text: string): string {
  const core = text.trimStart();
  const name = PUNCTUATION[core] ?? `“${core}”`;
  return text.startsWith(" ") ? `${name} with a space in front` : name;
}

/** Text with every space drawn as an open box, so the space at the front of a token can be seen. */
export function PieceText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let run = "";
  [...text].forEach((character, index) => {
    if (character !== " ") {
      run += character;
      return;
    }
    if (run) parts.push(run);
    run = "";
    parts.push(<span key={index} className="tk-space" />);
  });
  if (run) parts.push(run);
  return <>{parts}</>;
}

/** A piece quoted in running text: drawn with its spaces, read out in words. */
export function PieceQuote({ text }: { text: string }) {
  return (
    <>
      <span className="tk-mono" aria-hidden="true">
        <PieceText text={text} />
      </span>
      <span className="sr-only">{spokenPiece(text)}</span>
    </>
  );
}

export interface ChipProps {
  text: string;
  /** "char" is a single character of the toy corpus; "token" anything a tokenizer has made. */
  kind?: "token" | "char";
  /** The token was made by the merge just applied. */
  fresh?: boolean;
}

/** A token as a chip. */
export function Chip({ text, kind = "token", fresh = false }: ChipProps) {
  return (
    <span className={`tk-chip ${fresh ? "tk-fresh" : ""}`} data-kind={kind}>
      <PieceText text={text} />
    </span>
  );
}

/** A chip with its id under it, as the vocabulary and the encodings show a token. */
export function TokenWithId({ id, ...chip }: ChipProps & { id: number | null }) {
  return (
    <span className="tk-token-body">
      <Chip {...chip} />
      <span className="tk-token-id">
        <span className="sr-only">id </span>
        {id ?? "none"}
      </span>
    </span>
  );
}

/** A dimension line with its value and unit: the length of what is drawn above it. */
export function Dimension({ children }: { children: ReactNode }) {
  return (
    <p className="tk-dim">
      <span className="tk-dim-line" data-end="start" aria-hidden="true" />
      <span className="tk-dim-text">{children}</span>
      <span className="tk-dim-line" data-end="end" aria-hidden="true" />
    </p>
  );
}

/** Whole numbers with a thousands separator, the same on the server and in every browser. */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
