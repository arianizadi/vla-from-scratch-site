/**
 * Sections 9 to 11 of the lab page: the sampler's settings, grasp tolerance
 * on both machines, and the records: datasets, runs in progress and the bugs
 * found and fixed. Server components; values from src/data only.
 */

import Link from "next/link";
import { MISSING, fixed, formatCount, formatMs, formatSamples } from "@/data/format";
import { MACHINES, OBJECTS, OBJECT_IDS, POSITION_FIX, RUN_FAMILIES, WEIGHTS, runLabel } from "@/data/labels";
import { datasetEpochs, datasets, inferenceNotes, positionTable, setup } from "@/data/notebook";
import { baseline, battery, batteryConditions, batteryRuns, execHorizonSweep, flowStepSweep, probedRuns } from "@/data/probes";
import { awaitedRuns, evaluationDefaults, run, unfinishedRuns } from "@/data/runs";
import { tolerance } from "@/data/tolerance";
import type { Count, Machine } from "@/data/types";
import type { ChapterFor } from "./BeforeFix";
import { flowerRunsInProgress } from "./Flower";
import { recipeOf } from "./RunStatusTable";
import { SECTIONS } from "./sections";
import { CodeText, InProgressBadge, LabSection, laterMachinesSentence, RateTrack, RowLink, SubHead, TableBox, TableNote } from "./shared";
import { ToleranceChart } from "./ToleranceChart";
import styles from "./styles";

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const count = (value: Count | undefined) => (value ? formatCount(value.successes, value.episodes) : MISSING);
const rateOf = (value: Count) => (value.episodes > 0 ? value.successes / value.episodes : 0);

// ---------------------------------------------------------------- 9. sampler settings

export function SamplerSection({ chapter }: { chapter: ChapterFor }) {
  const swept = probedRuns().find((name) => flowStepSweep(name).length > 1);
  const entry = swept ? run(swept) : undefined;
  const probed = swept ? baseline(swept) : undefined;
  const flow = swept ? flowStepSweep(swept) : [];
  const horizon = swept ? execHorizonSweep(swept) : [];
  const standard = batteryConditions("outside")[0];
  const fewSteps = batteryConditions("dependsOn").find((column) => {
    const cell = batteryRuns()
      .flatMap((row) => battery(row.run))
      .find((candidate) => candidate.variant === column.variant);
    return cell?.kind === "sampler";
  });

  return (
    <LabSection
      {...SECTIONS.sampler}
      read="Read success against latency: a few flow steps are usually enough, and planning again more often or reusing the starting noise does not help."
      chapters={[chapter("41-flow-matching"), chapter("42-chunks-and-execution")]}
      notes={[12]}
    >
      {entry ? (
        <p className={`${styles.prose} mt-4`}>
          {capital(runLabel(entry))}
          {probed ? `, ${formatSamples(probed.samples)} samples, ${WEIGHTS[probed.weights].label}` : null}, {evaluationDefaults.episodes}{" "}
          layouts per setting. A policy predicts a chunk of {setup.chunk.actions}{" "}
          actions; by default it executes {evaluationDefaults.execHorizon} of them and samples each chunk with{" "}
          {evaluationDefaults.flowSteps} flow steps.
        </p>
      ) : null}

      {flow.length > 0 ? (
        <>
          <SubHead id="flow-steps">Flow steps</SubHead>
          <TableBox label="Success and latency against the number of flow steps">
            <thead>
              <tr>
                <th scope="col">Flow steps</th>
                <th scope="col" className="num">
                  Success
                </th>
                <th scope="col">
                  <span className="sr-only">Success on a 0 to 100% line</span>
                </th>
                <th scope="col" className="num">
                  Second set of layouts
                </th>
                <th scope="col" className="num">
                  Median latency per chunk
                </th>
              </tr>
            </thead>
            <tbody>
              {flow.map((row) => {
                const id = `flow-steps-${row.flowSteps}`;
                return (
                  <tr key={row.flowSteps} id={id}>
                    <th scope="row">
                      {row.flowSteps}
                      {row.flowSteps === evaluationDefaults.flowSteps ? <span className={styles.cellDetail}>the default</span> : null}
                    </th>
                    <td className="num">{count(row.first)}</td>
                    <td>
                      <RateTrack rate={rateOf(row.first)} />
                    </td>
                    <td className="num">{count(row.second)}</td>
                    <td className="num">{formatMs(row.latencyMs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
          <TableNote>
            {evaluationDefaults.execHorizon} actions executed per chunk. {inferenceNotes.latencyNote.text}
          </TableNote>
        </>
      ) : null}

      {horizon.length > 0 ? (
        <>
          <SubHead id="actions-per-chunk">Actions executed per chunk</SubHead>
          <TableBox label="Success against the number of actions executed per chunk">
            <thead>
              <tr>
                <th scope="col">Actions executed per chunk</th>
                <th scope="col" className="num">
                  Success
                </th>
                <th scope="col">
                  <span className="sr-only">Success on a 0 to 100% line</span>
                </th>
                <th scope="col" className="num">
                  {OBJECTS.tblock.short}
                </th>
                <th scope="col" className="num">
                  Same starting noise for every chunk
                </th>
              </tr>
            </thead>
            <tbody>
              {horizon.map((row) => {
                const id = `actions-per-chunk-${row.executed}`;
                return (
                  <tr key={row.executed} id={id}>
                    <th scope="row">
                      {row.executed}
                      {row.wholeChunk ? <span className={styles.cellDetail}>the whole chunk</span> : null}
                      {row.executed === evaluationDefaults.execHorizon ? <span className={styles.cellDetail}>the default</span> : null}
                    </th>
                    <td className="num">{count(row.fresh)}</td>
                    <td>
                      <RateTrack rate={rateOf(row.fresh)} />
                    </td>
                    <td className="num">{count(row.tblock)}</td>
                    <td className="num">{count(row.sameNoise)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
          <TableNote>{evaluationDefaults.flowSteps} flow steps. A dash: not run.</TableNote>
        </>
      ) : null}

      {standard && fewSteps ? (
        <>
          <SubHead id="few-steps-every-policy">
            {capital(fewSteps.words)}, the {batteryRuns().length === 1 ? "policy" : `${batteryRuns().length} policies`} of
            the conditions table
          </SubHead>
          <p className={styles.prose}>
            The policies of the notebook&rsquo;s table &ldquo;How each policy copes outside the conditions it was trained
            in&rdquo;, each at its final checkpoint.
          </p>
          <TableBox label={`${fewSteps.words} against the standard setting, for each policy of the conditions table`}>
            <thead>
              <tr>
                <th scope="col">Demonstrations</th>
                <th scope="col" className="num">
                  {evaluationDefaults.flowSteps} flow steps ({standard.words.toLowerCase()})
                </th>
                <th scope="col" className="num">
                  {fewSteps.words}
                </th>
              </tr>
            </thead>
            <tbody>
              {batteryRuns().map((row) => {
                const cells = battery(row.run);
                const plain = cells.find((cell) => cell.variant === standard.variant);
                const few = cells.find((cell) => cell.variant === fewSteps.variant);
                return (
                  <tr key={row.run}>
                    <th scope="row" className={styles.wrap}>
                      {capital(row.words)}
                    </th>
                    <td className="num">{count(plain)}</td>
                    <td className="num">{count(few)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
        </>
      ) : null}
    </LabSection>
  );
}

// ---------------------------------------------------------------- 10. grasp tolerance

export function ToleranceSection({ chapter }: { chapter: ChapterFor }) {
  const machines: Machine[] = ["B", "A"];
  const tables = machines.map((machine) => tolerance(machine));
  const offsets = [...new Set(tables.flatMap((table) => table.rows.map((row) => row.offsetMm)))].sort((a, b) => a - b);
  const columns = [...OBJECT_IDS, "all" as const];

  return (
    <LabSection
      {...SECTIONS.tolerance}
      read="Read how far from the grasp point the expert can close and still succeed: the cube and the T block forgive more than the two round objects, and how much the round ones forgive depends on the simulator build."
      chapters={[chapter("92-measuring-failure")]}
      notes={[4]}
    >
      <div className={styles.blockGap}>
        <ToleranceChart />
      </div>
      <SubHead id="tolerance-table">Success at each offset</SubHead>
      <TableBox label="Grasp tolerance on both machines">
        <thead>
          <tr>
            <td aria-hidden="true" />
            {columns.map((column) => (
              <th key={column} scope="colgroup" colSpan={machines.length} className={styles.groupStart}>
                {column === "all" ? "All four" : OBJECTS[column].short}
              </th>
            ))}
          </tr>
          <tr>
            <th scope="col">Offset</th>
            {columns.flatMap((column) =>
              machines.map((machine, index) => (
                <th key={`${column}-${machine}`} scope="col" className={`num ${index === 0 ? styles.groupStart : ""}`}>
                  {capital(MACHINES[machine].name)}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {offsets.map((offset) => {
            const id = `tolerance-${offset}`;
            return (
              <tr key={offset} id={id}>
                <th scope="row" className="whitespace-nowrap">
                  {offset} mm
                  <RowLink id={id} label={`${offset} mm`} />
                </th>
                {columns.flatMap((column) =>
                  tables.map((table, index) => {
                    const row = table.rows.find((candidate) => candidate.offsetMm === offset);
                    return (
                      <td key={`${column}-${table.machine}`} className={`num ${index === 0 ? styles.groupStart : ""}`}>
                        {row ? `${row.percent[column]}%` : MISSING}
                      </td>
                    );
                  }),
                )}
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>
        {tables
          .map((table) => `${capital(MACHINES[table.machine].label)}: ${table.simulator}, ${table.episodesPerOffset} episodes per offset`)
          .join(". ")}
        . {laterMachinesSentence()}
      </TableNote>
    </LabSection>
  );
}

// ---------------------------------------------------------------- 11. datasets, runs in progress, bugs

const BUGS: { problem: string; effect: string; fix: string; see?: { href: string; words: string } }[] = [
  {
    problem: "The VLM's image processor scaled PIL and NumPy images to [0, 1] but left uint8 tensors at 0-255, and training fed tensors.",
    effect: "The vision-language model ignored its images at inference.",
    fix: "Scale uint8 tensors too; a test was added.",
  },
  {
    problem: "The action token was appended after the batch padding, in both VLM backbones.",
    effect: "In a training batch a short instruction is read one position later, behind a padding token, than when served alone.",
    fix: "Insert it after the last real token; a test was added. Its effect on success was not measured.",
  },
  {
    problem: "`lowdim_past_timesteps or default` treats 0 as unset.",
    effect: "With no past steps, the proprioception input contained the state one step in the future.",
    fix: "An explicit `is None` check; a test was added.",
  },
  {
    problem: "Both VLA recipes conditioned the action head on one vector.",
    effect: "Near-zero success in the first round.",
    fix: "Every token of the backbone goes to the action head.",
    see: { href: `#${SECTIONS.backbones.id}`, words: `section ${SECTIONS.backbones.number}` },
  },
  {
    problem: "A dead data-loader worker left the trainer waiting forever.",
    effect: "Runs hung with the GPU idle.",
    fix: "A wrapper script restarts the run on exit or on a stalled log.",
  },
  {
    problem: `The rotary position table was computed in bfloat16 under autocast, which keeps ${positionTable.significantBits} significant bits.`,
    effect: `${positionTable.distinct} distinct positions out of ${positionTable.positions}; the action-step tokens shared a few positions.`,
    fix: "Compute the table in float32, then cast; a test was added.",
    see: { href: `#${SECTIONS.positionFix.id}`, words: `section ${SECTIONS.positionFix.number}` },
  },
  {
    problem: "Evaluations started on the same port talked to whichever policy server had bound it first.",
    effect: "Results were filed under the wrong run. They were found, deleted and redone; no number on this page comes from them.",
    fix: "Each evaluation takes a free port, waits for its own server, and stops unless the server reports the checkpoint it asked for.",
  },
  {
    problem: "The previous-action input of a window at the start of a demonstration was filled with a copy of the first action.",
    effect: "The expert's first command, which already points at the target, is an input in training and absent when served.",
    fix: "Demonstrations that begin with a frame of the robot at rest. For its effect,",
    see: { href: `#${SECTIONS.history.id}`, words: `section ${SECTIONS.history.number}` },
  },
];

export function RecordsSection({ chapter }: { chapter: ChapterFor }) {
  const running = [...unfinishedRuns(), ...awaitedRuns()];
  const thousands = new Intl.NumberFormat("en-US");

  return (
    <LabSection
      {...SECTIONS.records}
      read="The reference for everything above: what each dataset holds, which runs are still training, and what went wrong on the way."
      chapters={[chapter("70-demonstrations"), chapter("81-surviving-long-runs"), chapter("93-train-inference-skew")]}
      notes={[15, 17]}
    >
      <SubHead id="datasets">Datasets</SubHead>
      <p className={styles.prose}>Every frame of a demonstration starts one training window, so windows equal frames.</p>
      <TableBox label="Datasets">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col" className="num">
              Episodes
            </th>
            <th scope="col" className="num">
              Windows
            </th>
            <th scope="col">What is in it</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((row) => {
            const id = `dataset-${row.name}`;
            return (
              <tr key={row.name} id={id}>
                <th scope="row">
                  <code className={styles.inlineCode}>{row.name}</code>
                  <RowLink id={id} label={row.name} />
                </th>
                <td className="num">{thousands.format(row.episodes)}</td>
                <td className="num">{thousands.format(row.windows)}</td>
                <td className={styles.wrap}>
                  <CodeText text={row.what} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      {datasetEpochs.length > 0 ? (
        <TableNote>
          Training budgets in passes over the data:{" "}
          {datasetEpochs.map((row) => `${row.samples} samples on ${row.dataset} are ${fixed(row.epochs, 1)} epochs`).join("; ")}.
        </TableNote>
      ) : null}

      <SubHead id="runs-in-progress">Runs in progress</SubHead>
      {running.length > 0 ? (
        <>
          <p className={styles.prose}>
            Still training or being evaluated when the data on this page was exported. They have no value here; each
            fills in the tables above when it is reported.
          </p>
          <TableBox label="Runs in progress">
            <thead>
              <tr>
                <th scope="col">Run</th>
                <th scope="col">Recipe</th>
                <th scope="col">Where it belongs</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {running.map((entry) => {
                const id = `running-${entry.name}`;
                const family = entry.group.family ? RUN_FAMILIES[entry.group.family].label : MISSING;
                return (
                  <tr key={entry.name} id={id}>
                    <th scope="row" className={styles.wrap}>
                      {capital(entry.label)}
                      <RowLink id={id} label={entry.label} />
                      <span className={styles.cellDetail}>
                        <code className={styles.inlineCode}>{entry.name}</code>
                      </span>
                    </th>
                    <td className={styles.wrap}>
                      {recipeOf(entry)}
                    </td>
                    <td className={styles.wrap}>
                      {family}, {POSITION_FIX[entry.group.fix].label}
                    </td>
                    <td>
                      <InProgressBadge label={"status" in entry ? "In progress" : "Not in the data yet"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
        </>
      ) : flowerRunsInProgress > 0 ? (
        <p className={styles.prose}>
          No run of the experiment export is in progress. The runs toward flower trimming that are still training are
          listed in{" "}
          <Link href={`#${SECTIONS.flower.id}`} className="text-link">
            section {SECTIONS.flower.number}
          </Link>
          .
        </p>
      ) : (
        <p className={styles.prose}>No run is in progress: every run on this page is reported.</p>
      )}

      <SubHead id="bugs">Bugs found and fixed</SubHead>
      <TableBox label="Bugs found and fixed" stickyFirst={false}>
        <thead>
          <tr>
            <th scope="col">Problem</th>
            <th scope="col">Effect</th>
            <th scope="col">Fix</th>
          </tr>
        </thead>
        <tbody>
          {BUGS.map((bug) => (
            <tr key={bug.problem}>
              <td className={`${styles.wrap} min-w-[220px]`}>
                <CodeText text={bug.problem} />
              </td>
              <td className={`${styles.wrap} min-w-[200px]`}>{bug.effect}</td>
              <td className={`${styles.wrap} min-w-[200px]`}>
                <CodeText text={bug.fix} />
                {bug.see ? (
                  <>
                    {" "}
                    {bug.fix.endsWith(",") ? "see" : "See"}{" "}
                    <Link href={bug.see.href} className="text-link">
                      {bug.see.words}
                    </Link>
                    .
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </TableBox>
    </LabSection>
  );
}
