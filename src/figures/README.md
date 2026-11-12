# Figures

The interactive figures of the tutorial. A chapter asks for one by id:

```markdown
<!-- interactive: flow-matching -->
*Figure: points of noise carried to two targets by the learned flow.*
```

The ids are fixed by the table in the tutorial's `STYLE.md`. Each id has one folder here, and the
site shows that folder's component wherever a chapter names the id, inside the shared frame, with
the chapter's sentence as the caption.

```
src/figures/
  catalog.ts          the ids, with each figure's title, what it shows and its stamp (data only)
  registry.ts         id -> lazily loaded component; do not edit to build a figure
  Figure.tsx          what the Markdown pipeline renders for a placeholder (server)
  FigureMount.tsx     looks up the component, supplies number and caption, catches errors (client)
  FigureNotice.tsx    the frame shown in place of a figure that failed to load or draw
  kit/                the frame, the controls, the hooks and the chart primitives
  placeholder/        the stand-in used by every figure that is not built yet
  <id>/index.tsx      one folder per figure, one per id of catalog.ts
```

## Building a figure

**Replace the contents of `src/figures/<id>/` and nothing else.** The folder's `index.tsx` must
default-export a client component that takes `FigureProps` and renders inside `<FigureFrame>`:

```tsx
"use client";

import { useState } from "react";
import { FIGURES, FigureFrame, Slider, type FigureProps } from "@/figures/kit";
import curve from "@/data/tolerance.json";

const info = FIGURES.tolerance;

export default function ToleranceFigure({ caption }: FigureProps) {
  const [offset, setOffset] = useState(10);
  return (
    <FigureFrame
      title={info.title}
      stamp={info.stamp}
      caption={caption}
      controls={<Slider label="Offset" min={0} max={30} step={5} value={offset} onChange={setOffset} format={(v) => `${v} mm`} />}
      status={`Offset ${offset} mm.`}
      note="320 episodes per offset, one simulator build."
    >
      {/* the drawing */}
    </FigureFrame>
  );
}
```

Add more files to the folder as the figure needs them (`geometry.ts`, `Chart.tsx`, ...). The
registry, the catalog, the chapter pipeline and the gallery already know the id.

A complete worked example is `kit/Specimen.tsx`: every control, the chart primitives, sizing from
the container, pausing off screen and the reduced-motion behaviour, in about 200 lines. It is shown
at the end of `/figures`. Copy from it.

## The contract

**Props.** `{ caption?: string }` and nothing more. The caption is the chapter's sentence as plain
text; pass it to `<FigureFrame caption={caption}>`. Do not read the figure number or build an
anchor: the frame gets the number ("Fig. 41.2"), the anchor and the caption's inline formatting
from the place the figure is shown in. The same component is shown by several chapters with
different captions, and on `/figures` without a number.

**Data.** Measured numbers live in `src/data/<name>.json` and are imported statically
(`import data from "@/data/<name>.json"`). They are copied from the lab notebook, never typed into
a component, and a figure stamped "measured" says in its `note` what they were measured on. A run
the notebook lists as in progress has no value and is drawn as missing. A figure stamped "computed"
runs the real algorithm on a toy input in the browser; one stamped "schematic" is a drawing.

**Theme.** Colours come from the CSS variables in `src/app/globals.css` and from nowhere else: no
hex values, no `dark:` variants, no reading the theme in JavaScript. Use the Tailwind names
(`text-ink`, `bg-surface-2`, `border-line-strong`, `fill-vision`, `stroke-action`) or
`var(--series-1)` and friends, and both themes follow. `kit/chart/series.ts` has the fixed colour
and marker for each object and policy (`OBJECT_SERIES`, `POLICY_SERIES`), the modality hues and the
sequential scale. Series hues are for data charts and modality hues for schematic figures; a figure
uses one set, never both. Text is drawn in ink, never in a series colour. If a figure needs a
resolved colour (canvas, WebGL), use `readToken` and `subscribeToTheme` from `@/lib/theme`.

**Size.** A figure fills the width it is given and must work from 320 px (about 270 px of stage
inside the frame) to the 960 px figure column. It never causes the page to scroll sideways; a
drawing that cannot shrink scrolls inside its own stage (`stageClassName="overflow-x-auto"`). Size
from the container, not the window: `useElementSize(ref)` gives the stage's width, and an SVG drawn
with `viewBox` set to that width keeps 13 px text at 13 px. Until the first measurement, and in the
static HTML, the width is 0, so fall back to a default (the specimen uses 640). Give the drawing its
final height from the start, or the page jumps when it is redrawn at the measured width: a fixed
pixel height, or, for a height that follows the width, `chartHeight({ min, ratio, max })` on the
`<svg>` inside a `[container-type:inline-size]` box, with the same numbers in the drawing (the
specimen does this). Controls are 32 px high and 44 px on touch screens; the kit's controls already
are.

**Motion.** Motion shows a process or confirms an action; nothing moves for decoration.
- Autoplay at most once, when the figure has arrived: `useInView(ref, { amount: 0.6, once: true })`.
- Pause when it leaves or the tab is hidden: `useInView(ref, { amount: 0.25 })`, `usePageVisible()`.
- Reduced motion (`useReducedMotion()`): show the finished state, never autoplay, and keep every
  control working. Previous, Next and the sliders change the drawing at once; hide the Play button
  (`className="motion-reduce:hidden"`). The global stylesheet already cuts CSS transitions short.
- Animate transform, opacity and SVG path attributes only. `motion/react` for interface state,
  GSAP (`useGSAP`, one timeline per figure) for scrubbable timelines, never both on one element.
  three.js only in `arm-replay`, imported dynamically inside the component.
- Durations and easings are in `DESIGN.md`, section 6.

**No network.** A figure makes no requests: no fetch, no remote fonts, images or scripts. Its data
is the JSON it imports.

**No outside state.** Everything a figure remembers is inside the component: no global variables,
no stores, no `localStorage`, no URL parameters. Two copies of a figure on one page are independent.
Give form controls a unique `name` or `id` with `useId()` (the kit's controls do).

**Accessibility.** Every control is reachable and usable with the keyboard, and shows the focus
ring. A drawing is `role="img"` with an `aria-label` that says what it shows in its current state,
or `aria-hidden` when the frame's `status` and the caption already say it. State changes go in the
frame's `status` line, which screen readers announce. Colour never carries meaning alone: pair it
with a shape, a label or a position.

**Server rendering.** A figure is a client component whose code loads in its own chunk, and it is
also drawn at build time: the static HTML of a chapter contains the figure in its first state, so
that state should already say something without JavaScript. Touch `window`, `document` and
measurement APIs only in effects and event handlers, and render the same markup on the server and
on the first client render.

## The kit

Import everything from `@/figures/kit`.

| | |
|---|---|
| `FigureFrame` | The frame: `title`, `stamp`, `caption`, and optionally `controls` (the control bar), `status` (announced when it changes), `note` (small print: source, caveat), `grid` (graph paper; on by default for schematic figures), `stageClassName`. |
| `Slider` | A native range input with a label and a live value. `format` turns the value into text. |
| `Toggle` | An on/off switch (a native checkbox). |
| `Stepper` | Previous and Next around "Step 3 of 10". |
| `Segmented` | One choice among a few, as joined segments (a native radio group). |
| `PlayButton`, `ControlButton` | Play, Pause or Replay; and a plain small button for Reset or "Show as table". |
| `useReducedMotion` | True when the reader asked for reduced motion. |
| `useInView`, `usePageVisible` | Whether the element is on screen; whether the tab is visible. |
| `useElementSize` | The element's width and height, kept up to date. |
| `scaleLinear`, `niceTicks`, `extent` | Data value to pixel position and back; round tick values. |
| `Axis`, `GridLines` | A bottom or left axis and gridlines, inside an `<svg>`. |
| `linePath` | The `d` of a path through points: linear, step or smooth. |
| `Marker`, `Legend` | A shaped data point; the key to a chart with two or more series. |
| `SERIES`, `OBJECT_SERIES`, `POLICY_SERIES`, `REFERENCE`, `MODALITY`, `SEQUENTIAL` | The colour assignments. |
| `StampMark` | The measured, computed or schematic mark with its word. |

The frame and control styles are in `kit/kit.css`. Chart rules (one y-axis, 2 px lines, markers of
at least 8 px, a legend for two or more series, dot and whisker for success rates) are in
`DESIGN.md`, section 9.

## Previewing

`/figures` shows every figure once, with a caption a chapter gives it and the list of chapters that
embed it, followed by the kit specimen. It is linked from the footer. Check a figure there in both
themes, at 320 px, with the keyboard only, and with reduced motion switched on; then open one of
the chapters that embeds it.

```bash
npm run dev          # then open /figures#<id>
npm run lint && npx tsc --noEmit && npm run build
```

A figure that throws while drawing is replaced by a notice and its caption, so the chapter still
reads; the error is in the browser console.

## Changing the list of figures

The list changes only when the table in the tutorial's `STYLE.md` changes. Then: add the entry to
`catalog.ts`, add its line to `registry.ts`, and create its folder. The type of the registry fails
the build while an id has no component.
