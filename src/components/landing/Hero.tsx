import Link from "next/link";
import type { ChapterMeta } from "@/lib/content";
import { OnsetPlate } from "./hero/OnsetPlate";
import { heroData } from "./hero/onset-data";

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

/** Headline and two ways in on the left; the hero plate, the tutorial's main finding, on the right. */
export function Hero({ chapters }: { chapters: ChapterMeta[] }) {
  const first = chapters[0];
  const start = first
    ? { href: `/learn/${first.slug}`, label: `Start at chapter ${first.order}` }
    : { href: "/learn", label: "Open the curriculum" };
  const data = heroData();
  const bySlug = (slug: string) => chapters.find((chapter) => chapter.slug === slug);
  const policySteps = (data.weights[0] && data.stages[data.weights[0].value]) || [];
  const firstStep = policySteps[0];
  const lastStep = policySteps[policySteps.length - 1];
  const episodes = data.episodes !== null ? `${data.episodes} ` : "";

  // The caption is the point in two sentences; how to read the plate and where the numbers come from fold
  // behind "How this was measured", so plate and controls fit one screen.
  const caption = (
    <>
      Each dot is where the gripper first closed in one of the {episodes}evaluation episodes, drawn around the
      object the instruction named.
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
      Seen from above, on layouts the policy never saw; every step shows the same layouts. &ldquo;On the
      table&rdquo; puts every dot and object where it was, joined by a line. The policy is the patch-token policy
      with instruction tokens ({data.runLabel}). Closed-loop evaluation{data.machine ? ` on ${data.machine}` : ""},
      one training seed. Slope: of where the gripper closed against where the named object was; 1 goes to the
      object, 0 ignores the scene. How to read a plot like this:{" "}
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
    <section className="page-frame grid gap-x-8 gap-y-10 pt-10 xl:grid-cols-12 xl:pt-16">
      <div className="xl:col-span-5">
        <h1 className="text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-bold tracking-[-0.02em] text-balance stretch-80">
          From one sentence to a closed gripper
        </h1>
        <p className="mt-6 max-w-[520px] font-serif text-20 leading-[1.875rem] text-ink-muted">
          A hands-on guide to the models behind robot manipulation: a language model, a vision-language model
          and a vision-language-action policy, each built from the ground up and measured in a simulator.
        </p>
        <p className="mt-4 max-w-[520px] font-serif text-18 leading-[1.875rem] text-ink-muted">
          The plate shows the finding the tutorial keeps returning to. For most of its training this policy
          closed the gripper in the same place whatever the scene; then, within a short stretch of training,
          it began to close on the object it was asked for. The training loss gave no sign of either.
        </p>
        <p className="mt-8 flex flex-wrap gap-3">
          <Link href={start.href} className="button button-primary">
            {start.label}
          </Link>
          <Link href="/lab" className="button">
            See the results
          </Link>
        </p>
      </div>
      <div className="min-w-0 max-w-[820px] xl:col-span-7">
        <OnsetPlate data={data} caption={caption} note={note} />
      </div>
    </section>
  );
}
