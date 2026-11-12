"use client";

import { useEffect, useRef, useState } from "react";

/** Copies the text of the code block it sits in; says "Copied" for 1.5 s. */
export function CopyButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const text = event.currentTarget.closest("[data-code-block]")?.querySelector("pre")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button type="button" className="copy-button label" onClick={copy}>
      {copied ? "Copied" : "Copy"}
      <span className="sr-only" role="status">
        {copied ? "Code copied to the clipboard" : ""}
      </span>
    </button>
  );
}
