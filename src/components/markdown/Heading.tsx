import Link from "next/link";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import type { Provenance } from "@/lib/markdown/pipeline";

interface ProvenanceInfo {
  glyph: GlyphName;
  label: string;
  note: React.ReactNode;
}

/** The three kinds of statement a chapter keeps apart (tutorial/STYLE.md). */
const PROVENANCE: Record<Provenance, ProvenanceInfo> = {
  measured: {
    glyph: "square-filled",
    label: "Measured here",
    note: (
      <>
        Numbers in this section are copied from the <Link href="/lab">lab notebook</Link>.
      </>
    ),
  },
  repository: {
    glyph: "bracket",
    label: "In this repository",
    note: "Statements about the code as it is, with links to the files.",
  },
  background: {
    glyph: "circle-open",
    label: "Background",
    note: "Published work and established knowledge, not measured here.",
  },
};

function isProvenance(value: unknown): value is Provenance {
  return typeof value === "string" && Object.hasOwn(PROVENANCE, value);
}

function Anchor({ id }: { id?: string }) {
  if (!id) return null;
  return (
    <a href={`#${id}`} className="heading-anchor" aria-label="Link to this section">
      #
    </a>
  );
}

interface SectionHeadingProps extends React.ComponentProps<"h2"> {
  "data-section"?: string;
  "data-provenance"?: string;
}

/** An h2: opens a numbered section and, for the fixed sections, says what kind of statement follows. */
export function SectionHeading({
  "data-section": section,
  "data-provenance": provenance,
  id,
  children,
  ...rest
}: SectionHeadingProps) {
  const info = isProvenance(provenance) ? PROVENANCE[provenance] : undefined;
  return (
    <div className="section-head">
      <h2 id={id} {...rest}>
        {section ? (
          <span className="section-number" aria-hidden="true">
            {section}
          </span>
        ) : null}
        {children}
        <Anchor id={id} />
      </h2>
      {info ? (
        <p className="provenance">
          <Glyph name={info.glyph} />
          <span>
            <strong>{info.label}.</strong> {info.note}
          </span>
        </p>
      ) : null}
    </div>
  );
}

export function Heading3({ id, children, ...rest }: React.ComponentProps<"h3">) {
  return (
    <h3 id={id} {...rest}>
      {children}
      <Anchor id={id} />
    </h3>
  );
}

export function Heading4({ id, children, ...rest }: React.ComponentProps<"h4">) {
  return (
    <h4 id={id} {...rest}>
      {children}
      <Anchor id={id} />
    </h4>
  );
}
