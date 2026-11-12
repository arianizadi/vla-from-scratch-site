import Link from "next/link";
import { Suspense } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { site } from "@/lib/site";
import { NavLink, NavLinkFallback } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/lab", label: "Lab" },
  { href: "/notes", label: "Notes" },
];

function Wordmark() {
  return (
    <Link
      href="/"
      className="touch-target inline-flex items-center gap-2 rounded-control text-16 font-bold text-ink no-underline stretch-90"
    >
      <svg
        viewBox="0 0 20 20"
        width="20"
        height="20"
        aria-hidden="true"
        focusable="false"
        className="hidden min-[400px]:block"
      >
        <rect x="1" y="1" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 5v6.5h3M14 5v6.5h-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8.5" y="12.5" width="3" height="3" className="fill-mark stroke-ink" strokeWidth="1" />
      </svg>
      <span>{site.name}</span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-page">
      <div className="page-frame flex h-full items-center justify-between gap-3">
        <Wordmark />
        <nav aria-label="Site">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Suspense fallback={<NavLinkFallback href={link.href}>{link.label}</NavLinkFallback>}>
                  <NavLink href={link.href}>{link.label}</NavLink>
                </Suspense>
              </li>
            ))}
            {/* On phones the repository link keeps its place as a 44px mark; from 640px it is a word. */}
            <li className="flex">
              <a
                href={site.tutorialRepo}
                aria-label="Source on GitHub"
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-control text-14 font-medium text-ink-muted transition-colors duration-100 ease-standard hover:text-ink sm:h-8 sm:min-w-0 sm:px-2.5 pointer-coarse:h-11"
              >
                <Glyph name="bracket" size={16} className="sm:hidden" />
                <span className="hidden sm:inline" aria-hidden="true">
                  GitHub
                </span>
              </a>
            </li>
            <li className="ml-1 flex">
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
