"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const BASE =
  "inline-flex h-8 items-center rounded-control px-2 text-14 sm:px-2.5 font-medium transition-colors duration-100 ease-standard pointer-coarse:h-11";

/** A header link that marks itself as the current section of the site. */
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const current = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`${BASE} ${current ? "bg-accent-soft text-ink" : "text-ink-muted hover:text-ink"}`}
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
