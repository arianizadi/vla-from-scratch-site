import Link from "next/link";
import { Suspense } from "react";
import { site } from "@/lib/site";
import { NavLink, NavLinkFallback } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/lab", label: "Lab" },
  { href: "/notes", label: "Notes" },
];

/** The mark: a gripper about to close on a token. */
function Mark() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true" focusable="false" className="site-mark">
      <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="8" className="site-mark-bg" />
      <path d="M14 5v4M8 9h12M9 9v8M19 9v8" fill="none" className="site-mark-ink" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="11" y="16" width="6" height="6" rx="1.6" className="site-mark-token" />
    </svg>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="site-wordmark touch-target inline-flex items-center gap-2.5 rounded-control no-underline">
      <Mark />
      <span>{site.name}</span>
    </Link>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

export function Header() {
  return (
    <header className="site-header sticky top-0 z-40 h-14">
      <div className="page-frame flex h-full items-center justify-between gap-3">
        <Wordmark />
        <nav aria-label="Site">
          <ul className="flex items-center gap-0.5 sm:gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Suspense fallback={<NavLinkFallback href={link.href}>{link.label}</NavLinkFallback>}>
                  <NavLink href={link.href}>{link.label}</NavLink>
                </Suspense>
              </li>
            ))}
            <li className="flex">
              <a
                href={site.tutorialRepo}
                aria-label="Source on GitHub"
                title="Source on GitHub"
                className="inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-100 ease-standard hover:text-ink sm:size-9 pointer-coarse:size-11"
              >
                <GitHubMark />
              </a>
            </li>
            <li className="ml-0.5 flex">
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
