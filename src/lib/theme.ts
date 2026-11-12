/**
 * Theme handling shared by the inline script, the toggle and client code that
 * needs resolved token values (Mermaid, canvas or WebGL figures).
 *
 * The stored choice lives in localStorage under THEME_KEY and is mirrored to
 * <html data-theme>. With no stored choice the system preference applies.
 */

export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

/**
 * Runs in <head> before the first paint, so a stored choice never flashes. It
 * also marks the document as scripted (data-js), which lets CSS hold back
 * content that a client component is about to animate in.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}})()`;

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme currently shown: the stored choice, or the system preference. */
export function currentTheme(): Theme {
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be unavailable; the choice then lasts for this page only.
  }
}

/** Re-applies a stored choice (React resets <html> attributes on a dev remount). */
export function restoreTheme(): void {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch {
    // ignore
  }
}

/** Calls back whenever the shown theme may have changed. Returns an unsubscribe. */
export function subscribeToTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", callback);
  };
}

/** Resolved value of a colour token, for example readToken("--accent"). */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
