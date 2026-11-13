/**
 * Theme handling shared by the inline script, the toggle and client code that
 * needs resolved token values (Mermaid, canvas or WebGL figures).
 *
 * <html data-theme> always says which theme is shown: the stored choice
 * (localStorage, THEME_KEY) when there is one, otherwise the system
 * preference, followed live. CSS keys the dark tokens on [data-theme="dark"]
 * only; the system-preference media query is a fallback for when no script
 * ran. Safari does not reliably restyle rules written as
 * :not([data-theme="light"]) inside a media query when the attribute flips,
 * so the shown theme is never left to such a rule.
 */

export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

/** The browser chrome colour (address bar, iPhone status bar) per theme: the page background. */
export const THEME_COLORS: Record<Theme, string> = { light: "#f3f4f7", dark: "#10131a" };

/**
 * Runs in <head> before the first paint, so neither a stored choice nor the
 * system preference ever flashes the other theme. It also marks the document
 * as scripted (data-js), which lets CSS hold back content that a client
 * component is about to animate in.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){try{t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){t="light"}}d.setAttribute("data-theme",t)})()`;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function storedTheme(): Theme | undefined {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : undefined;
  } catch {
    return undefined;
  }
}

/** The theme currently shown. */
export function currentTheme(): Theme {
  const shown = document.documentElement.getAttribute("data-theme");
  if (shown === "light" || shown === "dark") return shown;
  return systemTheme();
}

/** Shows a theme and colours the browser chrome to match. */
function show(theme: Theme): void {
  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== theme) root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.setAttribute("content", THEME_COLORS[theme]);
  }
}

/** The reader's choice: shown now and stored for the next visit. */
export function applyTheme(theme: Theme): void {
  show(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be unavailable; the choice then lasts for this page only.
  }
}

/**
 * Re-applies the stored choice or the system preference (React may reset
 * <html> attributes on a dev remount) and keeps following the system while
 * nothing is stored. Returns a cleanup.
 */
export function restoreTheme(): () => void {
  show(storedTheme() ?? systemTheme());
  const media = window.matchMedia(DARK_QUERY);
  const follow = () => {
    if (!storedTheme()) show(systemTheme());
  };
  media.addEventListener("change", follow);
  return () => media.removeEventListener("change", follow);
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
