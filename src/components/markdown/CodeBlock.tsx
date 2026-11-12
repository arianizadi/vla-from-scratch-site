import { CopyButton } from "./CopyButton";

interface CodeBlockProps extends React.ComponentProps<"pre"> {
  /** Language or file path printed on the strip. */
  "data-label"?: string;
}

/** A fenced code block: a strip with the language and a Copy button, then the code. */
export function CodeBlock({ "data-label": label, children, ...pre }: CodeBlockProps) {
  return (
    <div className="code-block" data-code-block>
      <div className="code-block-strip">
        <span className="label">{label}</span>
        <CopyButton />
      </div>
      <pre {...pre}>{children}</pre>
    </div>
  );
}
