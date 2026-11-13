import Link from "next/link";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { Glyph } from "@/components/ui/Glyph";
import { finalCheckpointRow } from "@/data/checkpoints";
import { formatBoth, formatPercent, formatSamples } from "@/data/format";
import { run } from "@/data/runs";

/**
 * The quick start of the tutorial repository's README, as it is written
 * there, one step at a time: install and fetch the assets, record
 * demonstrations (random start poses, and recoveries when the object moves),
 * train the no-history policy with the resilient trainer, evaluate every
 * checkpoint; then the two tests a success rate cannot replace.
 */
export const RECIPE_STEPS = [
  {
    title: "Install",
    text: "Install the code and download the simulated scene: a robot arm, a table and three objects.",
    command: "uv sync --group preprocessing --group sim && sim/pickup/scripts/fetch_assets.sh",
  },
  {
    title: "Record examples",
    text: "A scripted teacher picks up the named object thousands of times. Each try is saved as an example for the robot to learn from.",
    command: "sim/pickup/scripts/make_dataset.sh pick_target 4000 pick_target_4k --random_start --disturb_prob 0.5",
  },
  {
    title: "Train",
    text: "The model practises copying the examples. This runs for hours and restarts itself if it stops.",
    command: "sim/pickup/scripts/train_resilient.sh dp_vit_lang_reactive pick_target_4k my_run 5000000",
  },
  {
    title: "Test",
    text: "Each saved copy of the model gets to act on scenes it has never seen, and the successes are counted.",
    command: "sim/pickup/scripts/eval_checkpoints.sh experiments/pickup/my_run pick_target",
  },
  {
    title: "Push it",
    text: "Then test what a success rate cannot tell you: move the object while the arm reaches, or freeze the camera on its first picture.",
    command: [
      "sim/pickup/scripts/eval.sh experiments/pickup/my_run pick_target 100 --disturb reach",
      "sim/pickup/scripts/eval.sh experiments/pickup/my_run pick_target 100 --stale_images",
    ].join("\n"),
  },
] as const;

/** The run of the data module that is this recipe: the same policy, dataset options and budget. */
const RECIPE_RUN = "dp_vit_lang_reactive_pt4k_rs_recover_posfix";

/** What became of the recipe here: its final checkpoint once reported, "still training" until then. */
export function RecipeResult() {
  const entry = run(RECIPE_RUN);
  if (!entry) return null;
  if (entry.status === "in_progress") {
    return (
      <p className="run-result">
        <Glyph name="clock" className="mt-[3px] shrink-0 text-warning" />
        <span>
          <span className="font-medium text-warning">Still training.</span> The run of this recipe here (
          {entry.label}) has no result yet; it appears in the{" "}
          <Link href="/lab" className="text-link">
            experiments
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
    <p className="run-result">
      <span>
        When we ran this recipe ({entry.label}), its final copy, after {formatSamples(row.samples)} training samples,
        succeeded in {result} of tries on scenes it had never seen. More in the{" "}
        <Link href="/lab" className="text-link">
          experiments
        </Link>
        .
      </span>
    </p>
  );
}

/** One step's command, folded like every other piece of code on the site. */
export function StepCommand({ command }: { command: string }) {
  return (
    <CodeBlock data-label="bash" data-lines={command.split("\n").length} tabIndex={0}>
      <code>{command}</code>
    </CodeBlock>
  );
}
