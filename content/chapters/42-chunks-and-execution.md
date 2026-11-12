---
title: Action Chunks and Closed-Loop Execution
part: 4 Actions and policies
order: 42
summary: Explain why a policy predicts 15 future actions and executes only the first few, trace one re-plan through eval.py and policy_server.py, and choose and test an execution horizon.
status: draft
---

# Action Chunks and Closed-Loop Execution

An **action chunk** is a short sequence of future actions that a policy predicts in one forward
pass, instead of one action per observation. The policies trained on this repository's pickup
simulator predict 15 actions (0.75 s at 20 Hz), execute the first 8 by default, read the cameras
again and predict a new chunk. A robot policy needs this because it runs **closed-loop**: each
action changes what the cameras see next, so small errors feed back into the input, and how often
the policy looks decides how those errors grow.

## The idea

The simplest loop is: observe, predict one action, execute it, repeat. At 20 Hz that is 20
decisions per second, and it has three costs.

1. Every decision is a chance to drift. Background: Zhao et al. (2023) argue that predicting a
   chunk of actions and executing all of it before the next decision divides the number of
   decisions in a task (the effective horizon) by the chunk length, which leaves fewer places for
   errors to compound.
2. A generative policy samples its output ([41-flow-matching.md](41-flow-matching.md)). If two
   motions are both valid, two samples for nearly the same observation can pick different ones;
   one sampled chunk is a single coherent motion.
3. One forward pass per control step is expensive when the model is large.

A chunked policy predicts $H$ actions and executes the first $k$ of them. $k$ is the **execution
horizon**. The remaining $H - k$ actions are thrown away and a new chunk is predicted from a fresh
observation, so the number of decisions falls by a factor of $k$. Between two predictions the
robot runs **open-loop**: it follows the plan without looking.

The numbers for this repository's simulator (20 Hz control, $H = 15$, episodes of at most 200 steps):

| Actions executed per chunk (`--exec_horizon`) | Time without a new observation | Predictions in an episode that runs all 200 steps |
|---|---|---|
| 1 | 0.05 s | 200 |
| 4 | 0.2 s | 50 |
| 8 (default) | 0.4 s | 25 |
| 15 | 0.75 s | 14 |

<!-- interactive: action-chunks -->
*Figure: a timeline of control steps. At each re-plan the policy draws 15 future actions; the first
8 are executed and the last 7 are discarded when the next chunk, predicted from a new observation,
replaces them.*

## How it works

### The training window

A policy learns to predict chunks because each training sample is a window of consecutive steps cut
from a demonstration. `sim/pickup/configs/preprocess.yaml` sets `past_lowdim_steps: 1` and
`future_lowdim_steps: 14`, so a window anchored at step $t$ holds 16 **low-dimensional** rows (the
8-D state and the 8-D action, as opposed to images), and `image_indices: [-1, 0]` stores each
camera's frame at $t-1$ and $t$.

```text
slot            0       1       2       3     ...    15
episode step   t-1      t      t+1     t+2    ...   t+14
action         given    |------- predicted: 15 actions -------|
state          input   input    (not an input)
images         t-1      t
```

Slot 1 is the **anchor**, the current step. `action[t]` is the command applied after observing
frame `t`, so slot 1 is the first action the policy has to produce. The stored arrays are
`[16, 8]` each for action and state, plus four JPEGs named `front_t-1`, `wrist_t-1`, `front_t0`
and `wrist_t0`.

Windows near the ends of an episode do not fit. Take a demonstration of 66 steps (indices 0 to 65):

- Anchor 0 has no step $-1$. `max_padding_left: 1` allows one missing past row, and
  `padding_strategy: copy` fills it with a copy of step 0. The image at $t-1$ is frame 0 again.
- Anchor 65 has no future. `max_padding_right: 14` allows all 14 future rows to be copies of
  step 65.

Two boolean masks record which rows are real. `future_mask` is true for the real rows from the
anchor onward; `past_mask` is true for the real rows before it. With these padding limits every
step of every demonstration is an anchor (`stride: 1`), which is why 1500 `pick_target`
demonstrations of about 66 steps each give 98,841 windows (lab notebook).

In training, `DiffusionPolicy.forward` (the model class of `dp_vit`, the 36M-parameter diffusion
policy with a small ViT, `sim/pickup/configs/dp_vit.yaml`) adds noise only to the rows where
`future_mask` is true, and the loss, `masked_mse_loss`, counts only those rows. (`input_noise_std`,
an extra noise on all rows, defaults to 0 and no file in `sim/pickup/configs/` sets it.) The past
action in slot 0 therefore enters the model clean, as an input, and padded future rows cost
nothing.

### The run-time loop

`sim/pickup/eval.py` owns the simulator and a queue of actions. `sim/pickup/policy_server.py` owns
the model. One episode runs like this:

1. `env.reset(seed)` returns the first observation. `prev_obs` is set to that same observation and
   the queue is empty.
2. When the queue is empty, the client sends an `infer` message: both cameras' frames from
   `prev_obs` and from the current observation as JPEG bytes, the two states as `[2, 8]`, the last
   command the simulator applied (`env.last_action`, `[8]`), the instruction, and the number of
   flow steps (how many integration steps the sampler takes from noise to actions:
   `--flow_steps`, default 10, see [41-flow-matching.md](41-flow-matching.md)).
3. `Policy.infer` builds a one-sample batch and runs it through `RoboticsProcessor.process_inputs`
   and `add_action_and_proprioception_fields`, the two calls the training pipeline in
   `vla_foundry/data/pipelines/robotics.py` makes. For a policy with one past step the action
   tensor is `[1, 16, 8]`: slot 0 holds the previous action, the other 15 are placeholders, and
   `past_mask` marks slot 0. (With `lowdim_past_timesteps: 0` it is `[1, 15, 8]`, `prev_action` is
   unused and `past_mask` is all false.)
4. The model's `generate_actions` (for the `dp_vit` configs, `DiffusionPolicy.generate_actions`)
   keeps slot 0 fixed, starts the other 15 rows from noise and denoises them in `num_flow_steps`
   steps (exactly that many when the value divides the scheduler's 1000 timesteps, as the default
   10 does; `--flow_steps 7` runs 8 iterations). The server denormalises the result (maps the
   model's normalised outputs back to joint angles and the gripper command, see
   [40-action-spaces.md](40-action-spaces.md)) and returns `out[0, self.past:]`, shape `[15, 8]`:
   the actions for $t, t+1, \dots, t+14$.
5. The client keeps `reply["actions"][:exec_horizon]` as the queue. Each control step it stores the
   current observation as `prev_obs`, pops one action and calls `env.step`. When the queue is
   empty it returns to step 2; `prev_obs` is then the observation one control step before the
   current one, which matches `image_indices: [-1, 0]`.

### The first step

At the first step of an episode there is no previous frame, state or action. The client sends the
first observation twice and, as the previous action, the command the simulator holds after reset:
the start joint angles with the gripper open (`PickupEnv.reset` sets `last_action` to that).

The training data handles the same situation by padding, and the two agree only partly. Frame 0
twice and state 0 twice are exactly what the anchor-0 window contains. The previous action
differs: in the anchor-0 window slot 0 is a copy of the expert's first command, while at run time
it is the held start pose. Whether the difference matters has not been measured here;
`--first_prev_action expert` in `eval.py` sends the expert's first command instead, to test it.
[93-train-inference-skew.md](93-train-inference-skew.md) covers other differences between
training and serving.

### Reacting, committing and latency

**Latency** is the time between capturing an observation and having the chunk computed from it. In
this simulator it costs nothing: `eval.py` blocks on `conn.recv()` and does not call `env.step`
until the reply arrives, so the simulated world stands still while the model computes. The server
still measures it, and `eval.py` writes the mean, median and 95th percentile to `results.json` as
`inference_latency_ms`.

On a real robot the world keeps moving. One control step at 20 Hz is 50 ms. The lab notebook gives
20-65 ms per chunk for the 36M policy and about 190 ms, which is 3.8 control steps, for the Qwen
VLA (`vla_qwen`, the policy built on the 2.2B-parameter Qwen3-VL-2B model) on machine A. A robot
that waited for such a chunk would stall for almost four steps at every re-plan; one that kept
moving would receive a chunk whose first actions are already out of date. A larger $k$ spreads one
inference over more steps (190 ms over 8 steps is about 24 ms per step) and lengthens the time the
robot acts without looking. Background: Black et al. (2025), listed below, compute the next
chunk while the old one executes.

## In this repository

| What | Where |
|---|---|
| Window length and padding at preprocessing | [`sim/pickup/configs/preprocess.yaml`](../../sim/pickup/configs/preprocess.yaml); `LeRobotConverter.extract_sample_data` in [`converters/lerobot.py`](../../vla_foundry/data/preprocessing/robotics/converters/lerobot.py) |
| Cropping a stored window to the policy's window | `extract_robotics_fields` in [`vla_foundry/data/pipelines/robotics.py`](../../vla_foundry/data/pipelines/robotics.py), which calls `crop_sequence` |
| Which rows are state inputs | `RoboticsProcessor.add_action_and_proprioception_fields` in [`robotics_processor.py`](../../vla_foundry/data/processor/robotics_processor.py) |
| Training step and sampling a chunk | `DiffusionPolicy.forward` and `generate_actions` in [`diffusion_policy.py`](../../vla_foundry/models/diffusion_policy/diffusion_policy.py) |
| Server | `Policy.infer` and `main` in [`sim/pickup/policy_server.py`](../../sim/pickup/policy_server.py) |
| Client, queue, `--exec_horizon` | `main` in [`sim/pickup/eval.py`](../../sim/pickup/eval.py) |

The window a policy trains on is set in its training config, within what the shards store.
`lowdim_past_timesteps` and `lowdim_future_timesteps` come from
`vla_foundry/config_presets/data/diffusion_policy.yaml` (1 and 14). `dp_vit` and `dp_vit_lang`
keep that window (frames and states at $t-1$ and $t$, and the previous action) and are the
policies **with history**. `sim/pickup/configs/dp_vit_reactive.yaml` and
`dp_vit_lang_reactive.yaml` set `lowdim_past_timesteps: 0` (the future stays 14) and
`image_indices: [0]` instead of `[-1, 0]`: one frame per camera, the current state, no previous
action. These are the policies **without history**. The shards still store 16 rows with the
anchor at index 1 (`anchor_relative_idx` in each sample's metadata); `extract_robotics_fields`
crops them to rows 1 to 15, so the anchor moves to index 0 and the action tensor is
`[batch, 15, 8]`.

The server reads `past` and `future` from the run's saved `config.yaml`, so the same client serves
both kinds of policy: it always sends two states and four images, and the server takes
`state[-(self.past + 1):]` and the images in `self.image_names`.

The protocol is three messages over `multiprocessing.connection` on `127.0.0.1`, as Python
dictionaries. Both sides hold the same `AUTHKEY`.

| Request | Reply |
|---|---|
| `{"cmd": "info"}` | `checkpoint`, `params_m`, `image_names`, `past`, `future` |
| `{"cmd": "infer", "images", "state", "prev_action", "instruction", "num_flow_steps"}` | `{"actions": nested list [15, 8], "latency_s"}` |
| `{"cmd": "shutdown"}` | `{"ok": True}`, then the server exits |

`latency_s` covers `Policy.infer` (JPEG decoding, preprocessing, sampling, denormalising); it
does not include the client's JPEG encoding or the socket.

To evaluate with another execution horizon, pass the flag through `eval.sh`, which starts the
server, runs the client and shuts the server down:

```bash
PICKUP_OUT=results/pickup/dp_vit_pick_cube_1k/pick_cube_h4 \
  sim/pickup/scripts/eval.sh experiments/pickup/dp_vit_pick_cube_1k pick_cube 50 --exec_horizon 4
```

`--exec_horizon` only slices the reply, so a value above 15 behaves as 15.

## What we measured

One checkpoint was evaluated at three execution horizons: `dp_vit` (36M, with history) trained on
1000 `pick_cube` demonstrations for 1.5M samples, on machine A, 50 unseen layouts per setting, 10
flow steps.

| Actions executed per chunk | Success |
|---|---|
| 4 | 84% |
| 8 (default) | 74% |
| 15 | 78% |

All intervals overlap (the default row is 37/50, 95% interval 60-84%). The sweep shows no
detectable effect of the execution horizon between 4 and 15 on this task. It does not show that 4
is better than 8: there are 50 episodes per setting and one training seed. It says nothing about
$k = 1$, which is not in the lab notebook, about `pick_target`, or about a scene that changes on
its own.

A second measurement bears on re-planning. For `dp_vit_lang_reactive` trained on the 1500
`pick_target` demonstrations (machine B), at 0.9M samples, two chunks sampled for the same first
frame end a median of 10.9 cm apart on training layouts and 10.8 cm on unseen ones (60 layouts),
in a chunk where the expert moves the gripper 30 cm. Whether successive re-plans within a rollout
disagree in the same way was not measured.

## Where it goes wrong

**The chunk starts at the wrong index.** In a 16-row output the first row is the previous action,
not the next one, so `Policy.infer` returns `out[0, self.past:]`. Returning `out[0]` for a policy
with history would repeat the previous command at every re-plan and run every later action one
step late; nothing raises an error because the shapes are valid. Check: print the first returned
action next to `prev_action`; they should differ whenever the arm is moving.
`sim/pickup/open_loop_check.py` indexes the stored 16-row arrays with `policy.past`, which is
correct for one past step. With `lowdim_past_timesteps: 0` its mask test fails on every sample,
because stored row 0 is a past row, and all samples are skipped: you see `samples: 0` followed by
a `TypeError` from the formatting of an empty mean, not a wrong number.

**The wrong state for a policy without history.** The client sends `[previous, current]`. A policy
with `past = 0` must get the current one, so `Policy.infer` slices from the end; slicing from the
front has the same shape and hands over a state one control step old. The training side had the
mirror image of this bug: `add_action_and_proprioception_fields` once chose the number of state
rows with `lowdim_past_timesteps or default`, which treats 0 as unset and falls back to 1, so the
policy was given the current state and the state one step in the future. The fix is an explicit
`is None` check, covered by `tests/essential/data/test_proprioception_past_steps.py`.

**A policy that decides again at every re-plan.** Each call to `generate_actions` starts from new
noise. When several motions are valid, such as reaching for one of three objects, nothing forces
the new chunk to choose the same one as the last. A policy with history receives the last executed
action in slot 0, so the new chunk is conditioned on where the old one got to, though not on where
it was heading; whether that is enough to keep the same choice was not measured here. The
discarded tail of the old chunk is never passed on. The expected sign, not yet measured here, is
a gripper that changes the object it heads for at steps that are multiples of `exec_horizon`.
Check: evaluate the same seeds with `--exec_horizon 15` and `--exec_horizon 4`, with
`--videos 20`, and look for that change in the rollout videos; in `per_episode`, compare
`success` and whether `close_nearest` equals `target` for each seed. What to do: a longer
execution horizon can hide the symptom but does not remove the cause, which is that the policy's
inputs do not settle the choice
([50-what-the-action-head-sees.md](50-what-the-action-head-sees.md)). Background: Liu et al.
(2024), below, select among samples for agreement with the previous chunk.

## Background and further reading

- Zhao et al., *Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware*, 2023
  ([arXiv:2304.13705](https://arxiv.org/abs/2304.13705)). Introduced Action Chunking with
  Transformers (ACT): predict a chunk of joint targets at once to shorten the effective horizon.
  Its temporal ensembling queries the policy every step and averages the overlapping predictions
  for one time step with weights $w_i = \exp(-m\,i)$, where $i = 0$ is the oldest prediction, so
  older predictions count more and $m$ sets how fast new observations are taken in.
- Chi et al., *Diffusion Policy: Visuomotor Policy Learning via Action Diffusion*, 2023
  ([arXiv:2303.04137](https://arxiv.org/abs/2303.04137)). Names the three horizons used here:
  observation horizon, prediction horizon and action execution horizon, with re-planning after the
  execution horizon (receding horizon control). The appendix table for its CNN-based variant
  (Table 7) lists 2 observation steps, 16 predicted and 8 executed for the Lift, Can, Square and
  Transport tasks (the Transformer-based variant, Table 8, predicts 10); this repository's
  defaults are 2, 15 and 8 in the same order. It reports that an execution horizon of 8 was best
  for most of its tasks and that too long a horizon costs reaction time.
- Liu et al., *Bidirectional Decoding: Improving Action Chunking via Guided Test-Time Sampling*,
  2024 ([arXiv:2408.17355](https://arxiv.org/abs/2408.17355)). Studies the trade between
  consistency and reactivity. Its test-time method samples several candidate chunks at each step
  and keeps the one that scores best on two criteria: closeness to what the previous chunk had
  planned for the overlapping steps (backward coherence), and being close to samples from the
  trained policy and far from samples of a weaker, earlier checkpoint (forward contrast). It uses
  the part of the old chunk that this repository's loop discards.
- Black et al., *Real-Time Execution of Action Chunking Flow Policies*, 2025
  ([arXiv:2506.07339](https://arxiv.org/abs/2506.07339)). Computes the next chunk while the current
  one is executing, treats the actions that will run in the meantime as fixed and fills in the
  rest, so that consecutive chunks join smoothly despite the inference delay.

## Check yourself

1. A demonstration has 66 steps. For the window anchored at step 60, work out how many of the 16
   rows are copies and which rows `future_mask` marks as true. Then check:

   ```bash
   .venv/bin/python -c "from vla_foundry.data.preprocessing.robotics.preprocess_masks import create_past_and_future_masks as m; print(m(60, 1, 14, 66))"
   ```

2. Run the test that pins the state rows for a policy without history, then find the line of
   `add_action_and_proprioception_fields` it protects:

   ```bash
   .venv/bin/python -m pytest tests/essential/data/test_proprioception_past_steps.py -q
   ```

3. Evaluate one checkpoint with `--exec_horizon 4`, `8` and `15` on the same 50 seeds (command
   above, one `PICKUP_OUT` per setting). State whether the three 95% intervals (`success_ci95` in
   `results.json`, a Wilson interval, see
   [90-closed-loop-evaluation.md](90-closed-loop-evaluation.md)) overlap before drawing a
   conclusion. Then convert `inference_latency_ms.p95` from one file into control steps at 20 Hz.

4. Start a server and ask it what window its policy uses (needs a GPU: `--device` defaults to
   `cuda`; `OMP_NUM_THREADS=4` is the thread cap `_common.sh` sets, see
   [81-surviving-long-runs.md](81-surviving-long-runs.md)). Wait for the `listening on` line before
   running the second command:

   ```bash
   OMP_NUM_THREADS=4 .venv/bin/python -m sim.pickup.policy_server --checkpoint_dir experiments/pickup/dp_vit_pick_cube_1k --port 6200 &
   .venv/bin/python -c "from multiprocessing.connection import Client; c = Client(('127.0.0.1', 6200), authkey=b'pickup-sim'); c.send({'cmd': 'info'}); print(c.recv()); c.send({'cmd': 'shutdown'}); print(c.recv())"
   ```
