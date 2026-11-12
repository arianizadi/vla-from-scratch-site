/**
 * The words of the copycat figure that depend on the data: what the slot holds,
 * whether that is what the policy saw in training, and why a related run
 * matters. Plain functions of their inputs (types only are imported), so that
 * notes.test.ts can run them without the data module.
 *
 * No number is written here: every value arrives as an argument and is
 * printed with the formatter the caller passes in.
 */

import type { RunDesign, Settings } from "@/data/types";

export type SlotContent = Settings["firstPrevAction"];

/** What the previous-action slot holds at the start of an episode under one condition. */
export interface Slot {
  firstPrev: SlotContent;
  /** Control steps the expert drives before the policy's first query. */
  prefix: number;
}

/**
 * What the slot holds at the first frame of a training window. The framework
 * fills an empty slot with a copy of the first action. In plain demonstrations
 * that is the expert's first command; in demonstrations that begin with a
 * hold frame it is the hold command, as when the policy is served.
 */
export function trainingSlot(design: Pick<RunDesign, "traits"> | undefined): SlotContent {
  return design?.traits.includes("hold_frame") ? "hold" : "expert";
}

/** What the slot holds at the policy's first query, in a few words. */
export function slotWords(slot: Slot): string {
  if (slot.prefix > 0) return "the expert's last command";
  return slot.firstPrev === "expert" ? "a copy of the expert's first command" : "the hold command";
}

export interface FirstQueryInput {
  slot: Slot;
  /** What the slot held at the first frame in training, for the selected policy. */
  training: SlotContent;
  /** The step of the policy's first query. */
  firstQuery: number;
  /** The miss of the repeat at the first query, in rad. */
  firstMiss: number;
  narrow: boolean;
  rad: (value: number) => string;
}

/** The two lines of the note at the policy's first query, in the miss panel. */
export function firstQueryNote({ slot, training, firstQuery, firstMiss, narrow, rad }: FirstQueryInput): string[] {
  if (slot.prefix > 0) {
    return [
      narrow ? `Step ${firstQuery}: first query` : `Step ${firstQuery}: the policy's first query`,
      narrow ? "slot: the expert's last command" : "the slot holds the expert's last command, as in training",
    ];
  }
  if (slot.firstPrev === "expert") {
    return training === "expert"
      ? ["Step 0: a copy of the expert's", "first command, as in training: no miss"]
      : ["Step 0: a copy of the expert's", "first command: no miss (trained on hold)"];
  }
  const miss = `miss ${rad(firstMiss)} rad`;
  if (training === "hold") {
    return narrow
      ? ["Step 0, as served: hold command", `as in training; ${miss}`]
      : ["Step 0, as served: the slot holds the hold command", `as in training; ${miss}`];
  }
  return narrow
    ? ["Step 0, as served: hold command", `not as trained; ${miss}`]
    : ["Step 0, as served: the slot holds the hold command", `training had the expert's first command; ${miss}`];
}

export interface TakeawayInput {
  /** The miss at step 0 when the slot holds the hold command. */
  holdMiss: number;
  /** The largest and the median miss after step 0. */
  laterMax: number;
  laterMedian: number;
  training: SlotContent;
  rad: (value: number) => string;
}

/** The sentence above the rollout: the repeat is close everywhere but at the first query, and why that one matters. */
export function takeaway({ holdMiss, laterMax, laterMedian, training, rad }: TakeawayInput): string {
  const later = `After step 0, repeating the previous command misses the expert's next one by at most ${rad(laterMax)} rad (median ${rad(laterMedian)} rad).`;
  const atStart = `At step 0, as served, the slot holds the hold command, where the arm stands before it moves, and the repeat misses by ${rad(holdMiss)} rad.`;
  const why =
    training === "expert"
      ? " In training that slot held a copy of the expert's first command, which already moves toward the named object: the hold command does not."
      : " For this policy that is also what the slot held in training.";
  return `${later} ${atStart}${why}`;
}

/**
 * Why a related run matters next to the probed one, from what their names say:
 * what it changes, and whether it changes more than one thing.
 */
export function relatedReasons(probed: RunDesign, other: RunDesign): string {
  const reasons: string[] = [];
  const added = other.traits.filter((trait) => !probed.traits.includes(trait));
  if (added.includes("hold_frame")) {
    reasons.push(
      "it tests a fix for the slot: with a hold frame first, the slot at the first frame holds the hold command in training, as when served",
    );
  }
  if (added.some((trait) => trait !== "hold_frame") || probed.traits.some((trait) => !other.traits.includes(trait))) {
    reasons.push("its demonstrations differ");
  }
  if (other.positionFix !== probed.positionFix) {
    reasons.push(
      other.positionFix ? "it was also trained after the position fix" : "it was trained before the position fix",
    );
  }
  if ((other.seed ?? null) !== (probed.seed ?? null)) reasons.push("it uses another training seed");
  if (reasons.length === 0) return "";
  const text = reasons.join("; ");
  const sentence = `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  return reasons.length > 1 ? `${sentence} It changes more than one thing, so the comparison is not clean.` : sentence;
}

/** The gripper sentence of the text alternative, from every change of the gripper command. */
export function gripperSentence(changes: { step: number; closes: boolean }[]): string {
  if (changes.length === 0) return "The gripper command does not change.";
  if (changes.length === 1) {
    const [change] = changes;
    const verb = change.closes ? "closes" : "opens";
    return `The gripper command changes once, at step ${change.step}, where the repeat ${verb} one step late.`;
  }
  const steps = changes.map((change) => change.step).join(", ");
  return `The gripper command changes ${changes.length} times (steps ${steps}); each time the repeat follows one step late.`;
}
