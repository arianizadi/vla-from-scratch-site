import Link from "next/link";

/** A pointer to the field notes: what worked, what did not, and what was wrong at first. */
export function FieldNotes() {
  return (
    <section aria-labelledby="notes-title" className="page-frame mt-24">
      <div className="grid max-w-[960px] gap-x-12 gap-y-4 border-y border-line py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="max-w-[680px]">
          <h2 id="notes-title" className="text-28 font-semibold stretch-95">
            Field notes
          </h2>
          <p className="mt-3 font-serif text-18 leading-[1.875rem] text-ink-muted">
            The chapters teach; the field notes keep the record. What worked, what did not, and what we got
            wrong before a measurement corrected it, each with how it was measured. Read them for the reasoning
            behind a finding, or before you repeat an experiment.
          </p>
        </div>
        <p>
          <Link href="/notes" className="button">
            Read the field notes
          </Link>
        </p>
      </div>
    </section>
  );
}
