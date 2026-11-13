"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  label: string;
  /** A shorter label for phones; the full label stays the link's name. */
  short?: string;
  /** Other sections that count as this one ("/notes" under Experiments). */
  also?: string[];
}

const BASE =
  "inline-flex h-9 items-center rounded-full px-2.5 text-15 font-semibold whitespace-nowrap transition-colors duration-100 ease-standard sm:px-3.5 pointer-coarse:h-11 max-[359px]:px-1.5 max-[359px]:text-14";

function Label({ label, short }: Pick<NavLinkProps, "label" | "short">) {
  if (!short) return <>{label}</>;
  return (
    <>
      <span className="sm:hidden" aria-hidden="true">
        {short}
      </span>
      <span className="max-sm:sr-only">{label}</span>
    </>
  );
}

function within(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * A header link that marks itself as the current section of the site: a
 * paper pill with an outline (not colour alone), and aria-current "page"
 * on the section's own page, "true" on a page inside it (a lesson under Course).
 */
export function NavLink({ href, label, short, also = [] }: NavLinkProps) {
  const pathname = usePathname();
  const page = pathname === href;
  const current = page || [href, ...also].some((base) => within(pathname, base));
  return (
    <Link
      href={href}
      aria-current={page ? "page" : current ? "true" : undefined}
      className={`${BASE} ${current ? "bg-surface text-ink shadow-[0_0_0_1px_var(--border-strong)]" : "text-ink-muted hover:text-ink"}`}
    >
      <Label label={label} short={short} />
    </Link>
  );
}

/** The same link without the current-page state; shown while the pathname is unknown. */
export function NavLinkFallback({ href, label, short }: Omit<NavLinkProps, "also">) {
  return (
    <Link href={href} className={`${BASE} text-ink-muted hover:text-ink`}>
      <Label label={label} short={short} />
    </Link>
  );
}
