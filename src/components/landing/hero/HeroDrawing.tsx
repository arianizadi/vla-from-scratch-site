import { camera, chunking, type GraspRun } from "@/data/lab";
import {
  BASE,
  CELL,
  INSET,
  OBJECT_IDS,
  OBJECTS,
  TABLE,
  VIEW,
  insetPosition,
  objectLabel,
  toPath,
  type ObjectId,
  type Point,
  type Scene,
} from "./geometry";

const HALO = "stroke-surface [paint-order:stroke]";
const TEXT = "font-sans font-medium stretch-88";

/** Width of a token chip for a word set in 14-unit Plex Mono. */
const chipWidth = (word: string) => 16 + word.length * 8.4;

/** Outline of an object in plan: a square, a circle or a hexagon, sized by its half-width. */
function ObjectShape({ id, at, size, className }: { id: ObjectId; at: Point; size: number; className: string }) {
  const draw = { pathLength: 1, strokeDasharray: 1, "data-draw": "" };
  if (id === "cube") {
    return <rect x={at.x - size} y={at.y - size} width={size * 2} height={size * 2} className={className} {...draw} />;
  }
  if (id === "can") {
    return <circle cx={at.x} cy={at.y} r={size} className={className} {...draw} />;
  }
  const corners = Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index;
    return `${(at.x + size * Math.cos(angle)).toFixed(1)},${(at.y + size * Math.sin(angle)).toFixed(1)}`;
  });
  return <polygon points={corners.join(" ")} className={className} {...draw} />;
}

function Instruction({ words }: { words: string[] }) {
  const chips = words.map((word, index) => {
    const before = words.slice(0, index).reduce((total, earlier) => total + chipWidth(earlier) + 6, 0);
    return { word, x: TABLE.x + before, width: chipWidth(word) };
  });
  return (
    <g>
      <text x={TABLE.x} y={30} fontSize={14} className={`${TEXT} hp-label fill-ink-faint`}>
        Instruction, as tokens
      </text>
      {chips.map(({ word, x, width }, index) => (
        <g key={`${index}-${word}`} className="hp-chip">
          <rect x={x} y={40} width={width} height={28} rx={2} className="fill-surface stroke-language" strokeWidth={1.5} />
          <text x={x + width / 2} y={59} fontSize={14} textAnchor="middle" className="fill-ink font-mono">
            {word}
          </text>
        </g>
      ))}
    </g>
  );
}

function Table({ target }: { target: ObjectId }) {
  return (
    <g>
      <rect
        x={TABLE.x}
        y={TABLE.y}
        width={TABLE.width}
        height={TABLE.height}
        className="fill-none stroke-line-strong"
        strokeWidth={1.5}
        pathLength={1}
        strokeDasharray={1}
        data-draw=""
      />
      <circle
        cx={BASE.x}
        cy={BASE.y}
        r={14}
        className="fill-surface stroke-ink"
        strokeWidth={1.5}
        pathLength={1}
        strokeDasharray={1}
        data-draw=""
      />
      <path d={`M${BASE.x - 6} ${BASE.y}h12M${BASE.x} ${BASE.y - 6}v12`} className="hp-label fill-none stroke-ink" strokeWidth={1.5} />
      {OBJECT_IDS.map((id) => (
        <ObjectShape key={id} id={id} at={OBJECTS[id].center} size={OBJECTS[id].radius} className="fill-surface stroke-ink" />
      ))}
      <g className="hp-label">
        <text x={TABLE.x + 10} y={TABLE.y + 22} fontSize={14} className={`${TEXT} fill-ink-faint`}>
          Table, plan view
        </text>
        <text x={BASE.x + 24} y={BASE.y + 5} fontSize={14} className={`${TEXT} fill-ink-faint ${HALO}`} strokeWidth={4}>
          Robot base
        </text>
        {OBJECT_IDS.map((id) => {
          const spot = objectLabel(id);
          return (
            <text
              key={id}
              x={spot.at.x}
              y={spot.at.y}
              fontSize={14}
              textAnchor={spot.anchor}
              strokeWidth={4}
              className={`${TEXT} ${HALO} ${id === target ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              {OBJECTS[id].label}
            </text>
          );
        })}
      </g>
    </g>
  );
}

function Camera({ scene }: { scene: Scene }) {
  const lines = Array.from({ length: camera.grid + 1 }, (_, index) => index * CELL);
  return (
    <g>
      <text x={INSET.x} y={INSET.y - 10} fontSize={14} className={`${TEXT} hp-label fill-ink-faint`}>
        Front camera, {camera.pixels} px
      </text>
      <rect
        x={INSET.x}
        y={INSET.y}
        width={INSET.size}
        height={INSET.size}
        className="fill-surface stroke-line-strong"
        strokeWidth={1.5}
        pathLength={1}
        strokeDasharray={1}
        data-draw=""
      />
      {scene.marked.map(([column, row]) => (
        <rect
          key={`${column}-${row}`}
          x={INSET.x + column * CELL}
          y={INSET.y + row * CELL}
          width={CELL}
          height={CELL}
          className="hp-mark fill-mark stroke-ink"
          strokeWidth={1}
        />
      ))}
      <g className="stroke-vision" strokeWidth={1}>
        {lines.map((offset) => (
          <line key={`h${offset}`} className="hp-gridline" x1={INSET.x} x2={INSET.x + INSET.size} y1={INSET.y + offset} y2={INSET.y + offset} />
        ))}
        {lines.map((offset) => (
          <line key={`v${offset}`} className="hp-gridline" x1={INSET.x + offset} x2={INSET.x + offset} y1={INSET.y} y2={INSET.y + INSET.size} />
        ))}
      </g>
      {OBJECT_IDS.map((id) => (
        <ObjectShape
          key={id}
          id={id}
          at={insetPosition(OBJECTS[id].center)}
          size={Math.round(OBJECTS[id].radius * 0.42)}
          className="fill-none stroke-ink"
        />
      ))}
      <text x={INSET.x} y={INSET.y + INSET.size + 20} fontSize={14} className={`${TEXT} hp-label fill-ink-faint`}>
        {camera.grid} x {camera.grid} patches, {camera.patch} px each
      </text>
    </g>
  );
}

function Actions({ scene }: { scene: Scene }) {
  const executedFirst = scene.firstChunk.slice(0, chunking.executed);
  const discarded = scene.firstChunk.slice(chunking.executed);
  const replanFrom = executedFirst[executedFirst.length - 1];
  return (
    <g>
      <polyline
        points={toPath([replanFrom, ...discarded])}
        className="hp-tail fill-none stroke-action"
        strokeWidth={1.5}
        strokeDasharray="3 4"
      />
      <polyline
        points={toPath(executedFirst)}
        className="hp-segment-1 fill-none stroke-action"
        strokeWidth={2}
        pathLength={1}
        strokeDasharray={1}
      />
      <polyline
        points={toPath([replanFrom, ...scene.secondChunk])}
        className="hp-segment-2 fill-none stroke-action"
        strokeWidth={2}
        pathLength={1}
        strokeDasharray={1}
      />
      {scene.firstChunk.map((at, index) =>
        index < chunking.executed ? (
          <circle key={index} cx={at.x} cy={at.y} r={4} className="hp-first hp-executed-1 fill-action stroke-action" strokeWidth={1.5} />
        ) : (
          <circle key={index} cx={at.x} cy={at.y} r={3.5} className="hp-first fill-surface stroke-action" strokeWidth={1.5} strokeDasharray="2 2" />
        ),
      )}
      {scene.secondChunk.map((at, index) => (
        <circle key={index} cx={at.x} cy={at.y} r={4} className="hp-second fill-action stroke-action" strokeWidth={1.5} />
      ))}
    </g>
  );
}

function Gripper({ scene, closedGap }: { scene: Scene; closedGap: number }) {
  return (
    <g transform={`translate(${scene.close.x} ${scene.close.y})`}>
      <g className="hp-gripper">
        <path d="M-30 -15H30" className="fill-none stroke-ink" strokeWidth={2} />
        <rect x={-closedGap - 5} y={-15} width={5} height={28} className="hp-jaw-left fill-ink" />
        <rect x={closedGap} y={-15} width={5} height={28} className="hp-jaw-right fill-ink" />
      </g>
    </g>
  );
}

function Miss({ scene, run }: { scene: Scene; run: GraspRun }) {
  const object = OBJECTS[scene.target];
  const { at, anchor } = scene.missLabel;
  return (
    <g className="hp-result">
      {scene.showsMissLine ? (
        <g className="fill-ink-faint stroke-ink-faint">
          <line x1={object.center.x} y1={object.center.y} x2={scene.close.x} y2={scene.close.y} strokeWidth={1} />
          <circle cx={object.center.x} cy={object.center.y} r={3} stroke="none" />
          <circle cx={scene.close.x} cy={scene.close.y} r={3} stroke="none" />
        </g>
      ) : null}
      <text x={at.x} y={at.y} fontSize={14} textAnchor={anchor} strokeWidth={5} className={`${TEXT} ${HALO} fill-ink-muted`}>
        <tspan className="fill-ink font-semibold">{run.medianMissMm} mm</tspan> miss
      </text>
    </g>
  );
}

/** The drawing's title block: what was run and what it scored. */
function TitleBlock({ run }: { run: GraspRun }) {
  const x = INSET.x;
  const top = 386;
  const rowHeight = 43;
  const rows = [
    { label: "Policy", value: run.label },
    { label: "Median miss to the named object", value: `${run.medianMissMm} mm` },
    { label: "Closed-loop success", value: `${run.successes} of ${run.episodes} episodes` },
  ];
  return (
    <g>
      <g className="hp-label">
        <circle cx={x + 6} cy={339} r={4} className="fill-action stroke-action" strokeWidth={1.5} />
        <text x={x + 20} y={344} fontSize={14} className={`${TEXT} fill-ink-muted`}>
          {chunking.executed} actions executed
        </text>
        <circle cx={x + 6} cy={361} r={3.5} className="fill-surface stroke-action" strokeWidth={1.5} strokeDasharray="2 2" />
        <text x={x + 20} y={366} fontSize={14} className={`${TEXT} fill-ink-muted`}>
          {chunking.predicted - chunking.executed} predicted, discarded
        </text>
      </g>
      <rect
        x={x}
        y={top}
        width={INSET.size}
        height={rowHeight * rows.length + 1}
        className="fill-surface stroke-line-strong"
        strokeWidth={1.5}
        pathLength={1}
        strokeDasharray={1}
        data-draw=""
      />
      {rows.map((row, index) => (
        <g key={row.label} className={index === 0 ? "hp-label" : "hp-result"}>
          {index > 0 ? (
            <line x1={x} x2={x + INSET.size} y1={top + rowHeight * index} y2={top + rowHeight * index} className="stroke-line" strokeWidth={1} />
          ) : null}
          <text x={x + 10} y={top + rowHeight * index + 17} fontSize={12} className={`${TEXT} fill-ink-faint`}>
            {row.label}
          </text>
          <text x={x + 10} y={top + rowHeight * index + 35} fontSize={14} className={`${TEXT} fill-ink font-semibold`}>
            {row.value}
          </text>
        </g>
      ))}
    </g>
  );
}

interface HeroDrawingProps {
  scene: Scene;
  run: GraspRun;
  /** Half the gap between the jaws once they have closed. */
  closedGap: number;
  description: string;
}

/**
 * One control cycle, drawn in plan, in its finished state. The class names
 * starting with "hp-" are the handles the timeline in HeroPlate animates.
 */
export function HeroDrawing({ scene, run, closedGap, description }: HeroDrawingProps) {
  return (
    <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} className="hero-drawing" role="img" aria-label={description}>
      <Instruction words={scene.words} />
      <Table target={scene.target} />
      <Camera scene={scene} />
      <Actions scene={scene} />
      <Miss scene={scene} run={run} />
      <Gripper scene={scene} closedGap={closedGap} />
      <TitleBlock run={run} />
    </svg>
  );
}
