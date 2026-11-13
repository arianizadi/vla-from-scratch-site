"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const BASE =
  "inline-flex h-9 items-center rounded-full px-3 text-15 font-semibold transition-colors duration-100 ease-standard sm:px-3.5 pointer-coarse:h-11";

/**
 * A header link that marks itself as the current section of the site: a
 * paper pill with an outline (not colour alone), and aria-current "page"
 * on the section's own page, "true" on a page inside it (a chapter under Learn).
 */
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const page = pathname === href;
  const current = page || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={page ? "page" : current ? "true" : undefined}
      className={`${BASE} ${current ? "bg-surface text-ink shadow-[0_0_0_1px_var(--border-strong)]" : "text-ink-muted hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}

/** The same link without the current-page state; shown while the pathname is unknown. */
export function NavLinkFallback({ href, children }: NavLinkProps) {
  return (
    <Link href={href} className={`${BASE} text-ink-muted hover:text-ink`}>
      {children}
    </Link>
  );
}
