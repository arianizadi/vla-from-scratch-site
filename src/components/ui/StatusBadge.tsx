import { Glyph, type GlyphName } from "./Glyph";

interface StatusStyle {
  label: string;
  glyph: GlyphName;
  /** Tailwind text colour class for the glyph and the word. */
  tone: string;
}

const STATUS: Record<string, StatusStyle> = {
  draft: { label: "Draft", glyph: "clock", tone: "text-warning" },
  review: { label: "In review", glyph: "clock", tone: "text-warning" },
  published: { label: "Published", glyph: "check", tone: "text-success" },
  final: { label: "Published", glyph: "check", tone: "text-success" },
  sample: { label: "Sample", glyph: "circle-open", tone: "text-ink-muted" },
};

/** A chapter's status: a glyph and a word, never colour alone. */
export function StatusBadge({ status }: { status: string }) {
  const style = STATUS[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    glyph: "circle-open" as const,
    tone: "text-ink-muted",
  };
  return (
    <span
      className={`label inline-flex items-center gap-1.5 rounded-control border border-line px-1.5 py-0.5 whitespace-nowrap ${style.tone}`}
    >
      <Glyph name={style.glyph} />
      {style.label}
    </span>
  );
}
