"use client";

import { useRef } from "react";
import { useActiveSection } from "@/components/chapter/useActiveSection";
import { Glyph } from "@/components/ui/Glyph";
import type { StatusKind } from "./notes";
import { STATUS, StatusGlyph } from "./StatusStamp";

export interface NavItem {
  id: string;
  text: string;
  /** Entry number, for entries. */
  number?: number;
  /** Status kinds of an entry, in the order the entry gives them. */
  status?: StatusKind[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NotesNavProps {
  groups: NavGroup[];
  title: string;
}

function NavList({
  groups,
  active,
  onNavigate,
}: {
  groups: NavGroup[];
  active: string | undefined;
  onNavigate?: () => void;
}) {
  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="label text-ink-faint">{group.label}</p>
          <ol className="mt-2 grid">
            {group.items.map((item) => {
              const isActive = item.id === active;
              const statuses = (item.status ?? []).filter((kind) => kind !== "confirmed");
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={isActive ? "location" : undefined}
                    onClick={onNavigate}
                    className={`flex gap-2 border-l-2 py-1 pr-2 pl-3 text-14 no-underline pointer-coarse:py-2.5 ${
                      isActive
                        ? "border-accent bg-accent-soft text-ink"
                        : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                  >
                    {item.number !== undefined ? (
                      <span className="w-5 shrink-0 text-ink-faint tabular-nums">{item.number}</span>
                    ) : null}
                    <span className="min-w-0 flex-1">{item.text}</span>
                    {statuses.map((kind) => (
                      <span key={kind} className={`mt-1 shrink-0 ${STATUS[kind].tone}`}>
                        <StatusGlyph kind={kind} />
                        <span className="sr-only">{STATUS[kind].label}</span>
                      </span>
                    ))}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

/**
 * The notes' table of contents. From 1024px a sticky column beside the text;
 * below that a 44px bar naming the section being read, which opens the same
 * list in a drawer. Entries that are not simply measured carry their stamp.
 */
export function NotesNav({ groups, title }: NotesNavProps) {
  const items = groups.flatMap((group) => group.items);
  const active = useActiveSection(items.map((item) => item.id));
  const reading = items.find((item) => item.id === active);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <div className="sticky top-[var(--header-offset)] z-30 -mx-4 flex h-11 items-center gap-3 border-b border-line bg-page px-4 sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => dialog.current?.showModal()}
          className="-ml-2 inline-flex h-11 shrink-0 items-center gap-2 rounded-control px-2 text-14 font-semibold text-ink"
        >
          <Glyph name="menu" size={14} />
          Contents
        </button>
        <span className="min-w-0 flex-1 truncate text-14 text-ink-muted">
          {reading ? (
            <>
              {reading.number !== undefined ? (
                <span className="mr-1.5 text-ink-faint tabular-nums">{reading.number}</span>
              ) : null}
              {reading.text}
            </>
          ) : (
            title
          )}
        </span>
      </div>

      <dialog
        ref={dialog}
        aria-label="Contents of the notes"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(340px,88vw)] max-w-none border-r border-line-strong bg-page p-0 lg:hidden"
      >
        <div className="flex h-full flex-col pt-[var(--safe-top)]">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pr-2 pl-4">
            <p className="text-14 font-semibold">Contents</p>
            <button
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink"
            >
              <Glyph name="close" size={14} />
              <span className="sr-only">Close contents</span>
            </button>
          </div>
          <nav aria-label="Contents of the notes" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <NavList groups={groups} active={active} onNavigate={close} />
          </nav>
        </div>
      </dialog>

      <aside className="sticky top-[var(--header-offset)] hidden h-[calc(100dvh-var(--header-offset))] self-start overflow-y-auto overscroll-contain py-8 pr-2 lg:block">
        <nav aria-label="Contents of the notes">
          <NavList groups={groups} active={active} />
        </nav>
      </aside>
    </>
  );
}
