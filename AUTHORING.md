# Authoring a lesson

How to turn one chapter into a lesson: the short, animated page a reader sees at
`/learn/<slug>`. The site is a class that teaches; the lesson is the class. The chapter's
technical details (code, tables, exact measurements) stay at `/learn/<slug>/full`, folded and
secondary. Two lessons to copy: `src/lessons/10-tokens/` and `src/lessons/41-flow-matching/`.

Until a lesson exists, `/learn/<slug>` shows a calm "this lesson is being written" card, never
the long chapter. Where the lesson sits in the course (its module, its number, its one-line
"what you will understand") is set in `src/lib/course.ts`, not in the lesson.

## 1. What you create (and what you never touch)

Everything for one chapter lives in one new folder. It is found automatically; there is no list
to register it in.

```
src/lessons/<slug>/              <slug> = the chapter's file name without .md, e.g. 21-pooled-vs-patch-tokens
  lesson.ts                      the text: export default defineLesson({ ... })
  math.ts                        optional: "The math, step by step": export default defineMath([ ... ])
  animations/<Name>.tsx          one client component per animated beat
  animations/<data>.ts           optional: seeded data or a computation the animations draw
```

Do **not** edit, in a lesson task:
- `content/chapters/*.md` (overwritten by `npm run sync`), `src/data/*` (checked against the
  lab notebook);
- anything shared: `src/animations/`, `src/lessons/define.ts|index.ts|validate.ts`,
  `src/lib/course.ts`, `src/components/`, `src/app/`, CSS files. If the kit lacks something,
  draw it with plain SVG inside your animation file, or write it down for the kit's owner.
- another lesson's folder.

Several agents can then work at once without conflicts.

## 2. The format

```ts
// src/lessons/<slug>/lesson.ts
import { defineLesson } from "../define";
import { FirstThing } from "./animations/FirstThing";

export default defineLesson({
  slug: "<slug>",                       // equals the folder name
  idea: "One plain sentence: the whole idea.",                // at most 30 words
  beats: [                                                    // 3 to 6
    { title: "A few words", text: "At most 50 words.", animation: FirstThing },
    // most beats have an animation
  ],
  edgeCases: ["3 to 5 bullets, each under 35 words."],       // what could go wrong, misconceptions
  tips: ["3 to 5 bullets, each under 35 words."],            // simple practical intuitions
  takeaway: "One sentence a student could repeat.",          // under 40 words
  related: ["12-positions"],                                 // optional: chapter slugs
  lab: [{ label: "What the reader finds there", href: "/lab#sampler" }],   // optional
  tryIt: ["flow-matching"],                                  // optional: ids from src/figures/catalog.ts
});
```

Text may use exactly three inline marks: `**bold**` for a new term at the place it is
explained, `` `text` `` only for a literal token shown as an example (`cube` + `d`), never for
code, and `[text](/learn/<slug>)` links.

Lab anchors that exist: `/lab#task`, `#before-the-fix`, `#history`, `#what-it-depends-on`,
`#position-fix`, `#demonstrations`, `#outside-the-training-conditions`, `#backbones`,
`#toward-flower-trimming`, `#sampler`, `#grasp-tolerance`, `#datasets-runs-bugs`.

The build checks all of this (`src/lessons/validate.ts`) and fails with a list of what to fix.

## 3. Teaching rules

Read the whole synced chapter (`content/chapters/<slug>.md`) first. The lesson is a new text
that teaches the same idea, not a cut-down copy.

**Who it is for.** A curious learner with no machine-learning background beyond school maths.
Each lesson teaches **one idea** they could explain to a friend afterwards.

**The order of every lesson, and of every beat where it fits:**
1. **Intuition first**: an everyday picture or analogy (a recipe, a map with pins, a coach
   watching a step).
2. **The mechanism in plain words**: what actually happens, step by step.
3. **Why it matters for a robot**: what goes right or wrong on the arm because of it.

**The animation carries the idea; the text supports it.** A beat is at most about 50 words
beside its animation. If a sentence describes what the animation already shows, cut it.

**Never in a lesson:** code, commands, file or config names, flags, environment variables,
run names, log fields, library names, tables, hardware, bug or operations stories. Those
belong in the technical details. **Numbers:** at most one or two per beat, rounded, and only
when they teach something ("about a hundred tries", "ten steps or two"). Every number must come
from the chapter; a made-up example number is called an example.

**Edge cases** are "what could go wrong" and common misconceptions, said as concepts ("a robot
that succeeds may still look only once"), not as bugs or settings. **Tips** are simple
practical intuitions ("watch where it closes, not only whether it succeeds"). **The takeaway**
is one sentence a student could repeat next week.

**Style.**
- Plain words, short sentences: one idea per sentence, 8 to 18 words, active voice.
- Explain every term once, in a few words, where it first appears, and bold it there. If a
  term is not needed to follow the idea, leave it out.
- Concrete first: start from the example (an instruction, two cubes, a padded row), then name
  the general rule.
- No filler: no "simply", "just", "basically", "in this lesson we", "let's".
- Never describe the text itself: nothing about length, reading time, attention or the text
  having been made simpler.
- Public and generic: no hostnames, user names, institutions, absolute paths.

Bad (jargon, filler, nothing explained):

> Basically, BPE iteratively merges the argmax bigram over the corpus to construct a subword
> vocabulary, which is then used to map strings to indices consumed by the embedding layer.

Good (picture first, plain, every term explained once):

> Think of a phrasebook: common phrases get one entry, rare words are spelled out. A
> **tokenizer** works the same way. It cuts text into pieces called **tokens**, and each piece
> gets a number the model can look up.

## 4. The math, step by step (optional)

Some ideas are best understood through one small formula. Put it in `math.ts` beside
`lesson.ts`; the lesson shows it after the beats, open (it is part of learning, unlike code).
At most three entries.

```ts
// src/lessons/<slug>/math.ts
import { defineMath } from "../define";

export default defineMath([
  {
    title: "A point on the straight path",                  // what the formula does, a few words
    formula: "x_t = (1 - t)\\,x_0 + t\\,x_1",               // LaTeX for KaTeX, no $ signs
    symbols: [                                               // every symbol, with a plain meaning
      ["x_0", "where we start: random noise", "ink"],
      ["x_1", "where we want to end: a good action", "action"],
      ["t", "how far along we are, from 0 to 1", "accent"],
      ["x_t", "the point that far along the path", "vision"],
    ],
    metaphor: "Two pins on a map and a string between them. $t$ says how far along the string you stand.",
    example:                                                 // one step per line; $...$ for maths
      "Start at $x_0 = 2$ and aim for $x_1 = 5$.\nHalfway means $t = 0.5$.\nThen $x_t = 0.5 \\times 2 + 0.5 \\times 5 = 3.5$, exactly between the two pins.",
    // animation: PathPoint,                                 // optional, from ./animations
  },
]);
```

Each symbol is drawn in the same colour in the formula and in its line of the legend. The third
item of a symbol picks the colour by meaning, as in the animations: `action` for actions,
`vision` for images, `language` for words, `accent` for the one quantity to follow, `ink` for the
rest; without it, symbols take colours in turn. A symbol is matched in the formula by its LaTeX,
so write it the same way in both (`x_1`, not `x_{1}` in one and `x_1` in the other).

Rules:
- **Only the maths that teaches the idea.** If the idea is clear without a formula, leave the
  file out.
- **Explain every symbol**, in plain words a beginner understands.
- **One metaphor** per formula: an everyday picture, one or two sentences.
- **One tiny worked example** with small, round numbers a reader can check by hand, three or
  four steps.
- The build renders every formula, symbol and `$...$` with KaTeX and fails on an error
  (`validateMath` in `src/lessons/validate.ts`). The example above lives in
  `src/lessons/fixtures/math.example.ts`, and `/preview/math` shows it as a lesson would.

## 5. Animations

One file per animated beat, in `animations/`, starting with `"use client"` and exporting a named
component that renders an `<AnimationFrame>`. The kit, its rules (coordinates, tones, motion,
words) and a worked example are in `src/animations/README.md`. Read it before the first one.

Design each animation before you draw it:
1. Write the beat's text.
2. List 3 to 6 steps, one sentence each: what changes in each, in the order the eye should
   follow. These become the captions, in the same plain words as the beat.
3. Sketch the final step: it is also the still frame for reduced motion, so it must explain the
   idea alone.
4. Draw it. Keep shapes mounted and change `x`, `y`, `opacity`; reuse the frame's motion.

Good subjects: a thing becoming another thing (text to ids), a process step by step (merges,
flow steps), a comparison side by side (1 vs 10 steps), the robot doing the right or the wrong
thing (`Arm`, `reach`, `Thing`). If the chapter has a computation, run it in a `.ts` file
(see `41-flow-matching/animations/toy.ts`) instead of drawing made-up positions.

## 6. Check

```bash
npm run dev                  # open /learn/<slug>, and /learn/<slug>/full
npm run lint
npx tsc --noEmit
npm run build                # also runs the lesson and math format checks
```

In the browser:
- Read the lesson top to bottom at 1440 px and at 375 px (no sideways scrolling).
- Every animation: watch one loop, click every pip, check both themes (header toggle) and
  reduced motion (devtools, Rendering). Nothing overlaps in any step.
- Read it as the learner: could you explain the idea to a friend from this page alone?
- Compare every number and claim against the chapter once more.

`/learn` and the landing page pick up the new lesson by themselves: its minutes replace "Being
written" in the course outline.
