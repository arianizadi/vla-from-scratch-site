"use client";

/**
 * The lab page's table of contents: the notebook's sections, in a sticky
 * sidebar from 1024px with the section on screen marked, and as a disclosure
 * at the top of the page below that width.
 */

import { useActiveSection } from "@/components/chapter/useActiveSection";
import type { SectionInfo } from "./shared";
import styles from "./styles";

function NavList({ sections, active }: { sections: SectionInfo[]; active?: string }) {
  return (
    <ol className={styles.navList}>
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className={styles.navLink}
            aria-current={section.id === active ? "true" : undefined}
          >
            <span className={styles.navNumber} aria-hidden="true">
              {section.number}
            </span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function LabSidebar({ sections }: { sections: SectionInfo[] }) {
  const active = useActiveSection(sections.map((section) => section.id));
  return (
    <nav aria-label="Sections of the lab notebook" className={styles.sidebar}>
      <p className="label mb-2 px-2.5 text-ink-faint">Sections</p>
      <NavList sections={sections} active={active} />
    </nav>
  );
}

export function LabContents({ sections }: { sections: SectionInfo[] }) {
  return (
    <details className={styles.contents}>
      <summary>Sections</summary>
      <nav aria-label="Sections of the lab notebook">
        <NavList sections={sections} />
      </nav>
    </details>
  );
}
