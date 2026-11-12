"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { STATIONS, type StationId } from "./content";

type Side = "right" | "left" | "top" | "bottom";

interface Arrow {
  side: Side;
  /** Position along the side the arrow leaves from, as a CSS length. */
  at: string;
  dashed?: boolean;
  /** Crosses the wider gap between the simulator and the server. */
  long?: boolean;
}

interface Placement {
  /** Grid column in the wide layout (column 3 is the spacer that makes room for the exchange labels). */
  col: number;
  row: number;
  /** Arrows leaving this card in the wide layout (a U) and the narrow one (a column). */
  wide: readonly Arrow[];
  narrow: readonly Arrow[];
  /** The word on the exchange arrow that leaves this card: what travels along it. */
  edge?: { label: string; className: string };
}

/**
 * Where each station sits and which arrows leave it. In the wide layout the
 * offline half runs left to right on top and the closed loop right to left
 * underneath; the server and the simulator are joined by two labelled arrows,
 * one each way, and a dashed arrow returns from the success rate to the expert.
 */
const PLACEMENT: Readonly<Record<StationId, Placement>> = {
  expert: {
    col: 1,
    row: 1,
    wide: [{ side: "right", at: "50%" }],
    narrow: [{ side: "bottom", at: "50%" }],
  },
  demonstrations: {
    col: 2,
    row: 1,
    wide: [{ side: "right", at: "50%", long: true }],
    narrow: [{ side: "bottom", at: "50%" }],
  },
  shards: {
    col: 4,
    row: 1,
    wide: [{ side: "right", at: "50%" }],
    narrow: [{ side: "bottom", at: "50%" }],
  },
  training: {
    col: 5,
    row: 1,
    wide: [{ side: "bottom", at: "50%" }],
    narrow: [{ side: "bottom", at: "50%" }],
  },
  checkpoints: {
    col: 5,
    row: 2,
    wide: [{ side: "left", at: "50%" }],
    narrow: [{ side: "bottom", at: "50%" }],
  },
  // The chunk goes from the server to the simulator ...
  server: {
    col: 4,
    row: 2,
    wide: [{ side: "left", at: "35%", long: true }],
    narrow: [{ side: "bottom", at: "30%", long: true }],
    edge: { label: "action chunk", className: "pl-edge-chunk" },
  },
  // ... the observations go the other way, and at the end the episode goes to the count.
  simulator: {
    col: 2,
    row: 2,
    wide: [
      { side: "right", at: "65%", long: true },
      { side: "left", at: "50%" },
    ],
    narrow: [
      { side: "top", at: "70%", long: true },
      { side: "bottom", at: "50%" },
    ],
    edge: { label: "observations", className: "pl-edge-obs" },
  },
  results: {
    col: 1,
    row: 2,
    wide: [{ side: "top", at: "24px", dashed: true }],
    narrow: [],
  },
};

/**
 * The script that runs each group of stations, as a bracket over the top row
 * and under the bottom one (wide layout only): the whole loop is three
 * commands. A bracket hangs from its first station, spans `span` stations and,
 * with `cross`, the spacer column between the second and the third.
 */
const BRACKETS: Partial<Record<StationId, { side: "top" | "bottom"; span: number; cross: 0 | 1; label: string }>> =
  {
    expert: { side: "top", span: 3, cross: 1, label: "make_dataset.sh" },
    training: { side: "top", span: 1, cross: 0, label: "train_resilient.sh" },
    results: { side: "bottom", span: 3, cross: 1, label: "eval.sh" },
    checkpoints: { side: "bottom", span: 1, cross: 0, label: "train_resilient.sh" },
  };

function ArrowMark({ arrow, layout }: { arrow: Arrow; layout: "wide" | "narrow" }) {
  const className = [
    "pl-arrow",
    `pl-${arrow.side}`,
    arrow.dashed ? "pl-dashed" : "",
    arrow.long ? "pl-long" : "",
    layout === "wide" ? "pl-wide-only" : "pl-narrow-only",
  ].join(" ");
  return <span aria-hidden="true" className={className} style={{ "--at": arrow.at } as CSSProperties} />;
}

export interface LoopProps {
  /** The station the item is at. */
  current: StationId;
  /** The item's name, on the token. */
  item: string;
  /**
   * Changes when the item should appear at its station instead of travelling
   * there along an arrow (a new layout, or a jump of more than one step).
   */
  tokenKey: string;
  /** Fade the item in where it appears (false while it travels, and under reduced motion). */
  fadeIn: boolean;
  /** Called when a station is clicked, or reached with the arrow keys. */
  onSelect: (station: StationId) => void;
  /** The id of the panel that describes the current station. */
  controlsId: string;
  /** The id of the sentence that explains the arrow keys. */
  hintId: string;
}

/**
 * The eight stations as an ordered list of buttons, with the arrows between
 * them and the moving item. The list is one tab stop (a roving tabindex): Tab
 * lands on the station the item is at without changing anything; the arrow
 * keys, Home and End move to another station and select it.
 */
export function Loop({ current, item, tokenKey, fadeIn, onSelect, controlsId, hintId }: LoopProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const currentIndex = STATIONS.findIndex((station) => station.id === current);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = STATIONS.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = index === 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    onSelect(STATIONS[next].id);
    buttons.current[next]?.focus();
  };

  return (
    <>
      <ol className="pl-loop" aria-label="The stations of the loop">
        {STATIONS.map((station, index) => {
          const place = PLACEMENT[station.id];
          const here = index === currentIndex;
          const bracket = BRACKETS[station.id];
          return (
            <li
              key={station.id}
              className={`pl-station pl-at-${station.id}`}
              style={{ "--col": place.col, "--row": place.row } as CSSProperties}
            >
              <button
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                type="button"
                tabIndex={here ? 0 : -1}
                className={`pl-card ${station.kind === "file" ? "pl-file" : ""}`}
                aria-current={here ? "step" : undefined}
                // The card's own text runs together ("2Demonstrationsepisode_*.parquet"): name it in words.
                aria-label={`Station ${index + 1} of ${STATIONS.length}: ${station.name}, ${station.tag}${here ? `; the item is here: ${item}` : ""}`}
                aria-controls={controlsId}
                aria-describedby={hintId}
                onClick={() => onSelect(station.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span aria-hidden="true" className="pl-shape" />
                {station.kind === "file" ? <span aria-hidden="true" className="pl-fold" /> : null}
                <span className="pl-num">{index + 1}</span>
                <span className="pl-name">{station.name}</span>
                <span className="pl-tag">{station.tag}</span>
                <span className="pl-slot" aria-hidden="true">
                  {here ? (
                    <motion.span
                      layoutId={tokenKey}
                      layout="position"
                      initial={fadeIn ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      className="pl-token"
                      transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
                    >
                      {item}
                    </motion.span>
                  ) : null}
                </span>
              </button>
              {place.wide.map((arrow) => (
                <ArrowMark key={`w-${arrow.side}`} arrow={arrow} layout="wide" />
              ))}
              {place.narrow.map((arrow) => (
                <ArrowMark key={`n-${arrow.side}`} arrow={arrow} layout="narrow" />
              ))}
              {place.edge ? (
                <span aria-hidden="true" className={`pl-edge ${place.edge.className}`}>
                  {place.edge.label}
                </span>
              ) : null}
              {bracket ? (
                <span
                  aria-hidden="true"
                  className={`pl-bracket pl-bracket-${bracket.side}`}
                  style={{ "--span": bracket.span, "--cross": bracket.cross } as CSSProperties}
                >
                  <span className="pl-bracket-label">{bracket.label}</span>
                </span>
              ) : null}
              {station.id === "results" ? (
                <span aria-hidden="true" className="pl-return-label pl-wide-only">
                  change one thing, run the loop again
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p aria-hidden="true" className="pl-again pl-narrow-only">
        <span className="pl-again-mark" />
        Then change one thing and run the loop again.
      </p>
    </>
  );
}
