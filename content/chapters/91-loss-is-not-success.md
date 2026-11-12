---
title: Loss Is Not Success
part: 9 Evaluation and debugging
order: 91
summary: Explain why a low training loss can come with a 0% success rate and why the open-loop action error does not separate a 1% policy from a 74% one, use the open-loop check for the one thing it can show, and evaluate closed-loop from the first checkpoint.
status: draft
---

# Loss Is Not Success

Training a policy produces a loss curve, and one more script gives an open-loop error: the
distance between predicted and recorded actions. Neither says whether the robot picks up the
object. In this repository a policy with a final training loss of about 0.03, as low as any
recorded on `pick_target`, succeeded in 0 of 100 episodes, so a robot policy needs a third number,
measured by running it.

## The idea

A **window** is one training sample: the observation at one recorded step of a demonstration and
the expert's next 15 actions, called a **chunk**. Three numbers can be computed for a policy.

| Number | Input the policy gets | Compared with |
|---|---|---|
| **Training loss** | a recorded window, with the expert's actions blended with random noise at a random strength ([Flow matching](41-flow-matching.md)) | the direction from the expert's actions to the noise |
| **Open-loop error** | a recorded window | the expert's recorded actions |
| **Closed-loop success** | what the simulator shows after the policy's own earlier actions | the task's success test |

**Open-loop** means the predictions are never executed: every input comes from a recording in
which the expert was in control. **Closed-loop** means the policy's actions move the arm and the
next observation is the result ([Closed-loop evaluation](90-closed-loop-evaluation.md)).

Three mechanisms explain why the first two numbers do not predict the third. The third is
established background. The first two are reasoning from the expert's code; the measurements
below are consistent with them and do not isolate them.

1. **Most windows are easy.** Both numbers average over windows. Once the arm is moving, the
   previous action and the arm's own motion say what comes next: the object need not be found.
2. **The windows that decide the episode are few.** Where to go is decided at the start.
3. **Errors compound when actions are executed** (background: Ross, 2010). A recorded window
   starts from a state the expert produced; a step of a rollout (one episode run with the policy
   in control) starts from a state the policy produced
   ([Imitation learning](43-imitation-learning.md)).

The lab notebook lists 1500 `pick_target` demonstrations cut into 98,841 windows, 65.9 per
demonstration, one per recorded step. Three policies that failed on this task closed the gripper
around step 34-44, as the expert does. Take a 66-step demonstration:

| Frames | What the arm is doing | What predicts the next actions |
|---|---|---|
| 0 | at the reset pose | only the cameras, and the instruction if the policy has one |
| 1 to about 35 | travelling to the object and descending | the previous action and the joint state: the gripper travels in a straight line from a nearly fixed reset pose, so its position gives the line, and the approach ends 10-14 cm above the grasp point (`ScriptedExpert._plan`), which roughly fixes where the chunk stops |
| the close, once | fingers shut | the arm having stopped at grasp height |
| the rest | lifting | the previous action: a vertical move of 18-24 cm from where the gripper closed |

One window in 66 is 1.5% of the data. The first eight frames, 8 / 66 = 12%, are covered by the
first executed chunk: the policy predicts 15 actions per call and 8 are executed before it is
asked again ([Chunks and execution](42-chunks-and-execution.md)). How much of the loss each row
contributes was not measured.

## How it works

### What the loss averages

For `dp_vit` a batch is 64 windows (`per_gpu_batch_size: 64` in
[`sim/pickup/configs/dp_vit.yaml`](../../sim/pickup/configs/dp_vit.yaml)) and the action tensor is
`[64, 16, 8]`: one past step, the current step and 14 future steps of 8 numbers.
`DiffusionPolicyBatchHandler.prepare_inputs_and_targets` (`vla_foundry/models/batch_handlers.py`)
sets the target to `noise - actions`. `DiffusionPolicy.forward`
(`vla_foundry/models/diffusion_policy/diffusion_policy.py`) draws one noise level per window and
blends every slot where `future_mask` is true toward the noise by that amount. `masked_mse_loss`
(`vla_foundry/losses.py`) averages the squared error over the same slots, at most
64 x 15 x 8 = 7,680 numbers per batch.

- **Every unmasked action slot has the same weight.** `F.mse_loss(..., weight=mask)` divides the
  summed squared error by the number of unmasked values in the batch. A window whose 15 future
  slots are all real, the frame-0 window included, contributes 15 x 8 values; one in the last 14
  frames of a demonstration contributes fewer (`create_past_and_future_masks`). A batch of 64
  holds on average 64 / 65.9 = 0.97 frame-0 windows.
- **It has no physical unit and no common zero.** The target is in normalised action units when a
  normaliser is configured (`Policy.infer` denormalises the output), so a loss of 0.058 cannot be
  converted to millimetres at the gripper. Background, not measured here: squared error is
  minimised by the mean, so the best possible prediction is the average of `noise - actions` over
  everything consistent with the inputs, and what the inputs do not determine stays in the loss
  as a floor above zero. `dp_vit` has no instruction input, so on `pick_target` its frame-0
  inputs do not say which of three objects the expert went to. The floor differs between tasks
  and between models with different inputs: 0.058 on `pick_cube` and 0.069 on `pick_target` are
  not on one scale.

### Why most windows are easy

`ScriptedExpert.act` ([`sim/pickup/expert.py`](../../sim/pickup/expert.py)) moves its set-point
(the x, y, z position it wants the gripper at) by at most `speed * dt` per step,
0.40 x 1.2 m/s x 0.05 s = 2.4 cm for the fastest waypoint, and converts it to joint angles by
inverse kinematics (finding joint angles that place the gripper at a given position), starting
from its previous joint command `self.q_cmd`. Consecutive actions therefore differ by one small
step. The gripper command in the waypoint list is 1, 1, 0, 0: it changes once per episode.
Background: predicting the next action from the previous one instead of from the scene is the
copycat problem (Wen, 2020).

At frame 0 none of this helps: `PickupEnv.reset` sets `last_action` to the reset joint targets
with the gripper open, which say nothing about the objects. From frame 1 on, a policy with
history (frames t-1 and t, states t-1 and t, and the previous action as inputs) receives the
expert's previous command and two joint states whose difference is the direction of travel. A
policy without history (one frame, the current state, no previous action; the `_reactive`
configs) still receives the joint state of an arm that has already moved toward its target.

<!-- interactive: copycat -->
*Figure: one joint target and the gripper command of a recorded demonstration against the step
number, each with a second line that repeats the previous step's action. The joint line and its
copy differ by one expert step (at most 2.4 cm of gripper travel) while the arm moves; the
gripper lines differ at one step, the close. At step 0 the shards hold no real previous action
(the slot is a copy of step 0): the direction of the first chunk has to come from the cameras.*

### What running the policy adds

In [`sim/pickup/eval.py`](../../sim/pickup/eval.py) the policy is asked for a chunk only when its
action queue is empty, and `--exec_horizon` (default 8) actions of each chunk are executed.
Inference therefore happens at steps 0, 8, 16, 24, 32 and possibly 40 before a close around step
34-44: five or six decisions, the first from the reset pose. The expert moves the gripper 30 cm
during the first 15-step chunk (lab notebook). A first chunk aimed at the wrong place carries
the arm off the demonstrated path for eight steps, and the second decision starts from a state
no demonstration contains, which the loss and the open-loop error never see.

## In this repository

**The open-loop check.** [`sim/pickup/open_loop_check.py`](../../sim/pickup/open_loop_check.py)
does the following.

1. Builds `Policy(args.checkpoint_dir, None, "cuda")`, the class the policy server uses
   (`sim/pickup/policy_server.py`): the newest checkpoint, with the averaged weights (EMA, an
   exponential moving average of the weights over training steps) if the run was trained with
   them.
2. Reads windows in stored order from every `len(paths) // 8`-th `shard_*.tar` until `--samples`
   (default 64) have been read. `make_dataset.sh` writes 256 shuffled windows per shard, so the
   default reads the first shard only.
3. Skips a window unless all 15 future slots and the past slot are real data: a 66-step
   demonstration contributes frames 1 to 51. `samples:` prints how many remained.
4. Calls `policy.infer` with the recorded images, states, instruction and previous action, and
   prints three lines of mean absolute error (`q1` to `q7` in radians, `grip` in command units):
   the predicted chunk against the expert's, the first predicted action against the expert's,
   and a baseline that repeats the previous action for the whole chunk.

```bash
.venv/bin/python -m sim.pickup.open_loop_check \
    --checkpoint_dir experiments/pickup/<run> \
    --shards data/preprocessed/<dataset>/shards --samples 64
```

**What it is good for.** `Policy.infer` is what the server's `main` calls for every `infer`
message, so the check runs the serving path (checkpoint loading, JPEG decoding,
`RoboticsProcessor.process_inputs`, `generate_actions`, denormalisation) on inputs whose correct
answer is known. A chunk error not well under the repeat baseline means the checkpoint is barely
trained or the serving path differs from training.

The test is one-sided. A low error does not mean the policy works, or even that the images arrive
correctly: a policy with history can score well from the previous action alone
([Train-inference skew](93-train-inference-skew.md) compares input tensors directly). The check
also skips what `eval.py` adds: JPEG encoding, `env.last_action` as the previous action, and the
socket.

**Closed-loop evaluation from the first checkpoint.** This is the practical rule.
[`sim/pickup/scripts/eval_checkpoints.sh`](../../sim/pickup/scripts/eval_checkpoints.sh) evaluates
every checkpoint of a run, newest first, with its raw (directly trained) weights and, when the
run saved them (`--ema.enabled True`), its EMA weights, and skips those that already have a
`results.json`. With `PICKUP_WATCH=1` it polls until the training log reports the end of the
run, so it can be started next to the training job:

```bash
sim/pickup/scripts/train_resilient.sh dp_vit_lang pick_target_1500 my_run 1000000 --ema.enabled True &
PICKUP_WATCH=1 PICKUP_EVAL_JOBS=2 sim/pickup/scripts/eval_checkpoints.sh experiments/pickup/my_run pick_target 100 &
# at any time after the first checkpoint has been evaluated:
.venv/bin/python -m sim.pickup.summarize --task pick_target --runs my_run
```

`summarize.py` prints one row per evaluation; `sim/pickup/monitor.py` shows each run's loss next
to the success of its checkpoints.

<!-- interactive: loss-vs-success -->
*Figure: the training loss of one run against samples seen, with the closed-loop success of each
saved checkpoint, as in the `vla_qwen` rows below.*

## What we measured

All numbers are from the [lab notebook](../lab-notebook.md), one training seed per run. Success
rates are closed-loop on unseen layouts unless the text says otherwise.

| Policy (machine A), training samples | Final loss | Success |
|---|---|---|
| `pick_cube`: pooled CLIP, 200 demos, 300k | 0.040 | 2/50 = 4% |
| `pick_cube`: `dp_vit`, 200 demos, 300k | 0.091 | 15/50 = 30% |
| `pick_cube`: `dp_vit`, 1000 demos, 500k | 0.084 | 20/50 = 40% |
| `pick_cube`: `dp_vit`, 1000 demos, 1.5M | 0.058 | 37/50 = 74% |
| `pick_target`: `dp_vit`, 1500 demos, 1.0M | 0.069 | 1/100 |
| `pick_target`: `vla_qwen`, 100k | 0.087 | 0/50 |
| same run, 200k | 0.066 | 1/50 |
| same run, 300k | 0.039 | 6/50 |
| same run, final, 400k | 0.03-0.04 | 6/100 |
| `pick_target`: `vla_custom`, 1.0M | ~0.03 | 0/100 |
| same, VLM randomly initialised | ~0.03 | 1/100 |

The lowest loss on `pick_cube` (0.040) belongs to the 4% policy, which also scored 0/20 on its
own training layouts, the scenes its loss was computed on. On `pick_target`, losses of about 0.03
belong to policies at 0/100 and 1/100; the `vla_qwen` run ended at 0.03-0.04 with 6/100. The
three `dp_vit` rows on `pick_cube` are in loss order, but on 50 episodes each the 30% and 40%
rows have overlapping 95% intervals (19-44% and 28-54%); only the 74% row (60-84%) is separated
from them. Within the `vla_qwen` run the loss fell while success rose from 0/50 to 6/50. The
table rules out reading a level of success off a loss or ranking different models by it. It does
not show that loss is uninformative inside a single run.

**Open-loop error.** The field notes ([notes.md](../notes.md), section 2) record that the 1%
`pick_target` policy and the 74% `pick_cube` policy reproduce recorded expert actions equally
well in the open-loop check. The per-joint figures are not in the lab notebook.

**The first chunk.** Two diagnostics from `eval.py` are used below
([Measuring failure](92-measuring-failure.md)). The named-object rate is the share of episodes in
which, when the gripper first closed, the nearest object was the one the instruction named
(chance: 33% with three objects). The median miss is the median horizontal distance from the
gripper to the named object at that moment.

The first-chunk test is a better open-loop probe: give the policy the first frame of an episode
and measure where its first 15-action chunk takes the gripper. On 60 layouts, for
`dp_vit_lang_reactive` (instruction tokens, no history) at 0.9M samples (machine B):

| | Training layouts | Unseen layouts |
|---|---|---|
| Expert's chunk heads for the named object | 100% | 100% |
| Policy's chunk heads for the named object | 35% | 48% |
| Distance between the policy's and the expert's chunk endpoint (median) | 12.1 cm | 11.2 cm |
| Distance between two samples of the policy for the same input (median) | 10.9 cm | 10.8 cm |

This probe aims at the window that decides the episode and separates the policy from the
expert. The result is no better on training layouts, so unfamiliar scenes are not the cause. Two
samples for one input land about as far from each other (10.9 cm, 10.8 cm) as from the expert
(12.1 cm, 11.2 cm). A policy with a fixed offset would give two samples close together and both
far from the expert; this is the scattered case, in which chunks for one image end at different
places (a reading of the table, not a separate measurement). The 48% on unseen layouts is close
to the closed-loop named-object rate of the same checkpoint, 45% (raw) / 48% (EMA); the notebook
does not say which weights the test used, or how "heads for the named object" was scored.
Nothing is executed, so the probe says nothing about the grasp. No script for it is in the
repository; `Policy.infer` returns `[15, 8]` joint targets, so reproducing it needs forward
kinematics (computing the gripper position from joint angles).

**Early windows.** `dp_vit_lang_reactive` trained on 500 layouts, each demonstrated with all three
objects named, scored 0% / 0% (raw / EMA) with a named-object rate of 32% / 29%. The same data
with the windows of frames 0-7 repeated 5 extra times (45% of the windows; built by
`sim/pickup/boost_early_windows.py` with `--max_frame 7 --repeat 5`) scored 8% / 15% and
52% / 58%. One seed each: consistent with the early windows being under-weighted, not proof of it.

## Where it goes wrong

| What you see | Why | How to check | What to do |
|---|---|---|---|
| Loss still falling, success at 0-1% | Most windows the loss averages are mid-motion ones that can be fitted without locating the object (their share of the loss value was not measured) | Named-object rate and median miss printed by `eval.py` | [Measuring failure](92-measuring-failure.md) |
| `open_loop_check` prints `samples: 0`, then raises `TypeError`, for a no-history run | The shards store one past step (`past_lowdim_steps: 1` in [`preprocess.yaml`](../../sim/pickup/configs/preprocess.yaml)) and the script indexes them with `policy.past`. At 0, `future_mask[0:]` includes the past slot, which is always false, so every window is skipped; `np.mean` of the empty list is `nan` and `fmt` cannot iterate over it | Read the skip condition | Use the check on configs with `lowdim_past_timesteps: 1` |

In the history configs the frame-0 window has no real previous step. `preprocess.yaml` allows one
padded past step (`max_padding_left: 1`, `padding_strategy: copy`) and `PaddingStrategy.copy_edge`
(`vla_foundry/data/preprocessing/robotics/preprocess_masks.py`) fills it with a copy of step 0.
`DiffusionPolicy.forward` does not read `past_mask`, so in training the previous-action input of
that window equals the first action it asks for. At step 0 of an evaluation `eval.py` sends
`env.last_action`, the reset joint targets, by default (`--first_prev_action hold`).
`--first_prev_action expert` sends the scripted expert's first command instead, as a copy-padded
training window contains; evaluate a run both ways to test whether the mismatch matters. The lab
notebook has no such comparison, so the effect on success has not been measured.
`--stale_images` keeps sending the first frame's images and shows how much a policy depends on
the images at all.

## Background and further reading

- Ross, *Efficient Reductions for Imitation Learning*, 2010
  ([PMLR](https://proceedings.mlr.press/v9/ross10a.html)). The learner's actions change the
  states it later meets, so errors compound.
- Codevilla, *On Offline Evaluation of Vision-based Driving Models*, 2018
  ([arXiv:1809.04843](https://arxiv.org/abs/1809.04843)). For driving policies, offline prediction
  error alone does not indicate driving quality.
- Wen, *Fighting Copycat Agents in Behavioral Cloning from Observation Histories*, 2020
  ([arXiv:2010.14876](https://arxiv.org/abs/2010.14876)). The shortcut of copying the expert's
  previous action.

## Check yourself

1. `vla_custom` reached a loss of about 0.03 and 0/100. Explain with the frame table in "The
   idea" how both can hold.
2. Run the open-loop check (command above) on a run with history. State what a chunk error (first
   printed line) close to the repeat baseline (third line) would mean, and what one far below it
   does not mean. The baseline is averaged over the whole 15-step chunk, so do not compare the
   first-action line with it.
3. Evaluate every checkpoint of one run with `eval_checkpoints.sh` and print the rows with
   `summarize` (commands above). Compare the change in named-object rate between checkpoints with
   the change in the logged loss.
