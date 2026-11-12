/**
 * HTML-tree (hast) steps of the chapter pipeline:
 *
 *   rehypeMermaid    ```mermaid blocks        ->  <mermaid-diagram chart="...">
 *   rehypeHighlight  other fenced code        ->  Shiki tokens, data-language on <pre>
 *   rehypeInlineCode short inline code        ->  class "nowrap"
 *   rehypeTables     numeric columns          ->  class "num" (right-aligned); a short first column -> "sticky-first"
 *   rehypeImages     a paragraph of one image ->  <figure class="image-figure">
 *   rehypeHeadings   h1-h6                    ->  ids, section numbers, provenance, outline
 */

import GithubSlugger from "github-slugger";
import type { Element, ElementContent, Root } from "hast";
import { toString } from "hast-util-to-string";
import { visit, SKIP } from "unist-util-visit";
import { grammarFor, highlight, labelFor } from "./highlighter";

function classList(node: Element): string[] {
  const value: unknown = node.properties.className;
  if (Array.isArray(value)) return value.map(String);
  return typeof value === "string" ? value.split(/\s+/) : [];
}

function isElement(node: unknown, tagName?: string): node is Element {
  const candidate = node as Element | undefined;
  return candidate?.type === "element" && (tagName === undefined || candidate.tagName === tagName);
}

/** The <code> inside a fenced block and its language tag. */
function fencedCode(pre: Element): { code: Element; language?: string } | undefined {
  const code = pre.children.find((child) => isElement(child, "code"));
  if (!isElement(code)) return undefined;
  const language = classList(code)
    .find((name) => name.startsWith("language-"))
    ?.slice("language-".length);
  return { code, language };
}

/** Longest paragraph, in characters, read as the sentence that introduces a diagram. */
const DIAGRAM_LEAD_LENGTH = 320;

/**
 * What a diagram is about, from the chapter around it: the nearest heading
 * above it (its title) and the paragraph just above it when that is a short
 * lead-in ("the forward pass of one optimiser step has these shapes:").
 */
function diagramContext(parent: Element | Root, index: number): { title?: string; lead?: string } {
  let lead: string | undefined;
  let nearest = true;
  for (let at = index - 1; at >= 0; at -= 1) {
    const node = parent.children[at];
    if (!isElement(node)) continue;
    if (nearest && node.tagName === "p") {
      const text = toString(node).trim().replace(/\s+/g, " ").replace(/[:.]$/, "");
      if (text && text.length <= DIAGRAM_LEAD_LENGTH) lead = text;
    }
    nearest = false;
    if (/^h[2-4]$/.test(node.tagName)) return { title: toString(node).trim(), lead };
  }
  return { lead };
}

export function rehypeMermaid() {
  return (tree: Root) => {
    const titles = new Map<string, number>();
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || index === undefined || !parent) return;
      const fenced = fencedCode(node);
      if (fenced?.language !== "mermaid") return;
      const chart = toString(fenced.code).trim();
      const context = diagramContext(parent as Element | Root, index);
      // A title the diagram gives itself (Mermaid's accTitle) wins over the heading above it.
      const own = /^\s*accTitle\s*:\s*(.+)$/m.exec(chart)?.[1]?.trim();
      const description = /^\s*accDescr\s*:\s*(.+)$/m.exec(chart)?.[1]?.trim();
      let title = own ?? context.title ?? "Diagram";
      const seen = (titles.get(title) ?? 0) + 1;
      titles.set(title, seen);
      if (seen > 1) title = `${title}, diagram ${seen}`;
      const diagram: Element = {
        type: "element",
        tagName: "mermaid-diagram",
        properties: { chart, title, lead: description ?? context.lead ?? "" },
        children: [],
      };
      parent.children[index] = diagram;
      return SKIP;
    });
  };
}

export function rehypeHighlight() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || index === undefined || !parent) return;
      const fenced = fencedCode(node);
      if (!fenced) return;

      const { code, language } = fenced;
      const meta = typeof code.data?.meta === "string" ? code.data.meta : "";
      const title = /(?:title|path|file)=(?:"([^"]+)"|(\S+))/.exec(meta);
      const label = title ? (title[1] ?? title[2]) : labelFor(language);
      const grammar = grammarFor(language);

      let pre = node;
      if (grammar) {
        const source = toString(code).replace(/\n$/, "");
        const highlighted = highlight(source, grammar);
        const shikiPre = highlighted.children.find((child) => isElement(child, "pre"));
        if (isElement(shikiPre)) {
          pre = shikiPre;
          delete pre.properties.style;
          delete pre.properties.tabindex;
        }
      }

      pre.properties.tabIndex = 0;
      pre.properties.dataLanguage = language ?? "";
      pre.properties.dataLabel = label;
      parent.children[index] = pre;
      return SKIP;
    });
  };
}

/** Short inline code (a tensor shape, a flag, a symbol) stays on one line; long paths may wrap. */
const NOWRAP_LENGTH = 28;

export function rehypeInlineCode() {
  return (tree: Root) => {
    visit(tree, "element", (node, _index, parent) => {
      if (node.tagName !== "code" || isElement(parent, "pre")) return;
      if (toString(node).length <= NOWRAP_LENGTH) {
        node.properties.className = [...classList(node), "nowrap"];
      }
    });
  };
}

const NUMBER = String.raw`[~<>≈]?\s*[-+−]?\d[\d,.]*\s*(?:%|[A-Za-zµ]{1,3})?`;
const NUMERIC_CELL = new RegExp(String.raw`^${NUMBER}(?:\s*(?:/|=|->|→|-|–|to)\s*${NUMBER})*$`);

/** Longest first-column text, in characters, that still reads as a row label (about a third of a phone's width). */
const STICKY_LABEL_LENGTH = 16;

function cells(row: Element): Element[] {
  return row.children.filter((child): child is Element => isElement(child, "td") || isElement(child, "th"));
}

function rows(section: ElementContent | undefined): Element[] {
  if (!isElement(section)) return [];
  return section.children.filter((child): child is Element => isElement(child, "tr"));
}

/** Longest paragraph, in characters, read as a table's lead ("Measured. Machine A, 1500 demonstrations."). */
const LEAD_LENGTH = 160;

/**
 * A name for a table from what stands before it: the paragraph just above it
 * when that is short (a table's lead), or else the nearest heading above it.
 */
function tableName(parent: Element | Root | undefined, index: number | undefined): string | undefined {
  if (!parent || index === undefined) return undefined;
  for (let at = index - 1; at >= 0; at -= 1) {
    const node = parent.children[at];
    if (!isElement(node)) continue;
    if (at === index - 1 || parent.children.slice(at + 1, index).every((between) => !isElement(between))) {
      if (node.tagName === "p") {
        const lead = toString(node).trim().replace(/[:.]$/, "");
        if (lead && lead.length <= LEAD_LENGTH) return lead;
      }
    }
    if (/^h[2-4]$/.test(node.tagName)) return toString(node).trim();
  }
  return undefined;
}

export function rehypeTables() {
  return (tree: Root) => {
    const used = new Map<string, number>();
    visit(tree, "element", (table, index, parent) => {
      if (table.tagName !== "table") return;

      // Name the table (a visually hidden caption) so a screen reader's list of tables tells them apart.
      const base = tableName(parent as Element | Root | undefined, index) ?? "Table";
      const count = (used.get(base) ?? 0) + 1;
      used.set(base, count);
      const name = count > 1 ? `${base} (table ${count})` : base;
      table.properties.dataLabel = name;
      if (!table.children.some((child) => isElement(child, "caption"))) {
        table.children.unshift({
          type: "element",
          tagName: "caption",
          properties: { className: ["sr-only"] },
          children: [{ type: "text", value: name }],
        });
      }
      const headRows = rows(table.children.find((child) => isElement(child, "thead")));
      const bodyRows = rows(table.children.find((child) => isElement(child, "tbody")));
      if (bodyRows.length === 0) return;

      const width = Math.max(...bodyRows.map((row) => cells(row).length));
      for (let column = 0; column < width; column += 1) {
        const texts = bodyRows.map((row) => toString(cells(row)[column] ?? { type: "text", value: "" }).trim());
        const filled = texts.filter(Boolean);
        const numeric = filled.length > 0 && filled.every((text) => NUMERIC_CELL.test(text));
        if (!numeric) continue;
        for (const row of [...headRows, ...bodyRows]) {
          const cell = cells(row)[column];
          if (cell && !cell.properties.align) {
            cell.properties.className = [...classList(cell), "num"];
          }
        }
      }

      // A first column of short labels may stay in place on a phone while the other columns scroll.
      const firstColumn = [...headRows, ...bodyRows].map((row) => toString(cells(row)[0] ?? { type: "text", value: "" }).trim());
      if (width > 2 && firstColumn.every((text) => text.length <= STICKY_LABEL_LENGTH)) {
        table.properties.className = [...classList(table), "sticky-first"];
      }

      // GFM alignment markers arrive as the obsolete align attribute.
      for (const row of [...headRows, ...bodyRows]) {
        for (const cell of cells(row)) {
          const align = cell.properties.align;
          if (align === "right") cell.properties.className = [...classList(cell), "num"];
          if (align === "center") cell.properties.className = [...classList(cell), "center"];
          delete cell.properties.align;
        }
      }
      return SKIP;
    });
  };
}

export function rehypeImages() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "p" || index === undefined || !parent) return;
      const content = node.children.filter((child) => !(child.type === "text" && !child.value.trim()));
      const image = content[0];
      if (content.length !== 1 || !isElement(image, "img")) return;

      const alt = typeof image.properties.alt === "string" ? image.properties.alt : "";
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: { className: ["image-figure"] },
        children: [
          image,
          ...(alt
            ? [
                {
                  type: "element" as const,
                  tagName: "figcaption",
                  properties: {},
                  children: [{ type: "text" as const, value: alt }],
                },
              ]
            : []),
        ],
      };
      parent.children[index] = figure;
      return SKIP;
    });
  };
}

export type Provenance = "measured" | "repository" | "background";

export interface Heading {
  depth: number;
  id: string;
  text: string;
  /** Section number for h2 headings ("41.2"). */
  section?: string;
}

export interface HeadingOptions {
  /** Chapter number used in section numbers. */
  chapterNumber: string;
  /** Filled with the chapter's headings, in document order. */
  headings: Heading[];
}

/** The three kinds of statement the style guide keeps apart, read off the fixed section names. */
function provenanceOf(text: string): Provenance | undefined {
  const title = text.toLowerCase();
  if (title.startsWith("what we measured") || title.startsWith("measured")) return "measured";
  if (title.startsWith("in this repository")) return "repository";
  if (title.startsWith("background")) return "background";
  return undefined;
}

export function rehypeHeadings(options: HeadingOptions) {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    let section = 0;
    visit(tree, "element", (node) => {
      const match = /^h([1-6])$/.exec(node.tagName);
      if (!match) return;
      const depth = Number(match[1]);
      const text = toString(node).trim();
      const id = slugger.slug(text);
      node.properties.id = id;
      node.properties.dataTitle = text;

      const heading: Heading = { depth, id, text };
      if (depth === 2) {
        section += 1;
        heading.section = `${options.chapterNumber}.${section}`;
        node.properties.dataSection = heading.section;
        const provenance = provenanceOf(text);
        if (provenance) node.properties.dataProvenance = provenance;
      }
      options.headings.push(heading);
    });
  };
}
