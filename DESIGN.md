# Design specification: VLA from scratch

Direction: **ink and signal**. Cool paper and ink for everything structural; colour appears only
as signal — what a thing is made of (words, images, actions), what is "now", and what can be
pressed. The memorable element is motion that explains: every idea has a small SVG animation,
and the page around it stays quiet.

## 1. Principles

1. **One idea at a time.** A lesson is a handful of beats: a few sentences beside one animation.
   The full chapter is one click away for every detail.
2. **Motion explains or it goes.** Animations show a process; the interface only confirms
   actions (press, open, hover). No scroll-triggered entrances, parallax or decorative loops.
3. **Colour is rationed to meaning** (section 2). Never colour alone: a word or a shape goes with it.
4. **Numbers come from the notebook.** `src/data/*` feeds every measured number; lessons state a
   number only if their chapter does.
5. **Every animation has a still.** Reduced motion, no JavaScript and print show a composed
   final frame that explains the idea by itself.
6. **Missing content never breaks a page.** A chapter without a lesson shows the full chapter.

## 2. Colour tokens

Custom properties on `:root`; dark under `:root[data-theme="dark"]` and under
`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` (keep both blocks equal).
An inline script sets `data-theme` before paint. Plain hex values (client code reads them with
`readToken`). Tailwind maps them through `@theme inline` (`bg-page`, `text-ink`, ...).

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | #F3F4F7 | #10131A | page (cool paper) |
| `--surface` | #FFFFFF | #181C25 | cards, stages, code, tables |
| `--surface-2` | #E9EBF1 | #232835 | chips, inline code, tracks |
| `--text` | #15171E | #ECEEF3 | ink: body, headings, primary button |
| `--text-muted` | #4E5563 | #AAB1C0 | secondary text |
| `--text-faint` | #5F6676 | #8F97A8 | captions, numbers in lists (4.5:1 or more) |
| `--border` / `--border-strong` | #DADDE5 / #868D9C | #2A303D / #5F6879 | hairlines / outlines |
| `--accent` | #4F2FE0 | #B3A3FF | violet: links, focus ring, "has a lesson", the one thing to follow |
| `--mark` | #FFD43B | #FFD43B | highlighter: "this one, now"; takeaway underline |
| `--language` | #2D5BE3 | #7096FF | words, tokens |
| `--vision` | #0A8F80 | #2CC2AE | images, patches |
| `--action` | #DC5317 | #FF8B4D | actions, trajectories |
| `--success` / `--failure` / `--warning` | | | states, always with a glyph and a word |

`--language-soft`, `--vision-soft`, `--action-soft`, `--mark-soft` are 14–45% tints for fills.
Data series (`--series-1..6`), the sequential scale and syntax colours are unchanged from the
data figures: a run keeps its policy's hue in every chart (section 8).

## 3. Typography

`next/font/google`, exposed as CSS variables in `src/app/layout.tsx`.

- **Bricolage Grotesque** (`--font-display`; axes `opsz`, `wdth`): headings, big numbers,
  numerals. Large sizes at 80–88% width, weight 700–800, tight tracking (−0.03em).
- **Atkinson Hyperlegible Next** (`--font-sans`, also mapped to the old `--font-serif` role):
  body and interface. Drawn for legibility, which suits a site that teaches.
- **Atkinson Hyperlegible Mono** (`--font-mono`): tokens, ids, code.

Scale: hero `clamp(3rem, 6.4vw, 6.25rem)`; page titles `clamp(2.5rem, 6vw, 4.5rem)`; lesson
title up to 76px; section titles up to 52px; beat titles 24–32px; body 17–18px / 1.65;
captions 14–15px; never below 13px. Sentence case everywhere; no all-caps labels.

## 4. Layout and shape

4px unit. Page max 1360px; gutters 16 / 24 / 32px. Radius follows hierarchy: stage and big
cards 20px, cards and tables 14px, controls 10px, chips 6px, buttons and filter chips are pills.
No shadows; surfaces separate by tone and a 1px border.

- **Lesson** (`/learn/<slug>`): sidebar (parts, current chapter expanded to its beats) | lesson.
  The lesson is a container: from 760px wide each beat is text (5 parts, sticky) beside its
  animation (7 parts); below, they stack.
- **Full chapter** (`/learn/<slug>/full`): sidebar | 680px prose, figures 960px; a pill banner
  links back to the lesson.
- Header 56px, translucent paper with a hairline; nav items are pills, the current one outlined.

## 5. Components

- **Lesson** (`src/components/lesson`): kicker (part pill, chapter number), title, the idea as a
  lead, fact pills; numbered beats (outlined numerals, display titles); edge cases and quick
  tips side by side; the takeaway in display type under a highlighter that sweeps in on scroll
  (static where scroll timelines are unsupported or motion is reduced); "Try it" figures; "Go
  deeper" (an ink card to the full chapter, lab links, related chapters); previous/next.
- **Animation frame** (`src/animations`, documented in its README): 20px-radius stage on a dot
  grid; title and round play/replay buttons on top; step pips (the current one fills over its
  hold time) and the step caption below. `variant="bare"` for heroes.
- **Figure plate** (`src/figures/kit`): the interactive figures keep their frame, now 14px radius,
  display-face titles and pill segment controls. They appear in full chapters, in lessons as
  "Try it", and at `/figures`.
- **Buttons**: pills. Primary is ink and turns violet on hover; secondary is paper with an outline.
- **Focus**: 2px `--accent` outline, 2px offset, everywhere.

## 6. Motion

| Kind | Duration | Easing |
|---|---|---|
| Micro (hover, press, theme) | 100 ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Interface (drawer, card arrow) | 180 ms | same |
| Animation move (position, opacity, colour) | 600 ms, stagger 50 ms | same |
| Line drawing | 800 ms | `cubic-bezier(0.65, 0, 0.35, 1)` |
| Step hold / last step | 2.2 s / 3.2 s | — |
| Loop restart | 260 ms fade | — |

Animate transform, opacity, fill and stroke offsets only. Explanation animations are CSS
transitions between step states (no per-frame JavaScript); GSAP and `motion/react` remain in the
interactive figures that use them. Animations play at 45% visibility, pause off screen and in
hidden tabs. Reduced motion: no autoplay, transitions collapse, every animation shows its still.

## 7. Pages

- **Landing**: hero (promise, two ways in, the whole loop as one animation: words and pixels in,
  an action out, the named object lifted); lessons to start with; what you will build (three
  models with their measured result, then every part with its chapters, lessons marked);
  what the experiments showed (three big numbers from `findings.json`, the measured onset plate,
  the findings one line each); field notes; run it yourself; status.
- **/learn**: big title, counts, part filter (pills), part sections of chapter rows; a row with a
  lesson shows its idea and an "Animated lesson" badge.
- **/lab**: title, lead, data date; at a glance (big numbers, the newest films); conventions;
  then every notebook section unchanged (section 8).
- **/notes**, **/figures**: shared page header; content as before.

## 8. Lab page (`/lab`)

Title, data-file date, the at-a-glance band, and a Conventions list (closed-loop, unseen layouts,
one seed, Wilson 95% intervals). The sidebar lists the notebook sections. Each section is one
960px table with at most one chart above it: tolerance curves; `pick_cube` dot-and-whisker rows;
named-object rate against a dashed 33% line, and by checkpoint. Rows have ids and permalinks;
columns sort through `th` buttons with `aria-sort`; values stay as written ("37/50 = 74%"). Runs
in progress show a Running badge and a hatched cell. Task and policy filters sit in one row above.

## 9. Charts

- Reserve the final height from the first paint: a fixed pixel height, or `chartHeight()` with container units for a height that follows the width. Nothing below a figure moves when it hydrates or its data arrives.
- One y-axis; two measures become two aligned panels with a shared crosshair.
- Lines 2px; markers at least 8px, shaped by entity; bars with a 2px gap; gridlines `--grid`; baseline `--border-strong`; ticks 13px `--text-faint`.
- Success rates are a dot with a Wilson whisker and the count beside it; single-seed results say so in the caption.
- A legend for two or more series; up to four also labelled at the line end. Text never wears a series colour.
- Annotations: 1px `--text-faint` leader lines ending in a 3px dot.
- Hover or focus: crosshair and tooltip; arrow keys move along a series.
- Colour follows identity, never selection or order: a run's hue and marker are its policy's (`POLICY_SERIES`).
