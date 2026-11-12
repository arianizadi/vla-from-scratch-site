---
title: What the Action Head Sees
part: 5 Conditioning the action head
order: 50
summary: Read off, for any config in this repository, the exact token sequence the action head receives, and tell whether the object's position can reach it.
status: draft
---

# What the Action Head Sees

The action head is the transformer that turns noise into a chunk of robot actions. It never looks at
a camera frame or an instruction; it reads one sequence of tokens, part of which is what the
backbone (the model that encodes the images and the text) hands over. That part is one vector in
some configs here and more than a thousand tokens in others, and it decides whether the object's
position reaches the part of the model that moves the arm.

## The idea

**Conditioning** is everything the action head is given besides the noisy actions it has to clean
up: the noise level, the robot's state and the backbone's description of the scene. This chapter,
like the code (`get_action_conditioning`), uses *conditioning tokens* for the last of these, the
part that changes between architectures. All of it arrives in one sequence:

```text
[ time ][ conditioning tokens from the backbone ][ state tokens ][ action tokens ]
   1                     N                              P               T
```

The **time token** says how noisy the action tokens currently are
([Flow matching](41-flow-matching.md)). The **state tokens** are the joint angles and gripper
opening, one per time step. The **action tokens** are one per control step: the previous action,
given clean, then the noisy chunk being generated.

Only `N` changes. Two configs for the same task:

- [`dp_vit_lang.yaml`](../../sim/pickup/configs/dp_vit_lang.yaml): `N` = 816 (32 text slots and
  784 image patches), so 1 + 816 + 2 + 16 = 835 tokens.
- [`vla_custom.yaml`](../../sim/pickup/configs/vla_custom.yaml): `N` = 1 (one vector summarising
  four images and the instruction), so 1 + 1 + 2 + 16 = 20 tokens.

In the first, the token for the image patch that contains the cube is in the sequence and an
action token can attend to it. In the second, the backbone has to write the cube's position into
one vector first.

<!-- interactive: sequence-layout -->
*Figure: the policy sequence as a row of cells; switching the backbone redraws the conditioning
block as 1, 5, 784, 816 or 1040 cells.*

## How it works

### Building the sequence

`DiffusionPolicy._build_transformer_input` in
[`vla_foundry/models/diffusion_policy/diffusion_policy.py`](../../vla_foundry/models/diffusion_policy/diffusion_policy.py)
assembles the sequence. With the numbers of `dp_vit_lang.yaml` (backbone and action transformer
both 256 wide, batch `B`):

1. The backbone returns `backbone_embeddings`, `[B, 816, 256]`.
2. `self.time_encoding`, an embedding table with one row per noise level (1000), gives
   `time_embeddings`, `[B, 1, 256]`.
3. With the default `model.diffusion_step_conditioning: concat` the two are concatenated, time
   first, and `self.condition_encode`, one linear layer, maps each token to the transformer width:
   `[B, 817, 256]`. (`add`, which no pickup config sets, adds the time embedding to every
   conditioning token instead.)
4. The state `[B, 2, 8]` (steps t-1 and t; `RoboticsProcessor.add_action_and_proprioception_fields`
   in `vla_foundry/data/processor/robotics_processor.py` keeps `lowdim_past_timesteps + 1` steps)
   goes through `self.proprioception_encode` and becomes two tokens.
5. The action window `[B, 16, 8]` goes through `self.action_encode` and becomes 16 tokens. Its
   first step is the previous action, passed in without noise (`torch.where(future_mask...)` in
   `forward`, `past_mask` in `generate_actions`); the other 15 (step t and 14 future steps) are the
   noisy chunk being generated.
6. `torch.cat(parts, dim=1)` joins them: `[B, 835, 256]`.

`DiffusionPolicy.forward` runs the transformer on this sequence and maps the last `T` positions of
its final hidden state with `self.output_layer` to `[B, 16, 8]`, a predicted direction per action
token. Every policy config under `sim/pickup/configs/` sets `is_causal: false` on the action
transformer, directly or through a preset, so each action token attends to every other token
([The transformer block](11-the-transformer-block.md)). That attention is its only route to the
scene.

### What each backbone hands over

All four backbone wrappers return a `VisionLanguageBackboneOutput` whose `embeddings` tensor is
`[B, N, D]`. These configs use two cameras and two frames each (`image_indices: [-1, 0]`): four
images per sample.

| `vision_language_backbone.type` | Config | What `embeddings` holds | Shape | Sequence length |
|---|---|---|---|---|
| `clip_backbone` | `dp_clip.yaml` | one pooled vector for the text, one per image | `[B, 5, 512]` | 24 |
| `vit_backbone` | `dp_vit.yaml` | every patch of every image (4 x 196) | `[B, 784, 256]` | 803 |
| `vit_backbone`, `text_tokens: 32` | `dp_vit_lang.yaml` | 32 text slots (the tokenized prompt), then every patch | `[B, 816, 256]` | 835 |
| `vlm_foundry_backbone` | `vla_custom.yaml` | hidden states of one appended action token | `[B, 1, 2048]` | 20 |
| `vlm_foundry_backbone`, `conditioning: all_tokens` | `vla_custom_tokens.yaml` | hidden states of every image and text token, zero-padded in front to `conditioning_len` | `[B, 1040, 2048]` | 1059 |
| `vlm_backbone` | `vla_qwen.yaml` | hidden states of one appended action token | `[B, 1, 4 x LM width]` | 20 |

512 is CLIP ViT-B/32's projection size (background, from its published configuration).
[One vector or many tokens](21-pooled-vs-patch-tokens.md) covers the first two rows. The last three
use the hidden states of a VLM (the vector each layer holds for each token), explained next.

### The action-token probe

A vision-language model (VLM) reads a prompt of image tokens followed by the instruction
([Joining vision and language](30-joining-vision-and-language.md)): for `vla_custom.yaml`, four
images at 256 tokens each plus the instruction, each token with a 512-wide hidden state per layer.
The default recipe reads the result out at one place:

1. One new token, the **action token**, is added to the VLM's vocabulary and appended to the prompt.
2. The VLM runs. The from-scratch language model is causal
   (`vla_foundry/config_presets/models/transformer_100m.yaml`, `is_causal: true`), so the action
   token, being last, can attend to every image and instruction token.
3. The hidden states at the action token's position are taken from the last
   `num_vlm_layers_to_use` layers (4) and concatenated: 4 x 512 = 2048 numbers. That vector,
   `[B, 1, 2048]`, is the whole conditioning.

The class docstring of `VLMHFBackboneWrapper` calls this an action token probe. The word is used
loosely: a probe usually means a small model trained on frozen activations to test what they
contain ([Pretrained vision encoders](22-pretrained-vision-encoders.md)), whereas this token is
part of the policy and is trained with it. Background: the VLA Foundry report (Mercat et al., 2026)
calls it an observation token; Octo calls the same device a readout token and compares it to the
[CLS] token of BERT (Octo Model Team, 2024).

With `conditioning: all_tokens` no token is added. The last four layers' hidden states at every
real prompt position, roughly a thousand tokens each 2048 wide, go to the action head. The price
is attention over 1059 x 1059 token pairs per layer instead of 20 x 20, at every denoising step.

### Why one vector can carry a position, and why that is hard to learn

Capacity is not the obstacle. The positions of three objects on a table are six numbers and the
vector has 2048, so a network could in principle write them into the action token's state.
Background: Octo conditions its diffusion action head on the embedding of a readout token, one per
time step, that attends to the observation and task tokens; it was trained on 800k robot
trajectories.

The difficulty is where the work has to happen and what trains it. This is an argument, not a
measurement:

- With patch tokens, position arrives already laid out. Each patch token carries what is in one
  16 x 16 pixel cell, and which cell it is: `ViTPatchEmbeddings` (`vla_foundry/models/vit.py`) adds
  a learned position embedding to every patch, and the action transformer's rotary position
  encoding ([Positions](12-positions.md)) makes attention depend on where a token sits in the
  sequence. The cube changes the values of a few tokens at known places. The action head still has
  to learn the map from image location to joint targets, but from tokens that keep the image's
  spatial layout.
- With one vector, position must be in the *values*. The backbone has to turn "the cube is in these
  patches" into coordinates, pick the object the instruction names, and encode the result precisely
  enough for a grasp.
- The only signal that teaches the backbone this is the action loss, passed back through that one
  token.

How precise is precise enough was measured (machine A, where these VLAs were trained and evaluated,
320 episodes per offset): a 10 mm sideways offset drops the expert from 94% to 60% on the can and
from 100% to 99% on the cube. On machine B the can drops from 100% to 94%.

## In this repository

**`clip_backbone`.** `CLIPBackboneWrapper._concatenate_for_conditioning` in
[`clip_hf_backbone.py`](../../vla_foundry/models/vision_language_backbones/clip_hf_backbone.py)
stacks the text vector and the image vectors.

**`vit_backbone`.** `ViTBackboneWrapper.get_action_conditioning` in
[`vit_backbone.py`](../../vla_foundry/models/vision_language_backbones/vit_backbone.py) flattens
cameras and patches into one sequence. With `text_tokens > 0`, `_embed_text` moves the prompt's
real token ids to the front (three chat-template tokens, one `<image>` placeholder per image
because `img_num_tokens: 1`, the instruction, two closing tokens), pads or truncates them to
`text_tokens` slots, embeds them (learned table and position, layer norm), zeroes the unused slots
and prepends the result to the patches.

**`vlm_backbone`** (Hugging Face VLMs). `_extract_action_token_embeddings` in
[`vlm_hf_backbone.py`](../../vla_foundry/models/vision_language_backbones/vlm_hf_backbone.py) reads
`layer_hidden[:, -1, :]`. This backbone has no `conditioning` key and always returns one vector.

**`vlm_foundry_backbone`** (VLMs trained here). `VLMFoundryBackboneWrapper` in
[`vlm_foundry_backbone.py`](../../vla_foundry/models/vision_language_backbones/vlm_foundry_backbone.py)
has two modes:

- `action_token` (default): `_prepare_inputs_for_action_token` inserts the token after each sample's
  last real token; `_extract_action_conditioning` reads that position.
- `all_tokens`: `__init__` returns before adding a token; `_extract_action_conditioning` moves the
  real tokens to the right end, zeroes the padding and, with `conditioning_len > 0`, pads in front
  with zeros (or crops from the front) to that length. A prompt with more real tokens than
  `conditioning_len` raises a `ValueError`.

**Config keys.** All sit under `model.vision_language_backbone`. For patches plus text slots, the
keys that set the conditioning shape (excerpt of `dp_vit_lang.yaml`; `inter_dim`, `n_heads` and
`n_layers` omitted):

```yaml
type: vit_backbone
img_size: 224            # (224 / 16)^2 = 196 patches per image
patch_size: 16
hidden_dim: 256
text_tokens: 32          # default 0: image-only
text_vocab_size: 49280   # required when text_tokens > 0
```

For every token of the from-scratch VLM (`vla_custom_tokens.yaml`; `vla_custom.yaml` omits the last
two keys, leaving the default `conditioning: action_token`):

```yaml
type: vlm_foundry_backbone
num_vlm_layers_to_use: 4
conditioning: all_tokens
# 3 template tokens + 4 x 256 image tokens + the instruction with its 2 closing
# tokens (at most 8): 1035, with 5 spare
conditioning_len: 1040
```

**Running it.** With a `pick_target_1500` dataset and a stage-2 VLM in
`experiments/pickup/custom_vlm` ([The from-scratch path](62-the-from-scratch-path.md)):

```bash
sim/pickup/scripts/custom_path.sh vla pick_target_1500 vla_all_tokens 1000000 pretrained vla_custom_tokens
sim/pickup/scripts/eval.sh experiments/pickup/vla_all_tokens pick_target 100
```

## What we measured

**One task, one object.** `pick_cube`, machine A, 200 demonstrations, 300k training samples (23
epochs), 50 closed-loop episodes on unseen layouts:

| What the action head receives | Final loss | Success | 95% CI |
|---|---|---|---|
| CLIP ViT-B/32: one pooled vector per image and one for the text (245M) | 0.040 | 2/50 = 4% | 1-14% |
| Small ViT from scratch: every patch a token (`dp_vit`, 36M) | 0.091 | 15/50 = 30% | 19-44% |

The pooled-CLIP policy also scored 0/20 on its own training layouts. It ran a plausible
reach-descend-close-lift a few centimetres from the cube.

**Three objects, one named.** `pick_target`, machine A, 1500 demonstrations, 1.0M samples, 100
episodes. The last three columns describe the moment the gripper first closed (it did in every
episode):

| Policy | Conditioning | Success | Nearest object was the named one | Median miss to named | Median miss to nearest |
|---|---|---|---|---|---|
| `vla_custom`, pretrained VLM | one vector | 0/100 | 33% | 175 mm | 89 mm |
| `vla_custom`, random-init VLM | one vector | 1/100 | 29% | 174 mm | 89 mm |
| `dp_vit`, no language | 784 patch tokens | 1/100 | 32% | 185 mm | 110 mm |

Chance for the named-object column is 33%. All three closed at the right height (within about
3 mm) around step 34-44, as the expert does. The expert scored 99/100 on machine A; on machine B,
the run that also reports where it closed, 100/100, closing 5 mm (median) from the object.

What this shows:

- Both single-vector VLAs learned the motion and not the place. They closed about 9 cm from *any*
  object: neither the named object's position nor any other's reached the action head.
- One vector is not always empty. `vla_qwen` (pretrained Qwen3-VL-2B, last 4 language-model layers
  trained, 400k samples) scored 6/100 and never lifted an object other than the named one in 150
  episodes. Where its gripper closed is not in the lab notebook.

What it does not show:

- That the single vector is the cause on `pick_target`. The patch-token policy without language is
  no better (third row), nor, at the same budget, are patch tokens plus instruction tokens. On
  machine B (1500 demonstrations, 1M samples, 100 layouts; each pair is the raw weights / the EMA
  weights, an exponential moving average of the weights kept during training,
  [The training loop](80-the-training-loop.md)), `dp_vit_lang` scored 3% / 2% with the named object
  nearest in 35% / 29% of episodes; `dp_vit_lang_reactive` (no history) scored 3% / 5% and
  49% / 41%, median miss to the nearest object 71 / 75 mm.
- That tokens fare no better than one vector. On 4000 demonstrations, at the 2.0M-sample checkpoint
  of a run still training toward 5M, `dp_vit_lang_reactive` scored 4% / 36% with the named object
  nearest in 95% / 98% and a median miss to it of 32 / 18 mm
  ([Measuring failure](92-measuring-failure.md)). The final result is not in, and no single-vector
  VLA was trained on that data, so this is not a like-for-like comparison.
- That the token-conditioned rows had usable token positions. The action transformer uses rotary
  position embeddings, and `RotaryEmbedding._update_cos_sin_tables` in
  `vla_foundry/positional_embedding.py` now computes their angles in float32 because, under the
  bfloat16 autocast these configs train with (`precision: amp_bf16`), positions above 256 were not
  all distinguishable. Every many-token sequence here is longer than that; the single-vector
  action-head sequences are not, though the from-scratch VLM's prompt is. The lab notebook records
  neither which runs predate the change nor its effect on success.
- That `all_tokens` fixes it. The all-token VLA has not been measured: the lab notebook lists its
  runs, with and without a pretrained VLM, as still in progress.
- Anything about pretraining. The stage-2 VLM behind the first row lists a held-out scene's objects
  in left-to-right order 85% of the time (256/300), but neither VLA localised an object, so 0/100
  against 1/100 compares nothing.
- A controlled ablation on `pick_cube`: the two policies also differ in pretraining, patch size
  and model size.

## Where it goes wrong

**Low loss, a complete grasp motion, an empty gripper.** The `vla_custom` runs ended at a loss of
about 0.03 and 0-1% success. `sim/pickup/eval.py` prints the named-object rate and the median miss
at first close; a rate near chance with a miss of several centimetres means the conditioning is not
being used for position ([Measuring failure](92-measuring-failure.md)). No measurement here settles
what to do next: the candidate is `conditioning: all_tokens`, not yet evaluated, and the control is
the same evaluation of a patch-token policy trained on the same data.

**The probe moves with the padding.** `VLMHFBackboneWrapper._prepare_inputs_for_action_token`
appends the action token after the last column of the batch. With right padding, a short
instruction has padding between its last word and the action token in a training batch and none
when served alone. Nothing shows in the loss, and the effect on success was not measured. To check,
print the tokenizer's `padding_side` and count the padding tokens in front of the action token for
a short instruction batched with a longer one, and alone; with left padding or equal-length prompts
the count is zero both times.

**`conditioning_len` does not match the prompt.** With `conditioning_len: 0` the conditioning keeps
the batch's padded length, so the action head sees a different sequence length in a training batch
than when one prompt is served. Set it to the prompt's maximum length: each added image adds 256
tokens in `vla_custom_tokens.yaml`, and too small a value raises the `ValueError` above.

**Image tokens do not know the instruction.** `apply_chat_template` in
`vla_foundry/data/processor/__init__.py` puts the images before the text, and the from-scratch
language model is causal, so in `all_tokens` mode the 1,024 image states never say which object was
asked for. The instruction tokens can attend to every image token, so "which object" and "where"
can be combined in two places: at the few text positions inside the VLM, or in the action head,
which is not causal and attends to image and text states together
([Joining vision and language](30-joining-vision-and-language.md)).

## Background and further reading

- Mercat et al., "VLA Foundry: A Unified Framework for Training Vision-Language-Action Models",
  2026. [arXiv:2604.19728](https://arxiv.org/abs/2604.19728). The framework this repository builds
  on. Its flow transformer is conditioned on the last N layers' hidden features (4 in its
  experiments) at an observation token.
- Octo Model Team (Ghosh et al.), "Octo: An Open-Source Generalist Robot Policy", 2024.
  [arXiv:2405.12213](https://arxiv.org/abs/2405.12213). Readout tokens attend to the observation and
  task tokens without being attended to by them.
- Black et al., "π0: A Vision-Language-Action Flow Model for General Robot Control", 2024.
  [arXiv:2410.24164](https://arxiv.org/abs/2410.24164). The other design: the noisy action tokens
  attend to the full input sequence, image and language tokens, through self-attention shared with
  the VLM. `all_tokens` here is looser: a separate action transformer attends to the hidden states
  of the VLM's last layers.

## Check yourself

1. `dp_vit_lang_reactive.yaml` sets `image_indices: [0]` and `lowdim_past_timesteps: 0`. Compute
   `N`, `P`, `T` and the sequence length by hand. (Answer: 32 + 2 x 196 = 424, 1, 15, and 441.)

2. Find the assertion that shows `action_token` mode returns exactly one vector:

   ```bash
   uv run pytest tests/essential/models/test_vlm_foundry_backbone_conditioning.py -q
   ```

3. Work out `conditioning_len` for `vla_custom_tokens.yaml` with three cameras, two frames each and
   an instruction of at most 8 tokens, and the resulting sequence length. (Answer:
   3 + 6 x 256 + 8 = 1547, and 1 + 1547 + 2 + 16 = 1566. The shipped 1040 is the same sum for four
   images, 1035, plus 5 spare slots.)
