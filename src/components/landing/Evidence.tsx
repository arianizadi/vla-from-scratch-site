import Link from "next/link";
import type { CSSProperties } from "react";
import { conventions, findings, type Finding, type FindingRow } from "@/data/lab";
import { StampMark } from "@/figures/kit";

const at = (percent: number) => `${Math.min(100, Math.max(0, percent))}%`;

/** A 0 to 100% line with the result as a dot, its 95% interval as a whisker, and chance as a dashed rule. */
function Track({ row, chance }: { row: FindingRow; chance?: number }) {
  return (
    <div className="evidence-track" aria-hidden="true">
      {chance !== undefined ? <span className="evidence-chance" style={{ "--at": at(chance) } as CSSProperties} /> : null}
      {row.interval ? (
        <span
          className="evidence-whisker"
          style={{ "--low": at(row.interval.low), "--high": at(row.interval.high) } as CSSProperties}
        />
      ) : null}
      <span
        className="evidence-dot"
        data-reference={row.reference ? "" : undefined}
        style={{ "--at": at(row.percent) } as CSSProperties}
      />
    </div>
  );
}

function EvidenceCard({ finding }: { finding: Finding }) {
  const titleId = `finding-${finding.id}`;
  return (
    <article aria-labelledby={titleId} className="plate evidence flex flex-col">
      <header className="plate-header">
        <h3 id={titleId} className="plate-title text-16 leading-[1.375rem]">
          {finding.title}
        </h3>
        <StampMark stamp="measured" />
      </header>

      <div className="flex-1 px-3 pt-3 pb-4 sm:px-4">
        <p className="text-14 text-ink-muted">{finding.setting}</p>

        <div
          role="table"
          aria-labelledby={titleId}
          className="evidence-table mt-4"
          data-aside={finding.aside ? "" : undefined}
        >
          <div role="row" className="evidence-row evidence-head">
            <span role="columnheader" className="evidence-label">
              <span className="sr-only">Run</span>
            </span>
            {finding.aside ? (
              <span role="columnheader" className="evidence-num">
                {finding.aside}
              </span>
            ) : null}
            <span role="columnheader" className="evidence-num">
              {finding.measure}
            </span>
            <span className="evidence-scale" aria-hidden="true">
              <span>0%</span>
              <span>100%</span>
            </span>
          </div>

          {finding.rows.map((row) => (
            <div key={`${row.label}-${row.detail ?? ""}-${row.result}`} role="row" className="evidence-row">
              <div role="cell" className="evidence-label">
                <span className="block text-15 font-medium text-ink">{row.label}</span>
                {row.detail ? <span className="block text-13 text-ink-faint">{row.detail}</span> : null}
              </div>
              {finding.aside ? (
                <div role="cell" className="evidence-num text-ink-muted">
                  {row.aside ?? ""}
                </div>
              ) : null}
              <div role="cell" className="evidence-num">
                <span className="block text-15 font-semibold text-ink">{row.result}</span>
                {row.interval ? (
                  <span className="block text-13 text-ink-faint">
                    <span className="sr-only">95% interval </span>
                    {row.interval.low} to {row.interval.high}%
                  </span>
                ) : null}
              </div>
              <Track row={row} chance={finding.chance?.percent} />
            </div>
          ))}
        </div>

        {finding.chance ? (
          <p className="mt-2 flex items-center justify-end gap-2 text-13 text-ink-faint">
            <span className="evidence-chance-key" aria-hidden="true" />
            {finding.chance.label}, {finding.chance.percent}%
          </p>
        ) : null}
      </div>

      <footer className="plate-caption">
        <p>{finding.note.text}</p>
        <p className="plate-note mt-1.5">
          Lab notebook,{" "}
          <Link href="/lab" className="text-link">
            {finding.section}
          </Link>
        </p>
      </footer>
    </article>
  );
}

/** Why the tutorial exists, and four of its findings as the lab notebook records them. */
export function Evidence() {
  return (
    <section aria-labelledby="evidence-title" className="page-frame mt-24">
      <div className="max-w-[680px]">
        <h2 id="evidence-title" className="text-28 font-semibold stretch-95">
          Every claim is backed by a run
        </h2>
        <p className="mt-3 font-serif text-18 leading-[1.875rem] text-ink-muted">
          Most write-ups of robot learning show the run that worked. Getting there is the hard part: a policy can
          reach a low training loss, reproduce recorded actions almost exactly, and still succeed 0% of the time,
          and nothing in the logs says why. The tutorial records the route, including the runs that failed, with
          the measurements that separate one cause from another.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {findings.map((finding) => (
          <EvidenceCard key={finding.id} finding={finding} />
        ))}
      </div>

      <p className="mt-5 max-w-[680px] text-14 text-ink-muted">
        {conventions} A dot is the result; a bar through it is the interval, where the notebook gives one.
      </p>
      <p className="mt-5">
        <Link href="/lab" className="button">
          Open the lab notebook
        </Link>
      </p>
    </section>
  );
}
