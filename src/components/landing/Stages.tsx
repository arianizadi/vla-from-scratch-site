import Link from "next/link";
import { stageComparison, stageHardware, stages, type Stage } from "@/data/lab";
import type { Part } from "@/lib/content";

const FACTS: { key: keyof Pick<Stage, "model" | "data" | "budget" | "result">; term: string }[] = [
  { key: "model", term: "Model" },
  { key: "data", term: "Data" },
  { key: "budget", term: "Training" },
  { key: "result", term: "Result" },
];

/**
 * The three models the tutorial builds, each on top of the one before, with
 * the size, data, budget and result the lab notebook records for it.
 */
export function Stages({ parts }: { parts: Part[] }) {
  return (
    <div className="mt-10">
      <h3 className="text-20 font-semibold">Three models, each trained from random weights on {stageHardware}</h3>
      <ol className="mt-4 grid border-y border-line lg:grid-cols-3">
        {stages.map((stage, index) => {
          const part = parts.find((candidate) => candidate.number === stage.part);
          return (
            <li
              key={stage.number}
              className={`py-5 lg:px-6 lg:first:pl-0 lg:last:pr-0 ${index > 0 ? "border-t border-line lg:border-t-0 lg:border-l" : ""}`}
            >
              <p className="label text-ink-faint">Stage {stage.number}</p>
              <h4 className="mt-1 text-18 leading-6 font-semibold">
                {part ? (
                  <Link href={`/learn#${part.id}`} className="text-ink no-underline hover:text-accent">
                    {stage.name}
                  </Link>
                ) : (
                  stage.name
                )}
              </h4>
              <dl className="mt-3 grid max-w-[560px] grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-2 text-15">
                {FACTS.map((fact) => (
                  <div key={fact.key} className="contents">
                    <dt className="label pt-0.5 text-ink-faint">{fact.term}</dt>
                    <dd className={fact.key === "result" ? "text-ink" : "text-ink-muted"}>{stage[fact.key]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 max-w-[680px] text-14 text-ink-muted">
        {stageComparison} These numbers are from the{" "}
        <Link href="/lab" className="text-link">
          lab notebook
        </Link>
        .
      </p>
    </div>
  );
}
