---
title: Demonstrations
part: 7 Data
order: 70
summary: Generate a demonstration dataset with the scripted expert, say what its files and arrays hold, and open a training shard to check it.
status: draft
---

# Demonstrations

A policy trained by imitation learns only from recorded examples of the task being done. This
chapter covers where those examples come from here, what one contains, and how a folder of episodes
becomes the fixed-size samples the trainer reads. It also covers a property of the data that no loss
curve shows: whether the loss can tell if the instruction was used.

## The idea

A **demonstration** is one recorded episode of the task done correctly: at every control step, what
the robot observed and the command that was sent next. An episode of `pick_target` is about 66
steps at 20 Hz (lab notebook), and each step stores:

| Field | Shape | Content |
|---|---|---|
| `front`, `wrist` | 224x224x3 each, JPEG | the two camera frames |
| `state` | `[8]` | 7 measured joint angles and the gripper opening in [0, 1] |
| `action` | `[8]` | 7 joint position targets and the gripper command (1 = open, 0 = closed) |

plus one instruction for the whole episode, for example "pick up the green can". `action[t]` is the
command applied after observing frame `t`.

Background: demonstrations for real robots usually come from teleoperation, a person steering the
arm remotely while the robot records. In a simulator a program can do it. A **scripted expert** is a
hand-written controller that reads the true object pose from the simulator, which the policy never
sees, and executes a fixed plan. Its success rate can be measured before anything is trained.

<!-- interactive: pipeline -->
*Figure: the whole loop from scripted expert to success rate. This chapter is the first three
boxes.*

## How it works

### The task and its randomisation

`PickupEnv.reset(seed)` in [`env.py`](../../sim/pickup/env.py) builds one **layout** (which objects
are on the table and where) from `np.random.default_rng(seed)`. It draws:

1. the arm's start pose: `HOME_Q` plus Gaussian noise of 0.03 rad per joint;
2. the objects: for `pick_target`, 3 of the 4 in `OBJECTS`;
3. the target among them, which fixes the instruction `"pick up the <label>"`;
4. for each object a position, uniform in `SPAWN_X = (0.38, 0.62)` and `SPAWN_Y = (-0.22, 0.22)`
   metres and redrawn until it is more than 0.11 m from the objects already placed, and a yaw
   uniform in $[-\pi, \pi]$.

Demonstrations use seeds counting up from 0 (`collect.py --seed`). Evaluation uses seeds from
`EVAL_SEED_START = 1_000_000` in [`eval.py`](../../sim/pickup/eval.py), so every evaluated layout is
one the policy was not trained on ([Closed-loop evaluation](90-closed-loop-evaluation.md)).

An episode succeeds when the named object has been more than `LIFT_HEIGHT = 0.08` m above its rest
height for `HOLD_STEPS = 10` consecutive control steps, and ends then or after `max_steps = 200`.

### The scripted expert

`ScriptedExpert._plan` in [`expert.py`](../../sim/pickup/expert.py), called from `reset`, reads the
target's position and yaw and writes four **waypoints** for the tool centre point (TCP, the point
between the fingertips), each with a gripper command, a speed limit and a wait after arrival:

1. 0.10 to 0.14 m above the grasp point, gripper open, at most 0.40 m/s x `speed`;
2. the grasp point, gripper open, at most 0.18 m/s x `speed`, then wait 2 steps;
3. the same point, gripper closed, wait 8 steps;
4. 0.18 to 0.24 m above it, gripper closed, at most 0.30 m/s x `speed`, until the episode ends.

The grasp point is the object's position with Gaussian noise of 3 mm standard deviation on x and on
y. `speed` is drawn once per episode from 0.8 to 1.2, the two heights from the ranges above. For the
cube and the T block the fingers are turned to the object's yaw; for the can and the hex nut, which
can be grasped at any angle, the yaw offset is drawn from -0.3 to 0.3 rad. The noise keeps the
demonstrations from being copies of one trajectory.

Once per control step, `ScriptedExpert.act` moves a set-point toward the current waypoint by at most
`speed limit / 20` metres. It advances to the next waypoint when the position and finger-yaw
set-points have arrived, the real TCP is within 12 mm, and the wait has passed; the closing waypoint
(speed 0) skips the arrival test and only waits.

The plan is in Cartesian space and the recorded action is in joint space, so every step goes through
**inverse kinematics** (IK): finding joint angles that put the TCP at a wanted pose. `solve_ik` uses
damped least squares. With $J$ the `[6, 7]` Jacobian (the change of the TCP's position and
orientation per unit change of each joint) and $e$ the 6-D pose error, one iteration is

$$\Delta q = J^{+} e + (I - J^{+} J)\,0.05\,(q_{home} - q), \qquad J^{+} = J^\top (J J^\top + \lambda^2 I)^{-1}$$

$J^{+}$ is the damped pseudoinverse of $J$. The first term is the $\Delta q$ that minimises
$\lVert J\,\Delta q - e\rVert^2 + \lambda^2 \lVert \Delta q\rVert^2$: reduce the pose error, but pay
for large joint steps. That penalty is the damping ($\lambda = 0.05$). Without it the step grows
without bound near a singularity, a configuration such as a fully stretched arm in which no joint
motion moves the TCP in some direction and $J J^\top$ cannot be inverted. The arm has 7 joints and a
pose has 6 numbers, so one direction of joint motion leaves the TCP (almost) where it is; the
second term moves along it to pull the joints toward `HOME_Q`. The loop runs at most 30 iterations
from the previous step's solution and clips to the actuator limits. The result plus the gripper
command is the recorded 8-D action.

<!-- interactive: arm-replay -->
*Figure: a 3D replay of one episode: the gripper moves above the named object, descends, pauses
while the fingers close, and rises.*

### Recording

Each step, `_worker` in [`collect.py`](../../sim/pickup/collect.py) asks the expert for an action,
appends the two current frames (JPEG, quality 95), the state and the action, then steps the
simulator. An episode that does not end in success is dropped. `main` repeats rounds of attempts
until enough succeeded, sorts by seed and keeps the first `--episodes`.

The output uses the file layout of dataset format v2.0 of LeRobot, Hugging Face's robot-learning
library (`codebase_version: "v2.0"` in `info.json`), with one Parquet file (a column-oriented table
format) per episode:

```text
data/lerobot/<name>/
  meta/info.json        fps, totals, feature shapes, expert_success_rate, expert_attempted
  meta/episodes.jsonl   per episode: episode_index, tasks (the instruction), length, seed
  meta/tasks.jsonl      the distinct instructions
  data/chunk-000/episode_000000.parquet   one row per frame: front, wrist, state, action, indices
```

This is the part of that format that the framework's `--type lerobot` converter reads: there is no
`meta/stats.json`, the columns are named `front`, `wrist` and `state` rather than LeRobot's
`observation.*` keys, and loading the folder with the LeRobot library was not tested here.
Background: current LeRobot documentation describes a newer v3 format.

### From episodes to windows

The trainer reads **windows**: fixed-length slices around one **anchor** frame. The settings are in
[`preprocess.yaml`](../../sim/pickup/configs/preprocess.yaml): `past_lowdim_steps: 1` ("lowdim" is
the framework's name for the low-dimensional arrays, here `state` and `action`, as opposed to
images), `future_lowdim_steps: 14`, `image_indices: [-1, 0]`, `stride: 1`. A window anchored at
frame `t` holds `state` and `action` for frames `t-1` to `t+14`, shape `[16, 8]` each, and four
images: both cameras at `t-1` and at `t`. [Chunks and execution](42-chunks-and-execution.md) covers
how the action slots are used.

`BaseRoboticsConverter.process_episode`
([`converters/base.py`](../../vla_foundry/data/preprocessing/robotics/converters/base.py)) calls
`LeRobotConverter.extract_sample_data` once for every anchor in `range(0, episode_length, stride)`,
so with `stride: 1` every frame anchors one window. For an episode of 66 frames (0 to 65):

| Anchor | Frames in the 16 slots | Copied slots | `future_mask` true |
|---|---|---|---|
| 0 | 0, 0, 1, ..., 14 | slot 0 | slots 1-15 |
| 30 | 29, 30, ..., 44 | none | slots 1-15 |
| 65 | 64, 65, 65, ..., 65 | slots 2-15 | slot 1 |

At the ends of an episode the window reaches past the data. `padding_strategy: copy` fills those
slots by repeating the first or last frame, and `max_padding_left: 1` and `max_padding_right: 14`
allow as much padding as the window can ever need, so every frame yields a window. Here 15 of the 66
windows (anchors 0 and 52 to 65) contain copied slots. The copies only keep every window the same
shape: the masks described next remove them from the loss, and the statistics skip them.

The two masks from `create_past_and_future_masks` mark which slots are real: `past_mask` before the
anchor, `future_mask` from the anchor on. `DiffusionPolicy.forward` adds noise only where
`future_mask` is true, and [`vla_foundry/train.py`](../../vla_foundry/train.py) passes `future_mask`
to the masked MSE loss.

[`preprocess_robotics_to_tar.py`](../../vla_foundry/data/preprocessing/preprocess_robotics_to_tar.py)
shuffles all windows and packs them 256 at a time (`--samples_per_shard 256` in
[`make_dataset.sh`](../../sim/pickup/scripts/make_dataset.sh)) into **shards**, tar files read
sequentially by the `webdataset` loader. `shards/manifest.jsonl` lists every shard with its sample
count.

### Statistics

`StreamingDatasetStatistics` accumulates the mean, standard deviation, minimum, maximum and
percentiles of `state` and `action` per channel and writes `shards/stats.json`. `train.sh` passes it
as `--data.dataset_statistics`, and `RoboticsNormalizer` uses it to normalise states and actions;
the default method `std` subtracts the mean and divides by the standard deviation of each channel.

### One instruction per layout

By default each seed yields one episode: the layout with the target that the seed drew. Every
instruction appears many times. What the dataset never contains is one scene with two different
instructions.

Object positions are continuous, so each first frame appears with exactly one instruction and one
trajectory. A function of the image alone, one that has stored which object was picked in each
training scene, fits such data as well as a function that reads the instruction, and only the second
works on a new layout. The data contain no scene in which changing the words changes the motion, so
the training loss cannot tell the two functions apart. This is a statement about what the loss can
distinguish, not about what training finds: a larger dataset with one instruction per layout
produced a policy that goes to the named object ([What we measured](#what-we-measured)).

`collect.py --targets_per_layout N` removes that ambiguity from the loss.
`PickupEnv.reset(seed, target_index=i)` names the layout's `i`-th object as the target, and because
the seed's own target is still drawn first, the layout is identical for every `i`. With `N = 3` the
same scene appears with three instructions and three trajectories. A function of the image alone can
at best produce a mixture of the three ([Flow matching](41-flow-matching.md)); it cannot say which
one is wanted. At the first frame the instruction is the only input that differs between the three
episodes, so a model that uses it reaches a lower loss than any model that does not. The cost is
coverage: 1500 episodes then span about 500 layouts. In the one run measured here that trade did not
pay off at 1M samples.

[`boost_early_windows.py`](../../sim/pickup/boost_early_windows.py) changes the weighting instead.
It copies a preprocessed dataset so that the windows anchored at frames 0 to `--max_frame` (default
7) appear `--repeat` (default 5) extra times. The target is chosen in the first frames; later the
arm's own position already tells which object it is heading for. On a 66-frame episode that turns 8
of 66 windows (12%) into 48 of 106 (45%).

## In this repository

```bash
# writes data/lerobot/<name> and data/preprocessed/<name>, replacing existing ones
sim/pickup/scripts/make_dataset.sh pick_target 1500 pick_target_1500

# each layout with each of its three objects named (extra arguments go to collect.py)
sim/pickup/scripts/make_dataset.sh pick_target 1500 pick_target_1500_multi --targets_per_layout 3

# the multi-target data with early windows repeated
.venv/bin/python -m sim.pickup.boost_early_windows \
    --shards data/preprocessed/pick_target_1500_multi/shards \
    --out data/preprocessed/pick_target_1500_multi_early/shards --max_frame 7 --repeat 5
```

To inspect the first window of a shard:

```bash
.venv/bin/python - <<'EOF'
import io, json, tarfile
import numpy as np

shard = "data/preprocessed/pick_target_1500/shards/shard_000000.tar"
with tarfile.open(shard) as tar:
    members = tar.getmembers()
    key = members[0].name.split(".", 1)[0]  # shared by the files of one window
    files = {m.name.split(".", 1)[1]: tar.extractfile(m).read() for m in members if m.name.startswith(key + ".")}

print(sorted(files))
lowdim = np.load(io.BytesIO(files["lowdim.npz"]))
print({name: lowdim[name].shape for name in lowdim.files})
print(json.loads(files["language_instructions.json"]))
meta = json.loads(files["metadata.json"])
print({k: meta[k] for k in ("episode_index", "frame_index", "anchor_relative_idx")})
EOF
```

It lists seven files: four JPEGs (`front_t-1.jpg` to `wrist_t0.jpg`), `lowdim.npz` (`state` and
`action` of shape `(16, 8)`, two masks of shape `(16,)`), `metadata.json` and
`language_instructions.json`. `anchor_relative_idx` is 1: the anchor is slot 1 of the 16.
`episode_index` and `frame_index` are stored as strings (numpy integers written with `default=str`);
convert with `int()` before comparing, as `boost_early_windows.py` does.

A training config may use less than what is stored:
[`dp_vit_lang_reactive.yaml`](../../sim/pickup/configs/dp_vit_lang_reactive.yaml) sets
`lowdim_past_timesteps: 0` and `image_indices: [0]`. `crop_sequence` in
[`vla_foundry/data/robotics/utils.py`](../../vla_foundry/data/robotics/utils.py) asserts that the
stored window covers the request, so a longer horizon needs a new preprocessing run.

## What we measured

All numbers are from the [lab notebook](../lab-notebook.md).

- **Size and time.** 1500 `pick_target` demonstrations give 98,841 windows, one per recorded frame
  (65.9 per episode). Collecting them took 70 s with 48 simulator processes.
- **The expert.** Through the evaluation loop on 100 unseen `pick_target` layouts it scored 100/100
  on machine B, closing its gripper 5 mm (median) from the object and within 10 mm in 98% of
  episodes, and 99/100 on machine A.

The policy rows are `dp_vit_lang_reactive` on machine B, 100 unseen layouts, given as raw / EMA
weights: raw weights are the ones the optimiser updates, EMA weights an exponential moving average
of them ([The training loop](80-the-training-loop.md)). The named-object rate is the share of
episodes in which the gripper first closed nearest the named object; chance is 33%.

- **One instruction per layout, 1500 demonstrations.** At 1M samples (final checkpoint): success 3%
  / 5%, named-object rate 49% / 41%. In an open-loop test (the policy's prediction is compared with
  the expert's on a recorded first frame; the robot does not move) on 60 layouts at 0.9M samples,
  the policy's first action chunk, the 15 actions predicted from one observation, headed for the
  named object on 35% of training layouts and 48% of unseen ones. The expert's did on 100% of both.
- **Every target demonstrated in each layout.** 1500 episodes collected with
  `--targets_per_layout 3` (500 layouts), same budget: success 0% / 0%, named-object rate 32% / 29%.
- **The same data with early windows repeated.** With the windows of frames 0-7 repeated 5 extra
  times (45% of the windows): success 8% / 15%, named-object rate 52% / 58%. The successes are
  almost all on the can (8/28 raw, 12/28 EMA).
- **One instruction per layout, 4000 demonstrations.** Checkpoints of a run still training toward
  5M samples when the notebook was written, so there is no final result: named-object rate 35% / 32%
  at 1.0M samples and 95% / 98% at 2.0M, where success was 4% / 36%.

The expert numbers show that the task is solvable and that the success test works, not that 1500
demonstrations are enough. The policy rows are single runs; differences of a few percent between
them are noise. At 1500 episodes and 1M samples, demonstrating every target in each layout did not
by itself bring the named-object rate above chance; repeating the early windows of that data did.
Neither comparison isolates one cause: the multi-target dataset also has a third as many layouts.
The 4000-demonstration checkpoints show that one instruction per layout does not prevent a policy
from learning to follow the instruction.

## Where it goes wrong

- **The expert fails and the data hides it.** Failed episodes are dropped silently. Check
  `expert_success_rate` and `expert_attempted` in `meta/info.json`. A low rate means the kept
  episodes over-represent easy layouts, and with `--targets_per_layout 3` some layouts keep fewer
  than three targets.
- **Same seed, different trajectory.** The layout depends only on the seed, but `_worker` creates
  one `ScriptedExpert(env, seed=worker_id)` per chunk of jobs (`main` deals the jobs out as
  `jobs[i::workers]`), and its generator runs on across the episodes of that chunk. The speed,
  heights and placement noise of an episode therefore depend on the number of workers
  (`PICKUP_WORKERS`, default 8) and on how many collection rounds were needed.
- **Only clean passes.** With the default `--disturb_prob 0` no demonstration contains a missed
  grasp followed by a second attempt, so a policy that drifts off the expert's path is in states it
  has no example for ([Imitation learning](43-imitation-learning.md)). `collect.py --disturb_prob`
  records episodes in which the named object is moved once and the expert plans again; no dataset
  made with it was measured here.

## Background and further reading

- Todorov, Erez and Tassa, *MuJoCo: A physics engine for model-based control*, IROS 2012
  ([doi:10.1109/IROS.2012.6386109](https://doi.org/10.1109/IROS.2012.6386109)). The physics
  simulator this environment runs on.
- Buss, *Introduction to Inverse Kinematics with Jacobian Transpose, Pseudoinverse and Damped Least
  Squares methods*, unpublished survey, 2009
  ([PDF](https://mathweb.ucsd.edu/~sbuss/ResearchWeb/ikmethods/iksurvey.pdf)). Explains the step
  used in `solve_ik` next to the alternatives.
- Cadene et al., *LeRobot: An Open-Source Library for End-to-End Robot Learning*, 2026
  ([arXiv:2602.22818](https://arxiv.org/abs/2602.22818)). The paper on the library whose dataset
  layout `collect.py` writes.
- Ross, Gordon and Bagnell, *A Reduction of Imitation Learning and Structured Prediction to
  No-Regret Online Learning*, AISTATS 2011 ([arXiv:1011.0686](https://arxiv.org/abs/1011.0686)).
  DAgger: run the learner, have the expert label the states it reached, add them to the dataset and
  retrain. The standard answer to the "only clean passes" problem above; not implemented here.

## Check yourself

1. Make a small dataset. How many attempts did the expert need for 50 kept episodes, and how many
   shards do you expect at 256 windows per shard?

   ```bash
   sim/pickup/scripts/make_dataset.sh pick_target 50 pick_target_50
   cat data/lerobot/pick_target_50/meta/info.json
   grep -c shard data/preprocessed/pick_target_50/shards/manifest.jsonl
   ```

   The count printed by `make_dataset.sh` is one lower, because the manifest has no final newline
   and the script counts lines with `wc -l`.

2. Collect 50 episodes with three targets per layout; they cover about 17 layouts. In
   `data/lerobot/pick_target_50_multi/meta/episodes.jsonl`, find consecutive lines with the same
   `seed`. State what differs between them and what the first `front` frame of each looks like.

   ```bash
   sim/pickup/scripts/make_dataset.sh pick_target 50 pick_target_50_multi --targets_per_layout 3
   ```

3. An episode has 70 frames. Which anchors give windows with at least one
   copied slot, and how many are there?
