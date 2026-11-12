/**
 * The words of the copycat figure for a policy trained on plain
 * demonstrations and for one trained on demonstrations that begin with a hold
 * frame. Run with: node --test src/figures/copycat/notes.test.ts
 *
 * The values are placeholders for the formatter, not measurements.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type { RunDesign } from "@/data/types";

type Notes = typeof import("./notes");
// Node strips the types and needs the extension; the type above comes from the same file.
const notes = (await import(new URL("./notes.ts", import.meta.url).href)) as Notes;

const rad = (value: number) => value.toFixed(3);

const design = (overrides: Partial<RunDesign> = {}): RunDesign => ({
  family: "policy",
  policy: "dp_vit_lang",
  backbone: null,
  language: true,
  history: true,
  dataset: "pick_target_4k",
  demos: 4000,
  traits: [],
  budget: null,
  positionFix: false,
  ...overrides,
});
const plain = design();
const holdFrame = design({ traits: ["hold_frame"], positionFix: true });

test("the training slot follows the demonstrations", () => {
  assert.equal(notes.trainingSlot(plain), "expert");
  assert.equal(notes.trainingSlot(holdFrame), "hold");
  assert.equal(notes.trainingSlot(undefined), "expert");
});

for (const narrow of [false, true]) {
  const base = { firstQuery: 0, firstMiss: 0.5, narrow, rad };

  test(`plain demonstrations (${narrow ? "narrow" : "wide"}): told the expert's first action is as in training`, () => {
    const lines = notes.firstQueryNote({ ...base, slot: { firstPrev: "expert", prefix: 0 }, training: "expert" });
    assert.match(lines.join(" "), /as in training/);
    const served = notes.firstQueryNote({ ...base, slot: { firstPrev: "hold", prefix: 0 }, training: "expert" });
    assert.doesNotMatch(served.join(" "), /as in training/);
  });

  test(`hold-frame demonstrations (${narrow ? "narrow" : "wide"}): as served is as in training, the expert's action is not`, () => {
    const training = notes.trainingSlot(holdFrame);
    const told = notes.firstQueryNote({ ...base, slot: { firstPrev: "expert", prefix: 0 }, training });
    assert.doesNotMatch(told.join(" "), /as in training/);
    const served = notes.firstQueryNote({ ...base, slot: { firstPrev: "hold", prefix: 0 }, training });
    assert.match(served.join(" "), /hold command/);
    assert.match(served.join(" "), /as in training/);
    assert.match(served.join(" "), /0\.500 rad/);
  });
}

test("the takeaway names what the slot held in training", () => {
  const input = { holdMiss: 0.2, laterMax: 0.1, laterMedian: 0.05, rad };
  assert.match(notes.takeaway({ ...input, training: "expert" }), /expert's first command/);
  assert.match(notes.takeaway({ ...input, training: "hold" }), /also what the slot held in training/);
});

test("a hold-frame run after the fix is a test of the slot, and not a clean one", () => {
  const reasons = notes.relatedReasons(plain, holdFrame);
  assert.match(reasons, /tests a fix for the slot/);
  assert.match(reasons, /position fix/);
  assert.match(reasons, /not clean/);
  assert.doesNotMatch(notes.relatedReasons(plain, design({ traits: ["hold_frame"] })), /not clean/);
});

test("the gripper sentence counts every change", () => {
  assert.match(notes.gripperSentence([{ step: 40, closes: true }]), /once, at step 40/);
  const twice = notes.gripperSentence([
    { step: 40, closes: true },
    { step: 52, closes: false },
    { step: 60, closes: true },
  ]);
  assert.match(twice, /3 times/);
  assert.doesNotMatch(twice, /once/);
  assert.match(notes.gripperSentence([]), /does not change/);
});
