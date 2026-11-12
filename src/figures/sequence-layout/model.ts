/**
 * The token sequences of one configuration, built the way the model code
 * builds them. Every count is derived from the config values in configs.ts and
 * from the tokenizer's real output (src/data/tokens.ts); none is written down.
 *
 * Where each rule comes from, in the tutorial repository:
 *
 *   prompt      data/processor/__init__.py apply_chat_template: the chat template's opening
 *               tokens, one <image> per image, the instruction, the closing tokens.
 *               simple_vlm_processor.py repeats each <image> img_num_tokens times.
 *   stage 2     data/pipelines/image_caption.py pads each row to seq_len + 1 ids; data/sampler.py
 *               takes ids 0..seq_len-1 as inputs and 1..seq_len as targets;
 *               batch_handlers.py masks targets that are padding or <image>.
 *   head        diffusion_policy.py _build_transformer_input: [time, conditioning], then the
 *               state, then the noisy actions (diffusion_step_conditioning "concat").
 *   state       robotics_processor.py: the state at lowdim_past_timesteps + 1 steps.
 *   actions     robotics/utils.py crop_sequence: past + 1 + future rows; the past rows enter
 *               clean (future_mask false), the rest with noise.
 *   ViT         vit_backbone.py: text_tokens slots (real tokens first, the rest zeros), then
 *               (img_size / patch_size)^2 patch tokens per image; vit.py adds no class token.
 *   CLIP        clip_hf_backbone.py: one text vector, then one vector per image. The CLIP processor
 *               has no chat template, so apply_chat_template prefixes "<image> " once per image.
 *   VLA         vision_language_backbones/base.py: "action_token" inserts one token after the
 *               last real token and reads its states; "all_tokens" reads every real token,
 *               right-aligned behind zeros in conditioning_len slots. Width: lm width x layers.
 *   Qwen        vlm_backbone, the same two kinds of conditioning; the prompt comes from Qwen's
 *               processor, which the data module does not have, so only the head is drawn.
 */

import { OBJECTS, OBJECT_IDS, instructionFor } from "@/data/labels";
import {
  displayPiece,
  paddedBatch,
  tokenization,
  tokenizations,
  tokenizer,
  type Tokenization,
} from "@/data/tokens";
import type { ObjectId } from "@/data/types";
import {
  imageNames,
  type CaptionConfig,
  type Config,
  type PolicyConfig,
} from "./configs";

/* -------------------------------------------------------------------------- */
/* What a cell looks like                                                      */
/* -------------------------------------------------------------------------- */

export type CellStyle =
  | "vision" // a patch token, or a placeholder whose vector a patch token replaces
  | "placeholder" // an <image> id that stays an id (no pixels behind it)
  | "language" // a text token
  | "key" // a text token that names the object
  | "summary" // the action token, and the one vector read from it
  | "time"
  | "state"
  | "action" // a noisy action step, predicted and scored
  | "clean" // the previous action: no noise, no loss
  | "unsplit" // a VLM state or a zero, where the split is not known (Qwen)
  | "empty"; // zeros, or padding

export const STYLE_LABEL: Record<CellStyle, string> = {
  vision: "image",
  placeholder: "<image> id, no pixels",
  language: "text",
  key: "names the object",
  summary: "action token / its states",
  time: "noise level",
  state: "joint state",
  action: "action step, noisy",
  clean: "previous action, clean",
  unsplit: "a prompt token’s states or zeros, split not drawn",
  empty: "zeros or padding",
};

/* -------------------------------------------------------------------------- */
/* Blocks, parts, panels                                                       */
/* -------------------------------------------------------------------------- */

export interface Block {
  /** Stable across configs, so a block that stays is moved rather than redrawn. */
  key: string;
  /** Index of the part the block belongs to. */
  part: number;
  /** Under the block: "front, t". */
  label: string;
  /** Under the label; the count when left out. */
  note?: string;
  n: number;
  /** Image blocks are drawn as their patch grid: side x side. */
  side?: number;
  /** Position of the block's first token in its sequence. */
  start: number;
  styles: CellStyle[];
  /** Stage 2: the ids that are scored as targets. */
  targets?: boolean[];
  /** The token at each position, where the block holds token ids (prompts, text slots); null for an empty slot. */
  pieces?: (Piece | null)[];
  /** What the token at position start + i is, in a sentence. */
  describe: (i: number) => string;
}

export interface Part {
  label: string;
  start: number;
  n: number;
  /** Draw a bracket over its blocks (parts made of several blocks). */
  bracket: boolean;
  /** The count as the bracket writes it ("4 \u00d7 256 = 1,024"); the plain count when left out. */
  detail?: string;
}

export type PanelId = "prompt" | "head";

export interface Panel {
  id: PanelId;
  title: string;
  /** One line under the title: what the sequence is. */
  subtitle: string;
  total: number;
  /** "1 + 424 + 1 + 15" */
  formula: string;
  /** "[B, 441, 256]" */
  shape: string;
  /** Written before the shape when it is not the whole drawn sequence ("inputs"). */
  shapeLabel?: string;
  parts: Part[];
  blocks: Block[];
}

export interface Sequences {
  config: Config;
  panels: Panel[];
  /** Between the two panels: how the prompt becomes the conditioning. */
  bridge?: string;
  /** Token position in one panel -> the position it becomes or comes from in the other. */
  link: (
    panel: PanelId,
    index: number,
  ) => { panel: PanelId; index: number } | null;
  /** The whole state in a few sentences, with its numbers: the figure's text alternative. */
  summary: string;
}

/* -------------------------------------------------------------------------- */
/* The tokenizer's output                                                      */
/* -------------------------------------------------------------------------- */

export interface Piece {
  piece: string;
  id: number;
}

/** The chat template around the images and the text, read from a real tokenised prompt. */
interface Template {
  open: Piece[];
  image: Piece;
  close: Piece[];
  pad: Piece;
}

function zipPieces(t: Tokenization, from = 0, to = t.ids.length): Piece[] {
  return t.ids
    .slice(from, to)
    .map((id, i) => ({ id, piece: t.pieces[from + i] }));
}

function readTemplate(): Template | null {
  const rows = paddedBatch();
  for (const row of rows) {
    const firstImage = row.pieces.indexOf("<image>");
    if (firstImage < 0) continue;
    let afterImages = firstImage;
    while (row.pieces[afterImages] === "<image>") afterImages += 1;
    const sentence = tokenizations().find(
      (s) => row.text.includes(s.text) && !s.text.includes("<image>"),
    );
    if (!sentence) continue;
    const real = row.mask.reduce((sum, m) => sum + m, 0);
    const closeStart = afterImages + sentence.ids.length;
    const padRow = rows.find((r) => r.mask.includes(0));
    const padAt = padRow ? padRow.mask.indexOf(0) : -1;
    return {
      open: zipPieces(row, 0, firstImage),
      image: { id: row.ids[firstImage], piece: "<image>" },
      close: zipPieces(row, closeStart, real),
      pad:
        padRow && padAt >= 0
          ? { id: padRow.ids[padAt], piece: padRow.pieces[padAt] }
          : { id: tokenizer.padId, piece: "" },
    };
  }
  return null;
}

const TEMPLATE = readTemplate();

export interface Instruction {
  object: ObjectId;
  /** "red cube" */
  label: string;
  text: string;
  pieces: Piece[];
  /** Pieces from this index on differ between the instructions: they name the object. */
  keyFrom: number;
}

function readInstructions(): Instruction[] {
  const found = OBJECT_IDS.flatMap((object) => {
    const t = tokenization(instructionFor(object));
    return t
      ? [
          {
            object,
            label: OBJECTS[object].label,
            text: t.text,
            pieces: zipPieces(t),
            keyFrom: 0,
          },
        ]
      : [];
  });
  // The longest run of pieces every instruction starts with ("pick", " up", " the").
  let common = 0;
  while (
    found.length > 1 &&
    found.every(
      (f) =>
        f.pieces[common] && f.pieces[common].id === found[0].pieces[common].id,
    )
  ) {
    common += 1;
  }
  return found.map((f) => ({ ...f, keyFrom: common }));
}

export const INSTRUCTIONS: Instruction[] = readInstructions();

/** A caption of the stage-2 data: the sentence of the tokenizations that describes a scene. */
function readCaption(): { text: string; pieces: Piece[] } | null {
  const instructionTexts = new Set(INSTRUCTIONS.map((i) => i.text));
  const caption = tokenizations().find(
    (s) => !instructionTexts.has(s.text) && /^robot arm/.test(s.text),
  );
  return caption ? { text: caption.text, pieces: zipPieces(caption) } : null;
}

const CAPTION = readCaption();

/** Whether the data the figure needs is there; without it the figure says so instead of drawing. */
export const DATA_READY = TEMPLATE !== null && INSTRUCTIONS.length > 0;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

function plural(n: number, word: string, many = `${word}s`): string {
  return `${formatCount(n)} ${n === 1 ? word : many}`;
}

function quote(piece: Piece): string {
  return `“${displayPiece(piece.piece)}” (id ${piece.id})`;
}

function repeat<T>(n: number, value: T): T[] {
  return Array.from({ length: n }, () => value);
}

/** Builds a sequence block by block, keeping positions and parts. */
class Builder {
  parts: Part[] = [];
  blocks: Block[] = [];
  length = 0;

  part(label: string, bracket = false, detail?: string): number {
    this.parts.push({ label, start: this.length, n: 0, bracket, detail });
    return this.parts.length - 1;
  }

  add(part: number, block: Omit<Block, "part" | "start">): Block {
    const placed = { ...block, part, start: this.length };
    this.blocks.push(placed);
    this.parts[part].n += block.n;
    this.length += block.n;
    return placed;
  }
}

/* -------------------------------------------------------------------------- */
/* The prompt                                                                  */
/* -------------------------------------------------------------------------- */

interface PromptOptions {
  /** Placeholders per image. */
  perImage: number;
  /** Their side when drawn as a patch grid. */
  side?: number;
  text: { pieces: Piece[]; keyFrom?: number; kind: "instruction" | "caption" };
  actionToken: boolean;
  /** Pad to this many ids (stage 2). */
  padTo?: number;
  /** Mark the ids scored as next-token targets (stage 2). */
  targets?: boolean;
}

function buildPrompt(
  config: Config,
  template: Template,
  options: PromptOptions,
): Builder {
  const b = new Builder();
  const images = imageNames(config);
  const caption = config.kind === "caption";
  // The stage-2 row is one sequence of its own; a policy's prompt is one of two.
  const at = caption ? "Position" : "Prompt position";
  const target = (position: number) =>
    options.targets === true && position >= 1;
  const scored = (position: number) =>
    !options.targets
      ? ""
      : position === 0
        ? " Not a target: targets start at position 1."
        : " Scored: the model predicts it from the positions before.";

  const open = b.part("chat template");
  b.add(open, {
    key: "p:open",
    label: "template",
    n: template.open.length,
    styles: repeat(template.open.length, "language"),
    targets: options.targets ? template.open.map((_, i) => target(i)) : undefined,
    pieces: template.open,
    describe: (i) =>
      `${at} ${i}: ${quote(template.open[i])}, the chat template.${scored(i)}`,
  });

  const several = images.length > 1 && options.perImage > 1;
  const imagePart = b.part(
    "placeholders",
    several,
    several
      ? `${images.length} × ${options.perImage} = ${formatCount(images.length * options.perImage)}`
      : undefined,
  );
  if (options.perImage === 1) {
    b.add(imagePart, {
      key: "p:images",
      label: "<image>",
      n: images.length,
      styles: repeat(images.length, "placeholder"),
      pieces: repeat(images.length, template.image),
      describe: (i) =>
        `${at} ${b.parts[imagePart].start + i}: ${quote(template.image)} for the ${images[i].camera} frame ${images[i].frame}. One placeholder per image (img_num_tokens: 1): it stays an id, and the pixels go to the ViT directly.`,
    });
  } else {
    images.forEach((image) => {
      const block = b.add(imagePart, {
        key: caption ? "p:image" : `p:img:${image.camera}:${image.frame}`,
        label: caption ? "image" : `${image.camera}, ${image.frame}`,
        n: options.perImage,
        side: options.side,
        styles: repeat(options.perImage, "vision"),
        targets: options.targets ? repeat(options.perImage, false) : undefined,
        pieces: repeat(options.perImage, template.image),
        describe: (i) =>
          `${at} ${block.start + i}: ${quote(template.image)}, placeholder ${i + 1} of ${options.perImage} for ${caption ? "the image" : `the ${image.camera} frame ${image.frame}`}. Its vector is overwritten with patch token ${i + 1} from the ViT and the projector.${options.targets ? " Not a target: placeholders are masked." : ""}`,
      });
    });
  }

  const textPart = b.part(options.text.kind);
  const pieces = options.text.pieces;
  const keyFrom = options.text.keyFrom ?? pieces.length;
  const textBlock = b.add(textPart, {
    key: "p:text",
    label: options.text.kind,
    n: pieces.length,
    styles: pieces.map((_, i) => (i >= keyFrom ? "key" : "language")),
    targets: options.targets ? pieces.map(() => true) : undefined,
    pieces,
    describe: (i) =>
      `${at} ${textBlock.start + i}: ${quote(pieces[i])}, the ${options.text.kind}.${i >= keyFrom ? " It names the object." : ""}${scored(textBlock.start + i)}`,
  });

  const closePart = b.part("end of turn");
  const closeBlock = b.add(closePart, {
    key: "p:close",
    label: "end",
    n: template.close.length,
    styles: repeat(template.close.length, "language"),
    targets: options.targets ? template.close.map(() => true) : undefined,
    pieces: template.close,
    describe: (i) =>
      `${at} ${closeBlock.start + i}: ${quote(template.close[i])}, closing the turn.${scored(closeBlock.start + i)}`,
  });

  if (options.actionToken) {
    const tokenPart = b.part("action token");
    const tokenBlock = b.add(tokenPart, {
      key: "p:action",
      label: "action token",
      n: 1,
      styles: ["summary"],
      describe: () =>
        `${at} ${tokenBlock.start}: the action token, a learned token inserted directly after the last real token. Its hidden states are all the action head receives from the VLM.`,
    });
  }

  if (options.padTo !== undefined && options.padTo > b.length) {
    const padPart = b.part("padding");
    const count = options.padTo - b.length;
    const padBlock = b.add(padPart, {
      key: "p:pad",
      label: "padding",
      n: count,
      styles: repeat(count, "empty"),
      targets: options.targets ? repeat(count, false) : undefined,
      pieces: repeat(count, template.pad),
      describe: (i) =>
        `${at} ${padBlock.start + i}: padding, ${quote(template.pad)}, up to ${formatCount(options.padTo ?? 0)} ids.${options.targets ? " Not a target: padding is masked." : ""}`,
    });
  }
  return b;
}

/* -------------------------------------------------------------------------- */
/* The action head's sequence                                                  */
/* -------------------------------------------------------------------------- */

function buildHead(
  config: PolicyConfig,
  instruction: Instruction,
  prompt: Builder | null,
  template: Template,
): { head: Builder; conditioning: { n: number; width: number | null } } {
  const b = new Builder();
  const images = imageNames(config);

  const time = b.part("time");
  b.add(time, {
    key: "h:time",
    label: "time",
    n: 1,
    styles: ["time"],
    describe: () =>
      `Position 0, the time token: how much noise is in this sample's actions, one row of an embedding table with ${formatCount(config.numTimesteps)} rows.`,
  });

  const cond = b.part("conditioning", true);
  const condStart = b.length;
  let width: number | null = null;

  if (config.kind === "clip") {
    b.add(cond, {
      key: "h:pooled",
      label: `text + ${images.length} images`,
      n: 1 + images.length,
      styles: ["language", ...repeat(images.length, "vision" as CellStyle)],
      describe: (i) =>
        i === 0
          ? `Position 1, conditioning: the text through CLIP’s text encoder, pooled to one vector. CLIP’s processor has no chat template, so the text is the instruction behind one “<image> ” per image: “${"<image> ".repeat(images.length)}${instruction.text}”.`
          : `Position ${1 + i}, conditioning: the ${images[i - 1].camera} frame ${images[i - 1].frame} through CLIP’s image encoder, pooled to one vector.`,
    });
  }

  if (config.kind === "vit") {
    width = config.backboneWidth;
    const promptPieces: Piece[] = [];
    const promptStyles: CellStyle[] = [];
    if (prompt && config.textTokens > 0) {
      for (const block of prompt.blocks) {
        block.styles.forEach((style, i) => {
          promptStyles.push(style);
          promptPieces.push(pieceAt(block, i, template, instruction));
        });
      }
    }
    const filled = Math.min(promptPieces.length, config.textTokens);
    const slots: Block | null =
      config.textTokens === 0 ? null : b.add(cond, {
      key: "h:slots",
      label: "text slots",
      note: `${filled} of ${config.textTokens} filled`,
      n: config.textTokens,
      styles: Array.from({ length: config.textTokens }, (_, i) =>
        i < filled ? promptStyles[i] : "empty",
      ),
      pieces: Array.from({ length: config.textTokens }, (_, i) =>
        i < filled ? promptPieces[i] : null,
      ),
      describe: (i) =>
        i < filled
          ? `Position ${(slots?.start ?? 0) + i}, text slot ${i + 1} of ${config.textTokens}: ${quote(promptPieces[i])}, prompt position ${i}, as a learned embedding.${promptStyles[i] === "key" ? " It names the object." : promptStyles[i] === "placeholder" ? " Only the id: the frame itself arrives as patch tokens." : ""}`
          : `Position ${(slots?.start ?? 0) + i}, text slot ${i + 1} of ${config.textTokens}: empty. The prompt fills ${filled}; the rest are zeros.`,
    });
    const side = config.imgSize / config.patchSize;
    images.forEach((image) => {
      const block = b.add(cond, {
        key: `h:img:${image.camera}:${image.frame}`,
        label: `${image.camera}, ${image.frame}`,
        n: side * side,
        side,
        styles: repeat(side * side, "vision"),
        describe: (i) =>
          `Position ${block.start + i}, conditioning: patch token ${i + 1} of ${side * side} of the ${image.camera} frame ${image.frame}, the ${config.patchSize}-pixel square in row ${Math.floor(i / side) + 1}, column ${(i % side) + 1} of the ${side} × ${side} grid.`,
      });
    });
  }

  if (config.kind === "vla") {
    width = config.lmWidth * config.vlmLayers;
    if (config.conditioning === "action_token") {
      const block = b.add(cond, {
        key: "h:summary",
        label: "action token’s states",
        n: 1,
        styles: ["summary"],
        describe: () =>
          `Position ${block.start}, conditioning: the action token’s hidden states in the last ${config.vlmLayers} layers of the VLM, side by side, one vector ${config.vlmLayers} × ${config.lmWidth} = ${formatCount(width ?? 0)} wide. Whatever the head needs from the images and the instruction has to be in it.`,
      });
    } else if (prompt) {
      const real = prompt.length;
      const length = config.conditioningLen > 0 ? config.conditioningLen : real;
      const zeros = Math.max(0, length - real);
      if (zeros > 0) {
        const zeroBlock = b.add(cond, {
          key: "h:zeros",
          label: "zeros",
          n: zeros,
          styles: repeat(zeros, "empty"),
          describe: (i) =>
            `Position ${zeroBlock.start + i}, conditioning slot ${i + 1} of ${formatCount(length)}: zeros. The prompt’s ${formatCount(real)} real tokens are right-aligned in ${formatCount(length)} slots (conditioning_len), so they end at the same place in every sample.`,
        });
      }
      for (const source of prompt.blocks) {
        const copy = b.add(cond, {
          key: `h:from:${source.key}`,
          label: source.label,
          n: source.n,
          side: source.side,
          styles: source.styles,
          describe: (i) =>
            `Position ${copy.start + i}, conditioning slot ${copy.start - condStart + i + 1} of ${formatCount(length)}: the hidden states of prompt position ${source.start + i} (${shortName(source, i, template, instruction)}) in the last ${config.vlmLayers} layers, ${formatCount(width ?? 0)} wide.`,
        });
      }
    }
  }

  if (config.kind === "qwen") {
    if (config.conditioning === "action_token") {
      const block = b.add(cond, {
        key: "h:summary",
        label: "action token’s states",
        n: 1,
        styles: ["summary"],
        describe: () =>
          `Position ${block.start}, conditioning: the action token’s hidden states in the last ${config.vlmLayers} layers of ${config.model}, side by side, one vector ${config.vlmLayers} × the language model’s width. Whatever the head needs from the images and the instruction has to be in it.`,
      });
    } else {
      const length = config.conditioningLen;
      const block = b.add(cond, {
        key: "h:qwen",
        label: "prompt states",
        note: `${formatCount(length)} slots`,
        n: length,
        styles: repeat(length, "unsplit"),
        describe: (i) =>
          `Position ${block.start + i}, conditioning slot ${i + 1} of ${formatCount(length)}: the hidden states of one of the prompt’s real tokens (${config.model}’s chat template, ${images.length} × ${config.imgNumTokens} image tokens, the instruction) in the last ${config.vlmLayers} layers, or a zero in front of them. The real tokens are right-aligned in the ${formatCount(length)} slots (conditioning_len); how many are zeros depends on how ${config.model}’s tokenizer splits the instruction, which this figure does not have.`,
      });
    }
  }

  const past = config.lowdimPast;
  const stateCount = past + 1;
  const frames = Array.from({ length: stateCount }, (_, i) =>
    i === stateCount - 1 ? "t" : `t-${stateCount - 1 - i}`,
  );
  const state = b.part("state");
  const stateBlock = b.add(state, {
    key: "h:state",
    label: stateCount === 1 ? "state" : "states",
    n: stateCount,
    styles: repeat(stateCount, "state"),
    describe: (i) =>
      `Position ${stateBlock.start + i}, state token, frame ${frames[i]}: the joint angles and the gripper opening.`,
  });

  const rows = past + 1 + config.lowdimFuture;
  const actions = b.part(
    "action steps",
    past > 0,
    past > 0 ? `${past} + ${rows - past} = ${rows}` : undefined,
  );
  if (past > 0) {
    const previous = b.add(actions, {
      key: "h:previous",
      label: "previous",
      n: past,
      styles: repeat(past, "clean"),
      describe: (i) =>
        `Position ${previous.start + i}, action-step token ${i + 1} of ${rows}: the previous action, as recorded. No noise is added and the loss does not score it; it sits one position in front of the chunk.`,
    });
  }
  const chunk = rows - past;
  const chunkBlock = b.add(actions, {
    key: "h:chunk",
    label: "chunk",
    n: chunk,
    styles: repeat(chunk, "action"),
    describe: (i) =>
      `Position ${chunkBlock.start + i}, action-step token ${past + i + 1} of ${rows}: action ${i + 1} of the ${chunk}-action chunk, with noise added. The head’s output at this position is the predicted direction, and the loss scores it.`,
  });

  const conditioning = b.parts[cond].n;
  return { head: b, conditioning: { n: conditioning, width } };
}

/** The piece at a prompt position, for the text slots that copy it. */
function pieceAt(
  block: Block,
  i: number,
  template: Template,
  instruction: Instruction,
): Piece {
  if (block.key === "p:open") return template.open[i];
  if (block.key === "p:images" || block.key.startsWith("p:img"))
    return template.image;
  if (block.key === "p:text") return instruction.pieces[i];
  if (block.key === "p:close") return template.close[i];
  return template.pad;
}

function shortName(
  block: Block,
  i: number,
  template: Template,
  instruction: Instruction,
): string {
  if (block.key.startsWith("p:img"))
    return `placeholder ${i + 1} of ${block.n}, ${block.label}`;
  return `“${displayPiece(pieceAt(block, i, template, instruction).piece)}”`;
}

/* -------------------------------------------------------------------------- */
/* One configuration                                                           */
/* -------------------------------------------------------------------------- */

function promptPanel(b: Builder, subtitle: string, title: string): Panel {
  const counts = b.parts.map((p) => p.n);
  return {
    id: "prompt",
    title,
    subtitle,
    total: b.length,
    formula: counts.map(formatCount).join(" + "),
    shape: `[B, ${b.length}]`,
    parts: b.parts,
    blocks: b.blocks,
  };
}

function captionSequences(
  config: CaptionConfig,
  template: Template,
): Sequences {
  const side = config.imgSize / config.patchSize;
  const pieces = CAPTION?.pieces ?? [];
  const b = buildPrompt(config, template, {
    perImage: config.imgNumTokens,
    side: side * side === config.imgNumTokens ? side : undefined,
    text: { pieces, kind: "caption" },
    actionToken: false,
    padTo: config.seqLen + 1,
    targets: true,
  });
  // Targets: ids 1..seq_len that are neither padding nor <image>.
  const scored = b.blocks.reduce(
    (sum, block) => sum + (block.targets?.filter(Boolean).length ?? 0),
    0,
  );
  const panel: Panel = {
    ...promptPanel(
      b,
      `One training row as the data loader cuts it: ${formatCount(b.length)} tokens (seq_len + 1). The model’s inputs are tokens 0 to ${config.seqLen - 1}, its targets tokens 1 to ${config.seqLen}; ${formatCount(scored)} of the targets are scored (underlined).`,
      "VLM training row",
    ),
    shapeLabel: "inputs",
    shape: `[B, ${config.seqLen}]`,
  };
  const caption = b.parts[2].n;
  return {
    config,
    panels: [panel],
    link: () => null,
    summary:
      `${config.file}: one stage-2 training row of ${formatCount(b.length)} tokens; the model’s inputs are the first ${formatCount(config.seqLen)}. ` +
      `${b.parts[0].n} chat-template tokens, ${formatCount(config.imgNumTokens)} image placeholders (a ${side} × ${side} patch grid), ` +
      `a caption of ${caption} tokens, ${b.parts[3].n} closing tokens and ${formatCount(b.parts[4]?.n ?? 0)} padding tokens. ` +
      `The loss scores ${formatCount(scored)} targets: the template tokens after the first, the caption and the closing tokens; placeholders and padding are masked.`,
  };
}

function policySequences(
  config: PolicyConfig,
  instruction: Instruction,
  template: Template,
): Sequences {
  const images = imageNames(config);
  let prompt: Builder | null = null;
  if (config.kind === "vit" && config.textTokens > 0) {
    prompt = buildPrompt(config, template, {
      perImage: config.imgNumTokens,
      text: {
        pieces: instruction.pieces,
        keyFrom: instruction.keyFrom,
        kind: "instruction",
      },
      actionToken: false,
    });
  } else if (config.kind === "vla") {
    const side = config.imgSize / config.patchSize;
    prompt = buildPrompt(config, template, {
      perImage: config.imgNumTokens,
      side: side * side === config.imgNumTokens ? side : undefined,
      text: {
        pieces: instruction.pieces,
        keyFrom: instruction.keyFrom,
        kind: "instruction",
      },
      actionToken: config.conditioning === "action_token",
    });
  }

  // The all-tokens head reads the prompt without the action token.
  const { head, conditioning } = buildHead(
    config,
    instruction,
    prompt,
    template,
  );
  const counts = head.parts.map((p) => p.n);
  const arrives =
    conditioning.width !== null
      ? ` The conditioning arrives as [B, ${conditioning.n}, ${conditioning.width}].`
      : config.kind === "qwen"
        ? ` The conditioning arrives as [B, ${conditioning.n}, ${config.vlmLayers} × the language model’s width].`
        : "";
  const headPanel: Panel = {
    id: "head",
    title: "Action head input",
    subtitle: `Time, conditioning, state and action steps, each mapped to the head’s width, ${config.headWidth}.${arrives}`,
    total: head.length,
    formula: counts.map(formatCount).join(" + "),
    shape: `[B, ${head.length}, ${config.headWidth}]`,
    parts: head.parts,
    blocks: head.blocks,
  };

  const panels: Panel[] = [];
  let bridge: string | undefined;
  if (prompt && config.kind === "vit") {
    const side = config.imgSize / config.patchSize;
    panels.push(
      promptPanel(
        prompt,
        `The instruction in the chat template, with one <image> id per frame. These ids fill the text slots.`,
        "Prompt",
      ),
    );
    bridge = `The prompt’s ${prompt.length} ids fill the first ${prompt.length} of ${config.textTokens} text slots. Each frame goes to the ViT, which cuts it into ${side} × ${side} squares of ${config.patchSize} px: ${side * side} patch tokens per frame.`;
  }
  if (prompt && config.kind === "vla") {
    panels.push(
      promptPanel(
        prompt,
        `The instruction in the chat template, ${config.imgNumTokens} placeholders per frame` +
          (config.conditioning === "action_token"
            ? ", and the action token behind the last real token."
            : "."),
        "VLM prompt",
      ),
    );
    bridge =
      config.conditioning === "action_token"
        ? `The action token’s hidden states in the last ${config.vlmLayers} layers, side by side, become one conditioning token, ${formatCount(config.lmWidth * config.vlmLayers)} wide.`
        : `Every real token’s hidden states in the last ${config.vlmLayers} layers, right-aligned behind zeros in ${formatCount(conditioning.n)} slots, become the conditioning, ${formatCount(config.lmWidth * config.vlmLayers)} wide.`;
  }
  if (config.kind === "vit" && !prompt) {
    const side = config.imgSize / config.patchSize;
    bridge = `No text: the data processor of this config (processor: none) drops the instruction. Each frame goes to the ViT, which cuts it into ${side} × ${side} squares of ${config.patchSize} px: ${side * side} patch tokens per frame.`;
  }
  if (config.kind === "clip") {
    bridge = `CLIP pools the text to one vector and each of the ${images.length} frames to one vector.`;
  }
  if (config.kind === "qwen") {
    bridge =
      `${config.model}’s prompt (its chat template, ${config.imgNumTokens} image tokens per frame, the instruction) is not drawn: the site has the from-scratch tokenizer’s output only. ` +
      (config.conditioning === "action_token"
        ? `The action token’s hidden states in the last ${config.vlmLayers} layers, side by side, become one conditioning token.`
        : `Every real token’s hidden states in the last ${config.vlmLayers} layers, right-aligned behind zeros in ${formatCount(conditioning.n)} slots, become the conditioning.`);
  }
  panels.push(headPanel);

  const promptLength = prompt?.length ?? 0;
  const zeros =
    config.kind === "vla" && config.conditioning === "all_tokens"
      ? Math.max(0, conditioning.n - promptLength)
      : 0;
  const link = (
    panel: PanelId,
    index: number,
  ): { panel: PanelId; index: number } | null => {
    if (!prompt) return null;
    const condStart = head.parts[1].start;
    if (config.kind === "vit" && config.textTokens > 0) {
      if (panel === "prompt")
        return index < config.textTokens
          ? { panel: "head", index: condStart + index }
          : null;
      const slot = index - condStart;
      return slot >= 0 && slot < Math.min(promptLength, config.textTokens)
        ? { panel: "prompt", index: slot }
        : null;
    }
    if (config.kind === "vla" && config.conditioning === "action_token") {
      if (panel === "prompt")
        return index === promptLength - 1
          ? { panel: "head", index: condStart }
          : null;
      return index === condStart
        ? { panel: "prompt", index: promptLength - 1 }
        : null;
    }
    if (config.kind === "vla") {
      if (panel === "prompt")
        return { panel: "head", index: condStart + zeros + index };
      const source = index - condStart - zeros;
      return source >= 0 && source < promptLength
        ? { panel: "prompt", index: source }
        : null;
    }
    return null;
  };

  const patches = (c: { imgSize: number; patchSize: number }) =>
    `${images.length} × ${(c.imgSize / c.patchSize) ** 2} patch tokens`;
  const condDetail =
    config.kind === "clip"
      ? `1 pooled text vector and ${images.length} pooled image vectors`
      : config.kind === "vit"
        ? config.textTokens > 0
          ? `${config.textTokens} text slots, ${promptLength} of them filled by the prompt, and ${patches(config)}`
          : `${patches(config)} and no text`
        : config.conditioning === "action_token"
          ? `1 vector, the action token’s hidden states`
          : config.kind === "qwen"
            ? `the hidden states of the prompt’s real tokens, right-aligned behind zeros; the split is not drawn`
            : `the hidden states of the prompt’s ${formatCount(promptLength)} real tokens behind ${zeros} zero slots`;
  const actionDetail =
    config.lowdimPast > 0
      ? `${counts[3]} action-step tokens: the previous action, clean, and a chunk of ${counts[3] - config.lowdimPast} noisy actions`
      : `${counts[3]} action-step tokens, the noisy chunk`;
  const promptSentence =
    config.kind === "vla"
      ? `The VLM prompt for “${instruction.text}” is ${formatCount(promptLength)} tokens long: ${prompt?.parts.map((p) => `${formatCount(p.n)} ${p.label}`).join(", ")}. `
      : config.kind === "vit" && prompt
        ? `The prompt for “${instruction.text}” is ${promptLength} ids. `
        : config.kind === "qwen"
          ? `${config.model}’s prompt is not drawn. `
          : "";
  const summary =
    `${config.file}: ${promptSentence}The action head reads ${formatCount(head.length)} tokens = ${headPanel.formula}: ` +
    `1 time token, ${plural(conditioning.n, "conditioning token")} (${condDetail}), ${plural(counts[2], "state token")} and ${actionDetail}.`;

  return { config, panels, bridge, link, summary };
}

export function sequencesFor(
  config: Config,
  instruction: Instruction,
): Sequences | null {
  if (!TEMPLATE) return null;
  if (config.kind === "caption") return captionSequences(config, TEMPLATE);
  return policySequences(config, instruction, TEMPLATE);
}

/** Head and prompt lengths of every config, for the selector. */
export function lengthsFor(
  config: Config,
  instruction: Instruction,
): { prompt: number | null; head: number | null } {
  const sequences = sequencesFor(config, instruction);
  if (!sequences) return { prompt: null, head: null };
  const prompt = sequences.panels.find((p) => p.id === "prompt");
  const head = sequences.panels.find((p) => p.id === "head");
  return { prompt: prompt?.total ?? null, head: head?.total ?? null };
}

/** Which cell styles a sequence uses, in a fixed order, for the legend. */
export function stylesUsed(sequences: Sequences): CellStyle[] {
  const used = new Set<CellStyle>();
  for (const panel of sequences.panels)
    for (const block of panel.blocks) for (const s of block.styles) used.add(s);
  return (Object.keys(STYLE_LABEL) as CellStyle[]).filter((s) => used.has(s));
}

export function hasTargets(sequences: Sequences): boolean {
  return sequences.panels.some((p) =>
    p.blocks.some((b) => b.targets?.some(Boolean)),
  );
}

/** The block and offset of a position. */
export function locate(
  panel: Panel,
  index: number,
): { block: Block; offset: number } | null {
  for (const block of panel.blocks) {
    if (index >= block.start && index < block.start + block.n)
      return { block, offset: index - block.start };
  }
  return null;
}

export function describe(panel: Panel, index: number): string {
  const found = locate(panel, index);
  return found ? found.block.describe(found.offset) : "";
}

/* -------------------------------------------------------------------------- */
/* What changes with the instruction                                           */
/* -------------------------------------------------------------------------- */

/** Whether the drawing of a config depends on which instruction is chosen. */
export function usesInstruction(config: Config): boolean {
  return (
    (config.kind === "vit" && config.textTokens > 0) || config.kind === "vla"
  );
}

/**
 * What a position holds, as a string that two sequences can compare: the
 * token id where the block holds ids ("empty" for an unfilled text slot), and
 * otherwise the block's key.
 */
function tokenAt(block: Block, offset: number): string {
  if (block.pieces) {
    const piece = block.pieces[offset];
    return piece ? String(piece.id) : "empty";
  }
  return `@${block.key}`;
}

function pieceFor(panel: Panel, index: number): Piece | null {
  const found = locate(panel, index);
  return found?.block.pieces?.[found.offset] ?? null;
}

export interface InstructionChange {
  /** Positions, per panel, whose token id differs from the one at the same position before. */
  changed: Partial<Record<PanelId, number[]>>;
  /** The change in a sentence or two, with the pieces and their ids. */
  text: string;
  /** The same, short, for the line beside the prompt. */
  short: string;
}

/**
 * Compares the id sequences drawn for two instructions position by position.
 * Only blocks that hold ids are compared: the prompt, and the text slots that
 * copy it; the hidden states of a VLA are not ids.
 */
export function instructionChange(
  before: Sequences,
  after: Sequences,
  from: Instruction,
  to: Instruction,
): InstructionChange {
  const changed: Partial<Record<PanelId, number[]>> = {};
  for (const panel of after.panels) {
    const old = before.panels.find((p) => p.id === panel.id);
    if (!old) continue;
    const positions: number[] = [];
    for (const block of panel.blocks) {
      if (!block.pieces) continue;
      for (let i = 0; i < block.n; i += 1) {
        const index = block.start + i;
        const was = locate(old, index);
        const now = tokenAt(block, i);
        if (!was || tokenAt(was.block, was.offset) !== now) positions.push(index);
      }
    }
    if (positions.length > 0) changed[panel.id] = positions;
  }

  const prompt =
    after.panels.find((p) => p.id === "prompt") ?? after.panels[0];
  const oldPrompt = before.panels.find((p) => p.id === prompt.id);
  const positions = changed[prompt.id] ?? [];
  const shown = positions.slice(0, 4).map((index) => {
    const was = oldPrompt ? pieceFor(oldPrompt, index) : null;
    const now = pieceFor(prompt, index);
    const show = (p: Piece | null) =>
      p ? `“${displayPiece(p.piece)}” (id ${p.id})` : "nothing";
    return { index, text: `${show(was)} → ${show(now)}` };
  });
  const more = positions.length - shown.length;
  const length =
    oldPrompt && oldPrompt.total !== prompt.total
      ? ` The prompt is now ${formatCount(prompt.total)} tokens long instead of ${formatCount(oldPrompt.total)}, so every later position moves.`
      : " The prompt keeps its length: the same slots hold different ids.";
  const head = changed.head?.length ?? 0;
  const list = shown.map((s) => `${s.index}: ${s.text}`).join("; ");
  const text =
    `“${from.text}” → “${to.text}”: ${plural(positions.length, "prompt position")} changed (framed): ${list}${more > 0 ? `; and ${more} more` : ""}.` +
    length +
    (head > 0
      ? ` In the action head, ${plural(head, "text slot")} changed with them.`
      : "");
  const short = `${list}${more > 0 ? `; and ${more} more` : ""}`;
  return { changed, text, short };
}
