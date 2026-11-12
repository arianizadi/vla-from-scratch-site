/**
 * The notes through the site's Markdown pipeline, with two additions of their own:
 * "section 9" or "sections 10 and 11" in the text links to those entries, and the
 * ids of headings inside an entry are prefixed with the entry's id so that two
 * entries can both have, say, a "Why" heading. Build time only.
 */

import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { visit, SKIP } from "unist-util-visit";
import { getChapter } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown/pipeline";

export interface RenderContext {
  /** Entry numbers that exist on the page. */
  entries: ReadonlySet<number>;
  /** Prefix for heading ids inside this block. */
  idPrefix?: string;
}

const SECTION_REFERENCE = /\b(sections?|entr(?:y|ies))\s+(\d+(?:(?:\s*,\s*|\s+and\s+|\s+or\s+|\s*[-–]\s*)\d+)*)/gi;
const NOT_INSIDE = new Set(["a", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6"]);

function entryLink(number: number): Element {
  return {
    type: "element",
    tagName: "a",
    properties: { href: `#entry-${number}` },
    children: [{ type: "text", value: String(number) }],
  };
}

/** One text node with its entry numbers turned into links, or undefined when it names none. */
function linkReferences(text: string, entries: ReadonlySet<number>): ElementContent[] | undefined {
  const out: ElementContent[] = [];
  let at = 0;
  let changed = false;
  for (const match of text.matchAll(SECTION_REFERENCE)) {
    const start = match.index ?? 0;
    const numbersAt = start + match[0].length - match[2].length;
    out.push({ type: "text", value: text.slice(at, numbersAt) });
    let cursor = 0;
    for (const number of match[2].matchAll(/\d+/g)) {
      const value = Number(number[0]);
      const index = number.index ?? 0;
      out.push({ type: "text", value: match[2].slice(cursor, index) });
      if (entries.has(value)) {
        out.push(entryLink(value));
        changed = true;
      } else {
        out.push({ type: "text", value: number[0] });
      }
      cursor = index + number[0].length;
    }
    out.push({ type: "text", value: match[2].slice(cursor) });
    at = start + match[0].length;
  }
  if (!changed) return undefined;
  out.push({ type: "text", value: text.slice(at) });
  return out.filter((node) => node.type !== "text" || node.value !== "");
}

function postProcess(tree: Root, context: RenderContext): Root {
  visit(tree, (node, index, parent) => {
    if (node.type === "element") {
      if (context.idPrefix && typeof node.properties.id === "string" && /^h[1-6]$/.test(node.tagName)) {
        node.properties.id = `${context.idPrefix}-${node.properties.id}`;
      }
      return NOT_INSIDE.has(node.tagName) ? SKIP : undefined;
    }
    if (node.type !== "text" || index === undefined || !parent) return undefined;
    const replaced = linkReferences((node as Text).value, context.entries);
    if (!replaced) return undefined;
    (parent.children as RootContent[]).splice(index, 1, ...replaced);
    return [SKIP, index + replaced.length];
  });
  return tree;
}

function render(markdown: string): Root {
  return renderMarkdown(markdown, {
    chapterNumber: "",
    chapterTitle: (slug) => getChapter(slug)?.title,
  }).tree;
}

/** Block Markdown: paragraphs, tables, lists, code. */
export function renderBlock(markdown: string, context: RenderContext): Root {
  return postProcess(render(markdown), context);
}

/** One line of Markdown (a table cell, a title) without its paragraph. */
export function renderInline(markdown: string, context: RenderContext): Root {
  const tree = render(markdown);
  const paragraph = tree.children.find(
    (child): child is Element => child.type === "element" && child.tagName === "p",
  );
  return postProcess({ type: "root", children: paragraph ? paragraph.children : tree.children }, context);
}
