/**
 * Turns a link written in a chapter file into the address it has on the site.
 *
 * Chapter files live in tutorial/chapters/ of the tutorial repository and link
 * by relative path, so every relative link is first resolved to a
 * repository-relative path and then mapped:
 *
 *   41-flow-matching.md        -> /learn/41-flow-matching
 *   ../lab-notebook.md#x       -> /lab#x
 *   ../img/grasp_map.svg       -> /tutorial/img/grasp_map.svg
 *   ../../sim/pickup/env.py    -> <tutorial repo>/blob/main/sim/pickup/env.py
 *   ../roadmap.md              -> <tutorial repo>/blob/main/tutorial/roadmap.md
 */

import path from "node:path";
import { repoUrl, site } from "@/lib/site";

export type LinkKind = "chapter" | "page" | "asset" | "repo" | "external" | "anchor";

export interface ResolvedLink {
  kind: LinkKind;
  href: string;
  /** Set for chapter links: the slug the link points at. */
  slug?: string;
}

const SCHEME = /^([a-z][a-z0-9+.-]*:|\/\/)/i;
const CHAPTER_PATH = new RegExp(`^${site.chapterDir}/(\\d+-[\\w-]+)\\.md$`);
const IMAGE_DIR = "tutorial/img/";
const LAB_NOTEBOOK = "tutorial/lab-notebook.md";

export function resolveLink(url: string): ResolvedLink {
  if (url.startsWith("#")) return { kind: "anchor", href: url };
  if (SCHEME.test(url)) return { kind: "external", href: url };
  if (url.startsWith("/")) return { kind: "page", href: url };

  const hashAt = url.indexOf("#");
  const hash = hashAt === -1 ? "" : url.slice(hashAt);
  const target = (hashAt === -1 ? url : url.slice(0, hashAt)).split("?")[0];

  let decoded = target;
  try {
    decoded = decodeURI(target);
  } catch {
    // keep the raw path
  }

  const repoPath = path.posix.normalize(path.posix.join(site.chapterDir, decoded));
  if (repoPath.startsWith("..")) return { kind: "external", href: url };

  const chapter = CHAPTER_PATH.exec(repoPath);
  if (chapter) return { kind: "chapter", href: `/learn/${chapter[1]}${hash}`, slug: chapter[1] };
  if (repoPath === LAB_NOTEBOOK) return { kind: "page", href: `/lab${hash}` };
  if (repoPath.startsWith(IMAGE_DIR)) {
    return { kind: "asset", href: `/tutorial/img/${repoPath.slice(IMAGE_DIR.length)}` };
  }

  const isFolder = target.endsWith("/") || repoPath === ".";
  const clean = repoPath === "." ? "" : repoPath.replace(/\/$/, "");
  return { kind: "repo", href: `${repoUrl(clean, isFolder ? "tree" : "blob")}${hash}` };
}
