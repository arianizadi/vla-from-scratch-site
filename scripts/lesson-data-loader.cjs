/**
 * Turbopack loader for src/lessons/<slug>/lesson.ts and math.ts when they are
 * imported as data (`?lesson-data`, see src/lessons/index.ts and the rule in
 * next.config.ts).
 *
 * A lesson file imports its animations, which are client components. Imported
 * as they are, every client component of every lesson would be part of the
 * module graph of each page that reads a lesson, and would ship with it (the
 * landing page, the course outline, every lesson). Here each
 *
 *   import { TokensToIds } from "./animations/TokensToIds";
 *
 * of a "use client" module becomes a small marker,
 *
 *   const TokensToIds = { __animation: "10-tokens/animations/TokensToIds#TokensToIds" };
 *
 * and the lesson page renders the marker through <LessonAnimation>, which loads
 * that one animation's code on its own (src/lessons/LessonAnimation.tsx).
 * Imports of anything else (types, ../define, plain helpers) are left alone.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- a webpack loader is a CommonJS module */
const fs = require("node:fs");
const path = require("node:path");

const IMPORT = /^import\s*\{([^}]*)\}\s*from\s*["'](\.\/animations\/[^"']+)["'];?[ \t]*$/gm;
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

function isClientModule(file) {
  for (const ext of ["", ...EXTENSIONS]) {
    const candidate = file + ext;
    try {
      if (fs.statSync(candidate).isFile()) {
        const head = fs.readFileSync(candidate, "utf8").slice(0, 200);
        return { file: candidate, client: /^\s*(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(head) };
      }
    } catch {
      // try the next extension
    }
  }
  return { file, client: false };
}

module.exports = function lessonDataLoader(source) {
  const folder = path.basename(path.dirname(this.resourcePath));
  return source.replace(IMPORT, (whole, names, request) => {
    const { client } = isClientModule(path.join(path.dirname(this.resourcePath), request));
    if (!client) return whole;
    const relative = `${folder}/${request.replace(/^\.\//, "").replace(/\.(tsx?|jsx?)$/, "")}`;
    return names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => {
        const [imported, local = imported] = name.split(/\s+as\s+/).map((part) => part.trim());
        return `const ${local} = { __animation: ${JSON.stringify(`${relative}#${imported}`)} };`;
      })
      .join("\n");
  });
};
