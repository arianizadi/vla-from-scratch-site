import { Glyph } from "@/components/ui/Glyph";
import type { StatusKind } from "./notes";

interface StatusStyle {
  label: string;
  /** What the stamp means, for the key at the top of the page. */
  meaning: string;
  tone: string;
}

/**
 * The provenance stamp of an entry. A filled square is a measurement made in this
 * repository, as on the rest of the site; an empty square is a question no
 * measurement has answered yet; a crossed square a measurement that did not decide
 * it; a clock (the site's mark for running work) a result still being measured.
 */
export const STATUS: Record<StatusKind, StatusStyle> = {
  confirmed: {
    label: "Measured here",
    meaning: "the claim was tested in this repository; its numbers are in the lab notebook",
    tone: "text-ink",
  },
  open: {
    label: "Open",
    meaning: "a hypothesis; the experiment that would test it has not been run",
    tone: "text-ink-muted",
  },
  progress: {
    label: "In progress",
    meaning: "the runs are still training; what the entry reports may change",
    tone: "text-warning",
  },
  inconclusive: {
    label: "Inconclusive",
    meaning: "measured, but the result does not settle the question",
    tone: "text-ink-muted",
  },
  other: {
    label: "Status",
    meaning: "a status the page does not know, shown as written",
    tone: "text-ink-muted",
  },
};

/** The kinds the key explains, in the order it lists them. */
export const STATUS_ORDER: StatusKind[] = ["confirmed", "open", "progress", "inconclusive"];

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;

export function StatusGlyph({ kind, size = 12 }: { kind: StatusKind; size?: number }) {
  if (kind === "confirmed") return <Glyph name="square-filled" size={size} />;
  if (kind === "progress") return <Glyph name="clock" size={size} />;
  if (kind === "other") return <Glyph name="circle-open" size={size} />;
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="2.75" y="2.75" width="6.5" height="6.5" {...STROKE} />
      {kind === "inconclusive" ? <path d="M2.75 9.25l6.5-6.5" {...STROKE} /> : null}
    </svg>
  );
}

interface StatusStampProps {
  kind: StatusKind;
  /** Text after the stamp's word ("on pick_cube"); rendered as given. */
  qualifier?: React.ReactNode;
  /** The status as written in the notes, for a kind the page does not know. */
  raw?: string;
}

/** A glyph and a word, never colour alone. */
export function StatusStamp({ kind, qualifier, raw }: StatusStampProps) {
  const style = STATUS[kind];
  return (
    <span className={`notes-stamp ${style.tone}`} data-status={kind}>
      <StatusGlyph kind={kind} />
      <span>
        <span className="notes-stamp-word">{kind === "other" && raw ? raw : style.label}</span>
        {qualifier ? <span className="notes-stamp-qualifier"> {qualifier}</span> : null}
      </span>
    </span>
  );
}
