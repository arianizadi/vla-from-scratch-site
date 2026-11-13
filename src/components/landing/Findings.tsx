import Link from "next/link";
import { findings, type Finding } from "@/data/lab";
import type { ChapterMeta } from "@/lib/content";
import { OnsetPlate } from "./hero/OnsetPlate";
import { heroData } from "./hero/onset-data";
import { resultsHref, statements } from "./statements";

/** A chapter link when the chapter is in the site, plain words otherwise. */
function ChapterLink({ chapter, children }: { chapter?: ChapterMeta; children: React.ReactNode }) {
  return chapter ? (
    <Link href={`/learn/${chapter.slug}`} className="text-link">
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
}

const byId = (id: string): Finding | undefined => findings.find((finding) => finding.id === id);

export interface BigNumber {
  value: string;
  caption: string;
  href: string;
}

/**
 * Three results to read at a glance, built from findings.json (every number
 * there carries the notebook passage it was copied from).
 */
export function bigNumbers(): BigNumber[] {
  const out: BigNumber[] = [];
  const expert = byId("expert-first");
  const expertRow = expert?.rows.find((row) => row.reference);
  const scratch = expert?.rows.find((row) => /from scratch/i.test(row.label));
  if (expert && expertRow) {
    out.push({
      value: expertRow.result,
      caption: "A scripted expert solves the task through the same evaluation loop. The task is possible.",
      href: resultsHref(expert.section),
    });
  }
  if (expert && scratch) {
    out.push({
      value: scratch.result,
      caption: "The first robot policy trained from scratch, on layouts it never saw. Where the debugging starts.",
      href: resultsHref(expert.section),
    });
  }
  const late = byId("arrives-late");
  if (late && late.rows.length > 1) {
    const first = late.rows[0];
    const last = late.rows[late.rows.length - 1];
    out.push({
      value: `${first.percent}% → ${last.percent}%`,
      caption: "One policy, more training on the same data. It starts to look at the scene late, and all at once.",
      href: resultsHref(late.section),
    });
  }
  return out;
}

/** What the measurements showed: big numbers, the main finding as a figure, and the list of findings. */
export function Findings({ chapters }: { chapters: ChapterMeta[] }) {
  const bySlug = (slug: string) => chapters.find((chapter) => chapter.slug === slug);
  const data = heroData();
  const policySteps = (data.weights[0] && data.stages[data.weights[0].value]) || [];
  const firstStep = policySteps[0];
  const lastStep = policySteps[policySteps.length - 1];
  const episodes = data.episodes !== null ? `${data.episodes} ` : "";

  const caption = (
    <>
      Each dot is where the gripper first closed in one of the {episodes}evaluation episodes, drawn around the object
      the instruction named.
      {firstStep && lastStep && firstStep !== lastStep ? (
        <>
          {" "}
          After {firstStep.short} samples the dots form a wide cloud (slope {firstStep.cells.slope}); after{" "}
          {lastStep.short} they sit on the object (slope {lastStep.cells.slope}).
        </>
      ) : null}
    </>
  );

  const note = (
    <>
      Seen from above, on layouts the policy never saw; every step shows the same layouts. &ldquo;On the table&rdquo;
      puts every dot and object where it was, joined by a line. The policy is the patch-token policy with instruction
      tokens ({data.runLabel}). Closed-loop evaluation{data.machine ? ` on ${data.machine}` : ""}, one training seed.
      Slope: of where the gripper closed against where the named object was; 1 goes to the object, 0 ignores the
      scene. How to read a plot like this:{" "}
      <ChapterLink chapter={bySlug("92-measuring-failure")}>Measuring How a Policy Fails</ChapterLink>; when it
      happens:{" "}
      <ChapterLink chapter={bySlug("71-how-much-data-and-training")}>How Much Data, How Much Training</ChapterLink>.
      Numbers from the lab notebook:{" "}
      <Link href={data.runHref} className="text-link">
        the policy
      </Link>
      {data.expertHref ? (
        <>
          ,{" "}
          <Link href={data.expertHref} className="text-link">
            the scripted expert
          </Link>
        </>
      ) : null}
      . A dash: not reported for the expert.
    </>
  );

  return (
    <section aria-labelledby="findings-title" className="page-frame landing-section">
      <div className="section-intro">
        <h2 id="findings-title" className="section-title">
          What the experiments showed
        </h2>
        <p className="section-lead">
          Most write-ups show the run that worked. Here every run counts, including the ones that failed. Success is
          measured on layouts the robot never saw.
        </p>
      </div>

      <ul className="big-numbers">
        {bigNumbers().map((item) => (
          <li key={item.value}>
            <Link href={item.href} className="big-number">
              <span className="big-number-value">{item.value}</span>
              <span className="big-number-caption">{item.caption}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="findings-plate">
        <div className="findings-plate-text">
          <h3 className="findings-plate-title">Watch a policy learn to look</h3>
          <p>
            Every dot is one attempt. For most of training the gripper closed in the same place whatever the scene.
            Then, within a short stretch, it began to close on the object it was asked for. The training loss gave no
            sign of either.
          </p>
        </div>
        <div className="min-w-0">
          <OnsetPlate data={data} caption={caption} note={note} />
        </div>
      </div>

      <h3 className="parts-title">The findings, one line each</h3>
      <ol className="finding-list">
        {statements.map((statement) => (
          <li key={statement.id}>
            <span className="finding-title">{statement.title}</span>
            <span className="finding-links">
              {bySlug(statement.chapter) ? (
                <Link href={`/learn/${statement.chapter}`} className="text-link">
                  Chapter
                </Link>
              ) : null}
              <Link href={resultsHref(statement.section)} className="text-link">
                Results
              </Link>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
