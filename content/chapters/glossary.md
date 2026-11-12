---
title: Glossary
part: Appendix
summary: Look up any term the chapters define and find the chapter that introduces it.
status: draft
---

# Glossary

Every term the chapters define, in alphabetical order. Each entry uses the wording of the chapter
that defines the term most precisely and links to the chapter that introduces it; "also" lists
chapters that define it again or use it in another sense. Numbers in an entry are properties of
this repository's code and configs as the chapters state them, not measurements; measurements are
in the [lab notebook](../lab-notebook.md).

Four words carry more than one meaning across the chapters. They are marked **(two senses)** below:
*action token*, *open-loop*, *probe* and *sample*. *Step* has three: see *control step*, *flow
steps* and *step*.

## A

**Action.** The command applied for one control step. In the pick-up simulator it is 8 numbers:
7 joint position targets and a gripper command (1 = open, 0 = closed).
[40 What an Action Is](40-action-spaces.md).

**Action chunk.** A short sequence of future actions that a policy predicts in one forward pass,
instead of one action per observation; 15 actions, shape `[15, 8]`, in the configs here.
Introduced in [01 Setup and a First Run](01-setup-and-first-run.md), explained in
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md).

**Action head.** The network that turns the backbone's output into actions. In this repository it
is a second, non-causal transformer that receives the conditioning, the robot state and a noisy
action sequence and predicts how to remove the noise.
[02 From Language Models to Robot Policies](02-how-we-got-here.md); also
[03 The Model Families Today](03-the-landscape.md), [60 Anatomy of a VLA](60-anatomy-of-a-vla.md).

**Action token (two senses).** (1) One extra token added to a VLM's vocabulary and appended to the
prompt; only its hidden states are handed to the action head. Chapters 60 and 93 call the same
token the *probe token*. (2) In the action head's own sequence, the tokens that stand for actions,
one per control step: the previous action, given clean, then the noisy chunk being generated.
[50 What the Action Head Sees](50-what-the-action-head-sees.md).

**AdamW.** The optimiser used here. Adam keeps two running averages per weight, of the gradient and
of its square, and divides the first by the square root of the second; AdamW adds weight decay
applied to the weights directly instead of through the gradient.
[13 Training a Language Model](13-training-a-language-model.md).

**Anchor.** The current step of a training window: the frame a window is cut around. With one past
step it is slot 1 of the window's 16 rows.
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md); also
[70 Demonstrations](70-demonstrations.md).

**Attention.** The operation that lets every position in a sequence read from other positions: a
query vector from one token is scored against a key vector from every token with a dot product, and
the value vectors are mixed with weights given by the softmax of those scores.
[11 The Transformer Block](11-the-transformer-block.md).

**Attention mask.** A tensor of the same shape as a padded batch of token ids, with 1 for real
tokens and 0 for padding. [10 Text Becomes Tokens](10-tokens.md).

**Attention pooling.** Making one vector from many tokens with one extra attention layer that has a
single query, giving a weighted average whose weights depend on the content.
[21 One Vector or Many Tokens](21-pooled-vs-patch-tokens.md).

**Autocast.** PyTorch's switch for mixed precision: inside the context, operations on its 16-bit
list run in bf16 and those on its float32 list in float32.
[13 Training a Language Model](13-training-a-language-model.md).

**Autoregressive.** Describes a model that predicts each token from the tokens before it, as a
language model produces text. [03 The Model Families Today](03-the-landscape.md); also
[14 Generating Text](14-generation.md).

## B

**Backbone.** The network that reads the observation and turns images and text into vectors: a
vision transformer, CLIP, or a vision-language model.
Introduced in [00 The Route on One Page](00-the-route.md); also
[03 The Model Families Today](03-the-landscape.md), [60 Anatomy of a VLA](60-anatomy-of-a-vla.md).

**Behaviour cloning.** Supervised learning on demonstrations: a policy is fitted to the recorded
pairs of observation and expert action.
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md).

**bfloat16 (bf16).** A 16-bit floating-point format with the exponent range of float32 and 8
significant bits instead of 24. [13 Training a Language Model](13-training-a-language-model.md).

**Binomial distribution.** The distribution of the number of successes in $n$ independent trials
that each succeed with probability $p$; the count of successful episodes follows it.
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Byte-pair encoding (BPE).** The usual way to build a subword vocabulary: start from single
characters and repeatedly merge the most frequent adjacent pair into a new token.
[10 Text Becomes Tokens](10-tokens.md).

## C

**Caption.** A text that describes an image; a VLM is trained on pairs of an image and a caption.
[31 Training a VLM](31-training-a-vlm.md).

**Causal.** Describes a model in which each position attends only to itself and to earlier
positions. [10 Text Becomes Tokens](10-tokens.md).

**Causal mask.** What enforces that: before the softmax, the score from any query to a later key is
set to minus infinity, so its weight is exactly 0.
[11 The Transformer Block](11-the-transformer-block.md).

**Chat template.** A small program stored with the tokenizer that turns a list of messages into one
string, inserting the special tokens the model was trained with.
[10 Text Becomes Tokens](10-tokens.md).

**Checkpoint.** The training state saved to disk, from which training can continue: the model
weights and the position in the data (`checkpoint_N.pt`) and the optimiser state
(`optimizer_N.pt`). Chapters 31 and 90 use the word for the saved weights alone.
[01 Setup and a First Run](01-setup-and-first-run.md); also
[81 Surviving Long Runs](81-surviving-long-runs.md).

**Checkpoint interval.** The slice of the training budget, counted in samples, after which the
state is saved. [80 The Training Loop](80-the-training-loop.md).

**Class token.** A learned extra vector put in front of the patch sequence before the first
transformer block; its final state stands for the whole image.
[21 One Vector or Many Tokens](21-pooled-vs-patch-tokens.md).

**Closed-loop.** Describes a policy running on its own outputs: each action changes what the
cameras see next, so small errors feed back into the input.
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md); also
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md).

**Closed-loop evaluation.** Running a policy inside the simulator, where every action it outputs
changes the next observation it receives, and counting how many attempts end in success.
Introduced in [01 Setup and a First Run](01-setup-and-first-run.md), explained in
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Compounding error.** In behaviour cloning, the growth of error over an episode: a small error in
one action moves the arm off the demonstrated path, the next observation is unlike anything in the
data, the next prediction is worse, and the arm moves further off.
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md).

**Conditioning.** What the backbone hands to the action head: a tensor `[B, N, D]` of `N` vectors
of width `D` per sample, which the head reads but does not predict. Chapter 50 defines it more
widely, as everything the action head is given besides the noisy actions (the noise level and the
robot's state included). Introduced in [00 The Route on One Page](00-the-route.md), defined in
[60 Anatomy of a VLA](60-anatomy-of-a-vla.md); also
[21 One Vector or Many Tokens](21-pooled-vs-patch-tokens.md),
[50 What the Action Head Sees](50-what-the-action-head-sees.md).

**Confidence interval (95%).** A range computed by a procedure that contains the true rate in about
95% of repeated evaluations. Introduced in [00 The Route on One Page](00-the-route.md), explained in
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Control.** In an experiment, a second run identical in every respect except the one under test.
[62 The From-Scratch Path](62-the-from-scratch-path.md).

**Control step.** One tick of the control clock, during which one action is applied: 50 ms in this
simulator, which runs at 20 Hz. [40 What an Action Is](40-action-spaces.md).

**Counterfactual test.** A test that changes one input, holds the rest fixed, and states in advance
what the output must do. [93 Train and Inference Must See the Same Thing](93-train-inference-skew.md);
also [32 Testing a VLM](32-testing-a-vlm.md).

**Covariate shift.** A change in the distribution of inputs between training and use, while the
correct output for each input stays the same.
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md).

**Cross-attention.** In the systems chapter 02 surveys, attention from text tokens to image
tokens. [02 From Language Models to Robot Policies](02-how-we-got-here.md).

**Cross-entropy.** The language-model loss: the negative logarithm of the probability the model
gave to the token that actually followed, averaged over the scored positions.
[13 Training a Language Model](13-training-a-language-model.md).

## D

**Delta action.** An action given as a change from the previous command or the current state, as
opposed to an absolute target; the simulator here uses absolute targets.
[40 What an Action Is](40-action-spaces.md).

**Demonstration.** One recorded episode of the task done correctly: at every control step, what
the robot observed and the command that was sent next.
Introduced in [00 The Route on One Page](00-the-route.md), explained in
[70 Demonstrations](70-demonstrations.md).

## E

**EGL.** An interface that creates an OpenGL context on the GPU without a display; the simulator
renders through it. [01 Setup and a First Run](01-setup-and-first-run.md).

**Embedding table.** A matrix of shape `[vocabulary size, width]` with one row per vocabulary
entry; the model turns a token id into a vector by reading that row.
[10 Text Becomes Tokens](10-tokens.md).

**Embodiment.** One robot body with its own cameras and action space.
[02 From Language Models to Robot Policies](02-how-we-got-here.md).

**End-effector action.** An action that names where the gripper should be (its pose), instead of an
angle for each joint; it has to be converted to joint angles by inverse kinematics.
[40 What an Action Is](40-action-spaces.md).

**End-of-sequence token (EOS).** A special token that marks the end of a text; generation stops
when the model emits it. [14 Generating Text](14-generation.md).

**Episode.** One attempt at the task from a fresh scene.
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Epoch.** One pass over the dataset. [01 Setup and a First Run](01-setup-and-first-run.md); also
[80 The Training Loop](80-the-training-loop.md).

**Execution horizon.** The number $k$ of actions a chunked policy executes out of the $H$ it
predicts before it predicts again.
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md).

**Exponential moving average (EMA).** A second copy of the model's weights that is never trained
directly: after every optimiser step each of its weights moves a small fraction toward the trained
weight. Introduced in [00 The Route on One Page](00-the-route.md), explained in
[80 The Training Loop](80-the-training-loop.md).

## F

**Falsy.** In Python, treated as false in a condition; 0 is falsy, so `0 or 1` is `1`.
[93 Train and Inference Must See the Same Thing](93-train-inference-skew.md).

**Feed-forward network.** The sublayer of a transformer block that applies a non-linear
transformation to each position on its own. [11 The Transformer Block](11-the-transformer-block.md).

**Fine-tuning.** Continuing training from pretrained weights on a new task.
[02 From Language Models to Robot Policies](02-how-we-got-here.md).

**Flow matching.** The way the action head here generates actions: a demonstrated action is mixed
with noise along a straight line, the network is trained to output the direction from the action to
the noise, and sampling starts from pure noise and follows the predicted direction back in small
steps. Each call draws one sample, so several valid actions are not averaged into one.
Introduced in [02 From Language Models to Robot Policies](02-how-we-got-here.md), explained in
[41 Generating Actions with Flow Matching](41-flow-matching.md).

**Flow steps.** The number of integration steps the action sampler takes from noise to actions
(`--flow_steps`). [41 Generating Actions with Flow Matching](41-flow-matching.md); also
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md).

**Freeze.** To exclude a part's weights from the update; frozen weights are not updated.
[02 From Language Models to Robot Policies](02-how-we-got-here.md); also
[31 Training a VLM](31-training-a-vlm.md).

## G

**Gradient clipping.** Measuring the length (L2 norm) of all gradients taken as one vector and, if
it exceeds a limit, scaling every gradient down by the same factor, which keeps the direction.
[13 Training a Language Model](13-training-a-language-model.md).

**Greedy decoding.** Generating text by taking the highest-scoring token at every step; the same
prompt always gives the same text. [14 Generating Text](14-generation.md).

## H

**Head (attention).** One of the equal pieces the query, key and value vectors are cut into; each
has its own score table, so heads can attend to different tokens from the same position.
[11 The Transformer Block](11-the-transformer-block.md).

**Held-out inputs.** Inputs not used in training. [32 Testing a VLM](32-testing-a-vlm.md).

**Hidden state.** The vector a block outputs at a position.
[30 Joining Vision and Language](30-joining-vision-and-language.md).

**History (policies with and without).** A policy with history receives the frames and states at
$t-1$ and $t$ and the previous action; a policy without history (the `*_reactive` configs) receives
one frame per camera, the current state and no previous action.
Introduced in [00 The Route on One Page](00-the-route.md), explained in
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md).

## I

**Id (token id).** A token's index in the vocabulary. [10 Text Becomes Tokens](10-tokens.md).

**Initialisation.** The set of values the weights hold before a run starts: random numbers, or the
result of pretraining. [62 The From-Scratch Path](62-the-from-scratch-path.md).

**Invariant.** A property that must hold for every input, such as "the conditioning of a sample is
a function of that sample only".
[93 Train and Inference Must See the Same Thing](93-train-inference-skew.md).

**Inverse kinematics (IK).** Finding joint angles that put the tool centre point at a wanted pose.
[40 What an Action Is](40-action-spaces.md); also [70 Demonstrations](70-demonstrations.md).

## K

**Key-value cache (KV cache).** A store, for every layer, of the keys and values of all tokens
processed so far, which lets generation process one new token at a time.
[14 Generating Text](14-generation.md).

## L

**Language prior.** What a model can predict about text from text alone.
[32 Testing a VLM](32-testing-a-vlm.md).

**Latency.** The time between capturing an observation and having the chunk computed from it.
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md).

**LayerNorm.** A normalisation that rescales each token's vector to zero mean and unit variance
across its features, then applies a learned gain and bias per feature.
[11 The Transformer Block](11-the-transformer-block.md).

**Layout.** Everything that defines the scene of an episode: the arm's starting pose, which objects
are on the table, where they lie, and which one the instruction names. Here a layout is generated
from one integer seed. Introduced in [00 The Route on One Page](00-the-route.md), defined in
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Liveness signal.** Something visible from outside a training run that changes only while training
makes progress; here, the training log. [81 Surviving Long Runs](81-surviving-long-runs.md).

**Lockfile.** The file (`uv.lock`) that records the exact version of every dependency, so that
every install is the same. [81 Surviving Long Runs](81-surviving-long-runs.md).

**Logits.** The unnormalised scores, one per vocabulary entry, that the final linear layer
produces; a softmax turns them into probabilities.
[11 The Transformer Block](11-the-transformer-block.md); also
[14 Generating Text](14-generation.md).

**Low-dimensional (lowdim).** The framework's name for the small arrays of a sample, here the 8-D
state and the 8-D action, as opposed to images.
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md); also
[70 Demonstrations](70-demonstrations.md).

## M

**Mean pooling.** Making one vector from many by averaging the patch tokens (or the cells of a
convolutional feature map). [21 One Vector or Many Tokens](21-pooled-vs-patch-tokens.md).

**Mixed precision.** Doing most of the forward and backward arithmetic in a 16-bit number format
and keeping the numerically sensitive parts in 32 bits.
[13 Training a Language Model](13-training-a-language-model.md); also
[80 The Training Loop](80-the-training-loop.md).

**Mode.** One peak of a distribution that has several separate peaks.
[41 Generating Actions with Flow Matching](41-flow-matching.md).

**Multimodal.** Describes a distribution with several separate peaks, such as the demonstrated
actions for an observation that allows more than one correct motion. (Not "several input types".)
[41 Generating Actions with Flow Matching](41-flow-matching.md); also
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md).

## N

**Named-object rate.** The share of episodes in which the object nearest the gripper, when it first
closed, was the one the instruction named; chance is 33% with three objects on the table. The lab
notebook's column is "Closed at the named object" and the key in `results.json` is
`closed_nearest_is_target_rate`. [00 The Route on One Page](00-the-route.md); also
[92 Measuring How a Policy Fails](92-measuring-failure.md).

**Normalisation (of actions and state).** Rescaling every channel of state and action before the
model sees it, here by the channel's mean and standard deviation, and reversing that on the model's
output. [40 What an Action Is](40-action-spaces.md).

## O

**Offset (between positions).** From a key to a query: the query's position minus the key's
position; negative when the key comes later. [12 Telling Tokens Where They Are](12-positions.md).

**Open-loop (two senses).** (1) Of a check: the policy is fed recorded expert observations and its
output is compared with the recorded actions; the predictions are never executed, so an error
cannot change what the policy sees next.
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md); also
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md),
[91 Loss Is Not Success](91-loss-is-not-success.md). (2) Of execution: between two predictions the
robot follows the chunk without looking.
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md).

**Optical axis.** The direction a camera looks along; depth is the distance along it.
[31 Training a VLM](31-training-a-vlm.md).

## P

**p-value.** For the sign test on paired evaluations: the probability of a split at least as
lopsided as the observed one if each disagreement were equally likely to go either way.
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Padding.** Appending the pad id to the short rows of a batch so that all rows have one length.
The padding side is the end that receives the pad ids. [10 Text Becomes Tokens](10-tokens.md).

**Patch.** One of the non-overlapping squares, `patch_size` pixels on a side, into which a Vision
Transformer cuts an image. [20 Images Become Tokens](20-images-to-tokens.md).

**Patch token.** The encoder's output vector for one patch.
[21 One Vector or Many Tokens](21-pooled-vs-patch-tokens.md).

**Pixel shuffle.** Shortening the image part of a VLM's sequence: each `r` x `r` block of
neighbouring patch tokens is concatenated into one token that is `r²` times wider.
[30 Joining Vision and Language](30-joining-vision-and-language.md).

**Placeholder token.** The `<image>` token, repeated in the prompt once for every patch token the
image will produce; the image vectors are written over its embeddings.
[30 Joining Vision and Language](30-joining-vision-and-language.md).

**Policy.** A function from observations to actions.
[01 Setup and a First Run](01-setup-and-first-run.md).

**Pooled embedding.** A single vector that summarises all the patch tokens of an image.
[21 One Vector or Many Tokens](21-pooled-vs-patch-tokens.md).

**Position.** A token's index in the sequence, starting at 0.
[12 Telling Tokens Where They Are](12-positions.md).

**Position embedding (learned).** In the ViT here, a learned table with one vector per patch
position, added to that patch's token. [20 Images Become Tokens](20-images-to-tokens.md).

**Pre-norm.** A transformer block in which the norm sits on the branch, in front of each sublayer,
and the residual stream itself is never normalised inside a block.
[11 The Transformer Block](11-the-transformer-block.md).

**Preset.** A YAML fragment under `vla_foundry/config_presets/` that a config file can include.
[80 The Training Loop](80-the-training-loop.md).

**Pretraining.** Training a model on one task so that its weights become the starting point for
another. [62 The From-Scratch Path](62-the-from-scratch-path.md).

**Probe (two senses).** (1) A recorder inside the evaluation loop that reads the simulator's true
state, the position of the gripper and of every object, at one chosen moment of every episode; here
`GraspProbe`, which fires at the first close command.
[92 Measuring How a Policy Fails](92-measuring-failure.md). (2) See *probe token*.

**Probe token.** An extra token whose hidden state is read out as a summary of the prompt. It is
the token chapters 03, 10, 50 and 61 call the *action token*.
[60 Anatomy of a VLA](60-anatomy-of-a-vla.md); also
[93 Train and Inference Must See the Same Thing](93-train-inference-skew.md).

**Projector.** The small trainable map between a vision encoder and a language model: it turns
each patch token into a vector of the language model's width, the shape of a word embedding.
[30 Joining Vision and Language](30-joining-vision-and-language.md).

**Proprioception.** The robot's measurement of its own joints; here the 7 joint angles and the
gripper opening, fed to the model as the state.
[40 What an Action Is](40-action-spaces.md); also
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md),
[93 Train and Inference Must See the Same Thing](93-train-inference-skew.md).

## R

**Raw weights.** The trained weights of a run, as opposed to their EMA.
[00 The Route on One Page](00-the-route.md).

**Register tokens.** Extra learned tokens that some DINOv2 checkpoints carry; like the class token
they are not patches. [22 Pretrained Vision Encoders](22-pretrained-vision-encoders.md).

**Regression.** Feeding the observation in, reading the action out, and training with mean squared
error against the demonstrated action; the output that minimises the error is the mean of all
targets seen for that input. [41 Generating Actions with Flow Matching](41-flow-matching.md).

**Residual stream.** The tensor `[batch, tokens, width]` that runs from the embedding to the
output; each block reads it, computes an update and adds the update.
[11 The Transformer Block](11-the-transformer-block.md).

**Rollout.** One run of the policy in the simulator, each action changing the next observation.
[43 Imitation Learning and Why It Breaks](43-imitation-learning.md).

**Rotary position embedding (RoPE).** A way of supplying position in which queries and keys are
rotated by an angle proportional to their position in every attention layer, with nothing trained,
so that an attention score depends on content and on the offset between the two tokens only.
[12 Telling Tokens Where They Are](12-positions.md).

## S

**Sample (two senses).** (1) One training example; for a policy, one window cut from a
demonstration. Training budgets are counted in samples.
[00 The Route on One Page](00-the-route.md); also [80 The Training Loop](80-the-training-loop.md).
(2) One draw from a model: an action chunk generated from one starting noise
([41 Generating Actions with Flow Matching](41-flow-matching.md)), or a token drawn at random with
its probability ([14 Generating Text](14-generation.md)).

**Scripted expert.** A hand-written controller that reads the true object pose from the simulator,
which the policy never sees, and executes a fixed plan.
Introduced in [00 The Route on One Page](00-the-route.md), explained in
[70 Demonstrations](70-demonstrations.md).

**Seed (layout seed).** The integer a layout is generated from; a seed names a layout exactly.
Demonstrations use seeds from 0 and evaluation from 1,000,000.
[90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Serving path.** The code between a raw observation and the model call at run time; here
`Policy.infer` in `sim/pickup/policy_server.py`.
[93 Train and Inference Must See the Same Thing](93-train-inference-skew.md).

**Shard.** A tar file of training samples that the data loader reads as a stream; 256 windows per
shard for the policy datasets here. [01 Setup and a First Run](01-setup-and-first-run.md); also
[70 Demonstrations](70-demonstrations.md), [80 The Training Loop](80-the-training-loop.md).

**Softmax.** Exponentiate, then divide by the total: the operation that turns scores into
probabilities. [11 The Transformer Block](11-the-transformer-block.md).

**Special token.** A vocabulary entry that stands for structure, not text.
[10 Text Becomes Tokens](10-tokens.md).

**State.** What the arm reports back: here the 7 measured joint angles and the gripper opening as
a fraction of its span. [40 What an Action Is](40-action-spaces.md).

**State tokens.** In the action head's sequence, the tokens that carry the joint angles and gripper
opening, one per time step. [50 What the Action Head Sees](50-what-the-action-head-sees.md).

**Step.** One optimiser update on one batch. Not the same as a *control step* (one tick of the
robot's clock) or a *flow step* (one integration step of the action sampler).
[13 Training a Language Model](13-training-a-language-model.md); also
[80 The Training Loop](80-the-training-loop.md).

**Success.** A test on the simulator's state: the named object is more than 8 cm above its rest
height for 10 consecutive control steps, within 200 steps.
[00 The Route on One Page](00-the-route.md).

**Success rate.** The number of successful episodes divided by the number of episodes,
$\hat p = k/n$. [90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Supervisor.** A process that starts the trainer, watches the liveness signal and restarts from
the newest checkpoint; here `train_resilient.sh`.
[81 Surviving Long Runs](81-surviving-long-runs.md).

## T

**Teacher forcing.** Giving the model the true text and, at every position, having it predict the
next token from the true tokens before it; nothing is generated.
[32 Testing a VLM](32-testing-a-vlm.md).

**Teleoperated.** Of a robot or a demonstration: driven by a person.
[02 From Language Models to Robot Policies](02-how-we-got-here.md).

**Temperature.** A number $T$ by which the logits are divided before the softmax when sampling; as
$T$ approaches 0, sampling becomes greedy decoding. [14 Generating Text](14-generation.md).

**Time token.** The token in the action head's sequence that says how noisy the action tokens
currently are; it encodes the flow-matching time, not the control step.
[21 One Vector or Many Tokens](21-pooled-vs-patch-tokens.md); also
[50 What the Action Head Sees](50-what-the-action-head-sees.md).

**Token.** A piece of text the model treats as one unit; more generally, one vector in the sequence
a transformer processes. [10 Text Becomes Tokens](10-tokens.md); also
[20 Images Become Tokens](20-images-to-tokens.md).

**Tolerance.** The placement error at which a grasp still succeeds; it turns a success target into
a precision target. [00 The Route on One Page](00-the-route.md); also
[92 Measuring How a Policy Fails](92-measuring-failure.md).

**Tool centre point (TCP).** The reference point between the fingertips.
[40 What an Action Is](40-action-spaces.md); also [70 Demonstrations](70-demonstrations.md),
[92 Measuring How a Policy Fails](92-measuring-failure.md).

**Top-k.** A sampling setting that keeps the $k$ highest-scoring tokens, discards the rest and
renormalises. [14 Generating Text](14-generation.md).

**Top-p (nucleus sampling).** A sampling setting that sorts the tokens by probability and keeps the
shortest prefix whose cumulative probability exceeds $p$. [14 Generating Text](14-generation.md).

**Train/inference skew.** Any difference between the representation of an input that reaches the
model in training and the representation of the same input that reaches it when served. Also
written "train-inference skew". Introduced in [00 The Route on One Page](00-the-route.md), explained
in [93 Train and Inference Must See the Same Thing](93-train-inference-skew.md).

**Training seed.** The integer that seeds the random number generators of a training run; two runs
of one recipe with different training seeds end as two different policies. A different integer from
a layout seed. [90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Truncation.** Cutting a row longer than `max_length` down to that length. The truncation side is
the end that is cut. [10 Text Becomes Tokens](10-tokens.md).

## U

**Unseen layouts.** Layouts from seeds the demonstrations never used.
[00 The Route on One Page](00-the-route.md).

## V

**Vision encoder.** The network that turns an image into vectors; here always a Vision
Transformer. [30 Joining Vision and Language](30-joining-vision-and-language.md); also
[22 Pretrained Vision Encoders](22-pretrained-vision-encoders.md).

**Vision Transformer (ViT).** A transformer that cuts a frame into small squares and turns each
square into one token. Introduced in
[02 From Language Models to Robot Policies](02-how-we-got-here.md), explained in
[20 Images Become Tokens](20-images-to-tokens.md).

**Vision-language model (VLM).** A language model that also accepts image tokens.
[02 From Language Models to Robot Policies](02-how-we-got-here.md); also
[03 The Model Families Today](03-the-landscape.md),
[30 Joining Vision and Language](30-joining-vision-and-language.md).

**Vision-language-action policy (VLA).** A policy that reads images and an instruction and outputs
actions; in the recipes here, a VLM backbone with an action head.
[00 The Route on One Page](00-the-route.md); also [60 Anatomy of a VLA](60-anatomy-of-a-vla.md).

**Vocabulary.** The fixed list of all tokens. [10 Text Becomes Tokens](10-tokens.md).

## W

**Warm-up.** The first part of the learning-rate schedule, in which the rate rises linearly from
near zero to its base value over the first `warmup` steps.
[13 Training a Language Model](13-training-a-language-model.md); also
[80 The Training Loop](80-the-training-loop.md).

**Waypoint.** One target of the scripted expert's plan for the tool centre point, with a gripper
command, a speed limit and a wait after arrival. [70 Demonstrations](70-demonstrations.md).

**Weight decay.** A small pull of every weight towards zero, applied by AdamW to the weights
directly instead of through the gradient.
[13 Training a Language Model](13-training-a-language-model.md).

**Weight tying.** Using one matrix for both the embedding table and the output projection.
[11 The Transformer Block](11-the-transformer-block.md).

**Width.** The length of the vector the model keeps for each token: the number of features in each
token's vector. [10 Text Becomes Tokens](10-tokens.md); also
[11 The Transformer Block](11-the-transformer-block.md).

**Wilson interval.** The confidence interval `eval.py` reports for a success rate: the set of rates
$p$ for which the observed rate lies within $z$ standard deviations of $p$, with the standard
deviation taken at $p$. Unlike the simpler rate plus or minus 1.96 standard errors, it does not
have zero width at 0 successes. Introduced in [00 The Route on One Page](00-the-route.md),
explained in [90 Closed-Loop Evaluation](90-closed-loop-evaluation.md).

**Window.** One training sample for a policy: a fixed-length slice of a demonstration around one
anchor frame. Here it holds state and action for frames `t-1` to `t+14`, shape `[16, 8]` each, and
four images, both cameras at `t-1` and at `t`. Introduced in
[01 Setup and a First Run](01-setup-and-first-run.md), explained in
[70 Demonstrations](70-demonstrations.md); also
[42 Action Chunks and Closed-Loop Execution](42-chunks-and-execution.md),
[93 Train and Inference Must See the Same Thing](93-train-inference-skew.md).

**Works.** A policy works on a task when its closed-loop success rate, on layouts it never saw
during training, clears a stated threshold, and the rate is reported with a confidence interval.
[00 The Route on One Page](00-the-route.md).

## Y

**Yaw.** Rotation about the vertical axis; for the gripper, of the direction in which the fingers
close. [92 Measuring How a Policy Fails](92-measuring-failure.md).
