# Authoring a lesson

How to turn one chapter into a lesson: the short, animated page a reader sees first at
`/learn/<slug>`. The long chapter stays one click away at `/learn/<slug>/full`. Two finished
lessons to copy: `src/lessons/10-tokens/` and `src/lessons/41-flow-matching/`.

## 1. What you create (and what you never touch)

Everything for one chapter lives in one new folder. It is found automatically; there is no list
to register it in.

```
src/lessons/<slug>/              <slug> = the chapter's file name without .md, e.g. 21-pooled-vs-tokens
  lesson.ts                      the text: export default defineLesson({ ... })
  animations/<Name>.tsx          one client component per animated beat
  animations/<data>.ts           optional: seeded data or a computation the animations draw
```

Do **not** edit, in a lesson task:
- `content/chapters/*.md` (overwritten by `npm run sync`), `src/data/*` (checked against the
  lab notebook);
- anything shared: `src/animations/`, `src/lessons/define.ts|index.ts|validate.ts`,
  `src/components/`, `src/app/`, CSS files. If the kit lacks something, draw it with plain SVG
  inside your animation file, or write it down for the kit's owner.
- another lesson's folder.

Several agents can then work at once without conflicts.

## 2. The format

```ts
// src/lessons/<slug>/lesson.ts
import { defineLesson } from "../define";
import { FirstThing } from "./animations/FirstThing";

export default defineLesson({
  slug: "<slug>",                       // equals the folder name
  idea: "One plain sentence: the whole chapter.",            // at most 30 words
  beats: [                                                    // 3 to 6
    { title: "A few words", text: "At most 60 words.", animation: FirstThing },
    // most beats have an animation; a beat without one is fine for a measured result
  ],
  edgeCases: ["3 to 5 bullets, each under 35 words."],       // where it breaks or surprises
  tips: ["3 to 5 bullets, each under 35 words."],            // what a reader can do
  takeaway: "One or two lines to remember, under 40 words.",
  related: ["12-positions"],                                 // optional: chapter slugs
  lab: [{ label: "What the reader finds there", href: "/lab#sampler" }],   // optional
  tryIt: ["flow-matching"],                                  // optional: ids from src/figures/catalog.ts
});
```

Text may use exactly three inline marks: `**bold**` for a new term at the place it is
explained, `` `code` `` for identifiers and literal tokens, and `[text](/learn/<slug>)` links.

Lab anchors that exist: `/lab#task`, `#before-the-fix`, `#history`, `#what-it-depends-on`,
`#position-fix`, `#demonstrations`, `#outside-the-training-conditions`, `#backbones`,
`#toward-flower-trimming`, `#sampler`, `#grasp-tolerance`, `#datasets-runs-bugs`.

The build checks all of this (`src/lessons/validate.ts`) and fails with a list of what to fix.

## 3. Writing rules

Read the whole synced chapter (`content/chapters/<slug>.md`) first. The lesson is a new text
for the same idea, not a cut-down copy.

- **Plain words, short sentences.** One idea per sentence, 8 to 18 words. Active voice.
- **Explain every term once, in a few words, where it first appears**, and bold it there.
  If a term is not needed to follow the idea, leave it out.
- **Concrete first.** Start from the example (an instruction, two cubes, a padded row), then
  name the general rule.
- **Facts from the chapter only.** Numbers only if the chapter states them, copied exactly,
  with what they measure. A toy number is called a toy. Never invent a result.
- **No filler**: no "simply", "just", "basically", "in this lesson we", "let's".
- **Never describe the text itself**: no "in short", "short version", "TL;DR", nothing about
  length, reading time or attention.
- **Public and generic**: no hostnames, user names, institutions, absolute paths. Hardware only
  as "machine A" / "machine B".
- **Edge cases** are things that break, surprise or silently differ (train against serve, an
  off-by-one, a setting that does not reach the code). **Tips** are actions: print, check,
  sweep, compare.
- **The takeaway** is the one line a reader should still know next week.

Bad (jargon, filler, nothing explained):

> Basically, BPE iteratively merges the argmax bigram over the corpus to construct a subword
> vocabulary, which is then used to map strings to indices consumed by the embedding layer.

Good (plain, concrete, every term explained once):

> Letters make sequences long. Whole words fail on a word never seen. **Subwords** sit in
> between. Byte-pair encoding learns them: start from single characters and keep merging the
> most frequent neighbouring pair.

## 4. Animations

One file per animated beat, in `animations/`, starting with `"use client"` and exporting a named
component that renders an `<AnimationFrame>`. The kit, its rules (coordinates, tones, motion,
words) and a worked example are in `src/animations/README.md`. Read it before the first one.

Design each animation before you draw it:
1. Write the beat's text.
2. List 3 to 6 steps, one sentence each: what changes in each, in the order the eye should
   follow. These become the captions.
3. Sketch the final step: it is also the still frame for reduced motion, so it must explain the
   idea alone.
4. Draw it. Keep shapes mounted and change `x`, `y`, `opacity`; reuse the frame's motion.

Good subjects: a thing becoming another thing (text to ids), a process step by step (merges,
flow steps), a comparison side by side (1 vs 10 steps), the robot doing the right or the wrong
thing (`Arm`, `reach`, `Thing`). If the chapter has a computation, run it in a `.ts` file
(see `41-flow-matching/animations/toy.ts`) instead of drawing made-up positions.

## 5. Check

```bash
npm run dev                  # open /learn/<slug>, and /learn/<slug>/full
npm run lint
npx tsc --noEmit
npm run build                # also runs the lesson format check
```

In the browser:
- Read the lesson top to bottom at 1440 px and at 375 px (no sideways scrolling).
- Every animation: watch one loop, click every pip, check both themes (header toggle) and
  reduced motion (devtools, Rendering). Nothing overlaps in any step.
- Compare every number and claim against the chapter once more.

`/learn` and the landing page pick up the new lesson by themselves (an "Animated lesson" badge,
the idea sentence as the row's summary).
