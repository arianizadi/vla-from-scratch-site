/**
 * The chapter pipeline: Markdown text in, an HTML tree (hast) and an outline out.
 *
 *   normalizeDisplayMath        $$...$$ written GitHub-style -> block form
 *   remark-parse                Markdown -> mdast
 *   remark-gfm                  tables, strikethrough, task lists, autolinks
 *   remark-math                 $...$ and $$...$$
 *   remarkFigures               interactive-figure placeholders -> <figure-embed>
 *   remarkLinks                 relative links -> site and repository URLs
 *   remark-rehype               mdast -> hast (raw HTML is dropped)
 *   rehype-katex                math -> KaTeX markup
 *   rehypeMermaid               ```mermaid -> <mermaid-diagram>
 *   rehypeHighlight             fenced code -> Shiki tokens
 *   rehypeInlineCode            short inline code stays on one line
 *   rehypeTables, rehypeImages  numeric columns, image figures
 *   rehypeHeadings              ids, section numbers, provenance, outline
 *
 * The whole run is synchronous. The custom elements (<figure-embed>,
 * <mermaid-diagram>) and the restyled ones (a, pre, table, h2...) are mapped to
 * React components in src/components/markdown/Markdown.tsx.
 *
 * To add a step: write a plugin in remark-plugins.ts or rehype-plugins.ts, add
 * it to the chain below, and if it emits a new element, add a component for it
 * in Markdown.tsx.
 */

import type { Root } from "hast";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { normalizeDisplayMath } from "./normalize";
import {
  rehypeHeadings,
  rehypeHighlight,
  rehypeImages,
  rehypeInlineCode,
  rehypeMermaid,
  rehypeTables,
  type Heading,
} from "./rehype-plugins";
import { remarkFigures, remarkLinks } from "./remark-plugins";

export type { Heading, Provenance } from "./rehype-plugins";

export interface RenderOptions {
  /** Number printed in section and figure numbers ("41" gives 41.1, 41.2, ...). */
  chapterNumber: string;
  /** Title of the chapter with this slug; links to chapters that do not exist stay as text. */
  chapterTitle: (slug: string) => string | undefined;
}

export interface RenderedMarkdown {
  tree: Root;
  headings: Heading[];
}

export function renderMarkdown(markdown: string, options: RenderOptions): RenderedMarkdown {
  const headings: Heading[] = [];

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkFigures, { chapterNumber: options.chapterNumber })
    .use(remarkLinks, { chapterTitle: options.chapterTitle })
    .use(remarkRehype)
    .use(rehypeKatex, { strict: false })
    .use(rehypeMermaid)
    .use(rehypeHighlight)
    .use(rehypeInlineCode)
    .use(rehypeTables)
    .use(rehypeImages)
    .use(rehypeHeadings, { chapterNumber: options.chapterNumber, headings });

  const tree = processor.runSync(processor.parse(normalizeDisplayMath(markdown)));
  return { tree, headings };
}
