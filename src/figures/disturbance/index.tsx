"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import type { Trace } from "@/data/files";
import { fixed, formatCount, formatMm, formatSamples } from "@/data/format";
import { OBJECTS, WEIGHTS, instructionFor } from "@/data/labels";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  Marker,
  PlayButton,
  Segmented,
  Slider,
  Stepper,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { ActorList } from "./ActorList";
import { DataTable } from "./DataTable";
import {
  ACTORS,
  COMPARED,
  DEFAULT_DISTURBANCE,
  DISTURBANCES,
  MAX_STEPS,
  SINGLE,
  behaviour,
  boundsOf,
  closeSteps,
  decisiveClose,
  isFinalCheckpoint,
  sharedEpisodes,
  topOf,
  type ActorUnder,
  type DisturbanceOption,
} from "./model";
import { CloseMark, Gripper, Plan, planHeight, seriesOf } from "./Plan";
import { Timeline, timelineHeight } from "./Timeline";
import { useTraces } from "./useTraces";

const info = FIGURES.disturbance;

/** The replay runs at this multiple of the simulator's control rate. */
const SPEED = 2;
const SPEED_WORDS = "twice";
/** Stage width from which the list of actors sits beside the plan. */
const SIDE_BY_SIDE = 720;
const LIST_WIDTH = 312;
/** Until the stage is measured (and in the static HTML) the figure is laid out at this width. */
const FALLBACK_WIDTH = 640;
/** The plan's height is kept between these, so the plan, the timeline and Play fit on one screen. */
const PLAN_MIN = 220;
const PLAN_MAX = 400;
/** The rollouts are requested once the figure is this close to the screen. */
const NEAR = "800px 0px";

const sentenceCase = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** The first actor of the list that has a rollout under the disturbance. */
function firstActor(option: DisturbanceOption): string | undefined {
  return ACTORS.find((actor) => option.actors.has(actor.words))?.words;
}

/** The layout to show for an actor: the one asked for if it has it, else the first every actor shares, else its first. */
function pickEpisode(under: ActorUnder, option: DisturbanceOption, wanted: number | null): number | undefined {
  const own = under.traces.map((trace) => trace.episode);
  if (wanted !== null && own.includes(wanted)) return wanted;
  return sharedEpisodes(option).find((episode) => own.includes(episode)) ?? own[0];
}

function moveWords(option: DisturbanceOption, moved: { step: number; kind: "reach" | "grasp" } | null): string {
  if (!moved) return "not moved (no free place was found)";
  const mm = option.settings.disturbMm;
  const by = mm !== null ? ` ${mm} mm` : "";
  return moved.kind === "grasp"
    ? `moved${by} the moment the gripper first closes (step ${moved.step})`
    : `moved${by} at control step ${moved.step} of the reach`;
}

/** A native select for the disturbance, styled as the kit's controls are (32px, 44px on touch). */
function DisturbanceSelect({ value, onChange }: { value: string; onChange: (words: string) => void }) {
  const id = useId();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor={id} className="fig-label flex-none">
        Disturbance
      </label>
      <div className="relative min-w-0">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={SELECT_CLASS}
        >
          {(COMPARED.length > 0 ? COMPARED : DISTURBANCES).map((option) => (
            <option key={option.words} value={option.words}>
              {option.words}
            </option>
          ))}
          {COMPARED.length > 0 && SINGLE.length > 0 ? (
            <optgroup label="Rollouts of one actor only">
              {SINGLE.map((option) => (
                <option key={option.words} value={option.words}>
                  {option.words}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}

const SELECT_CLASS =
  "block h-8 w-full min-w-0 cursor-pointer appearance-none truncate rounded-control border border-line-strong bg-surface py-0 pr-8 pl-2.5 text-14 font-medium text-ink hover:border-ink pointer-coarse:h-11";

function SelectChevron() {
  return (
    <Glyph
      name="chevron"
      size={12}
      className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rotate-90 text-ink-muted"
    />
  );
}

/**
 * Who acts, as a compact select: below the side-by-side width, so the choice
 * sits in the control bar next to Play and the plan, and the list with its
 * small plans folds away under the drawing.
 */
function ActorSelect({
  option,
  episode,
  value,
  onChange,
}: {
  option: DisturbanceOption;
  episode: number;
  value: string;
  onChange: (words: string) => void;
}) {
  const id = useId();
  const listed = ACTORS.filter((actor) => option.actors.has(actor.words));
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor={id} className="fig-label flex-none">
        Who acts
      </label>
      <div className="relative min-w-0">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT_CLASS}>
          {listed.map((actor) => {
            const has = option.actors.get(actor.words)?.traces.some((trace) => trace.episode === episode) ?? false;
            return (
              <option key={actor.words} value={actor.words} disabled={!has}>
                {sentenceCase(actor.words)}
                {has ? "" : " (no rollout on this layout)"}
              </option>
            );
          })}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}

/** The key to the plan: HTML, so it wraps. Only the objects on this layout. */
function PlanLegend({
  trace,
  objects,
  afterClose,
}: {
  trace: Trace | null;
  objects: readonly string[];
  /** Words for the faint path after the deciding close, when the plan draws one. */
  afterClose: string | null;
}) {
  const swatch = (content: ReactNode) => (
    <svg width={22} height={16} viewBox="0 0 22 16" aria-hidden="true" focusable="false">
      {content}
    </svg>
  );
  return (
    <ul aria-label="Legend" className="fig-legend">
      {objects.map((object) => {
        const id = object as keyof typeof OBJECTS;
        const style = seriesOf(id);
        const named = trace?.target === id;
        return (
          <li key={object}>
            {swatch(<Marker shape={style.shape} x={11} y={8} size={named ? 12 : 10} color={style.color} />)}
            {OBJECTS[id].short}
            {named ? " (named)" : ""}
          </li>
        );
      })}
      {trace?.moved ? (
        <li>
          {swatch(
            <Marker
              shape={seriesOf(trace.target).shape}
              x={11}
              y={8}
              size={12}
              color={seriesOf(trace.target).color}
              hollow
              strokeDasharray="3 2"
            />,
          )}
          Old place
        </li>
      ) : null}
      <li>
        {swatch(<path d="M1,8H21" stroke="var(--text)" strokeWidth={2} />)}
        Gripper path
      </li>
      {afterClose ? (
        <li>
          {swatch(<path d="M1,8H21" stroke="var(--text-faint)" strokeWidth={1} />)}
          {afterClose}
        </li>
      ) : null}
      <li>
        {swatch(<CloseMark x={11} y={8} size={9} />)}
        Gripper told to close
      </li>
      <li>
        <svg width={22} height={22} viewBox="0 0 22 22" aria-hidden="true" focusable="false">
          <Gripper x={11} y={11} opening={1} />
        </svg>
        Gripper now
      </li>
    </ul>
  );
}

export default function DisturbanceFigure({ caption }: FigureProps) {
  const [words, setWords] = useState(DEFAULT_DISTURBANCE?.words);
  const [actorWords, setActorWords] = useState<string | undefined>(() =>
    DEFAULT_DISTURBANCE ? firstActor(DEFAULT_DISTURBANCE) : undefined,
  );
  const [episodeChoice, setEpisode] = useState<number | null>(null);
  // Infinity: the end of the rollout, its finished state (static HTML, reduced motion).
  const [step, setStep] = useState(Infinity);
  const [playing, setPlaying] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const [lastHeight, setLastHeight] = useState<number | null>(null);

  const stage = useRef<HTMLDivElement>(null);
  // The plan and its timeline: what has to be on screen for a replay to be seen.
  const planBox = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stage);
  const onScreen = useInView(planBox, { amount: 0.25 });
  const arrived = useInView(planBox, { amount: 0.6, once: true });
  const near = useInView(stage, { amount: 0, margin: NEAR, once: true });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const option = DISTURBANCES.find((entry) => entry.words === words) ?? DEFAULT_DISTURBANCE;
  const under =
    option && actorWords !== undefined && option.actors.has(actorWords)
      ? option.actors.get(actorWords)
      : option
        ? option.actors.get(firstActor(option) ?? "")
        : undefined;
  const episode = option && under ? pickEpisode(under, option, episodeChoice) : undefined;
  const traceInfo = under?.traces.find((entry) => entry.episode === episode);

  // Every actor on this layout under this disturbance: the plan is framed to hold them all.
  const ids =
    option && episode !== undefined
      ? [...option.actors.values()].flatMap((entry) =>
          entry.traces.filter((trace) => trace.episode === episode).map((trace) => trace.id),
        )
      : [];
  const set = useTraces(ids, near);
  const loadedTraces = ids.flatMap((id) => set.ready.get(id) ?? []);
  const bounds = set.settled ? boundsOf(loadedTraces) : null;
  const top = topOf(loadedTraces);
  const span = loadedTraces.reduce((longest, trace) => Math.max(longest, trace.steps), 0);
  const trace = traceInfo ? (set.ready.get(traceInfo.id) ?? null) : null;
  const drawable = trace !== null && bounds !== null;

  const last = Math.max(0, (trace?.steps ?? traceInfo?.steps ?? 1) - 1);
  const shown = Math.min(step, last);
  const ended = shown >= last;
  const hz = trace?.hz ?? null;
  const rate = (hz ?? 0) * SPEED;

  const running = playing && drawable && !ended && onScreen && pageVisible && !reducedMotion && rate > 0;

  // Layout. The plan keeps its last height while the next layout's rollouts load, so nothing below it jumps.
  const width = measured || FALLBACK_WIDTH;
  const sideBySide = width >= SIDE_BY_SIDE;
  const planWidth = sideBySide ? width - LIST_WIDTH - 24 : width;
  const framedHeight = bounds ? planHeight(bounds, planWidth, PLAN_MIN, PLAN_MAX) : null;
  if (framedHeight !== null && framedHeight !== lastHeight) setLastHeight(framedHeight);
  const height = framedHeight ?? lastHeight ?? planHeight(null, planWidth, PLAN_MIN, PLAN_MAX);

  // The replay: simulated time, linear, from wherever the reader left it.
  const stepRef = useRef(0);
  useEffect(() => {
    stepRef.current = shown;
  });
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let origin: number | null = null;
    const from = stepRef.current;
    const tick = (now: number) => {
      if (origin === null) origin = now;
      const next = Math.min(last, from + Math.floor(((now - origin) / 1000) * rate));
      if (next !== stepRef.current) {
        stepRef.current = next;
        setStep(next);
      }
      if (next >= last) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, last, rate]);

  // Autoplay once, when the figure has arrived and its rollout is in, unless the reader got there first.
  useEffect(() => {
    if (!arrived || reducedMotion || touched || !drawable) return;
    const timer = setTimeout(() => {
      setTouched(true);
      setStep(0);
      setPlaying(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [arrived, reducedMotion, touched, drawable]);

  if (!option || !under || episode === undefined || !traceInfo) {
    return (
      <FigureFrame
        title={info.title}
        stamp={info.stamp}
        caption={caption}
        note="No rollouts under a disturbance are published yet."
      >
        <p className="m-0 text-14 text-ink-muted">Nothing to replay.</p>
      </FigureFrame>
    );
  }

  const actor = under.actor;
  const condition = under.condition;
  const reported = under.reported;
  const object = OBJECTS[traceInfo.target];
  const timedOut = !traceInfo.success && traceInfo.steps >= MAX_STEPS;
  const ownEpisodes = under.traces;

  const interact = () => {
    setTouched(true);
    setPlaying(false);
  };
  const goTo = (next: number) => {
    interact();
    setStep(Math.max(0, Math.min(last, next)));
  };
  // A new selection opens on its finished state, as the figure first does: no step carried over from another rollout.
  const select = (change: () => void) => {
    interact();
    setStep(Infinity);
    change();
  };

  const togglePlay = () => {
    setTouched(true);
    if (playing && !ended) {
      setPlaying(false);
      return;
    }
    if (ended) setStep(0);
    setPlaying(true);
    // Pressed with the plan out of view: bring it into view, where the replay runs.
    if (!onScreen) planBox.current?.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  };

  // Words.
  const outcome = traceInfo.success
    ? "and lifts it"
    : timedOut
      ? "and has not lifted it when the episode runs out of time"
      : "and does not lift it";
  const episodeSentence = `${sentenceCase(actor.words)}, layout ${episode + 1}: the ${object.label} is ${moveWords(
    option,
    traceInfo.moved,
  )}; the gripper ${behaviour(traceInfo, trace)}, ${outcome}.`;

  // Only the numbers the lab notebook prints for this evaluation (see Reported in model.ts).
  const evaluationSentence = reported
    ? [
        `Over the evaluation, ${formatCount(reported.successes, reported.episodes)} lifted (episodes in which the object could be moved)`,
        reported.fromOldMm !== null && reported.fromNewMm !== null
          ? `the gripper closed a median ${formatMm(reported.fromOldMm)} from the old place and ${formatMm(reported.fromNewMm)} from the new`
          : null,
        reported.retried !== null ? `${formatCount(reported.retried, reported.episodes)} with a second grasp attempt` : null,
      ]
        .filter(Boolean)
        .join("; ") + "."
    : "The notebook reports no evaluation of this actor under these conditions: the rollout stands alone.";
  const alone =
    option.actors.size < 2
      ? `Under this disturbance only the rollouts of the ${actor.words} are published: there is no other actor to compare.`
      : null;

  const closes = trace ? closeSteps(trace) : [];
  const time = hz ? `${fixed(shown / hz, 1)} s` : null;
  const gripperNow = trace ? ((trace.action[shown]?.at(-1) ?? 1) < 0.5 ? "told to close" : "open") : null;
  const phase = traceInfo.moved === null ? "" : shown <= traceInfo.moved.step ? " Before the move." : " After the move.";
  const held = playing && !ended && !running && !reducedMotion;
  const status = !drawable
    ? set.failed
      ? "The rollout could not be loaded."
      : "Loading the rollouts."
    : running
      ? `Replaying: ${sentenceCase(actor.words)}, layout ${episode + 1}, at ${SPEED_WORDS} the real speed.`
      : held && !onScreen
        ? `Paused at step ${shown}: the plan is off screen. The replay goes on when the plan is back in view.`
        : held && !pageVisible
          ? `Paused at step ${shown} while the tab is hidden.`
          : `${sentenceCase(actor.words)}, layout ${episode + 1}: step ${shown} of ${last}${time ? `, ${time}` : ""}. Gripper ${gripperNow}.${phase}${
          ended
            ? ` ${traceInfo.success ? "The object is lifted." : timedOut ? "Out of time." : "The episode ends."}`
            : ""
        }`;

  const planLabel = `Top-down plan of the table at step ${shown} of ${last}. ${episodeSentence}`;

  // Each moment shows the step it is named by; "Moved" jumps to the first step after the move, where the object is at its new place.
  const events: { label: string; shown: number; step: number; describe: string }[] = [];
  if (traceInfo.moved) {
    const after = Math.min(last, traceInfo.moved.step + 1);
    events.push({
      label: "Moved",
      shown: traceInfo.moved.step,
      step: after,
      describe: `Moved at step ${traceInfo.moved.step}: shows step ${after}, the first after the move`,
    });
  }
  closes.forEach((close, index) => {
    const label = closes.length > 1 ? `Close ${index + 1}` : "Close";
    events.push({ label, shown: close, step: close, describe: `${label}, step ${close}` });
  });
  events.sort((a, b) => a.step - b.step);
  events.push({ label: "End", shown: last, step: last, describe: `End, step ${last}` });

  const checkpoint =
    actor.group === "expert"
      ? null
      : [
          isFinalCheckpoint(condition) ? "final checkpoint" : null,
          condition.samples !== undefined ? `${formatSamples(condition.samples)} samples` : null,
          condition.weights ? WEIGHTS[condition.weights].label : null,
        ]
          .filter(Boolean)
          .join(", ");

  const note = (
    <>
      Measured: rollouts recorded in simulation, every actor on the same layouts (the same seeds) under the same
      disturbance. {checkpoint ? `${sentenceCase(actor.words)}: ${checkpoint}; one training seed. ` : null}
      Counts are over the episodes in which the object could be moved, as the lab notebook counts them; the distances
      are medians over those episodes. Replayed at {SPEED_WORDS} the simulator&rsquo;s {hz ?? "real"}
      {hz ? " control steps per second" : " rate"}. The plan is drawn to scale (grid 50 mm); the object markers are not.
    </>
  );

  const layoutOptions = ownEpisodes.map((entry) => ({
    value: String(entry.episode),
    label: `${entry.episode + 1} · ${OBJECTS[entry.target].short}`,
  }));

  const listStyle = (sideBySide ? { width: LIST_WIDTH } : undefined) as CSSProperties | undefined;

  const decisive = trace ? decisiveClose(trace) : null;
  // Listed for the whole replay, not only once it is drawn, so the legend above the plan never changes height.
  const afterClose =
    trace && decisive !== null && decisive < trace.steps - 1
      ? trace.success
        ? "After the close that lifts"
        : traceInfo.moved
          ? "After the first close after the move"
          : "After the first close"
      : null;

  const actorList = (
    <ActorList
      actors={ACTORS}
      option={option}
      episode={episode}
      value={actor.words}
      onChange={(next) => select(() => setActorWords(next))}
      loaded={set.ready}
      bounds={bounds}
      thumbnail={56}
      columns={!sideBySide && width >= 560 ? 2 : 1}
    />
  );

  const timeline = timelineHeight(planWidth);

  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      note={note}
      status={status}
      controls={
        <>
          <PlayButton
            playing={playing && !ended}
            ended={ended}
            onToggle={togglePlay}
            className="motion-reduce:hidden"
          />
          <Stepper label="step" value={shown} max={last} onChange={goTo} />
          <Slider
            label="Control step"
            min={0}
            max={last}
            value={shown}
            onChange={goTo}
            format={(value) => (hz ? `${value} (${fixed(value / hz, 1)} s)` : String(value))}
          />
          {sideBySide ? null : (
            <ActorSelect
              option={option}
              episode={episode}
              value={actor.words}
              onChange={(next) => select(() => setActorWords(next))}
            />
          )}
          <DisturbanceSelect value={option.words} onChange={(next) => select(() => setWords(next))} />
          <Segmented
            label="Layout"
            showLabel
            options={layoutOptions}
            value={String(episode)}
            onChange={(next) => select(() => setEpisode(Number(next)))}
          />
          <ControlButton aria-pressed={showTable} onClick={() => setShowTable((value) => !value)}>
            {showTable ? "Hide table" : "Show as table"}
          </ControlButton>
          <ControlButton
            onClick={() => {
              interact();
              setWords(DEFAULT_DISTURBANCE?.words);
              setActorWords(DEFAULT_DISTURBANCE ? firstActor(DEFAULT_DISTURBANCE) : undefined);
              setEpisode(null);
              setStep(Infinity);
              setShowTable(false);
            }}
          >
            Reset
          </ControlButton>
        </>
      }
    >
      <div ref={stage} className={sideBySide ? "flex items-start gap-6" : "flex flex-col gap-4"}>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="m-0 text-15 leading-[1.4] font-medium text-ink">{episodeSentence}</p>
            <p className="m-0 text-14 text-ink-muted">
              Instruction: <q className="font-medium text-ink">{instructionFor(traceInfo.target)}</q>.{" "}
              {evaluationSentence}
              {alone ? ` ${alone}` : null}
            </p>
          </div>
          <PlanLegend trace={trace} objects={trace?.objects ?? []} afterClose={afterClose} />
          <div ref={planBox} className="flex scroll-mt-20 flex-col gap-3">
            {drawable ? (
              <Plan
                trace={trace}
                bounds={bounds}
                step={shown}
                width={planWidth}
                height={height}
                movedMm={option.settings.disturbMm}
                label={planLabel}
              />
            ) : (
              <div
                role="img"
                aria-label={planLabel}
                className="grid place-items-center rounded-plate border border-line bg-surface-2 text-14 text-ink-muted"
                style={{ aspectRatio: `${planWidth} / ${height}` }}
              >
                {set.failed && set.settled ? "The rollout could not be loaded." : "Loading the rollout."}
              </div>
            )}
            {drawable ? (
              <Timeline
                trace={trace}
                step={shown}
                span={Math.max(span, trace.steps)}
                top={top}
                width={planWidth}
                timedOut={timedOut}
                onScrub={goTo}
              />
            ) : (
              <div aria-hidden="true" style={{ aspectRatio: `${planWidth} / ${timeline}` }} />
            )}
          </div>
          <div
            role="group"
            aria-label="Jump to a moment"
            className="flex min-h-8 flex-wrap items-center gap-2 pointer-coarse:min-h-11"
          >
            <span className="fig-label">Jump to</span>
            {drawable
              ? events.map((event) => (
                  <ControlButton
                    key={`${event.label}-${event.step}`}
                    aria-current={shown === event.step ? "step" : undefined}
                    aria-label={event.describe}
                    onClick={() => goTo(event.step)}
                    className={shown === event.step ? "bg-accent-soft" : ""}
                  >
                    {event.label}
                    <span className="text-ink-faint tabular-nums">{event.shown}</span>
                  </ControlButton>
                ))
              : null}
          </div>
        </div>
        {sideBySide ? (
          <div className="min-w-0 flex-none" style={listStyle}>
            {actorList}
          </div>
        ) : (
          <details className="group min-w-0">
            <summary className="button button-small w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <Glyph name="chevron" size={12} className="transition-transform group-open:rotate-90" />
              Compare the actors on this layout
            </summary>
            <div className="mt-3">{actorList}</div>
          </details>
        )}
      </div>
      {showTable ? (
        <div className="mt-6">
          <DataTable actors={ACTORS} option={option} episode={episode} />
        </div>
      ) : null}
    </FigureFrame>
  );
}
