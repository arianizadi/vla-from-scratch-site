"use client";

import { useEffect } from "react";

/**
 * A link to something inside a folded block (a table row, a note's text)
 * opens the blocks around it first, then scrolls to it. Browsers that do
 * this themselves are not affected.
 */
export function RevealOnHash() {
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      let opened = false;
      for (let node = target.parentElement; node; node = node.parentElement) {
        if (node instanceof HTMLDetailsElement && !node.open) {
          node.open = true;
          opened = true;
        }
      }
      if (opened) requestAnimationFrame(() => target.scrollIntoView());
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  return null;
}
