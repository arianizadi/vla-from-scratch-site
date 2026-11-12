---
title: The Training Loop
part: 8 Training
order: 80
summary: Follow a run from its config to its checkpoint files, read its log line, and choose which saved weights to evaluate.
status: draft
---

# The Training Loop

The training loop is the program that turns shards (tar files of training samples) into checkpoint
files (saved weights): it loads a config, streams batches, takes optimiser steps and saves at
intervals. Every model in this repository, from the language model to the robot policy, is trained
by this one loop, and a policy's closed-loop success depends on choices made inside it: how many
samples, which learning rate, and which of the two saved sets of weights is evaluated.

## The idea

A run is defined by a budget counted in **samples**. A sample is one training example: for a policy,
one window cut from a demonstration ([70-demonstrations.md](70-demonstrations.md)). Steps, epochs
and checkpoints are derived from that number.

Worked example, used throughout: `dp_vit_lang_reactive` on the 1500 `pick_target` demonstrations,
`total_train_samples = 1_000_000`, batch 64. That is 1,000,000 // 64 = 15,625 **steps** (one
optimiser update on one batch each) and 1,000,000 / 98,841 windows = 10.1 **epochs** (passes over
the dataset). With 6 checkpoints, a **checkpoint interval**, the slice of the budget after which
the state is saved, is 1,000,000 // 6 = 166,666 samples.

## How it works

### 1. The config

`main()` in [`vla_foundry/main.py`](../../vla_foundry/main.py) starts with
`draccus.parse(config_class=TrainExperimentParams)`. draccus is a library that fills a Python
dataclass from a YAML file and from command-line arguments. Three layers decide each value, later
ones winning: the dataclass defaults; the YAML file given as `--config_path`, which can include
**presets** (YAML fragments under `vla_foundry/config_presets/`) with `<<: !include <path>`; and
command-line arguments in dotted form, such as `--hparams.lr 1e-4`.

For the example, `hparams.lr` is 1e-4 in `HyperParams` and 5e-4 in the included preset
`config_presets/hparams/diffusion_policy.yaml`. The budget is in no YAML file:
[`sim/pickup/scripts/train.sh`](../../sim/pickup/scripts/train.sh) passes `--total_train_samples`
and `--num_checkpoints` (6 unless `PICKUP_NUM_CHECKPOINTS` is set).

`main()` writes the resolved config to `config.yaml` in the run directory; the policy server (the
process that loads a checkpoint and answers the simulator's requests for actions,
[90-closed-loop-evaluation.md](90-closed-loop-evaluation.md)) later rebuilds the model from that
file.

### 2. Data: shards, workers, prefetch

A **shard** is a tar file of samples, read as a stream by the WebDataset library; here 256 windows
per shard (`--samples_per_shard 256` in `make_dataset.sh`). `manifest.jsonl` lists the shards and
their sample counts.

For each checkpoint interval, `get_datastring_input` in
[`vla_foundry/data/dataloader.py`](../../vla_foundry/data/dataloader.py) takes shards from the
manifest, in a seeded shuffled order, until they hold at least `samples_per_checkpoint` samples
and number at least 8, one per worker. When the manifest runs out it reshuffles and continues
(`allow_multiple_epochs`). One branch overshoots: if the manifest ends before 8 shards have been
collected and less than one pass over the data is still needed, the code appends a whole
reshuffled pass (387 shards here) before counting again, so an interval that starts within 8
shards of the end of the manifest can hold about one pass more than was asked for. The list is
then trimmed to a multiple of the worker count, giving every worker the same number of shards.

`get_wds_dataloader` wraps the pipeline in a `wds.WebLoader` with `data.num_workers` worker
processes (8 in the `dp_vit*` configs). In `RoboticsPipeline.create_pipeline` each worker gets its
share of the shards, decodes the JPEGs, forms batches of 64 (`wds.batched(..., partial=False)`, so
it drops its last incomplete batch) and runs `RoboticsProcessor`. `data.prefetch_factor` (4) is
the number of batches each worker keeps ready, 32 in all.

### 3. Checkpoint intervals

`main()` computes `total_steps = total_train_samples // global_batch_size` and loops: select
shards, build a loader, `train_one_checkpoint`, `save_checkpoint`. `train_one_checkpoint` returns
when its loader is exhausted or when `step` reaches `total_steps`.

An interval therefore ends when its shards end, not after exactly 166,666 samples. Arithmetic on
the code for the example, taking the 98,841 windows as 386 shards of 256 and one of 25: the shards
needed for 166,666 samples are trimmed to 648, which hold at most 165,888 samples, 2,592 steps, so
six intervals cover at most 15,552 of the 15,625 steps. The loop then opens a seventh interval for
the remaining steps and saves again: the run ends with `checkpoint_7.pt`. With coarser shards the
shortfall is larger: by the same arithmetic the language-model stage, which asks for 4, writes at
least 6 ([13-training-a-language-model.md](13-training-a-language-model.md)). The overshoot of
section 2 works the other way: the run in Check yourself 1 asks for 6 and writes 5. The
highest-numbered checkpoint is the final one.

### 4. One step

<!-- interactive: training-step -->
*Figure: one optimisation step. A batch goes through the model, the loss compares prediction and
target, the backward pass gives a gradient for every weight, and the optimiser moves the weights.*

One iteration of the loop in `train_one_checkpoint`
([`vla_foundry/train.py`](../../vla_foundry/train.py)):

1. `scheduler(step)` sets the learning rate for this step.
2. `next(data_iterator)` fetches a batch. The wait is recorded as `data_time`.
3. The batch handler builds inputs and targets. For a policy, `DiffusionPolicyBatchHandler` draws
   noise shaped like the actions, `[64, 15, 8]` in the example, and the target is
   `noise - actions` ([41-flow-matching.md](41-flow-matching.md)).
4. Forward pass and loss run inside `autocast()`, which `get_autocast` sets to
   `dtype=torch.bfloat16` for `precision: amp_bf16`: operations run in bf16, a 16-bit float with
   float32's exponent range and 8 significant bits. **Mixed precision** means doing most of the
   arithmetic in a 16-bit format and keeping float32 where rounding would hurt. Background
   (Micikevicius et al.): the original recipe keeps a float32 copy of the weights, so that updates
   much smaller than a weight are not rounded away, and scales the loss so that small float16
   gradients do not underflow. bf16 keeps float32's exponent range, which removes that underflow,
   and `train.py` uses no scaling. This repository drops the float32 copy too:
   `get_model_precision` returns bf16 here, so a single-process run stores the weights in bf16. By
   arithmetic on the format, not measured here: a change smaller than roughly 0.2 to 0.4% of a
   weight's magnitude leaves it unchanged.
5. `local_loss.backward()`. With gradient accumulation, steps 4 and 5 repeat `accum_freq` times on
   slices of the batch; in the pickup configs `accum_freq` is 1.
6. `clip_grad_norm_(model.parameters(), grad_clip_norm)`: if the L2 norm of the whole gradient
   (all parameters taken as one vector) exceeds `grad_clip_norm` (1.0 in the preset, off by
   default) the gradient is scaled down to that norm.
7. `optimizer.step()`. `create_optimizer` builds AdamW: an optimiser that keeps a running average
   of each weight's gradient and of its square (the two betas, 0.9 and 0.95, set how long those
   averages remember) and divides the first by the square root of the second, so every weight
   takes steps of about the learning rate. Weight decay (0.01) is a further shrink of each weight
   by `lr x 0.01` of its value per step, which by the arithmetic of step 4 is too small to change
   a bf16 weight; parameters whose name ends in `.bias` or contains `norm` are exempt.
   Background: because AdamW normalises the step size, what the clipping of step 6 limits is how
   far one outlier batch distorts those two averages, which the next steps inherit (about 20 at
   beta2 = 0.95).
8. `ema_model.step(...)` if the averaged copy of section 6 is enabled, then `step += 1` and a log
   line every `log_every_n_steps` (20) iterations.

### 5. The learning-rate schedule

`create_scheduler` in [`vla_foundry/scheduler.py`](../../vla_foundry/scheduler.py) returns a
function of the step number; it holds no state. The default `lr_scheduler: cosine` is a linear
warm-up (the rate rises from near zero to its base value over the first `warmup` steps) followed
by a cosine decay to a minimum. Background: the warm-up exists because at the start AdamW's running
statistics rest on very few batches and the weights are still random, so full-size steps are
unreliable; the decay lets the weights settle late in training instead of bouncing around a
minimum. With $s$ the step, $w$ the warm-up length and $T$ the total steps:

$$\text{lr}(s) = \begin{cases} \text{lr}_\text{base}\,\dfrac{s+1}{w} & s < w \\[2mm] \text{lr}_\text{min} + \tfrac12\left(1+\cos\dfrac{\pi (s-w)}{T-w}\right)(\text{lr}_\text{base}-\text{lr}_\text{min}) & s \ge w \end{cases}$$

For the example, `lr` = 5e-4, `lr_cooldown_end` = 1e-5 (the minimum), `warmup` = 1000 steps (the
default) and $T$ = 15,625: the rate is 5e-7 at step 0, 5e-4 at step 999, 2.55e-4 at step 8,312
(halfway through the decay) and 1e-5 at step 15,624.

### 6. EMA weights

An **exponential moving average (EMA)** of the weights is a second copy of the model that is never
trained directly. After every optimiser step each of its weights moves a small fraction toward the
trained weight:

$$\theta_\text{ema} \leftarrow d\,\theta_\text{ema} + (1-d)\,\theta$$

The trained ("raw") weights are pushed around by the noise of each batch; the average smooths that
noise out. Background: evaluating the averaged weights is common practice for diffusion models,
and the Diffusion Policy code (Chi et al.) does so. An EMA with decay $d$ gives the weights from
$k$ steps ago a share $(1-d)\,d^k$, so it averages over about $1/(1-d)$ recent steps.

`EMAModel` in [`vla_foundry/models/ema.py`](../../vla_foundry/models/ema.py) (the default
`ema.type`; `vanilla` uses a fixed `alpha`) raises the decay $d$ as training proceeds:
`get_decay` returns $1 - (1 + n/\texttt{inv\_gamma})^{-\texttt{power}}$, capped at `max_value`,
where $n$ is
`optimization_step - update_after_step - 1`; the first two calls return 0, which copies the model.
With the defaults (`inv_gamma` 1, `power` 0.75, `max_value` 0.9999, `update_after_step` 0):

| $n$ (updates after the two copies) | Decay $d$ | $1/(1-d)$ |
|---|---|---|
| 1 | 0.405 | about 2 steps |
| 1,000 | 0.9944 | about 180 steps |
| 15,623 (last update of the example) | 0.99928 | about 1,400 steps, 90,000 samples |

Early on the average follows the model closely. With a fixed decay of 0.9999 instead, the random
initial weights would still carry 0.9999^15,625 = 21% of the average at the end of the example.
Frozen parameters (those with `requires_grad` false, which the optimiser never changes) are
copied, not averaged.

`main()` keeps the EMA copy in float32. Its comment gives the reason: a decay such as 0.9999
rounds to 1.0 in bf16, which would stop every update.

## In this repository

The loop is `main` in `vla_foundry/main.py`; its config classes are in `vla_foundry/params/`
(`hyper_params.py` for `hparams.*`, `ema_params.py` for `ema.*`). Train with EMA and list what was
written:

```bash
sim/pickup/scripts/train.sh dp_vit_lang_reactive pick_target_1500 my_run 1000000 --ema.enabled True
ls experiments/pickup/my_run experiments/pickup/my_run/checkpoints
```

**Files.** Per interval, `save_checkpoint`
([`vla_foundry/file_utils.py`](../../vla_foundry/file_utils.py)) writes into `checkpoints/`
`checkpoint_N.pt` (the raw weights, `global_step`, `samples_seen`, the shard cursor and shuffle
seed), `optimizer_N.pt` (the AdamW state) and, with `ema.enabled`, `ema_N.pt` (the averaged
weights and their update count).

**Choosing weights.** `sim/pickup/policy_server.py` takes `--weights auto|ema|raw`. In
`Policy.__init__`, `auto` serves the EMA file when the run's `config.yaml` has `ema.enabled`,
otherwise the raw one. `eval.sh` passes `--weights` only when `PICKUP_WEIGHTS` is set, so the
default for an EMA run is EMA. To evaluate the raw weights:

```bash
PICKUP_WEIGHTS=raw PICKUP_OUT=results/pickup/my_run/pick_target/final_raw \
  sim/pickup/scripts/eval.sh experiments/pickup/my_run pick_target 100
```

Repeat with `ema` and `final_ema`; without `PICKUP_OUT` both write to the same directory.
`eval_checkpoints.sh` does this for every checkpoint, into `ckpt_<N>_raw` and `ckpt_<N>_ema`.

**The log line.** `train.sh` sends the trainer's output to
`experiments/pickup/<run>.train.log`. Every 20 steps `Metrics.update_and_log_state`
([`vla_foundry/meters.py`](../../vla_foundry/meters.py)) writes:

```text
Train Checkpoint: <interval> [<samples so far>/<estimated samples in interval> (<%>)] Loss: <mean> Data (t): <s> Batch (t): <s>, <samples/s>/s, <samples/s>/s/gpu LR: <rate>
```

`Loss`, `Data (t)` and `Batch (t)` are means over the steps since the previous line; `Data (t)` is
the wait for a batch and `Batch (t)` the whole iteration, waiting included. The samples-per-second
figure uses the last step alone, so it jitters. The loss is that of the raw weights; the EMA copy
is never run during training.

[`sim/pickup/runstate.py`](../../sim/pickup/runstate.py), which feeds the dashboard, parses this
file with three patterns: `PROGRESS` for the line above, `SAMPLES` for the
`Samples: <seen> / <total>` line `main()` logs per interval, and `FINISHED` for the end-of-run
string. A change to the format string in `meters.py` has to be matched in `PROGRESS`.

**Resuming.** Re-run the same command with `--model.resume_from_checkpoint
<path>/checkpoint_N.pt`. `train.sh` overwrites `<run>.train.log`; to keep the earlier loss curve,
first rename the log to `<run>.train.log.part1`, which `Run.__init__` in `runstate.py` reads
before the live log. `main()` restores the weights, step and shard position, the optimiser and
the EMA copy from the three files. The schedule is a function of the step and of
`total_train_samples`, so a resumed run with a different budget continues at a different learning
rate. At most one interval of work is lost. `train_resilient.sh` does all of this, the renaming
included ([81-surviving-long-runs.md](81-surviving-long-runs.md)).

## What we measured

Throughput in samples per second, from the lab notebook:

| Model | Machine A (RTX 4090) | Machine B (L40S) |
|---|---|---|
| `dp_vit` / `dp_vit_lang` (4 images) | about 620 | about 540 |
| `dp_vit_reactive` / `dp_vit_lang_reactive` (2 images) | not run | about 1100 |
| `vla_custom` (130M) | 165 | not yet run |
| `vla_qwen` (2.2B, 306M trainable, batch 16) | 49 | 45-48 |
| Language model stage (91M, batch 32, 256 tokens) | 550 | 520-545 |

What limits a run is in its log line. If `Data (t)` is close to zero, the model sets the pace and
more workers change nothing; if it is a large part of `Batch (t)`, the trainer is waiting for the
CPU side. The notebook records one CPU-side limit: twelve policy servers without a thread cap
roughly halved training throughput (for example 1069 -> 410 samples/s). It does not record
`Data (t)`, so which side limits each row above is not established here.

The reactive configs feed two images instead of four, which halves the patch tokens (2 x 196
against 4 x 196) but not the decoding: the shards hold four JPEGs per window,
`Augmentations.decode_and_augment_sample` decodes all of them, and `image_indices: [0]` only
selects which ones `RoboticsProcessor.process_inputs` keeps. The measured rate about doubled.

Raw against EMA weights, same checkpoint, 100 unseen layouts each (machine B):

| Run | Samples | Success, raw / EMA |
|---|---|---|
| `dp_vit_lang_reactive`, 1500 demos | 1.0M | 3% / 5% |
| `dp_vit_lang_reactive`, 500 layouts each demonstrated with all 3 objects named, windows of frames 0-7 repeated 5 extra times | 1.0M | 8% / 15% |
| `dp_vit_lang_reactive`, 4000 demos | 0.5M | 0% / 0% |
| | 1.0M | 0% / 1% |
| | 1.5M | 4% / 2% |
| | 2.0M | 4% / 36% |

At 2.0M samples both kinds of weights close the gripper nearest the named object (95% / 98%), but
the median miss is 32 mm raw and 18 mm EMA. In the notebook's grasp tolerance table (machine B)
expert success over all objects falls from 91% at a 15 mm offset to 32% at 30 mm, so that
difference can decide a grasp, though this compares two tables and is not a causal test.

What this does not show: it is one run with one seed, still training toward 5M samples. In the
other rows the two kinds of weights differ by 0 to 7 points on 100 episodes each, and the notebook
treats differences of a few percent between single runs as noise. At 1.5M the raw weights were
ahead on the named-object rate (61% / 49%). The supported conclusion: the two files can differ a
lot, so evaluate both.

## Where it goes wrong

- **More or fewer checkpoint files than requested.** Expected, see sections 2 and 3.
  `grep "Samples in this checkpoint" experiments/pickup/<run>.train.log` prints the samples
  selected for each interval.
- **Two evaluations of one run disagree.** One served raw weights, the other EMA. `results.json`
  records the served file under `server`; set `PICKUP_WEIGHTS` explicitly.
- **The log stops and GPU use is 0%.** A data-loader worker died and the trainer waits for it
  forever (lab notebook). `train_resilient.sh` kills and resumes a run whose log has not moved for
  420 seconds.
- **`ValueError: Zero batches`.** An interval holds fewer samples than
  `global_batch_size x num_workers` (512 here), as in a very small smoke test.

## Background and further reading

- Loshchilov and Hutter, "Decoupled Weight Decay Regularization", 2017,
  [arXiv:1711.05101](https://arxiv.org/abs/1711.05101). Showed that L2 regularisation and weight
  decay differ under Adam and applied the decay to the weights directly (AdamW), the optimiser
  used here.
- Loshchilov and Hutter, "SGDR: Stochastic Gradient Descent with Warm Restarts", 2016,
  [arXiv:1608.03983](https://arxiv.org/abs/1608.03983). Introduced cosine annealing of the
  learning rate, there with restarts, here as a single decay.
- Pascanu, Mikolov and Bengio, "On the difficulty of training Recurrent Neural Networks", 2012,
  [arXiv:1211.5063](https://arxiv.org/abs/1211.5063). Analysed exploding and vanishing gradients
  in recurrent networks and proposed rescaling the gradient when its norm exceeds a threshold.
- Micikevicius et al., "Mixed Precision Training", 2017,
  [arXiv:1710.03740](https://arxiv.org/abs/1710.03740). Half-precision training with a float32
  copy of the weights and loss scaling.
- Polyak and Juditsky, "Acceleration of Stochastic Approximation by Averaging", 1992,
  [doi:10.1137/0330046](https://doi.org/10.1137/0330046). Showed that the plain average of a
  stochastic optimiser's iterates converges at the best possible rate; an EMA is the exponentially
  weighted variant.
- Chi et al., "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion", 2023,
  [arXiv:2303.04137](https://arxiv.org/abs/2303.04137). Its public code has an `EMAModel` with
  the same warm-up formula as `get_decay` here.
- [WebDataset](https://github.com/webdataset/webdataset): datasets as tar shards read
  sequentially. [draccus](https://github.com/marin-community/draccus): dataclasses filled from
  YAML and the command line, the command line taking priority.

## Check yourself

1. For 300,000 samples at batch 64 and 6 checkpoints, compute `total_steps` and
   `samples_per_checkpoint`. Train, then count the files:

   ```bash
   sim/pickup/scripts/train.sh dp_vit_lang_reactive pick_target_1500 loop_test 300000 --ema.enabled True
   ls experiments/pickup/loop_test/checkpoints/checkpoint_*.pt | wc -l
   grep "Samples in this checkpoint" experiments/pickup/loop_test.train.log
   ```

   By arithmetic on the code for the 387-shard manifest, expect 5 files, not 6: intervals 0 and 1
   keep 192 shards each, leaving the cursor at shard 384 of 387, and each later interval gets a
   whole extra pass (about 98,000 to 100,000 samples).

2. From the same log, read `Data (t)` and `Batch (t)` and say which side limits the run. Skip the
   first line of each interval, when new workers start.

   ```bash
   grep "Train Checkpoint" experiments/pickup/loop_test.train.log | head -5
   ```

3. Compute the EMA decay at the end of that run (4,687 updates, so $n$ = 4,685) and the number of
   steps it averages over:

   ```bash
   python3 -c "n=4685; d=1-(1+n)**-0.75; print(d, 1/(1-d))"
   ```
