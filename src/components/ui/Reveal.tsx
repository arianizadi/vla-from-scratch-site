import type { ReactNode } from "react";

interface RevealProps {
  /** What opening shows: "Show code", "Show table", "Show the numbers". */
  label: string;
  /** A few words on what is inside: "python, 12 lines". */
  detail?: ReactNode;
  /** Words for the open state; defaults to the label with "Show" turned into "Hide". */
  openLabel?: string;
  kind?: "code" | "table" | "numbers" | "text";
  className?: string;
  children: ReactNode;
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" className="reveal-chevron">
      <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Material that is there for reference, closed by default: a native
 * <details>, so it opens with a keyboard, works without JavaScript, and the
 * browser opens it for find-in-page and for a link to something inside.
 */
export function Reveal({ label, detail, openLabel, kind = "text", className = "", children }: RevealProps) {
  const hide = openLabel ?? label.replace(/^Show\b/, "Hide");
  return (
    <details className={`reveal reveal-${kind} ${className}`}>
      <summary className="reveal-toggle">
        <Chevron />
        <span className="reveal-closed">{label}</span>
        <span className="reveal-open">{hide}</span>
        {detail ? <span className="reveal-detail">{detail}</span> : null}
      </summary>
      <div className="reveal-body">{children}</div>
    </details>
  );
}
