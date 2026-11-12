/**
 * What the pipeline figure says: the eight stations of the loop, the command
 * that runs each one and the files it writes, and the ten steps one item takes
 * through them.
 *
 * Commands are copied from the tutorial repository's README.md and
 * sim/pickup/README.md as they are now, with their names (dataset
 * `pick_target_4k`, run `my_run`). The few numbers here are settings and
 * definitions the chapters state (256 windows per shard, a [15, 8] chunk, 200
 * control steps, six checkpoints asked for); nothing here is measured.
 */

export type StationId =
  "expert" | "demonstrations" | "shards" | "training" | "checkpoints" | "server" | "simulator" | "results";

/** A program that runs, or a file on disk that one program writes and the next reads. */
export type StationKind = "program" | "file";

/** Modality of a part of what travels: drawn in the modality hue, always with its word. */
export type Modality = "vision" | "language" | "action" | "plain" | "success" | "failure";

export interface Part {
  label: string;
  modality: Modality;
  /** Sent, but not read by the run's config: drawn struck through, with the word "unused". */
  unused?: boolean;
}

/** A labelled list of parts: what the item holds, what is sent, what is read. */
export interface PartGroup {
  label: string;
  parts: readonly Part[];
}

export interface Command {
  /** What the command is for. */
  label: string;
  code: string;
  /** One of the three commands that make up the loop. */
  main?: boolean;
}

/** An argument to add to another command, with what it is for (as the README's table has it). */
export interface Option {
  flag: string;
  purpose: string;
}

export interface Station {
  id: StationId;
  name: string;
  kind: StationKind;
  /** The program (for a program) or the file (for a file), short, shown on the card. */
  tag: string;
  /** One to three sentences: what happens here. */
  summary: string;
  /** The script or module that does it. */
  runs: string;
  commands: readonly Command[];
  /** Arguments that change what this station produces, each on its own line. */
  options?: readonly Option[];
  /** A sentence before the options. */
  optionsNote?: string;
  /** Paths written, relative to the repository root. */
  writes: readonly string[];
  /** A sentence after the paths, when the paths need one. */
  writesNote?: string;
  /** What the station writes when the loop runs, when that is not `writes` (the expert writes only when checked alone). */
  loopWrites?: readonly string[];
  /** What the item holds at this station, or what is sent and read there. */
  parts?: readonly PartGroup[];
}

/** The three commands of the loop, as the README's quickstart gives them. */
const MAKE_DATASET =
  "sim/pickup/scripts/make_dataset.sh pick_target 4000 pick_target_4k --random_start --disturb_prob 0.5";
const TRAIN = "sim/pickup/scripts/train_resilient.sh dp_vit_lang_reactive pick_target_4k my_run 5000000";
const EVAL = "sim/pickup/scripts/eval.sh experiments/pickup/my_run pick_target 100";

/** The config the run is trained with, named where the plate says what the server reads. */
export const RUN_CONFIG = "dp_vit_lang_reactive";

export const STATIONS: readonly Station[] = [
  {
    id: "expert",
    name: "Scripted expert",
    kind: "program",
    tag: "expert.py",
    summary:
      "A hand-written controller. It reads the named object's true position from the simulator, which the policy never sees, plans four waypoints for the point between the fingertips and follows them. Noise on the grasp point and the speed keeps its episodes from being copies of one trajectory.",
    runs: "ScriptedExpert in expert.py, called by collect.py in several simulator processes (PICKUP_WORKERS)",
    commands: [
      { label: "Runs it", code: MAKE_DATASET, main: true },
      {
        label: "Check the task with the expert alone",
        code: ".venv/bin/python -m sim.pickup.eval --task pick_target --episodes 100 --expert --out results/pickup/expert/pick_target",
      },
    ],
    writes: ["results/pickup/expert/pick_target/results.json"],
    writesNote:
      "Only when checked alone. In the loop it writes nothing itself: collect.py keeps its successful episodes.",
    loopWrites: [],
    parts: [
      {
        label: "It reads",
        parts: [
          { label: "true object pose", modality: "plain" },
          { label: "instruction", modality: "language" },
        ],
      },
    ],
  },
  {
    id: "demonstrations",
    name: "Demonstrations",
    kind: "file",
    tag: "episode_*.parquet",
    summary:
      "collect.py keeps the successful episodes in the dataset layout of LeRobot: one parquet file per episode with, at every control step, the JPEG frames of both cameras, the state and the action, plus one instruction for the episode. What these episodes contain is decided here, by the arguments make_dataset.sh passes on to collect.py.",
    runs: "collect.py, the first half of make_dataset.sh",
    commands: [{ label: "Written by", code: MAKE_DATASET, main: true }],
    optionsNote:
      "Without options every demonstration is one clean pass from the home pose, one instruction per layout, as in the chapters' recipe (the same command without options). The README's recipe adds the first two. Each option goes after the dataset name:",
    options: [
      {
        flag: "--random_start",
        purpose: "every episode starts from a random gripper pose above the table",
      },
      {
        flag: "--disturb_prob 0.5",
        purpose: "in that share of the episodes the object is moved once and the expert plans again or retries",
      },
      {
        flag: "--targets_per_layout 3",
        purpose: "every layout is demonstrated once per object, with a different instruction each time",
      },
      {
        flag: "--hold_steps 1",
        purpose: "every episode begins with a frame at rest; only for policies given their previous action",
      },
    ],
    writes: [
      "data/lerobot/pick_target_4k/data/chunk-000/episode_*.parquet",
      "data/lerobot/pick_target_4k/meta/info.json, episodes.jsonl, tasks.jsonl",
    ],
    parts: [
      {
        label: "The item holds",
        parts: [
          { label: "front, wrist frames", modality: "vision" },
          { label: "state [8]", modality: "plain" },
          { label: "action [8]", modality: "action" },
          { label: "instruction", modality: "language" },
        ],
      },
    ],
  },
  {
    id: "shards",
    name: "Shards",
    kind: "file",
    tag: "*.tar",
    summary:
      "Each episode is cut into windows, one starting at every frame. A window is one training example: the images at frames t-1 and t, and the states and actions of 16 frames (1 past, the current one, 14 future). Windows are packed 256 to a tar file, a shard, which the data loader streams.",
    runs: "preprocess_robotics_to_tar.py, the second half of make_dataset.sh",
    commands: [{ label: "Written by", code: MAKE_DATASET, main: true }],
    writes: [
      "data/preprocessed/pick_target_4k/shards/*.tar",
      "data/preprocessed/pick_target_4k/shards/manifest.jsonl",
      "data/preprocessed/pick_target_4k/shards/stats.json",
    ],
    writesNote: "stats.json holds the normalisation statistics.",
    parts: [
      {
        label: "A window holds",
        parts: [
          { label: "images at t-1, t", modality: "vision" },
          { label: "16 states", modality: "plain" },
          { label: "16 actions", modality: "action" },
          { label: "instruction", modality: "language" },
        ],
      },
    ],
  },
  {
    id: "training",
    name: "Training",
    kind: "program",
    tag: "main.py",
    summary:
      "vla_foundry/main.py draws windows from the shards in batches and learns to predict each window's actions from the inputs its config asks for. The budget is counted in samples, one window each. If the run dies, or its log stops moving for 420 seconds, it is restarted from the newest checkpoint. The loss goes to the log; it does not say whether the policy will succeed.",
    runs: "train_resilient.sh, which runs train.sh, which runs vla_foundry/main.py",
    commands: [
      { label: "Runs it", code: TRAIN, main: true },
      {
        label: "Watch it, with the success of every evaluated checkpoint",
        code: ".venv/bin/python -m sim.pickup.monitor",
      },
    ],
    writes: ["experiments/pickup/my_run.train.log"],
    parts: [
      {
        label: "The item holds",
        parts: [
          { label: "batch of windows", modality: "plain" },
          { label: "loss", modality: "plain" },
        ],
      },
    ],
  },
  {
    id: "checkpoints",
    name: "Checkpoints",
    kind: "file",
    tag: "checkpoint_N.pt",
    summary:
      "At set points the training state is saved: the weights, the optimiser state and, with averaged weights switched on (the configs here do), the averaged weights. train.sh asks for six (PICKUP_NUM_CHECKPOINTS changes that); a seventh can follow at the end. Each one can be served and evaluated, which turns a run into a curve of success against training.",
    runs: "save_checkpoint in vla_foundry/file_utils.py, during training",
    commands: [
      { label: "Written by", code: TRAIN, main: true },
      {
        label: "Evaluate every checkpoint, while the run trains",
        code: "PICKUP_WATCH=1 PICKUP_EVAL_JOBS=2 sim/pickup/scripts/eval_checkpoints.sh experiments/pickup/my_run pick_target 100",
      },
    ],
    writes: [
      "experiments/pickup/my_run/checkpoints/checkpoint_N.pt",
      "experiments/pickup/my_run/checkpoints/optimizer_N.pt",
      "experiments/pickup/my_run/checkpoints/ema_N.pt",
    ],
    writesNote:
      "eval_checkpoints.sh writes one results/pickup/my_run/pick_target/ckpt_<N>_<raw|ema>/results.json per checkpoint.",
  },
  {
    id: "server",
    name: "Policy server",
    kind: "program",
    tag: "policy_server.py",
    summary: `eval.sh starts it. It loads one checkpoint's weights (the averaged ones unless PICKUP_WEIGHTS=raw) with the run's config and normalisation statistics, and listens on a local socket. The client sends every input; the server passes on only what the run's config asks for, and ${RUN_CONFIG} is given neither the frames at t-1 nor its previous action. It builds the model input with the same calls as the training data loader and replies with an action chunk: 15 actions of 8 numbers, made from noise in --flow_steps flow steps (default 10).`,
    runs: "eval.sh starts policy_server.py, then the simulator client, then shuts the server down",
    commands: [{ label: "Started by", code: EVAL, main: true }],
    writes: ["results/pickup/my_run/pick_target/policy_server.log"],
    parts: [
      {
        label: `Reads, for ${RUN_CONFIG}`,
        parts: [
          { label: "front, wrist frames at t", modality: "vision" },
          { label: "state at t", modality: "plain" },
          { label: "instruction", modality: "language" },
          { label: "frames, state at t-1", modality: "vision", unused: true },
          { label: "previous action", modality: "action", unused: true },
        ],
      },
      {
        label: "Replies",
        parts: [{ label: "action chunk [15, 8]", modality: "action" }],
      },
    ],
  },
  {
    id: "simulator",
    name: "Simulator",
    kind: "program",
    tag: "eval.py",
    summary:
      "The client. It builds layouts from seeds that start at 1,000,000, which no demonstration used. When its queue of actions is empty it sends the camera frames and states at t-1 and t, the previous action and the instruction, always all of them; the server passes on what the run's config asks for. It executes the first 8 actions of the reply (--exec_horizon) at 20 control steps per second and asks again, until the episode ends.",
    runs: "eval.py with PickupEnv from env.py, started by eval.sh",
    commands: [
      { label: "Runs it", code: EVAL, main: true },
      {
        label: "Probe: send the first frame's images for the whole episode, kept in its own directory",
        code: `PICKUP_OUT=results/pickup/my_run/pick_target/frozen ${EVAL} --stale_images`,
      },
    ],
    writes: ["results/pickup/my_run/pick_target/rollout_*.mp4"],
    parts: [
      {
        label: "Sends, every query",
        parts: [
          { label: "front, wrist frames at t-1, t", modality: "vision" },
          { label: "states at t-1, t", modality: "plain" },
          { label: "previous action", modality: "action" },
          { label: "instruction", modality: "language" },
        ],
      },
    ],
  },
  {
    id: "results",
    name: "Success rate",
    kind: "file",
    tag: "results.json",
    summary:
      "An episode succeeds when the named object stays 8 cm above its rest height for 10 control steps, and fails when 200 control steps pass first. results.json holds the count over all episodes, the success rate with its Wilson 95% interval, and where the gripper first closed in each episode.",
    runs: "eval.py, at the end of the evaluation",
    commands: [
      { label: "Written by", code: EVAL, main: true },
      {
        label: "Every result as one table",
        code: ".venv/bin/python -m sim.pickup.summarize --task pick_target",
      },
    ],
    writes: ["results/pickup/my_run/pick_target/results.json"],
    parts: [
      {
        label: "Each episode",
        parts: [
          { label: "success: held 8 cm up for 10 control steps", modality: "success" },
          { label: "failure: 200 control steps passed", modality: "failure" },
        ],
      },
    ],
  },
];

export const STATION_INDEX: Readonly<Record<StationId, number>> = Object.fromEntries(
  STATIONS.map((station, index) => [station.id, index]),
) as Record<StationId, number>;

/** The script each station belongs to: the whole loop is three commands. */
export interface Script {
  code: string;
  /** The script's file name, for the row heading. */
  name: string;
  stations: readonly StationId[];
  writes: readonly string[];
}

const scriptName = (code: string) =>
  code
    .split(" ")
    .find((word) => word.endsWith(".sh"))
    ?.split("/")
    .pop() ?? code;

/** The three commands of the loop, in order, each with the stations it covers and the files they write. */
export const SCRIPTS: readonly Script[] = STATIONS.reduce<Script[]>((scripts, station) => {
  const main = station.commands.find((command) => command.main);
  if (!main) return scripts;
  const writes = station.loopWrites ?? station.writes;
  const existing = scripts.find((script) => script.code === main.code);
  if (existing) {
    return scripts.map((script) =>
      script === existing
        ? { ...script, stations: [...script.stations, station.id], writes: [...script.writes, ...writes] }
        : script,
    );
  }
  return [...scripts, { code: main.code, name: scriptName(main.code), stations: [station.id], writes }];
}, []);

/** Every other command, once each, with the station it belongs to. */
export const EXTRA_COMMANDS: readonly (Command & { station: StationId })[] = STATIONS.flatMap((station) =>
  station.commands.filter((command) => !command.main).map((command) => ({ ...command, station: station.id })),
);

export interface Step {
  station: StationId;
  /**
   * The item's name at this step, on the token. It names what travelled along
   * the edge the token has just crossed, so a label never moves the wrong way.
   */
  item: string;
  /** The item is not carried here from the previous station; it appears (a new layout is set up). */
  appears?: boolean;
  /** What happens: one or two short sentences, for the line under the loop and the status. */
  text: string;
  /** Said instead of `text` on the second query, while playing. */
  again?: string;
}

/**
 * One item through the loop. Steps 8 and 9 are the closed loop between the
 * simulator and the policy server: observations go to the server, a chunk
 * comes back. Play repeats them once.
 */
export const STEPS: readonly Step[] = [
  {
    station: "expert",
    item: "episode",
    text: "The scripted expert picks up the named object in one layout, reading the object's true position. That is one episode.",
  },
  {
    station: "demonstrations",
    item: "episode file",
    text: "collect.py keeps the successful episode as one parquet file: both cameras, the state and the action at every control step, and the instruction.",
  },
  {
    station: "shards",
    item: "windows",
    text: "The episode is cut into windows, one starting at every frame, and the windows are packed 256 to a tar file, a shard.",
  },
  {
    station: "training",
    item: "batches",
    text: "Training draws windows in batches and learns to predict their actions. The loss goes to the log; it says nothing yet about success.",
  },
  {
    station: "checkpoints",
    item: "checkpoint",
    text: "At set points the training state is saved as a checkpoint. train.sh asks for six; a seventh can follow at the end.",
  },
  {
    station: "server",
    item: "weights",
    text: "eval.sh starts the policy server, which loads one checkpoint's weights and listens on a local socket.",
  },
  {
    station: "simulator",
    item: "new layout",
    appears: true,
    text: "The simulator sets up a layout no demonstration used. Its queue of actions is empty, so it asks the server.",
  },
  {
    station: "server",
    item: "observations",
    text: `The simulator sends frames and states at t-1 and t, the previous action and the instruction. ${RUN_CONFIG} reads only the frames and state at t, and the instruction.`,
    again: "The queue is empty again: the simulator sends the new frames and states.",
  },
  {
    station: "simulator",
    item: "action chunk",
    text: "The server replies with an action chunk of 15 actions. The simulator executes the first 8 and asks again.",
    again: "Another chunk. This goes on until the named object is held or 200 control steps have passed.",
  },
  {
    station: "results",
    item: "1 episode",
    text: "The episode is counted as a success or a failure. Over all episodes, results.json gives the success rate.",
  },
];

/** The first step at each station: where a click on the station sends the item. */
export function firstStepAt(station: StationId): number {
  return STEPS.findIndex((step) => step.station === station);
}

/** The steps of the closed loop that play repeats once, so the exchange is seen to go back and forth. */
export const EXCHANGE_FIRST = 7;
export const EXCHANGE_LAST = 8;
export const PLAY_ROUNDS = 2;

/** The text alternative: the loop in order, as a sentence. */
export const LOOP_SUMMARY =
  "The loop, in order: 1, the scripted expert (expert.py) records an episode; 2, the demonstrations, one parquet file per episode; 3, the shards, tar files of training windows; 4, training (vla_foundry/main.py); 5, the checkpoints it writes; 6, the policy server, which loads one checkpoint; 7, the simulator (eval.py), which sends observations to the server and executes the action chunks it gets back until each episode ends; 8, the success rate in results.json. Then one thing is changed and the loop runs again.";
