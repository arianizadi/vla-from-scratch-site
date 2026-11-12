"use client";

import { useEffect, useState } from "react";
import type { Command } from "./content";

const COPIED_MS = 1500;

/** One command in the site's code-block style: what it is for, Copy, and the line itself. */
export function CommandBlock({ command }: { command: Pick<Command, "label" | "code"> }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    navigator.clipboard?.writeText(command.code).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className="code-block pl-command">
      <div className="code-block-strip">
        <span>{command.label}</span>
        <button type="button" className="copy-button" onClick={copy} aria-label={`Copy: ${command.label}`}>
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre>
        <code>{command.code}</code>
      </pre>
    </div>
  );
}
