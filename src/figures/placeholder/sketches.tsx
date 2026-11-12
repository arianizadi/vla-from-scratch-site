import type { CSSProperties, ReactNode } from "react";
import type { FigureId } from "../catalog";

/**
 * One small sketch per figure, hinting at what kind of figure it will be. All
 * are drawn in a 480 x 180 box with the line styles of placeholder.css, and
 * each plays one short movement when it arrives on screen (see that file).
 *
 * A sketch is decoration: the words next to it say what the figure will show.
 */

/** Custom properties read by the animations: start offset, delay, duration, easing. */
function vars(values: Record<string, string | number>): CSSProperties {
  return values as CSSProperties;
}

const px = (value: number) => `${value}px`;
const seconds = (value: number) => `${value.toFixed(2)}s`;

/** A small arrowhead pointing right, its tip at (x, y). */
function ArrowHead({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return <path d="M-6,-3.5L0,0L-6,3.5" className="sk-line" transform={`translate(${x},${y}) rotate(${rotate})`} />;
}

/** pipeline: seven stages in a row, a token passing through them, a loop at the end. */
function Pipeline() {
  const stages = Array.from({ length: 7 }, (_, index) => 14 + index * 66);
  return (
    <>
      {stages.map((x, index) => (
        <g key={x}>
          <rect x={x} y={72} width={52} height={36} rx={2} className={index === 6 ? "sk-phantom" : "sk-block"} />
          {index < 6 ? (
            <>
              <line x1={x + 52} x2={x + 66} y1={90} y2={90} className="sk-line" />
              <ArrowHead x={x + 66} y={90} />
            </>
          ) : null}
        </g>
      ))}
      {/* policy server and simulator talk in a loop */}
      <path d="M370,72V52H304V72" className="sk-phantom" />
      <ArrowHead x={304} y={72} rotate={90} />
      <rect
        x={428}
        y={83}
        width={14}
        height={14}
        className="sk-mark sk-move"
        style={vars({ "--fx": px(-396), "--t": "3.6s", "--ease": "steps(6, jump-none)" })}
      />
    </>
  );
}

/** tokenizer: a sentence, then the same span as chips of unequal width, each with an id. */
function Tokenizer() {
  const widths = [44, 30, 58, 36, 50, 28, 64, 40];
  let x = 44;
  const chips = widths.map((width) => {
    const chip = { x, width };
    x += width + 6;
    return chip;
  });
  return (
    <>
      <rect x={44} y={26} width={392} height={26} rx={2} className="sk-phantom" />
      {chips.map((chip, index) => (
        <g key={chip.x} className="sk-appear" style={vars({ "--d": seconds(0.2 + index * 0.16) })}>
          <line x1={chip.x + chip.width / 2} x2={chip.x + chip.width / 2} y1={52} y2={78} className="sk-faint" />
          <rect x={chip.x} y={78} width={chip.width} height={26} rx={2} className={index === 2 ? "sk-mark" : "sk-block"} />
          <line
            x1={chip.x + chip.width / 2 - 9}
            x2={chip.x + chip.width / 2 + 9}
            y1={122}
            y2={122}
            className="sk-strong"
          />
        </g>
      ))}
    </>
  );
}

/** padding-shift: three rows padded to one length; the appended token lands after the padding. */
function PaddingShift() {
  const lengths = [8, 5, 3];
  const cell = 40;
  return (
    <>
      {lengths.map((length, row) => (
        <g key={length} transform={`translate(42,${34 + row * 40})`}>
          {Array.from({ length: 8 }, (_, column) => (
            <rect
              key={column}
              x={column * cell}
              width={34}
              height={26}
              rx={2}
              className={column < length ? "sk-block" : "sk-phantom"}
            />
          ))}
          <rect
            x={8 * cell}
            width={34}
            height={26}
            rx={2}
            className="sk-mark sk-move"
            style={vars({ "--fx": px(-(8 - length) * cell), "--t": "1.2s", "--d": seconds(0.4 + row * 0.5) })}
          />
        </g>
      ))}
    </>
  );
}

/** attention: a lower-triangular matrix of weights; the future is masked. */
function Attention() {
  const size = 8;
  const step = 20;
  return (
    <g transform="translate(160,10)">
      {Array.from({ length: size * size }, (_, index) => {
        const row = Math.floor(index / size);
        const column = index % size;
        const masked = column > row;
        const level = masked ? 0 : 1 + ((row * 3 + column * 5 + (row === column ? 2 : 0)) % 5);
        return (
          <rect
            key={index}
            x={column * step}
            y={row * step}
            width={18}
            height={18}
            className={masked ? "sk-faint" : `sk-seq-${level}`}
          />
        );
      })}
      <rect
        x={-3}
        y={7 * step - 3}
        width={size * step + 4}
        height={24}
        className="sk-outline sk-move"
        style={vars({ "--fy": px(-7 * step), "--t": "3.2s", "--ease": "steps(8, jump-none)" })}
      />
    </g>
  );
}

/** rotary: a query and a key turn together; the angle between them stays the same. */
function Rotary() {
  const centre = { x: 240, y: 90 };
  const radius = 68;
  const at = (degrees: number, r = radius) => {
    const angle = (degrees * Math.PI) / 180;
    return { x: Number((centre.x + r * Math.cos(angle)).toFixed(1)), y: Number((centre.y - r * Math.sin(angle)).toFixed(1)) };
  };
  const xy = (point: { x: number; y: number }) => `${point.x},${point.y}`;
  const query = at(50);
  const key = at(90);
  return (
    <>
      <circle cx={centre.x} cy={centre.y} r={radius} className="sk-faint" />
      <line x1={centre.x - 84} x2={centre.x + 84} y1={centre.y} y2={centre.y} className="sk-faint" />
      <line x1={centre.x} x2={centre.x} y1={centre.y - 84} y2={centre.y + 84} className="sk-faint" />
      {/* where the pair started */}
      <path d={`M${xy(at(-20))}L${xy(centre)}L${xy(at(20))}`} className="sk-phantom" />
      <g className="sk-turn" style={vars({ "--ox": px(centre.x), "--oy": px(centre.y), "--from": "70deg", "--t": "2.8s" })}>
        <path d={`M${xy(centre)}L${xy(at(50, 30))}A30,30 0 0 0 ${xy(at(90, 30))}Z`} className="sk-mark" />
        <path d={`M${xy(query)}L${xy(centre)}L${xy(key)}`} className="sk-strong" />
        <circle cx={query.x} cy={query.y} r={4} className="sk-dot" />
        <circle cx={key.x} cy={key.y} r={4} className="sk-dot" />
      </g>
    </>
  );
}

/** training-step: forward, loss, backward, update, round and round. */
function TrainingStep() {
  const left = 110;
  const right = 300;
  const top = 34;
  const bottom = 112;
  const box = { width: 70, height: 34 };
  return (
    <>
      <path d={`M${left + box.width},${top + 17}H${right}`} className="sk-line" />
      <ArrowHead x={right} y={top + 17} />
      <path d={`M${right + 35},${top + box.height}V${bottom}`} className="sk-line" />
      <ArrowHead x={right + 35} y={bottom} rotate={90} />
      <path d={`M${right},${bottom + 17}H${left + box.width}`} className="sk-line" />
      <ArrowHead x={left + box.width} y={bottom + 17} rotate={180} />
      <path d={`M${left + 35},${bottom}V${top + box.height}`} className="sk-phantom" />
      <ArrowHead x={left + 35} y={top + box.height} rotate={-90} />
      {[
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={box.width} height={box.height} rx={2} className="sk-block" />
      ))}
      <rect
        x={left + 28}
        y={top + 10}
        width={14}
        height={14}
        className="sk-mark sk-circuit"
        style={vars({ "--w": px(right - left), "--h": px(bottom - top), "--t": "4.4s", "--d": "0.3s" })}
      />
    </>
  );
}

/** loss-vs-success: the loss falls early; success arrives late. Two panels, one time axis. */
function LossVsSuccess() {
  const xs = [96, 160, 224, 288, 352, 416];
  const success = [0, 0, 4, 6, 20, 46];
  return (
    <>
      <path d="M60,12V80H440" className="sk-line" />
      <path
        d="M64,18C84,56 110,64 150,68S260,73 300,74S400,75 436,75"
        className="sk-strong sk-draw"
        pathLength={1}
        style={vars({ "--t": "2.4s" })}
      />
      <path d="M60,100V166H440" className="sk-line" />
      <line x1={60} x2={440} y1={112} y2={112} className="sk-phantom" />
      {xs.map((x, index) => (
        <g key={x} className="sk-appear" style={vars({ "--d": seconds(0.5 + index * 0.36) })}>
          <line x1={x} x2={x} y1={166} y2={162 - success[index]} className="sk-faint" />
          <circle cx={x} cy={162 - success[index]} r={4.5} className="sk-dot" />
        </g>
      ))}
    </>
  );
}

/** patchify: a frame cut into a grid; each patch becomes one token in a row. */
function Patchify() {
  const grid = 6;
  const cell = 22;
  const origin = { x: 40, y: 24 };
  const tokens = Array.from({ length: grid * grid }, (_, index) => index);
  return (
    <>
      <rect x={origin.x} y={origin.y} width={grid * cell} height={grid * cell} className="sk-line" />
      {Array.from({ length: grid - 1 }, (_, index) => (
        <g key={index}>
          <line
            x1={origin.x + (index + 1) * cell}
            x2={origin.x + (index + 1) * cell}
            y1={origin.y}
            y2={origin.y + grid * cell}
            className="sk-faint"
          />
          <line
            x1={origin.x}
            x2={origin.x + grid * cell}
            y1={origin.y + (index + 1) * cell}
            y2={origin.y + (index + 1) * cell}
            className="sk-faint"
          />
        </g>
      ))}
      {/* the object: about one patch wide */}
      <rect x={origin.x + 3 * cell} y={origin.y + 2 * cell} width={cell} height={cell} className="sk-mark" />
      <circle cx={origin.x + 3.5 * cell} cy={origin.y + 2.5 * cell} r={8} className="sk-outline" />
      <line x1={184} x2={214} y1={90} y2={90} className="sk-line" />
      <ArrowHead x={214} y={90} />
      {tokens.map((index) => {
        const column = index % 12;
        const row = Math.floor(index / 12);
        return (
          <rect
            key={index}
            x={230 + column * 18}
            y={64 + row * 18}
            width={13}
            height={13}
            rx={1}
            className={`${index === 15 ? "sk-mark" : "sk-block"} sk-appear`}
            style={vars({ "--d": seconds(0.3 + index * 0.05) })}
          />
        );
      })}
    </>
  );
}

/** pooled-vs-tokens: sixteen patches squeezed into one vector, or all sixteen handed on. */
function PooledVsTokens() {
  const patches = (x: number) =>
    Array.from({ length: 16 }, (_, index) => (
      <rect
        key={index}
        x={x + (index % 4) * 16}
        y={58 + Math.floor(index / 4) * 16}
        width={12}
        height={12}
        rx={1}
        className="sk-block"
      />
    ));
  const rows = [64, 80, 96, 112];
  return (
    <>
      {patches(24)}
      {rows.map((y, index) => (
        <path
          key={y}
          d={`M88,${y}L138,90`}
          className="sk-line sk-draw"
          pathLength={1}
          style={vars({ "--t": "0.8s", "--d": seconds(0.2 + index * 0.12) })}
        />
      ))}
      <circle cx={146} cy={90} r={8} className="sk-mark" />
      <line x1={154} x2={178} y1={90} y2={90} className="sk-line" />
      <rect x={178} y={66} width={36} height={48} rx={2} className="sk-phantom" />
      <line x1={240} x2={240} y1={30} y2={150} className="sk-faint" />
      {patches(266)}
      {rows.map((y, index) => (
        <path
          key={y}
          d={`M330,${y}H420`}
          className="sk-line sk-draw"
          pathLength={1}
          style={vars({ "--t": "0.8s", "--d": seconds(1.1 + index * 0.12) })}
        />
      ))}
      <rect x={420} y={56} width={36} height={68} rx={2} className="sk-phantom" />
    </>
  );
}

/** sequence-layout: two token sequences, each a row of segments with a measured span under it. */
function SequenceLayout() {
  const row = (y: number, groups: { count: number; style: string }[], startDelay: number) => {
    let x = 40;
    let index = 0;
    const cells: ReactNode[] = [];
    const spans: ReactNode[] = [];
    for (const group of groups) {
      const from = x;
      for (let n = 0; n < group.count; n += 1) {
        cells.push(
          <rect
            key={`${y}-${index}`}
            x={x}
            y={y}
            width={16}
            height={26}
            rx={1}
            className={`${group.style} sk-appear`}
            style={vars({ "--d": seconds(startDelay + index * 0.05) })}
          />,
        );
        x += 20;
        index += 1;
      }
      spans.push(<path key={`${y}-span-${from}`} d={`M${from},${y + 34}v6H${x - 4}v-6`} className="sk-line" />);
      x += 8;
    }
    return (
      <g key={y}>
        {cells}
        {spans}
      </g>
    );
  };
  return (
    <>
      {row(
        28,
        [
          { count: 3, style: "sk-block" },
          { count: 9, style: "sk-phantom" },
          { count: 6, style: "sk-block" },
        ],
        0.2,
      )}
      {row(
        104,
        [
          { count: 1, style: "sk-mark" },
          { count: 7, style: "sk-phantom" },
          { count: 2, style: "sk-block" },
          { count: 8, style: "sk-solid" },
        ],
        1.2,
      )}
    </>
  );
}

/** flow-matching: a cloud of noise carried, in a few steps, onto two targets. */
function FlowMatching() {
  const targets = [
    { x: 392, y: 52 },
    { x: 392, y: 128 },
  ];
  // Seven points end on each target, spread on a small ring; each starts as noise on its own side.
  const points = Array.from({ length: 14 }, (_, index) => {
    const upper = index % 2 === 0;
    const target = targets[upper ? 0 : 1];
    const angle = (Math.floor(index / 2) * 2 * Math.PI) / 7;
    const end = {
      x: Number((target.x + 11 * Math.cos(angle)).toFixed(1)),
      y: Number((target.y + 11 * Math.sin(angle)).toFixed(1)),
    };
    const noise = { x: 66 + ((index * 61) % 98), y: (upper ? 28 : 96) + ((index * 43) % 56) };
    return { end, noise };
  });
  return (
    <>
      <rect x={52} y={18} width={126} height={144} rx={2} className="sk-phantom" />
      {targets.map((target) => (
        <circle key={target.y} cx={target.x} cy={target.y} r={20} className="sk-phantom" />
      ))}
      {points.map((point, index) => (
        <g key={index}>
          <line x1={point.noise.x} y1={point.noise.y} x2={point.end.x} y2={point.end.y} className="sk-faint" />
          <circle
            cx={point.end.x}
            cy={point.end.y}
            r={3.5}
            className="sk-dot sk-move"
            style={vars({
              "--fx": px(point.noise.x - point.end.x),
              "--fy": px(point.noise.y - point.end.y),
              "--t": "3s",
              "--d": "0.3s",
              "--ease": "steps(10, jump-none)",
            })}
          />
        </g>
      ))}
    </>
  );
}

/** action-chunks: three overlapping plans of 15; of each, 8 are carried out. */
function ActionChunks() {
  const step = 14;
  return (
    <>
      {[0, 1, 2].map((chunk) => (
        <g key={chunk} transform={`translate(${24 + chunk * 8 * step},${30 + chunk * 34})`}>
          {Array.from({ length: 15 }, (_, index) => (
            <rect key={index} x={index * step} width={11} height={20} rx={1} className={index < 8 ? "sk-solid" : "sk-phantom"} />
          ))}
        </g>
      ))}
      <path d="M24,150H456" className="sk-line" />
      {Array.from({ length: 4 }, (_, index) => (
        <line key={index} x1={24 + index * 8 * step} x2={24 + index * 8 * step} y1={146} y2={154} className="sk-line" />
      ))}
      <g className="sk-move" style={vars({ "--fx": px(-24 * step), "--t": "4s", "--ease": "linear", "--d": "0.3s" })}>
        <line x1={24 + 24 * step} x2={24 + 24 * step} y1={22} y2={150} className="sk-outline" />
        <rect x={24 + 24 * step - 6} y={144} width={12} height={12} className="sk-mark" />
      </g>
    </>
  );
}

/** copycat: for each action dimension, the share the previous action already explains. */
function Copycat() {
  const shares = [0.96, 0.93, 0.97, 0.9, 0.95, 0.92, 0.96, 0.58];
  const base = 150;
  const height = 116;
  return (
    <>
      <path d={`M70,20V${base}H410`} className="sk-line" />
      <line x1={70} x2={410} y1={base - height} y2={base - height} className="sk-phantom" />
      {shares.map((share, index) => (
        <rect
          key={index}
          x={90 + index * 40}
          y={base - share * height}
          width={24}
          height={share * height}
          className={`${index === 7 ? "sk-mark" : "sk-block"} sk-grow`}
          style={vars({ "--d": seconds(0.2 + index * 0.1) })}
        />
      ))}
    </>
  );
}

/** grasp-map: rings around the object, one dot where the gripper closed in each episode. */
function GraspMap() {
  const centre = { x: 240, y: 90 };
  const far = Array.from({ length: 22 }, (_, index) => {
    const angle = index * 2.4;
    const radius = 26 + ((index * 29) % 50);
    return { x: centre.x + radius * Math.cos(angle) * 1.5, y: centre.y + radius * Math.sin(angle) * 0.95 };
  });
  const near = Array.from({ length: 7 }, (_, index) => {
    const angle = index * 0.9;
    return { x: centre.x + 5 * Math.cos(angle), y: centre.y + 5 * Math.sin(angle) };
  });
  return (
    <>
      <line x1={110} x2={370} y1={centre.y} y2={centre.y} className="sk-faint" />
      <line x1={centre.x} x2={centre.x} y1={10} y2={170} className="sk-faint" />
      <circle cx={centre.x} cy={centre.y} r={72} className="sk-phantom" />
      <circle cx={centre.x} cy={centre.y} r={42} className="sk-phantom" />
      <circle cx={centre.x} cy={centre.y} r={14} className="sk-mark" />
      {far.map((dot, index) => (
        <circle
          key={`far-${index}`}
          cx={dot.x.toFixed(1)}
          cy={dot.y.toFixed(1)}
          r={3.5}
          className="sk-dot sk-appear"
          style={vars({ "--d": seconds(0.3 + index * 0.08) })}
        />
      ))}
      {near.map((dot, index) => (
        <circle key={`near-${index}`} cx={dot.x.toFixed(1)} cy={dot.y.toFixed(1)} r={2.5} className="sk-outline" />
      ))}
    </>
  );
}

/** tolerance: success falls as the grasp is placed further off; some objects forgive more. */
function Tolerance() {
  const curves = [
    "M70,30C190,30 300,34 350,60S400,110 420,128",
    "M70,30C230,30 340,32 380,44S410,60 420,66",
    "M70,34C130,36 170,60 220,110S330,146 420,150",
    "M70,36C150,38 220,56 270,98S360,140 420,144",
  ];
  return (
    <>
      <path d="M70,18V154H424" className="sk-line" />
      {[60, 96, 132].map((y) => (
        <line key={y} x1={70} x2={424} y1={y} y2={y} className="sk-faint" />
      ))}
      {curves.map((d, index) => (
        <path
          key={d}
          d={d}
          className={`${index < 2 ? "sk-strong" : "sk-line"} sk-draw`}
          pathLength={1}
          style={vars({ "--t": "1.8s", "--d": seconds(0.2 + index * 0.25) })}
        />
      ))}
      <g className="sk-move" style={vars({ "--fx": px(-176), "--t": "2.6s", "--d": "1.4s" })}>
        <line x1={246} x2={246} y1={18} y2={154} className="sk-outline" />
        <rect x={240} y={148} width={12} height={12} className="sk-mark" />
      </g>
    </>
  );
}

/** arm-replay: a table seen from above and to the side, the gripper's path to the object. */
function ArmReplay() {
  return (
    <>
      <path d="M120,70L330,50L420,120L190,146Z" className="sk-phantom" />
      <path d="M190,146V160L420,134V120" className="sk-faint" />
      {/* objects */}
      <path d="M232,104l18,-3l8,7l-18,3z" className="sk-block" />
      <ellipse cx={318} cy={84} rx={10} ry={5} className="sk-block" />
      <path d="M354,116l16,-2l7,6l-16,2z" className="sk-block" />
      {/* the arm: base, two links, gripper above the object */}
      <path d="M150,84V60" className="sk-strong" />
      <path d="M150,60L214,24L308,40" className="sk-strong" />
      <circle cx={150} cy={60} r={4} className="sk-dot" />
      <circle cx={214} cy={24} r={4} className="sk-dot" />
      {/* the path the gripper took, and where it closed */}
      <path
        d="M308,40C330,52 360,60 362,104"
        className="sk-strong sk-draw"
        pathLength={1}
        style={vars({ "--t": "2.2s", "--d": "0.3s" })}
      />
      <rect x={356} y={98} width={12} height={12} className="sk-mark sk-appear" style={vars({ "--d": "2.4s" })} />
    </>
  );
}

/** timeline: an axis of years with the work that led here marked along it. */
function Timeline() {
  const events = [
    { x: 58, up: 34 },
    { x: 104, up: 70 },
    { x: 162, up: 46 },
    { x: 214, up: 86 },
    { x: 262, up: 34 },
    { x: 306, up: 64 },
    { x: 352, up: 96 },
    { x: 398, up: 46 },
    { x: 432, up: 76 },
  ];
  return (
    <>
      <path d="M30,140H456" className="sk-line sk-draw" pathLength={1} style={vars({ "--t": "1.2s" })} />
      {Array.from({ length: 8 }, (_, index) => (
        <line key={index} x1={30 + index * 60} x2={30 + index * 60} y1={136} y2={146} className="sk-line" />
      ))}
      {events.map((event, index) => (
        <g key={event.x} className="sk-appear" style={vars({ "--d": seconds(0.5 + index * 0.22) })}>
          <line x1={event.x} x2={event.x} y1={140} y2={140 - event.up} className="sk-faint" />
          <rect
            x={event.x - 5}
            y={140 - event.up - 5}
            width={10}
            height={10}
            className={index === events.length - 1 ? "sk-mark" : "sk-solid"}
          />
          <rect x={event.x + 10} y={140 - event.up - 5} width={index % 2 ? 30 : 22} height={10} rx={1} className="sk-phantom" />
        </g>
      ))}
    </>
  );
}

/** The sketch for a figure id. */
export function Sketch({ id }: { id: FigureId }) {
  switch (id) {
    case "pipeline":
      return <Pipeline />;
    case "tokenizer":
      return <Tokenizer />;
    case "padding-shift":
      return <PaddingShift />;
    case "attention":
      return <Attention />;
    case "rotary":
      return <Rotary />;
    case "training-step":
      return <TrainingStep />;
    case "loss-vs-success":
      return <LossVsSuccess />;
    case "patchify":
      return <Patchify />;
    case "pooled-vs-tokens":
      return <PooledVsTokens />;
    case "sequence-layout":
      return <SequenceLayout />;
    case "flow-matching":
      return <FlowMatching />;
    case "action-chunks":
      return <ActionChunks />;
    case "copycat":
      return <Copycat />;
    case "grasp-map":
      return <GraspMap />;
    case "tolerance":
      return <Tolerance />;
    case "arm-replay":
      return <ArmReplay />;
    case "timeline":
      return <Timeline />;
  }
}
