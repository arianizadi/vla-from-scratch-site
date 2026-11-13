import Link from "next/link";

/** A pointer to the field notes: what worked, what did not, and what was wrong at first. */
export function FieldNotes() {
  return (
    <section aria-labelledby="notes-title" className="page-frame landing-section">
      <div className="notes-band">
        <div className="max-w-[640px]">
          <h2 id="notes-title" className="section-title">
            Field notes
          </h2>
          <p className="section-lead">
            The lessons teach; the field notes keep the record. What worked, what did not, and what was wrong
            before a measurement corrected it.
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
