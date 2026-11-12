---
title: What an Action Is
part: 4 Actions and policies
order: 40
summary: Read an 8-number action of the pick-up simulator, convert a joint error in radians into millimetres at the gripper, and explain how actions are normalised for training.
status: draft
---

# What an Action Is

A policy does not move a robot. It outputs a short vector of numbers several times a second, and a
controller underneath turns each vector into motor torques. What those numbers mean (which
quantities, relative to what, how often) is the action space, and it decides how precise the
policy's output has to be before any model is chosen.

## The idea

An **action** is the command applied for one control step, one tick of the control clock, 50 ms in
this simulator. An episode starts with an 8-number command close to the arm's home pose, gripper
open: `PickupEnv.reset` in [`env.py`](../../sim/pickup/env.py) writes `HOME_Q` plus a random
offset (normal, standard deviation 0.03 rad per joint) to `data.ctrl[:7]` and 255 to
`data.ctrl[7]`. Without the offset it reads:

```text
index     0     1     2     3          4     5         6         7
value     0.0   0.0   0.0   -1.57079   0.0   1.57079   -0.7853   1.0
meaning   position targets for joints 1 to 7, in radians         gripper: 1 open, 0 closed
```

Five choices are packed into that vector.

| Choice | Options | This simulator |
|---|---|---|
| What the arm numbers are | joint positions, or the pose (position and orientation) of the end effector, the gripper | 7 joint positions |
| Relative to what | absolute targets, or deltas (changes) from the previous command or the current state | absolute |
| Gripper | a width, an open/close bit, a force | one number in [0, 1] |
| Control rate | background: 3 Hz (RT-1) to 50 Hz (ACT, π0) in the systems cited below | 20 Hz |
| Controller underneath | position, velocity or torque | position servo (drives each joint toward a target angle), 25 physics steps per action |

**Joint positions or end-effector pose.** A joint-position action names an angle for each joint;
the motors execute it directly, and it is specific to this arm. An end-effector action names where
the gripper should be, which is closer to the task: an object at x = 0.50 m is grasped at
x = 0.50 m whatever the arm. It must be converted at run time by inverse kinematics (IK): finding
joint angles that put the gripper at a given pose.

This repository uses both. The scripted expert plans in end-effector space, and
`ScriptedExpert.solve_ik` in [`expert.py`](../../sim/pickup/expert.py) converts every set-point
(the gripper position the plan asks for at that step) to joint angles with damped least squares,
an iterative IK method, plus a pull toward `HOME_Q`, because a 7-joint arm reaches one pose with
many configurations. The recorded action is the joint result. The policy needs no IK, and has to
learn the arm's geometry from data: "1 cm to the left" is a different change of seven numbers at
every place on the table.

**Absolute or delta.** Suppose each predicted value for joint 1 is wrong by an independent error
with a standard deviation of 0.01 rad. With absolute targets the command is wrong by 0.01 rad at
every step and no more. If the action were a change added to the previous command, the errors would
sum: after 40 steps the standard deviation is $0.01 \times \sqrt{40} = 0.063$ rad, and errors all
in one direction give $40 \times 0.01 = 0.4$ rad. A delta against the measured state does not
accumulate, but its meaning depends on that state. In return, deltas are small and have the same
range wherever the arm is.

## How it works

### One control step

`PickupEnv.step` does four things with an action:

1. Clips `action[:7]` to the arm actuators' control ranges (`ctrl_lo`, `ctrl_hi`, read from the
   model) and writes it to `data.ctrl[:7]`.
2. Clips `action[7]` to [0, 1], multiplies by 255 and writes it to `data.ctrl[7]`.
3. Calls `mujoco.mj_step` `SUBSTEPS` = `round(1 / (CONTROL_HZ * TIMESTEP))` =
   `round(1 / (20 * 0.002))` = 25 times: 25 physics steps of 2 ms, 50 ms.
4. Stores the clipped command as `last_action`, checks whether the target object is lifted, and
   returns the next observation. The clipping is silent: compare `last_action` with the policy's
   raw output.

The target is held during those substeps while the actuator model moves the arm. Background, from
the Franka Panda model in MuJoCo Menagerie, which `sim/pickup/scripts/fetch_assets.sh` downloads
at a pinned commit: each arm actuator applies a torque of
$k_p (\text{target} - q) - k_v \dot q$, with $k_p$ = 4500, 4500, 3500, 3500, 2000, 2000, 2000
N·m/rad for joints 1 to 7 and $k_v$ a tenth of that. The gripper actuator pulls the mean finger
position toward `0.04 * ctrl / 255` metres with a stiffness of 100 N/m; at 255 the fingers are
80 mm apart.

The **state** is what the arm reports back: `PickupEnv.state` returns the 7 measured joint angles
`qpos[:7]` and the gripper opening `(qpos[7] + qpos[8]) / 0.08`, a fraction of the 80 mm span.
It has the action's 8 slots but says where the arm is, not where it is told to go. The two differ.
The damping term makes the position trail a steadily moving target by about $k_v / k_p$ = 0.1 s of
motion, two control steps (an estimate that ignores inertia and torque limits). At rest a gap
remains: that model file has no gravity compensation, so a servo of this form holds the arm up
only by being off target.

The policy is not called at every control step. `sim/pickup/eval.py` executes 8 actions of each
predicted chunk (the 15 future actions one policy call returns) by default (`--exec_horizon`), so
the policy sees the scene every 0.4 s ([Chunks and execution](42-chunks-and-execution.md)).

### What 0.01 rad means at the gripper

A small error $\delta$ in one joint moves the gripper along an arc of length about $L\delta$, where
the lever arm $L$ is the distance from that joint's axis to the grasp point between the fingers:
the `tcp` site, a marker for the tool centre point that `build_model` adds 0.1034 m along the
hand's axis. The lengths below are an estimate from geometry, not a measurement: worked out from
the link offsets in the Menagerie model for a top-down grasp of the cube 0.50 m straight in front
of the base, with the elbow where an IK like the expert's leaves it.

| Joint | Axis | Lever arm | Gripper motion for 0.01 rad |
|---|---|---|---|
| 1, base | vertical, through the base | 0.50 m (0.38 to 0.66 m over the spawn area) | 5.0 mm sideways (3.8 to 6.6 mm) |
| 2, shoulder | horizontal, 0.333 m above the table | $\sqrt{0.50^2 + 0.31^2}$ = 0.59 m | 5.9 mm: 3.1 mm along the reach, 5.0 mm in height |
| 3 | along the upper arm | 0.59 m | 5.9 mm sideways |
| 4, elbow | horizontal | 0.62 m | 6.2 mm: 5.5 mm along the reach, 2.8 mm in height |
| 5 | along the forearm | 0.02 m | 0.2 mm |
| 6, wrist | 0.088 m beside the gripper's axis, 0.21 m above the grasp point | 0.23 m | 2.3 mm |
| 7 | the gripper's own axis | 0 | none; the fingers turn by 0.57° |

So 0.01 rad on any of joints 1 to 4 is 5 to 6 mm at the gripper, and 0.02 rad 10 to 12 mm. Exact
lever arms are the column lengths of the position Jacobian that `mujoco.mj_jacSite` returns for
the `tcp` site, as in `solve_ik`.

### The gripper channel

The expert's gripper command takes two values: 1.0 for the approach and descent waypoints, 0.0 for
close and lift (`ScriptedExpert._plan`). The model's output for that channel is a real number;
`PickupEnv.step` clips it to [0, 1] and uses every value in between. As an estimate from geometry:
the cube's collision box is 45 mm wide and the fingers span 80 mm, so a command over 45/80 = 0.56
asks for an opening wider than the cube and presses on nothing. Below that the actuator's closing
force, shared by the two fingers, grows in proportion: 100 N/m × (22.5 mm − 40 mm × command),
2.25 N at a command of 0 and 0.25 N at 0.5. A half-closed command barely squeezes the cube.

### Which action belongs to which frame

The collection loop in [`collect.py`](../../sim/pickup/collect.py) (`_worker`, abridged) fixes the
pairing:

```python
action = expert.act()
for c in CAMERAS:
    frames[c].append(_jpeg(obs[c]))
states.append(obs["state"])
actions.append(action)
obs, done, info = env.step(action)
```

Row `t` of an episode holds the images and state observed at step `t` and the command applied
after observing them. `state[t+1]` is the result of `action[t]`, 50 ms later. With absolute
targets, consecutive rows are nearly the same: the expert's set-point moves at most
`0.40 * 1.2 / 20` = 24 mm per step (see [Imitation learning](43-imitation-learning.md)).

### Normalisation

Normalisation rescales every channel of state and action before the model sees it and reverses
that on the model's output. With the settings used here, for channel $i$ with mean $\mu_i$ and
standard deviation $\sigma_i$:

$$s_i = \max(\sigma_i, \epsilon), \qquad \tilde a_i = \frac{a_i - \mu_i}{s_i}, \qquad a_i = \tilde a_i \, s_i + \mu_i$$

A training sample is a window: 16 consecutive steps of an episode (1 past, the current one, 14
future), one slot per step. Windows that run past either end of an episode are padded and the
padded slots are masked. A batch of action windows under `dp_vit.yaml` has shape `[64, 16, 8]`.
`RoboticsNormalizer._compute_normalization_params` returns a centre and a scale of shape `[8]`
(the `mean` and `std` of the field in `stats.json`, the scale clamped to at least `epsilon`),
which `normalize_tensor` and `denormalize_tensor` broadcast as `[1, 1, 8]`.

**What the statistics are computed over.** Windows, not episodes. `StreamingDatasetStatistics` in
`vla_foundry/data/preprocessing/robotics/preprocess_statistics.py` accumulates a mean and a
variance per slot, skipping masked slots, and merges the 16 slots into one `mean` and one `std`
per channel. A step in the middle of an episode lies in 16 windows and is counted 16 times; the
first step is counted twice.

**Scope and anchor.** `scope: global` uses one mean and one standard deviation per channel for all
16 slots and ignores `anchor_timestep`. `scope: per_timestep` uses one row of statistics per
slot, and `anchor_timestep` says which row of a shorter tensor is "now", so that it meets row
`lowdim_past_timesteps` of the tables. If the tensor has more steps before or after its anchor
than the tables hold, `normalize_tensor` raises a `ValueError` and `denormalize_tensor` clamps the
slice instead.

**Why training needs it.** No run here trained without normalisation; this is an argument from the
mechanism. `DiffusionPolicyBatchHandler.prepare_inputs` in `vla_foundry/models/batch_handlers.py`
draws `torch.randn_like(batch["actions"])`, noise with unit variance in every channel, and
`prepare_inputs_and_targets` sets the training target to `noise - actions`
([Flow matching](41-flow-matching.md)). Raw joint 4 starts at -1.57 rad (`HOME_Q[3]`). A channel
that moves a little around a large offset is, next to unit noise, almost a constant. The loss has
a related problem: `masked_mse_loss` in `vla_foundry/losses.py` averages squared errors over the
8 channels, so a channel's weight grows with the square of its raw spread. If joint 1's targets
had a standard deviation of 0.2 rad and the gripper command 0.5 (illustrative values; read the
real ones from `stats.json`), an error of one tenth of a channel's spread would cost
$(0.05/0.02)^2 \approx 6$ times more on the gripper than on joint 1. After normalisation it costs
the same on every channel, and 0.01 rad on joint 1 is 0.05 units.

## In this repository

| What | Where |
|---|---|
| Action, state, rate | `sim/pickup/env.py`: `PickupEnv.step`, `PickupEnv.state`, `CONTROL_HZ`, `SUBSTEPS` |
| Window of 16 steps | `sim/pickup/configs/preprocess.yaml`: `past_lowdim_steps: 1`, `future_lowdim_steps: 14` |
| Normaliser, settings | `vla_foundry/data/robotics/normalization.py`: `RoboticsNormalizer`; `vla_foundry/params/robotics/normalization_params.py`: `NormalizationParams` |

`NormalizationParams` defaults to `enabled: True`, `method: "std"`, `scope: "global"`,
`epsilon: 1e-8`, and no file in `sim/pickup/configs/` overrides them. They are set under
`data.normalization`; the other methods are `percentile_5_95`, `percentile_1_99` and `min_max`.
`init_shared_attributes` sets the normalised fields to
`data.proprioception_fields + data.action_fields`: `state` and `action` here.

`RoboticsProcessor.process_inputs` normalises those fields with
`anchor_timestep = data_params.lowdim_past_timesteps`. `Policy.infer` in
`sim/pickup/policy_server.py` calls `denormalize_tensor` on the model's output and returns
`out[0, self.past:]`, shape `[15, 8]`, in raw units.

```bash
sim/pickup/scripts/make_dataset.sh pick_cube 1000 pick_cube_1k   # writes stats.json
```

## What we measured

The lab notebook has no experiment on the action space itself, only the error the task forgives:
the scripted expert with a fixed sideways offset added to its grasp point, random direction, 320
episodes per offset, the same seeds on both machines. The table is machine B (MuJoCo 4.0.1). The
last column is an estimate, not a measurement: the offset as an error of the base joint target at
0.50 m.

| Offset | Cube | T block | Can | Hex nut | Base joint error, estimated |
|---|---|---|---|---|---|
| 0 mm | 100% | 100% | 100% | 100% | 0 |
| 5 mm | 97% | 100% | 99% | 99% | 0.01 rad |
| 10 mm | 99% | 100% | 94% | 97% | 0.02 rad |
| 20 mm | 93% | 98% | 29% | 70% | 0.04 rad |
| 30 mm | 32% | 76% | 3% | 15% | 0.06 rad |

On machine A (an earlier MuJoCo 4.0 build) the cube and T block columns are identical and the can
and hex nut are much lower: 94% and 89% at 0 mm, 60% and 61% at 10 mm, 18% and 25% at 20 mm. The
simulator build is the one known difference; it has not been isolated as the cause.

<!-- interactive: tolerance -->
*Figure: grasp success against the sideways offset of the grasp point, one curve per object. On
machine B all four objects are at 94% or more up to 10 mm; at 20 mm the hex nut is at 70% and the
can at 29%.*

Through the evaluation loop on `pick_target`, the expert succeeded on 100/100 layouts on machine B
and closed the gripper 5 mm (median) from the object, 98% within 10 mm.

This shows that the budget depends on the object and on the simulator build: about 2 cm (0.04 rad
on the base joint) for the cube and the T block on both machines; for the can and the hex nut
between 1 and 2 cm on machine B and under 1 cm on machine A. It does not show that the learned
policies failed for lack of precision. In the first round on `pick_target` (machine A, 100
episodes per policy) the three policies whose first gripper closing was recorded closed 174 to 185
mm (median) from the named object. At 0.50 m that is roughly 0.35 to 0.37 rad of base-joint error
(the same estimate), far outside any row of the table.

## Where it goes wrong

- **A channel that never varies.** Its `std` is 0 and `_compute_normalization_params` clamps the
  scale to `epsilon` = 1e-8, so the first value that deviates becomes an enormous normalised
  number; expect a loss that jumps or turns NaN. Check the smallest entry of `std` in
  `stats.json`. Raise `data.normalization.epsilon` or drop the channel.
- **Outputs cut at ±3.** `FlowMatchingScheduler.add_noise` and `step` in
  `vla_foundry/models/diffusion/noise_scheduler_diffusers.py` clamp to `clamp_range`, `[-3, 3]` in
  the `diffusion_policy.yaml` preset: three standard deviations in normalised units. A command
  further out cannot be produced, so a joint would stop short of an extreme pose the
  demonstrations reach. Check `(max - mean) / std` and `(min - mean) / std` per channel in
  `stats.json`; if either exceeds 3 in size, widen `model.noise_scheduler.clamp_range`.
- **Off by one step.** Pairing `action[t]` with the state at `t+1` leaks the action into the input,
  because that state is the result of the action. The lab notebook records one such bug:
  `lowdim_past_timesteps or default` treated 0 as unset, and with 0 past steps the proprioception
  input (the robot's own state, fed to the model) contained the state one step in the future. An
  `is None` check fixed it.

## Background and further reading

- Chi, *Diffusion Policy*, 2023, <https://arxiv.org/abs/2303.04137>. Reports better results
  with position targets than with velocity commands.
- Zhao, *Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware* (ACT), 2023,
  <https://arxiv.org/abs/2304.13705>. Absolute joint-position targets, 14-D, at 50 Hz, tracked by
  the motors' own PID controllers.
- Brohan, *RT-1*, 2022, <https://arxiv.org/abs/2212.06817>. End-effector actions (x, y, z, roll,
  pitch, yaw, gripper opening) plus three base dimensions, each discretised into 256 uniform bins,
  and a three-way mode switch, at 3 Hz.
- Black, *π0*, 2024, <https://arxiv.org/abs/2410.24164>. Generates chunks of 50 actions by flow
  matching, for control at up to 50 Hz.
- MuJoCo Menagerie, Franka Emika Panda model,
  <https://github.com/google-deepmind/mujoco_menagerie/tree/98a70c569c4c1b6da467a20012f766ee1f8dc521/franka_emika_panda>.
  The link offsets, actuator gains and limits used above, at the commit `fetch_assets.sh` pins.

## Check yourself

1. An object lies at x = 0.62 m, y = 0.22 m. Work out the sideways motion of the gripper for an
   error of 0.03 rad in the base joint target, and read from the table which objects would still
   usually be picked up.
2. Print, per step, the gap between each of the 8 targets and its measured value (needs the
   fetched assets and a MuJoCo renderer):

   ```bash
   .venv/bin/python - <<'EOF'
   import numpy as np
   from sim.pickup.env import PickupEnv
   from sim.pickup.expert import ScriptedExpert

   env = PickupEnv("pick_cube")
   env.get_obs = lambda: {"state": env.state()}  # skip rendering
   expert = ScriptedExpert(env)
   env.reset(seed=0)
   expert.reset()
   done = False
   while not done:
       action = expert.act()
       obs, done, info = env.step(action)
       print(env.steps, np.abs(action - obs["state"]).round(3))
   EOF
   ```

   Which joint has the largest gap while the arm is still, and what is the gripper's gap while
   the cube is held?
3. After `make_dataset.sh`, express 0.01 rad on each joint in normalised units:

   ```bash
   .venv/bin/python -c "import json; s = json.load(open('data/preprocessed/pick_cube_1k/shards/stats.json'))['action']; print(s['mean']); print(s['std'])"
   ```
