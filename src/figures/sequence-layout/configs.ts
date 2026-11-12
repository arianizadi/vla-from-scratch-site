/**
 * The configurations the figure can show, as the values that decide their
 * token counts. Each value is copied from a file of the tutorial repository
 * (sim/pickup/configs/<file>, and the presets it includes from
 * vla_foundry/config_presets/); the comment beside it names the key. Nothing
 * here is measured: the counts are derived from these values in model.ts, the
 * way the model code derives them.
 *
 * Presets read for the defaults:
 *   config_presets/data/diffusion_policy.yaml   lowdim_past_timesteps: 1, lowdim_future_timesteps: 14
 *   config_presets/data/vla_diffusion.yaml      the same two values
 *   config_presets/models/diffusion_policy.yaml noise_scheduler.num_timesteps: 1000,
 *                                               transformer: transformer_100m (hidden_dim 512)
 *   config_presets/models/transformer_100m.yaml hidden_dim: 512 (the language model of the
 *                                               from-scratch VLM)
 */

export type ConfigId =
  | "custom_vlm"
  | "dp_clip"
  | "dp_vit"
  | "dp_vit_reactive"
  | "dp_vit_lang"
  | "dp_vit_lang_reactive"
  | "vla_custom"
  | "vla_custom_tokens"
  | "vla_custom_tokens_reactive"
  | "vla_qwen"
  | "vla_qwen_tokens_reactive";

/** The camera frames a sample holds, in the order of `data.image_indices` (0 is the current frame). */
export type FrameIndex = number;

interface Common {
  id: ConfigId;
  /** File name under sim/pickup/configs/. */
  file: string;
  /** A short name for the selector. */
  name: string;
  /** One line on what the config is. */
  description: string;
  /** data.camera_names */
  cameras: readonly string[];
  /** data.image_indices */
  imageIndices: readonly FrameIndex[];
}

/** Stage 2 of the from-scratch path: a VLM trained on captions. No action head. */
export interface CaptionConfig extends Common {
  kind: "caption";
  /** model.vit.img_size and model.vit.patch_size */
  imgSize: number;
  patchSize: number;
  /** data.img_num_tokens: placeholders written per image */
  imgNumTokens: number;
  /** data.seq_len: the data loader pads or cuts each row to seq_len + 1 ids */
  seqLen: number;
  /** transformer_100m hidden_dim: the language model's width */
  lmWidth: number;
}

interface PolicyCommon extends Common {
  /** data.lowdim_past_timesteps (preset 1; the *_reactive configs set 0) */
  lowdimPast: number;
  /** data.lowdim_future_timesteps (preset 14) */
  lowdimFuture: number;
  /** model.noise_scheduler.num_timesteps: rows of the time embedding */
  numTimesteps: number;
  /** model.transformer.hidden_dim: the width of every token of the action head */
  headWidth: number;
}

/** Pooled CLIP: one vector for the instruction and one per image. */
export interface ClipConfig extends PolicyCommon {
  kind: "clip";
}

/**
 * A small ViT whose patch tokens condition the head; with text_tokens > 0 the
 * instruction fills text slots in front of them, with 0 (data.processor "none")
 * there is no text at all.
 */
export interface VitConfig extends PolicyCommon {
  kind: "vit";
  /** model.vision_language_backbone.img_size and patch_size */
  imgSize: number;
  patchSize: number;
  /** model.vision_language_backbone.text_tokens (default 0: no text) */
  textTokens: number;
  /** model.vision_language_backbone.hidden_dim: the width of a patch token */
  backboneWidth: number;
  /** data.img_num_tokens: placeholders written per image into the prompt (text configs only) */
  imgNumTokens: number;
}

/** The from-scratch VLM as the backbone of the head. */
export interface VlaConfig extends PolicyCommon {
  kind: "vla";
  /** data.img_num_tokens: placeholders per image, one per patch of the VLM's ViT */
  imgNumTokens: number;
  /** custom_vlm.yaml model.vit.img_size and patch_size: the ViT inside the VLM */
  imgSize: number;
  patchSize: number;
  /** model.vision_language_backbone.num_vlm_layers_to_use */
  vlmLayers: number;
  /** transformer_100m hidden_dim: the width of one layer's hidden state */
  lmWidth: number;
  /** model.vision_language_backbone.conditioning (default "action_token") */
  conditioning: "action_token" | "all_tokens";
  /** model.vision_language_backbone.conditioning_len (all_tokens only; 0 = the batch's own length) */
  conditioningLen: number;
}

/**
 * Pretrained Qwen3-VL-2B as the backbone. Its prompt is built by Qwen's own
 * processor and tokenizer, whose output the data module does not have, so the
 * figure draws the action head's sequence only.
 */
export interface QwenConfig extends PolicyCommon {
  kind: "qwen";
  /** model.vision_language_backbone.hf_pretrained */
  model: string;
  /** data.img_num_tokens: image tokens per frame after Qwen merges 2 x 2 patches */
  imgNumTokens: number;
  /** model.vision_language_backbone.num_vlm_layers_to_use */
  vlmLayers: number;
  /** model.vision_language_backbone.conditioning (default "action_token") */
  conditioning: "action_token" | "all_tokens";
  /** model.vision_language_backbone.conditioning_len (all_tokens only) */
  conditioningLen: number;
}

export type PolicyConfig = ClipConfig | VitConfig | VlaConfig | QwenConfig;
export type Config = CaptionConfig | PolicyConfig;

const CAMERAS = ["front", "wrist"] as const;

export const CONFIGS: readonly Config[] = [
  {
    id: "custom_vlm",
    kind: "caption",
    file: "custom_vlm.yaml",
    name: "VLM, stage 2",
    description: "the from-scratch VLM learning to caption one camera frame",
    cameras: ["front"],
    imageIndices: [0],
    imgSize: 224,
    patchSize: 14,
    imgNumTokens: 256,
    seqLen: 320,
    lmWidth: 512,
  },
  {
    id: "dp_clip",
    kind: "clip",
    file: "dp_clip.yaml",
    name: "Pooled CLIP",
    description:
      "one CLIP vector for the instruction and one per camera frame, with history",
    cameras: CAMERAS,
    imageIndices: [-1, 0],
    lowdimPast: 1,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 512,
  },
  {
    id: "dp_vit",
    kind: "vit",
    file: "dp_vit.yaml",
    name: "ViT patches, history",
    description:
      "ViT patch tokens of the current and the previous frames, no text; the previous state and action",
    cameras: CAMERAS,
    imageIndices: [-1, 0],
    lowdimPast: 1,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 256,
    imgSize: 224,
    patchSize: 16,
    textTokens: 0,
    backboneWidth: 256,
    imgNumTokens: 0,
  },
  {
    id: "dp_vit_reactive",
    kind: "vit",
    file: "dp_vit_reactive.yaml",
    name: "ViT patches, no history",
    description:
      "ViT patch tokens of the current frames and the current state only, no text",
    cameras: CAMERAS,
    imageIndices: [0],
    lowdimPast: 0,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 256,
    imgSize: 224,
    patchSize: 16,
    textTokens: 0,
    backboneWidth: 256,
    imgNumTokens: 0,
  },
  {
    id: "dp_vit_lang",
    kind: "vit",
    file: "dp_vit_lang.yaml",
    name: "ViT patches + text, history",
    description:
      "ViT patch tokens and 32 text slots, with the previous frames, the previous state and the previous action",
    cameras: CAMERAS,
    imageIndices: [-1, 0],
    lowdimPast: 1,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 256,
    imgSize: 224,
    patchSize: 16,
    textTokens: 32,
    backboneWidth: 256,
    imgNumTokens: 1,
  },
  {
    id: "dp_vit_lang_reactive",
    kind: "vit",
    file: "dp_vit_lang_reactive.yaml",
    name: "ViT patches + text, no history",
    description:
      "ViT patch tokens and 32 text slots; the current frames and state only",
    cameras: CAMERAS,
    imageIndices: [0],
    lowdimPast: 0,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 256,
    imgSize: 224,
    patchSize: 16,
    textTokens: 32,
    backboneWidth: 256,
    imgNumTokens: 1,
  },
  {
    id: "vla_custom",
    kind: "vla",
    file: "vla_custom.yaml",
    name: "VLA, one action token",
    description:
      "the stage-2 VLM as backbone; the head reads one appended token",
    cameras: CAMERAS,
    imageIndices: [-1, 0],
    lowdimPast: 1,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 256,
    imgNumTokens: 256,
    imgSize: 224,
    patchSize: 14,
    vlmLayers: 4,
    lmWidth: 512,
    conditioning: "action_token",
    conditioningLen: 0,
  },
  {
    id: "vla_custom_tokens",
    kind: "vla",
    file: "vla_custom_tokens.yaml",
    name: "VLA, every token, history",
    description:
      "the same VLM; the head reads the states of every prompt token, with the previous frames, state and action",
    cameras: CAMERAS,
    imageIndices: [-1, 0],
    lowdimPast: 1,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 256,
    imgNumTokens: 256,
    imgSize: 224,
    patchSize: 14,
    vlmLayers: 4,
    lmWidth: 512,
    conditioning: "all_tokens",
    conditioningLen: 1040,
  },
  {
    id: "vla_custom_tokens_reactive",
    kind: "vla",
    file: "vla_custom_tokens_reactive.yaml",
    name: "VLA, every token, no history",
    description:
      "the same VLM; the head reads the states of every prompt token, from the current frames and state only",
    cameras: CAMERAS,
    imageIndices: [0],
    lowdimPast: 0,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 256,
    imgNumTokens: 256,
    imgSize: 224,
    patchSize: 14,
    vlmLayers: 4,
    lmWidth: 512,
    conditioning: "all_tokens",
    conditioningLen: 528,
  },
  {
    id: "vla_qwen",
    kind: "qwen",
    file: "vla_qwen.yaml",
    name: "Qwen VLA, one action token",
    description:
      "pretrained Qwen3-VL-2B as backbone; the head reads one appended token. Qwen's prompt is not drawn",
    cameras: CAMERAS,
    imageIndices: [-1, 0],
    lowdimPast: 1,
    lowdimFuture: 14,
    numTimesteps: 1000,
    // vla_diffusion_paligemma2.yaml includes transformer_100m.yaml: hidden_dim 512.
    headWidth: 512,
    model: "Qwen3-VL-2B",
    imgNumTokens: 49,
    vlmLayers: 4,
    conditioning: "action_token",
    conditioningLen: 0,
  },
  {
    id: "vla_qwen_tokens_reactive",
    kind: "qwen",
    file: "vla_qwen_tokens_reactive.yaml",
    name: "Qwen VLA, every token, no history",
    description:
      "pretrained Qwen3-VL-2B; the head reads the states of every prompt token, from the current frames and state only. Qwen's prompt is not drawn",
    cameras: CAMERAS,
    imageIndices: [0],
    lowdimPast: 0,
    lowdimFuture: 14,
    numTimesteps: 1000,
    headWidth: 512,
    model: "Qwen3-VL-2B",
    imgNumTokens: 49,
    vlmLayers: 4,
    conditioning: "all_tokens",
    conditioningLen: 128,
  },
];

export function configById(id: ConfigId): Config {
  const found = CONFIGS.find((config) => config.id === id);
  if (!found) throw new Error(`sequence-layout: unknown config ${id}`);
  return found;
}

/** "t" for the current frame, "t-1" for the one before. */
export function frameLabel(index: FrameIndex): string {
  return index === 0 ? "t" : `t${index}`;
}

/**
 * The images of one sample in the order the data pipeline builds them
 * (params/data_params.py: for each index, every camera): front t-1, wrist t-1,
 * front t, wrist t.
 */
export function imageNames(
  config: Config,
): { camera: string; frame: string }[] {
  return config.imageIndices.flatMap((index) =>
    config.cameras.map((camera) => ({ camera, frame: frameLabel(index) })),
  );
}

/**
 * The config a chapter's figure opens with. The figure receives only its
 * caption, and each chapter's caption says which sequence it is about: the
 * VLM's training row (chapters on joining vision and language and on training
 * a VLM), the VLA's two sequences (anatomy of a VLA), the policy with history
 * (history and shortcuts), or the policy that solves the task (everywhere
 * else). /figures shows the figure with the first caption a chapter gives it,
 * and opens on the config that caption describes.
 */
export function initialConfig(caption: string | undefined): ConfigId {
  const text = caption ?? "";
  if (/loss targets?|image placeholders/i.test(text)) return "custom_vlm";
  if (/VLM.s token sequence/i.test(text)) return "vla_custom";
  if (/history doubles/i.test(text)) return "dp_vit_lang";
  return "dp_vit_lang_reactive";
}
