import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import { STAMP_LABEL, type Stamp } from "../catalog";

const STAMP_GLYPH: Record<Stamp, GlyphName> = {
  measured: "square-filled",
  computed: "square-half",
  schematic: "circle-open",
};

/**
 * The mark that says what kind of statement a figure makes: a filled square
 * for measured, a half square for computed, an open circle for schematic,
 * always with the word.
 */
export function StampMark({ stamp, className = "" }: { stamp: Stamp; className?: string }) {
  return (
    <span className={`plate-stamp ${className}`}>
      <Glyph name={STAMP_GLYPH[stamp]} />
      {STAMP_LABEL[stamp]}
    </span>
  );
}
