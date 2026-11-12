---
title: Anatomy of a VLA
part: 6 Vision-language-action models
order: 60
summary: Trace one training pass and one sampling pass of a VLM-backed flow-matching policy with shapes, and say which parameters each config in this repository trains.
status: draft
---

# Anatomy of a VLA

A vision-language-action model (VLA) is a robot policy that takes camera images and a language
instruction and outputs actions, usually by building on a vision-language model. The VLAs in this
repository have two parts, a backbone that turns the images and the instruction into vectors and an
action head that turns those vectors into motor commands, because reading a scene and producing
precise continuous motion are different jobs and the first can start from a model trained on images
and text.

## The idea

Four terms:

- The **backbone** is the network that reads the observation: a vision transformer (ViT), CLIP,
  or a vision-language model (VLM, [joining vision and language](30-joining-vision-and-language.md)).
- The **conditioning** is what the backbone hands over, a tensor `[B, N, D]`: `N` vectors of width
  `D` for each of the `B` samples in the batch.
- The **action head** is a second transformer that receives the conditioning, the robot state and
  a noisy action sequence, and predicts how to remove the noise
  ([flow matching](41-flow-matching.md)).
- An **action chunk** is the sequence of consecutive actions predicted in one call
  ([chunks and execution](42-chunks-and-execution.md)).

One `pick_target` sample: two cameras at steps t-1 and t give four 224x224 images, the instruction
is "pick up the red cube", the state is `[2, 8]` (seven joint angles and the gripper opening at t-1
and t). The policy returns `[16, 8]`: one slot holding the previous action, then 15 predicted
actions for t to t+14, each seven joint targets and a gripper command.

The two parts share only the conditioning tensor, and the head does not know what produced it.
That is why one class, `DiffusionPolicy`, is both "a diffusion policy with a ViT" and "a VLA": the
configs differ in the backbone, and therefore in `N` and `D`. It is a VLA when the backbone is a
VLM, that is, when a language model reads the instruction together with the image tokens
(`vla_qwen`, `vla_custom`, `vla_custom_tokens`); with a ViT or CLIP backbone it is called a
diffusion policy. The class keeps that name, but every config in the table sets
`use_flow_matching_scheduler: true`, directly or through its preset, so the head is trained with
[flow matching](41-flow-matching.md), not diffusion.

| Config | Backbone | `N` | `D` | Head sequence `1 + N + 2 + 16` |
|---|---|---|---|---|
| `dp_clip` | CLIP, pooled | 5 | 512 | 24 |
| `dp_vit` | ViT, patch tokens | 784 | 256 | 803 |
| `dp_vit_lang` | ViT patches + 32 text slots | 816 | 256 | 835 |
| `vla_qwen` | Qwen3-VL-2B, one probe vector | 1 | 4 x LM width | 20 |
| `vla_custom` | VLM trained here, one probe vector | 1 | 2048 | 20 |
| `vla_custom_tokens` | the same VLM, every token | 1040 | 2048 | 1059 |

The `1`, `2` and `16` are one time token, two state tokens and 16 action tokens. A pooled vector
is one vector standing for a whole image or instruction, and a patch token is the vector of one
image patch ([pooled vs patch tokens](21-pooled-vs-patch-tokens.md)). A probe vector is the VLM's
hidden state at one extra token placed after the prompt, explained below. What a head can do with
1 vector compared with 784 is covered in
[what the action head sees](50-what-the-action-head-sees.md).

## How it works

### A training pass through `vla_custom`

The backbone is the stage-2 VLM of [`custom_vlm.yaml`](../../sim/pickup/configs/custom_vlm.yaml):
a ViT (224 px, patch 14, 256 wide, 6 layers), a linear projector, and a language model (512 wide,
12 layers, 8 heads) that is causal: position `i` attends only to positions up to `i`. The head is
a transformer 256 wide with 6 layers and 4 heads, `is_causal: false`.

1. **Processor.** `SimpleVLMProcessor` scales the images to [-1, 1] and returns `pixel_values`
   `[4B, 3, 224, 224]`. It expands each `<image>` placeholder in the prompt into
   `img_num_tokens: 256` copies and tokenizes, giving `input_ids` `[B, L]`. `L` is at most 1035:
   3 prompt tokens, 4 x 256 image tokens and at most 8 instruction tokens, per the comment in
   `vla_custom_tokens.yaml`.
2. **Probe token.** `VLMFoundryBackboneWrapper._prepare_inputs_for_action_token` inserts one extra
   token id directly after each sample's last real token: `[B, L+1]`.
3. **VLM.** `VLM.forward` runs the ViT, `[4B, 256, 256]`, maps the result to the language model's
   width with `ModalityProjector`, `[4B, 256, 512]`, and writes those vectors over the embeddings
   of the image placeholders with `masked_scatter`. The language model returns one hidden state
   per layer, each `[B, L+1, 512]`.
4. **Conditioning.** `_extract_action_conditioning` takes the probe position from the last
   `num_vlm_layers_to_use: 4` layers and concatenates them: `[B, 1, 2048]`.
5. **Noising.** Actions and state reach the model normalised per channel
   ([action spaces](40-action-spaces.md)); the noise and the clamp are in those units.
   `DiffusionPolicy.forward` draws one integer flow timestep per sample, uniform over 0..999
   (`timesteps` in the code; unrelated to the control step t of the observation).
   `FlowMatchingScheduler.add_noise` computes `actions + s * (noise - actions)` with noise level
   `s = timestep / 1000` and clamps to `clamp_range: [-3, 3]`. `future_mask` is a boolean
   `[B, 16]`, true for the slots the policy must predict and false for the previous-action slot
   and for slots past the end of an episode
   ([chunks and execution](42-chunks-and-execution.md)). Slots where it is false stay clean.
   Result `[B, 16, 8]`.
6. **Encoding.** `action_encode` (linear, 8 to 256) gives `[B, 16, 256]`. `time_encoding`, an
   embedding table with 1000 rows of width 2048 initialised with sinusoids, gives `[B, 1, 2048]`.
   `_build_transformer_input` concatenates time and conditioning to `[B, 2, 2048]` and maps them
   with `condition_encode` (linear, 2048 to 256). `proprioception_encode` (linear, 8 to 256) turns
   the state into `[B, 2, 256]`.
7. **Head.** The concatenation `[B, 20, 256]` goes through six non-causal layers, so every action
   token attends to every other token.
8. **Direction.** `output_layer` (linear, 256 to 8) is applied to the last 16 positions of the last
   layer's hidden state: `[B, 16, 8]`.
9. **Loss.** `DiffusionPolicyBatchHandler` sets the target to `noise - actions`.
   `vla_foundry/train.py` applies `masked_mse_loss` (`loss_function: "mse"`) with `future_mask`,
   so only predicted slots count.

Files, under `vla_foundry/models/`: `vision_language_backbones/` (`simple_vlm_processor.py`,
`vlm_foundry_backbone.py`), `vlm.py`, `diffusion_policy/diffusion_policy.py`,
`diffusion/noise_scheduler_diffusers.py`, `batch_handlers.py`; and `vla_foundry/losses.py`.

```mermaid
flowchart LR
  O["4 images, prompt + probe token"] --> V["VLM"] --> C["conditioning<br/>[B, 1, 2048]"] --> H["head input<br/>[B, 20, 256]"] --> D["direction<br/>[B, 16, 8]"]
  X["flow timestep, state, noisy actions"] --> H
```

<!-- interactive: sequence-layout -->
*Figure: the VLM's token sequence (256 placeholder positions per image, the instruction, the probe
token last) and the policy's (one time token, the conditioning tokens, two state tokens, 16 action
tokens).*

### Why a probe token

Because the language model is causal, the last position is the only one that has read every image
token and the whole instruction. The wrapper adds one embedding row for a new token (the code
calls it the action token), puts it last and reads the hidden state there. Background: this is the
conditioning of the VLA Foundry report (Mercat, 2026);
[what the action head sees](50-what-the-action-head-sees.md) covers it.

### A sampling pass

At inference [`policy_server.py`](../../sim/pickup/policy_server.py) (`Policy.infer`) sends the
observation through the same `RoboticsProcessor` as training and calls
`DiffusionPolicy.generate_actions`:

1. The backbone runs once and its conditioning is reused for every step.
2. `actions` is `[1, 16, 8]`. `past_mask`, a boolean `[1, 16]` true only for slot 0, marks the
   previous executed action; the other 15 slots are replaced with Gaussian noise.
3. The server passes `num_inference_steps = 10` by default (`num_flow_steps` in `Policy.infer`,
   `--flow_steps` in `sim/pickup/eval.py`; `generate_actions` on its own falls back to
   `scheduler.num_timesteps`, 999 head passes). The step size is then `1000 // 10 = 100` and the
   loop visits timesteps 999, 899, ..., 99. Each iteration builds the same 20-token input as in
   training, runs the head, and calls `FlowMatchingScheduler.step`:
   `actions - direction * (100 / 1000)`, clamped to [-3, 3]. The past slot is restored after every
   step.
4. The server maps the chunk back from normalised units with the processor's normaliser and
   returns slots 1 to 15, `[15, 8]`. The caller decides how many to execute before asking again
   (`--exec_horizon`, default 8).

With that default, one chunk costs one backbone pass and ten head passes.

### What changes with Qwen

[`vla_qwen.yaml`](../../sim/pickup/configs/vla_qwen.yaml) uses `vlm_backbone`, which loads a
Hugging Face model through `VLMHF`. The processor is Qwen's own: per the config's comment a 224 px
image becomes 14 x 14 patches of 16 px merged 2 x 2 into 49 tokens, 196 for four images.
`VLMHFBackboneWrapper` appends the probe token at the end of the sequence and reads position `-1`
from the last four hidden states, giving `[B, 1, 4 x lm_hidden_dim]`
([pretrained backbones](61-pretrained-backbones.md) works out the width). The head comes from the
preset `vla_diffusion_paligemma2.yaml` that `vla_qwen.yaml` includes: `transformer_100m.yaml`
(512 wide, 12 layers, 8 heads) with `is_causal` overridden to `false`; 20 tokens again.

### Background: actions as tokens of the language model

This subsection is background from the cited papers; none of it was run here. The other common
design has no separate head. RT-2 (Brohan, 2023) discretises each action dimension into 256 bins
and has the VLM emit the bin numbers as text tokens. OpenVLA (Kim, 2024) uses 256 bins per
dimension as well and overwrites the 256 least used tokens of its Llama tokenizer with them. FAST
(Pertsch, 2025) keeps token output but changes what a token is: it applies a discrete cosine
transform (which rewrites a signal as weights on cosines of increasing frequency) to each action
dimension of a chunk, rounds the coefficients, and compresses the result with byte-pair encoding,
so a token no longer stands for one action dimension at one step.

| | Binned action tokens (RT-2, OpenVLA) | Separate continuous head (this repository) |
|---|---|---|
| Output | one bin index per token | real-valued chunk `[16, 8]` |
| Loss | next-token cross-entropy | mean squared error on the flow direction |
| Language-model work | one decoding step per action token | one pass per chunk, then one head pass per flow step |

Published designs with a separate head are compared in [the landscape](03-the-landscape.md).

## In this repository

**Registry.** [`vla_foundry/models/registry.py`](../../vla_foundry/models/registry.py) keeps two
dictionaries, filled by the decorators `register_model` and `register_batch_handler`.
`create_model(model_params)` looks up `model_params.type`. Importing `vla_foundry.models` registers
eleven model names (`transformer`, `transformer_hf`, `vlm`, `vlm_hf`, `stable_diffusion`,
`clip_openclip`, `clip_hf`, `clip_backbone`, `vlm_backbone`, `vlm_foundry_backbone`,
`diffusion_policy`).

**Assembly.** For `model.type: diffusion_policy`, `create_diffusion_policy` in
[`diffusion_policy/__init__.py`](../../vla_foundry/models/diffusion_policy/__init__.py) builds
three objects and passes them to `DiffusionPolicy`: the backbone from
`get_vision_language_backbone`, the head from `create_model(model_params.transformer)`, and the
scheduler from `create_noise_scheduler`, which returns `FlowMatchingScheduler` when
`use_flow_matching_scheduler` is true and `use_diffusers_scheduler` is not (checked first; no
pickup config sets it).

**Four backbones.** `get_vision_language_backbone` in
[`vision_language_backbones/__init__.py`](../../vla_foundry/models/vision_language_backbones/__init__.py)
dispatches on `vision_language_backbone.type`:

| `type` | Wrapper | Model inside | Conditioning |
|---|---|---|---|
| `clip_backbone` | `CLIPBackboneWrapper` | `CLIPHF` | one text vector, one vector per image |
| `vit_backbone` | `ViTBackboneWrapper` | `ViT`, built directly, not through the registry | every patch, plus `text_tokens` text slots |
| `vlm_backbone` | `VLMHFBackboneWrapper` | `VLMHF` (Hugging Face `AutoModelForImageTextToText`) | probe vector |
| `vlm_foundry_backbone` | `VLMFoundryBackboneWrapper` | `VLM` rebuilt from an experiment's `config_model.yaml` | probe vector, or every token with `conditioning: all_tokens` |

Each wrapper implements `get_conditioning_embeddings_dim`, which `DiffusionPolicy.__init__` uses
to size `time_encoding` and `condition_encode`. `get_action_conditioning` is defined in
`BaseBackboneWrapper` (`base.py`: `_prepare_inputs`, run the model,
`_extract_action_conditioning`); the CLIP and Hugging Face VLM wrappers fill in those hooks, the
ViT and Foundry-VLM wrappers override the method.

**Trained and frozen.**

| Config | Trained | Frozen |
|---|---|---|
| `dp_clip` | CLIP and the head | nothing (`freeze_text_encoder` and `freeze_image_encoder` default to false) |
| `dp_vit` | ViT and head, from random weights | nothing |
| `dp_vit_lang` | ViT, the text embeddings (`text_embedding`, `text_position`, `text_norm` in `ViTBackboneWrapper`) and head, from random weights | nothing |
| `vla_custom` | the whole VLM and the head | nothing |
| `vla_custom_tokens` | the whole VLM and the head; no probe-token row is added (`conditioning: all_tokens`) | nothing |
| `vla_qwen` | the last 4 language-model layers, the final norm, the head | the rest of the VLM: vision tower, token embeddings, lower layers |

The last row is `num_trainable_vlm_layers: 4`.
`VLMHFBackboneWrapper._train_only_last_layers` sets `requires_grad = False` on every VLM parameter
and re-enables the last layers and the norm; `create_optimizer` (`vla_foundry/optimizer.py`) skips
frozen parameters. The probe token's embedding row is in the frozen set, so in `vla_qwen` it keeps
its initial value, the mean of the other rows.

The head's `Transformer` also owns a token-embedding table and a vocabulary projection of
`vocab_size x hidden_dim` each (50,432 x 256, about 12.9M, in `vla_custom`). The policy feeds
`inputs_embeds` and reads `hidden_states[-1]`, so both are counted in the totals but do not affect
the loss. Neither do the VLM's vocabulary projection in `vla_custom` (49,281 x 512, about 25.2M)
and the final `norm` of both transformers: `Transformer.forward` collects `hidden_states` before
`self.norm` and `self.output`. This follows from the code; it was not measured.

```bash
# needs the dataset: sim/pickup/scripts/make_dataset.sh pick_target 1500 pick_target_1500
# from-scratch VLA; needs experiments/pickup/custom_vlm (custom_path.sh data, llm, vlm)
sim/pickup/scripts/custom_path.sh vla pick_target_1500 my_vla_custom 1000000 pretrained vla_custom
sim/pickup/scripts/train.sh vla_qwen pick_target_1500 my_vla_qwen 400000
sim/pickup/scripts/eval.sh experiments/pickup/my_vla_qwen pick_target 100
grep -E "parameters" experiments/pickup/my_vla_qwen.train.log   # total, trainable, VLM split
```

## What we measured

From the [lab notebook](../lab-notebook.md), machine A (one RTX 4090):

| Policy | Parameters | Training throughput | Inference per chunk |
|---|---|---|---|
| `dp_vit` | 36M | about 620 samples/s | 20-65 ms |
| `vla_custom` | 130.0M, everything trainable (91.4M LM, 96.5M VLM) | 165 samples/s | not in the notebook |
| `vla_qwen` | 2.2B, 306M trainable | 49 samples/s at batch 16 | about 190 ms |

`dp_clip` (pooled CLIP) has 245M parameters.

On `pick_target` (1500 demonstrations, unseen layouts, one training seed, machine A), `vla_qwen`
ended at a loss of 0.03-0.04 and 6/100 successes after 400k samples (4 epochs). `vla_custom` ended
at ~0.03 and 0/100 after 1.0M samples (10 epochs), and at ~0.03 and 1/100 with a randomly
initialised VLM.

The Qwen policy never lifted an object other than the named one in 150 episodes. Both `vla_custom`
policies closed the gripper in 100% of 100 episodes, with the named object nearest in 33%
(pretrained VLM) and 29% (random VLM), chance being 33%, and a median miss to the named object of
175 mm and 174 mm.

These numbers show that both one-vector VLAs train to a low loss without solving the task, and
that the from-scratch one neither chose nor located the object. They do not show why: the two runs
differ in backbone, head size, trained fraction and epochs. Whether handing the head every token
helps has no result yet: the notebook lists `conditioning: all_tokens` as "effect not yet
measured", and lists the Qwen VLA and the all-token VLA, with and without pretraining, among the
runs still in progress.

## Where it goes wrong

**Low loss, gripper closes in empty space.** The `vla_custom` numbers above. One suspect is that
the head receives one vector and never a patch, but the notebook does not isolate it: `dp_vit`,
whose head sees 784 patch tokens and no language, scored 1/100 on the same demonstrations with a
median miss of 110 mm to the nearest object (machine A), and `dp_vit_lang`, patch tokens plus the
instruction, scored 3% / 2% (raw / EMA weights, machine B) at 1M samples. Check with
`sim/pickup/grasp_map.py` on the evaluation's `results.json`;
[`vla_custom_tokens.yaml`](../../sim/pickup/configs/vla_custom_tokens.yaml) tests the suspicion
and is unmeasured.

**The probe ends up behind padding.** Nothing in the training log shows this: the loss is normal,
and the conditioning for a prompt differs between a training batch and serving it alone
([train-inference skew](93-train-inference-skew.md)). A batch is padded to its longest prompt.
`VLMFoundryBackboneWrapper` once appended the probe after the padding; it now inserts it after the
last real token (effect on success not measured). `VLMHFBackboneWrapper` still concatenates at the
end and reads `[:, -1]`; whether padding lies in between depends on the tokenizer's padding side,
which was not checked here. Compare the conditioning of one prompt alone and inside a batch with a
longer one. For the from-scratch wrapper that comparison is a test:
`uv run pytest tests/essential/models/test_vlm_foundry_backbone_conditioning.py -q`.

**A backbone with random weights.** `create_vlm_foundry_backbone` loads weights only when
`resume_from_checkpoint` is set. With only `vlm_experiment_dir` it trains from random weights
without an error (`custom_path.sh vla ... scratch` does this on purpose). Check the command that
started the run.

## Background and further reading

- Chi, "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion", 2023.
  [arXiv:2303.04137](https://arxiv.org/abs/2303.04137). Action sequences generated by conditional
  denoising (DDPM), with a CNN or a transformer denoiser. `DiffusionPolicy` takes its name and
  chunk-denoising transformer from it; the configs here train with flow matching instead.
- Mercat, "VLA Foundry: A Unified Framework for Training Vision-Language-Action Models", 2026.
  [arXiv:2604.19728](https://arxiv.org/abs/2604.19728). The framework this repository builds on.
- Brohan, "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control", 2023.
  [arXiv:2307.15818](https://arxiv.org/abs/2307.15818). Actions written as text tokens of a VLM.
- Kim, "OpenVLA: An Open-Source Vision-Language-Action Model", 2024.
  [arXiv:2406.09246](https://arxiv.org/abs/2406.09246). A 7B-parameter open model with token
  output.
- Pertsch, "FAST: Efficient Action Tokenization for Vision-Language-Action Models", 2025.
  [arXiv:2501.09747](https://arxiv.org/abs/2501.09747). A compressed action tokenizer for
  autoregressive VLAs.
- Bai, "Qwen3-VL Technical Report", 2025. [arXiv:2511.21631](https://arxiv.org/abs/2511.21631).
  The VLM behind `vla_qwen.yaml`
  ([model page](https://huggingface.co/Qwen/Qwen3-VL-2B-Thinking)).

[Pretrained backbones](61-pretrained-backbones.md) continues with `vla_qwen` and
[the from-scratch path](62-the-from-scratch-path.md) with `vla_custom`.

## Check yourself

1. List what the registry offers and find the backbone type that is missing from it:

   ```bash
   uv run python -c "
   import vla_foundry.models
   from vla_foundry.models.registry import list_registered_models
   print(sorted(list_registered_models()))"
   ```

2. Count the denoising iterations for 10, 7 and 16 flow steps and multiply by the step size:

   ```bash
   python3 -c "
   for n in (10, 7, 16):
       s = 1000 // n; k = len(range(999, 0, -s)); print(n, k, k * s / 1000)"
   ```

3. Run the backbone tests, then explain from `_train_only_last_layers` why the probe token's
   embedding is not trained in `vla_qwen` but is in `vla_custom`:

   ```bash
   uv run pytest tests/essential/models/test_vlm_backbone_partial_freeze.py \
       tests/essential/models/test_vlm_foundry_backbone_conditioning.py -q
   ```
