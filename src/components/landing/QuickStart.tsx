import Link from "next/link";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { Glyph } from "@/components/ui/Glyph";
import { finalCheckpointRow } from "@/data/checkpoints";
import { formatBoth, formatPercent, formatSamples } from "@/data/format";
import { run } from "@/data/runs";
import type { ChapterMeta } from "@/lib/content";
import { repoUrl, site } from "@/lib/site";

/**
 * The quick start of the tutorial repository's README, as it is written
 * there: demonstrations with random start poses and recoveries, the
 * no-history policy, the resilient trainer and the checkpoint evaluator.
 */
const RECIPE = [
  "uv sync --group preprocessing --group sim && sim/pickup/scripts/fetch_assets.sh",
  "sim/pickup/scripts/make_dataset.sh pick_target 4000 pick_target_4k --random_start --disturb_prob 0.5",
  "sim/pickup/scripts/train_resilient.sh dp_vit_lang_reactive pick_target_4k my_run 5000000",
  "sim/pickup/scripts/eval_checkpoints.sh experiments/pickup/my_run pick_target",
].join("\n");

const TESTS = [
  "sim/pickup/scripts/eval.sh experiments/pickup/my_run pick_target 100 --disturb reach",
  "sim/pickup/scripts/eval.sh experiments/pickup/my_run pick_target 100 --stale_images",
].join("\n");

/** The run of the data module that is this recipe: the same policy, dataset options and budget. */
const RECIPE_RUN = "dp_vit_lang_reactive_pt4k_rs_recover_posfix";

/** What became of the recipe here: its final checkpoint once reported, "still training" until then. */
function RecipeResult() {
  const entry = run(RECIPE_RUN);
  if (!entry) return null;
  if (entry.status === "in_progress") {
    return (
      <p className="mt-4 flex max-w-[680px] gap-2 text-14 text-ink-muted">
        <Glyph name="clock" className="mt-[3px] shrink-0 text-warning" />
        <span>
          <span className="font-medium text-warning">Still training.</span> The run of this recipe here (
          {entry.label}) has no result yet; it appears on the{" "}
          <Link href="/lab" className="text-link">
            results page
          </Link>{" "}
          when the lab notebook reports it.
        </span>
      </p>
    );
  }
  const row = finalCheckpointRow(RECIPE_RUN);
  if (!row) return null;
  const result = row.ema
    ? `${formatBoth(row.raw.rate, row.ema.rate, formatPercent)} (trained / averaged weights)`
    : `${formatPercent(row.raw.rate)} (trained weights)`;
  return (
    <p className="mt-4 max-w-[680px] text-14 text-ink-muted">
      Trained here ({entry.label}), this recipe&rsquo;s final checkpoint, after {formatSamples(row.samples)}{" "}
      samples, succeeded in {result} of episodes on unseen layouts. The rest of its results are on the{" "}
      <Link href="/lab" className="text-link">
        results page
      </Link>
      .
    </p>
  );
}

/** How to start: the commands from the tutorial's README. */
export function QuickStart({ firstRun }: { firstRun?: ChapterMeta }) {
  return (
    <section aria-labelledby="start-title" className="page-frame landing-section">
      <div className="section-intro">
        <h2 id="start-title" className="section-title">
          Run it yourself
        </h2>
        <p className="section-lead">
          In a clone of the{" "}
          <a href={site.tutorialRepo} className="text-link">
            tutorial repository
          </a>
          , one command per step: install and fetch the assets, collect demonstrations with the scripted expert
          (from random start poses, and in some episodes with the object moved and the expert recovering), train the
          policy, and evaluate every checkpoint closed-loop while training continues. The runs restart
          themselves when they die.
          {run(RECIPE_RUN)?.status === "in_progress"
            ? " This combined recipe is not yet measured here: its run is still training (below), and the results of each half are on the results page."
            : null}
        </p>
      </div>

      <div className="mt-6 max-w-[960px]">
        <CodeBlock data-label="bash" tabIndex={0}>
          <code>{RECIPE}</code>
        </CodeBlock>
      </div>
      <RecipeResult />

      <p className="mt-8 max-w-[680px] text-18 leading-7 text-ink-muted">
        Then test what a success rate cannot tell you: move the object while the robot reaches for it, and
        freeze the cameras on their first frame.
      </p>
      <div className="mt-4 max-w-[960px]">
        <CodeBlock data-label="bash" tabIndex={0}>
          <code>{TESTS}</code>
        </CodeBlock>
      </div>

      <p className="mt-6 max-w-[680px] text-14 text-ink-muted">
        The commands are those of the repository&rsquo;s{" "}
        <a href={repoUrl("README.md")} className="text-link">
          README
        </a>
        ; the{" "}
        <a href={repoUrl("sim/pickup/README.md")} className="text-link">
          simulator&rsquo;s README
        </a>{" "}
        has the rest.
        {firstRun ? (
          <>
            {" "}
            <Link href={`/learn/${firstRun.slug}`} className="text-link">
              {firstRun.title}
            </Link>{" "}
            runs the whole loop once on the single-cube task first.
          </>
        ) : null}
      </p>
    </section>
  );
}
