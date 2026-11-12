"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadGrasp } from "@/data/files";
import type { ObjectId, Weights } from "@/data/types";
import {
  FigureFrame,
  Marker,
  PlayButton,
  Segmented,
  useElementSize,
  useInView,
  usePageVisible,
  useReducedMotion,
} from "@/figures/kit";
import type { HeroData, HeroObject, HeroStage } from "./onset-data";

/** The part of a per-episode record the plate draws (src/data/files.ts has the whole shape). */
interface Episode {
  seed: number;
  target: ObjectId;
  tcp: [number, number] | null;
  objects: Partial<Record<ObjectId, [number, number]>>;
}

type Loaded = { status: "loading" } | { status: "ready"; files: Map<string, Episode[]> } | { status: "error" };

/** How long each training stage stays on screen while the plate plays. */
const HOLD_MS = 1800;
const EASE = [0.2, 0, 0, 1] as const;
const VIEWS: { value: HeroView; label: string }[] = [
  { value: "relative", label: "Around the named object" },
  { value: "table", label: "On the table" },
];
const DEFAULT_WIDTH = 640;
const PAD = 14;
/** Room under the plan for the scale bar and the robot's side. */
const FOOT = 30;
/** Height of the relative view's plan per unit of width, when its reach away from the robot sets the scale. */
const RELATIVE_REACH = 0.36;
const RELATIVE_HEIGHT = 2 * RELATIVE_REACH;
/** Length of the scale bar: a drawing aid, not a measurement. */
const SCALE_BAR_CM = 10;
/** Radius of the ring around the named object in the relative view: a drawing aid. */
const RING_CM = 1;

/**
 * The per-episode files of the stages, through the data module's loader (one
 * request per file for the life of the page, shared with the figures), once
 * the plate has mounted.
 */
function useEpisodes(ids: string[]): Loaded {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const key = ids.join(" ");
  useEffect(() => {
    let current = true;
    const list = key.split(" ").filter(Boolean);
    Promise.all(list.map((id) => loadGrasp(id))).then(
      (files) => {
        if (current) {
          setLoaded({
            status: "ready",
            files: new Map(list.map((id, index) => [id, files[index].episodes as unknown as Episode[]])),
          });
        }
      },
      () => {
        if (current) setLoaded({ status: "error" });
      },
    );
    return () => {
      current = false;
    };
  }, [key]);
  return loaded;
}

/** "relative": every closing point drawn from its named object, which sits at the centre; "table": both where they were. */
export type HeroView = "relative" | "table";

interface Placed {
  close: { x: number; y: number };
  object: { x: number; y: number };
}

interface Frame {
  width: number;
  height: number;
  /** Drawing units per metre, the same on both axes. */
  scale: number;
  /** Where an episode's closing point and named object go, robot side at the bottom. */
  place: (episode: Episode) => Placed | null;
  /** The named object's place in the relative view. */
  centre: { x: number; y: number } | null;
}

/** The named object's position and the closing point of an episode, in the table's frame (x away from the robot, y to its left). */
function pointsOf(episode: Episode): { tcp: [number, number]; object: [number, number] } | null {
  const object = episode.objects[episode.target];
  return episode.tcp && object ? { tcp: episode.tcp, object } : null;
}

/** A frame that holds every episode of every file, so a change of step moves the dots and never the frame. */
function frameFor(files: Map<string, Episode[]>, width: number, view: HeroView): Frame | null {
  const all = [...files.values()].flat().map(pointsOf).filter((entry) => entry !== null);
  if (all.length === 0) return null;

  if (view === "relative") {
    // Half-extents of the offsets, away from the robot (x) and sideways (y).
    const reachX = Math.max(...all.map(({ tcp, object }) => Math.abs(tcp[0] - object[0])));
    const reachY = Math.max(...all.map(({ tcp, object }) => Math.abs(tcp[1] - object[1])));
    if (reachX === 0 || reachY === 0) return null;
    const scale = Math.min((width / 2 - PAD) / reachY, (width * RELATIVE_REACH - PAD) / reachX);
    const height = Math.round(2 * reachX * scale + 2 * PAD + FOOT);
    const centre = { x: width / 2, y: PAD + reachX * scale };
    return {
      width,
      height,
      scale,
      centre,
      place: (episode) => {
        const points = pointsOf(episode);
        if (!points) return null;
        return {
          close: {
            x: centre.x - (points.tcp[1] - points.object[1]) * scale,
            y: centre.y - (points.tcp[0] - points.object[0]) * scale,
          },
          object: centre,
        };
      },
    };
  }

  const xs = all.flatMap(({ tcp, object }) => [tcp[0], object[0]]);
  const ys = all.flatMap(({ tcp, object }) => [tcp[1], object[1]]);
  const xMax = Math.max(...xs);
  const xMin = Math.min(...xs);
  const yMax = Math.max(...ys);
  const yMin = Math.min(...ys);
  if (xMax === xMin || yMax === yMin) return null;
  const scale = (width - 2 * PAD) / (yMax - yMin);
  const height = Math.round((xMax - xMin) * scale + 2 * PAD + FOOT);
  const at = ([x, y]: readonly [number, number]) => ({ x: PAD + (yMax - y) * scale, y: PAD + (xMax - x) * scale });
  return {
    width,
    height,
    scale,
    centre: null,
    place: (episode) => {
      const points = pointsOf(episode);
      return points ? { close: at(points.tcp), object: at(points.object) } : null;
    },
  };
}

function Legend({ objects, view }: { objects: HeroObject[]; view: HeroView }) {
  return (
    <ul aria-label="Legend" className="fig-legend">
      <li>
        <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">
          <circle r={3.5} className="fill-ink" />
        </svg>
        Where the gripper first closed
      </li>
      {view === "relative" ? (
        <li>
          <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">
            <path d="M-6 0H6M0 -6V6" className="stroke-ink" strokeWidth={1.5} />
          </svg>
          The named object, for every episode
        </li>
      ) : null}
      {view === "relative" ? (
        <li>
          <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">
            <circle r={5.5} className="fill-none stroke-line-strong" strokeWidth={1} strokeDasharray="3 3" />
          </svg>
          {RING_CM} cm around it
        </li>
      ) : null}
      {(view === "table" ? objects : []).map((object) => (
        <li key={object.id}>
          <svg width={14} height={14} viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">
            <Marker shape={object.shape} x={0} y={0} size={9} color={object.color} hollow />
          </svg>
          {object.short}, when named
        </li>
      ))}
    </ul>
  );
}

function Plan({
  frame,
  episodes,
  objects,
  instant,
  label,
}: {
  frame: Frame;
  episodes: Episode[];
  objects: HeroObject[];
  instant: boolean;
  label: string;
}) {
  const transition = instant ? { duration: 0 } : { duration: 0.6, ease: EASE };
  const style = new Map(objects.map((object) => [object.id, object]));
  const drawn = episodes.flatMap((episode) => {
    const placed = frame.place(episode);
    const look = style.get(episode.target);
    return placed && look ? [{ seed: episode.seed, ...placed, look }] : [];
  });
  const centre = frame.centre;
  const ring = (RING_CM / 100) * frame.scale;
  const bar = (SCALE_BAR_CM / 100) * frame.scale;
  const foot = frame.height - FOOT / 2 + 4;

  return (
    <svg
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      width={frame.width}
      height={frame.height}
      role="img"
      aria-label={label}
      className="block h-auto max-w-full"
    >
      {centre ? (
        <g>
          <circle cx={centre.x} cy={centre.y} r={ring} className="fill-none stroke-line-strong" strokeWidth={1} strokeDasharray="3 3" />
          <path
            d={`M${centre.x - 9} ${centre.y}H${centre.x + 9}M${centre.x} ${centre.y - 9}V${centre.y + 9}`}
            className="stroke-ink"
            strokeWidth={1.5}
          />
        </g>
      ) : null}
      <g className="stroke-line-strong" strokeWidth={1}>
        {(centre ? [] : drawn).map(({ seed, close, object }) => (
          <motion.line
            key={seed}
            initial={false}
            animate={{ x1: close.x, y1: close.y, x2: object.x, y2: object.y }}
            transition={transition}
          />
        ))}
      </g>
      {(centre ? [] : drawn).map(({ seed, object, look }) => (
        <motion.g key={seed} initial={false} animate={{ x: object.x, y: object.y }} transition={transition}>
          <Marker shape={look.shape} x={0} y={0} size={9} color={look.color} hollow />
        </motion.g>
      ))}
      {drawn.map(({ seed, close }) => (
        <motion.circle
          key={seed}
          r={3.5}
          className="fill-ink stroke-surface"
          strokeWidth={1}
          initial={false}
          animate={{ cx: close.x, cy: close.y }}
          transition={transition}
        />
      ))}
      <g className="fill-ink-faint" fontSize={13}>
        <line x1={PAD} x2={PAD + bar} y1={foot - 4} y2={foot - 4} className="stroke-ink-faint" strokeWidth={1} />
        <line x1={PAD} x2={PAD} y1={foot - 8} y2={foot} className="stroke-ink-faint" strokeWidth={1} />
        <line x1={PAD + bar} x2={PAD + bar} y1={foot - 8} y2={foot} className="stroke-ink-faint" strokeWidth={1} />
        <text x={PAD + bar + 6} y={foot} className="font-sans stretch-88">
          {SCALE_BAR_CM} cm
        </text>
        <text x={frame.width - PAD} y={foot} textAnchor="end" className="font-sans stretch-88">
          Robot side of the table
        </text>
      </g>
    </svg>
  );
}

function Readout({ rows, current }: { rows: HeroStage[]; current: string }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[300px] border-collapse text-left text-14 stretch-88 tabular-nums">
        <caption className="sr-only">The evaluations drawn above, one row per step</caption>
        <thead>
          <tr className="border-b border-line-strong text-13 text-ink-muted">
            <th scope="col" className="py-1.5 pr-2 font-semibold">
              Training
            </th>
            <th scope="col" className="px-2 py-1.5 text-right font-semibold">
              Success
            </th>
            <th scope="col" className="px-2 py-1.5 text-right font-semibold">
              At named object
            </th>
            <th scope="col" className="px-2 py-1.5 text-right font-semibold">
              Slope
            </th>
            <th scope="col" className="py-1.5 pl-2 text-right font-semibold">
              Median miss
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = row.key === current;
            return (
              <tr
                key={row.key}
                aria-current={selected ? "true" : undefined}
                className={`border-b border-line ${selected ? "bg-accent-soft" : ""} ${row.isExpert ? "text-ink-muted" : ""}`}
              >
                <th
                  scope="row"
                  className={`py-1.5 pr-2 font-medium ${selected ? "shadow-[inset_2px_0_0_var(--accent)]" : ""} pl-2`}
                >
                  {row.short}
                </th>
                <td className="px-2 py-1.5 text-right">{row.cells.success}</td>
                <td className="px-2 py-1.5 text-right">{row.cells.named}</td>
                <td className="px-2 py-1.5 text-right">{row.cells.slope}</td>
                <td className="py-1.5 pl-2 text-right">{row.cells.miss}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The hero: one policy at several points of its training, and the scripted
 * expert, drawn as where the gripper first closed in every evaluation episode,
 * each joined to the object the instruction named. With motion allowed it
 * steps through training once when it arrives; with reduced motion it shows
 * the last checkpoint and every step is one click away.
 */
export function OnsetPlate({ data, caption, note }: { data: HeroData; caption: ReactNode; note: ReactNode }) {
  const [weights, setWeights] = useState<Weights | undefined>(data.weights[0]?.value);
  const [chosen, setChosen] = useState(0);
  const [touched, setTouched] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [autoplayed, setAutoplayed] = useState(false);
  const [view, setView] = useState<HeroView>("relative");

  const stageRef = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(stageRef);
  const arrived = useInView(stageRef, { amount: 0.6, once: true });
  const onScreen = useInView(stageRef, { amount: 0.25 });
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion();

  const policy = useMemo(() => (weights ? (data.stages[weights] ?? []) : []), [data.stages, weights]);
  const steps = useMemo(() => (data.expert ? [...policy, data.expert] : policy), [policy, data.expert]);
  const lastPolicy = Math.max(0, policy.length - 1);
  // Reduced motion shows the finished state until the reader picks a step.
  const index = Math.min(touched || !reduced ? chosen : lastPolicy, Math.max(0, steps.length - 1));
  const stage = steps[index];

  const ids = useMemo(
    () => [
      ...new Set([...Object.values(data.stages).flatMap((list) => (list ?? []).map((entry) => entry.key)), data.expert?.key ?? ""]),
    ].filter(Boolean),
    [data.stages, data.expert],
  );
  const loaded = useEpisodes(ids);

  // Autoplay once: when the plate has been 60% on screen for 400 ms and the episodes are in.
  useEffect(() => {
    if (autoplayed || touched || reduced || !arrived || loaded.status !== "ready" || policy.length < 2) return;
    const timer = setTimeout(() => {
      setAutoplayed(true);
      setPlaying(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [autoplayed, touched, reduced, arrived, loaded.status, policy.length]);

  // Playing: hold each step, then move to the next, up to the last checkpoint. Off screen or in a hidden tab, wait.
  useEffect(() => {
    if (!playing || !onScreen || !pageVisible) return;
    const timer = setTimeout(() => {
      if (chosen >= lastPolicy) setPlaying(false);
      else setChosen(chosen + 1);
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [playing, onScreen, pageVisible, chosen, lastPolicy]);

  const choose = (key: string) => {
    const next = steps.findIndex((entry) => entry.key === key);
    if (next < 0) return;
    setTouched(true);
    setPlaying(false);
    setChosen(next);
  };

  /** The reader took over: keep the step on screen and stop the autoplay from starting. */
  const touch = () => {
    setTouched(true);
    setChosen(index);
  };

  const togglePlay = () => {
    touch();
    if (playing) {
      setPlaying(false);
      return;
    }
    if (index >= lastPolicy) setChosen(0);
    setPlaying(true);
  };

  const width = measured || DEFAULT_WIDTH;
  const frame = loaded.status === "ready" ? frameFor(loaded.files, width, view) : null;
  const episodes = loaded.status === "ready" && stage ? (loaded.files.get(stage.key) ?? []) : [];
  const label = stage
    ? view === "relative"
      ? `Seen from above, the ${episodes.length} evaluation episodes drawn around one point, the object the instruction named; each dot is where the gripper first closed, relative to that object. ${stage.summary}`
      : `Plan of the table, seen from above: for each of the ${episodes.length} evaluation episodes, a dot where the gripper first closed and a line to the object the instruction named. ${stage.summary}`
    : "";

  if (!stage || !weights) {
    return null;
  }

  return (
    <FigureFrame
      title="Where the gripper closed, as the policy trained"
      stamp="measured"
      caption={caption}
      note={note}
      status={stage.summary}
      controls={
        <>
          <Segmented
            label="Checkpoint"
            showLabel
            options={steps.map((entry) => ({ value: entry.key, label: entry.short }))}
            value={stage.key}
            onChange={choose}
          />
          {data.weights.length > 1 ? (
            <Segmented
              label="Weights"
              showLabel
              options={data.weights}
              value={weights}
              onChange={(value) => {
                touch();
                setWeights(value);
              }}
            />
          ) : null}
          <Segmented
            label="View"
            showLabel
            options={VIEWS}
            value={view}
            onChange={(value) => {
              touch();
              setView(value);
            }}
          />
          {policy.length > 1 ? (
            <PlayButton
              playing={playing}
              ended={!playing && index >= lastPolicy}
              onToggle={togglePlay}
              className="motion-reduce:hidden"
            />
          ) : null}
        </>
      }
    >
      <Legend objects={data.objects} view={view} />
      <div ref={stageRef} className="mt-3 min-h-[160px] [container-type:inline-size]">
        {frame ? (
          <Plan frame={frame} episodes={episodes} objects={data.objects} instant={reduced} label={label} />
        ) : (
          // Holds the height the plan will take in its first view (about 0.72 of the width plus the
          // scale bar), so the page below does not jump when the episodes arrive.
          <p
            className="flex min-h-[160px] items-center justify-center text-14 text-ink-muted"
            style={{ height: view === "relative" ? `calc(${RELATIVE_HEIGHT * 100}cqw + ${FOOT}px)` : undefined }}
          >
            {loaded.status === "error"
              ? "The episodes could not be loaded. The table below has the numbers."
              : "Loading the episodes."}
          </p>
        )}
      </div>
      <Readout rows={steps} current={stage.key} />
    </FigureFrame>
  );
}
