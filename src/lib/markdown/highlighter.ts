/**
 * One synchronous Shiki highlighter for the whole build.
 *
 * The theme emits CSS variables (--shiki-token-keyword and so on) instead of
 * colours; globals.css maps them to the design's syntax colours, so one render
 * serves both the light and the dark theme. The JavaScript regex engine keeps
 * the highlighter synchronous, which keeps chapter pages statically prerendered.
 */

import type { Root } from "hast";
import { createCssVariablesTheme, createHighlighterCoreSync, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import diff from "shiki/langs/diff.mjs";
import json from "shiki/langs/json.mjs";
import python from "shiki/langs/python.mjs";
import shellscript from "shiki/langs/shellscript.mjs";
import toml from "shiki/langs/toml.mjs";
import yaml from "shiki/langs/yaml.mjs";

const CODE_THEME = "whiteprint";

/** Fence tag -> grammar name. Add a grammar import above before adding a tag here. */
const LANGUAGES: Record<string, string> = {
  python: "python",
  py: "python",
  bash: "shellscript",
  sh: "shellscript",
  shell: "shellscript",
  zsh: "shellscript",
  console: "shellscript",
  yaml: "yaml",
  yml: "yaml",
  json: "json",
  toml: "toml",
  diff: "diff",
};

/** Fence tag -> the label printed on the code block's strip. */
const LABELS: Record<string, string> = {
  python: "Python",
  shellscript: "Shell",
  yaml: "YAML",
  json: "JSON",
  toml: "TOML",
  diff: "Diff",
  text: "Text",
  txt: "Text",
  plaintext: "Text",
};

let highlighter: HighlighterCore | undefined;

function getHighlighter(): HighlighterCore {
  highlighter ??= createHighlighterCoreSync({
    themes: [createCssVariablesTheme({ name: CODE_THEME, variablePrefix: "--shiki-", fontStyle: true })],
    langs: [python, shellscript, yaml, json, toml, diff],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

/** The grammar for a fence tag, or undefined when the block stays plain text. */
export function grammarFor(tag: string | undefined): string | undefined {
  return tag ? LANGUAGES[tag.toLowerCase()] : undefined;
}

/** The label for a fence tag; an untagged block has none. */
export function labelFor(tag: string | undefined): string {
  if (!tag) return "";
  const key = tag.toLowerCase();
  return LABELS[LANGUAGES[key] ?? key] ?? tag;
}

/**
 * Highlights `code` with the grammar from grammarFor().
 *
 * The tokenizer reads the clock to enforce a per-line time limit, and Next.js
 * refuses to prerender a page that reads the clock. The highlighted output
 * does not depend on the time, so the clock is held still for the length of
 * this synchronous call, which also switches the time limit off.
 */
export function highlight(code: string, grammar: string): Root {
  const now = Date.now;
  Date.now = () => 0;
  try {
    return getHighlighter().codeToHast(code, { lang: grammar, theme: CODE_THEME });
  } finally {
    Date.now = now;
  }
}
