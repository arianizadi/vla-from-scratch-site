"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { applyTheme, currentTheme, restoreTheme, subscribeToTheme, type Theme } from "@/lib/theme";

const serverTheme = (): Theme => "light";

/**
 * Switches between the light and the dark theme and stores the choice. The
 * icon is chosen in CSS from <html data-theme> or the system preference, so
 * it is right before hydration; only the label waits for the client.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, serverTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  useLayoutEffect(() => restoreTheme(), []);

  return (
    <button
      type="button"
      onClick={() => applyTheme(currentTheme() === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="theme-toggle inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition-colors duration-100 ease-standard hover:border-line-strong hover:text-ink pointer-coarse:size-11"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" className="theme-icon-light">
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" className="theme-icon-dark">
        <path
          d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
