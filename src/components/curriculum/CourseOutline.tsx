import Link from "next/link";
import type { CourseOutline as Outline } from "@/lib/course";

export interface LessonFacts {
  minutes: number;
}

/**
 * The course as a path: modules in order, each a short list of numbered
 * lessons with what the reader will understand. A written lesson shows its
 * minutes; one still being written says so quietly and opens a calm card.
 */
export function CourseOutline({ course, ready }: { course: Outline; ready: ReadonlyMap<string, LessonFacts> }) {
  const first = course.lessons[0]?.slug;
  return (
    <div className="course">
      {course.modules.map((module) => {
        const minutes = module.lessons.reduce((total, lesson) => total + (ready.get(lesson.slug)?.minutes ?? 0), 0);
        const written = module.lessons.filter((lesson) => ready.has(lesson.slug)).length;
        return (
          <section key={module.id} id={module.id} aria-labelledby={`${module.id}-title`} className="course-module">
            <header className="course-module-head">
              <span className="course-module-number" aria-hidden="true">
                {module.number}
              </span>
              <div>
                <h2 id={`${module.id}-title`} className="course-module-title">
                  <span className="sr-only">Module {module.number}: </span>
                  {module.title}
                </h2>
                <p className="course-module-about">{module.about}</p>
                <p className="course-module-facts">
                  {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
                  {written > 0 ? `, ${written} ready${minutes > 0 ? `, about ${minutes} min` : ""}` : ""}
                </p>
              </div>
            </header>
            <ol className="course-path">
              {module.lessons.map((lesson) => {
                const facts = ready.get(lesson.slug);
                const isFirst = lesson.slug === first;
                return (
                  <li
                    key={lesson.slug}
                    className="course-step"
                    data-ready={facts ? "" : undefined}
                    data-first={isFirst ? "" : undefined}
                  >
                    <span className="course-step-node" aria-hidden="true" />
                    <Link href={`/learn/${lesson.slug}`} className="course-step-link">
                      <span className="course-step-number">
                        <span className="sr-only">Lesson </span>
                        {lesson.number}
                      </span>
                      <span className="course-step-main">
                        <span className="course-step-title">
                          {lesson.title}
                          {isFirst ? <span className="course-start">Start here</span> : null}
                        </span>
                        {lesson.blurb ? <span className="course-step-blurb">{lesson.blurb}</span> : null}
                      </span>
                      <span className="course-step-meta">
                        {facts ? `${facts.minutes} min` : <span className="course-soon">Being written</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/** Outside the main path: stories from the experiments, reference, running the code. */
export function CourseExtras({ course }: { course: Outline }) {
  const groups = course.extras.filter((extra) => extra.chapters.length > 0);
  if (groups.length === 0) return null;
  const order = ["stories", "reference", "run"];
  groups.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return (
    <section id="extras" aria-labelledby="extras-title" className="course-extras">
      <h2 id="extras-title" className="course-extras-title">
        Beyond the course
      </h2>
      <p className="course-extras-lead">Optional. Come back to these whenever you are curious.</p>
      <div className="course-extras-grid">
        {groups.map((extra) => (
          <div key={extra.id} className="extra-card">
            <h3 className="extra-card-title">
              {extra.id === "run" ? (
                <Link href="/run-it-yourself" className="extra-card-link">
                  {extra.title}
                </Link>
              ) : (
                extra.title
              )}
            </h3>
            <p className="extra-card-about">{extra.about}</p>
            <ul className="extra-card-list">
              {extra.chapters.map((chapter) => (
                <li key={chapter.slug}>
                  <Link href={`/learn/${chapter.slug}`} className="text-link">
                    {chapter.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="extra-card">
          <h3 className="extra-card-title">
            <Link href="/lab" className="extra-card-link">
              The experiments
            </Link>
          </h3>
          <p className="extra-card-about">The experiments behind the lessons, each in plain words first, the numbers one click away.</p>
          <ul className="extra-card-list">
            <li>
              <Link href="/lab" className="text-link">
                Experiments
              </Link>
            </li>
            <li>
              <Link href="/notes" className="text-link">
                Field notes: what worked and what did not
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
