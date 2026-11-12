---
title: Imitation Learning and Why It Breaks
part: 4 Actions and policies
order: 43
summary: Explain why a policy that copies demonstrations accurately can still fail when it runs, name the four causes, and find each one in this repository's expert, data and measurements.
status: draft
---

# Imitation Learning and Why It Breaks

Every policy in the lab notebook is trained by imitation: it is shown recordings of an expert doing
the task and trained to output what the expert output. That is ordinary supervised learning until
the policy is switched on. From then on its own outputs decide what it sees next, and four
problems appear that a held-out loss cannot show.

## The idea

**Behaviour cloning** is supervised learning on demonstrations. A **demonstration** is a recording
of an expert performing the task: at every control step, the observation (camera frames, joint
state) and the action the expert commanded. A **policy** is a function from observation to action;
behaviour cloning fits it to the recorded pairs.

The lab notebook lists 1500 `pick_target` demonstrations of about 66 steps each, cut into 98,841
training windows, one per recorded step. `pick_target` shows 3 of 4 objects at random poses with
the instruction "pick up the \<object\>"; `pick_cube` shows one red cube. `dp_vit` is the 36M
diffusion policy with a small vision transformer and no language input. A window for it holds:

| Part | Shape | Content |
|---|---|---|
| Images | 4 frames of 224x224 | `front` and `wrist` cameras at steps t-1 and t |
| State | `[2, 8]` | 7 joint angles and the gripper opening at t-1 and t |
| Previous action | `[1, 8]` | the command the expert sent at t-1; an episode's first window has no t-1, and `padding_strategy: copy` fills the slot with a copy of the action at t |
| Target | `[15, 8]` | the commands the expert sent at t, t+1, ..., t+14 |

Training draws windows in random order and fits the model's output for each to the recorded
`[15, 8]` block, through the loss of [Flow matching](41-flow-matching.md).

The difference is in how the result is used. Supervised learning assumes that test inputs come
from the same distribution as training inputs. A held-out set of expert windows satisfies that. A
running policy does not: the observation at step t+1 results from the action at step t, so the
inputs come from the states *the policy* reaches, which are the expert's states only until its
first error.

Running the policy in the simulator, each action changing the next observation, is a
**rollout**, and success measured this way is **closed-loop**. Feeding the policy recorded expert
observations and comparing its output with the recorded actions is **open-loop**: its outputs
never reach the simulator.

## How it breaks

### 1. The policy visits states its own mistakes create

**Covariate shift** is a change in the distribution of inputs between training and use, while the
correct output for each input stays the same. In behaviour cloning the policy causes the shift
itself. A small error in one action moves the arm off the demonstrated path. The next observation
is unlike anything in the data, so the next prediction is worse, and the arm moves further off.
This is **compounding error**.

Arithmetic, not a measurement: take an episode of T = 66 steps and a policy that errs on 1% of
expert states. If an error did not change the states that follow, as with the images of a test
set, the expected number of errors is 0.01 x 66 = 0.66 per episode. Here an error does change
them, and each can cost every remaining step. Background:
[Ross, *Efficient Reductions*, 2010](https://proceedings.mlr.press/v9/ross10a.html) proved that
the extra cost of treating imitation as independent supervised learning is bounded by εT², here
0.01 x 66² = 43.56 steps: the bound grows with the square of the horizon, not linearly.

### 2. The demonstrations never show recovery

Compounding error would be harmless if the policy knew how to return to the demonstrated path.
It can learn that only from data that contains states off the path, paired with the action that
leads back. A competent expert does not produce such states. Example: the gripper closes beside
the object. The correcting actions (open, move over, descend, close again) follow a state that no
successful demonstration contains, so the policy has never been shown them.

### 3. Demonstrations disagree with each other

The same observation can be followed by different correct actions: reach for the left object or
the right one. The demonstrated actions for one observation then have several separate peaks;
such a distribution is called **multimodal**. A model trained to minimise squared error outputs
the mean of the targets. With two objects 20 cm apart and demonstrations split evenly between
them, the mean reach ends 10 cm from both, an action no demonstration contains.

### 4. Inputs that predict the action without causing it

Robot motion is smooth, so the expert's command at step t is almost its command at step t-1. If
the previous action is an input, "repeat it, plus a small step in the same direction" fits nearly
every training window without the cameras. The same holds for **proprioception**, the robot's
measurement of its own joints, when two consecutive states are given: their difference is the
velocity.

The expert's previous action was caused by what the expert saw. In a rollout the previous action
is the policy's own, and a policy that leans on it continues its own motion, right or wrong.
Background: [de Haan, *Causal Confusion*, 2019](https://arxiv.org/abs/1905.11979) named the
general problem *causal confusion* and showed that giving a cloned policy more inputs can lower
its performance. [Wen, *Fighting Copycat Agents*, 2020](https://arxiv.org/abs/2010.14876) called
the case where the shortcut is the expert's previous action, which a policy can read off its
observation history, the *copycat problem*. Here the previous action is given to the policy
directly.

<!-- interactive: copycat -->
*Figure: one joint target and the gripper command of a recorded demonstration against time, with
a second line that repeats the previous action. The gap between the lines is what the previous
action does not predict; for the gripper command it is zero on every step except the one where
the gripper closes.*

### The classical remedies

Background: published work, not measured here.

| Remedy | What it changes | Aimed at | Source |
|---|---|---|---|
| DAgger | Run the policy, have the expert label the states it reached, add them to the data, retrain, repeat. Needs an expert that can be queried in any state | 1, 2 | [Ross, DAgger, 2011](https://arxiv.org/abs/1011.0686) |
| Noise injection (DART) | Perturb the expert's executed actions during collection and record the intended ones, so the data holds off-path states with corrections | 1, 2 | [Laskey, DART, 2017](https://arxiv.org/abs/1703.09327) |
| Action chunking | Predict several future actions per decision, so an episode contains fewer decisions | 1 | [Zhao, ACT, 2023](https://arxiv.org/abs/2304.13705) |
| Generative policy | Learn the distribution of actions and sample from it instead of regressing to its mean | 3 | [Chi, Diffusion Policy, 2023](https://arxiv.org/abs/2303.04137) |
| History dropout | Hide the past-motion input for part of the training examples (half in ChauffeurNet) | 4 | [Bansal, ChauffeurNet, 2018](https://arxiv.org/abs/1812.03079) |

## In this repository

**The expert makes one clean pass.** In [`sim/pickup/expert.py`](../../sim/pickup/expert.py),
`ScriptedExpert.reset` reads the target's position once with `env.object_pos(env.target)` and
builds four waypoints: above the grasp point with the gripper open, at the grasp point, the same
point with the gripper closed and a `dwell` of 8 (the tuple's last field: control steps to wait
after arrival), then a lift. `ScriptedExpert.act` moves a set-point toward the current waypoint
and only ever increases the waypoint index `self.wp`. It never reads the object's position again
and never checks that the object is held. After the close it lifts, and stays on the last waypoint
(`dwell` 1000, longer than any episode). No branch reopens the gripper.

**Its randomness is in the plan, not in the execution.** `reset` draws, once per episode, a grasp
point offset (3 mm standard deviation per axis), an approach height (10 to 14 cm), a lift height
(18 to 24 cm), a speed factor (0.8 to 1.2) and, for the can and the hex nut (`grasp_sym` is
`None` in `OBJECTS`, [`env.py`](../../sim/pickup/env.py)), a yaw offset within ±0.3 rad. Two
demonstrations of one scene therefore differ in path, in timing and, for those two objects, in
wrist angle: a mild case of problem 3. No draw moves the arm off its plan.

**Collection records exactly what it executes and keeps only successes.** In
[`sim/pickup/collect.py`](../../sim/pickup/collect.py), `_worker` calls `expert.act()`, stores that
action, and passes the same action to `env.step`. That is where DART would add noise; nothing
does. An episode whose final `info["success"]` is false is skipped, so the data contains no failed
grasp.

**The shortcut inputs exist by default.**
[`configs/preprocess.yaml`](../../sim/pickup/configs/preprocess.yaml) cuts windows with
`past_lowdim_steps: 1` and `future_lowdim_steps: 14`. In `DiffusionPolicy.forward`
([`diffusion_policy.py`](../../vla_foundry/models/diffusion_policy/diffusion_policy.py))
the line `torch.where(future_mask.unsqueeze(-1), noisy_action, actions)` leaves the past slot of
the action sequence as the recorded, noise-free expert action. In a rollout,
[`eval.py`](../../sim/pickup/eval.py) sends `env.last_action`, the command the simulator last
applied, and `Policy.infer` in [`policy_server.py`](../../sim/pickup/policy_server.py) writes it
into that slot, which `generate_actions` keeps fixed through the flow steps.

The first step differs further: the training window holds a copy of the expert's first action
(copy padding; `DiffusionPolicy.forward` does not use `past_mask`), while `eval.py` sends the
joint command set by `PickupEnv.reset`. The effect on success has not been measured; see
[Train/inference skew](93-train-inference-skew.md).

In the expert's waypoint list the gripper command is 1, 1, 0, 0: it equals the previous command
on every step but one.

**Which remedies are present.**

| Remedy | Here |
|---|---|
| Action chunking | The policy returns 15 actions and `eval.py` executes `--exec_horizon` of them (default 8) before asking again ([Chunks and execution](42-chunks-and-execution.md)) |
| Generative policy | The action head is trained with [flow matching](41-flow-matching.md) |
| History removal | [`dp_vit_reactive.yaml`](../../sim/pickup/configs/dp_vit_reactive.yaml) and [`dp_vit_lang_reactive.yaml`](../../sim/pickup/configs/dp_vit_lang_reactive.yaml) set `lowdim_past_timesteps: 0` and `image_indices: [0]`: one frame per camera, the current state, no previous action, for every sample (not dropout). Actions are absolute joint targets, so the current state stays close to the last command: this removes the direction of motion, not the arm's position |
| DAgger, DART, retries | Not implemented; [`roadmap.md`](../roadmap.md) lists noise-injected and retry demonstrations as open |

**The open-loop check.** [`sim/pickup/open_loop_check.py`](../../sim/pickup/open_loop_check.py)
takes windows from preprocessed shards, runs `Policy.infer` on them, and prints three lines of
per-joint mean absolute error: the predicted chunk and the first predicted action against the
expert's, and a baseline that repeats the previous action for the whole chunk.

```bash
.venv/bin/python -m sim.pickup.open_loop_check \
    --checkpoint_dir experiments/pickup/<run> \
    --shards data/preprocessed/<dataset>/shards --samples 64
```

This is the supervised-learning view of a policy: expert inputs, including the expert's previous
action. On the training shards it measures fit to training windows; for a held-out figure, give
it shards built from demonstration seeds the run did not train on. Padded windows (the first step
and the last 14 of each episode) are skipped, so fewer than `--samples` windows are scored.

## What we measured

All numbers are from the [lab notebook](../lab-notebook.md), which used two machines: A (one RTX
4090) and B (L40S GPUs).

**Fit to the demonstrations does not separate a working policy from a failing one.**

| Policy | Task | Final loss | Closed-loop success |
|---|---|---|---|
| `dp_vit`, 1000 demos, 1.5M samples | `pick_cube` | 0.058 | 37/50 = 74% |
| `dp_vit`, 1500 demos, 1.0M samples | `pick_target` | 0.069 | 1/100 |
| `vla_custom` (the 130M VLA of [The from-scratch path](62-the-from-scratch-path.md)), 1500 demos, 1.0M samples | `pick_target` | ~0.03 | 0/100 |

The field notes ([notes.md](../notes.md), section 2) add that the 1% and the 74% policy reproduce
recorded expert actions equally well in the open-loop check.

**The failing policies copied the motion and its timing.** On `pick_target`, 100 episodes each,
`dp_vit` and `vla_custom` with a pretrained and with a randomly initialised VLM closed the gripper
in 100% of episodes, at the right height (within about 3 mm), around step 34-44, as the expert
does. The nearest object was the named one in 32%, 33% and 29% of episodes; chance is 33%.

**Samples for one input are spread widely.** In the open-loop test of the first chunk (60 layouts,
`dp_vit_lang_reactive` at 0.9M samples; this policy takes instruction tokens, one frame and no
previous action), two samples for the same input ended 10.9 cm apart on training layouts and
10.8 cm on unseen ones (medians), in a chunk where the expert moves the gripper 30 cm. The
expert's chunk headed for the named object in 100% of layouts, the policy's in 35% and 48%. The
policy has no history input and the test starts from the first frame, where the arm is at nearly
the same pose in every layout, so problem 4 cannot explain the spread. A policy that ignores the
instruction faces three candidate targets, which is problem 3; the test does not establish that
cause.

**Removing the history changed little at this budget.** Machine B, 1500 demos, 1M samples, final
checkpoint, 100 layouts, raw / EMA weights (EMA: an exponential moving average of the weights).
Without language, `dp_vit` (history) scored 0% / 0% with the named object nearest in 31% / 37% of
episodes, and `dp_vit_reactive` (no history) 1% / 1% with 26% / 34%. Both lack the instruction, so
neither can know the target. With the instruction, `dp_vit_lang` (history) scored 3% / 2% with
35% / 29%, and `dp_vit_lang_reactive` (no history) 3% / 5% with 49% / 41%. Differences of a few
percent between single runs are noise; the named-object rate is higher without history in this
one pair. The 4000-demo, 5M-sample pair with and without history was still running when the
notebook was written, so there is no result at that budget. Here the copycat explanation remains
a hypothesis: no finished pair shows a difference in success.

**Fewer decisions per episode made no measurable difference.** On the best `pick_cube` checkpoint
the number of actions executed per 15-action chunk (`--exec_horizon`) was varied: 74% with 8, 84%
with 4, 78% with 15, 50 episodes each, all intervals overlapping.

**The expert gets one attempt.** Through the evaluation loop it scored 100/100 on `pick_target` on
machine B and 99/100 on machine A. In the grasp-tolerance run with no added offset (320 episodes)
it succeeded on 94% of cans and 89% of hex nuts on machine A, and on 100% of every object on
machine B. Failures are dropped at collection, so no miss reaches the data.

## Where it goes wrong

| What you see | Why | How to check | What to do |
|---|---|---|---|
| Low loss and low open-loop error, low success | Both are measured on expert states with expert history | Compare the chunk line of `open_loop_check` with its repeat baseline (both average over the 15 steps); the first-action line has no matching baseline. Then evaluate closed-loop | Rank checkpoints by success only. See [Loss is not success](91-loss-is-not-success.md) |
| A complete reach-descend-close-lift at the wrong place | The motion is alike in every demonstration; the target is not | The grasp statistics `eval.py` prints from `GraspProbe` | See [Measuring failure](92-measuring-failure.md) |
| The gripper closes beside the object and the arm lifts empty | No demonstration contains a miss followed by a correction | Watch the `rollout_*_fail.mp4` files `eval.py` writes. `GraspProbe.update` (`sim/pickup/diagnostics.py`) records only the first close of an episode, so its statistics cannot count retries | Recovery data (noise injection, retries); not available here |
| `open_loop_check` prints `samples: 0` and stops with a `TypeError` for a no-history policy | The shards are cut with one past step and the script indexes their 16-row windows with `policy.past`. At 0 the test `future_mask[policy.past:].all()` includes the past slot, which is never true, so every window is skipped | Read `main` in the script | Use the check only when the policy's `lowdim_past_timesteps` equals the shards' `past_lowdim_steps` (1 here) |

## Background and further reading

- Ross, *Efficient Reductions for Imitation Learning*, 2010
  ([PMLR](https://proceedings.mlr.press/v9/ross10a.html)). The error bound of imitation as
  supervised learning grows with the square of the horizon.
- Ross, *A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning*,
  2011 ([arXiv:1011.0686](https://arxiv.org/abs/1011.0686)). DAgger: iterative training on states
  the learned policy visits.
- Laskey, *DART: Noise Injection for Robust Imitation Learning*, 2017
  ([arXiv:1703.09327](https://arxiv.org/abs/1703.09327)). Noise in the supervisor's actions during
  collection, so the data shows recovery.
- de Haan, *Causal Confusion in Imitation Learning*, 2019
  ([arXiv:1905.11979](https://arxiv.org/abs/1905.11979)). More inputs can make a cloned policy
  worse: it cannot tell causes of the expert's action from correlates.
- Wen, *Fighting Copycat Agents in Behavioral Cloning from Observation Histories*, 2020
  ([arXiv:2010.14876](https://arxiv.org/abs/2010.14876)). Names the copycat problem and removes
  previous-action information from the learned features.
- Bansal, *ChauffeurNet: Learning to Drive by Imitating the Best and Synthesizing the Worst*, 2018
  ([arXiv:1812.03079](https://arxiv.org/abs/1812.03079)). Synthesised perturbations of expert
  driving, and dropout of the past-motion input.
- Zhao, *Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware*, 2023
  ([arXiv:2304.13705](https://arxiv.org/abs/2304.13705)). Action Chunking with
  Transformers (ACT): chunks of k actions reduce the effective horizon k-fold; the policy is
  trained as a conditional VAE.
- Chi, *Diffusion Policy: Visuomotor Policy Learning via Action Diffusion*, 2023
  ([arXiv:2303.04137](https://arxiv.org/abs/2303.04137)). Actions generated by a diffusion process,
  which handles multimodal action distributions.

## Check yourself

1. Run the expert through the evaluation loop and look for failures in `results.json`
   (`per_episode`, `success: false`). Using `ScriptedExpert.act`, state what the arm does after a
   failed close.

   ```bash
   .venv/bin/python -m sim.pickup.eval --task pick_target --episodes 100 --expert \
       --out results/pickup/expert/pick_target
   ```

2. An episode may last 200 steps (`--max_steps`). Compute how many times the policy is queried with
   `--exec_horizon` 8, 4 and 15. Relate the three counts to the horizon in problem 1.

3. Run `open_loop_check` on a checkpoint trained with history. On which joints does the chunk line
   beat the repeat baseline by the widest margin, and what does that say about where the scene
   enters the prediction?
