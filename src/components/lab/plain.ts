/**
 * Each section of the experiments page in plain words: the result as a
 * headline anyone can read, and one or two sentences on what was tried and
 * why it matters. No numbers here; a section's big number, when it has one,
 * is read from src/data (findings.json), which the notebook check covers.
 */

import { findings } from "@/data/lab";

export interface PlainSection {
  headline: string;
  meaning: string;
  /** A big number and what it says, read from the data. */
  number?: () => { value: string; caption: string } | undefined;
}

const finding = (id: string) => findings.find((entry) => entry.id === id);

export const PLAIN: Record<string, PlainSection> = {
  task: {
    headline: "First, check that the task can be done at all.",
    meaning:
      "Before training anything, a hand-written robot ran through the exact same test. It succeeds, so when a learned robot fails, the problem is the robot, not the simulator.",
    number: () => {
      const row = finding("expert-first")?.rows.find((entry) => entry.reference);
      return row ? { value: row.result, caption: "tries the hand-written robot gets right" } : undefined;
    },
  },
  "before-the-fix": {
    headline: "A robot can look hopeless for a long time, then suddenly start to work.",
    meaning:
      "For much of training it grabs at a random object. Then, within a short stretch, it starts to look at the scene and succeeds. The training score gave no warning.",
    number: () => {
      const rows = finding("arrives-late")?.rows ?? [];
      if (rows.length < 2) return undefined;
      return {
        value: `${rows[0].percent}% → ${rows[rows.length - 1].percent}%`,
        caption: "success of one robot, from early to late in its training",
      };
    },
  },
  history: {
    headline: "Remembering its last move made the robot stop looking.",
    meaning:
      "Given its previous move as an input, the robot guessed the goal from that instead of from its cameras. The same robot without that input learned to look.",
  },
  "what-it-depends-on": {
    headline: "A robot that works may still look only once.",
    meaning:
      "We froze its cameras and moved the object mid-reach. The working robot decides where to go from its first few pictures and does not check again.",
  },
  "position-fix": {
    headline: "A tiny rounding error held every robot back.",
    meaning:
      "The model stored word positions with too little precision, so many of them looked the same. Once fixed, the same recipe started looking at the scene sooner and ended higher.",
  },
  demonstrations: {
    headline: "What is in the examples matters as much as how many.",
    meaning:
      "Same robot, same number of examples, different content. Examples that start from varied poses, or show the first moments more often, teach the robot to look sooner.",
  },
  "outside-the-training-conditions": {
    headline: "A robot only recovers if its examples show recovering.",
    meaning:
      "We moved the object while the arm reached for it. Robots failed unless their examples included a teacher fixing a miss; with those, they followed the object and tried again.",
  },
  backbones: {
    headline: "Starting from a pretrained model mostly buys an earlier start.",
    meaning:
      "A model that first learned to describe pictures began looking at the scene sooner than one trained from nothing. By the end of training the two were close.",
  },
  "toward-flower-trimming": {
    headline: "Toward trimming a plant, one small step at a time.",
    meaning:
      "Each step adds one part of the real job, from reaching a flower to cutting the named stem, and is tested before the next. Some steps already work; the newest are still training.",
  },
  sampler: {
    headline: "The robot needs fewer thinking steps than you might expect.",
    meaning:
      "Each move is refined from noise in a few steps. A couple of steps were nearly as good as ten, and much faster. Re-planning more often did not help.",
  },
  "grasp-tolerance": {
    headline: "How close is close enough to pick something up.",
    meaning:
      "We measured how far off the gripper can close and still lift the object. Boxy objects forgive more than round ones, which tells us how precise a robot must be.",
  },
  "datasets-runs-bugs": {
    headline: "The bookkeeping: examples, runs and mistakes.",
    meaning:
      "What each set of examples holds, which runs are still going, and what went wrong on the way. The reference behind everything above.",
  },
};
