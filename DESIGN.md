# Design specification: VLA from scratch

Base: **Whiteprint**, an engineering drawing set bound into a handbook (whiteprint in light, blueprint in dark). Grafted from **Vellum and Blueprint**: one fixed hue per modality, a highlighter that means only "selected or current", and a three-way figure stamp.

## 1. Principles

1. **Reading first.** One 680px serif column. Text and layout never move on scroll.
2. **Provenance is the visual system.** Every number and figure says what kind of statement it is.
3. **Colour is rationed to meaning.** No gradients, shadows or glass.
4. **One bold element:** the hero plate.
5. **Numbers come from the notebook.** One generated module (`src/data/lab.ts`) feeds every table, chart and figure; a run in progress has no value field.
6. **Missing content never breaks a page.** Indexes are built from the chapter files; an unbuilt figure renders its Markdown description in the plate frame.

## 2. Colour tokens

Custom properties on `:root`; dark under `:root[data-theme="dark"]` and `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`. An inline script sets `data-theme` from `localStorage` before paint. Map into Tailwind with `@theme inline`.

| Variable | Light | Dark | Role |
|---|---|---|---|
| `--bg` | #F4F6F8 | #0C1726 | page |
| `--surface` | #FFFFFF | #132237 | plates, code, table bodies |
| `--surface-2` | #E9EDF2 | #1B2E48 | table head, inline code, slider track |
| `--text` | #141D2B | #E3EBF4 | body, headings (15.6 / 15.0 on bg) |
| `--text-muted` | #48566A | #A5B5C9 | secondary prose, nav (6.9 / 8.6) |
| `--text-faint` | #5A687B | #8A9CB3 | captions, ticks, comments (at least 4.8 on every surface) |
| `--border` | #CDD5DF | #27405E | hairlines, row rules |
| `--border-strong` | #728197 | #6583A6 | plate frames, control outlines (at least 3.6) |
| `--grid` | #E3E8EE | #18293F | plate grid, chart gridlines |
| `--accent` | #2A43A6 | #93B7FF | links, focus ring, filled button (7.9 / 9.0) |
| `--accent-hover` | #1C2F7D | #BCD3FF | |
| `--accent-soft` | #E4E9F8 | #1A2F52 | current nav item, selected segment |
| `--on-accent` | #FFFFFF | #0C1726 | text on accent |
| `--mark` | #FFD84D | #FFD84D | highlighter fill behind the current or selected element, with a 1px `--text` outline; never a line or text colour |
| `--on-mark` | #141D2B | #0C1726 | text on mark |
| `--vision` | #00929B | #1FA7A0 | image, patch, vision token |
| `--language` | #2B62D9 | #5B8DEF | word, text token |
| `--action` | #C2500E | #D9742C | action, gripper path |
| `--success` | #177245 | #4FC48D | with a check glyph and a word |
| `--failure` | #B83227 | #FF8375 | with a cross glyph and a word |
| `--warning` | #8F5A00 | #F2B84B | draft, running; clock glyph and a word |

Modality hues appear only in schematic figures, always with a label. Series hues appear only in data charts. A plate never uses both sets.

**Series (fixed order, never cycled), light / dark:** 1 blue #2B62D9 / #5B8DEF; 2 red #D6452B / #C93C3C; 3 green #12936A / #1FA884; 4 yellow #BF9000 / #B38C00; 5 violet #7A4FD6 / #9C7CF0; 6 magenta #CF4A8E / #D6609C. Validated on `--surface` in both themes. Light yellow is 2.91:1, so it always has a shaped marker and a direct label.
**Object identity:** blue hex nut = 1, hexagon; red cube = 2, square; green can = 3, circle; yellow T block = 4, T glyph.
**Policy identity:** patch-token ViT without language = 1; pooled CLIP = 2; ViT with instruction tokens = 3; Qwen VLA = 4; custom VLA pretrained = 5; custom VLA random-init = 6. Never colour by object and by policy in one chart: facet by one.
**Reference series** (expert, 33% chance): `--text-muted`, dashed.
**Sequential** (attention), low to high: light #EEF2FC, #C9D6F5, #9DB5EC, #6C8FE0, #2B62D9, #1C2F7D; dark #132237, #1F3A66, #2C5299, #4A77D4, #7FA6F5, #C7DAFF.
**Syntax:** keyword #7A3FB5 / #C3A6FF; string #17694A / #7FD6AA; number #A24A00 / #FFB37A; function `--accent`; comment `--text-faint` italic.
**Focus:** 2px solid `--accent`, 2px offset, on every interactive element.

## 3. Typography

`next/font/google`, latin subset, each exposed as a CSS variable.

- **Archivo** (`axes: ['wdth']`, `--font-archivo`): headings, interface, labels, tables, figure text. Width is set with `font-stretch`.
- **Source Serif 4** (`axes: ['opsz']`, normal and italic, `--font-source-serif`): body.
- **IBM Plex Mono** (400, 500, 600; italic 400, `--font-plex-mono`): code and tensor shapes only.
- Math: KaTeX, self-hosted fonts, 1.05em; display math left-aligned, 24px indent.

Scale (px): 13, 14, 15, 16, 18, 20, 24, 28, 36, 44; hero `clamp(48px, 7vw, 88px)`.

| Element | Setting |
|---|---|
| Body | Source Serif 4, 18/30, measure 680px (about 72 characters), paragraph gap 20px; phones 17/28 |
| Hero h1 | Archivo 700, stretch 80%, line-height 0.95, tracking -0.02em |
| Chapter h1 | Archivo 600, stretch 90%, 44/48 (phones 32/36) |
| h2 | Archivo 600, stretch 95%, 28/34, 64px above, 1px `--border` rule, section number (41.2) in the gutter |
| h3, h4 | 20/26 and 16/22, weight 600 |
| Lead | serif 20/30 |
| Labels, badges, axis text | Archivo 500, stretch 80%, 13/17, sentence case, tabular lining figures |
| Nav, sidebar, captions | Archivo 14/20 |
| Tables | Archivo, stretch 88%, 15/21; head 13px 600; numbers right-aligned, tabular |
| Code | Plex Mono 14/22, tab-size 4; inline 0.88em on `--surface-2` |

Never below 12px or narrower than 80%; no all-caps. Links: `--accent`, 1px underline, 3px offset.

## 4. Spacing and grid

4px unit; steps 4, 8, 12, 16, 24, 32, 48, 64, 96. Page max 1360px; gutters 16px (under 640), 24px (640 to 1023), 32px (1024 up). Radius 2px on plates and code, 3px on controls. `scroll-margin-top: 80px` on headings and figures.

Chapter grid, centred:

```
>=1280:    272 sidebar | 48 | 680 text | 32 | 248 margin
1024-1279: 240 sidebar | 48 | 680 text      (margin notes fold inline)
<1024:     one column; sidebar is a dialog drawer; 44px sticky section bar
```

Prose, code and tables are 680px. Figures, Mermaid and wide blocks are 960px.

## 5. Components

**Header.** 56px, sticky, `--bg`, 1px bottom border. Wordmark; Chapters, Lab, GitHub, theme toggle; a menu dialog under 768px. Skip link first.

**Footer.** Both repositories, licence, and: "Every number on this site is copied from the lab notebook."

**Curriculum index** (landing and `/learn`). A contents page, not cards. Sticky 240px list of parts; chapter rows with order number, title, summary, figure count and a Draft badge. Unwritten parts read "In preparation". `/learn` adds a filter by part.

**Chapter page.** Sidebar: parts as collapsible groups (`aria-expanded`); the current chapter expands to its h2 sections with scroll-spy (2px `--accent` bar, `--accent-soft` fill). This is the only table of contents. Header: order number (44px, `--text-faint`), part, h1, summary as lead, then status, reading time, figures, "View source on GitHub". Footer: previous and next rows.

**Provenance callouts.** Generated from the fixed sections and "Background:" paragraphs: a glyph and label in the margin column (inline above the block under 1280px), a 2px `--border-strong` left rule, no tinted box.
- Filled square, **Measured here**: links to the lab row.
- Bracket, **In this repository**: repository-relative file links to GitHub.
- Open circle, **Background**: background paragraphs and the reading list.

"Where it goes wrong" is a definition grid (What you see, Why, How to check, What to do).

**Code block.** `--surface`, 1px `--border`, 32px strip with language or path and a Copy button ("Copied" for 1.5 s). Long lines scroll. Highlighted lines: `--accent-soft` with a 2px `--accent` edge.

**Table.** Cells 8px 12px, 1px `--border` row rules, `--border-strong` under the head. `overflow-x: auto`; sticky first column under 640px.

**Figure plate** (`FigureFrame`, shared by all 17 figures, Mermaid and lab charts). `<figure>` on `--surface` with a 1px `--border-strong` frame.
- Header strip, 36px: "Fig. 41.2", title, and a required stamp: filled square **Measured** (links to lab rows), half square **Computed** (the real algorithm running on a toy input), open circle **Schematic**.
- Stage: 16:9, at least 280px high, 24px padding. Schematic plates get a graph-paper grid (8px minor, 40px major, `--grid`); charts do not.
- Control bar: Play or Pause, Previous step, Next step, Reset; native range sliders with label and live value; radio groups as segments; "Show as table" on data figures. Targets 32px, 44px on touch. An `aria-live="polite"` line states the current step.
- `<figcaption>`: the sentence that stands in for the figure on GitHub.
- Sizes are dimension lines with a value and unit (px, mm, tokens, steps); shapes are Plex Mono tags.

## 6. Motion

Motion shows a process or confirms an action. No scroll entrances, parallax or hover lifts.

| Kind | Duration | Easing |
|---|---|---|
| Micro (tooltip, copy, theme cross-fade) | 80 to 120 ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Interface (sidebar group, drawer) | 160 to 200 ms | same; exits 120 ms `cubic-bezier(0.4, 0, 1, 1)` |
| Explanatory beat | 500 to 700 ms, stagger up to 60 ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Line drawing | 800 ms | `cubic-bezier(0.65, 0, 0.35, 1)` |
| Simulated time (gripper, 20 Hz playback, loss curve) | scaled from real steps | linear |
| Drag release | spring, stiffness 400, damping 40 | |

Animate transform, opacity and SVG path attributes only. `motion/react` for interface state; GSAP (`useGSAP`) for scrubbable timelines, one per figure; never both on one element. three.js only in `arm-replay`, dynamically imported. Timelines pause below 25% visibility and in hidden tabs. Autoplay runs once, after 60% visibility for 400 ms.

**Reduced motion.** No autoplay. The hero and every figure render their finished state; Previous and Next change state instantly; sliders still work. Transitions collapse to 0.01 ms except fades of 80 ms or less.

## 7. Landing page

1. **Hero plate: "One control cycle, drawn in plan."** Text in columns 1 to 5 (h1, one sentence, "Start at chapter 0", "Open the lab notebook"); plate in columns 6 to 12; stacked under 1024px. One inline SVG (720 x 540) with GSAP: a plan of the `pick_target` table draws itself (0 s); the instruction splits into `--language` token chips (1 s); a 16 x 16 `--vision` patch grid sweeps the camera inset and the named object's patches take `--mark` (2 s); 15 noise points travel over 10 flow steps onto a path, 8 turn solid `--action` and the gripper executes them, 7 stay dashed, then it re-plans (3 s); the jaws close and a dimension line reports the measured miss (6 s). About 7 s, once. Controls outside the SVG: "Scripted expert" (5 mm, 100/100) or "Policy without language" (185 mm, 1/100), an object picker, Replay. Caption: layout illustrative; distances and counts measured, linked to lab rows.
2. **Evidence table.** Notebook rows, not stat tiles: Policy, Task, Successes / episodes, 95% interval, and an inline 0 to 100% track with dot and whisker. Rows link to lab anchors.
3. **The route.** The `pipeline` figure, wide.
4. **Contents.** The curriculum index.
5. **List of figures.** Four columns (two under 768px) of static line thumbnails with title and host chapter.
6. **Footer.**

## 8. Lab page (`/lab`)

Title, data-file date, and a Conventions list (closed-loop, unseen layouts, one seed, Wilson 95% intervals; hardware named only by GPU memory class). The sidebar lists the notebook sections. Each section is one 960px table with at most one chart above it: tolerance curves; `pick_cube` dot-and-whisker rows; named-object rate against a dashed 33% line, and by checkpoint. Rows have ids and permalinks; columns sort through `th` buttons with `aria-sort`; values stay as written ("37/50 = 74%"). Runs in progress show a Running badge and a hatched cell. Task and policy filters sit in one row above.

## 9. Charts

- One y-axis; two measures become two aligned panels with a shared crosshair.
- Lines 2px; markers at least 8px, shaped by entity; bars with a 2px gap; gridlines `--grid`; baseline `--border-strong`; ticks 13px `--text-faint`.
- Success rates are a dot with a Wilson whisker and the count beside it; single-seed results say so in the caption.
- A legend for two or more series; up to four also labelled at the line end. Text never wears a series colour.
- Annotations: 1px `--text-faint` leader lines ending in a 3px dot.
- Hover or focus: crosshair and tooltip; arrow keys move along a series.
