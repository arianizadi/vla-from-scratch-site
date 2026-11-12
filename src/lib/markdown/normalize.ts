/**
 * Text-level fixes applied before parsing.
 *
 * GitHub accepts display math written as `$$ ... $$` with the delimiters on the
 * same lines as the formula, on one line or across several. remark-math only
 * treats `$$` as a block when each delimiter has a line to itself, and an
 * unclosed opener swallows the rest of the document. This pass rewrites every
 * such formula into the block form; fenced code is left alone.
 */

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const OPEN_WITH_CONTENT = /^ {0,3}\$\$(.+)$/;
const BARE = /^ {0,3}\$\$\s*$/;

export function normalizeDisplayMath(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let fence: string | undefined;
  let inMath = false;

  const openBlock = () => {
    if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
    out.push("$$");
  };
  const closeBlock = () => {
    out.push("$$", "");
  };

  for (const line of lines) {
    if (fence) {
      out.push(line);
      if (line.trimStart().startsWith(fence) && line.trim().replace(/^[`~]+/, "") === "") fence = undefined;
      continue;
    }

    if (inMath) {
      if (BARE.test(line)) {
        closeBlock();
        inMath = false;
      } else if (line.trimEnd().endsWith("$$")) {
        const content = line.trimEnd().slice(0, -2).trimEnd();
        if (content) out.push(content);
        closeBlock();
        inMath = false;
      } else {
        out.push(line);
      }
      continue;
    }

    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(line);
      continue;
    }

    if (BARE.test(line)) {
      openBlock();
      inMath = true;
      continue;
    }

    const open = OPEN_WITH_CONTENT.exec(line);
    if (open) {
      const rest = open[1].trimEnd();
      if (rest.endsWith("$$")) {
        const content = rest.slice(0, -2).trim();
        // "$$a$$ and $$b$$" on one line is inline math, not one block.
        if (content.includes("$$")) {
          out.push(line);
          continue;
        }
        openBlock();
        if (content) out.push(content);
        closeBlock();
      } else {
        openBlock();
        out.push(rest);
        inMath = true;
      }
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}
