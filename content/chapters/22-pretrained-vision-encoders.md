---
title: Pretrained Vision Encoders
part: 2 Vision
order: 22
summary: Choose between a from-scratch ViT, a pretrained encoder from the timm library and a VLM's own vision tower, knowing what CLIP, SigLIP and DINOv2 features carry and what each costs in tokens.
status: draft
---

# Pretrained Vision Encoders

A pretrained vision encoder, here always a Vision Transformer (ViT), has weights trained on a
large image collection before it sees any robot data. A policy that reuses one starts with
features that already separate objects and, if the encoder was trained with captions, tie them to
words, instead of learning that from a few thousand demonstrations. Which encoder, at what
resolution, frozen (weights fixed) or trained, decides how many tokens the policy pays for and
whether those tokens still say where things are.

## The idea

[Images to tokens](20-images-to-tokens.md) showed how a ViT cuts an image into square patches and
turns each patch into a token. The encoders in this chapter share that architecture and differ in
the training signal, which decides what the tokens are good for.

Background, from the CLIP, SigLIP and DINOv2 papers:

| Encoder | Training signal | Data | What the loss is computed on |
|---|---|---|---|
| CLIP | contrastive: each image must pick its caption among the captions in the batch, and each caption its image, with a softmax over the batch; matching pairs are pulled together, all others pushed apart | 400 million image-text pairs from the web | one embedding per image, one per caption |
| SigLIP | the same pairing, but each image-text pair is scored on its own with a sigmoid, without normalising over the batch | web image-text pairs | one embedding per image, one per caption |
| DINOv2 | no text and no labels (self-supervised: the target is made from the images themselves). A student network sees cropped, partly masked views of an image and must match a teacher network, a slowly updated average of the student's weights, on the whole image and on each masked patch | 142 million curated images | the image-level token and the masked patch tokens |

The last column matters. Worked example (background): CLIP ViT-B/32, the encoder that
`dp_clip.yaml` loads, turns a 224 px frame into 49 patch tokens plus one class token, an extra
learned token whose final state stands for the whole image. CLIP's loss reads only the projected
class token, 1 of 50 outputs. CLIP and SigLIP features are therefore aligned with language, but
their patch tokens are a by-product; no loss term asks a single patch to be right. A DINOv2 ViT
with 14 px patches turns the same frame into 256 patch tokens plus a class token, and its loss,
which uses no language, reads the class token and the patch tokens that were masked.

A grasp needs both. On `pick_target` the policy must find the object the instruction names
(semantics) and put the gripper on it (geometry). The lab notebook's grasp tolerance test gives the
scale of the second, and it differs between the two machines. With the scripted expert's grasp
point shifted sideways by 10 mm, the expert succeeds on the can 60% of the time and on the hex nut
61% on machine A. On machine B the same shift leaves 94% and 97%, and the drop comes at 20 mm
(can 29%, hex nut 70%).

## How it works

### Semantics and geometry

Background. El Banani et al. (2024) kept each encoder's weights fixed and trained a dense decoder
on top (a probe: a separate network that reads a property out of the features) to predict depth
and surface normals. DINOv2 gave accurate, detailed depth; CLIP and the other language-supervised
models did poorly. Tong et al. (2024) collected pairs of images that CLIP embeds as nearly
identical although they differ visibly. Multimodal language models, GPT-4V among them, often
answered simple questions about the differences wrongly, mostly on the visual patterns that also
trouble CLIP. Adding DINOv2 features improved visual grounding (tying an answer to the right image
region).

On semantics the order reverses. Karamcheti et al. (2024, Prismatic VLMs) compared encoders as the
single vision input of a VLM: CLIP and SigLIP were better than DINOv2 alone. Fusing DINOv2 with SigLIP, by concatenating the two encoders' features for each patch, gave
gains across the benchmarks, the largest on localisation tasks (answering with where an object is,
for example a bounding box) and on the paper's harder "challenge" tasks. The same fusion with CLIP
gave no significant gain. OpenVLA (Kim et al., 2024) uses the fused DINOv2 and SigLIP encoder for
robot control.

### Resolution and the token budget

An image of side $s$ cut into patches of side $p$ gives $(s/p)^2$ tokens. Halving the patch size or
doubling the resolution multiplies the token count by four. The cameras here render 224 x 224
frames, which the configurations in `sim/pickup/configs/` turn into:

| Configuration | Patch | Grid | Tokens per image | What the action head receives |
|---|---|---|---|---|
| `dp_vit.yaml`, from-scratch ViT | 16 px | 14 x 14 | 196, each 256 wide | all of them: `[batch, 784, 256]` for the 4 images (2 cameras x 2 time steps) |
| `custom_vlm.yaml`, from-scratch ViT | 14 px | 16 x 16 | 256, each 256 wide | not a policy; the tokens go to the language model |
| `dp_clip.yaml`, CLIP ViT-B/32 | 32 px | 7 x 7 | 49 plus a class token, inside the encoder | 1 pooled vector per image, 512 wide |
| `vla_qwen.yaml`, Qwen3-VL-2B | 16 px, then 2 x 2 merged | 14 x 14, then 7 x 7 | 49 | 1 vector for the whole prompt |

One Qwen image token covers 32 x 32 pixels, four times the area of one `dp_vit` token.

Self-attention compares every token with every other, so its cost grows with the square of the
count: 784 x 784 = 614,656 pairs per layer for the 784 image tokens that the action transformer of
`dp_vit` reads, against 196 x 196 = 38,416 for the 196 that the language model of `vla_qwen` reads,
16 times fewer.

<!-- interactive: patchify -->
*Figure: a 224 x 224 camera frame cut into patches at a chosen patch size. Each patch becomes one
token; an object's size is shown in pixels and in patches.*

Background. PaliGemma (Beyer et al., 2024) ships checkpoints at 224, 448 and 896 px with 256, 1024
and 4096 image tokens. Prismatic found that 336 or 384 px improved VLM benchmarks. OpenVLA found no
difference between 224 and 384 px for robot control; 384 px took three times longer to train.

### Frozen or fine-tuned

A frozen encoder receives no gradient, which saves the memory for gradients and optimiser state
and keeps the pretrained features intact; a fine-tuned one can adapt to the task.

Background. LLaVA (Liu et al., 2023) kept its CLIP encoder frozen. Prismatic found that fine-tuning the vision encoder during VLM training degraded
performance, most on localisation. PaliGemma trained its encoder; its ablation found no difference
after transfer when the encoder was frozen, but better validation perplexity (how surprised the
model is by held-out answers; lower is better) on spatial tasks when it was trained. OpenVLA found
fine-tuning the vision encoder "crucial" for policy performance. None of this was tested here.

### How a VLM reuses an encoder

The VLMs cited here (LLaVA, Prismatic, PaliGemma, Qwen3-VL) discard the pooled vector (the one
per-image embedding the contrastive loss uses) and keep the patch tokens. A projector maps each one to the width of the language model's embeddings
([Joining vision and language](30-joining-vision-and-language.md)). Qwen3-VL (Bai et al., 2025)
first compresses each 2 x 2 group of tokens into one.

In a trained VLM the projector was trained on this tower's features and the language model was
trained to read this projector's outputs. A different tower would produce features neither has
seen, so a policy built on a pretrained VLM takes the tower that came with it.

## In this repository

There are four ways to get image features. One goes through timm (PyTorch Image Models), a library
of image backbones with pretrained weights.

| Route | Config | Class | Output |
|---|---|---|---|
| From-scratch ViT | `model.vit.type: vit`, or `vision_language_backbone.type: vit_backbone` | `ViT` in [`vla_foundry/models/vit.py`](../../vla_foundry/models/vit.py) | every patch token |
| timm encoder | `model.vit.type: vit_hf` inside `model.type: vlm` | `ViTHF` in [`vla_foundry/models/vit_hf.py`](../../vla_foundry/models/vit_hf.py) | the encoder's final token sequence |
| CLIP | `vision_language_backbone.type: clip_backbone` | `CLIPHF` in [`vla_foundry/models/diffusion_policy/clip_hf.py`](../../vla_foundry/models/diffusion_policy/clip_hf.py) | one pooled vector per image |
| A VLM's own tower | `vision_language_backbone.type: vlm_backbone` | `VLMHF` in [`vla_foundry/models/vlm_hf.py`](../../vla_foundry/models/vlm_hf.py) | internal to the VLM |

**The from-scratch ViT.** This is the class from [Images to tokens](20-images-to-tokens.md).
`ViT.forward` applies a final `LayerNorm` and, with the default `cls_flag: false`, returns all
patch tokens, `[batch, num_patches, hidden_dim]`. `ViTParams` also has `pretrained` and
`interpolation_mode` fields; no code under `vla_foundry/` reads them. The class has no loader for
published weights. It starts from `_init_weights`, or from a checkpoint written by this
repository, which `create_vlm` in `vla_foundry/models/vlm.py` loads from
`model.vit.resume_from_checkpoint`. `ViTBackboneWrapper` always builds this class, so the
`vit_backbone` of a policy cannot be a pretrained encoder.

**The timm encoder.** Despite the file name `vit_hf.py`, `ViTHF.__init__` calls
`timm.create_model(model_params.hf_pretrained, num_classes=0, pretrained=load_pretrained)`.
`ViTHF.forward` returns `self.model.forward_intermediates(image)[0]`, which for timm's ViT models
is the final normalised token sequence, `[batch, tokens, width]`, including any class token or
register tokens (extra learned tokens that some DINOv2 checkpoints carry; like the class token they
are not patches). `ViTHF` does not check the architecture; only timm ViTs return this shape.

Three settings are not derived from the timm model and must be set by hand: the encoder width
`model.vit.hidden_dim` (`ViTHFParams`, default 768), `model.vit.projector_pixel_shuffle_factor`
(default 1; how many tokens per side are merged before the projector, which above 1 requires a
square token count) and `data.img_num_tokens`, the tokens that reach the language model per image.

**CLIP.** `CLIPHF.forward` takes `vision_model(pixel_values).pooler_output` and applies
`visual_projection`; the patch tokens never leave the encoder. `CLIPBackboneWrapper` prepends the
pooled text embedding, so the action head of `dp_clip.yaml` receives 5 vectors: the instruction and
the 4 images. `dp_clip.yaml` sets no `freeze_image_encoder` or `freeze_text_encoder`, so CLIP is
trained with the action head.

**A VLM's tower.** `VLMHF` loads the whole model, vision tower included. Background: the Qwen3-VL
report states that the tower of the 2B model is a SigLIP-2 encoder (SigLIP2-Large, 300M), trained
further inside Qwen. In `vla_qwen.yaml`, `processor_kwargs.size` sets both pixel-count bounds to
50,176 (224 x 224), which gives 49 tokens per image and 196 for the 4 images.
`num_trainable_vlm_layers: 4` makes `VLMHFBackboneWrapper._train_only_last_layers` set
`requires_grad = False` on every VLM parameter and re-enable only the last 4 language-model layers
and the final norm.

That leaves two choices for the tower. With `num_trainable_vlm_layers` unset
(`VLMBackboneParams` defaults it to `None`) the whole VLM, tower included, is trained; with any
number the tower is frozen. No config key trains the tower while freezing the language model.
Resolution is set through `data.processor_kwargs`.

In a `vlm` trained here, `--model.vit.freeze true` freezes only the vision encoder.

To train the two `pick_cube` policies that the next section compares:

```bash
sim/pickup/scripts/make_dataset.sh pick_cube 200 pick_cube_200
sim/pickup/scripts/train.sh dp_clip pick_cube_200 dp_clip_pick_cube_200 300000
sim/pickup/scripts/train.sh dp_vit  pick_cube_200 dp_vit_pick_cube_200  300000
```

## What we measured

Two comparisons in the lab notebook involve a pretrained encoder, each a single training run
evaluated closed-loop on unseen layouts.

`pick_cube`, 200 demonstrations, 300k training samples (23 epochs), machine A: CLIP ViT-B/32 with
one pooled vector per image and one for the text (245M parameters) scored 2/50 = 4% (95% CI
1-14%), and 0/20 on its own training layouts. The small from-scratch ViT with every patch a token
(`dp_vit`, 36M) scored 15/50 = 30% (19-44%).

`pick_target`, 1500 demonstrations, first round on machine A (the Qwen run on machine B was still
in progress when the notebook was written and has no result): the `vla_qwen` policy (306M of
2.2B parameters trained, one conditioning vector) scored 0/50 after 100k samples, 1/50 after 200k,
6/50 after 300k and 6/100 at the end (400k samples, 4 epochs). It never lifted an object other than
the named one in 150 episodes.

What these numbers show: on a one-object task, one pooled vector from a pretrained encoder lost
to the patch tokens of a from-scratch one ([Pooled vs patch tokens](21-pooled-vs-patch-tokens.md)).

What they do not show:

- Whether CLIP's patch tokens would have worked. They never reached the action head, and the two
  policies also differ in size and in whether they receive text.
- Whether the frozen tower limited the Qwen policy. That run also had 49 tokens per image, a single
  conditioning vector and 4 epochs; no run changed one alone.
- Anything that isolates SigLIP or DINOv2 features, resolutions other than 224 px, or frozen
  against fine-tuned encoders. The Qwen tower descends from SigLIP-2, but no run here compares it
  with another encoder.

## Choosing an encoder

| Situation | Choice | Basis |
|---|---|---|
| One simulator, fixed cameras, one known object | from-scratch `ViT`, all patch tokens | measured here, one run on machine A: 74% (37/50) on `pick_cube` (1000 demonstrations, 1.5M samples). Not shown for several objects: the same encoder without language scored 1/100 on `pick_target` (1500 demonstrations, 1.0M samples, machine A) |
| The policy is built on a pretrained VLM | that VLM's own tower; decide only resolution and freezing | the projector and language model were trained on its features |
| New objects, new scenes, real cameras | SigLIP, possibly fused with DINOv2, with patch tokens kept | background (Prismatic, OpenVLA); not measured here |
| The tasks in this repository | keep patch tokens; do not reduce each image to one pooled vector | measured here on `pick_cube` only, one run each, confounded by model size and text input: pooled CLIP 4% against from-scratch patches 30% |

The third row is not a config change here. A timm encoder reaches an action head only through a
`vlm` (`model.vit.type: vit_hf`) trained here and then used as a `vlm_foundry_backbone`; its patch
tokens are kept only with `conditioning: all_tokens`, whose effect the lab notebook lists as not
yet measured. `vit_backbone` cannot load pretrained weights, `clip_backbone` returns only pooled vectors, and no code fuses two encoders.

## Where it goes wrong

| What you see | Why | Check and fix |
|---|---|---|
| `Unknown model` from timm | `hf_pretrained` holds a `transformers` repository id, such as the `google/siglip-so400m-patch14-384` in `docs/reference/models/vlm.md`; timm has its own names | use a timm name such as `vit_so400m_patch14_siglip_384`, or timm's `hf-hub:` prefix |
| a matrix shape error in `ModalityProjector` on the first batch | its linear layer takes `hidden_dim * projector_pixel_shuffle_factor**2` inputs, and `model.vit.hidden_dim` is still 768 | set `model.vit.hidden_dim` to the encoder's width |
| `AssertionError` in `VLM.forward` | the `simple_vlm` processor writes `data.img_num_tokens` placeholders per image, and the encoder returns another number; a class token or register tokens add to the patch count | print the encoder's output shape (exercise 2) and set `img_num_tokens` to its second dimension, divided by the shuffle factor squared |
| no error, but pretrained features are fed inputs they were not trained on | `SimpleVLMProcessor` normalises with mean 0.5 and std 0.5 per channel. timm's configurations list those values for SigLIP, ImageNet statistics for DINOv2 and a third set for OpenAI CLIP | compare with the checkpoint's values (`timm.create_model(name).pretrained_cfg['mean']`). No config key sets them: `get_processor` in `vla_foundry/data/processor/__init__.py` passes only `image_size` to `SimpleVLMProcessor`, so a DINOv2 or OpenAI CLIP encoder needs `image_mean` and `image_std` passed there in code |
| a size error on the first batch | the image is not the encoder's size; timm's DINOv2 models default to 518 px | set `data.image_size` to the encoder's size |

## Background and further reading

- Dosovitskiy et al., [An Image is Worth 16x16 Words](https://arxiv.org/abs/2010.11929), 2020.
  Showed that a plain transformer over image patches, pretrained on enough data, competes with
  convolutional networks at image classification; the architecture of every encoder here.
- Radford et al., [Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020),
  2021. CLIP: contrastive training on 400 million image-text pairs.
- Zhai et al., [Sigmoid Loss for Language Image Pre-Training](https://arxiv.org/abs/2303.15343),
  2023. SigLIP: a per-pair sigmoid loss in place of the batch softmax.
- Oquab et al., [DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193),
  2023. Self-supervised image and patch objectives on 142 million curated images.
- Liu et al., [Visual Instruction Tuning](https://arxiv.org/abs/2304.08485), 2023. LLaVA: a frozen
  CLIP encoder joined to a language model by a trained projection.
- Karamcheti et al., [Prismatic VLMs](https://arxiv.org/abs/2402.07865), 2024. Controlled
  comparison of encoders, fusion, resolution and freezing in VLMs.
- Tong et al., [Eyes Wide Shut? Exploring the Visual Shortcomings of Multimodal LLMs](https://arxiv.org/abs/2401.06209),
  2024. Image pairs that CLIP cannot tell apart.
- El Banani et al., [Probing the 3D Awareness of Visual Foundation Models](https://arxiv.org/abs/2404.08636),
  2024. Depth, surface normals and correspondence read from frozen encoders.
- Beyer et al., [PaliGemma: A versatile 3B VLM for transfer](https://arxiv.org/abs/2407.07726),
  2024. SigLIP encoder, linear projector, Gemma language model; a freezing ablation.
- Kim et al., [OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/abs/2406.09246),
  2024. Fused DINOv2 and SigLIP encoder for robot control, fine-tuned; 224 against 384 px.
- Bai et al., [Qwen3-VL Technical Report](https://arxiv.org/abs/2511.21631), 2025. A VLM with a
  SigLIP-2 vision encoder whose patch features a two-layer MLP compresses 2 x 2 before the language
  model; the backbone of `vla_qwen.yaml`.

## Check yourself

1. Compute the tokens per image for a 224 px frame at patch 14, 16 and 32, and after a 2 x 2 merge
   at patch 16.

2. Build a timm encoder with random weights (nothing is downloaded) and print what `ViTHF` returns.
   Then state the `model.vit.hidden_dim` and `data.img_num_tokens` a `vlm` config would need for it.

   ```bash
   .venv/bin/python -c "
   import torch
   from vla_foundry.models.vit_hf import ViTHF
   from vla_foundry.params.model_params import ViTHFParams
   m = ViTHF(ViTHFParams(hf_pretrained='vit_base_patch16_siglip_224'), load_pretrained=False)
   print(m(torch.zeros(1, 3, 224, 224)).shape)"
   ```

3. Run the freezing tests and read which parameters the second expects to stay trainable:

   ```bash
   .venv/bin/python -m pytest tests/essential/models/test_freeze.py tests/essential/models/test_vlm_backbone_partial_freeze.py -q
   ```
