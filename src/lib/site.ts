/** Site-wide constants. Nothing here is read at request time. */

const TUTORIAL_REPO = "https://github.com/arianizadi/vla-from-scratch";
const SITE_REPO = "https://github.com/arianizadi/vla-from-scratch-site";

function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  return "http://localhost:3000";
}

export const site = {
  name: "VLA from scratch",
  tagline: "The models behind robot manipulation, built and measured from the ground up.",
  description:
    "A hands-on guide to the models behind robot manipulation: a language model, a vision-language model and a vision-language-action policy, each explained from the ground up and backed by measured experiments.",
  url: siteUrl(),
  tutorialRepo: TUTORIAL_REPO,
  siteRepo: SITE_REPO,
  /** Branch that chapter and code links point at. */
  branch: "main",
  /** Folder of the chapter files inside the tutorial repository. */
  chapterDir: "tutorial/chapters",
  foundryRepo: "https://github.com/TRI-ML/vla_foundry",
} as const;

/** URL of a file or folder in the tutorial repository. */
export function repoUrl(repoPath: string, kind: "blob" | "tree" | "edit" = "blob"): string {
  const clean = repoPath.replace(/^\/+/, "");
  return `${site.tutorialRepo}/${kind}/${site.branch}/${clean}`;
}
