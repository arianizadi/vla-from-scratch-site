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

/**
 * The permalink of a heading. It stands beside the heading, not inside it, so
 * the heading's name is its text alone; its own name says which section.
 */
function Anchor({ id, title }: { id?: string; title?: string }) {
  if (!id) return null;
  return (
    <a href={`#${id}`} className="heading-anchor" aria-label={title ? `Link to section: ${title}` : "Link to this section"}>
      #
    </a>
  );
}

interface HeadingData {
  "data-section"?: string;
  "data-provenance"?: string;
  "data-title"?: string;
}

type SectionHeadingProps = React.ComponentProps<"h2"> & HeadingData;

/** An h2: opens a numbered section and, for the fixed sections, says what kind of statement follows. */
export function SectionHeading({
  "data-section": section,
  "data-provenance": provenance,
  "data-title": title,
  id,
  children,
  ...rest
}: SectionHeadingProps) {
  const info = isProvenance(provenance) ? PROVENANCE[provenance] : undefined;
  return (
    <div className="section-head">
      <div className="heading-row">
        <h2 id={id} {...rest}>
          {section ? (
            <span className="section-number" aria-hidden="true">
              {section}
            </span>
          ) : null}
          {children}
        </h2>
        <Anchor id={id} title={title} />
      </div>
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

export function Heading3({ id, children, "data-title": title, ...rest }: React.ComponentProps<"h3"> & HeadingData) {
  return (
    <div className="heading-row heading-row-3">
      <h3 id={id} {...rest}>
        {children}
      </h3>
      <Anchor id={id} title={title} />
    </div>
  );
}

export function Heading4({ id, children, "data-title": title, ...rest }: React.ComponentProps<"h4"> & HeadingData) {
  return (
    <div className="heading-row heading-row-4">
      <h4 id={id} {...rest}>
        {children}
      </h4>
      <Anchor id={id} title={title} />
    </div>
  );
}
