/**
 * Markdown-tree (mdast) steps of the chapter pipeline:
 *
 *   remarkFigures  <!-- interactive: id --> + "*Figure: ...*"  ->  <figure-embed>
 *   remarkLinks    relative links and image paths  ->  site and repository URLs
 */

import type { Root, RootContent, Paragraph, PhrasingContent, Parent } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit, SKIP } from "unist-util-visit";
import { resolveLink } from "./links";

const INTERACTIVE = /^<!--\s*interactive:\s*([\w-]+)\s*-->$/;
const CAPTION_PREFIX = /^\s*Figure:\s*/i;

export interface FigureOptions {
  /** Chapter number used in figure numbers ("41" gives Fig. 41.1, 41.2, ...). */
  chapterNumber: string;
}

/** A node mdast does not know about; remark-rehype renders it from `data`. */
interface CustomNode {
  type: string;
  children: PhrasingContent[];
  data: { hName: string; hProperties: Record<string, string> };
}

function isCaption(node: RootContent | undefined): node is Paragraph {
  if (!node || node.type !== "paragraph") return false;
  const first = node.children[0];
  return first?.type === "emphasis" && CAPTION_PREFIX.test(toString(first));
}

/** Unwraps the italic that marks the caption and drops the "Figure:" prefix. */
function captionChildren(paragraph: Paragraph): PhrasingContent[] {
  const children = paragraph.children.flatMap((child) =>
    child.type === "emphasis" ? child.children : [child],
  );
  const first = children[0];
  if (first?.type === "text") {
    const text = first.value.replace(CAPTION_PREFIX, "");
    first.value = text.charAt(0).toUpperCase() + text.slice(1);
  }
  return children;
}

export function remarkFigures(options: FigureOptions) {
  return (tree: Root) => {
    let count = 0;
    visit(tree, "html", (node, index, parent) => {
      const match = INTERACTIVE.exec(node.value.trim());
      if (!match || index === undefined || !parent) return;

      count += 1;
      const next = (parent as Parent).children[index + 1] as RootContent | undefined;
      const hasCaption = isCaption(next);
      const children = hasCaption ? captionChildren(next) : [];
      const caption = toString({ type: "paragraph", children }).replace(/\s+/g, " ").trim();

      const figure: CustomNode = {
        type: "figureEmbed",
        children,
        data: {
          hName: "figure-embed",
          hProperties: {
            id: match[1],
            caption,
            number: `${options.chapterNumber}.${count}`,
          },
        },
      };

      (parent as Parent).children.splice(index, hasCaption ? 2 : 1, figure as unknown as RootContent);
      return [SKIP, index + 1];
    });
  };
}

export interface LinkOptions {
  /** Title of the chapter with this slug, or undefined when there is no such chapter. */
  chapterTitle: (slug: string) => string | undefined;
}

export function remarkLinks(options: LinkOptions) {
  return (tree: Root) => {
    visit(tree, ["link", "image", "definition"], (node, index, parent) => {
      if (node.type !== "link" && node.type !== "image" && node.type !== "definition") return;
      const resolved = resolveLink(node.url);

      const title = resolved.kind === "chapter" && resolved.slug ? options.chapterTitle(resolved.slug) : undefined;

      // On GitHub a chapter is often cited by its file name; here the link reads as the chapter's title.
      if (node.type === "link" && title && toString(node) === `${resolved.slug}.md`) {
        node.children = [{ type: "text", value: title }];
      }

      // A link to a chapter that is not written yet stays as text, not as a dead link.
      if (node.type === "link" && resolved.kind === "chapter" && !title && index !== undefined && parent) {
        const pending: CustomNode = {
          type: "pendingLink",
          children: node.children,
          data: {
            hName: "span",
            hProperties: { className: "pending-link", title: "This chapter is not written yet" },
          },
        };
        (parent as Parent).children[index] = pending as unknown as RootContent;
        return;
      }

      node.url = resolved.href;
    });
  };
}
