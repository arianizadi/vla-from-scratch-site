import Link from "next/link";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";

interface KeyItem {
  glyph: GlyphName;
  term: string;
  meaning: React.ReactNode;
}

const STATEMENTS: KeyItem[] = [
  {
    glyph: "square-filled",
    term: "Measured here",
    meaning: (
      <>
        A number from this repository&rsquo;s own experiments. It is copied from the{" "}
        <Link href="/lab" className="text-link">
          lab notebook
        </Link>{" "}
        and says what it was measured on.
      </>
    ),
  },
  {
    glyph: "bracket",
    term: "In this repository",
    meaning: "A statement about the code as it is now, with the file and the symbol named and linked.",
  },
  {
    glyph: "circle-open",
    term: "Background",
    meaning: "Established knowledge and published work that was not measured here, attributed to its source.",
  },
];

const STAMPS: KeyItem[] = [
  { glyph: "square-filled", term: "Measured", meaning: "drawn from numbers in the lab notebook" },
  { glyph: "square-half", term: "Computed", meaning: "the real algorithm running on a toy input" },
  { glyph: "circle-open", term: "Schematic", meaning: "an explanatory drawing" },
];

/** The key to the site's marks: what kind of statement a section or a figure makes. */
export function StatementKey() {
  return (
    <section aria-labelledby="key-title" className="page-frame mt-24">
      <div className="max-w-[680px]">
        <h2 id="key-title" className="text-28 font-semibold stretch-95">
          Three kinds of statement, kept apart
        </h2>
        <p className="mt-3 font-serif text-18 leading-[1.875rem] text-ink-muted">
          A training loss can fall whether or not the robot can do the task, so every claim here says where it
          comes from. Sections and figures carry one of these marks.
        </p>
      </div>

      <dl className="mt-8 grid gap-x-8 border-t border-line md:grid-cols-3">
        {STATEMENTS.map((item) => (
          <div key={item.term} className="border-b border-line py-5 md:border-b-0">
            <dt className="flex items-center gap-2 text-16 font-semibold">
              <Glyph name={item.glyph} size={14} />
              {item.term}
            </dt>
            <dd className="mt-2 max-w-[400px] font-serif text-16 leading-6 text-ink-muted">{item.meaning}</dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-line pt-5 text-14 text-ink-muted">
        Figures are stamped the same way:{" "}
        {STAMPS.map((item, index) => (
          <span key={item.term}>
            <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap text-ink">
              <Glyph name={item.glyph} />
              {item.term}
            </span>{" "}
            ({item.meaning}){index < STAMPS.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>
    </section>
  );
}
