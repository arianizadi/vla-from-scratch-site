/**
 * The entries of the timeline: the papers and systems named in chapters 02
 * ("From Language Models to Robot Policies") and 03 ("The Model Families
 * Today") of the tutorial, with the year and the one line those chapters give
 * them, and nothing they do not cite. A work is placed in the year the
 * chapters give for it.
 *
 * `buildsOn` has two kinds of relation. A stated one is a relation the two
 * chapters make ("removed that limit", "a later encoder of the same kind",
 * "PaliGemma" as backbone, "the same bins"), with the words that say how; it
 * is drawn solid. An inferred one (`inferred: true`) is a relation the
 * chapters imply without saying it, for example two systems they describe
 * with the same action output; it is drawn dashed and labelled as inferred
 * wherever it is listed.
 *
 * `offChart` names a part an entry is built from that is not itself on the
 * timeline, such as RT-2's pretrained VLM (PaLI-X or PaLM-E, chapter 3). It is
 * drawn as a line from the edge of the strand it belongs to.
 *
 * Chapter links point at the section of chapter 02 or 03 that discusses the
 * work and at the deeper chapter the text links to from there. The titles are
 * copied from the chapters' front matter.
 */

/** A modality hue, as in DESIGN.md: text, image, action. */
export type Modality = "language" | "vision" | "action";

export type StrandId = "language" | "vision" | "vlm" | "vla" | "policy";

export interface Strand {
  id: StrandId;
  /** Lane name, sentence case. */
  label: string;
  /** What the strand's models take in and put out, in the modality hues. Drawn as the sectors of a marker. */
  modalities: readonly Modality[];
}

/**
 * Lanes from top to bottom. Vision-language-action models sit between the two
 * lines they join: vision-language models above, robot policies below.
 */
export const STRANDS: readonly Strand[] = [
  { id: "language", label: "Language models", modalities: ["language"] },
  { id: "vision", label: "Vision encoders", modalities: ["vision"] },
  { id: "vlm", label: "Vision-language models", modalities: ["vision", "language"] },
  { id: "vla", label: "Vision-language-action models", modalities: ["vision", "language", "action"] },
  { id: "policy", label: "Robot learning", modalities: ["vision", "action"] },
];

export const MODALITY_LABEL: Record<Modality, string> = {
  language: "text",
  vision: "image",
  action: "action",
};

export interface ChapterRef {
  /** File name without .md; the page is /learn/<slug>. */
  slug: string;
  /** Heading id inside the chapter, when the link is to one section. */
  section?: string;
  /** The section heading as the chapter writes it. */
  sectionTitle?: string;
}

/** Chapter titles, from the front matter of each chapter file. */
export const CHAPTER_TITLES: Record<string, string> = {
  "02-how-we-got-here": "From Language Models to Robot Policies",
  "03-the-landscape": "The Model Families Today",
  "10-tokens": "Text Becomes Tokens",
  "11-the-transformer-block": "The Transformer Block",
  "13-training-a-language-model": "Training a Language Model",
  "20-images-to-tokens": "Images Become Tokens",
  "21-pooled-vs-patch-tokens": "One Vector or Many Tokens",
  "22-pretrained-vision-encoders": "Pretrained Vision Encoders",
  "30-joining-vision-and-language": "Joining Vision and Language",
  "41-flow-matching": "Generating Actions with Flow Matching",
  "42-chunks-and-execution": "Action Chunks and Closed-Loop Execution",
  "43-imitation-learning": "Imitation Learning and Why It Breaks",
};

export interface Relation {
  /** Id of the earlier entry. */
  id: string;
  /** How this entry builds on it: in the chapters' words, or (inferred) what in the chapters suggests it. */
  how: string;
  /** The chapters imply the relation but do not state it. */
  inferred?: boolean;
}

/** A part an entry is built from that is not on the timeline. */
export interface OffChart {
  /** The strand it would belong to: the line starts at that lane's edge. */
  strand: StrandId;
  /** What it is, as the chapters name it. */
  name: string;
  how: string;
}

export interface Entry {
  id: string;
  /** Name on the timeline. */
  name: string;
  /** First author or team, as the reading list gives it. */
  who: string;
  /** What it is, when it is not a model: "dataset", "training framework", ... */
  kind?: string;
  year: number;
  strand: StrandId;
  /** The one line from the reading list (or the chapter text, where the list has none). */
  line: string;
  buildsOn: readonly Relation[];
  offChart?: readonly OffChart[];
  /** Where it is discussed: chapter 02 or 03 first, then the deeper chapter the text links to. */
  chapters: readonly ChapterRef[];
}

const CH02 = "02-how-we-got-here";
const CH03 = "03-the-landscape";

const SEQUENCES: ChapterRef = { slug: CH02, section: "sequences-and-attention-2014-2017", sectionTitle: "Sequences and attention (2014-2017)" };
const PRETRAINING: ChapterRef = { slug: CH02, section: "pretraining-and-scale-2018-2020", sectionTitle: "Pretraining and scale (2018-2020)" };
const IMAGES: ChapterRef = { slug: CH02, section: "images-as-tokens-2020-2021", sectionTitle: "Images as tokens (2020-2021)" };
const VLMS: ChapterRef = {
  slug: CH02,
  section: "image-tokens-inside-a-language-model-2022-2024",
  sectionTitle: "Image tokens inside a language model (2022-2024)",
};
const IMITATION: ChapterRef = {
  slug: CH02,
  section: "imitation-before-large-models-1988-2011",
  sectionTitle: "Imitation before large models (1988-2011)",
};
const SCALE: ChapterRef = {
  slug: CH02,
  section: "scale-then-a-vlm-as-the-backbone-2021-2023",
  sectionTitle: "Scale, then a VLM as the backbone (2021-2023)",
};
const HEADS: ChapterRef = { slug: CH02, section: "generative-action-heads-2023", sectionTitle: "Generative action heads (2023)" };
const SHARED: ChapterRef = {
  slug: CH02,
  section: "shared-data-and-generalist-policies-2023-2025",
  sectionTitle: "Shared data and generalist policies (2023-2025)",
};
const REPOSITORY: ChapterRef = { slug: CH02, section: "in-this-repository", sectionTitle: "In this repository" };
const CHOICE_ACTIONS: ChapterRef = {
  slug: CH03,
  section: "choice-1-how-actions-are-produced",
  sectionTitle: "Choice 1: how actions are produced",
};
const CHOICE_DATA: ChapterRef = {
  slug: CH03,
  section: "choices-4-and-5-data-and-availability",
  sectionTitle: "Choices 4 and 5: data and availability",
};

export const ENTRIES: readonly Entry[] = [
  // Language models
  {
    id: "seq2seq",
    name: "Sequence to sequence",
    who: "Sutskever",
    year: 2014,
    strand: "language",
    line: "Two recurrent networks with one fixed-length vector between encoder and decoder.",
    buildsOn: [],
    chapters: [SEQUENCES],
  },
  {
    id: "attention",
    name: "Attention",
    who: "Bahdanau",
    year: 2014,
    strand: "language",
    line: "Attention over all encoder states: a weighted average, recomputed for every word produced.",
    buildsOn: [{ id: "seq2seq", how: "removed the one-vector limit" }],
    chapters: [SEQUENCES],
  },
  {
    id: "transformer",
    name: "Transformer",
    who: "Vaswani",
    year: 2017,
    strand: "language",
    line: "The Transformer: recurrence dropped, only attention kept, so all positions train in parallel.",
    buildsOn: [{ id: "attention", how: "kept only attention" }],
    chapters: [SEQUENCES, { slug: "11-the-transformer-block" }],
  },
  {
    id: "gpt",
    name: "GPT",
    who: "Radford",
    year: 2018,
    strand: "language",
    line: "Next-token pretraining on unlabelled text, then fine-tuning.",
    buildsOn: [{ id: "transformer", how: "a Transformer trained to predict the next token" }],
    chapters: [PRETRAINING, { slug: "13-training-a-language-model" }],
  },
  {
    id: "gpt3",
    name: "GPT-3",
    who: "Brown",
    year: 2020,
    strand: "language",
    line: "Tasks specified in the prompt: a large enough model performs them from examples.",
    buildsOn: [{ id: "gpt", how: "the same pretraining, at a larger scale" }],
    chapters: [PRETRAINING, { slug: "13-training-a-language-model" }],
  },

  // Vision encoders
  {
    id: "vit",
    name: "ViT",
    who: "Dosovitskiy",
    year: 2020,
    strand: "vision",
    line: "Image patches of 16x16 pixels as Transformer tokens.",
    buildsOn: [{ id: "transformer", how: "feeds the patches to a standard Transformer" }],
    chapters: [IMAGES, { slug: "20-images-to-tokens" }],
  },
  {
    id: "clip",
    name: "CLIP",
    who: "Radford",
    year: 2021,
    strand: "vision",
    line: "Contrastive image-text pretraining on 400 million pairs: one pooled vector per image.",
    buildsOn: [{ id: "vit", how: "a ViT image encoder (chapter 2 measures CLIP ViT-B/32)", inferred: true }],
    chapters: [IMAGES, { slug: "21-pooled-vs-patch-tokens" }, { slug: "22-pretrained-vision-encoders" }],
  },
  {
    id: "siglip",
    name: "SigLIP",
    who: "Zhai",
    year: 2023,
    strand: "vision",
    line: "Contrastive image-text pretraining with a per-pair loss.",
    buildsOn: [{ id: "clip", how: "a later encoder of the same kind" }],
    chapters: [IMAGES],
  },

  // Vision-language models
  {
    id: "flamingo",
    name: "Flamingo",
    who: "Alayrac",
    year: 2022,
    strand: "vlm",
    line: "Frozen models bridged by a resampler and new cross-attention layers.",
    buildsOn: [{ id: "gpt3", how: "a frozen pretrained language model, the reusable part GPT-style pretraining made", inferred: true }],
    chapters: [VLMS, { slug: "30-joining-vision-and-language" }],
  },
  {
    id: "blip2",
    name: "BLIP-2",
    who: "Li",
    year: 2023,
    strand: "vlm",
    line: "A small Querying Transformer, the only trained part, between frozen models.",
    buildsOn: [{ id: "gpt3", how: "a frozen pretrained language model, the reusable part GPT-style pretraining made", inferred: true }],
    chapters: [VLMS, { slug: "30-joining-vision-and-language" }],
  },
  {
    id: "llava",
    name: "LLaVA",
    who: "Liu",
    year: 2023,
    strand: "vlm",
    line: "One trainable linear layer from CLIP patch features into the language model.",
    buildsOn: [
      { id: "clip", how: "its patch features are the image input" },
      { id: "gpt3", how: "a pretrained language model, the reusable part GPT-style pretraining made", inferred: true },
    ],
    chapters: [VLMS, { slug: "30-joining-vision-and-language" }],
  },
  {
    id: "paligemma",
    name: "PaliGemma",
    who: "Beyer",
    year: 2024,
    strand: "vlm",
    line: "A 3B VLM built for transfer: SigLIP patch tokens projected into Gemma-2B.",
    buildsOn: [
      { id: "siglip", how: "SigLIP patch tokens are the image input" },
      { id: "llava", how: "the LLaVA design: a linear projection" },
    ],
    chapters: [VLMS, { slug: "30-joining-vision-and-language" }],
  },

  // Imitation learning and policies
  {
    id: "alvinn",
    name: "ALVINN",
    who: "Pomerleau",
    year: 1988,
    strand: "policy",
    line: "Supervised learning of steering from camera and range-finder images.",
    buildsOn: [],
    chapters: [IMITATION, { slug: "43-imitation-learning" }],
  },
  {
    id: "reductions",
    name: "Efficient reductions",
    who: "Ross and Bagnell",
    year: 2010,
    strand: "policy",
    line: "Compounding errors: a cloned policy's regret grows quadratically with the horizon.",
    buildsOn: [{ id: "alvinn", how: "analyses behaviour cloning, the supervised learning ALVINN did", inferred: true }],
    chapters: [IMITATION, { slug: "43-imitation-learning" }],
  },
  {
    id: "dagger",
    name: "DAgger",
    who: "Ross",
    year: 2011,
    strand: "policy",
    line: "The expert labels the states the learned policy reaches.",
    buildsOn: [{ id: "reductions", how: "the standard fix for compounding errors" }],
    chapters: [IMITATION, { slug: "43-imitation-learning" }],
  },
  {
    id: "bcz",
    name: "BC-Z",
    who: "Jang",
    year: 2021,
    strand: "policy",
    line: "Language-conditioned cloning of 100+ tasks on a real robot.",
    buildsOn: [],
    chapters: [SCALE],
  },
  {
    id: "rt1",
    name: "RT-1",
    who: "Brohan",
    year: 2022,
    strand: "policy",
    line: "A Transformer policy on 130k real-robot episodes; actions as 256 bins per dimension.",
    buildsOn: [{ id: "transformer", how: "a Transformer that outputs action tokens" }],
    chapters: [SCALE],
  },
  {
    id: "flow",
    name: "Flow matching",
    who: "Lipman",
    kind: "generative-modelling method",
    year: 2022,
    strand: "policy",
    line: "A generator trained by regressing the velocity that carries noise to data.",
    buildsOn: [],
    chapters: [HEADS, { slug: "41-flow-matching" }],
  },
  {
    id: "diffusion-policy",
    name: "Diffusion Policy",
    who: "Chi",
    year: 2023,
    strand: "policy",
    line: "Action sequences by denoising; executes the first part, then plans again.",
    buildsOn: [],
    chapters: [HEADS, CHOICE_ACTIONS, { slug: "42-chunks-and-execution" }],
  },
  {
    id: "act",
    name: "ACT",
    who: "Zhao",
    year: 2023,
    strand: "policy",
    line: "Action chunking on low-cost bimanual hardware (ALOHA), trained as a CVAE.",
    buildsOn: [],
    chapters: [HEADS, CHOICE_ACTIONS, { slug: "42-chunks-and-execution" }],
  },
  {
    id: "oxe",
    name: "Open X-Embodiment",
    who: "Open X-Embodiment Collaboration",
    kind: "dataset",
    year: 2023,
    strand: "policy",
    line: "Pooled data from 22 robots in one standard format.",
    buildsOn: [],
    chapters: [SHARED],
  },
  {
    id: "octo",
    name: "Octo",
    who: "Octo Model Team",
    year: 2024,
    strand: "policy",
    line: "An open generalist policy: a transformer trained on robot data, with a diffusion head.",
    buildsOn: [
      { id: "oxe", how: "trained on its data" },
      { id: "diffusion-policy", how: "a diffusion head, the family Diffusion Policy applies to visuomotor control", inferred: true },
    ],
    chapters: [SHARED, CHOICE_DATA],
  },

  // Vision-language-action models
  {
    id: "rt2",
    name: "RT-2",
    who: "Brohan",
    year: 2023,
    strand: "vla",
    line: "A VLM, trained on robot and web data together, that outputs actions as tokens.",
    buildsOn: [{ id: "rt1", how: "the same 256 bins per action dimension, written as tokens", inferred: true }],
    offChart: [{ strand: "vlm", name: "PaLI-X or PaLM-E", how: "the pretrained VLM it started from" }],
    chapters: [SCALE, CHOICE_ACTIONS],
  },
  {
    id: "openvla",
    name: "OpenVLA",
    who: "Kim",
    year: 2024,
    strand: "vla",
    line: "An open 7B VLA with tokenised actions: Llama 2 with DINOv2 and SigLIP features.",
    buildsOn: [
      { id: "rt2", how: "the same bins, emitted as tokens" },
      { id: "siglip", how: "SigLIP features" },
      { id: "oxe", how: "trained on its data" },
    ],
    offChart: [{ strand: "language", name: "Llama 2", how: "the language model of its backbone" }],
    chapters: [SHARED, CHOICE_ACTIONS],
  },
  {
    id: "pi0",
    name: "π0",
    who: "Black",
    year: 2024,
    strand: "vla",
    line: "A VLM with a flow-matching action expert, predicting chunks of 50 actions.",
    buildsOn: [
      { id: "paligemma", how: "PaliGemma is its backbone" },
      { id: "rt2", how: "the VLM backbone of RT-2" },
      { id: "diffusion-policy", how: "the continuous generative head of Diffusion Policy" },
      { id: "flow", how: "the action expert is trained with flow matching" },
    ],
    chapters: [SHARED, CHOICE_ACTIONS, { slug: "41-flow-matching" }],
  },
  {
    id: "fast",
    name: "FAST",
    who: "Pertsch",
    year: 2025,
    strand: "vla",
    line: "A compressed action tokenizer; π0 trained with its tokens is π0-FAST.",
    buildsOn: [{ id: "pi0", how: "π0 trained with these tokens" }],
    chapters: [CHOICE_ACTIONS, { slug: "10-tokens" }],
  },
  {
    id: "groot",
    name: "GR00T N1",
    who: "Bjorck",
    year: 2025,
    strand: "vla",
    line: "A dual-system VLA for humanoids: a VLM and a diffusion transformer.",
    buildsOn: [{ id: "diffusion-policy", how: "a diffusion transformer as the action output", inferred: true }],
    offChart: [{ strand: "vlm", name: "a VLM (System 2)", how: "its backbone" }],
    chapters: [SHARED],
  },
  {
    id: "smolvla",
    name: "SmolVLA",
    who: "Shukor",
    year: 2025,
    strand: "vla",
    line: "A compact VLA for consumer hardware, with a flow-matching action expert.",
    buildsOn: [
      { id: "pi0", how: "the same output as π0: a flow-matching action expert, chunks of 50", inferred: true },
      { id: "flow", how: "a flow-matching action expert" },
    ],
    offChart: [{ strand: "vlm", name: "SmolVLM-2", how: "its backbone" }],
    chapters: [SHARED],
  },
  {
    id: "foundry",
    name: "VLA Foundry",
    who: "Mercat",
    kind: "training framework",
    year: 2026,
    strand: "vla",
    line: "The framework the tutorial's repository forks.",
    buildsOn: [],
    chapters: [REPOSITORY],
  },
];

// ---------------------------------------------------------------------------
// Derived lists. Everything the figure prints (years, counts, ranges) comes
// from here, so an entry added above appears everywhere without other edits.
// ---------------------------------------------------------------------------

export const ENTRY_BY_ID: ReadonlyMap<string, Entry> = new Map(ENTRIES.map((entry) => [entry.id, entry]));

export const STRAND_BY_ID: ReadonlyMap<StrandId, Strand> = new Map(STRANDS.map((strand) => [strand.id, strand]));

const STRAND_ORDER: ReadonlyMap<StrandId, number> = new Map(STRANDS.map((strand, index) => [strand.id, index]));

/** Entries in time order; within a year, by lane from top to bottom, then as listed. */
export const CHRONOLOGICAL: readonly Entry[] = ENTRIES.map((entry, index) => ({ entry, index }))
  .sort(
    (a, b) =>
      a.entry.year - b.entry.year ||
      (STRAND_ORDER.get(a.entry.strand) ?? 0) - (STRAND_ORDER.get(b.entry.strand) ?? 0) ||
      a.index - b.index,
  )
  .map(({ entry }) => entry);

/** The years that have at least one entry, ascending. */
export const YEARS: readonly number[] = [...new Set(CHRONOLOGICAL.map((entry) => entry.year))];

export interface Link {
  from: string;
  to: string;
  how: string;
  inferred: boolean;
}

/** Every "builds on" relation as a line from the earlier entry to the later one. */
export const LINKS: readonly Link[] = ENTRIES.flatMap((entry) =>
  entry.buildsOn
    .filter((relation) => ENTRY_BY_ID.has(relation.id))
    .map((relation) => ({ from: relation.id, to: entry.id, how: relation.how, inferred: relation.inferred === true })),
);

/** Every part from off the timeline, with the entry it feeds. */
export const OFF_CHART_LINKS: readonly (OffChart & { to: string })[] = ENTRIES.flatMap((entry) =>
  (entry.offChart ?? []).map((item) => ({ ...item, to: entry.id })),
);

/** Entries that name this one in their buildsOn. */
export function ledTo(id: string): { entry: Entry; how: string; inferred: boolean }[] {
  return LINKS.filter((link) => link.from === id).flatMap((link) => {
    const entry = ENTRY_BY_ID.get(link.to);
    return entry ? [{ entry, how: link.how, inferred: link.inferred }] : [];
  });
}

/** Every entry this one builds on, directly or through others. */
export function ancestorsOf(id: string): Set<string> {
  const found = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    for (const relation of ENTRY_BY_ID.get(current)?.buildsOn ?? []) {
      if (!found.has(relation.id) && ENTRY_BY_ID.has(relation.id)) {
        found.add(relation.id);
        queue.push(relation.id);
      }
    }
  }
  return found;
}

/** Every entry that builds on this one, directly or through others. */
export function descendantsOf(id: string): Set<string> {
  const found = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    for (const link of LINKS) {
      if (link.from === current && !found.has(link.to)) {
        found.add(link.to);
        queue.push(link.to);
      }
    }
  }
  return found;
}

/** A chapter, or a section of it: section anchors live in the technical page (/full). */
export function chapterHref(ref: ChapterRef): string {
  return ref.section ? `/learn/${ref.slug}/full#${ref.section}` : `/learn/${ref.slug}`;
}

/** "02", the chapter's order number, from its slug. */
export function chapterNumber(ref: ChapterRef): string {
  return ref.slug.split("-")[0];
}

export function chapterTitle(ref: ChapterRef): string {
  return CHAPTER_TITLES[ref.slug] ?? ref.slug.replace(/^\d+-/, "").replace(/-/g, " ");
}

/** "a, b and c". */
export function listWords(words: readonly string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
