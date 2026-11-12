---
title: The Model Families Today
part: 0 Orientation
order: 03
summary: Place any robot policy, published or in this repository, on a map of five design choices and say what follows from each choice.
status: draft
---

# The Model Families Today

A robot manipulation policy takes camera images, an instruction and the robot's own state, and
returns motor commands. The published systems that do this differ in a few design choices, and the
same choices separate six of the policy configs in this repository.

## The idea

Every policy in this chapter has two parts. The **backbone** turns images and text into vectors. The
**action head** turns those vectors into actions. Most current systems predict an **action chunk**,
a short sequence of future actions produced in one call
([42-chunks-and-execution.md](42-chunks-and-execution.md)).

Five questions describe a system:

1. **How are actions produced?** As discrete tokens (integers from a fixed vocabulary, the unit a
   language model reads and writes, [10-tokens.md](10-tokens.md)) generated one after another, by
   diffusion or flow matching, by direct regression, or as compressed tokens.
2. **What is the backbone?** A small network trained from scratch on robot data, a pretrained
   vision encoder, or a pretrained vision-language model (VLM), a language model that also accepts
   image tokens.
3. **How does the head read the backbone?** One vector, every token, cross-attention, attention to
   the backbone's tokens in every layer, or no separate head.
4. **How much data, from how many robots?**
5. **What can be downloaded?**

The worked example is this repository's task. The input is 4 images of 224x224 pixels (front and
wrist camera, at steps t-1 and t), an instruction such as "pick up the red cube", the 8-D state (7
joint angles and the gripper opening) at t-1 and t, and the previous action. The output is a chunk
of 15 actions, shape `[15, 8]` (7 joint position targets and a gripper command each), of which 8 are
executed by default before the policy is called again. The six configs agree on question 1 and
differ among themselves on questions 2 and 3.

## How it works

Statements about published systems in this section are background from the cited papers and
repositories, not measured here.

### Choice 1: how actions are produced

Background: demonstrations often contain more than one valid action for the same observation, such
as passing an object on either side. A head that regresses one chunk under a squared-error loss is
pulled toward their average, which may be neither. The four families below represent a distribution
over chunks instead.

**Discrete tokens, generated autoregressively.** "Autoregressive" means each token is predicted
from all the tokens before it, as a language model produces text. RT-2 (Brohan, 2023) splits each
action dimension into 256 uniform bins and writes an action as a short string of integers that the
VLM emits like words. OpenVLA (Kim, 2024) uses the same bins. The cost is one forward pass per
token; the OpenVLA paper reports about 6 Hz on one RTX 4090.

**Diffusion or flow matching.** The head starts from noise and refines it into a chunk over several
steps, conditioned on the observation ([41-flow-matching.md](41-flow-matching.md)). Diffusion Policy
(Chi, 2023) applies this to visuomotor control and executes only part of each predicted sequence
before re-planning. Octo (Octo Model Team, 2024) puts a diffusion head on a transformer. pi0
(Black, 2024) uses flow matching, a chunk of 50 actions and 10 integration steps. The cost is one
pass of the head per step, while the observation is encoded once.

**Regression on chunks with a CVAE.** ACT (Zhao, 2023) predicts a chunk of 100 actions with an
L1 loss (mean absolute error). It is trained as a conditional variational autoencoder
(CVAE): an extra encoder compresses the demonstrated chunk into a latent variable, which lets the
decoder account for differences between demonstrations of the same situation (the paper's
motivation is noisy human data). At test time the encoder is discarded and the latent is set to
zero, the mean of its prior, so the output is deterministic.

**Compressed tokens.** FAST (Pertsch, 2025) keeps autoregressive generation but shortens the token
sequence. It applies a discrete cosine transform (which rewrites a signal as a sum of cosines, so a
smooth trajectory needs few large coefficients) to each normalised action dimension, scales and
rounds the coefficients, and compresses the flattened result with byte-pair encoding (the
merge-frequent-pairs compression of text tokenizers, [10-tokens.md](10-tokens.md)). The paper
reports that pi0 trained with these tokens (pi0-FAST) matches flow-matching pi0 with up to 5x less
training time and is slower at inference: about 750 ms for a one-second chunk, against typically
within 100 ms on an RTX 4090.

### Choice 2: what the backbone is

**Trained from scratch on robot data.** Diffusion Policy and Octo. Octo feeds its transformer image
patches (square blocks of pixels, each turned into one token,
[20-images-to-tokens.md](20-images-to-tokens.md)); only its text encoder is pretrained.

**A pretrained vision or vision-text encoder only.** The encoder is reused and the rest is trained
on robot data. ACT's paper says its model is trained from scratch for each
task, but the released code loads torchvision's ImageNet-pretrained weights into the ResNet18 image
encoders (`detr/models/backbone.py`, `pretrained=is_main_process()`), so ACT as released belongs
here, as does the `dp_clip` config below.

**A pretrained VLM.** RT-2, OpenVLA and pi0 each fine-tune one; the table below names them.

### Choice 3: how the head reads the backbone

| Reading | What reaches the head |
|---|---|
| One vector | a single summary vector. In Octo it is the embedding of a learned readout token, an extra input token that attends to the observation and instruction tokens |
| All tokens | every image and text token, in the head's own input sequence |
| Cross-attention | the head queries the backbone's tokens through separate attention layers |
| Shared attention | the head's tokens (state, noisy actions) sit in the same sequence as the backbone's tokens and attend to them in every layer; the backbone's tokens do not attend back. pi0 describes this as "a single transformer with two sets of weights" and enforces it with a blockwise mask |
| No separate head | actions are further output tokens of the VLM |

The distinction matters for a grasp because an object's position is spread over image patches. A
pooled vector is one vector that summarises a whole image, so the patches are no longer separate
tokens ([21-pooled-vs-patch-tokens.md](21-pooled-vs-patch-tokens.md)). A head that receives one
vector depends on that vector having kept the position.

<!-- interactive: pooled-vs-tokens -->
*Figure: camera frames reach the action head either as one pooled vector per image or as all 196
patch tokens per image, among which the head's attention can select the patches that contain the
object.*

### Choices 4 and 5: data and availability

The year is the first arXiv submission. An empty cell means the fact was not confirmed for this
chapter. The table has no success column: each system was evaluated on its own robots, tasks and
data.

| System | Actions | Backbone | Head reads | Training data | Released |
|---|---|---|---|---|---|
| ACT (2023) | L1 regression on a chunk of 100, CVAE training | ResNet18 (ImageNet-initialised in the released code) and a transformer encoder-decoder, about 80M parameters; no language input | cross-attention | 50 demonstrations per task (100 for one task) | code (MIT) |
| Diffusion Policy (2023) | denoising diffusion over an action sequence | ResNet-18 without pretraining, trained end to end | FiLM, in which observation features scale and shift the head's activations (CNN variant), or cross-attention (transformer variant) | | code (MIT), configs and checkpoints per experiment |
| RT-2 (2023) | 256 bins per dimension, autoregressive tokens | PaLI-X (5B, 55B) or PaLM-E (12B), co-fine-tuned (trained on robot data mixed with the original web data) | no separate head | web vision-language data plus robot data from 13 robots over 17 months | none announced in the paper |
| Octo (2024) | diffusion head, action chunk | transformer trained on robot data, 27M or 93M parameters; pretrained `t5-base` text encoder | one readout token | 800k trajectories from 25 Open X-Embodiment datasets | code and checkpoints (MIT) |
| OpenVLA (2024) | 256 bins per dimension, autoregressive tokens | Prismatic VLM, 7B: SigLIP + DINOv2 + Llama 2 | no separate head | 970k Open X-Embodiment trajectories | code (MIT) and checkpoints (derived from Llama 2, so subject to its licence) |
| pi0 (2024) | flow matching, chunk of 50 | PaliGemma (3B) plus a 300M action expert trained from scratch, 3.3B in total | shared attention | over 10,000 hours: the authors' data from 7 robot configurations and 68 tasks, plus Open X-Embodiment | code and base checkpoint in `openpi` (Apache-2.0) |
| pi0-FAST (2025) | FAST tokens, autoregressive | the pi0 VLM, which decodes the action tokens itself; no action expert | no separate head | 10k hours | FAST+ tokenizer; base checkpoint in `openpi` |

What follows: ACT trains one policy per task and Diffusion Policy releases a checkpoint per
experiment, while Octo, OpenVLA and pi0 are trained on data pooled from many robots and released as
checkpoints to fine-tune.

## In this repository

Six of the eight policy configs in [`sim/pickup/configs/`](../../sim/pickup/configs/) are placed
here. The other two, `dp_vit_reactive` and
`dp_vit_lang_reactive`, are `dp_vit` and `dp_vit_lang` with one frame per camera, the current state
only and no previous action. All eight set `model.type: diffusion_policy` and
`use_flow_matching_scheduler: true`, directly or through an included preset, so on choice 1 they are
the same: a flow-matching head that predicts 15 actions, the current step plus
`lowdim_future_timesteps: 14`. `sim/pickup/eval.py` executes 8 of them by default
(`--exec_horizon`).

They differ on choices 2 and 3 through one key, `model.vision_language_backbone.type`.
`get_vision_language_backbone` in
[`vla_foundry/models/vision_language_backbones/__init__.py`](../../vla_foundry/models/vision_language_backbones/__init__.py)
maps `clip_backbone`, `vit_backbone`, `vlm_backbone` and `vlm_foundry_backbone` to
`CLIPBackboneWrapper`, `ViTBackboneWrapper`, `VLMHFBackboneWrapper` and `VLMFoundryBackboneWrapper`.
Each wrapper's `get_action_conditioning` returns a `VisionLanguageBackboneOutput` whose `embeddings`
field has shape `[batch, tokens, width]`. For the worked example:

| Config | Backbone | Conditioning the head receives |
|---|---|---|
| [`dp_clip`](../../sim/pickup/configs/dp_clip.yaml) | `clip_backbone`, pretrained `openai/clip-vit-base-patch32` | `[batch, 5, 512]`: one text vector and one pooled vector per image |
| [`dp_vit`](../../sim/pickup/configs/dp_vit.yaml) | `vit_backbone` from scratch: patch 16, 256 wide, 6 layers | `[batch, 784, 256]`: 4 images x 196 patches |
| [`dp_vit_lang`](../../sim/pickup/configs/dp_vit_lang.yaml) | the same, with `text_tokens: 32` | `[batch, 816, 256]`: 32 text slots + 784 patches |
| [`vla_qwen`](../../sim/pickup/configs/vla_qwen.yaml) | `vlm_backbone`, pretrained `Qwen/Qwen3-VL-2B-Thinking` | `[batch, 1, 4 x lm_hidden_dim]` |
| [`vla_custom`](../../sim/pickup/configs/vla_custom.yaml) | `vlm_foundry_backbone`, the VLM trained here | `[batch, 1, 2048]` |
| [`vla_custom_tokens`](../../sim/pickup/configs/vla_custom_tokens.yaml) | the same, with `conditioning: all_tokens` | `[batch, 1040, 2048]`: every real token, padded in front to `conditioning_len` |

The shapes are derived in [50-what-the-action-head-sees.md](50-what-the-action-head-sees.md) and
[60-anatomy-of-a-vla.md](60-anatomy-of-a-vla.md). Three details:

- `dp_vit` sets `processor: "none"`, and `PassthroughProcessor`
  (`vla_foundry/data/processor/__init__.py`) returns a single zero as `input_ids`: the instruction
  never reaches the model.
- `dp_vit_lang`: `ViTBackboneWrapper._embed_text` gives the prompt's token ids (the instruction plus
  one `<image>` placeholder per image, since `img_num_tokens: 1`) learned embeddings in exactly
  `text_tokens` slots, valid tokens first and padding slots zeroed; `get_action_conditioning`
  puts them in front of the patches.
- `vla_qwen` and `vla_custom`: both wrappers add an **action token**, one extra token, to the prompt
  and concatenate its hidden states from the last `num_vlm_layers_to_use: 4` layers. The VLM sees
  many image tokens (`img_num_tokens: 49` per image for Qwen, 256 for the custom VLM); the head sees
  one vector.

The head is always the same class, `DiffusionPolicy` in
`vla_foundry/models/diffusion_policy/diffusion_policy.py`. `_build_transformer_input` prepends a
time token to the conditioning, maps it to the head's width with the linear layer
`condition_encode`, and appends the state embeddings and the noisy action embeddings. The action
tokens come last, so they attend to every conditioning token. All six configs also set
`is_causal: false` for the head, so attention runs in both directions: each action step also sees
the later steps of the chunk. This is the "all tokens" reading when the backbone returns many tokens
and "one vector" when it returns one. The class has no cross-attention and no shared attention: the
backbone runs to completion first.

On the map, `dp_vit` is the from-scratch family with a generative head, `dp_clip` is the
pretrained-encoder family, and `vla_qwen` is a pretrained VLM with a continuous head, as pi0 is, but
read through one vector, as Octo's head is.

Train and evaluate with the same scripts:

```bash
sim/pickup/scripts/train.sh dp_vit pick_cube_1k dp_vit_pick_cube_1k 1500000
sim/pickup/scripts/eval.sh experiments/pickup/dp_vit_pick_cube_1k pick_cube 50
```

The two `vla_custom` configs also need
`--model.vision_language_backbone.resume_from_checkpoint <checkpoint_N.pt>` pointing at the VLM
([62-the-from-scratch-path.md](62-the-from-scratch-path.md)).

## What we measured

All numbers are from the [lab notebook](../lab-notebook.md): closed-loop success (the policy drives
the simulator, so its own actions determine the next observation) on unseen layouts, one training
seed per run.

`pick_cube`, machine A, 50 episodes. With 200 demonstrations and 300k samples, the 245M CLIP
ViT-B/32 policy (one pooled vector per image and one for the text) succeeded in 2/50 = 4%
(95% CI 1-14%) and the 36M `dp_vit` (every patch a token) in 15/50 = 30% (19-44%). The intervals do
not overlap. This does not show that pooling alone is the cause: the two policies also differ in
pretraining, size and language input. The pooled-CLIP policy also scored 0/20 on its own training
layouts. `dp_vit` with 1000 demonstrations and 1.5M samples reached 37/50 = 74% (60-84%).

`pick_target` (three objects, one named), 1500 demonstrations, 100 layouts. The first three rows
are from machine A. The last four are from machine B, with two values: raw weights / EMA weights (an
exponential moving average of the weights over training steps).

| Policy | Reading | Language | Success | Nearest object was the named one |
|---|---|---|---|---|
| `dp_vit` | all tokens | no | 1/100 | 32% |
| `vla_qwen`, 400k samples | one vector | yes | 6/100 | not recorded |
| `vla_custom` | one vector | yes | 0/100 | 33% |
| `dp_vit` | all tokens | no | 0% / 0% | 31% / 37% |
| `dp_vit_lang` | all tokens | yes | 3% / 2% | 35% / 29% |
| `dp_vit_reactive` | all tokens | no | 1% / 1% | 26% / 34% |
| `dp_vit_lang_reactive` | all tokens | yes | 3% / 5% | 49% / 41% |

Chance for the last column is 33%. The Qwen policy never lifted an object other than the named one
in 150 episodes.

In these rows no configuration exceeds 6%, so they do not rank the families. The notebook has
further rows for data variants of `dp_vit_lang_reactive`, and interim checkpoints of a
4000-demonstration run that was still training; its final result is not in and is not described
here. Still in progress, so without a result: `vla_custom_tokens` (with and without a pretrained
VLM), a further Qwen run, a 3M-sample run on the 1500 demonstrations and two single-cube controls.
Nothing here compares a flow-matching head with an autoregressive one; this repository has only
measured the former.

## Where it goes wrong

**A large backbone hiding a one-vector bottleneck.** What you see: the arm runs a complete, plausible
grasp in the wrong place. Measured here on `vla_custom`: the gripper closed in 100% of episodes, and
the nearest object was the named one 33% of the time, which is chance. This does not isolate the
one-vector reading as the cause: `dp_vit_lang`, which passes every token and the instruction, was
also at chance (35% / 29%, raw / EMA, machine B). How to check: print
`get_action_conditioning(...).embeddings.shape[1]`. What to do: pass tokens, for example
`conditioning: all_tokens`; its effect is not yet measured here
([50-what-the-action-head-sees.md](50-what-the-action-head-sees.md)).

**Where the action token lands.** `VLMHFBackboneWrapper` appends the action token after the whole
padded batch and reads position `-1`; `VLMFoundryBackboneWrapper` inserts it after each sample's
last real token. With the first, when a batch is padded on the right, the action token of a short
instruction sits behind padding tokens. The effect on success is not measured here.

**Memory for a pretrained VLM.** Weights, gradients and optimiser state are held for every trainable
parameter. The comment in `vla_qwen.yaml` estimates about 36 GB for all 2.2B parameters (an estimate
in the config, not a notebook measurement), more than a 24 GB GPU has. `vla_qwen` therefore sets
`num_trainable_vlm_layers: 4`, so `VLMHFBackboneWrapper._train_only_last_layers` freezes the VLM
except its last four language-model layers and the final norm. Those layers plus the action head are
the 306M of 2.2B parameters that the notebook reports as trained.

## Background and further reading

- Zhao, *Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware*, 2023.
  [arXiv:2304.13705](https://arxiv.org/abs/2304.13705). ACT: chunked regression trained as a CVAE.
  [Code](https://github.com/tonyzhaozh/act).
- Chi, *Diffusion Policy: Visuomotor Policy Learning via Action Diffusion*, 2023.
  [arXiv:2303.04137](https://arxiv.org/abs/2303.04137). Actions generated by conditional denoising.
  [Code](https://github.com/real-stanford/diffusion_policy).
- Brohan, *RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control*, 2023.
  [arXiv:2307.15818](https://arxiv.org/abs/2307.15818). Actions as text tokens of a co-fine-tuned
  VLM.
- Open X-Embodiment Collaboration, *Open X-Embodiment: Robotic Learning Datasets and RT-X Models*,
  2023. [arXiv:2310.08864](https://arxiv.org/abs/2310.08864). Robot data from 22 robots in one
  format.
- Octo Model Team, *Octo: An Open-Source Generalist Robot Policy*, 2024.
  [arXiv:2405.12213](https://arxiv.org/abs/2405.12213). A transformer with a diffusion head.
  [Code](https://github.com/octo-models/octo).
- Kim, *OpenVLA: An Open-Source Vision-Language-Action Model*, 2024.
  [arXiv:2406.09246](https://arxiv.org/abs/2406.09246). A 7B token-output VLA.
  [Code](https://github.com/openvla/openvla).
- Black, *π0: A Vision-Language-Action Flow Model for General Robot Control*, 2024.
  [arXiv:2410.24164](https://arxiv.org/abs/2410.24164). Flow matching on a pretrained VLM.
  [Code](https://github.com/Physical-Intelligence/openpi).
- Pertsch, *FAST: Efficient Action Tokenization for Vision-Language-Action Models*, 2025.
  [arXiv:2501.09747](https://arxiv.org/abs/2501.09747). A compressed action tokenizer.

How these systems followed from one another is in [02-how-we-got-here.md](02-how-we-got-here.md).
Flow matching and CLIP are covered in [41-flow-matching.md](41-flow-matching.md) and
[22-pretrained-vision-encoders.md](22-pretrained-vision-encoders.md).

## Check yourself

1. List the backbone of every config (`dp_clip` takes it from the preset) and name the reading of
   each, one vector or all tokens:

   ```bash
   grep -A 4 "vision_language_backbone:" sim/pickup/configs/*.yaml \
     vla_foundry/config_presets/models/diffusion_policy.yaml
   ```

2. Find the two lines where the two VLM wrappers pick the action token's hidden state, and say how
   they differ for a padded batch:

   ```bash
   grep -n "layer_hidden\[\|hs\[rows, index\]" vla_foundry/models/vision_language_backbones/*.py
   ```

3. The lab notebook has a 4% row and a 30% row for `pick_cube` with 200 demonstrations. List every
   difference between those two policies and describe a run that would isolate pooling.
