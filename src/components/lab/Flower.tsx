/**
 * Section 9 of the lab page: the first five steps toward flower trimming, on
 * machine B. None of these runs is in the experiment export, so every value
 * comes from the notebook through src/data/notebook.json (flowerTrimming);
 * the runs still training are marked as the notebook marks them. Server
 * component.
 */

import { slug } from "github-slugger";
import Link from "next/link";
import type { ReactNode } from "react";
import { MISSING, formatCount } from "@/data/format";
import { MACHINES } from "@/data/labels";
import { flowerTrimming, type FlowerCondition, type FlowerPartial, type FlowerRow } from "@/data/notebook";
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
      <TableNote>A dash: the notebook leaves the cell empty. A hatched cell: a run still training, with what it has reported so far.</TableNote>

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
        was lifted. Checkpoints are about {step.checkpoints.spacingAboutM}M samples apart. The two clutter rows are the
        policies of step 3, each on its own task.
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
          twice the samples does learn, slowly ({counts(change.longer.counts)} after about {change.longer.samplesAboutM}M
          samples, a wrong cube still in {change.longer.wrongPercent}%), and is still training. A look-alike run that has
          not switched by the end of its budget looks exactly like one that cannot learn the task; a second seed is what
          tells them apart.
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
  const { success, expert, failures, caught, expertDrives, diagnosis, expertSide } = step;
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
        label="The stem policy, by checkpoint"
        rows={[{ id: "flower-stem-checkpoints", words: "averaged weights", cells: step.checkpoints.values.map(String) }]}
      />
      <TableNote>
        Successes out of {flowerTrimming.recipe.layouts} layouts: over its checkpoints the stem policy never passes{" "}
        {count(step.checkpoints.neverPasses)}. A hatched cell: a run still training, with what it has reported so far.
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
      <TableNote>Two counts: trained / averaged weights. A hatched row: a run still training, with no value yet.</TableNote>
      <p className={`${styles.prose} ${styles.blockGap}`}>
        The policy trained on cuts does worse than the stem policy it was meant to improve on: {low}-{high}/
        {step.overCheckpoints.episodes} over its checkpoints. The first-steps problem of {stepName("stem").toLowerCase()}{" "}
        applies unchanged. The run trained on demonstrations that come in from the outer edge, as the changed expert
        does, is still training.
      </p>
    </>
  );
}

// ---------------------------------------------------------------- the section

export function FlowerSection({ chapter }: { chapter: ChapterFor }) {
  const recipe = flowerTrimming.recipe;
  return (
    <LabSection
      {...SECTIONS.flower}
      read="Each step adds one property of the final task: read each table from the scripted expert down, for whether the step can be done, whether an earlier policy copes without new demonstrations, and what a policy trained on the step's own demonstrations reaches; the first three steps can be learned, grasping a stem and cutting it not yet."
      chapters={[chapter("110-toward-real-tasks"), chapter("103-case-self-correction")]}
      notes={[7, 11]}
    >
      <div className={`${styles.prose} mt-4`}>
        <p>
          The final goal is a robot arm that turns a plant until the part to cut faces it, moves the other leaves aside,
          and cuts exactly the part it was asked to cut. The{" "}
          <a href={`${repoUrl("tutorial/roadmap.md")}#${slug(ROADMAP_HEADING)}`} className="text-link">
            ladder in the roadmap
          </a>{" "}
          gets there one property at a time; these are its first five steps, all on {MACHINES.B.name}.
        </p>
        <p>
          Unless a table says otherwise: the policy without history, with language (<code>{recipe.policy}</code>),{" "}
          {recipe.demos} demonstrations with random start poses and recoveries, {recipe.samplesM}M samples,{" "}
          {recipe.layouts} unseen layouts per evaluation, final checkpoint. Two counts in a cell are the trained and the
          averaged weights. &ldquo;Closed at the named object&rdquo; is the share of first closes nearest the named object.
          None of these runs is in the experiment export: every value here is copied from the notebook.
        </p>
      </div>

      <SubHead id="flower-runs-in-progress">Runs in progress</SubHead>
      <TableBox label="Runs toward flower trimming still in progress">
        <thead>
          <tr>
            <th scope="col">Run</th>
            <th scope="col">Step</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {flowerTrimming.inProgress.map((entry) => {
            const step = entry.step as StepKey;
            return (
              <tr key={entry.run}>
                <th scope="row" className={styles.wrap}>
                  {capital(entry.words)}
                  <span className={styles.cellDetail}>
                    <code className={styles.inlineCode}>{entry.run}</code>
                  </span>
                </th>
                <td className="whitespace-nowrap">
                  <a href={`#${slug(STEPS[step])}`} className="text-link">
                    {stepName(step)}
                  </a>
                </td>
                <td>
                  <InProgressBadge />
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>The notebook shortens some run names with &ldquo;...&rdquo;; they are shown as it writes them.</TableNote>

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
