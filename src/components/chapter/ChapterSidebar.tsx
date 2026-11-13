"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { useActiveSection } from "./useActiveSection";

export interface SidebarChapter {
  slug: string;
  orderLabel: string;
  title: string;
}

export interface SidebarPart {
  id: string;
  /** Module number; the extras (run it yourself, reference) have none. */
  number?: number;
  name: string;
  chapters: SidebarChapter[];
}

export interface SidebarSection {
  id: string;
  text: string;
  /** Section number ("41.2"). */
  section?: string;
}

interface ChapterSidebarProps {
  parts: SidebarPart[];
  currentSlug: string;
  currentTitle: string;
  /** The current chapter's h2 sections; the only table of contents on the page. */
  sections: SidebarSection[];
}

interface NavTreeProps extends Omit<ChapterSidebarProps, "currentTitle"> {
  activeSection: string | undefined;
  /** Called when a link is followed, so a drawer can close. */
  onNavigate?: () => void;
}

/** Parts as collapsible groups; the current chapter lists its sections. */
function NavTree({ parts, currentSlug, sections, activeSection, onNavigate }: NavTreeProps) {
  const baseId = useId();
  const currentPart = parts.find((part) => part.chapters.some((chapter) => chapter.slug === currentSlug));
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(currentPart ? [currentPart.id] : []));

  const toggle = (partId: string) => {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  return (
    <ul className="grid gap-1">
      {parts.map((part) => {
        const isOpen = open.has(part.id);
        const listId = `${baseId}-${part.id}`;
        return (
          <li key={part.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={listId}
              onClick={() => toggle(part.id)}
              className="flex min-h-8 w-full items-center gap-2 rounded-control py-1 pr-2 text-left text-14 font-semibold text-ink hover:text-accent pointer-coarse:min-h-11"
            >
              <Glyph
                name="chevron"
                className={`shrink-0 text-ink-faint transition-transform duration-[160ms] ease-standard ${isOpen ? "rotate-90" : ""}`}
              />
              {part.number !== undefined ? <span className="w-4 shrink-0 text-ink-faint tabular-nums">{part.number}</span> : null}
              <span>{part.name}</span>
            </button>

            <ul id={listId} hidden={!isOpen} className="mb-2 ml-[5px] border-l border-line pl-3">
              {part.chapters.map((chapter) => {
                const isCurrent = chapter.slug === currentSlug;
                return (
                  <li key={chapter.slug}>
                    <Link
                      href={`/learn/${chapter.slug}`}
                      aria-current={isCurrent ? "page" : undefined}
                      data-current={isCurrent ? "" : undefined}
                      onClick={onNavigate}
                      className={`flex gap-2 rounded-control px-2 py-1.5 text-14 no-underline pointer-coarse:py-3 ${
                        isCurrent ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {chapter.orderLabel ? (
                        <span className="w-5 shrink-0 font-normal text-ink-faint tabular-nums">{chapter.orderLabel}</span>
                      ) : null}
                      <span>{chapter.title}</span>
                    </Link>

                    {isCurrent && sections.length > 0 ? (
                      <ol className="mt-0.5 mb-2 ml-7 grid" aria-label="On this page">
                        {sections.map((section) => {
                          const isActive = section.id === activeSection;
                          return (
                            <li key={section.id}>
                              <a
                                href={`#${section.id}`}
                                aria-current={isActive ? "location" : undefined}
                                onClick={onNavigate}
                                className={`block border-l-2 py-1 pr-2 pl-3 text-14 no-underline pointer-coarse:py-2.5 ${
                                  isActive
                                    ? "border-accent bg-accent-soft text-ink"
                                    : "border-transparent text-ink-muted hover:text-ink"
                                }`}
                              >
                                {section.text}
                              </a>
                            </li>
                          );
                        })}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Chapter navigation. From 1024px it is a sticky column beside the text;
 * below that it is a drawer opened from a 44px bar that names the section
 * being read. Scroll position is tracked once and shared by both.
 */
export function ChapterSidebar({ parts, currentSlug, currentTitle, sections }: ChapterSidebarProps) {
  const activeSection = useActiveSection(sections.map((section) => section.id));
  const dialog = useRef<HTMLDialogElement>(null);
  const column = useRef<HTMLElement>(null);
  const reading = sections.find((section) => section.id === activeSection);

  // Bring the current chapter into view inside the sidebar's own scroll area.
  useEffect(() => {
    const container = column.current;
    const current = container?.querySelector<HTMLElement>("[data-current]");
    if (!container || !current) return;
    const top = current.getBoundingClientRect().top - container.getBoundingClientRect().top;
    if (top > container.clientHeight * 0.6) container.scrollTop += top - container.clientHeight / 3;
  }, [currentSlug]);

  const close = () => dialog.current?.close();

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 flex h-11 items-center gap-3 border-b border-line bg-page px-4 sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => dialog.current?.showModal()}
          className="-ml-2 inline-flex h-11 shrink-0 items-center gap-2 rounded-control px-2 text-14 font-semibold text-ink"
        >
          <Glyph name="menu" size={14} />
          Course
        </button>
        <span className="min-w-0 flex-1 truncate text-14 text-ink-muted" aria-live="off">
          {reading ? (
            <>
              <span className="mr-1.5 text-ink-faint tabular-nums">{reading.section}</span>
              {reading.text}
            </>
          ) : (
            currentTitle
          )}
        </span>
      </div>

      <dialog
        ref={dialog}
        aria-label="Course"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(340px,88vw)] max-w-none border-r border-line-strong bg-page p-0 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pr-2 pl-4">
            <p className="text-14 font-semibold">Course</p>
            <button
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink"
            >
              <Glyph name="close" size={14} />
              <span className="sr-only">Close the course list</span>
            </button>
          </div>
          <nav aria-label="Course" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <NavTree
              parts={parts}
              currentSlug={currentSlug}
              sections={sections}
              activeSection={activeSection}
              onNavigate={close}
            />
          </nav>
        </div>
      </dialog>

      <aside
        ref={column}
        className="sticky top-14 hidden h-[calc(100dvh-56px)] self-start overflow-y-auto overscroll-contain py-8 pr-2 lg:block"
      >
        <nav aria-label="Course">
          <NavTree parts={parts} currentSlug={currentSlug} sections={sections} activeSection={activeSection} />
        </nav>
      </aside>
    </>
  );
}
