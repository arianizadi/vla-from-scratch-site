/**
 * The course: the order a beginner follows, grouped into modules, with one
 * line per lesson saying what the reader will understand afterwards.
 *
 * Chapters are the source material (content/chapters); a lesson
 * (src/lessons/<slug>) is how a chapter is taught. This file decides which
 * chapters are lessons in the main path and which are extras (running the
 * code yourself, case studies, reference). A chapter that is listed nowhere
 * still has its technical page; it simply is not part of the course.
 *
 * Build time only. Everything a page needs from here is plain data.
 */

import { getAllChapters, type ChapterMeta } from "./content";

export interface CourseModule {
  id: string;
  /** 1-based, in course order. */
  number: number;
  title: string;
  /** What the module is about, in one plain sentence. */
  about: string;
  slugs: string[];
}

export interface Extra {
  id: "run" | "stories" | "reference";
  title: string;
  about: string;
  slugs: string[];
}

/** The main path, in order. */
const MODULES: Omit<CourseModule, "number">[] = [
  {
    id: "big-picture",
    title: "The big picture",
    about: "What a robot that follows instructions is made of, and how it learns from examples.",
    slugs: ["00-the-route", "02-how-we-got-here", "03-the-landscape"],
  },
  {
    id: "reading",
    title: "Reading words",
    about: "How a model turns a sentence into numbers and learns what comes next.",
    slugs: ["10-tokens", "11-the-transformer-block", "12-positions", "13-training-a-language-model", "14-generation"],
  },
  {
    id: "seeing",
    title: "Seeing pictures",
    about: "How a camera image becomes something a model can read, alongside the words.",
    slugs: [
      "20-images-to-tokens",
      "21-pooled-vs-patch-tokens",
      "22-pretrained-vision-encoders",
      "30-joining-vision-and-language",
      "31-training-a-vlm",
      "32-testing-a-vlm",
    ],
  },
  {
    id: "acting",
    title: "Choosing actions",
    about: "How a model turns what it reads and sees into smooth movements of an arm.",
    slugs: [
      "40-action-spaces",
      "41-flow-matching",
      "42-chunks-and-execution",
      "43-imitation-learning",
      "50-what-the-action-head-sees",
      "51-language-conditioning",
      "52-history-and-shortcuts",
    ],
  },
  {
    id: "training",
    title: "Building and teaching it",
    about: "Putting the parts together and teaching the whole thing from demonstrations.",
    slugs: [
      "60-anatomy-of-a-vla",
      "61-pretrained-backbones",
      "62-the-from-scratch-path",
      "70-demonstrations",
      "71-how-much-data-and-training",
      "72-which-demonstrations-teach",
      "80-the-training-loop",
    ],
  },
  {
    id: "testing",
    title: "Checking that it works",
    about: "How to test a robot fairly, and how to find out why it fails.",
    slugs: [
      "90-closed-loop-evaluation",
      "91-loss-is-not-success",
      "92-measuring-failure",
      "93-train-inference-skew",
      "94-debugging-flowchart",
      "95-what-a-policy-looks-at",
      "110-toward-real-tasks",
    ],
  },
];

/** Outside the main path. */
const EXTRAS: Extra[] = [
  {
    id: "stories",
    title: "Stories from the experiments",
    about: "Case studies: how real runs went, wrong turns included.",
    slugs: ["100-case-pick-cube", "101-case-pick-target", "102-case-pretrained-backbones", "103-case-self-correction"],
  },
  {
    id: "reference",
    title: "Reference",
    about: "Look things up while you learn.",
    slugs: ["120-glossary", "121-edge-cases"],
  },
  {
    id: "run",
    title: "Run it yourself",
    about: "Install the code, train a robot policy and test it on your own computer.",
    slugs: ["01-setup-and-first-run", "81-surviving-long-runs"],
  },
];

/** Plain titles where the chapter's own title would mean little to a beginner. */
const TITLES: Record<string, string> = {
  "00-the-route": "How a robot learns from examples",
  "121-edge-cases": "Common problems",
};

/** What the reader will understand after each lesson, in one line. */
const BLURBS: Record<string, string> = {
  "00-the-route": "The whole loop in one picture: a robot watches examples, learns to copy them, and gets tested.",
  "02-how-we-got-here": "The few big ideas, from chatbots to robot arms, that made today's robot models possible.",
  "03-the-landscape": "The handful of choices that tell robot models apart, and what each choice costs.",
  "10-tokens": "How a sentence is cut into small pieces, and each piece becomes a number the model can use.",
  "11-the-transformer-block": "What happens inside the transformer, the building block every model here shares.",
  "12-positions": "How a model knows which word came first when it reads them all at once.",
  "13-training-a-language-model": "How a language model learns by guessing the next word, over and over.",
  "14-generation": "How a trained model writes one piece at a time, and why the way it picks matters.",
  "20-images-to-tokens": "How a camera picture is cut into small squares a model can read like words.",
  "21-pooled-vs-patch-tokens": "Why a robot needs to know where things are, not one summary of the picture.",
  "22-pretrained-vision-encoders": "When to borrow a vision model someone else trained, and what it already knows.",
  "30-joining-vision-and-language": "How words and picture pieces go into one sequence that a single model reads.",
  "31-training-a-vlm": "How a model learns to describe a scene it sees.",
  "32-testing-a-vlm": "How to tell whether a model really looks at the picture or only guesses from the words.",
  "40-action-spaces": "What an action is for a robot arm: a handful of numbers, many times a second.",
  "41-flow-matching": "Why averaging two good moves gives a bad one, and how a model learns to pick one good move.",
  "42-chunks-and-execution": "Why a robot plans a short burst of moves, makes a few, then looks again.",
  "43-imitation-learning": "Why copying a teacher works until the robot drifts somewhere the teacher never went.",
  "50-what-the-action-head-sees": "What the part that chooses the movement actually gets to see.",
  "51-language-conditioning": "How the instruction has to reach the part that moves the arm, or the robot ignores it.",
  "52-history-and-shortcuts": "How remembering its last move can let a robot stop looking.",
  "60-anatomy-of-a-vla": "The parts of a robot model that reads, sees and acts, and how they fit together.",
  "61-pretrained-backbones": "How to start from a model that already reads and sees, and teach it to act.",
  "62-the-from-scratch-path": "What it takes to build all three models yourself, one on top of the other.",
  "70-demonstrations": "Where the examples come from: a scripted teacher showing the robot what to do.",
  "71-how-much-data-and-training": "How many examples and how much practice a robot needs before it starts to succeed.",
  "72-which-demonstrations-teach": "Why some examples teach the robot to look, and others teach it nothing new.",
  "80-the-training-loop": "What one round of practice does to a model, and which saved copy to keep.",
  "90-closed-loop-evaluation": "How to test a robot fairly: let it act on scenes it has never seen, and count.",
  "91-loss-is-not-success": "Why a model can look great while practising and still fail every real try.",
  "92-measuring-failure": "How to tell a near miss from a robot that has no idea where the object is.",
  "93-train-inference-skew": "Why a robot must see exactly the same thing when tested as when it learned.",
  "94-debugging-flowchart": "A calm, step-by-step way to find out why a robot keeps failing.",
  "95-what-a-policy-looks-at": "How to find out what a working robot is actually paying attention to.",
  "110-toward-real-tasks": "What still stands between these lessons and real jobs, like trimming a plant.",
  "100-case-pick-cube": "How the single-cube task went from a first try to a robot that rarely misses.",
  "101-case-pick-target": "How a robot that grabbed at random learned to pick the object it was asked for.",
  "102-case-pretrained-backbones": "Whether starting from a pretrained model helps, measured fairly.",
  "103-case-self-correction": "How a robot learns to recover when the object moves under its hand.",
  "120-glossary": "Every term the course uses, in plain words.",
  "121-edge-cases": "What you might see go wrong, why it happens, and where to read more.",
  "01-setup-and-first-run": "Install everything and run the whole loop once.",
  "81-surviving-long-runs": "Keep a training run going for hours, even when something crashes.",
};

export interface CourseLesson {
  slug: string;
  title: string;
  blurb: string;
  /** 1-based position in the whole course. */
  number: number;
  module: Pick<CourseModule, "id" | "number" | "title">;
  chapter: ChapterMeta;
}

export interface CourseOutline {
  modules: (CourseModule & { lessons: CourseLesson[] })[];
  lessons: CourseLesson[];
  extras: (Extra & { chapters: { slug: string; title: string; blurb: string; chapter: ChapterMeta }[] })[];
}

/**
 * Sentence case, as the rest of the site: "Text Becomes Tokens" reads "Text becomes tokens".
 * Only words written as a capital and lower-case letters change, so VLA, ViT or Qwen stay.
 */
function sentenceCase(title: string): string {
  return title
    .split(/(\s+)/)
    .map((word, index) =>
      word
        .split("-")
        .map((part, at) =>
          (index > 0 || at > 0) && /^[A-Z][a-z]+[,:;.!?]?$/.test(part) && !KEEP.has(part.replace(/[,:;.!?]$/, ""))
            ? part.toLowerCase()
            : part,
        )
        .join("-"),
    )
    .join("");
}
const KEEP = new Set(["I", "Python", "Hugging", "Face"]);

export function courseTitle(chapter: Pick<ChapterMeta, "slug" | "title">): string {
  return TITLES[chapter.slug] ?? sentenceCase(chapter.title.replace(/^Case Study:\s*/i, ""));
}

export function courseBlurb(chapter: Pick<ChapterMeta, "slug" | "summary">): string {
  return BLURBS[chapter.slug] ?? "";
}

let memo: CourseOutline | undefined;

/** The course, resolved against the chapters that exist. A slug without a chapter is left out. */
export function getCourse(): CourseOutline {
  if (memo && process.env.NODE_ENV === "production") return memo;
  const bySlug = new Map(getAllChapters().map((chapter) => [chapter.slug, chapter]));
  const lessons: CourseLesson[] = [];
  const modules = MODULES.map((module, index) => {
    const number = index + 1;
    const ref = { id: module.id, number, title: module.title };
    const items = module.slugs
      .map((slug) => bySlug.get(slug))
      .filter((chapter): chapter is ChapterMeta => chapter !== undefined)
      .map((chapter) => {
        const lesson: CourseLesson = {
          slug: chapter.slug,
          title: courseTitle(chapter),
          blurb: courseBlurb(chapter),
          number: lessons.length + 1,
          module: ref,
          chapter,
        };
        lessons.push(lesson);
        return lesson;
      });
    return { ...module, number, lessons: items };
  }).filter((module) => module.lessons.length > 0);

  const extras = EXTRAS.map((extra) => ({
    ...extra,
    chapters: extra.slugs
      .map((slug) => bySlug.get(slug))
      .filter((chapter): chapter is ChapterMeta => chapter !== undefined)
      .map((chapter) => ({ slug: chapter.slug, title: courseTitle(chapter), blurb: courseBlurb(chapter), chapter })),
  }));

  memo = { modules, lessons, extras };
  return memo;
}

/** The lesson of the course at this slug, or undefined for a chapter outside the main path. */
export function courseLesson(slug: string): CourseLesson | undefined {
  return getCourse().lessons.find((lesson) => lesson.slug === slug);
}

/** The extra group a chapter outside the main path belongs to. */
export function courseExtra(slug: string): Extra | undefined {
  return getCourse().extras.find((extra) => extra.slugs.includes(slug));
}

/** Previous and next lesson in course order; for a chapter outside the path, its neighbours in its group. */
export function courseNeighbours(slug: string): { previous?: NeighbourRef; next?: NeighbourRef } {
  const course = getCourse();
  const index = course.lessons.findIndex((lesson) => lesson.slug === slug);
  if (index >= 0) {
    const ref = (lesson?: CourseLesson) =>
      lesson ? { slug: lesson.slug, title: lesson.title, label: `Lesson ${lesson.number}` } : undefined;
    return { previous: ref(course.lessons[index - 1]), next: ref(course.lessons[index + 1]) };
  }
  const extra = course.extras.find((group) => group.slugs.includes(slug));
  if (!extra) return {};
  const at = extra.chapters.findIndex((chapter) => chapter.slug === slug);
  const ref = (chapter?: { slug: string; title: string }) => (chapter ? { slug: chapter.slug, title: chapter.title, label: "" } : undefined);
  return { previous: ref(extra.chapters[at - 1]), next: ref(extra.chapters[at + 1]) };
}

export interface NeighbourRef {
  slug: string;
  title: string;
  /** "Lesson 4", or "" outside the course. */
  label: string;
}

/** The course as the sidebar shows it: modules with numbered lessons, then the extras. */
export function courseSidebar(): {
  id: string;
  number?: number;
  name: string;
  chapters: { slug: string; orderLabel: string; title: string }[];
}[] {
  const course = getCourse();
  return [
    ...course.modules.map((module) => ({
      id: module.id,
      number: module.number,
      name: module.title,
      chapters: module.lessons.map((lesson) => ({ slug: lesson.slug, orderLabel: String(lesson.number), title: lesson.title })),
    })),
    ...course.extras
      .filter((extra) => extra.chapters.length > 0)
      .map((extra) => ({
        id: extra.id,
        name: extra.title,
        chapters: extra.chapters.map((chapter) => ({ slug: chapter.slug, orderLabel: "", title: chapter.title })),
      })),
  ];
}
