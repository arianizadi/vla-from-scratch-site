import type { Metadata } from "next";
import Link from "next/link";
import { RECIPE_STEPS, RecipeResult, StepCommand } from "@/components/site/RunRecipe";
import { getCourse } from "@/lib/course";
import { repoUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Run it yourself",
  description:
    "Optional: install the code, record examples, train a robot policy in a simulator and test it, one step at a time.",
  alternates: { canonical: "/run-it-yourself" },
};

export default function RunItYourselfPage() {
  const run = getCourse().extras.find((extra) => extra.id === "run");
  const first = getCourse().lessons[0];

  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <header className="page-header max-w-[760px]">
        <h1 className="page-title">Run it yourself</h1>
        <p className="page-lead">
          Train a robot arm in a simulator and watch it pick up what you name. Entirely optional: the course teaches
          every idea without any of this.
        </p>
        {first ? (
          <p className="mt-6 text-16 text-ink-muted">
            New here?{" "}
            <Link href={`/learn/${first.slug}`} className="text-link">
              Start with lesson 1
            </Link>{" "}
            instead; come back when you want to see it run.
          </p>
        ) : null}
      </header>

      <section aria-labelledby="steps-title" className="mt-14 max-w-[760px]">
        <h2 id="steps-title" className="run-section-title">
          Five steps
        </h2>
        <p className="run-section-lead">
          You need a Linux computer with an NVIDIA graphics card and a copy of the{" "}
          <a href={site.tutorialRepo} className="text-link">
            code on GitHub
          </a>
          . Each step is one command; open it when you are ready to run it.
        </p>
        <ol className="run-steps">
          {RECIPE_STEPS.map((step, index) => (
            <li key={step.title} className="run-step">
              <span className="run-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="run-step-title">{step.title}</h3>
                <p className="run-step-text">{step.text}</p>
                <StepCommand command={step.command} />
              </div>
            </li>
          ))}
        </ol>
        <RecipeResult />
      </section>

      <section aria-labelledby="guides-title" className="mt-20 max-w-[760px]">
        <h2 id="guides-title" className="run-section-title">
          The guides
        </h2>
        <p className="run-section-lead">Every detail, for when a step does something you did not expect.</p>
        <ul className="run-guides">
          {(run?.chapters ?? []).map((chapter) => (
            <li key={chapter.slug}>
              <Link href={`/learn/${chapter.slug}`} className="deeper-link">
                <span className="deeper-link-title">{chapter.title}</span>
                <span className="deeper-link-text">{chapter.blurb}</span>
              </Link>
            </li>
          ))}
          <li>
            <a href={repoUrl("README.md")} className="deeper-link">
              <span className="deeper-link-title">The README</span>
              <span className="deeper-link-text">Where these commands come from, with the rest of the options.</span>
            </a>
          </li>
          <li>
            <a href={repoUrl("sim/pickup/README.md")} className="deeper-link">
              <span className="deeper-link-title">The simulator&rsquo;s README</span>
              <span className="deeper-link-text">The tasks, the scenes and every script.</span>
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
