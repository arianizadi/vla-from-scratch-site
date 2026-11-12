/**
 * Sections 1 to 4 of the lab page: the task and the expert, the runs before
 * the position fix, history against no history, and what the policy that
 * works depends on. Server components: every value is read from src/data at
 * build time.
 */

import { checkpoints, finalCheckpoint } from "@/data/checkpoints";
import { MISSING, formatCount, formatMm, formatPercent, formatSamples, formatSlope } from "@/data/format";
import { MACHINES, OBJECTS, OBJECT_IDS, TASKS, WEIGHTS, conditionLabel, inputsLabel, runLabel } from "@/data/labels";
import { disturbanceNotes, expertElsewhere, setup } from "@/data/notebook";
import { baseline, disturbances, expert, probedRuns, probes, type Probe } from "@/data/probes";
import { evaluationDefaults, isFinished, run, runsByGroup, type FinishedRun } from "@/data/runs";
import type { Count } from "@/data/types";
import { HeadlineChart } from "./HeadlineChart";
import { RunStatusTable } from "./RunStatusTable";
import { SECTIONS } from "./sections";
import {
  LabSection,
  RateTrack,
  RowLink,
  SubHead,
  TableBox,
  TableNote,
  both,
  bestText,
  namedOf,
  successOf,
  type ChapterLink,
} from "./shared";
import { SortableTable, type SortRow } from "./SortableTable";
import styles from "./styles";

export type ChapterFor = (slug: string) => ChapterLink | null;

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// ---------------------------------------------------------------- 1. the task

export function TaskSection({ chapter }: { chapter: ChapterFor }) {
  const plain = expert();
  const chance = setup.chance.percent;
  const objects = OBJECT_IDS.map((object) => OBJECTS[object].label);
  const success = setup.success;

  const rows: { id: string; label: string; detail: string; count: Count; ci?: [number, number]; miss?: string; within?: string }[] = [];
  if (plain) {
    rows.push({
      id: "expert-machine-b",
      label: TASKS[plain.task].label,
      detail: plain.machine ? MACHINES[plain.machine].label : MISSING,
      count: plain,
      ci: plain.ci,
      miss: formatMm(plain.missMm),
      within: formatPercent(plain.within10),
    });
  }
  rows.push({
    id: "expert-machine-a",
    label: TASKS[expertElsewhere.machineA.task].label,
    detail: MACHINES.A.label,
    count: expertElsewhere.machineA,
  });
  rows.push({
    id: "expert-single-cube",
    label: TASKS[expertElsewhere.pickCube.task].label,
    detail: "spot check",
    count: expertElsewhere.pickCube,
  });

  return (
    <LabSection
      {...SECTIONS.task}
      read="Read this first: the scripted expert solves the task through the same evaluation loop, seeds and success test as a policy, so a policy that fails is not failing because of the simulator."
      chapters={[chapter("90-closed-loop-evaluation"), chapter("92-measuring-failure")]}
      notes={[1]}
    >
      <dl className={styles.facts}>
        <div>
          <dt>Robot</dt>
          <dd>A Franka Panda arm in MuJoCo, controlled at {setup.control.hz} Hz.</dd>
        </div>
        <div>
          <dt>What it sees</dt>
          <dd>
            A front and a wrist camera at {setup.camera.pixels}&times;{setup.camera.pixels} pixels, and a{" "}
            {setup.camera.stateDimensions}-number state: {setup.camera.jointAngles} joint angles and the gripper opening.
          </dd>
        </div>
        <div>
          <dt>What it does</dt>
          <dd>
            {setup.actions.dimensions}-number absolute targets: {setup.actions.jointPositions} joint positions and the
            gripper command.
          </dd>
        </div>
        <div>
          <dt>The task</dt>
          <dd>
            {capital(TASKS.pick_target.description)}: {objects.slice(0, -1).join(", ")} and {objects[objects.length - 1]}.
            The instruction reads &ldquo;pick up the &hellip;&rdquo;. A single-cube task, {TASKS.pick_cube.description},
            came first.
          </dd>
        </div>
        <div>
          <dt>Success</dt>
          <dd>
            The named object held {success.liftCm} cm above its rest height for {success.holdSteps} control steps (
            {success.holdSeconds} s); an episode ends after {success.maxSteps} steps.
          </dd>
        </div>
        <div>
          <dt>Demonstrations</dt>
          <dd>The scripted expert, about {setup.demonstrations.steps} steps each, failures discarded.</dd>
        </div>
        <div>
          <dt>An evaluation</dt>
          <dd>
            {evaluationDefaults.episodes} layouts no policy was trained on, {evaluationDefaults.execHorizon} actions
            executed per chunk of {setup.chunk.actions}, {evaluationDefaults.flowSteps} flow steps, unless a table says
            otherwise. Chance of closing at the named object is {chance}%.
          </dd>
        </div>
      </dl>

      <SubHead id="the-scripted-expert">The scripted expert</SubHead>
      <TableBox label="The scripted expert through the evaluation loop">
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col" className="num">
              Success
            </th>
            <th scope="col">
              <span className="sr-only">Success on a 0 to 100% line</span>
            </th>
            <th scope="col" className="num">
              Gripper closed, median distance to the object
            </th>
            <th scope="col" className="num">
              Within 10 mm
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} id={row.id}>
              <th scope="row" className={styles.wrap}>
                {row.label}
                <RowLink id={row.id} label={`${row.label}, ${row.detail}`} />
                <span className={styles.cellDetail}>{row.detail}</span>
              </th>
              <td className="num">{formatCount(row.count.successes, row.count.episodes)}</td>
              <td>
                <RateTrack rate={row.count.successes / row.count.episodes} ci={row.ci} reference />
              </td>
              <td className="num">{row.miss ?? MISSING}</td>
              <td className="num">{row.within ?? MISSING}</td>
            </tr>
          ))}
        </tbody>
      </TableBox>
      <TableNote>A dash: the notebook does not report that number for the row. The bar through a dot is the 95% interval.</TableNote>
    </LabSection>
  );
}

// ---------------------------------------------------------------- 2. before the fix

/** The runs of the notebook's table "Final checkpoints": the first comparisons, the reference recipe and history, before the fix. */
function finalCheckpointRuns(): FinishedRun[] {
  return runsByGroup({ fix: "before" }).filter(
    (entry): entry is FinishedRun =>
      isFinished(entry) &&
      entry.task === "pick_target" &&
      (entry.group.family === "first_round" || entry.group.family === "reference" || entry.group.family === "history") &&
      finalCheckpoint(entry.name) !== undefined,
  );
}

export function HeadlineSection({ chapter }: { chapter: ChapterFor }) {
  const words = { raw: WEIGHTS.raw.short, ema: WEIGHTS.ema.short };
  const rows: SortRow[] = finalCheckpointRuns().map((entry) => {
    const last = finalCheckpoint(entry.name)!;
    return {
      id: `final-${entry.name}`,
      label: runLabel(entry, { budget: true }),
      detail: inputsLabel(entry.design),
      code: entry.design.policy ?? entry.name,
      cells: {
        demos: { text: entry.design.demos === null ? MISSING : String(entry.design.demos), sort: entry.design.demos },
        samples: { text: `${formatSamples(entry.samples)}${entry.stopped ? " (stopped)" : ""}`, sort: entry.samples },
        success: { text: both(last, successOf, formatPercent), sort: last.ema.rate },
        track: { text: "", track: { rate: last.ema.rate, ci: last.ema.ci } },
        named: { text: both(last, namedOf, formatPercent), sort: last.ema.named },
        slope: { text: both(last, (evaluation) => evaluation.slope, formatSlope), sort: last.ema.slope },
        miss: { text: both(last, (evaluation) => evaluation.missMm, formatMm), sort: last.ema.missMm },
        best: { text: bestText(entry, words), sort: entry.best?.rate ?? null },
      },
    };
  });

  return (
    <LabSection
      {...SECTIONS.headline}
      read="Read the success line together with the two lines under it: a policy that ends up working spends a long stretch of training closing at a random object (slope near 0), then starts to look at the scene within a short stretch, and success follows; the loss gives no warning."
      chapters={[chapter("71-how-much-data-and-training"), chapter("92-measuring-failure"), chapter("91-loss-is-not-success")]}
      notes={[6, 7, 12]}
    >
      <div className={styles.blockGap}>
        <HeadlineChart />
      </div>

      <SubHead id="final-checkpoints">Final checkpoints</SubHead>
      <p className={styles.prose}>
        Every run here ran on {MACHINES.B.name} and was trained before the position-table bug was found. A policy whose
        closing position ignores the scene has a slope near 0 and closes at the named object about as often as chance.
      </p>
      <SortableTable
        label="Final checkpoints before the position fix"
        rowHead="Policy"
        columns={[
          { key: "demos", label: "Demos", numeric: true, sortable: true },
          { key: "samples", label: "Samples", numeric: true, sortable: true },
          { key: "success", label: "Success (trained / averaged)", numeric: true, sortable: true },
          { key: "track", label: "", srLabel: "Success of the averaged weights on a 0 to 100% line" },
          { key: "named", label: "Closed at the named object", numeric: true, sortable: true },
          { key: "slope", label: "Slope", numeric: true, sortable: true },
          { key: "miss", label: "Median miss to named", numeric: true, sortable: true },
          { key: "best", label: "Best checkpoint", numeric: true, sortable: true },
        ]}
        rows={rows}
        note="Columns with two values sort by the averaged weights. The learning-rate schedule is stretched over each run's own budget, so runs that differ in budget differ in schedule too."
      />
    </LabSection>
  );
}

// ---------------------------------------------------------------- 3. history

function ProbeTable({ rows, label, idPrefix, conditionWords }: { rows: Probe[]; label: string; idPrefix: string; conditionWords: string }) {
  const hasGoal = rows.some((row) => row.prefixGoal);
  return (
    <TableBox label={label}>
      <thead>
        <tr>
          <th scope="col">Condition</th>
          <th scope="col" className="num">
            Success
          </th>
          <th scope="col">
            <span className="sr-only">Success on a 0 to 100% line</span>
          </th>
          <th scope="col" className="num">
            Closed at the named object
          </th>
          <th scope="col" className="num">
            Median miss to named
          </th>
          {hasGoal ? (
            <th scope="col" className="num">
              Closed at the object the expert headed for
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const id = `${idPrefix}-${row.variant}`;
          const words = capital(conditionLabel(row.settings, { baseline: conditionWords }));
          return (
            <tr key={row.variant} id={id}>
              <th scope="row" className={styles.wrap}>
                {words}
                <RowLink id={id} label={words} />
              </th>
              <td className="num">{formatCount(row.successes, row.episodes)}</td>
              <td>
                <RateTrack rate={row.rate} ci={row.ci} />
              </td>
              <td className="num">{formatPercent(row.named)}</td>
              <td className="num">{formatMm(row.missMm)}</td>
              {hasGoal ? (
                <td className="num">{row.prefixGoal ? formatCount(row.prefixGoal.count, row.prefixGoal.episodes) : MISSING}</td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </TableBox>
  );
}

const probeSetting = (row: Probe | undefined, entry: FinishedRun) =>
  row
    ? `${capital(runLabel(entry))}, ${formatSamples(row.samples)} samples, ${WEIGHTS[row.weights].label}, ${row.episodes} layouts per condition.`
    : "";

export function HistorySection({ chapter }: { chapter: ChapterFor }) {
  const historyRuns = runsByGroup({ fix: "before", family: "history" }).filter(isFinished);
  const references = runsByGroup({ fix: "before", family: "reference" }).filter(isFinished);
  const later = runsByGroup({ fix: "after", family: "history" });

  return (
    <LabSection
      {...SECTIONS.history}
      read="Compare the two policies at each point of training, then the probes: given its previous action as an input, the policy reads the target from that input instead of from the cameras."
      chapters={[chapter("52-history-and-shortcuts")]}
      notes={[8]}
    >
      {historyRuns.map((entry) => {
        const partner = references.find((candidate) => candidate.design.dataset === entry.design.dataset);
        const mine = checkpoints(entry.name);
        const theirs = partner ? checkpoints(partner.name) : [];
        const paired = mine.flatMap((row) => {
          const other = theirs.find((candidate) => formatSamples(candidate.samples) === formatSamples(row.samples));
          return other ? [{ samples: formatSamples(row.samples), withHistory: row, without: other }] : [];
        });
        const probeRows = probes(entry.name);
        return (
          <div key={entry.name}>
            {partner && paired.length > 0 ? (
              <>
                <SubHead id={`history-${entry.name}`}>With and without history, checkpoint by checkpoint</SubHead>
                <p className={styles.prose}>
                  The same policy on the same {partner.design.demos ?? MISSING} demonstrations, with and without history:
                  with history it also gets the previous frame, the previous state and its previous action.
                </p>
                <TableBox label="With and without history, by checkpoint">
                  <thead>
                    <tr>
                      <td aria-hidden="true" />
                      <th scope="colgroup" colSpan={2} className={styles.groupStart}>
                        Success (trained / averaged)
                      </th>
                      <th scope="colgroup" colSpan={2} className={styles.groupStart}>
                        Closed at the named object
                      </th>
                    </tr>
                    <tr>
                      <th scope="col">Samples</th>
                      <th scope="col" className={`num ${styles.groupStart}`}>
                        No history
                      </th>
                      <th scope="col" className="num">
                        With history
                      </th>
                      <th scope="col" className={`num ${styles.groupStart}`}>
                        No history
                      </th>
                      <th scope="col" className="num">
                        With history
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paired.map((row) => {
                      const id = `history-${entry.name}-${row.withHistory.checkpoint}`;
                      return (
                        <tr key={row.samples} id={id}>
                          <th scope="row">
                            {row.samples}
                            <RowLink id={id} label={row.samples} />
                          </th>
                          <td className={`num ${styles.groupStart}`}>{both(row.without, successOf, formatPercent)}</td>
                          <td className="num">{both(row.withHistory, successOf, formatPercent)}</td>
                          <td className={`num ${styles.groupStart}`}>{both(row.without, namedOf, formatPercent)}</td>
                          <td className="num">{both(row.withHistory, namedOf, formatPercent)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableBox>
                {entry.stopped ? (
                  <TableNote>The run with history was stopped at {formatSamples(entry.samples)} samples.</TableNote>
                ) : null}
              </>
            ) : null}

            {probeRows.length > 0 ? (
              <>
                <SubHead id={`history-probes-${entry.name}`}>What the history policy depends on</SubHead>
                <p className={styles.prose}>
                  In a training window that starts at the first frame of a demonstration there is no previous action, and
                  the slot is filled with a copy of the first action: the expert&rsquo;s first command, which already
                  points at the target. When the policy is served, the slot holds the command the robot is under before it
                  moves.
                </p>
                <ProbeTable
                  rows={probeRows}
                  label="What the history policy depends on"
                  idPrefix={`history-probe-${entry.name}`}
                  conditionWords="as served"
                />
                <TableNote>{probeSetting(baseline(entry.name) ?? probeRows[0], entry)}</TableNote>
              </>
            ) : null}
          </div>
        );
      })}

      {later.length > 0 ? (
        <>
          <SubHead id="history-after-the-fix">The cure being tested</SubHead>
          <p className={styles.prose}>
            Demonstrations that begin with one frame of the robot at rest, so that the slot holds the same command in
            training as when served.
          </p>
          <RunStatusTable runs={later} label="History after the position fix" idPrefix="history-after" />
        </>
      ) : null}
    </LabSection>
  );
}

// ---------------------------------------------------------------- 4. what the working policy depends on

export function DependsOnSection({ chapter }: { chapter: ChapterFor }) {
  const probed = probedRuns()
    .map((name) => run(name))
    .filter((entry): entry is FinishedRun => isFinished(entry) && entry.group.fix === "before" && entry.group.family === "reference");
  const move = disturbanceNotes.move;

  return (
    <LabSection
      {...SECTIONS.dependsOn}
      read="Read the frozen cameras row and the moved object rows together: the policy that works decides where to go from the first frames, and does not look again."
      chapters={[chapter("95-what-a-policy-looks-at")]}
      notes={[9]}
    >
      {probed.map((entry) => {
        const plain = baseline(entry.name);
        const interventions = [...(plain ? [plain] : []), ...probes(entry.name, "intervention")];
        const moves = disturbances(entry.name);
        return (
          <div key={entry.name}>
            <SubHead id={`depends-${entry.name}`}>Frozen cameras and an expert at the controls</SubHead>
            <ProbeTable
              rows={interventions}
              label="What the policy that works depends on"
              idPrefix={`depends-${entry.name}`}
              conditionWords="as trained"
            />
            <TableNote>{probeSetting(plain ?? interventions[0], entry)}</TableNote>

            {moves.length > 0 ? (
              <>
                <SubHead id={`moved-${entry.name}`}>The object is moved</SubHead>
                <p className={styles.prose}>
                  The named object is moved once per episode, {move.distanceMm} mm in a random direction unless stated,
                  and turned by up to {move.turnRad} rad. The policy was trained on demonstrations in which nothing moves.
                  The expert closes the gripper around step {disturbanceNotes.expertCloses.step}.
                </p>
                <TableBox label="The policy that works when the object is moved">
                  <thead>
                    <tr>
                      <th scope="col">The object is moved</th>
                      <th scope="col" className="num">
                        Success
                      </th>
                      <th scope="col">
                        <span className="sr-only">Success on a 0 to 100% line</span>
                      </th>
                      <th scope="col" className="num">
                        Gripper closed, median distance from the old place
                      </th>
                      <th scope="col" className="num">
                        From the new place
                      </th>
                      <th scope="col" className="num">
                        Second grasp attempt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {moves.map((row) => {
                      const id = `moved-${entry.name}-${row.variant}`;
                      const words = capital(conditionLabel(row.settings, { short: true }));
                      return (
                        <tr key={row.variant} id={id}>
                          <th scope="row" className={styles.wrap}>
                            {words}
                            <RowLink id={id} label={words} />
                          </th>
                          <td className="num">{formatCount(row.successes, row.episodes)}</td>
                          <td>
                            <RateTrack rate={row.episodes > 0 ? row.successes / row.episodes : 0} />
                          </td>
                          <td className="num">{formatMm(row.fromOldMm)}</td>
                          <td className="num">{formatMm(row.fromNewMm)}</td>
                          <td className="num">{formatCount(row.retried, row.episodes)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableBox>
                <TableNote>
                  {probeSetting(plain, entry)} Counts are over the episodes in which the object could be
                  moved (a free place existed). The scripted expert under the same moves is in section{" "}
                  {SECTIONS.outside.number}.
                </TableNote>
              </>
            ) : null}
          </div>
        );
      })}
    </LabSection>
  );
}

