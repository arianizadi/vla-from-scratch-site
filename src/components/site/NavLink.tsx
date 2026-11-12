"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const BASE =
  "inline-flex h-8 items-center rounded-control px-2 text-14 sm:px-2.5 font-medium transition-colors duration-100 ease-standard pointer-coarse:h-11";

/**
 * A header link that marks itself as the current section of the site: a fill
 * and a 2px accent bar under it (not colour alone), and aria-current "page"
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
      className={`${BASE} ${current ? "bg-accent-soft text-ink shadow-[inset_0_-2px_0_var(--accent)]" : "text-ink-muted hover:text-ink"}`}
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
