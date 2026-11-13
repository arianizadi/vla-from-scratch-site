import { Reveal } from "@/components/ui/Reveal";
import { CopyButton } from "./CopyButton";

interface CodeBlockProps extends React.ComponentProps<"pre"> {
  /** Language or file path printed on the strip. */
  "data-label"?: string;
  /** Number of lines, set by the Markdown pipeline. */
  "data-lines"?: number | string;
  /** Show the code at once instead of folding it behind "Show code". */
  open?: boolean;
}

/**
 * A fenced code block: a strip with the language and a Copy button, then the
 * code. Folded behind a "Show code" toggle by default: code is reference
 * material on this site, never the way an idea is taught.
 */
export function CodeBlock({ "data-label": label, "data-lines": lines, open = false, children, ...pre }: CodeBlockProps) {
  const block = (
    <div className="code-block" data-code-block>
      <div className="code-block-strip">
        <span className="label">{label}</span>
        <CopyButton />
      </div>
      <pre {...pre}>{children}</pre>
    </div>
  );
  if (open) return block;
  const count = Number(lines);
  const detail = [label, Number.isFinite(count) && count > 0 ? `${count} ${count === 1 ? "line" : "lines"}` : ""]
    .filter(Boolean)
    .join(", ");
  return (
    <Reveal label="Show code" kind="code" detail={detail || undefined}>
      {block}
    </Reveal>
  );
}
