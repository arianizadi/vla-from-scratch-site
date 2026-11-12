---
title: Edge Cases and Failures
part: Appendix
summary: Look up a symptom and find its cause, the check that confirms it, and the chapter that explains it.
status: draft
---

# Edge Cases and Failures

An index of every failure and edge case described in the chapters' "Where it goes wrong" sections,
grouped by area. Each row gives what you see, why it happens, how to check and what to do, and the
chapters that describe it; a failure that several chapters describe has one row. The rows are
summaries: follow the link for the mechanism and the commands.

How to read the rows:

- "No error" in the first column means exactly that: nothing is raised and the training loss looks
  normal. These are the expensive ones.
- A number in a row is measured here and comes from the [lab notebook](../lab-notebook.md), unless
  the row says "arithmetic" or "background".
- "Not measured" means the chapter describes the mechanism from the code and no run here shows its
  effect on success.
- "Not observed" means the failure is predicted from the code and has not happened here.

To start from a failing policy instead of a symptom, use
[94 A Debugging Flowchart](94-debugging-flowchart.md).

## Contents

1. [Tokens, prompts and padding](#1-tokens-prompts-and-padding)
2. [Generating text](#2-generating-text)
3. [Training a language model](#3-training-a-language-model)
4. [Images and vision encoders](#4-images-and-vision-encoders)
5. [Vision-language models](#5-vision-language-models)
6. [Actions, flow matching and chunks](#6-actions-flow-matching-and-chunks)
7. [Imitation and demonstrations](#7-imitation-and-demonstrations)
8. [Conditioning and VLA backbones](#8-conditioning-and-vla-backbones)
9. [Training runs and operations](#9-training-runs-and-operations)
10. [Evaluation and diagnostics](#10-evaluation-and-diagnostics)
11. [What is still hard](#11-what-is-still-hard)

## 1. Tokens, prompts and padding

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| No error. A short instruction gets different conditioning in a padded training batch than when served alone | The action token (probe token) is appended after the batch padding, so a short prompt is probed behind pad tokens in training and directly after its last word when served. Fixed in `vlm_foundry_backbone.py`, which inserts it after the last real token; `vlm_hf_backbone.py` (used by `vla_qwen.yaml`) still appends and reads index `-1`. Effect on success not measured | Compare the conditioning of one prompt alone and inside a batch with a longer one; `test_conditioning_does_not_depend_on_padding` does this for the from-scratch wrapper. For the Hugging Face wrapper print `processor.tokenizer.padding_side`; porting the fix is on the roadmap | [00](00-the-route.md), [03](03-the-landscape.md), [10](10-tokens.md), [50](50-what-the-action-head-sees.md), [60](60-anatomy-of-a-vla.md), [61](61-pretrained-backbones.md), [93](93-train-inference-skew.md) |
| No error. The conditioning a sample gets depends on the batch it is in | Padding sits between the conditioning and the action tokens: with `conditioning_len: 0` the conditioning keeps the batch's padded length, so the action head sees another sequence length in training than when one prompt is served | Pass one sample alone and inside a padded batch and compare the conditioning tensors. Set `conditioning_len` to the prompt's maximum length; too small a value raises a `ValueError` | [12](12-positions.md), [50](50-what-the-action-head-sees.md) |
| No error: the end of a long instruction is dropped. Or a `ValueError` naming `conditioning_len` | The token count depends on the number of images times `img_num_tokens`, the template's wrapper ids, the tokenizer, and surface details such as a trailing full stop. `_embed_text` silently keeps the first `text_tokens` ids (32 in the pickup configs), so the closing tokens are lost first, then the end of the instruction | Print the tokenized length of the longest instruction with the config's image count and `img_num_tokens`; set the budget from that count | [10](10-tokens.md), [12](12-positions.md) |
| Index error on CPU, or a device-side assertion on GPU, at the embedding lookup | A pad id outside the embedding table: a tokenizer without a pad token gets an added `[PAD]` id one past the old vocabulary. Not hit by the configs here (the SmolVLM2 pad id is 2) | Never look up an id that is about to be ignored: `_embed_text` multiplies ids by the mask before the lookup. `test_vit_backbone_text.py` checks left-padded, right-padded and unpadded inputs agree | [10](10-tokens.md) |
| The same index error; or no error in stage 1 and weights whose shape does not fit the stage-2 VLM | `model.vocab_size` does not equal the tokenizer's size: the preset has 50,432 and `custom_llm.yaml` overrides it to 49,280 | `len(tok)` must equal `model.vocab_size`; check before stage 1 | [10](10-tokens.md) |
| No error. An over-long prompt would lose its first ids, image placeholders included | `SimpleVLMProcessor.__call__` forwards only `padding` and `max_length` and always truncates, so padding side and truncation side are the tokenizer's own, and its published configuration truncates on the left. Not exercised here | Print `tok.padding_side` and `tok.truncation_side`; keep prompts shorter than `max_length` | [10](10-tokens.md) |
| Predictions for a sequence change with the amount of padding in front of it | A left-padded batch went through `Transformer.forward` without the cache; in a causal pass the attention mask is dropped and real tokens attend to pads | Print `tokenizer.padding_side`: `batch_tokenize` (stage 1) pads without setting a side, `image_caption.py` passes `padding_side="right"` | [11](11-the-transformer-block.md) |
| `is_causal=False` passed to `forward` changes nothing | The code computes `is_causal or self.is_causal`: the argument can switch the mask on, never off | Set `is_causal: false` in the config, as the action-head configs do | [11](11-the-transformer-block.md) |
| A shape error in the position embedding, or attention narrower than the stream | `head_dim = hidden_dim // n_heads` is integer division with no check | Choose `n_heads` that divides `hidden_dim` | [11](11-the-transformer-block.md) |
| No error on an input longer than any trained sequence | Rotary angles are defined for any position, but the weights were fitted on offsets up to the training length | Compare `inputs_embeds.shape[1]` with the training lengths; keep inference at or below them, or train at the longer length | [12](12-positions.md) |
| No error. The action head cannot tell its four images apart and action tokens lose their time step | `positional_embedding_type: none` together with `is_causal: false`: no mask and no position information, so the head receives no order | Check this key in the resolved config before training a non-causal model | [12](12-positions.md) |

## 2. Generating text

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| A word or phrase repeated until the token limit | Background: decoding that always takes the most likely token falls into loops; a tiny model does the same. The test fixture here shows the symptom and does not separate the two causes | Generate the same prompt with `temperature=0` and with the defaults and compare. Remedies (background, not measured here): sampling, a lower `max_new_tokens`, an EOS the model emits | [14](14-generation.md) |
| No error. Output after a prompt that is not formatted as in training | `generate` returns tokens for any ids; next-token probabilities were fitted only after prefixes in the training format. No run here has a mismatched prompt | Print the prompt next to a training text: the prompt must be a prefix of it. `vlm_check.py` cuts its prompt out of a templated caption for this reason | [14](14-generation.md) |
| Generation starts from a padding position; batched generation changes with padding | Both `generate` methods read the logits at position -1. `SimpleVLMProcessor.__call__` defaults to `padding="max_length"` with `max_length=2048`, so a single prompt comes back right-padded unless the caller passes `padding=False`. With `use_cache=False` the mask is dropped and every generated token attends to the padding | Print `inputs["input_ids"].shape` and decode the last five ids before calling `generate`: the row must end in the last prompt token. Use `vlm_check.py` for the from-scratch VLM. For batches, left-pad and keep `use_cache=True`, or generate one prompt at a time | [11](11-the-transformer-block.md), [14](14-generation.md) |
| Generation never stops, or stops late | With `eos_token_id=None` the loop runs to `max_new_tokens`; in a batch it stops only when every row emits EOS at the same step | Do not rely on EOS: `vlm_check.py` keeps the text before the first period | [14](14-generation.md) |
| Scores of a check change between runs | The defaults sample | Use `temperature=0` or `top_k=1` in a check | [14](14-generation.md) |

## 3. Training a language model

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| Out of memory after raising the batch or the sequence length | The logits are `[batch, tokens, 49280]` in float32. Stage 1 ran out of memory at batch 128 on the 24 GB card: 6.5 GB per tensor for 128 x 256 tokens | Multiply it out before raising `per_gpu_batch_size` or `seq_len`. Keep the forward pass at 32 and accumulate: `--hparams.global_batch_size 128 --hparams.per_gpu_batch_size 32` | [10](10-tokens.md), [11](11-the-transformer-block.md), [13](13-training-a-language-model.md), [62](62-the-from-scratch-path.md) |
| Loss stays near 10.8, or falls and then jumps or prints `nan` | Reasoning, not observed here: the weights are not moving, or the peak learning rate is too high for the model | Check that the `LR:` field of the log rises over the warm-up; rerun with a lower rate (`--hparams.lr 1e-4`) | [13](13-training-a-language-model.md) |
| The warm-up is far shorter or longer than intended | `warmup` changes meaning below 1: a value below 1 is a fraction of total steps, anything else a step count, so `--hparams.warmup 1` is one step | Read the `LR:` field in the first log lines | [13](13-training-a-language-model.md) |
| No error. Late updates leave weights unchanged | The weights are bf16 and are updated in place; an update below half the grid spacing of the format is lost (arithmetic on the format). Effect on the final loss not measured | Background: a float32 master copy of the weights avoids it | [13](13-training-a-language-model.md) |
| Stage 1 or stage 2 hangs and is not restarted | The `llm` and `vlm` stages of `custom_path.sh` call `main.py` directly, not `train_resilient.sh` | See "A run sits at 0% GPU" under [Training runs and operations](#9-training-runs-and-operations) | [13](13-training-a-language-model.md), [62](62-the-from-scratch-path.md) |

## 4. Images and vision encoders

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| No error. The training loss falls normally and the model at inference answers as if it had no image | Pixel range: `SimpleVLMProcessor` scaled PIL and numpy images to [0, 1] and left uint8 tensors at 0 to 255; training fed tensors and the check fed PIL images. Before the fix the stage-2 VLM scored 1/300 on exact ordering and 70/300 on the leftmost object. Fixed, with a test | Teacher-forced loss with the right and with a mismatched image, on both feeding paths: it was 1.93 against 1.89 with PIL images and 0.10 against 1.18 with the unscaled tensors. `test_simple_vlm_processor_scaling.py` holds the three input types to one output. Run `custom_path.sh check` before stage 3 | [20](20-images-to-tokens.md), [30](30-joining-vision-and-language.md), [32](32-testing-a-vlm.md), [62](62-the-from-scratch-path.md), [93](93-train-inference-skew.md) |
| No error. A float image with values up to 255 comes out of the processor with a maximum of 509 | The fix and the test cover uint8 input; `_process_image` treats a float tensor or array as already scaled | Print `pixel_values.min()` and `.max()` where your code calls the processor | [32](32-testing-a-vlm.md) |
| `AssertionError` in `VLM.forward` on the first batch | The number of `<image>` placeholders differs from the number of image tokens spliced in. Causes: `data.img_num_tokens` does not follow `patch_size`, `img_size` and the shuffle factor (256 for 224 px with patch 14, 196 with patch 16); an encoder that adds a class token or register tokens; or left truncation cut placeholders off, which the start-up check (`seq_len >= img_num_tokens`) does not catch | Print the encoder's output shape and set `img_num_tokens` to its token count divided by the shuffle factor squared. Keep `seq_len + 1 >= 3 + img_num_tokens + c + 2` for a caption of `c` tokens | [20](20-images-to-tokens.md), [22](22-pretrained-vision-encoders.md), [30](30-joining-vision-and-language.md), [31](31-training-a-vlm.md), [32](32-testing-a-vlm.md) |
| `RuntimeError` about tensor sizes at `x + self.position_embedding`; or no error and a silently cropped border | The image is not the size the ViT was built for: `data.image_size` and the ViT's `img_size` disagree, or the encoder expects another size (timm's DINOv2 models default to 518 px). A side that is not a multiple of the patch size loses its leftover rows and columns without warning | Keep `data.image_size` equal to the backbone's `img_size` | [20](20-images-to-tokens.md), [21](21-pooled-vs-patch-tokens.md), [22](22-pretrained-vision-encoders.md) |
| No error. A policy that acts as if its cameras or time steps were swapped (not observed here) | Nothing in the ViT marks a token as front or wrist, earlier or current; the image order must be identical in training and serving | Compare `data.image_names` in the run's saved config with the names passed to `process_inputs` at serving | [20](20-images-to-tokens.md) |
| Patch tokens do not locate a small object | Tokens that are too coarse: position survives only as far as the patch embedding keeps it. Here the cube is about 10 to 15 pixels wide against a 16-pixel patch, and `dp_vit` still learned to grasp it; whether 32-pixel patches are enough was not measured | Compute the object's width in pixels before choosing a patch size | [21](21-pooled-vs-patch-tokens.md) |
| Out of memory, or a fall in samples/s, after adding a camera, a frame of history or a finer grid | The token count multiplies and attention cost grows with its square; `model.transformer.max_seq_len` is not enforced, so no shape error appears | Compute the sequence length before the run | [21](21-pooled-vs-patch-tokens.md) |
| `Unknown model` from timm | `hf_pretrained` holds a `transformers` repository id; timm has its own names | Use a timm name, or timm's `hf-hub:` prefix | [22](22-pretrained-vision-encoders.md) |
| A matrix shape error in `ModalityProjector` on the first batch | `model.vit.hidden_dim` is still the default 768, not the encoder's width | Set `model.vit.hidden_dim` to the encoder's width | [22](22-pretrained-vision-encoders.md) |
| No error. A pretrained encoder is fed inputs it was not trained on | `SimpleVLMProcessor` normalises with mean 0.5 and std 0.5 per channel; DINOv2 and OpenAI CLIP were trained with other statistics, and no config key sets them | Compare with the checkpoint's values (`pretrained_cfg['mean']` in timm); pass `image_mean` and `image_std` in code | [22](22-pretrained-vision-encoders.md) |

## 5. Vision-language models

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| `ValueError` from `pixel_shuffle` | With a factor above 1 the token count must be a perfect square, which a class token breaks, and the grid side must be divisible by the factor. A checkpoint trained with one factor does not fit a model built with another | Change `data.img_num_tokens` with the factor | [30](30-joining-vision-and-language.md) |
| Image-position hidden states do not change with the instruction | Expected: the images come before the text and the language model is causal. A conditioning scheme that uses only image-position states leaves the instruction out; in `all_tokens` mode the instruction is combined with the image at the text positions or in the non-causal action head | Change the text on a small model and compare the image-position states | [30](30-joining-vision-and-language.md), [50](50-what-the-action-head-sees.md) |
| No error. A caption of 61 to 63 tokens trains on rows that lack the first prompt tokens | Left truncation takes the prompt tokens first; from 64 tokens the `AssertionError` above fires | Tokenize the longest caption: the row must start with `<\|im_start\|>`; otherwise raise `seq_len` | [31](31-training-a-vlm.md) |
| Low loss, wrong objects in the captioning check | The scored tokens were predictable without position, or without the image | Compare the ordering score with chance (1 in 6 for three listed objects, 1 in 2 for two) and the loss with a mismatched image; add caption forms that state position | [31](31-training-a-vlm.md) |
| A caption names an object the image does not show, or omits one that is partly visible | `caption` tests only the projected centre of each object | View the `.jpg` and `.txt` of one key; accept the label noise, or test visibility with a segmentation render | [31](31-training-a-vlm.md) |
| Expected, not tested here: captions fail on a real camera | Every training image renders one table under fixed lights | Test on real images, then add some or randomise appearance | [31](31-training-a-vlm.md) |
| A check passes and the deployed model ignores images; a check and the served model disagree | The check loads its samples through the training pipeline and repeats training's mistakes, or builds its own inputs: `vlm_check.py` sets `image_seq_length = 256` by hand, equal to `img_num_tokens` in `custom_vlm.yaml` only by agreement | Feed checks the way the served model is fed; edit the lines that build `proc` in `vlm_check.py` when the config changes | [32](32-testing-a-vlm.md), [93](93-train-inference-skew.md) |
| Swapping the image does not change the answer of a working model | The mismatched image has the same answer: two scenes can share a caption | Average over tens of samples; take the substitute from another scene, not the other camera of the same scene | [32](32-testing-a-vlm.md) |
| A low exact-match score | Exact match fails for reasons that are not vision: a list cut short by `max_new_tokens=28`, a missing article or an extra space counts as a wrong object | Read the printed pairs before interpreting the score; work out what guessing would give | [32](32-testing-a-vlm.md) |
| The next stage starts from a half-trained model, without an error | The `latest` helper of `custom_path.sh` returns a run's highest-numbered checkpoint, and stages 1 and 2 are not wrapped in the restart loop | `grep -c "Model has seen the desired number of samples"` on each stage's train log must print a count above 0 | [62](62-the-from-scratch-path.md) |
| The VLA cannot be rebuilt or served | `create_vlm_foundry_backbone` reads the VLM experiment's `config_model.yaml` every time the model is constructed, including in the policy server | Keep `experiments/pickup/custom_vlm` for as long as a policy built on it is evaluated | [62](62-the-from-scratch-path.md) |
| The from-scratch VLM is taken for a general one | Stage 2 saw renders of one table with four objects and templated captions; nothing here measures it on photographs, other objects or other phrasings | Use it as a control; for a backbone that knows the world outside the simulator see [61](61-pretrained-backbones.md) | [62](62-the-from-scratch-path.md) |
| No error. A "pretrained" VLA backbone trains from random weights | `create_vlm_foundry_backbone` loads weights only when `resume_from_checkpoint` is set; `vlm_experiment_dir` alone gives the architecture | Check the command that started the run (`custom_path.sh vla ... scratch` does this on purpose) | [60](60-anatomy-of-a-vla.md) |

## 6. Actions, flow matching and chunks

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| A loss that jumps or turns NaN | A channel that never varies: its `std` is 0, the scale is clamped to `epsilon` = 1e-8, and the first value that deviates becomes an enormous normalised number | Check the smallest entry of `std` in `stats.json`; raise `data.normalization.epsilon` or drop the channel | [40](40-action-spaces.md) |
| A joint stops short of an extreme pose the demonstrations reach | Outputs are cut at ±3: `FlowMatchingScheduler.add_noise` and `step` clamp to `clamp_range`, three standard deviations in normalised units | Check `(max - mean) / std` and `(min - mean) / std` per channel in `stats.json`; widen `model.noise_scheduler.clamp_range` | [40](40-action-spaces.md) |
| No error. The policy is given a state from one step in the future, or one step old | Off by one step. `lowdim_past_timesteps or default` treated 0 as unset, so with 0 past steps the proprioception input contained the state one step in the future; fixed with an `is None` check. At serving, slicing the client's `[previous, current]` states from the front hands a no-history policy the old state; `Policy.infer` slices from the end | `tests/essential/data/test_proprioception_past_steps.py` | [40](40-action-spaces.md), [42](42-chunks-and-execution.md), [93](93-train-inference-skew.md) |
| The gripper closes on empty table | The target is multimodal for the input the action head receives, and samples fall between modes | Read `grasp.closed_nearest_is_target_rate` and `grasp.median_xy_err_nearest_mm` in `results.json`; call `Policy.infer` twice on one observation and compare the chunks. Check what the head is given before the sampler | [41](41-flow-matching.md) |
| The sample is pushed past the end of the path | A step count that does not divide 1000: with 7 steps the loop makes 8 passes that cover 1.136 of the path (arithmetic). Effect on a trained policy not measured | Use a divisor of 1000 (4, 5, 8, 10, 20, 25) | [41](41-flow-matching.md) |
| Sampling fails, or trains against the wrong target, with another scheduler | `create_noise_scheduler` can return a DDPM scheduler, but the batch handler's target stays `noise - actions` and `generate_actions` passes `step_size=`, which only `FlowMatchingScheduler.step` accepts | Every pickup config sets `use_flow_matching_scheduler: true`; keep it | [41](41-flow-matching.md) |
| A ported sampler walks away from the data | Sign and time direction: here $s = 0$ is the action, the target is noise minus action and the sampler subtracts; the flow-matching papers put noise at time 0 (background) | Flip both the sign and the time index | [41](41-flow-matching.md) |
| No error. The previous command is repeated at every re-plan and every later action runs one step late | The chunk starts at the wrong index: in a 16-row output the first row is the previous action, so `Policy.infer` returns `out[0, self.past:]` | Print the first returned action next to `prev_action`; they should differ whenever the arm is moving | [42](42-chunks-and-execution.md) |
| Expected sign, not measured in the chapter: the gripper changes the object it heads for at steps that are multiples of `exec_horizon` | A policy that decides again at every re-plan: each call to `generate_actions` starts from new noise and nothing forces the new chunk to make the same choice | Evaluate the same seeds with `--exec_horizon 15` and `--exec_horizon 4` with `--videos 20`. A longer execution horizon hides the symptom and does not remove the cause | [42](42-chunks-and-execution.md) |
| `open_loop_check` prints `samples: 0` and stops with a `TypeError` on a no-history (`*_reactive`) run | The shards store one past step and the script indexes their 16-row windows with `policy.past`; at 0 the mask test includes the past slot, which is never true, so every window is skipped | Use the check only when the policy's `lowdim_past_timesteps` equals the shards' `past_lowdim_steps` (1 here) | [42](42-chunks-and-execution.md), [43](43-imitation-learning.md), [91](91-loss-is-not-success.md), [94](94-debugging-flowchart.md) |

## 7. Imitation and demonstrations

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| Low loss and low open-loop error, low success | Both are measured on expert states with expert history. On `pick_cube` with 200 demonstrations (machine A) the pooled-CLIP policy reached loss 0.040 and 2/50, and `dp_vit` 0.091 and 15/50 | Rank checkpoints by closed-loop success only; evaluate from the first checkpoint | [01](01-setup-and-first-run.md), [43](43-imitation-learning.md), [91](91-loss-is-not-success.md) |
| Loss still falling, success at 0-1% | Most windows the loss averages are mid-motion ones that can be fitted without locating the object (their share of the loss was not measured) | Named-object rate and median miss printed by `eval.py` | [91](91-loss-is-not-success.md) |
| A complete reach-descend-close-lift at the wrong place | The motion is alike in every demonstration; the target is not | The grasp statistics `eval.py` prints from `GraspProbe` | [43](43-imitation-learning.md) |
| The gripper closes beside the object, the arm lifts empty and makes no second attempt | Only clean passes: with the default `--disturb_prob 0` no demonstration contains a miss followed by a correction | Watch the `rollout_*_fail.mp4` files; `GraspProbe` records only the first close, so its statistics cannot count retries. `collect.py --disturb_prob` records recoveries; the chapters report no run on such data | [02](02-how-we-got-here.md), [43](43-imitation-learning.md), [70](70-demonstrations.md) |
| The dataset over-represents easy layouts | The expert fails and the data hides it: failed episodes are dropped silently | `expert_success_rate` and `expert_attempted` in `meta/info.json` | [70](70-demonstrations.md) |
| Same seed, different trajectory | The layout depends only on the seed, but one `ScriptedExpert` generator runs on across the episodes of a worker, so speed, heights and placement noise depend on the number of workers (`PICKUP_WORKERS`) and on the collection rounds | Do not expect the same trajectories from the same seeds with another worker count | [70](70-demonstrations.md) |
| The first step of an episode differs between training and serving (policies with history only) | In a window that starts at the first frame the previous-action slot is a copy of the expert's first command (`padding_strategy: copy`); the client sends the command held after reset | Evaluate with `--first_prev_action expert` against the default `hold`. The chapters call this not measured; the lab notebook has since recorded it for a history policy (2.5M samples, EMA, 100 layouts each): 1/100 as served and 22/100 with the expert's first command. `collect.py --hold_steps 1` begins every demonstration with a frame at rest | [91](91-loss-is-not-success.md), [93](93-train-inference-skew.md) |

## 8. Conditioning and VLA backbones

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| Low loss, a complete grasp motion, an empty gripper; the named-object rate is at chance | One suspect is conditioning that does not carry position: both VLA recipes hand the action head one vector, `[B, 1, hidden_dim * num_vlm_layers_to_use]`, however many image tokens the VLM read. The chapters do not isolate it: patch-token policies were also at chance at 1M samples | Print `get_action_conditioning(...).embeddings.shape[1]`. Read the named-object rate and median miss from `eval.py`, and the grasp map. Evaluate on training layouts (`--seed_start 0`): near zero there too means the failure is not one of generalisation. `conditioning: all_tokens` is the candidate; its effect is not measured | [03](03-the-landscape.md), [21](21-pooled-vs-patch-tokens.md), [50](50-what-the-action-head-sees.md), [60](60-anatomy-of-a-vla.md) |
| A comparison comes out equal | Neither side can do the task: pretrained VLM 0/100, random-init VLM 1/100, both at chance on the named object | Named-object rate of both; fix the shared bottleneck, then compare again | [00](00-the-route.md) |
| Out of memory in the first steps with a pretrained VLM | `num_trainable_vlm_layers` is not set, so the whole VLM is trained; weights, gradients and optimiser state are held for every trainable parameter | `main.py` prints `Total parameters` and `Trainable parameters` at start-up. `vla_qwen.yaml` sets 4 layers, which with the action head is 306M of 2.2B parameters | [03](03-the-landscape.md), [61](61-pretrained-backbones.md) |
| No training step completes; the log repeats `Handling webdataset error (ValueError(...))` | Every batch fails in the processor: the preset's `size: {height, width}` is not what the Qwen processor accepts, and the data pipeline logs the exception and skips the batch | Override `processor_kwargs.size` as `vla_qwen.yaml` does | [61](61-pretrained-backbones.md) |
| No error. The number of tokens per image changes | Another render resolution or other size bounds; `img_num_tokens` records the count and does not set it | Print the `h` and `w` columns of `image_grid_thw` for one batch; tokens per image are `h x w / 4` | [61](61-pretrained-backbones.md) |

## 9. Training runs and operations

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| A run sits at 0% GPU, the log stops, the monitor says `stalled` | A dead data-loader worker leaves the trainer waiting forever | Use `train_resilient.sh`, which kills and resumes a run whose log has not moved for 420 seconds; restarts are listed in `<run>.retries.log` | [01](01-setup-and-first-run.md), [13](13-training-a-language-model.md), [61](61-pretrained-backbones.md), [80](80-the-training-loop.md), [81](81-surviving-long-runs.md) |
| A run dies without a traceback | A small shared-memory mount (`/dev/shm`), common in containers: up to `num_workers x prefetch_factor` batches wait there | `df -h /dev/shm`; lower `data.num_workers` and `data.prefetch_factor` | [01](01-setup-and-first-run.md), [61](61-pretrained-backbones.md), [81](81-surviving-long-runs.md) |
| A dataset disappears | `make_dataset.sh` starts with `rm -rf` on `data/lerobot/<name>` and `data/preprocessed/<name>` | Use a new name for a new dataset | [01](01-setup-and-first-run.md) |
| A new run's log starts with a `Samples:` count above 0 | `train_resilient.sh` resumes from any `checkpoint_*.pt` in the run's `checkpoints` directory | That directory should not exist before a new run; use a new run name | [01](01-setup-and-first-run.md) |
| More or fewer checkpoint files than requested | Expected: intervals are rounded to whole shards and batches | `grep "Samples in this checkpoint"` in the train log | [80](80-the-training-loop.md) |
| `ValueError: Zero batches` | An interval holds fewer samples than `global_batch_size x num_workers` (512 here), as in a very small smoke test | Give every interval at least that many samples | [80](80-the-training-loop.md) |
| The job ends with the ssh connection | Background: the kernel sends SIGHUP when the terminal closes | Start with `nohup` and `setsid` and redirect input and output, or use `tmux` | [81](81-surviving-long-runs.md) |
| A running evaluation fails with a syntax error halfway through | A script edited while it runs: Bash reads scripts as it goes | Run long jobs from a checkout you are not editing | [81](81-surviving-long-runs.md) |
| An installed dependency differs from the lockfile | Lockfile drift: `uv pip install -e .` after `uv sync` replaced the locked `draccus` 0.11.5 with 0.11.6 | Compare `uv pip show draccus` with `uv.lock`; run `uv sync` again and nothing after it | [81](81-surviving-long-runs.md) |
| Checkpoints and log of a run are overwritten | Two trainers, one directory: `main.py` takes no lock, and an orphaned trainer can survive its wrapper (read from the code, not observed) | `pgrep -af "main.py.*--name <name>"` must print nothing before a run is started | [81](81-surviving-long-runs.md) |
| An evaluation's processes appear on a GPU other than `PICKUP_GPU` | `MUJOCO_EGL_DEVICE_ID` was set by hand, and EGL's device order is not `nvidia-smi`'s | Unset it | [01](01-setup-and-first-run.md) |

## 10. Evaluation and diagnostics

| Symptom | Cause | Check, then do | Chapters |
|---|---|---|---|
| Two evaluations of one run disagree | One served raw weights, the other EMA: `eval.sh` without `PICKUP_WEIGHTS` serves the EMA weights of a run trained with EMA. One checkpoint here scored 4% raw and 36% EMA | `server` in `results.json` names the file served; set `PICKUP_WEIGHTS=raw` or `ema` | [00](00-the-route.md), [80](80-the-training-loop.md), [90](90-closed-loop-evaluation.md) |
| `policy server exited before it was ready` with `Address already in use`; `eval.py` stops because the server "is serving" another checkpoint; or results filed under the wrong run | Two evaluations share a port and both reach whichever server bound it first | Leave `PICKUP_PORT` unset; check `server.checkpoint` in `results.json`. `summarize.py` leaves out results whose recorded checkpoint does not match their directory | [01](01-setup-and-first-run.md), [90](90-closed-loop-evaluation.md) |
| The evaluation stops before the first episode | The policy server exited first (bad checkpoint, port taken) | `eval.sh` prints the last five lines of `policy_server.log` | [90](90-closed-loop-evaluation.md) |
| The best checkpoint looks better than a re-run of it | The maximum of noisy readings is biased upward: `summarize.py --best` takes it over all evaluations of a run | Re-evaluate the chosen checkpoint on fresh layouts (`--seed_start 1000100`) and report that number | [90](90-closed-loop-evaluation.md) |
| A success rate measured on training layouts | Seeds below 1,000,000: `--seed_start 0` evaluates on layouts that have demonstrations | Use it as a deliberate check, not as a generalisation number | [90](90-closed-loop-evaluation.md) |
| Nothing is evaluated on macOS | `eval_checkpoints.sh` calls `stat -c %Y`, the GNU form, and skips every checkpoint | Run it on Linux | [90](90-closed-loop-evaluation.md) |
| Two `results.json` files are not comparable | Changed settings: `--max_steps`, `--exec_horizon`, `--flow_steps` and the intervention flags change the test; all but `--max_steps` are stored | Check the stored settings before comparing | [90](90-closed-loop-evaluation.md) |
| A named-object rate of 38% read as "better than chance" | The Wilson 95% interval for 38 of 100 is about 29% to 48% and contains the 33% of chance (arithmetic) | More episodes; a no-language control | [92](92-measuring-failure.md) |
| The named-object rate is high and success is low | Nearest is not near | Read `median_xy_err_when_at_target_mm`, the `within_*` rates and the grasp map | [92](92-measuring-failure.md) |
| Good numbers at the close, nothing lifted | The probe sees one instant, before the fingers move; a slip in the lift is not recorded | Read `close_z_above_grasp`, `close_yaw_err_target` and the `rollout_*_fail.mp4` files | [92](92-measuring-failure.md) |
| The grasp map and `results.json` disagree on the named-object rate | The map counts over episodes with a close; `summarize` divides by all episodes | Read `closed_gripper_rate` first | [92](92-measuring-failure.md) |
| The flowchart ends at a different leaf for another checkpoint or the other set of weights | The diagnosis depends on the checkpoint and on raw against EMA weights | `eval_checkpoints.sh` evaluates every checkpoint, raw and EMA | [94](94-debugging-flowchart.md) |
| The height reading is off while the policy goes to other objects | `close_z_above_grasp` is measured against the named object, and object heights differ | Read the height on episodes where `close_nearest` equals `target` | [94](94-debugging-flowchart.md) |

## 11. What is still hard

Chapter [02](02-how-we-got-here.md) uses its failure section for the open problems of the field,
as they show up in this repository.

| Problem | What you see | Check | Chapters |
|---|---|---|---|
| Precision | A policy reaches for the right object and closes the gripper beside it. Tolerance depends on the object and on the machine | The grasp-tolerance tables, before blaming the model | [02](02-how-we-got-here.md), [92](92-measuring-failure.md) |
| Data | Robot actions are not on the internet: each demonstration has to be executed, teleoperated or scripted | The cost of collection for the task | [02](02-how-we-got-here.md), [70](70-demonstrations.md) |
| Evaluation | A policy's loss does not predict its success; only closed-loop rollouts count, and they are noisy | The confidence interval of every rate | [02](02-how-we-got-here.md), [90](90-closed-loop-evaluation.md), [91](91-loss-is-not-success.md) |
| Recovery | A policy that misses carries on with the motion | Rollout videos, for a second attempt after an empty close | [02](02-how-we-got-here.md), [43](43-imitation-learning.md) |
