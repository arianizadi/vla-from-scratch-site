---
title: The Route on One Page
part: 0 Orientation
order: 00
summary: Follow the eight-step order of work that takes a robot policy to a measured closed-loop success rate, and say where this repository stands on it.
status: draft
---

# The Route on One Page

A robot policy is a function from camera images, joint state and an instruction to motor commands.
Its training loss can fall whether or not the robot can do the task, so the work needs an order in
which each step makes the next result interpretable. This page is that order: a checklist, then one
paragraph per step.

## The checklist

*Closed-loop* means the policy's own actions produce the next observation; an *open-loop* score
compares predicted actions with recorded ones on recorded observations, where the policy never
meets the consequence of its own error. A *layout* is one random placement of the objects on the
table. A *scripted expert* is a hand-written controller that reads object positions
from the simulator; a *demonstration* is one recorded episode of it. A *token* is one vector in
the sequence a transformer processes; an image becomes tokens by being cut into square *patches*.
The *action head* is the part of the policy that outputs actions, and its *conditioning* is
everything it is given about the scene and the instruction. A *checkpoint* is a copy of the
weights saved during training. A *VLA* is a vision-language-action policy.

| # | Step | Done when | Chapter |
|---|---|---|---|
| 1 | Verify the task with a scripted expert | the expert, run through the evaluation loop, succeeds on nearly every layout | [Demonstrations](70-demonstrations.md) |
| 2 | Judge by closed-loop success | every claim about a policy is a success count on unseen layouts with an interval | [Closed-loop evaluation](90-closed-loop-evaluation.md), [Loss is not success](91-loss-is-not-success.md) |
| 3 | Measure how a policy fails | you know where the gripper closed relative to each object | [Measuring failure](92-measuring-failure.md) |
| 4 | Know the task tolerance | you know how many millimetres of placement error each object forgives | [Measuring failure](92-measuring-failure.md) |
| 5 | Give the action head spatial tokens | it receives one token per image patch, not one vector per image | [Pooled vs patch tokens](21-pooled-vs-patch-tokens.md) |
| 6 | Make sure the instruction reaches it | changing the instruction changes which object the gripper closes at | [What the action head sees](50-what-the-action-head-sees.md) |
| 7 | Keep training and serving preprocessing identical | a test feeds the same sample through both paths and the model receives the same tensors | [Train-inference skew](93-train-inference-skew.md) |
| 8 | Checkpoint, auto-resume, evaluate while training | a run that dies restarts by itself and every checkpoint gets a closed-loop number | [The training loop](80-the-training-loop.md), [Surviving long runs](81-surviving-long-runs.md) |

Steps 1 and 4 need no trained policy. Steps 2 and 3 are the measurements applied to every policy
afterwards; their code (`eval.py`, `GraspProbe`) can be exercised on the expert first. The
[debugging flowchart](94-debugging-flowchart.md) walks the same list from symptom to check.

Machine A has one 24 GB RTX 4090; machine B has 46 GB L40S GPUs. A *sample* is one training
window; training budgets are counted in samples. Two numbers, `3% / 5%`, are for the raw weights
(the trained ones) and the EMA weights (their exponential moving average over training steps).

## What "works" means

A policy **works** on a task when its closed-loop success rate, on layouts it never saw during
training, clears a stated threshold, and the rate is reported with a confidence interval.

- **Success** is a test on the simulator's state: the named object is more than 8 cm above its
  rest height for 10 consecutive control steps, within 200 steps (`LIFT_HEIGHT` and `HOLD_STEPS`
  in `sim/pickup/env.py`).
- **Unseen layouts** come from seeds the demonstrations never used: demonstrations use seeds from
  0, evaluation from 1,000,000.
- **An interval** is the range of true success rates consistent with the count at a stated
  confidence, here 95%. Measured here: `dp_vit` on `pick_cube` (1000 demonstrations, 1.5M samples,
  machine A) succeeded in 37 of 50 episodes, 74%, with a Wilson 95% interval of 60-84%. The Wilson
  interval is used because the simpler rate plus or minus 1.96 standard errors has zero width at
  0/100 and can leave the 0-100% range.

The threshold is a decision, not a measurement. The [roadmap](../roadmap.md) sets it for
`pick_target` at 80% overall with the can and the hex nut above 60%.

## The steps in order

**1. Verify the task with a scripted expert.** If the expert cannot solve the task through the
evaluation loop, then the simulator, the success test or the task is broken, and no policy result
means anything. Measured here: the expert scored 100/100 on `pick_target` on machine B, closing
the gripper 5 mm (median) from the object, and 99/100 on machine A. The final checkpoints of the
learned policies on that task scored between 0% and 15% on 100 layouts, so the fault is in the
policies.

**2. Judge by closed-loop success.** Training loss measures how well the model reproduces expert
actions on expert observations. Measured here on machine A, final checkpoints: the patch-token
policy `dp_vit` of the interval example ended at loss 0.058 and 37/50 on `pick_cube`. On
`pick_target` (1500 demonstrations, 1.0M samples) the same policy, which has no language input,
ended at 0.069 and 1/100, and the from-scratch VLA `vla_custom` at ~0.03 and 0/100. The lowest
loss belongs to the policy that never succeeded.

**3. Measure how a policy fails.** A success rate of 1% does not say whether the gripper went to
the wrong object, missed the right one by a centimetre, or never closed. The gripper position when
it first closes separates these. Measured here on three first-round `pick_target` policies
(machine A, 100 episodes each): all closed the gripper in every episode; the nearest object was
the named one in 29-33% of episodes (the named-object rate), where chance is 33%; the median
distance to the nearest object was 89-110 mm. They had learned the motion and not where to perform
it.

**4. Know the task tolerance.** The tolerance is the placement error at which a grasp still
succeeds; it turns a success target into a precision target. Measured here by adding a fixed
sideways offset in a random direction to the expert's grasp point, 320 episodes per offset, same
seeds on both machines. Can and hex nut are machine A / machine B; cube and T block are identical
on both:

| Offset | Cube | T block | Can | Hex nut |
|---|---|---|---|---|
| 0 mm | 100% | 100% | 94% / 100% | 89% / 100% |
| 10 mm | 99% | 100% | 60% / 94% | 61% / 97% |
| 20 mm | 93% | 98% | 18% / 29% | 25% / 70% |

On machine A a policy that reaches 10 mm can pass on the cube and still fail on the can four times
in ten; on machine B the can holds to 10 mm and falls to 29% at 20 mm. Machine B runs MuJoCo 4.0.1
and machine A an earlier 4.0 build, the one known difference, not isolated as the cause. Measure
the tolerance on the machine you evaluate on.

**5. Give the action head spatial tokens.** The action head sees the scene only through the
conditioning handed to it by the backbone, the network that encodes images and text. A pooled
vector is one embedding for a whole image; patch tokens keep where things are. Worked example from
`sim/pickup/configs/dp_vit_lang.yaml`: two cameras at two time steps are 4 images; each 224-pixel
image cut into 16-pixel patches gives 14 x 14 = 196 tokens; the action head receives 784 patch
tokens plus 32 text slots, `[batch, 816, 256]`. The two VLA recipes (`vla_custom.yaml`,
`vla_qwen.yaml`) append one extra token to the prompt and hand the action head only that token's
hidden states from the last 4 layers, concatenated: `[batch, 1, 4 x width]`. Measured here on
`pick_cube` (machine A), 200 demonstrations and 300k samples each: one pooled vector per image and
one for the text, from CLIP, a pretrained image-text encoder, 2/50 (1-14%); patch tokens from a
small vision transformer trained from scratch, 15/50 (19-44%). The encoder differs too, so one
variable is not isolated.

**6. Make sure the instruction reaches it.** With one object on the table the image is enough.
With three, only the instruction says which one: the patch-token policy without language scored
74% on `pick_cube` and 1/100 on `pick_target` (machine A). The check is the named-object rate from
step 3, which must move away from 33% when the instruction is connected. Connecting it was not
enough by itself: with instruction tokens the rate was 35% / 29% with history (the previous frame,
state and action as inputs) and 49% / 41% without (machine B).

**7. Keep training and serving preprocessing identical.** Train-inference skew is any difference
between the tensors the model receives in training and when served. It raises no error. Measured
here: a vision-language model (VLM) trained on pixel values of 0-255 and served values of 0-1
listed the objects of a held-out scene in the right order in 1 of 300 cases; after the fix, 256.

**8. Checkpoint, auto-resume, evaluate while training.** Measured here: machine A was unreliable;
its runs died or hung several times and were resumed from checkpoints, and a dead data-loader
worker leaves the trainer waiting at 0% GPU. A final number hides the curve: the named-object
rate of `dp_vit_lang_reactive` (raw weights) went 28%, 25%, 34%, 45%, 49% from 0.3M to 1.0M
samples.

## In this repository

<!-- interactive: pipeline -->
*Figure: the loop the checklist runs on. The scripted expert records demonstrations in the MuJoCo
physics simulator; they are converted to shards (tar files of 256 samples);
`vla_foundry/main.py` trains on them and writes checkpoints; a policy server loads a checkpoint
and answers the simulator client, which counts successes.*

| Step | Code | How to run it, or which key controls it |
|---|---|---|
| 1 | [`expert.py`](../../sim/pickup/expert.py) `ScriptedExpert`; [`eval.py`](../../sim/pickup/eval.py) `--expert`, the same loop and success test as for a served policy | the command in "Check yourself", item 1 |
| 2 | `eval.py` `main`; [`env.py`](../../sim/pickup/env.py) `PickupEnv.step` | `sim/pickup/scripts/eval.sh experiments/pickup/<run> pick_target 100` |
| 3 | [`diagnostics.py`](../../sim/pickup/diagnostics.py) `GraspProbe`, `summarize` | the `grasp` block of `results.json`; `.venv/bin/python -m sim.pickup.grasp_map results/pickup/<run>/<task>/results.json` |
| 4 | [`grasp_tolerance.py`](../../sim/pickup/grasp_tolerance.py) | `mkdir -p results/pickup && .venv/bin/python -m sim.pickup.grasp_tolerance --out results/pickup/grasp_tolerance.json` |
| 5 | [`vit_backbone.py`](../../vla_foundry/models/vision_language_backbones/vit_backbone.py) `ViTBackboneWrapper`; [`vlm_foundry_backbone.py`](../../vla_foundry/models/vision_language_backbones/vlm_foundry_backbone.py) `VLMFoundryBackboneWrapper` | `vision_language_backbone.type: vit_backbone`; or `conditioning: all_tokens` with `conditioning_len`, every image and text token instead of one (`vla_custom_tokens.yaml`) |
| 6 | `ViTBackboneWrapper._embed_text` | `text_tokens: 32`, `text_vocab_size: 49280`, `processor: simple_vlm` |
| 7 | [`policy_server.py`](../../sim/pickup/policy_server.py) `Policy.infer` | the regression tests below |
| 8 | `sim/pickup/scripts/train_resilient.sh` (reruns `train.sh` from the newest `checkpoint_*.pt`; kills a run whose log has stalled), `eval_checkpoints.sh` | `PICKUP_STALL_SECONDS`, `PICKUP_NUM_CHECKPOINTS`, `PICKUP_WATCH=1` |

- **Failure probe.** `GraspProbe.update` fires once per episode, at the first action whose gripper
  command (`action[7]`) is below 0.5. It computes the horizontal distance from the gripper (the
  `tcp` site) to every object on the table and stores the distance to the named object, the
  distance to the nearest object and its name, and the table-plane positions of the gripper and
  every object. `summarize` turns the records into rates and medians.
- **Serving.** `Policy.infer` passes a one-sample batch through
  `RoboticsProcessor.process_inputs` and `add_action_and_proprioception_fields`, the two calls the
  training pipeline makes in `vla_foundry/data/pipelines/robotics.py`.

Each of the three skew bugs found here has a regression test:

```bash
.venv/bin/python -m pytest \
    tests/essential/models/test_simple_vlm_processor_scaling.py \
    tests/essential/models/test_vlm_foundry_backbone_conditioning.py \
    tests/essential/data/test_proprioception_past_steps.py
```

None of them feeds one sample through both the training pipeline and `Policy.infer`; that
end-to-end comparison, the "done when" of step 7, is not in the test suite yet.

## What we measured: where `pick_target` stands

`pick_target` is not solved in this repository. The numbers are from the
[lab notebook](../lab-notebook.md), single training runs, so differences of a few percent are
noise. Learned policies: 1500 demonstrations, final checkpoint, 100 unseen layouts, unless the row
says otherwise. Machine B rows are raw / EMA.

| Policy | Machine | Success | Nearest object was the named one |
|---|---|---|---|
| `vla_qwen`, pretrained VLM, one conditioning vector | A | 6/100 | not recorded |
| `vla_custom`, from-scratch VLA, one conditioning vector | A | 0/100 | 33% |
| `dp_vit`, no language, history | A | 1/100 | 32% |
| `dp_vit`, no language, history | B | 0% / 0% | 31% / 37% |
| `dp_vit_reactive`, no language, no history | B | 1% / 1% | 26% / 34% |
| `dp_vit_lang`, instruction tokens, history | B | 3% / 2% | 35% / 29% |
| `dp_vit_lang_reactive`, instruction tokens, no history | B | 3% / 5% | 49% / 41% |
| `dp_vit_lang_reactive`, every layout demonstrated with each of its 3 objects named (500 layouts) | B | 0% / 0% | 32% / 29% |
| that data with the windows of frames 0-7 repeated 5 extra times | B | 8% / 15% | 52% / 58% |
| `dp_vit_lang_reactive`, 4000 demos, checkpoint at 2.0M of 5M samples, run still training | B | 4% / 36% | 95% / 98% |

What is known:

- The from-scratch VLA with one conditioning vector and the patch-token policies without language
  reach the named object at chance. The Qwen VLA never lifted an object other than the named one
  in 150 episodes.
- Instruction tokens moved the named-object rate above chance only without history; the median
  miss to the named object was then 127 / 139 mm, against 175 / 173 mm without language.
- The best finished result, 8% / 15% with the first windows repeated, is almost all on the can
  (8/28 raw, 12/28 EMA), with a median miss to the named object of 113 / 110 mm, far outside the
  tolerance in step 4.
- The 4000-demonstration run moved furthest. It was evaluated by checkpoint while still training
  toward 5M samples. At 1.0M samples it was at chance: 0% / 1% success, 35% / 32% named-object
  rate, 138 / 154 mm median miss. At 2.0M samples the median miss was 32 / 18 mm. 36% success is
  below the 80% threshold, and the final checkpoint has no result yet.

More demonstrations together with more samples bring the gripper to the named object; the two are
not separated, and the gap between raw and EMA weights at 2.0M samples is unexplained.

Still running when the lab notebook was written, so without a final result: the
4000-demonstration / 5M-sample pair (with and without history), the Qwen VLA, a 3M-sample run on
the 1500 demonstrations, the all-token VLA with and without pretraining, and two single-cube
controls. The effect of `conditioning: all_tokens` on success has not been measured.

## Where it goes wrong

| What you see | Why | Check | Do |
|---|---|---|---|
| A comparison comes out equal | neither side can do the task: pretrained VLM 0/100, random-init VLM 1/100, both at chance on the named object | named-object rate of both | fix the shared bottleneck, then compare again |
| Two evaluations of one run disagree | `eval.sh` without `PICKUP_WEIGHTS` serves the EMA weights of a run trained with `--ema.enabled True`; one checkpoint here scored 4% raw, 36% EMA | `server.checkpoint` in `results.json` | set `PICKUP_WEIGHTS=raw` or `ema` |
| A short instruction behaves differently in a batch than alone | `_prepare_inputs_for_action_token` in `vlm_hf_backbone.py` appends the action token after the batch padding; fixed in `vlm_foundry_backbone.py` only | one sample alone against the same sample in a padded batch | to do in the [roadmap](../roadmap.md) |

## Background and further reading

Background, not measured here:

- Ross, *A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning*,
  2010. [arXiv:1011.0686](https://arxiv.org/abs/1011.0686). In imitation learning future
  observations depend on the policy's earlier actions, so training and test inputs do not come
  from one distribution; the paper proposes an iterative algorithm that trains one deterministic
  policy with a guarantee on the observations that policy induces. It is why step 2 distrusts
  training loss.
- Chi, *Diffusion Policy: Visuomotor Policy Learning via Action Diffusion*, 2023.
  [arXiv:2303.04137](https://arxiv.org/abs/2303.04137). Represents a visuomotor policy as a
  conditional denoising diffusion process and executes it with receding-horizon control: predict a
  sequence of actions, execute the first few, predict again. The `dp_*` and `vla_custom*` configs
  here set `type: diffusion_policy` and keep that structure, but all set
  `use_flow_matching_scheduler: true`, so they are trained with
  [flow matching](41-flow-matching.md), not denoising diffusion.
- Kress-Gazit, *Robot Learning as an Empirical Science: Best Practices for Policy Evaluation*, 2024.
  [arXiv:2409.09491](https://arxiv.org/abs/2409.09491). Recommends reporting evaluation
  conditions, statistics and failure modes next to the success rate.
- Wilson, *Probable Inference, the Law of Succession, and Statistical Inference*, 1927.
  [doi:10.1080/01621459.1927.10502953](https://doi.org/10.1080/01621459.1927.10502953). Derives
  the confidence interval for a proportion that `eval.py` reports; its bounds stay between 0
  and 1.
- Mercat, *VLA Foundry: A Unified Framework for Training Vision-Language-Action Models*, 2026.
  [arXiv:2604.19728](https://arxiv.org/abs/2604.19728). The training framework this repository is
  a fork of.

Next: [Setup and first run](01-setup-and-first-run.md).

## Check yourself

1. Run the expert through the evaluation loop and open `results.json`. Which fields tell you the
   task is sound, and which tell you how precisely the expert grasps?

   ```bash
   .venv/bin/python -m sim.pickup.eval --task pick_target --episodes 100 --expert \
       --out results/pickup/expert/pick_target
   ```

2. Reproduce the interval for 37 successes in 50 episodes with the formula in `eval.py`. The result
   should round to 60-84%. Then try `k, n = 148, 200`, the same rate.

   ```bash
   .venv/bin/python -c "
   k, n, z = 37, 50, 1.96
   p, d = k / n, 1 + z*z/n
   c = (p + z*z/(2*n)) / d
   h = z * (p*(1-p)/n + z*z/(4*n*n)) ** 0.5 / d
   print(round(c - h, 3), round(c + h, 3))"
   ```

3. `sim/pickup/configs/dp_vit_lang_reactive.yaml` sets `image_indices: [0]`. How many conditioning
   tokens does its action head receive? Use two cameras, one frame each, 196 patches per image and
   32 text slots.
