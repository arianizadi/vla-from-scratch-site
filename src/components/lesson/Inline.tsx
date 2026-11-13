import Link from "next/link";
import type { ReactNode } from "react";

/** **bold**, `code` and [text](href): the only marks a lesson's text may use. */
const MARK = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Renders a lesson string with its inline marks. */
export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(MARK)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    if (match[1] !== undefined) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<code key={key++}>{match[2]}</code>);
    } else {
      const href = match[4];
      parts.push(
        href.startsWith("/") ? (
          <Link key={key++} href={href} className="text-link">
            {match[3]}
          </Link>
        ) : (
          <a key={key++} href={href} className="text-link">
            {match[3]}
          </a>
        ),
      );
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
