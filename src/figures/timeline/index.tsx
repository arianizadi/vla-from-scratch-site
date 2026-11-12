"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  ControlButton,
  FIGURES,
  FigureFrame,
  PlayButton,
  Slider,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
  type FigureProps,
} from "@/figures/kit";
import { Details } from "./Details";
import {
  CHRONOLOGICAL,
  ENTRIES,
  ENTRY_BY_ID,
  LINKS,
  MODALITY_LABEL,
  OFF_CHART_LINKS,
  STRANDS,
  STRAND_BY_ID,
  YEARS,
  listWords,
  type Entry,
  type Modality,
} from "./entries";
import { MAX_GAP_YEARS, estimateLabelWidth, wideLayout, type LabelWidth } from "./layout";
import { NarrowChart } from "./NarrowChart";
import { lineageOf, type Lineage } from "./state";
import { ModalitySwatch, StrandMarker } from "./StrandMarker";
import { WideChart } from "./WideChart";
import "./timeline.css";

const info = FIGURES.timeline;

/**
 * Focused when the figure opens: the policy chapter 02 says joins the two
 * robot-learning lines, so its lineage reaches into every strand. If the
 * entry list ever loses it, the figure opens with nothing focused.
 */
const DEFAULT_FOCUS = ENTRY_BY_ID.has("pi0") ? "pi0" : null;
/** Below this stage width the timeline turns to run top to bottom. */
const NARROW_BELOW = 600;
/**
 * Width the wide form is drawn at before the stage is measured. Until then
 * (and in the static HTML) both forms are in the page and a container query
 * shows the one that fits; after measuring only that one is rendered.
 */
const DEFAULT_WIDTH = 880;
/** Room for the dot left of a measured name, plus a pixel to spare. */
const NAME_LEFT = 17;
/** How long each year stays while the history plays: long enough to read the status line. */
const YEAR_MS = 1400;
const LAST = YEARS.length - 1;
const MODALITIES: Modality[] = ["language", "vision", "action"];

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The text alternative: what the figure holds, counted from the entry list. */
const SUMMARY = (() => {
  const inferredCount = LINKS.filter((link) => link.inferred).length;
  const strands = STRANDS.map((strand) => {
    const members = CHRONOLOGICAL.filter((entry) => entry.strand === strand.id);
    if (members.length === 0) return `${lower(strand.label)}, none`;
    const first = members[0].year;
    const last = members[members.length - 1].year;
    return `${lower(strand.label)}, ${members.length} from ${first}${last !== first ? ` to ${last}` : ""}`;
  });
  const vla = CHRONOLOGICAL.find((entry) => entry.strand === "vla");
  return (
    `A time axis from ${YEARS[0]} to ${YEARS[LAST]} with ${ENTRIES.length} papers and systems from chapters 2 and 3, ` +
    `in ${STRANDS.length} strands: ${listWords(strands)}. ` +
    `${plural(LINKS.length, "line joins", "lines join")} an entry to the earlier work it builds on` +
    (inferredCount > 0 ? `; ${inferredCount} of them ${inferredCount === 1 ? "is" : "are"} inferred from the text, not stated in it. ` : ". ") +
    (OFF_CHART_LINKS.length > 0
      ? `${plural(OFF_CHART_LINKS.length, "short line shows a part", "short lines show parts")} not on the timeline: ${listWords(OFF_CHART_LINKS.map((link) => `${link.name} in ${ENTRY_BY_ID.get(link.to)?.name ?? link.to}`))}. `
      : "") +
    (vla ? `The ${lower(STRAND_BY_ID.get("vla")?.label ?? "")} strand begins in ${vla.year} with ${vla.name}. ` : "") +
    "Each entry is a button: focus one to read its line, what it builds on and the chapters that discuss it; the arrow keys move between entries."
  );
})();

function entryLabel(entry: Entry): string {
  const strand = STRAND_BY_ID.get(entry.strand)?.label ?? "";
  return `${entry.name}${entry.kind ? ` (${entry.kind})` : ""}, ${entry.who}, ${entry.year}. ${strand}. ${entry.line}`;
}

/** The status after a year change. `news` is false for the whole history shown without a change of year (Reset, cleared focus). */
function yearStatus(index: number, news: boolean): string {
  const year = YEARS[index];
  const shown = CHRONOLOGICAL.filter((entry) => entry.year <= year);
  const fresh = shown.filter((entry) => entry.year === year);
  const parts = [`Up to ${year}: ${shown.length} of ${ENTRIES.length} entries.`];
  if (fresh.length > 0 && (news || index < LAST)) parts.push(`New in ${year}: ${listWords(fresh.map((entry) => entry.name))}.`);
  for (const strand of STRANDS) {
    const first = fresh.find((entry) => entry.strand === strand.id);
    if (first && !shown.some((entry) => entry.strand === strand.id && entry.year < year)) {
      parts.push(`First of the ${lower(strand.label)}: ${first.name}.`);
    }
  }
  const empty = STRANDS.filter((strand) => !shown.some((entry) => entry.strand === strand.id));
  if (empty.length > 0) parts.push(`None yet among the ${listWords(empty.map((strand) => lower(strand.label)))}.`);
  return parts.join(" ");
}

function focusStatus(entry: Entry, lineage: Lineage): string {
  const strand = STRAND_BY_ID.get(entry.strand)?.label ?? "";
  const head = `${entry.name} (${entry.who}, ${entry.year}), ${lower(strand)}.`;
  const relations = entry.buildsOn.filter((relation) => ENTRY_BY_ID.has(relation.id));
  const direct = relations.length;
  const inferred = relations.filter((relation) => relation.inferred).length;
  const off = entry.offChart ?? [];
  const offText = off.length > 0 ? ` Also built from ${listWords(off.map((item) => item.name))}, not on this timeline.` : "";
  const all = lineage.ancestors.size;
  if (all === 0) return `${head} No earlier entry on this timeline.${offText}`;
  const inferredText = inferred > 0 ? ` (${inferred} by an inferred line)` : "";
  const through =
    all > direct
      ? ` and ${all} in all, from ${lineage.ancestorStrands} of ${STRANDS.length} strands${lineage.throughInferred && inferred === 0 ? ", counting inferred lines" : ""}`
      : "";
  return `${head} Builds on ${plural(direct, "earlier entry", "earlier entries")} directly${inferredText}${through}.${offText}`;
}

/**
 * timeline: the papers and systems chapters 2 and 3 cite, on a time axis, one
 * lane per strand (language models, vision encoders, vision-language models,
 * vision-language-action models, robot learning), with a line from each
 * entry to the earlier work it builds on: solid where the chapters say so,
 * dashed where they only imply it.
 *
 * Focusing an entry (click, Tab, the arrow keys) shows its line, the chapters
 * that discuss it, and its whole lineage: everything it builds on, directly or
 * not, stays in ink and the rest steps back. The year control cuts history off
 * at a year; Play walks it forward one year at a time, which is where the
 * strands can be seen arriving and then meeting in the VLA lane.
 *
 * Schematic: the entries, years and lines are the chapters' own (entries.ts);
 * nothing here is measured.
 */
export default function TimelineFigure({ caption }: FigureProps) {
  const [focusId, setFocusId] = useState<string | null>(DEFAULT_FOCUS);
  const [cutoff, setCutoff] = useState(LAST);
  const [playing, setPlaying] = useState(false);
  const [statusKind, setStatusKind] = useState<"focus" | "year">("focus");
  // Whether the year status names what the current year added: after Play or the slider, not after Reset or a cleared focus.
  const [yearNews, setYearNews] = useState(false);
  // The entry the reader was last on: it keeps the Tab stop when the focus is cleared.
  const [lastId, setLastId] = useState<string | null>(DEFAULT_FOCUS);
  // Name widths measured in the page, once the fonts are in; estimated until then.
  const [nameWidths, setNameWidths] = useState<ReadonlyMap<string, number> | null>(null);
  // The figure opens on the whole history; Play offers "Replay" only once it has played through.
  const [played, setPlayed] = useState(false);

  const uid = useId();
  const detailsId = `${uid}-details`;
  const summaryId = `${uid}-summary`;

  const stage = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stage);
  const onScreen = useInView(stage, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  /*
   * In the narrow form the rows after the cutoff are left out, so a change of year changes the height of the
   * list above the control bar. The bar is kept where it is on screen: its position is noted before the change
   * (keepBar) and the page is scrolled by however far it moved once the change is drawn.
   */
  const barTop = useRef<number | null>(null);
  const formRef = useRef<"both" | "narrow" | "wide">("both");
  const controlBar = () => stage.current?.closest("figure")?.querySelector<HTMLElement>(".plate-bar") ?? null;
  const keepBar = () => {
    if (formRef.current !== "narrow") return;
    const bar = controlBar();
    barTop.current = bar ? bar.getBoundingClientRect().top : null;
  };
  useLayoutEffect(() => {
    const before = barTop.current;
    if (before === null) return;
    barTop.current = null;
    const bar = controlBar();
    if (!bar) return;
    const moved = bar.getBoundingClientRect().top - before;
    if (Math.abs(moved) >= 1) window.scrollBy(0, moved);
  });

  // History moves forward only while the figure is on screen in a visible tab, never under reduced motion.
  const running = playing && cutoff < LAST && onScreen && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      keepBar();
      setCutoff((current) => Math.min(LAST, current + 1));
    }, YEAR_MS);
    return () => clearTimeout(timer);
    // keepBar reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, cutoff]);

  const year = YEARS[cutoff];
  const visible = useMemo(() => new Set(ENTRIES.filter((entry) => entry.year <= year).map((entry) => entry.id)), [year]);
  const focus = focusId && visible.has(focusId) ? focusId : null;
  const focusEntry = focus ? ENTRY_BY_ID.get(focus) : undefined;
  const lineage = useMemo(() => lineageOf(focus), [focus]);

  const width = measured || DEFAULT_WIDTH;
  const form: "both" | "narrow" | "wide" = measured === 0 ? "both" : measured < NARROW_BELOW ? "narrow" : "wide";
  const narrow = form === "narrow";
  useLayoutEffect(() => {
    formRef.current = form;
  }, [form]);
  const labelWidth = useCallback<LabelWidth>(
    (entry) => {
      const name = nameWidths?.get(entry.id);
      return name ? name + NAME_LEFT : estimateLabelWidth(entry.name);
    },
    [nameWidths],
  );
  const layout = useMemo(() => wideLayout(width, ENTRIES, labelWidth), [width, labelWidth]);
  const onMeasureNames = useCallback((widths: ReadonlyMap<string, number>) => {
    if ([...widths.values()].some((value) => value <= 0)) return;
    setNameWidths((previous) =>
      previous && previous.size === widths.size && [...widths].every(([id, value]) => previous.get(id) === value) ? previous : widths,
    );
  }, []);
  const visibleInOrder = CHRONOLOGICAL.filter((entry) => visible.has(entry.id));
  const tabId = focus ?? (lastId && visible.has(lastId) ? lastId : (visibleInOrder[0]?.id ?? null));

  // Before the first measurement both forms are mounted, so an entry can have two buttons; the one shown is used.
  const buttons = useRef(new Map<string, Set<HTMLButtonElement>>());
  const registerEntry = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (!element) return;
    const set = buttons.current.get(id) ?? new Set<HTMLButtonElement>();
    set.add(element);
    buttons.current.set(id, set);
    return () => {
      set.delete(element);
    };
  }, []);
  const buttonFor = (id: string) => [...(buttons.current.get(id) ?? [])].find((element) => element.getClientRects().length > 0);

  const select = (id: string) => {
    setFocusId(id);
    setLastId(id);
    setStatusKind("focus");
  };

  /**
   * Select an entry and move keyboard focus to it (from the details panel or the arrow keys). From a pointer
   * in the wide form the page does not scroll: the details the reader is looking at update in place.
   */
  const go = (id: string, keyboard = true) => {
    select(id);
    buttonFor(id)?.focus({ preventScroll: !keyboard && !narrow });
  };

  /** Clear the focus; from the control bar (not from Escape on an entry) the bar is kept where it is. */
  const clearFocus = (fromBar = false) => {
    if (fromBar) keepBar();
    setFocusId(null);
    setStatusKind("year");
    setYearNews(false);
  };

  const neighbour = (id: string, key: string): string | undefined => {
    const order = visibleInOrder.map((entry) => entry.id);
    const at = order.indexOf(id);
    if (key === "Home") return order[0];
    if (key === "End") return order[order.length - 1];
    if (narrow) {
      if (key === "ArrowDown" || key === "ArrowRight") return order[at + 1];
      if (key === "ArrowUp" || key === "ArrowLeft") return order[at - 1];
      return undefined;
    }
    const here = layout.entries.get(id);
    if (!here) return undefined;
    const placed = [...layout.entries.values()].filter((item) => visible.has(item.entry.id));
    if (key === "ArrowLeft" || key === "ArrowRight") {
      // Along the strand: by year, then top to bottom within a year.
      const lane = placed.filter((item) => item.entry.strand === here.entry.strand).sort((a, b) => a.x - b.x || a.y - b.y);
      const index = lane.findIndex((item) => item.entry.id === id);
      return lane[index + (key === "ArrowRight" ? 1 : -1)]?.entry.id;
    }
    if (key === "ArrowUp" || key === "ArrowDown") {
      // To the nearest entry in the next strand up or down that has one.
      const laneIndex = STRANDS.findIndex((strand) => strand.id === here.entry.strand);
      const step = key === "ArrowDown" ? 1 : -1;
      for (let index = laneIndex + step; index >= 0 && index < STRANDS.length; index += step) {
        const lane = placed.filter((item) => item.entry.strand === STRANDS[index].id);
        if (lane.length === 0) continue;
        lane.sort((a, b) => Math.abs(a.x - here.x) - Math.abs(b.x - here.x) || a.y - b.y);
        return lane[0].entry.id;
      }
    }
    return undefined;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === "Escape") {
      if (focusId !== null) {
        event.preventDefault();
        clearFocus();
      }
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const target = neighbour(id, event.key);
    if (target && target !== id) go(target);
  };

  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    // Play walks history from the first year; nothing is focused so the year's news is what the status line reads.
    keepBar();
    if (cutoff >= LAST) setCutoff(0);
    setPlayed(true);
    setFocusId(null);
    setStatusKind("year");
    setYearNews(true);
    setPlaying(true);
  };

  const reset = () => {
    keepBar();
    setPlaying(false);
    setCutoff(LAST);
    setFocusId(DEFAULT_FOCUS);
    setLastId(DEFAULT_FOCUS);
    setStatusKind("focus");
    setYearNews(false);
  };

  const status = statusKind === "focus" && focusEntry ? focusStatus(focusEntry, lineage) : yearStatus(cutoff, yearNews);

  const details = focusEntry ? (
    <Details
      id={detailsId}
      entry={focusEntry}
      visible={visible}
      lineage={{ count: lineage.ancestors.size, strands: lineage.ancestorStrands, throughInferred: lineage.throughInferred }}
      onSelect={go}
    />
  ) : null;

  const chartProps = {
    visible,
    focusId: focus,
    tabId,
    entryState: lineage.entryState,
    linkState: lineage.linkState,
    onSelect: select,
    onKeyDown,
    registerEntry,
    entryLabel,
  };

  const lineKey = (
    <>
      <li>
        <svg className="tl-key-line" width={28} height={12} aria-hidden="true">
          <path d="M2,10 C14,10 14,2 26,2" />
        </svg>
        builds on, as the chapters say
      </li>
      <li>
        <svg className="tl-key-line" data-inferred="true" width={28} height={12} aria-hidden="true">
          <path d="M2,10 C14,10 14,2 26,2" />
        </svg>
        inferred from the chapters
      </li>
    </>
  );

  // Before the first measurement both forms are rendered, and CSS shows the one that fits; the details then need two ids.
  const narrowDetailsId = form === "both" ? `${detailsId}-n` : detailsId;
  const wideDetails =
    form === "both" && focusEntry ? (
      <Details
        id={`${detailsId}-w`}
        entry={focusEntry}
        visible={visible}
        lineage={{ count: lineage.ancestors.size, strands: lineage.ancestorStrands, throughInferred: lineage.throughInferred }}
        onSelect={go}
      />
    ) : (
      details
    );
  const narrowDetails =
    form === "both" && focusEntry ? (
      <Details
        id={narrowDetailsId}
        entry={focusEntry}
        visible={visible}
        lineage={{ count: lineage.ancestors.size, strands: lineage.ancestorStrands, throughInferred: lineage.throughInferred }}
        onSelect={go}
      />
    ) : (
      details
    );

  return (
    <FigureFrame
      className="tl-figure"
      title={info.title}
      stamp={info.stamp}
      // The drawing is itself a grid or a table: no graph paper behind it.
      grid={false}
      caption={caption}
      status={status}
      note={
        <>
          Schematic. Entries, years and one-line summaries are from the text and reading lists of chapters 2 and 3, each
          in the year those chapters give. A solid line joins an entry to earlier work those chapters say it builds on; a
          dashed line is a relation they imply without stating it, and is marked as inferred in the entry&apos;s details.{" "}
          {narrow
            ? "Only the selected entry's lines are drawn. The rows are in time order; the arrow keys move from one entry to the next and Escape clears the focus."
            : `A line from the edge of a lane, ending in an open circle, is a part not on this timeline, named in the entry's details. Years are spaced by the room their entries need, not evenly: a year without entries is narrow, and a stretch of more than ${MAX_GAP_YEARS} years without one is cut out. Arrow keys move between entries: left and right along a strand, up and down between strands; Escape clears the focus.`}
        </>
      }
      controls={
        <>
          <PlayButton playing={running} ended={played && cutoff >= LAST && !running} onToggle={togglePlay} className="motion-reduce:hidden" />
          <Slider
            label="Up to"
            min={0}
            max={LAST}
            value={cutoff}
            onChange={(next) => {
              keepBar();
              setPlaying(false);
              setCutoff(next);
              setStatusKind("year");
              setYearNews(true);
            }}
            format={(index) => String(YEARS[index])}
          />
          <ControlButton
            // aria-disabled, not disabled: a button that disables itself on click would drop keyboard focus.
            aria-disabled={focus === null}
            onClick={() => {
              if (focus !== null) clearFocus(true);
            }}
          >
            Clear focus
          </ControlButton>
          <ControlButton onClick={reset}>Reset</ControlButton>
        </>
      }
    >
      <div
        ref={stage}
        className="tl-root"
        data-form={form}
        role="group"
        aria-label={`Timeline: ${info.title}`}
        aria-describedby={summaryId}
      >
        <p id={summaryId} className="sr-only">
          {SUMMARY}
        </p>

        {form !== "wide" ? (
          <div className="tl-form-narrow">
            <ul className="tl-key" aria-label="Strands, in the order of the rails from left to right">
              {STRANDS.map((strand, index) => (
                <li key={strand.id}>
                  <StrandMarker strand={strand.id} size={12} />
                  <span>
                    <span className="tl-key-order">{index + 1}</span> {strand.label}
                  </span>
                </li>
              ))}
              {lineKey}
            </ul>
            <NarrowChart {...chartProps} detailsId={narrowDetailsId} details={narrowDetails} />
          </div>
        ) : null}

        {form !== "narrow" ? (
          <div className="tl-form-wide">
            <ul className="tl-key" aria-hidden="true">
              {MODALITIES.map((modality) => (
                <li key={modality}>
                  <ModalitySwatch modality={modality} />
                  {MODALITY_LABEL[modality]}
                </li>
              ))}
              <li>a split marker: a strand that combines them</li>
              {lineKey}
              {OFF_CHART_LINKS.length > 0 ? (
                <li>
                  <svg className="tl-key-line" width={28} height={12} aria-hidden="true">
                    <path d="M5,2 C5,8 12,10 26,10" />
                    <circle cx={5} cy={4} r={3} className="tl-stub-end" />
                  </svg>
                  from a part not on this timeline
                </li>
              ) : null}
            </ul>
            <WideChart {...chartProps} detailsId={form === "both" ? `${detailsId}-w` : detailsId} layout={layout} onMeasure={onMeasureNames} />
            <div className="tl-panel" aria-live="off">
              {wideDetails ?? (
                <p className="tl-panel-empty">Select an entry to read its line, what it builds on, and the chapters that discuss it.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </FigureFrame>
  );
}
