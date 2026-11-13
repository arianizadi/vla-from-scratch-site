# VLA from scratch: the site

The website for [vla-from-scratch](https://github.com/arianizadi/vla-from-scratch), a hands-on guide
to the models behind robot manipulation (language model, vision-language model, vision-language-action
policy). The experiments, the code and the chapters live in that repository; this one presents
the chapters with figures and, later, the lab notebook as tables and charts.

> **Status:** work in progress. The design system, the chapter pipeline, the landing page, the
> figure kit and the figure gallery are in place. The 17 interactive figures are placeholders
> waiting to be built one by one, and the lab page is a stub.

## Stack

Next.js (App Router, every route prerendered), React, TypeScript, Tailwind CSS 4. Chapters are plain
Markdown rendered on the server with unified (remark, rehype), KaTeX and Shiki; Mermaid diagrams are
drawn in the browser. GSAP drives figure timelines. The design is specified in
[DESIGN.md](DESIGN.md).

## Develop

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Content

The chapters are written in the tutorial repository and copied here, so the site builds without it:

```bash
npm run sync                               # from ../vla-from-scratch
TUTORIAL_REPO=/path/to/repo npm run sync   # from another checkout
```

| From the tutorial repository | To this repository |
|---|---|
| `tutorial/chapters/*.md` | `content/chapters/` |
| `tutorial/lab-notebook.md` | `content/lab-notebook.md` |
| `tutorial/img/**` | `public/tutorial/img/` |

The copy is one-way: a chapter that is gone from the tutorial is removed here. Chapter files follow
the tutorial's `STYLE.md`: YAML front matter (`title`, `part`, `order`, `summary`, `status`),
GitHub-flavoured Markdown, `$...$` math, `mermaid` blocks and interactive-figure placeholders.

The chapters are still being written. A file that cannot be used yet (empty, front matter missing
or not closed, no title or part, no text, or a body the pipeline cannot render) is left out of the
site with a warning in the build log; it never fails the build. `npm run sync` names such files
when it copies them.

The sync also checks the numbers on the landing page. They live in `src/data/findings.json`, each
with the passages of the lab notebook it was copied from; if a passage is no longer in the
notebook, the sync says which and exits with status 2. Update the entry from the notebook then.

`98-*.md` and `99-*.md` in `content/chapters/` are reserved for pipeline samples that exist only in
this repository. The sync keeps them while the tutorial has no chapters and removes them once it
has one.

## Lessons

Every chapter page shows a short lesson first, when the chapter has one: an idea in one
sentence, a few beats each with an SVG animation, edge cases, tips and a takeaway. The full,
synced chapter is at `/learn/<slug>/full`. A lesson is one folder, `src/lessons/<slug>/`, found
automatically; [AUTHORING.md](AUTHORING.md) explains how to write one, and the build checks the
format.

## Figures

A chapter asks for an interactive figure by id (`<!-- interactive: flow-matching -->`). Each of the
17 ids has a folder, `src/figures/<id>/`, that holds its component; all of them start as a
placeholder. To build a figure, replace the contents of its folder and nothing else. The contract,
the kit of shared parts and a worked example are described in
[src/figures/README.md](src/figures/README.md). Every figure can be reviewed at `/figures`, which
is linked from the footer.

## Where things are

| Path | What |
|---|---|
| `src/app/globals.css` | design tokens, Tailwind theme, the prose layer |
| `src/lessons/<slug>/` | a chapter's lesson (short, animated); found automatically, see [AUTHORING.md](AUTHORING.md) |
| `src/animations/` | the animation kit for lessons ([README](src/animations/README.md)) |
| `src/components/lesson/` | the lesson page |
| `src/lib/content.ts` | lists and loads chapters |
| `src/lib/markdown/pipeline.ts` | the Markdown pipeline, step by step |
| `src/components/markdown/Markdown.tsx` | maps the pipeline's elements to components |
| `src/figures/` | the figures: catalog, registry, one folder per figure, the placeholder |
| `src/figures/kit/` | the figure frame, controls, hooks and chart primitives |
| `src/app/figures/page.tsx` | the figure gallery |
| `src/data/findings.json`, `src/data/lab.ts` | every measured number shown on the site, with its source passage |
| `scripts/sync-content.mjs` | copies chapters, lab notebook and images from the tutorial |

## Check

```bash
npm run lint
npx tsc --noEmit
npm run build
```
