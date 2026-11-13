# The animation kit

Small SVG animations that explain one idea each. Every lesson beat uses one. Import everything
from `@/animations`.

```
src/animations/
  AnimationFrame.tsx   the frame: title, stage, captions, step pips, play/pause, replay
  motion.ts            the motion language (durations, easing, stagger) and helpers
  primitives/          shapes (Chip, Label, Dot, Box, Cells, Arrow, Path, Bracket, Move),
                       robot (Arm, Gripper, Thing, reach), chart (Axes, Line, Bar, Timeline)
  animations.css       frame layout, transitions, tones
```

## How it works

An animation is a list of **steps**. You write one function, `step => SVG`, that draws the scene
for a step. When the step changes, every primitive whose position, opacity or colour changed
glides there with the same transition. You never write a timeline.

The frame does the rest:

- plays when 45% of it is on screen, pauses when it leaves or the tab is hidden, loops with a
  short fade;
- the reader can pause, replay, or click a step pip to jump (that also pauses);
- the server renders the `still` step (default: the last), so the page never shifts and works
  without JavaScript;
- with `prefers-reduced-motion` nothing moves: the still step shows, and the pips switch steps
  instantly;
- screen readers get the title and the `description`, and a polite announcement when the reader
  steps by hand.

## Example

```tsx
// src/lessons/<slug>/animations/TokensToIds.tsx
"use client";

import { AnimationFrame, Chip, Label, stagger } from "@/animations";

const TOKENS = ["pick", "␣up"];

export function TokensToIds() {
  return (
    <AnimationFrame
      title="Tokens become ids"
      description="Two tokens, pick and up, are replaced by their ids, 18188 and 614."
      steps={["Two tokens.", "Each becomes its id."]}
      size={[480, 200]}
    >
      {(step) => (
        <>
          {TOKENS.map((token, i) => (
            <Chip key={token} x={170 + i * 140} y={70} text={token} tone="language" delay={stagger(i)} />
          ))}
          {["18188", "614"].map((id, i) => (
            <Chip key={id} x={170 + i * 140} y={140} text={id} tone="ink" variant="outline"
              opacity={step >= 1 ? 1 : 0} delay={stagger(i, 80)} />
          ))}
          <Label x={240} y={20} tone="muted">tokens</Label>
        </>
      )}
    </AnimationFrame>
  );
}
```

Two exemplars to copy: `src/lessons/10-tokens/animations/` and
`src/lessons/41-flow-matching/animations/` (a computed one: `toy.ts` runs the chapter's
arithmetic and the animation draws it).

## Rules

**Drawing**
- Keep every shape mounted in every step; hide it with `opacity={0}` and move it with `x`/`y`.
  Then it fades and glides instead of popping. Use stable `key`s. A shape a step *creates* (a
  merged token) may mount with `enter`.
- Coordinates are SVG units. Default size `[480, 280]`; keep the width 480 so text stays
  readable on a phone (the drawing shrinks to about 0.7x). Text at 14 units or more, 13 at least.
- Positions are centres (`Chip`, `Dot`, `Box`, `Label`, `Thing` stand on their `y`). Axes and
  timelines take their left/top corner.
- Leave 12 units of air inside the edges. No text over lines or dots: move labels until nothing
  overlaps in *any* step (look at every step with the pips).
- Pure function of `step`: no `Math.random()`, no `Date`. Seeded data and computations live in a
  sibling `.ts` file and are rounded (see `toy.ts`), so the server and the browser draw the same.

**Colour (tones)** — colour means something, so use as few as possible.
- `language` words and tokens, `vision` image patches and pixels, `action` actions and
  trajectories. Label them in the drawing.
- `mark` (the highlighter) = "this one, now". `active` on a `Chip`, `Box` or `Thing` rings it.
- `accent` = the one thing to follow when no modality fits (a learned output, a direction).
- `ink`, `muted`, `faint` for everything structural. `success`/`failure` only with a word.
- Never hard-code a colour: tones and the classes `a-fill`, `a-stroke`, `a-fill-soft` come from
  theme tokens, so dark mode works by itself.

**Motion** (`motion.ts`)
- One idea per step; 3 to 6 steps. A step holds 2.2 s by default, the last 3.2 s; pass
  `hold={[...]}` per step for a step that needs longer.
- Things that change together move together; stagger lists with `delay={stagger(i)}` (50 ms
  apart, at most ~8 items). Moves take 600 ms with a soft landing; lines draw in 800 ms.
- `flow` on an `Arrow` (a travelling dash) means "something flows here"; use it on one arrow at a
  time.
- No bouncing, spinning or decoration. If a motion does not explain something, remove it.

**Words**
- `title`: a few words. `steps`: one short sentence each, plain language; they are the captions
  under the drawing. `description`: the whole animation in one or two sentences for people who
  cannot see it.
- Numbers only if the chapter states them; say "toy" when a number comes from a toy.

## Primitives at a glance

| Primitive | What for | Key props |
|---|---|---|
| `Chip` | a token, word or id | `x y text tone variant(soft/solid/outline) size width active sub` |
| `Label` | any text | `x y tone size anchor weight mono` |
| `Dot` | a point, sample, particle | `x y r tone hollow` |
| `Box` | a part of a system | `x y w h label sub tone filled active` |
| `Cells` | a vector, an embedding, a mask | `x y values[0..1] tone cell gap direction` |
| `Arrow` | "goes into", "becomes" | `from to bend tone drawn flow dashed width` |
| `Path` | any line or outline that draws in | `d tone drawn dashed fill` |
| `Bracket` | a length or span with a label | `x1 x2 y label` |
| `Move` | move/scale/fade a group | `x y scale rotate opacity` |
| `Arm`, `reach()` | the robot arm; `reach(base, target)` gives the angles | `base angles lengths open` |
| `Gripper` | a gripper on its own | `x y open angle` |
| `Thing` | cube, can, nut, tee on the table | `kind x y tone active` |
| `Axes`, `Line`, `Bar`, `Timeline` | sketch charts and time | see `primitives/chart.tsx` |

Every primitive also takes `opacity`, `delay` (ms) and `enter`.

You may draw plain SVG too (`<rect className="t-failure a-fill-soft" />`); give it a tone class
and the `a-t` class if it should transition.

## Checking an animation

1. `npm run dev`, open the lesson, watch it loop once. Click each pip: every step must read on its
   own, with nothing overlapping.
2. Switch the theme (header button). Both themes must read.
3. Phone width (375 px): text still legible.
4. Reduced motion (browser devtools, Rendering, "prefers-reduced-motion: reduce"): the still step
   must explain the idea by itself.
5. `npm run lint`, `npx tsc --noEmit`, `npm run build`.
