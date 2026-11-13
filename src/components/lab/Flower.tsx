/**
 * Section 9 of the lab page: the first five steps toward flower trimming, on
 * machine B, the physics change after them, and the pruning runs still
 * training. None of these runs is in the experiment export, so every value
 * comes from the notebook through src/data/notebook.json (flowerTrimming);
 * the runs still training are marked as the notebook marks them. The pruning
 * steps' words and expert rates come from the roadmap (PRUNING_STEPS). Server
 * component.
 */

import { slug } from "github-slugger";
import Link from "next/link";
import type { ReactNode } from "react";
import { MISSING, formatCount } from "@/data/format";
import { MACHINES } from "@/data/labels";
import { flowerTrimming, pruning, type FlowerCondition, type FlowerPartial, type FlowerRow } from "@/data/notebook";
import type { Count } from "@/data/types";
import { repoUrl } from "@/lib/site";
import type { ChapterFor } from "./BeforeFix";
import { SECTIONS } from "./sections";
import { CodeText, InProgressBadge, InProgressCell, LabSection, RowLink, SubHead, TableBox, TableNote, noteHref } from "./shared";
import styles from "./styles";

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

const count = (value: Count) => formatCount(value.successes, value.episodes);
/** One count, or trained / averaged: "35/100 / 28/100". */
const counts = (values: Count[]) => (values.length > 0 ? values.map(count).join(" / ") : MISSING);
const percent = (value: number | null | undefined) => (value === null || value === undefined ? MISSING : `${value}%`);

/** What a run still training has reported so far, as the notebook words it. */
function partialText(partial: FlowerPartial): string {
  const samples = partial.samplesAboutM !== undefined ? ` (about ${partial.samplesAboutM}M samples)` : "";
  const note = partial.note ? `, ${partial.note}` : "";
  return `${counts(partial.counts)} after ${partial.checkpoint} of ${partial.checkpoints} checkpoints${samples}${note}`;
}

/** The roadmap's heading for this ladder; a link to it lands on the file when the heading changes. */
const ROADMAP_HEADING = "Phase 4: toward flower trimming  (started 2026-11-12)";

/**
 * Steps 6-8 of the roadmap, the pruning tasks themselves, as its table words them. The roadmap is
 * not checked by the sync scripts: when its table changes, change these by hand.
 */
const PRUNING_STEPS = [
  {
    step: 6,
    task: "prune_one",
    title: "One side shoot",
    what: "the plant on its stand, one shoot facing the robot; cut it off, keep the flower",
    expert: "100%",
  },
  {
    step: 7,
    task: "prune_turn",
    title: "Turning the plant",
    what: "one shoot at any angle; press a button to turn it into reach, then cut",
    expert: "100%",
  },
  {
    step: 8,
    task: "prune",
    title: "Pruning",
    what: "2-3 shoots at any angles, turn and cut each, the flower untouched",
    expert: "100% (about 515 control steps)",
  },
] as const;

/** Each pruning step's policies: final checkpoint, averaged weights, one count per training seed. */
const PRUNING_RESULTS: Record<(typeof PRUNING_STEPS)[number]["task"], { pruned: Count[]; recipe: string; more?: string }> = {
  prune_one: { pruned: pruning.one.pruned, recipe: "4000 demonstrations, 5M samples" },
  prune_turn: { pruned: pruning.turn.pruned, recipe: "4000 demonstrations, 10M samples" },
  prune: {
    pruned: pruning.full.pruned,
    recipe: `2000 demonstrations, ${pruning.full.budgetM}M samples`,
    more: `from 4000 demonstrations: ${pruning.full.pruned4k.map(count).join(", ")}`,
  },
};

const STEPS = {
  drift: flowerTrimming.drift.section,
  lookalike: flowerTrimming.lookalike.section,
  clutter: flowerTrimming.clutter.section,
  stem: flowerTrimming.stem.section,
  cut: flowerTrimming.cut.section,
} as const;
type StepKey = keyof typeof STEPS;

/** A step's heading: the notebook's own, with its anchor, so that /lab#step-... lands here. */
function StepHead({ step }: { step: StepKey }) {
  return (
    <SubHead id={slug(STEPS[step])}>
      <CodeText text={STEPS[step]} />
    </SubHead>
  );
}

/** "Step 4", from the notebook's heading of the step. */
const stepName = (step: StepKey) => STEPS[step].split(":")[0];

// ---------------------------------------------------------------- pieces

/** The first cell of a row: its words, the run's name as the notebook writes it, and a badge for a run still training. */
function RowHead({ id, row }: { id: string; row: Pick<FlowerRow, "words" | "run" | "detail" | "partial" | "inProgress"> & { extra?: ReactNode } }) {
  const words = capital(row.words);
  const running = row.inProgress || row.partial !== undefined;
  return (
    <th scope="row" className={styles.wrap}>
      <CodeText text={words} />
      <RowLink id={id} label={words.replaceAll("`", "")} />
      {row.run ? (
        <span className={styles.cellDetail}>
          <code className={styles.inlineCode}>{row.run}</code>
        </span>
      ) : null}
      {row.detail ? (
        <span className={styles.cellDetail}>
          <CodeText text={row.detail} />
        </span>
      ) : null}
      {row.extra ? <span className={styles.cellDetail}>{row.extra}</span> : null}
      {running ? (
        <span className={styles.cellDetail}>
          <InProgressBadge />
        </span>
      ) : null}
    </th>
  );
}

/** A film of a policy at work, with the browser's own controls; nothing plays until the reader starts it. */
function Film({ name, title, children }: { name: string; title: string; children: ReactNode }) {
  const src = `/video/${name}.mp4`;
  return (
    <figure className={`image-figure ${styles.film} ${styles.blockGap}`}>
      <video
        controls
        preload="metadata"
        playsInline
        poster={`/video/${name}.jpg`}
        width={1920}
        height={1080}
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
        <a href={src} className="text-link">
          {title} (MP4)
        </a>
      </video>
      <figcaption>{children}</figcaption>
    </figure>
  );
}

/** Success at each checkpoint, one row per run, as the notebook lists it. */
function CheckpointStrip({ label, rows }: { label: string; rows: { id: string; words: string; cells: string[] }[] }) {
  const width = Math.max(...rows.map((row) => row.cells.length));
  return (
    <TableBox label={label}>
      <thead>
        <tr>
          <th scope="col">Checkpoint</th>
          {Array.from({ length: width }, (_, index) => (
            <th key={index} scope="col" className="num">
              {index + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} id={row.id}>
            <th scope="row" className={styles.wrap}>
              {capital(row.words)}
              <RowLink id={row.id} label={row.words} />
            </th>
            {row.cells.map((cell, index) => (
              <td key={index} className="num">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableBox>
  );
}

/** A policy under the conditions the notebook lists in a sentence. */
function ConditionsTable({ label, idPrefix, rows }: { label: string; idPrefix: string; rows: FlowerCondition[] }) {
  return (
    <TableBox label={label}>
      <thead>
        <tr>
          <th scope="col">Condition</th>
          <th scope="col" className="num">
            Success
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const id = `${idPrefix}-${slug(row.words)}`;
          const words = capital(row.words);
          return (
            <tr key={row.words} id={id}>
              <th scope="row" className={styles.wrap}>
                {words}
                <RowLink id={id} label={words} />
              </th>
              <td className="num">
                {counts(row.counts)}
                {row.retried !== undefined ? <span className={styles.cellDetail}>{row.retried} retried</span> : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableBox>
  );
}

/** A table of policies with a success column and, when given, where the first close was. */
function PolicyTable({
  label,
  idPrefix,
  rows,
  success,
  named,
}: {
  label: string;
  idPrefix: string;
  rows: FlowerRow[];
  success: string;
  named?: string;
}) {
  const columns = named ? 2 : 1;
  return (
    <TableBox label={label}>
      <thead>
        <tr>
          <th scope="col">Policy</th>
          <th scope="col" className="num">
            {success}
          </th>
          {named ? (
            <th scope="col" className="num">
              {named}
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const id = `${idPrefix}-${row.id}`;
          const extra = row.ownTask ? `on its own task ${counts(row.ownTask)}` : null;
          return (
            <tr key={row.id} id={id}>
              <RowHead id={id} row={{ ...row, extra }} />
              {row.partial || row.inProgress ? (
                <InProgressCell colSpan={columns}>{row.partial ? partialText(row.partial) : undefined}</InProgressCell>
              ) : (
                <>
                  <td className="num">{counts(row.counts)}</td>
                  {named ? <td className="num">{percent(row.named)}</td> : null}
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </TableBox>
  );
}

// ---------------------------------------------------------------- the steps

function DriftStep() {
  const step = flowerTrimming.drift;
  const demos = step.demonstrations;
  return (
    <>
      <StepHead step="drift" />
      <div className={styles.prose}>
        <p>
          The named object slides on a winding path at a fixed speed whenever the gripper is open; it turns away from
          the edge of the area and from the other objects. In the demonstrations of{" "}
          <code>{step.run}</code>, {demos.sliding} of the {demos.total} slide while the expert follows the object, each at
          its own speed between {demos.speedCmS[0]} and {demos.speedCmS[1]} cm/s; {demos.duringReach} are moved during the
          reach and {demos.atGrasp} at the grasp; {demos.undisturbed} are undisturbed.
        </p>
      </div>

      <Film name="flower-step1-moving-target" title="A target that keeps moving: the policy trained with sliding objects">
        The policy trained with sliding objects, on layouts it never saw. The named object slides whenever the gripper is
        open; orange marks where it started and the path it slid along. At the right, the view from above and the
        policy&rsquo;s own two cameras. The film shows a few episodes; the table below gives the rates.
      </Film>

      <TableBox label="Picking up an object that keeps sliding, at three speeds">
        <thead>
          <tr>
            <th scope="col">Who</th>
            {step.speedsCmS.map((speed) => (
              <th key={speed} scope="col" className="num">
                {speed} cm/s
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {step.rows.map((row) => {
            const id = `flower-drift-${row.id}`;
            return (
              <tr key={row.id} id={id}>
                <RowHead id={id} row={row} />
                {row.counts.map((value, index) => (
                  <td key={index} className="num">
                    {count(value)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>The object slides at that speed whenever the gripper is open.</TableNote>

      <p className={`${styles.prose} ${styles.blockGap}`}>
        The sliding demonstrations cost nothing elsewhere: the same policy under the conditions of section{" "}
        {SECTIONS.outside.number}, and checkpoint by checkpoint.
      </p>
      <ConditionsTable label="The policy trained with sliding objects, under other conditions" idPrefix="flower-drift-condition" rows={step.conditions} />
      <CheckpointStrip
        label="The policy trained with sliding objects, by checkpoint"
        rows={[{ id: "flower-drift-checkpoints", words: "averaged weights", cells: step.checkpoints.map(String) }]}
      />
      <TableNote>Successes out of {flowerTrimming.recipe.layouts} layouts. Two counts: trained / averaged weights.</TableNote>
    </>
  );
}

function LookalikeStep() {
  const step = flowerTrimming.lookalike;
  const { switch: change, carryOver } = step;
  const [first, second] = change.switchedAt;
  return (
    <>
      <StepHead step="lookalike" />
      <p className={styles.prose}>
        Three cubes of one shape drawn from red, orange, pink and dark red; only the colour word of the instruction tells
        them apart. The expert takes the named cube in {counts(step.expert)}, with one plan and planning again.
      </p>
      <PolicyTable
        label="Look-alike cubes"
        idPrefix="flower-lookalike"
        rows={step.rows}
        success="Look-alikes"
        named="Closed at the named cube"
      />
      <TableNote>A dash: the notebook leaves the cell empty.</TableNote>

      <p className={`${styles.prose} ${styles.blockGap}`}>
        Look-alikes are learnable from look-alike scenes alone, but when the policy starts to tell them apart depends on
        the seeds.
      </p>
      <CheckpointStrip
        label="Look-alikes by checkpoint: success, and a wrong cube lifted in brackets"
        rows={step.checkpoints.rows.map((row) => ({
          id: `flower-lookalike-checkpoints-${slug(row.words)}`,
          words: row.words,
          cells: row.values.map((value) => `${value.success} (${value.wrong})`),
        }))}
      />
      <TableNote>
        Averaged weights, out of {flowerTrimming.recipe.layouts} layouts; in brackets, the episodes in which a wrong cube
        was lifted. Checkpoints are about {step.checkpoints.spacingAboutM}M samples apart, except in the 10M-sample row.
        The two clutter rows are the policies of step 3, each on its own task.
      </TableNote>
      <div className={`${styles.prose} ${styles.blockGap}`}>
        <p>
          The switch is sudden, as on <code>pick_target</code> (
          <Link href={noteHref(7)} className="text-link">
            field notes, entry 7
          </Link>
          ): from a wrong cube in about {change.wrongAboutPercent}% of episodes to none within one checkpoint. With seed{" "}
          {first.seed} it comes after about {first.samplesAboutM}M samples, with seed {second.seed} after about{" "}
          {second.samplesAboutM}M, with seed {change.notWithin.seed} not within {change.notWithin.samplesM}M. In the two
          runs whose scenes also hold other shapes it came by the second checkpoint. Seed {change.notWithin.seed} with
          twice the samples does learn, but gradually rather than all at once: {counts(change.longer.counts)} at the end,
          a wrong cube still lifted in {change.longer.wrongPercent}%. A look-alike run that has not switched by the end of
          its budget looks exactly like one that cannot learn the task; a second seed is what tells them apart.
        </p>
        <p>
          What carries over: the policy trained on clutter without leaves picks the named look-alike in{" "}
          {count(carryOver.noLeaves.lookalike)} and, never having seen a leaf, {count(carryOver.noLeaves.withLeaves)} on
          clutter with leaves; the look-alike policy with seed {first.seed} ({count(carryOver.seed43.ownTask)} on its own
          task) manages {count(carryOver.seed43.clutter)} on clutter, with a wrong object lifted in{" "}
          {carryOver.seed43.wrongPercent}%.
        </p>
      </div>
    </>
  );
}

function ClutterStep() {
  const step = flowerTrimming.clutter;
  return (
    <>
      <StepHead step="clutter" />
      <p className={styles.prose}>
        Four objects from seven (the four shapes of <code className={styles.inlineCode}>pick_target</code> and the three
        look-alike cubes) and three upright leaves, each standing between an object and the front camera; the leaves are
        seen, not touched. The expert takes the named object in {counts(step.expert)}.
      </p>

      <Film name="flower-step3-clutter-and-leaves" title="Clutter and occlusion: the policy trained on clutter">
        The policy trained on clutter, on layouts it never saw. In the large view the leaves are drawn see-through so that
        what they hide stays visible; the policy&rsquo;s own cameras, bottom right, see them solid. The film shows a few
        episodes; the table below gives the rates.
      </Film>

      <PolicyTable
        label="Clutter and occlusion"
        idPrefix="flower-clutter"
        rows={step.rows}
        success="Clutter"
        named="Closed at the named object"
      />

      <p className={`${styles.prose} ${styles.blockGap}`}>The clutter policy under other conditions, and checkpoint by checkpoint.</p>
      <ConditionsTable label="The clutter policy under other conditions" idPrefix="flower-clutter-condition" rows={step.conditions} />
      <CheckpointStrip
        label="The clutter policy, by checkpoint"
        rows={[{ id: "flower-clutter-checkpoints", words: "averaged weights", cells: step.checkpoints.map(String) }]}
      />
      <TableNote>Successes out of {flowerTrimming.recipe.layouts} layouts. Sliding is not in its demonstrations.</TableNote>
    </>
  );
}

function StemStep() {
  const step = flowerTrimming.stem;
  const { success, expert, failures, caught, expertDrives, diagnosis, expertSide, moreRuns } = step;
  const closed = failures.closedSteps;
  return (
    <>
      <StepHead step="stem" />
      <p className={styles.prose}>
        Three flowers drawn from four (red, orange, pink and purple heads on green stems in heavy bases); the instruction
        is &ldquo;grasp the stem of the &hellip; flower&rdquo;. Success: the gripper is commanded shut with the named stem
        between the fingers and inside the fingertips&rsquo; depth, a finger touching it, the gripper&rsquo;s centre inside
        the band {success.bandCm[0]}-{success.bandCm[1]} cm above the table and the stem upright, for {success.holdSteps}{" "}
        control steps in a row. The expert turns the gripper horizontal and comes in across the table from the side with
        more room. It succeeds in {counts(expert.counts)}; in {expert.stalls} it stalls before reaching the stem and never
        closes, in {expert.closesAndFails} it closes and fails.
      </p>
      <PolicyTable label="Grasping the named stem" idPrefix="flower-stem" rows={step.rows} success="Grasp the stem" />
      <CheckpointStrip
        label="The stem policies, by checkpoint"
        rows={[
          { id: "flower-stem-checkpoints", words: "trained on stems", cells: step.checkpoints.values.map(String) },
          { id: "flower-stem-checkpoints-10m", words: "the same for 10M samples", cells: moreRuns.tenM.checkpoints.map(String) },
        ]}
      />
      <TableNote>
        Successes out of {flowerTrimming.recipe.layouts} layouts; the strip is the averaged weights. Over its checkpoints
        the stem policy trained on {flowerTrimming.recipe.samplesM}M samples never passes{" "}
        {count(step.checkpoints.neverPasses)}; with other seeds it never passes {moreRuns.seed43NeverAbove}/
        {flowerTrimming.recipe.layouts}.
      </TableNote>

      <div className={`${styles.prose} ${styles.blockGap}`}>
        <p>
          Where it fails, at checkpoint {failures.checkpoint} with the averaged weights, on {failures.layouts} layouts
          rolled out with every control step recorded: in {failures.neverCloses} it never closes within{" "}
          {failures.withinCm} cm of the named stem; in {failures.heldThenLost} the stem is held by the test above at
          some step, but the hold lasts {failures.heldSteps[0]}-{failures.heldSteps[1]} steps before a finger loses it;{" "}
          {failures.succeeds} succeeds. Over the closed steps within {failures.withinCm} cm of the named stem, no finger
          touches it {closed.noFinger}% of the time, the stem is outside the fingertips&rsquo; depth {closed.outsideDepth}%
          of the time, outside the jaws sideways {closed.outsideSideways}%, and the gripper is outside the band{" "}
          {closed.outsideBand}%. The first close is nearest the named stem in {failures.firstCloseNamed}% of episodes
          (chance {failures.chance}%): the flowers&rsquo; heads are themselves look-alikes.
        </p>
        <p>
          The evaluation now also reports <code>caught_rate</code>, the share of episodes in which the named stem was
          held at any step: for the final stem policy, {count(caught.caught)} caught and {count(caught.held)} held
          for {caught.holdSteps} steps. Executing {caught.fewerActions.executed} actions per chunk instead of{" "}
          {caught.fewerActions.insteadOf} does not help ({counts(caught.fewerActions.counts)}, caught{" "}
          {count(caught.fewerActions.caught)}).
        </p>
        <p>
          Other seeds do not change it, and twice the samples help slowly. The 10M-sample policy closes in almost every
          episode and catches the named stem in about {moreRuns.tenM.caughtAboutPercent}%, but in another{" "}
          {moreRuns.tenM.otherHeldPercent[0]}-{moreRuns.tenM.otherHeldPercent[1]}% it holds another stem, and its first
          close is nearest the named stem in only {moreRuns.tenM.firstCloseNamed[0]}-{moreRuns.tenM.firstCloseNamed[1]}%:
          the problem of {stepName("lookalike").toLowerCase()}, telling look-alikes apart, is back, and not solved by 10M
          samples here.
        </p>
        <p>Where it goes wrong shows when the expert drives the first control steps toward the named stem and the policy then takes over.</p>
      </div>
      <TableBox label="The stem policy after the expert drives the first steps">
        <thead>
          <tr>
            <th scope="col">Expert drives</th>
            <th scope="col" className="num">
              Grasp the stem ({expertDrives.graspSteps} steps)
            </th>
            <th scope="col" className="num">
              Caught at some step
            </th>
            <th scope="col" className="num">
              First close nearest the named stem
            </th>
            <th scope="col" className="num">
              Cut the named stem ({expertDrives.cutSteps} steps)
            </th>
          </tr>
        </thead>
        <tbody>
          {expertDrives.rows.map((row) => {
            const id = `flower-stem-drives-${row.id}`;
            return (
              <tr key={row.id} id={id}>
                <RowHead id={id} row={row} />
                <td className="num">{count(row.grasp)}</td>
                <td className="num">{count(row.caught)}</td>
                <td className="num">{percent(row.firstCloseNamed)}</td>
                <td className="num">
                  {row.cut ? count(row.cut) : MISSING}
                  {row.cut && row.otherCut !== null ? (
                    <span className={styles.cellDetail}>
                      {row.otherCut} other {row.otherCut === 1 ? "stem" : "stems"} cut
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>
        The stem policy&rsquo;s final checkpoint, averaged weights. The cut column is the test of step 5, held for{" "}
        {expertDrives.cutSteps} steps. A dash: the notebook reports no value.
      </TableNote>

      <div className={`${styles.prose} ${styles.blockGap}`}>
        <p>
          One second of the expert is enough to make the policy catch the named stem most of the time, so the first
          failure is at the very start: committing to a stem and a side. The expert takes the side whose path in passes
          farthest from the other stems, so in a given layout either side is about as likely, and the two sides need
          opposite turns of the wrist from the first step. A second failure is holding still: even started well, the
          policy keeps the stem for {diagnosis.holdSteps} steps in only a tenth of the episodes, though for{" "}
          {diagnosis.cutSteps} steps (a cut) in about {diagnosis.cutAboutPercent}%.
        </p>
        <p>
          <code>{expertSide.command}</code> makes the side follow from where the stem stands: in from the outer edge of
          the table toward its middle, the other side only when that path passes within {expertSide.clearanceCm} cm of
          another stem. The expert cuts {count(expertSide.cut)} that way ({count(expertSide.withClearance)} with the
          clearance rule). A first version, always the side away from the front camera, cut only{" "}
          {count(expertSide.firstVersion)}: it failed on stems right of the robot&rsquo;s middle line (
          {expertSide.firstVersionFailedRight.successes} of {expertSide.firstVersionFailedRight.episodes}).
        </p>
      </div>
    </>
  );
}

function CutStep() {
  const step = flowerTrimming.cut;
  const recipe = flowerTrimming.recipe;
  const { diagnosis, tail, conclusion, films, tenM, seeds } = step;
  const [shareThisRun, shareFiveM] = [tenM.peakLearningRateShare.thisRun, tenM.peakLearningRateShare.fiveM];
  const [low, high] = step.overCheckpoints.range;
  return (
    <>
      <StepHead step="cut" />
      <p className={styles.prose}>
        The same scene; the instruction is &ldquo;cut the stem of the &hellip; flower&rdquo;. Each flower is built as a base
        and a top part (upper stem and head) held by a weld; when the test of {stepName("stem").toLowerCase()} holds on a
        stem for {step.holdSteps} control steps in a row, the stem is cut at the gripper&rsquo;s height (clipped to the
        band) and the top part falls. Cutting the named stem is a success; cutting any other ends the episode as a failure.
      </p>
      <TableBox label="Cutting the named stem">
        <thead>
          <tr>
            <th scope="col">Who</th>
            <th scope="col" className="num">
              Cut the named stem
            </th>
            <th scope="col" className="num">
              Cut another stem
            </th>
          </tr>
        </thead>
        <tbody>
          {step.rows.map((row) => {
            const id = `flower-cut-${row.id}`;
            return (
              <tr key={row.id} id={id}>
                <RowHead id={id} row={row} />
                {row.inProgress ? (
                  <InProgressCell colSpan={2} />
                ) : (
                  <>
                    <td className="num">{counts(row.named)}</td>
                    <td className="num">{counts(row.other)}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>Two counts: trained / averaged weights.</TableNote>
      <div className={`${styles.prose} ${styles.blockGap}`}>
        <p>
          The policies trained on cuts do worse than the stem policy they were meant to improve on: {low}-{high}/
          {step.overCheckpoints.episodes} over their checkpoints with either side rule. The outer-edge one closes its
          gripper in {diagnosis.closesPercent[0]}-{diagnosis.closesPercent[1]}% of episodes, its first close is nearest
          the named stem in {diagnosis.firstCloseNamed[0]}-{diagnosis.firstCloseNamed[1]}% (the stem policy:{" "}
          {diagnosis.stemPolicyFirstCloseNamed}%), yet the named stem is caught at any step in only{" "}
          {diagnosis.caughtPercent[0]}-{diagnosis.caughtPercent[1]}%.
        </p>
        <p>
          Rolled out step by step ({diagnosis.layouts} layouts, final checkpoint, averaged weights): in{" "}
          {diagnosis.closedSteps} closed control steps within {diagnosis.withinCm} cm of the named stem, the stem lies
          between the jaws and inside the band, but no finger touches it in {diagnosis.noFingerPercent}% of them. The
          gripper is commanded shut for about three steps and then opened again, before the fingers (about{" "}
          {diagnosis.fingerSteps} steps from open to the stem) arrive. The demonstrations explain it: a cut ends the
          episode {diagnosis.cutEndsAfterSteps} steps after the jaws reach the stem, so the shut gripper appears in only
          the last {diagnosis.shutFrames[0]}-{diagnosis.shutFrames[1]} frames of each one (the stem demonstrations hold
          it for {diagnosis.stemShutFrames[0]}-{diagnosis.stemShutFrames[1]}), and in no frame does the scene show a shut
          gripper still waiting for a stem.
        </p>
        <p>
          <code>{tail.command}</code> keeps recording N frames after each success with the robot holding its last
          command, so every cut demonstration ends with the jaws shut for {tail.shutFrames[0]}-{tail.shutFrames[1]}{" "}
          frames. To separate cutting from choosing the stem, <code>cut_one</code> is the same cut with a single flower
          (the expert cuts {count(tail.cutOneExpert)} with either side rule). All the demonstrations below come in from
          the outer edge.
        </p>
      </div>

      <TableBox label="Cutting with the jaws held shut past the cut, and with one flower">
        <thead>
          <tr>
            <th scope="col">Policy</th>
            <th scope="col">Task</th>
            <th scope="col" className="num">
              Cut the named stem
            </th>
            <th scope="col" className="num">
              Cut another stem
            </th>
            <th scope="col" className="num">
              First close nearest the named stem
            </th>
          </tr>
        </thead>
        <tbody>
          {step.tailRows.map((row) => {
            const id = `flower-cut-tail-${row.id}`;
            return (
              <tr key={row.id} id={id}>
                <RowHead id={id} row={row} />
                <td>
                  <code className={styles.inlineCode}>{row.task}</code>
                </td>
                <td className="num">{row.best ? <strong>{counts(row.named)}</strong> : counts(row.named)}</td>
                <td className="num">{counts(row.other)}</td>
                <td className="num">
                  {row.firstCloseNamed.length > 0 ? row.firstCloseNamed.map(percent).join(" / ") : MISSING}
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>
        Final checkpoint. Two values: trained / averaged weights. A dash: the notebook leaves the cell empty; with one
        flower there is no other stem.
      </TableNote>

      <Film name={films.cutOne.name} title="A cut with one flower: the policy trained with the jaws held shut past the cut">
        The one-flower policy trained with the jaws held shut past the cut, final checkpoint, averaged weights, on layouts
        it never saw, with the corrected physics, under which it cuts {count(films.cutOne.newPhysics)}:{" "}
        {films.cutOne.shown} of {films.cutOne.recorded} recorded episodes shown, {films.cutOne.cut} of them cut. The
        learned policy drives until the cut; then a script opens the jaws and draws the arm back, so that the cut-off top
        can be seen to fall.
      </Film>

      <CheckpointStrip
        label="Cutting by checkpoint: the named stem cut, and another stem cut in brackets"
        rows={step.tailCheckpoints.map((row) => ({
          id: `flower-cut-checkpoints-${slug(row.words)}`,
          words: row.words,
          cells: row.values.map((value) => (value.other === null ? String(value.cut) : `${value.cut} (${value.other})`)),
        }))}
      />
      <TableNote>
        Averaged weights, out of {flowerTrimming.recipe.layouts} layouts; in brackets, the episodes in which another stem
        was cut. The one-flower rows are on <code className={styles.inlineCode}>cut_one</code>, the three-flower rows on{" "}
        <code className={styles.inlineCode}>cut_stem</code>.
      </TableNote>

      <p className={`${styles.prose} ${styles.blockGap}`}>
        Ten frames of a held gripper are the whole difference between a policy that never cuts and one that cuts{" "}
        {conclusion.cutOne.successes} times in {conclusion.cutOne.episodes}, from its first checkpoint on (
        {conclusion.firstCheckpoint} after about {conclusion.firstCheckpointSamplesAboutM}M samples). With three flowers
        the cutting itself is solved too: once the named stem is between the jaws it is cut almost every time (caught{" "}
        {conclusion.caught}, cut {conclusion.cut}). What is left is choosing the stem: the first close is nearest the named
        stem in {conclusion.firstCloseNamed[0]}-{conclusion.firstCloseNamed[1]}% of episodes, which is chance with three
        flowers, and another stem is cut in {conclusion.otherCutPercent[0]}-{conclusion.otherCutPercent[1]}%. The
        instruction&rsquo;s colour word is not used at all: the problem of {stepName("lookalike").toLowerCase()} in a
        scene where it did not solve itself (red, orange and pink heads are look-alikes; purple is the only colour far
        from the others).
      </p>

      <div className={`${styles.prose} ${styles.blockGap}`}>
        <p>
          <strong>Choosing the stem: twice the training budget.</strong> The same {recipe.demos} demonstrations with the
          tail, trained for {tenM.samplesM}M samples (<code>{tenM.run}</code>; checkpoints about {tenM.spacingAboutM}M
          samples apart), cut the named stem in {counts(tenM.named)}, another stem in {counts(tenM.other)}, and its first
          close is nearest the named stem in {tenM.firstCloseNamed}% (the scripted expert cuts {count(tenM.expert)}). By
          flower, averaged weights:{" "}
          {tenM.byFlower.map((row, index) => (
            <span key={row.flower}>
              {index > 0 ? ", " : null}
              {row.flower} {count(row.cut)}
            </span>
          ))}
          .
        </p>
        <p>
          Up to about {tenM.sameAsFiveMUntilAboutM}M samples it is the {recipe.samplesM}M run again; by about{" "}
          {tenM.switchAboutM}M it has started to use the colour word, all at once, the same late and sudden switch as the
          look-alike cubes of {stepName("lookalike").toLowerCase()}. That is before the {recipe.samplesM}M run ended, so
          the difference is not simply more samples: the learning rate follows a cosine over the planned budget (
          <code>lr_scheduler: {tenM.learningRate.scheduler}</code>, peak {tenM.learningRate.peak}), and at{" "}
          {tenM.switchAboutM}M samples this run still had about {shareThisRun}% of its peak rate, the {recipe.samplesM}M
          run about {shareFiveM}%.
        </p>
      </div>
      <CheckpointStrip
        label={`Cutting the named stem with three flowers, ${tenM.samplesM}M samples, by seed`}
        rows={seeds.rows.map((row) => ({
          id: `flower-cut-10m-checkpoints-${slug(row.words)}`,
          words: row.run ? `${row.words} (${row.run})` : row.words,
          cells: row.values.map((value) => `${value.cut} (${value.other})`),
        }))}
      />
      <TableNote>
        Averaged weights on <code className={styles.inlineCode}>cut_stem</code>, out of {flowerTrimming.recipe.layouts}{" "}
        layouts; in brackets, the episodes in which another stem was cut. Checkpoints are about {tenM.spacingAboutM}M
        samples apart. Seed 42 is the run above; the last row trains on {seeds.conclusion.demos} demonstrations instead of{" "}
        {recipe.demos}.
      </TableNote>
      <p className={`${styles.prose} ${styles.blockGap}`}>
        Two seeds of three switch at the same checkpoint (about {seeds.conclusion.switchAboutM}M samples) and end at{" "}
        {seeds.conclusion.end[0]}-{seeds.conclusion.end[1]}/{flowerTrimming.recipe.layouts} with another stem cut in{" "}
        {seeds.conclusion.otherCutPercent[0]}-{seeds.conclusion.otherCutPercent[1]}%; the third climbs slowly and ends at{" "}
        {seeds.conclusion.slowEnd}. From {seeds.conclusion.demos} demonstrations the switch never comes within{" "}
        {seeds.conclusion.withinM}M samples: four times the demonstrations at the same number of samples means each one is
        seen a quarter as often. As with the look-alike cubes, a run that has not switched looks the same as one that
        cannot; other seeds tell them apart.
      </p>

      <Film name={films.cutStem.name} title="Cutting the named stem among three flowers: the policy trained for 10M samples">
        The three-flower policy trained for {tenM.samplesM}M samples, final checkpoint, averaged weights, on layouts it
        never saw, with the corrected physics, under which it cuts the named stem in {count(films.cutStem.newPhysics)}{" "}
        and another stem in {films.cutStem.other}: {films.cutStem.shown} of {films.cutStem.recorded} recorded episodes
        shown, {films.cutStem.cut} of them cut. The learned policy drives until the cut; then a script opens the jaws and
        draws the arm back, so that the cut-off top can be seen to fall.
      </Film>
    </>
  );
}

// ---------------------------------------------------------------- the physics change, and pruning

function PhysicsChange() {
  const physics = flowerTrimming.physics;
  const [shallow, deep] = physics.deepestNowMm;
  return (
    <>
      <SubHead id="flower-physics-change">Physics change</SubHead>
      <p className={styles.prose}>
        After the runs of steps 1-5, an audit of every contact found the arm sinking into solid things. With
        MuJoCo&rsquo;s default soft contacts (time constant {physics.softTimeConstantS} s) the position-controlled arm
        pressed the hand {physics.handIntoTableMm} mm into the table and a finger {physics.fingerIntoFlowerMm} mm into a
        flower, and after a cut the top part slid down through its own base stem: the two stem pieces were excluded from
        colliding with each other so that they could overlap while whole. Now contacts are stiff (
        <code>o_solref</code> {physics.stiffTimeConstantS} s, the stiffest the {physics.stepMs} ms step allows), a cut
        leaves the two pieces apart and colliding, and a test checks that a cut top rests on the stub instead of sliding
        through it. The deepest contact is now {shallow}-{deep} mm, fingers squeezing the cut pieces with the jaws shut.
        The policy results of the five steps below were measured with the old physics; the videos of{" "}
        {stepName("cut").toLowerCase()} and the pruning runs use the new.
      </p>
      <TableBox label="The scripted expert before and after the physics change">
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col" className="num">
              Before
            </th>
            <th scope="col" className="num">
              After
            </th>
          </tr>
        </thead>
        <tbody>
          {physics.expert.map((row) => (
            <tr key={row.task}>
              <th scope="row">
                <code className={styles.inlineCode}>{row.task}</code>
              </th>
              <td className="num">{formatCount(row.before, physics.layouts)}</td>
              <td className="num">{formatCount(row.after, physics.layouts)}</td>
            </tr>
          ))}
        </tbody>
      </TableBox>
      <TableNote>The scripted expert, {physics.layouts} layouts each.</TableNote>
    </>
  );
}

function Pruning() {
  return (
    <>
      <SubHead id="flower-runs-in-progress">Pruning: the three tasks</SubHead>
      <p className={styles.prose}>
        Steps 6-8 of the roadmap are the pruning tasks themselves, on the new physics. All three can be learned. The full
        task needed a longer training budget: two of three seeds prune about 80 plants in 100, the third learned late and
        reached 56. Twice the demonstrations did not help, and neither did twice the budget again (80 at 40M samples). Most
        failures run out of time rather than touch the flower. Extra demonstrations in which the expert takes over from
        wherever the policy has got to first made it worse (0-28): the expert&rsquo;s moves after a takeover contradicted
        the ordinary demonstrations. Corrected, they did no better on average (83, 24 and 68).
      </p>
      <TableBox label="The pruning tasks, their policies and the runs in progress">
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">What is added</th>
            <th scope="col" className="num">
              Expert
            </th>
            <th scope="col">Policies, one per seed</th>
            <th scope="col">Still training</th>
          </tr>
        </thead>
        <tbody>
          {PRUNING_STEPS.map((entry) => {
            const running = flowerTrimming.inProgress.filter((item) => item.task === entry.task);
            const result = PRUNING_RESULTS[entry.task];
            return (
              <tr key={entry.task} id={`flower-prune-${entry.step}`}>
                <th scope="row" className={styles.wrap}>
                  Step {entry.step}: {entry.title}
                  <span className={styles.cellDetail}>
                    <code className={styles.inlineCode}>{entry.task}</code>
                  </span>
                </th>
                <td className={styles.wrap}>{capital(entry.what)}</td>
                <td className="num">{entry.expert}</td>
                <td className={styles.wrap}>
                  {result.pruned.map(count).join(", ")}
                  <span className={styles.cellDetail}>
                    {result.recipe}
                    {result.more ? `; ${result.more}` : ""}
                  </span>
                </td>
                <td className={styles.wrap}>
                  {running.length > 0
                    ? running.map((item) => (
                        <span key={item.run} className="block">
                          <code className={styles.inlineCode}>{item.run}</code> <InProgressBadge />
                        </span>
                      ))
                    : MISSING}
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>
        The steps and the expert&rsquo;s rates are the roadmap&rsquo;s; the policies&rsquo; counts are the notebook&rsquo;s
        (final checkpoint, averaged weights, 100 plants each). The notebook shortens some run names with &ldquo;...&rdquo;;
        they are shown as it writes them.
      </TableNote>
    </>
  );
}

// ---------------------------------------------------------------- the section

export function FlowerSection({ chapter }: { chapter: ChapterFor }) {
  const recipe = flowerTrimming.recipe;
  return (
    <LabSection
      {...SECTIONS.flower}
      read="Each step adds one property of the final task: read each table from the scripted expert down, for whether the step can be done, whether an earlier policy copes without new demonstrations, and what a policy trained on the step's own demonstrations reaches; the first three steps can be learned, and so can cutting a single flower's stem; choosing the named stem among three flowers to cut it needs twice the training budget and then works on two seeds of three; grasping and holding the named stem does not yet. The three pruning tasks can be learned; the full one prunes about 80 plants in 100 on two seeds of three."
      chapters={[chapter("110-toward-real-tasks"), chapter("103-case-self-correction")]}
      notes={[7, 11]}
    >
      <div className={`${styles.prose} mt-4`}>
        <p>
          The final goal is pruning: a potted plant with a main stem topped by a flower and side shoots branching off it.
          The robot arm cuts every side shoot off the main stem and leaves the main stem and its flower; damaging the
          flower (touching it, pushing on the main stem, cutting the main stem) is a failure. The plant stands on a
          motorised rotating stand with two push buttons, one for each direction; the arm presses a button to turn the
          plant until a shoot on the far side is in reach. The{" "}
          <a href={`${repoUrl("tutorial/roadmap.md")}#${slug(ROADMAP_HEADING)}`} className="text-link">
            ladder in the roadmap
          </a>{" "}
          gets there one property at a time: its first five steps, below, use simpler scenes; steps 6-8 are the pruning
          tasks themselves. All of it runs on {MACHINES.B.name}.
        </p>
        <p>
          Unless a table says otherwise: the policy without history, with language (<code>{recipe.policy}</code>),{" "}
          {recipe.demos} demonstrations with random start poses and recoveries, {recipe.samplesM}M samples,{" "}
          {recipe.layouts} unseen layouts per evaluation, final checkpoint. Two counts in a cell are the trained and the
          averaged weights. &ldquo;Closed at the named object&rdquo; is the share of first closes nearest the named object.
          None of these runs is in the experiment export: every value here is copied from the notebook.
        </p>
      </div>

      <PhysicsChange />
      <Pruning />

      <DriftStep />
      <LookalikeStep />
      <ClutterStep />
      <StemStep />
      <CutStep />
    </LabSection>
  );
}

/** The runs toward flower trimming still in progress, for the page's header and records. */
export const flowerRunsInProgress = flowerTrimming.inProgress.length;
