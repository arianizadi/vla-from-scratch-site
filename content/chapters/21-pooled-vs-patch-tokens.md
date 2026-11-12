---
title: One Vector or Many Tokens
part: 2 Vision
order: 21
summary: Tell a pooled image embedding from a sequence of patch tokens, predict which one a manipulation policy needs, and find where this repository produces each.
status: draft
---

# One Vector or Many Tokens

A vision encoder can hand the rest of the model one vector for the whole image, or one vector for
every patch of it. The single vector is compact and says what is in the picture; the patch vectors
are many and also say where. A policy that has to close a gripper within a centimetre or two of an
object depends on the "where"; this chapter gives the one comparison measured here and says what it
does and does not isolate.

## The idea

[Images to tokens](20-images-to-tokens.md) showed how a vision transformer (ViT) cuts an image into
square patches and turns each into a vector. A **patch token** is the encoder's output vector for
one patch. A **pooled embedding** is a single vector that summarises all of them.

Take one frame from the `front` camera: 224x224 pixels, three colour channels, 150,528 numbers.

- The ViT in [`dp_vit.yaml`](../../sim/pickup/configs/dp_vit.yaml) uses 16-pixel patches, so the
  frame becomes a 14x14 grid of 196 patches and the encoder returns `[1, 196, 256]`: 196 tokens of
  width 256, which is 50,176 numbers, ordered row by row from the top-left square of the image.
- CLIP is an image encoder pretrained to match images with their captions. The CLIP encoder in
  [`dp_clip.yaml`](../../sim/pickup/configs/dp_clip.yaml) returns `[1, 512]`: 512 numbers for the
  whole frame, with no axis that corresponds to position.

The pooled output is 98 times smaller, but size is not the main difference. Pooled embeddings
usually come from encoders pretrained to classify images or to match them with captions, so they
are trained to answer "what is in this image". A grid of patch tokens still has the layout of the
image in its second axis, so a later layer can ask "what is at this place".

<!-- interactive: pooled-vs-tokens -->
*Figure: the same camera frame encoded two ways: 196 patch tokens reach the action head, or one
vector in which the cube's position is no longer a separate input.*

## How it works

### Three ways to make one vector

1. **Class token.** A learned extra vector is put in front of the patch sequence before the first
   transformer block. Attention lets it read from every patch, and its state after the last block
   represents the image. Background: this is the design of the original ViT (Dosovitskiy, 2020).
   CLIP's ViT variants, including the ViT-B/32 used here (B for the base size, 32 for 32-pixel
   patches), follow it and map the class token's final state into the shared image-text space with
   one linear projection (Radford, 2021).
2. **Mean pooling.** The patch tokens (or the cells of a convolutional feature map) are averaged.
   Background: this is the global average pooling at the end of standard ResNets (He, 2015).
3. **Attention pooling.** One extra attention layer with a single query produces a weighted average
   of the tokens, with weights that depend on the content. Background: the ResNet variants of CLIP
   replace global average pooling with such a layer (Radford, 2021).

All three remove the position axis. Whatever location information survives has to be encoded in
the values of one vector.

### What a pooled embedding is trained to keep

Background, from the CLIP paper (Radford, 2021): CLIP trains an image encoder and a text encoder
together on image-caption pairs. In a batch of $N$ pairs it raises the cosine similarity of the
$N$ matching image and text vectors and lowers it for the $N^2 - N$ mismatched combinations. The
image side of that comparison is the pooled embedding.

The image vector is therefore rewarded for whatever tells one caption from another: which objects
are present, their colour, the kind of scene. "A red cube on a table" is equally true when the cube
sits three centimetres further left. The matching caption is the same for both images, so the loss
gives no reward for telling them apart, and nothing in pretraining pushes the encoder to spend any
of its 512 numbers on those three centimetres. This is an argument about the objective, not a
measurement of what CLIP's vector contains.

In `dp_clip` the CLIP weights are not frozen: `freeze_image_encoder` and `freeze_text_encoder`
default to `False` in `CLIPHFParams` and no config here sets them. The action loss was therefore
free to teach the pooled vector to carry position. The pretraining objective describes where the
encoder starts, not a limit on what one vector can hold.

Precise position is what grasping needs. Measured here: the scripted expert (a hand-written
controller that reads the object's true pose from the simulator; see
[Demonstrations](70-demonstrations.md)) ran `pick_target` with a fixed sideways offset in a random
direction added to its grasp point, 320 episodes per offset shared between the four objects.
Episodes whose target is the cube succeed 99% of the time at 10 mm, 93% at 20 mm and 32% at 30 mm,
the same on machines A and B.

### What patch tokens keep

Each patch token starts as a projection of one fixed square of pixels. The transformer blocks mix
information between tokens, so token 57 also knows something about its neighbours, but each token
still belongs to one square. Attention by itself does not see a token's index
([Positions](12-positions.md)). The place is readable because `ViTPatchEmbeddings` added a position
embedding for that square before the first block, so the token's values carry it, and because the
action transformer applies its own rotary encoding along the sequence
(`positional_embedding_type: rotary`, the default). With that, the attention layers of the action
head can put most of their weight on the few tokens that cover the cube and read from them where it
is.

### Shapes in the two policies trained here

Both policies use two cameras and two time steps (`image_indices: [-1, 0]`), so every sample has
four images. Both feed a flow-matching action transformer (see
[Flow matching](41-flow-matching.md)). Its input sequence has four parts:

- the **conditioning** tokens from the backbone, which it reads but does not predict;
- one time token that encodes the flow-matching time, that is, how noisy the action tokens
  currently are (not the control step);
- two state tokens, the robot's joint state at control steps t-1 and t;
- 16 action tokens (one past, the current and 14 future steps), which are the ones it refines.

| | `dp_clip` (pooled) | `dp_vit` (patch tokens) |
|---|---|---|
| Conditioning from the backbone | `[B, 5, 512]` (1 text + 4 images) | `[B, 784, 256]` (4 x 196) |
| Time + state + action tokens | 1 + 2 + 16 | 1 + 2 + 16 |
| Sequence length in the action transformer | 24 | 803 |
| Token pairs per attention layer | 576 | 644,809 |

Background, from the published configuration of `openai/clip-vit-base-patch32`: inside the CLIP
encoder a 224-pixel image is 49 patches of 32 pixels plus the class token, 50 tokens, before
pooling reduces them to one.

### The cost of tokens

Self-attention compares every token with every other token (see
[The transformer block](11-the-transformer-block.md)), so its compute grows with the square of the
sequence length, and so does its memory whenever the attention matrix is materialised. Going from
24 to 803 tokens is 33 times more tokens and about 1,100 times more token pairs per attention
layer.

This counts the action transformer only. Each encoder also runs attention within an image: 196² =
38,416 pairs per image per layer in the ViT here, 50² = 2,500 in CLIP ViT-B/32 (background, as
above). The pooled policy is not the cheaper model overall: it has 245M parameters against 36M and
its throughput was not recorded, so this compares sequence lengths, not measured speed.

The token count is cameras x frames per camera x (image size / patch size)², four settings in the
config: `camera_names`, `image_indices`, `img_size` and `patch_size`. At 224 pixels and patch 16,
four images make 784 tokens and eight make 1,568.

`dp_vit.yaml` sets `max_seq_len: 2048` on the action transformer. That value only sizes the rotary
position tables built at construction (`get_pos_embed` in `vla_foundry/positional_embedding.py`);
`RotaryEmbedding._update_cos_sin_tables` rebuilds them for a longer sequence, so no check stops a
run at 2,049 tokens. The limits that apply are memory and step time.

The cost is paid several times per prediction: `DiffusionPolicy.generate_actions` computes the
backbone output once and then runs the action transformer once per flow step (10 by default in
`sim/pickup/eval.py`).

## In this repository

**The pooled path.** [`vla_foundry/models/diffusion_policy/clip_hf.py`](../../vla_foundry/models/diffusion_policy/clip_hf.py)
wraps the Hugging Face `CLIPModel`. In `CLIPHF.forward`, images go through
`self.model.vision_model(pixel_values).pooler_output` and `self.model.visual_projection`, are
reshaped from `[B*N, D]` to `[B, N, D]`, L2-normalised and multiplied by `attention_mask_images`,
so a missing image becomes a zero vector. The instruction becomes one vector too: the text model's
`pooler_output`, normalised and passed through `self.model.text_projection`. Background: in
`transformers`, the vision model's `pooler_output` is the class token's final state after a layer
norm; `CLIPHF.forward` never reads the patch tokens.

[`vla_foundry/models/vision_language_backbones/clip_hf_backbone.py`](../../vla_foundry/models/vision_language_backbones/clip_hf_backbone.py)
turns that output into conditioning: `CLIPBackboneWrapper._concatenate_for_conditioning` returns
the text vector followed by the image vectors, `[B, 1+N, D]`, or `[B, N, D]` when `disable_text` is
set.

**The token path.** [`vla_foundry/models/vision_language_backbones/vit_backbone.py`](../../vla_foundry/models/vision_language_backbones/vit_backbone.py)
builds a `ViT` from [`vla_foundry/models/vit.py`](../../vla_foundry/models/vit.py).
`ViTBackboneWrapper.get_action_conditioning` reshapes 4-D pixel input to `[B, N, C, H, W]`, calls
the ViT, which returns `[B, N, num_patches, hidden_dim]`, and flattens cameras and patches into one
sequence with `einops.rearrange(embeddings, "b n t d -> b (n t) d")`.

The ViT class has a pooling switch as well: with `cls_flag` set, `ViT.forward` keeps only the class
token's state (`self.layer_norm(x[:, 0])`). `ViTParams.cls_flag` defaults to `False` and no config
under `sim/pickup/configs/` sets it, so every config there that builds this ViT gets all of its
patch tokens.

**Where the two meet.** `DiffusionPolicy._build_transformer_input` in
[`vla_foundry/models/diffusion_policy/diffusion_policy.py`](../../vla_foundry/models/diffusion_policy/diffusion_policy.py)
prepends the time token to whatever `[B, N, D]` the backbone returned, maps both to the transformer
width with `condition_encode`, and appends state and noisy-action tokens.

**Config keys.**

| Key | `dp_clip.yaml` | `dp_vit.yaml` |
|---|---|---|
| `model.vision_language_backbone.type` | `clip_backbone` (preset `config_presets/models/diffusion_policy.yaml`) | `vit_backbone` |
| encoder | `hf_pretrained: openai/clip-vit-base-patch32` | `img_size: 224`, `patch_size: 16`, `hidden_dim: 256`, `n_layers: 6`, `n_heads: 4` |
| `data.processor` | `openai/clip-vit-base-patch32` | `"none"` (`PassthroughProcessor`; the instruction never reaches the model) |

To train and evaluate both on the same 200 demonstrations:

```bash
sim/pickup/scripts/make_dataset.sh pick_cube 200 pick_cube_200
for cfg in dp_clip dp_vit; do
  sim/pickup/scripts/train.sh $cfg pick_cube_200 ${cfg}_pick_cube_200 300000
  sim/pickup/scripts/eval.sh experiments/pickup/${cfg}_pick_cube_200 pick_cube 50
done
```

## What we measured

`pick_cube` (one red cube at a random pose), machine A, one training seed per row, 50 closed-loop
episodes (the policy drives the simulated arm, so its own actions decide what it sees next) on
layouts it never saw. [Closed-loop evaluation](90-closed-loop-evaluation.md) explains the Wilson
95% intervals.

| Policy | Parameters | Demos | Training samples (epochs) | Final loss | Success | 95% CI |
|---|---|---|---|---|---|---|
| `dp_clip`: CLIP ViT-B/32, one pooled vector per image and one for the text | 245M | 200 | 300k (23) | 0.040 | 2/50 = 4% | 1-14% |
| `dp_vit`: small ViT from scratch, every patch a token | 36M | 200 | 300k (23) | 0.091 | 15/50 = 30% | 19-44% |

The pooled-CLIP policy also scored 0/20 on its own training layouts. It ran a plausible
reach-descend-close-lift a few centimetres from the cube.

What this shows:

- The intervals do not overlap: with the same demonstrations and training samples, the patch-token
  policy grasped and the pooled policy did not.
- The failure is not one of generalisation. A policy that misses the cube on layouts it saw for 23
  epochs did not receive, or did not use, the cube's position.
- Training loss pointed the wrong way: 0.040 for the policy at 4%, 0.091 for the policy at 30%.
  [Loss is not success](91-loss-is-not-success.md) covers why.

What it does not show:

- It is not a controlled ablation of pooling. The two policies also differ in pretraining (CLIP
  weights against random initialisation), patch size (32 against 16), size (245M against 36M),
  action transformer (12 layers at width 512 against 6 at width 256), text input, and image
  preprocessing. The same encoder with and without pooling has not been compared here, and CLIP's
  own patch tokens were not tested (see
  [Pretrained vision encoders](22-pretrained-vision-encoders.md)).
- It does not show that one vector cannot carry position. CLIP was trainable in this run, so the
  action loss could have taught the pooled vector the cube's position; after 300k samples on 200
  demonstrations the policy still missed. A longer run, a frozen encoder and a probe of what the
  vector holds were not tried.
- 30% is not a working policy. The same patch-token recipe reached 37/50 = 74% (60-84%) with 1000
  demonstrations and 1.5M samples.

On cost, the lab notebook has throughput for the patch-token policies only: on machine B about 540
samples/s for `dp_vit` with four images and about 1100 for `dp_vit_reactive` with two. The reactive
config also drops the past state and action, so this is not a pure token-count comparison.

## Where it goes wrong

**The loss is low, the arm moves well, and it grasps air.** Conditioning that does not carry
position is one cause; it is not the only one. The patch-token `dp_vit` on `pick_target` (machine
A, 100 episodes) also closed the gripper in 100% of episodes, a median 110 mm from the nearest
object. Separate the causes by evaluating on training layouts: demonstrations use environment seeds
from 0 upwards, so `--seed_start 0` replays them.

```bash
sim/pickup/scripts/eval.sh experiments/pickup/dp_clip_pick_cube_200 pick_cube 20 --seed_start 0
```

If success is near zero there too, the failure is not one of generalisation. Look at what the
action head receives before collecting more demonstrations. (More data was not tried for the pooled
policy here.) `eval.sh` also prints how far the gripper was from the object when it first closed
(see [Measuring failure](92-measuring-failure.md)).

**The same bottleneck under another name.** A vision-language-action model (VLA) can pass hundreds
of image tokens through its language model and still hand the action head a single vector. Both VLA
recipes here do so by default: `_prepare_inputs_for_action_token` in `VLMHFBackboneWrapper` and in
`VLMFoundryBackboneWrapper` adds one action token to the prompt, and only that token's hidden
states reach the action head, shape
`[B, 1, hidden_dim * num_vlm_layers_to_use]`. This is the class-token method from the list above:
an extra token reads the others through attention in every layer and only its state is kept. It
sits at the end, not the front, because a causal language model lets a token attend only to what
comes before it. [What the action head sees](50-what-the-action-head-sees.md) has the wiring, the
measurements and the `conditioning: all_tokens` alternative.

**Tokens that are too coarse.** Patch tokens help only as far as position survives the patch
embedding. Here the cube is about 10 to 15 pixels wide
([Images to tokens](20-images-to-tokens.md)), smaller than one 16-pixel patch, so its position has
to be read from how its pixels split between neighbouring patches; `dp_vit` still learned to grasp
it. Background: CLIP ViT-B/32 has 32-pixel patches, each four times the area of a 16-pixel one.
Whether tokens that coarse are enough for this task was not measured here. Before choosing a patch
size, compute the object's width in pixels as chapter 20 does.

**The sequence outgrows memory or time.** Adding a camera, a frame of history or a finer patch grid
multiplies the token count, and attention cost grows with its square. The code does not enforce
`model.transformer.max_seq_len`, so a long sequence raises no shape error; the signs to expect are
an out-of-memory error or a fall in samples/s. Compute the sequence length before a run, as in
"The cost of tokens".

**Resolution and patch grid disagree.** `ViTPatchEmbeddings` allocates its position embedding for
exactly `(img_size // patch_size) ** 2` patches and adds it to the patch sequence. An image whose
side divided by the patch size, rounded down, differs from `img_size // patch_size` raises a shape
error at that addition. A side between 225 and 239 pixels still gives 14x14 patches and silently
drops the border. Keep `data.image_size` equal to the backbone's `img_size`, as `dp_vit.yaml` does
with 224.

## Background and further reading

- Dosovitskiy et al., "An Image is Worth 16x16 Words", 2020.
  [arXiv:2010.11929](https://arxiv.org/abs/2010.11929). Introduced the ViT: patches as tokens and a
  class token whose final state represents the image.
- He et al., "Deep Residual Learning for Image Recognition", 2015.
  [arXiv:1512.03385](https://arxiv.org/abs/1512.03385). The convolutional network whose final
  global average pooling turns a feature map into one vector.
- Radford et al., "Learning Transferable Visual Models From Natural Language Supervision" (CLIP),
  2021. [arXiv:2103.00020](https://arxiv.org/abs/2103.00020). Trained image and text encoders with
  a contrastive loss on pooled embeddings.
- Shridhar et al., "CLIPort: What and Where Pathways for Robotic Manipulation", 2021.
  [arXiv:2109.12098](https://arxiv.org/abs/2109.12098). Paired CLIP's semantic features ("what")
  with a spatially precise pathway ("where") for language-conditioned manipulation.
- Chi et al., "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion", 2023.
  [arXiv:2303.04137](https://arxiv.org/abs/2303.04137). Its ResNet-18 image encoder replaces global
  average pooling with spatial softmax pooling to maintain spatial information.

## Check yourself

1. Compute by hand the conditioning shape `dp_vit` would produce with three cameras and one frame
   each, and the resulting sequence length in the action transformer with the 19 time, state and
   action tokens unchanged (`lowdim_past_timesteps: 1`, `lowdim_future_timesteps: 14`). The answers
   are `[B, 588, 256]` and 607. Then confirm the four-image case in code (expected output
   `torch.Size([1, 784, 256])`):

   ```bash
   uv run python -c "
   import torch
   from vla_foundry.models.vision_language_backbones.vit_backbone import ViTBackboneWrapper
   from vla_foundry.params.model_params import ViTBackboneParams
   p = ViTBackboneParams(img_size=224, patch_size=16, hidden_dim=256, inter_dim=1024, n_heads=4, n_layers=6)
   out = ViTBackboneWrapper(p).get_action_conditioning(torch.zeros(1, 1, dtype=torch.long), torch.rand(4, 3, 224, 224))
   print(out.embeddings.shape)"
   ```

2. In `CLIPHF.forward`, find the line that discards the patch tokens. Name the attribute of the
   vision model's output that still holds them.
3. A policy reaches a training loss of 0.04 and 4% success. Write down the one evaluation command
   that separates "cannot generalise" from "cannot localise", and what each outcome would mean.
