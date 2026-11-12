/**
 * Sections 5 to 8 of the lab page: the position-table bug, what the
 * demonstrations contain, how each policy copes outside its training
 * conditions, and the backbones with the second seed. Server components;
 * the interactive parts are client components fed by the data module.
 */

import { finalCheckpoint } from "@/data/checkpoints";
import { beforeAfterPairs, comparisonRows, pooledPerObject } from "@/data/comparisons";
import { MISSING, formatBoth, formatCount, formatMm, formatPercent, formatSlope, formatSuccess } from "@/data/format";
import { MACHINES, OBJECTS, OBJECT_IDS, POSITION_FIX, WEIGHTS, runLabel } from "@/data/labels";
import { firstRound, positionTable, stageResults } from "@/data/notebook";
import { battery, batteryConditions, batteryRuns } from "@/data/probes";
import { awaitedRuns, isFinished, runs, runsByGroup, type FinishedRun } from "@/data/runs";
import type { Evaluation } from "@/data/types";
import { BatteryTable } from "./BatteryTable";
import type { ChapterFor } from "./BeforeFix";
import { demonstrationRows } from "./demonstrations";
import { DemonstrationsTable } from "./DemonstrationsTable";
import { FixChart } from "./FixChart";
import { RunFacets } from "./RunFacets";
import { RunStatusTable, type ListedRun } from "./RunStatusTable";
import { SECTIONS } from "./sections";
import { LabSection, RateTrack, RowLink, SubHead, TableBox, TableNote, bestText, both, namedOf, successOf } from "./shared";
import styles from "./styles";

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// ---------------------------------------------------------------- 5. the position table

function PairTable({ index }: { index: number }) {
  const pair = beforeAfterPairs()[index];
  if (!pair) return null;
  const weights = pair.weights[0] ?? "raw";
  const of = (side: { raw: Evaluation | null; ema: Evaluation | null } | null) => (side ? side[weights] : null);
  const id = (samples: string) => `fix-${pair.after}-${samples}`;
  return (
    <TableBox label={`${pair.section}: checkpoint by checkpoint`}>
      <thead>
        <tr>
          <th scope="col">Samples</th>
          <th scope="col" className="num">
            Success before / after
          </th>
          <th scope="col" className="num">
            Closed at the named object
          </th>
          <th scope="col" className="num">
            Slope
          </th>
          <th scope="col" className="num">
            Median miss to named
          </th>
        </tr>
      </thead>
      <tbody>
        {pair.rows.map((row) => {
          const before = of(row.before);
          const after = of(row.after);
          return (
            <tr key={row.samples} id={id(row.samples)}>
              <th scope="row">
                {row.samples}
                <RowLink id={id(row.samples)} label={row.samples} />
              </th>
              <td className="num">{formatBoth(before?.rate ?? null, after?.rate ?? null, formatPercent)}</td>
              <td className="num">{formatBoth(before?.named ?? null, after?.named ?? null, formatPercent)}</td>
              <td className="num">{formatBoth(before?.slope ?? null, after?.slope ?? null, formatSlope)}</td>
              <td className="num">{formatBoth(before?.missMm ?? null, after?.missMm ?? null, formatMm)}</td>
            </tr>
          );
        })}
      </tbody>
    </TableBox>
  );
}

function PerObjectTable({ index }: { index: number }) {
  const pair = beforeAfterPairs()[index];
  const perObject = pair?.perObject;
  if (!pair || !perObject) return null;
  return (
    <>
      <TableBox label="Success by object at the final checkpoint, before and after the fix">
        <thead>
          <tr>
            <th scope="col">Object</th>
            <th scope="col" className="num">
              {capital(POSITION_FIX.before.short)}
            </th>
            <th scope="col" className="num">
              {capital(POSITION_FIX.after.short)}
            </th>
          </tr>
        </thead>
        <tbody>
          {OBJECT_IDS.map((object) => {
            const before = perObject.before.counts[object];
            const after = perObject.after.counts[object];
            return (
              <tr key={object}>
                <th scope="row">{capital(OBJECTS[object].label)}</th>
                <td className="num">{before ? formatSuccess(before) : MISSING}</td>
                <td className="num">{after ? formatSuccess(after) : MISSING}</td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>{capital(WEIGHTS[perObject.weights].label)}, final checkpoint of each run.</TableNote>
    </>
  );
}

export function PositionFixSection({ chapter }: { chapter: ChapterFor }) {
  const table = positionTable;
  const [first, second] = table.collapse;
  const hasPair = beforeAfterPairs().length > 0;
  const singleCube = runsByGroup({ family: "single_cube" });

  return (
    <LabSection
      {...SECTIONS.positionFix}
      read="Compare the two lines checkpoint by checkpoint: with the position table fixed, the same recipe starts to look at the scene earlier and ends higher."
      chapters={[chapter("12-positions"), chapter("93-train-inference-skew")]}
      notes={[14]}
    >
      <div className={`${styles.prose} mt-4`}>
        <p>
          The rotary position table was computed in half precision under autocast, which keeps {table.significantBits}{" "}
          significant bits. Positions above {first?.above} collapsed onto {first?.onto}, above {second?.above} onto{" "}
          {second?.onto}: {table.distinct} distinct positions out of {table.positions}. In the policy without history,{" "}
          {table.noHistory.tokensBeforeActions} tokens come before the actions, and its {table.noHistory.actionTokens}{" "}
          action-step tokens, at positions {table.noHistory.firstActionPosition}-{table.noHistory.lastActionPosition},
          shared {table.noHistory.positionsShared} positions; with history, {table.history.actionTokens} shared{" "}
          {table.history.positionsShared}. Nothing looked wrong, because training and serving used the same table.
        </p>
        <p>The fix computes the table in float32 and then casts it. Every run up to here was trained with the old table.</p>
      </div>

      {hasPair ? (
        <>
          <div className={styles.blockGap}>
            <FixChart pairIndex={0} />
          </div>
          <SubHead id="the-same-run-before-and-after">The same run before and after the fix</SubHead>
          <PairTable index={0} />
          <TableNote>
            {capital(WEIGHTS[beforeAfterPairs()[0].weights[0] ?? "raw"].label)} on both sides: the run after the fix
            did not save averaged weights. Each cell reads before / after.
          </TableNote>
          <SubHead id="by-object-before-and-after">By object</SubHead>
          <PerObjectTable index={0} />
        </>
      ) : null}

      {singleCube.length > 0 ? (
        <>
          <SubHead id="single-cube-before-and-after">Single cube, with and without history</SubHead>
          <p className={styles.prose}>
            One red cube, {MACHINES.B.name}. The run with history also has no instruction tokens and is fed pixels in a
            different range, so the two differ in more than history.
          </p>
          <RunStatusTable runs={singleCube} label="Single cube before and after the fix" idPrefix="single-cube" showFix />
        </>
      ) : null}
    </LabSection>
  );
}

// ---------------------------------------------------------------- 6. what the demonstrations contain

function SmallerDatasetTable() {
  const variants = runsByGroup({ fix: "before", family: "demonstrations" }).filter(isFinished);
  const sample = variants[0];
  if (!sample) return null;
  // The plain run on the same data and budget, which the notebook's table puts first.
  const plain = runsByGroup({ fix: "before", family: "first_round" }).filter(
    (entry): entry is FinishedRun =>
      isFinished(entry) &&
      entry.design.policy === sample.design.policy &&
      entry.design.demos === sample.design.demos &&
      entry.design.traits.length === 0 &&
      entry.design.budget === sample.design.budget &&
      entry.samplesPlanned === sample.samplesPlanned,
  );
  const words = { raw: WEIGHTS.raw.short, ema: WEIGHTS.ema.short };
  return (
    <>
      <SubHead id="demonstrations-before-the-fix">The first try, before the fix</SubHead>
      <TableBox label="Which demonstrations, before the fix">
        <thead>
          <tr>
            <th scope="col">Demonstrations</th>
            <th scope="col" className="num">
              Success (trained / averaged)
            </th>
            <th scope="col" className="num">
              Closed at the named object
            </th>
            <th scope="col" className="num">
              Slope
            </th>
            <th scope="col" className="num">
              Best checkpoint
            </th>
          </tr>
        </thead>
        <tbody>
          {[...plain, ...variants].map((entry) => {
            const last = finalCheckpoint(entry.name);
            const id = `demonstrations-before-${entry.name}`;
            const label = runLabel(entry);
            return (
              <tr key={entry.name} id={id}>
                <th scope="row" className={styles.wrap}>
                  {label}
                  <RowLink id={id} label={label} />
                  <span className={styles.cellDetail}>
                    <code className={styles.inlineCode}>{entry.design.dataset ?? entry.name}</code>
                  </span>
                </th>
                <td className="num">{last ? both(last, successOf, formatPercent) : MISSING}</td>
                <td className="num">{last ? both(last, namedOf, formatPercent) : MISSING}</td>
                <td className="num">{last ? both(last, (evaluation) => evaluation.slope, formatSlope) : MISSING}</td>
                <td className="num">{bestText(entry, words)}</td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      <TableNote>Final checkpoints; all trained with the old position table on the smaller dataset.</TableNote>
    </>
  );
}

export function DemonstrationsSection({ chapter }: { chapter: ChapterFor }) {
  const rows = demonstrationRows();
  const reference = comparisonRows("demonstrations")?.rows[0]?.run ?? null;
  const objectRows = comparisonRows("demonstrationsObjects")?.rows ?? [];

  return (
    <LabSection
      {...SECTIONS.demonstrations}
      read="Same policy, same number of episodes, different content: read each panel for how soon the policy starts to succeed, and the table's last column for where it ends."
      chapters={[chapter("70-demonstrations"), chapter("71-how-much-data-and-training")]}
      notes={[10]}
    >
      <p className={`${styles.prose} mt-4`}>
        All after the position fix: the policy without history, with language, on 4000 demonstrations each. What differs
        is what the demonstrations show: one instruction per layout, the first frames of every demonstration repeated,
        every object of a layout named in turn, the object moved with the expert recovering, random start poses, or a
        combination.
      </p>
      <div className={styles.blockGap}>
        <RunFacets
          title="Success by point of training, one panel per dataset"
          runs={rows.map((row) => row.name)}
          reference={reference}
          caption="Each panel is one run; the dashed line is the run with one instruction per layout, for comparison. A hatched panel is a run still in progress."
        />
      </div>

      <SubHead id="demonstrations-by-checkpoint">At fixed points of training</SubHead>
      <DemonstrationsTable />
      <TableNote>A dash where a run did not save averaged weights, or the notebook does not print that point.</TableNote>

      {objectRows.length > 0 ? (
        <>
          <SubHead id="demonstrations-by-object">By object</SubHead>
          <TableBox label="Success by object, pooled over the last checkpoints">
            <thead>
              <tr>
                <th scope="col">Demonstrations</th>
                {OBJECT_IDS.map((object) => (
                  <th key={object} scope="col" className="num">
                    {OBJECTS[object].short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objectRows.map((row) => {
                const pooled = pooledPerObject(row.run);
                const id = `by-object-${row.run}`;
                const words = capital(row.words);
                return (
                  <tr key={row.run} id={id}>
                    <th scope="row" className={styles.wrap}>
                      {words}
                      <RowLink id={id} label={words} />
                      {pooled ? (
                        <span className={styles.cellDetail}>
                          checkpoints {pooled.checkpoints.join(", ")},{" "}
                          {pooled.weights.map((weights) => WEIGHTS[weights].short).join(" and ")}
                        </span>
                      ) : null}
                    </th>
                    {OBJECT_IDS.map((object) => {
                      const count = pooled?.perObject[object];
                      return (
                        <td key={object} className="num">
                          {count ? formatSuccess(count) : MISSING}
                          {count && count.episodes > 0 ? <RateTrack rate={count.successes / count.episodes} /> : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
          <TableNote>
            Each finished run&rsquo;s last checkpoints pooled, with every set of weights it saved. Runs still in progress are
            not in this table.
          </TableNote>
        </>
      ) : null}

      <SmallerDatasetTable />
    </LabSection>
  );
}

// ---------------------------------------------------------------- 7. outside the training conditions

function DependsOnTable() {
  const columns = batteryConditions("dependsOn");
  const standard = batteryConditions("outside")[0];
  const rows = batteryRuns();
  if (columns.length === 0 || rows.length === 0) return null;
  return (
    <TableBox label="What the same policies depend on">
      <thead>
        <tr>
          <th scope="col">Demonstrations</th>
          {standard ? (
            <th scope="col" className="num">
              {standard.words}
            </th>
          ) : null}
          {columns.map((column) => (
            <th key={column.variant} scope="col" className={`num ${styles.wrap}`}>
              {column.words}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const cells = battery(row.run);
          const id = `depends-on-${row.run}`;
          const words = capital(row.words);
          return (
            <tr key={row.run} id={id}>
              <th scope="row" className={styles.wrap}>
                {words}
                <RowLink id={id} label={words} />
              </th>
              {[...(standard ? [standard] : []), ...columns].map((column) => {
                const cell = cells.find((candidate) => candidate.variant === column.variant);
                if (!cell) {
                  return (
                    <td key={column.variant} className="num text-ink-faint">
                      {MISSING}
                    </td>
                  );
                }
                let detail: string | null = null;
                if (cell.settings.staleImages) detail = `at the named object ${formatPercent(cell.named)}`;
                else if (cell.prefixGoal) detail = `closed at the other object ${formatCount(cell.prefixGoal.count, cell.prefixGoal.episodes)}`;
                return (
                  <td key={column.variant} className="num">
                    {formatCount(cell.successes, cell.episodes)}
                    {detail ? <span className={styles.cellDetail}>{detail}</span> : null}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </TableBox>
  );
}

export function OutsideSection({ chapter }: { chapter: ChapterFor }) {
  return (
    <LabSection
      {...SECTIONS.outside}
      read="Read down the columns in which the object is moved: a policy follows the object and tries again after a missed grasp only when its demonstrations contain recoveries, and the scripted expert that plans again, at the bottom, shows what the task allows."
      chapters={[chapter("95-what-a-policy-looks-at"), chapter("70-demonstrations")]}
      notes={[11]}
    >
      <p className={`${styles.prose} mt-4`}>
        Each policy&rsquo;s final checkpoint, with the averaged weights where the run saved them, under conditions it never saw in training. For a moved object the counts are over the episodes in which it could
        be moved, and &ldquo;retried&rdquo; counts those with a second grasp attempt.
      </p>
      <BatteryTable />
      <TableNote>
        The bar under each count is the success rate on a 0 to 100% scale. A dash: the notebook reports no evaluation
        under that condition. One training seed per policy.
      </TableNote>

      <SubHead id="what-the-same-policies-depend-on">What the same policies depend on</SubHead>
      <p className={styles.prose}>
        The probes of section {SECTIONS.dependsOn.number}, run on the same policies as the table above, each next to
        its standard result.
      </p>
      <DependsOnTable />
    </LabSection>
  );
}

// ---------------------------------------------------------------- 8. backbones and the second seed

export function BackbonesSection({ chapter }: { chapter: ChapterFor }) {
  const vlas: ListedRun[] = [
    ...runsByGroup({ family: "backbones" }).filter((entry) => entry.design.family === "vla"),
    ...awaitedRuns().filter((entry) => entry.group.family === "backbones" && entry.design.family === "vla"),
  ];
  const seeds: ListedRun[] = [
    ...runs().filter((entry) => entry.design.seed !== null && entry.design.seed !== undefined),
    ...awaitedRuns().filter((entry) => entry.design.seed !== null && entry.design.seed !== undefined),
  ];
  const pairs = beforeAfterPairs();
  const llm = runs().find((entry) => entry.design.family === "language_model");
  const machineB = stageResults.machineB;
  const vlaRows = firstRound.rows.filter((row) => row.policy.startsWith("vla"));

  return (
    <LabSection
      {...SECTIONS.backbones}
      read="These runs ask whether a backbone pretrained on captions, handing every token to the action head, gives a policy that looks at the scene sooner than one trained from nothing; each row fills in when its run is reported."
      chapters={[chapter("61-pretrained-backbones"), chapter("62-the-from-scratch-path"), chapter("60-anatomy-of-a-vla")]}
      notes={[5, 16]}
    >
      {vlaRows.length > 0 ? (
        <>
          <SubHead id="one-vector">First: one vector from the backbone</SubHead>
          <p className={styles.prose}>
            Both vision-language-action recipes first conditioned the action head on a single vector read from the
            backbone, on {MACHINES.A.label}.
          </p>
          <TableBox label="First round: one conditioning vector">
            <thead>
              <tr>
                <th scope="col">Policy</th>
                <th scope="col" className="num">
                  Demos
                </th>
                <th scope="col" className="num">
                  Samples
                </th>
                <th scope="col" className="num">
                  Final loss
                </th>
                <th scope="col" className="num">
                  Success
                </th>
              </tr>
            </thead>
            <tbody>
              {vlaRows.map((row) => (
                <tr key={row.id} id={`first-round-${row.id}`}>
                  <th scope="row" className={styles.wrap}>
                    {capital(row.label)}
                    <span className={styles.cellDetail}>
                      <code className={styles.inlineCode}>{row.policy}</code>
                    </span>
                  </th>
                  <td className="num">{row.demos}</td>
                  <td className="num">{row.samples}</td>
                  <td className="num">{row.lossText}</td>
                  <td className="num">{formatCount(row.successes, row.episodes)}</td>
                </tr>
              ))}
            </tbody>
          </TableBox>
        </>
      ) : null}

      <SubHead id="every-token">Every token to the action head</SubHead>
      <div className={styles.blockGap}>
        <RunFacets
          title="Success by point of training, one panel per backbone"
          runs={vlas.map((entry) => entry.name)}
          sharedX={false}
          caption="Each panel is one run, on its own training budget. A hatched panel is a run still in progress: it has no value here until it is reported."
        />
      </div>
      <RunStatusTable runs={vlas} label="The vision-language-action policies" idPrefix="vla" showFix />

      <SubHead id="the-backbone-itself">The from-scratch backbone itself</SubHead>
      <TableBox label="The from-scratch language model and vision-language model">
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col" className="num">
              Final loss
            </th>
            <th scope="col" className="num">
              Lists the objects in order
            </th>
            <th scope="col" className="num">
              Names the leftmost object
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={styles.wrap}>
              Language model
              <span className={styles.cellDetail}>{MACHINES.B.name}</span>
            </th>
            <td className="num">{machineB.languageModelLoss}</td>
            <td className="num">{MISSING}</td>
            <td className="num">{MISSING}</td>
          </tr>
          <tr>
            <th scope="row" className={styles.wrap}>
              Vision-language model, {POSITION_FIX.before.label}
              <span className={styles.cellDetail}>{MACHINES.B.name}</span>
            </th>
            <td className="num">{machineB.vlmLoss}</td>
            <td className="num">{formatSuccess(machineB.ordering)}</td>
            <td className="num">{formatSuccess(machineB.leftmost)}</td>
          </tr>
          <tr>
            <th scope="row" className={styles.wrap}>
              Vision-language model, retrained {POSITION_FIX.after.label}
              <span className={styles.cellDetail}>{MACHINES.B.name}, same data and budget</span>
            </th>
            <td className="num">{machineB.vlmAfterFix.loss}</td>
            <td className="num">{formatSuccess(machineB.vlmAfterFix.ordering)}</td>
            <td className="num">{formatSuccess(machineB.vlmAfterFix.leftmost)}</td>
          </tr>
        </tbody>
      </TableBox>
      <TableNote>
        The captioning check is on {machineB.heldOutScenes} held-out scenes.{" "}
        {llm ? "The language model was trained before the fix; its sequences were short enough that no positions were merged." : null}{" "}
        The policies after the fix are built on the retrained model.
      </TableNote>

      <SubHead id="second-seed">A second seed</SubHead>
      <p className={styles.prose}>
        The reference recipe again with other seeds for the data order and the initial weights, once with the fixed
        position table and once with the old one: the before and after of section {SECTIONS.positionFix.number} with a
        second pair of runs.
      </p>
      {pairs.slice(1).map((pair, offset) => (
        <div key={pair.after} className={styles.blockGap}>
          <FixChart pairIndex={offset + 1} />
          <PairTable index={offset + 1} />
        </div>
      ))}
      <RunStatusTable runs={seeds} label="The second seed" idPrefix="seed" showFix />
      {seeds.length === 0 ? <TableNote>No run with a second seed is in the data.</TableNote> : null}
    </LabSection>
  );
}
