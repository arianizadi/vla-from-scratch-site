---
title: Telling Tokens Where They Are
part: 1 Language models
order: 12
summary: Explain how rotary position embeddings make attention depend on relative offsets, find where position enters each model in this repository, and check that a policy's conditioning tokens keep the same offsets in training and serving.
status: draft
---

# Telling Tokens Where They Are

Attention compares tokens by content and has no notion of order, so a transformer has to be told
where each token is. This repository uses rotary position embeddings in its transformer (the
language model and the action head, the transformer that produces actions) and a learned table in
its vision transformer. The action head's input is conditioning tokens (the instruction and image
patches, encoded by a model called the backbone) followed by action tokens (one per time step of
the chunk, the short run of future actions predicted at once); action tokens read conditioning
tokens by relative offset, so anything that shifts those offsets between training and serving
changes what the policy sees.

## The idea

Attention ([the transformer block](11-the-transformer-block.md)) scores a query vector from one
token against a key vector from every token with a dot product, then mixes the value vectors with
weights given by the softmax of those scores. Queries, keys and values are computed from a token's
content alone. With no mask and no position information, shuffling the input tokens only shuffles
the outputs the same way: "red cube left of green can" and "green can left of red cube" are the
same input. So are the 196 patch tokens of a camera frame
([images to tokens](20-images-to-tokens.md)) in any order, and the action tokens of a chunk, whose
order is time. A causal mask breaks this symmetry by itself, since the token at index $i$ can read
exactly $i$ earlier tokens; the action head has no such mask.

A token's **position** is its index in the sequence, starting at 0. The **offset** from a key to a
query is the query's position minus the key's position; it is negative when the key comes later.
Three ways of supplying position are in common use (background; papers at the end):

| Scheme | Where position enters | What a score is a function of | Position beyond those trained |
|---|---|---|---|
| Learned absolute | one trained table row per position, added to the token embedding before the first layer | both absolute indices; any dependence on the offset has to be learned | no row exists |
| Sinusoidal | fixed sines and cosines of the position, added the same way | both absolute indices; an offset is a fixed linear map of the vector, easier to learn but not enforced | computable |
| Rotary (RoPE) | queries and keys rotated by an angle proportional to position, in every attention layer; nothing trained | content and the offset only | computable |

Background: the sinusoidal vector of Vaswani et al. (2017) puts $\sin(pos / 10000^{2i/d})$ in
dimension $2i$ and the matching cosine in dimension $2i+1$. They chose it on the hypothesis that the
model could learn to attend by relative position, because the vector for $pos + k$ is a linear
function of the vector for $pos$. Rotary embeddings reuse those frequencies as rotation angles and
make the dependence on offset exact. A fourth family adds learned terms for each relative position
inside attention (Shaw et al., 2018); rotary needs no parameters.

### Rotary in two dimensions

Take an attention head whose queries and keys have two numbers each. Turn the query of the token
at position $m$ by $m$ radians and the key of the token at position $n$ by $n$ radians. Let the
content be the same everywhere: query $(1, 0)$, key $(1, 0)$.

| Query at | Rotated query | Key at | Rotated key | Dot product |
|---|---|---|---|---|
| 3 | (-0.990, 0.141) | 5 | (0.284, -0.959) | -0.281 - 0.135 = -0.416 |
| 13 | (0.907, 0.420) | 15 | (-0.760, 0.650) | -0.689 + 0.273 = -0.416 |
| 3 | (-0.990, 0.141) | 4 | (-0.654, -0.757) | 0.647 - 0.107 = 0.540 |

Rows one and two have different positions, the same offset ($3 - 5 = 13 - 15 = -2$) and the same
score, $\cos(-2) = -0.416$. Row three has offset $-1$ and a different score, $\cos(-1) = 0.540$.
Rotating two vectors by $m$ and $n$ changes the angle between them by $m - n$ and leaves their
lengths alone, so the dot product depends only on the content and on $m - n$. With the same content
in query and key, offsets $+2$ and $-2$ give the same score; with different contents they do not.

<!-- interactive: rotary -->
*Figure: a query and a key drawn as arrows in the plane, each turned by its position. Moving both
positions by the same amount leaves the score fixed; changing the offset between them changes it.*

## How it works

Background: this is the construction of Su et al. (2021). For a head whose vectors have $d$ numbers
(the head dimension, `hidden_dim / n_heads`, which must be even):

1. Split the query into $d/2$ pairs of numbers. Each pair is a point in a plane.
2. Give pair $i$ a frequency $\theta_i = 10000^{-2i/d}$ for $i = 0 \dots d/2 - 1$.
3. For the token at position $m$, rotate pair $i$ by the angle $m\theta_i$:
   $(x_1, x_2) \to (x_1\cos m\theta_i - x_2\sin m\theta_i,\; x_2\cos m\theta_i + x_1\sin m\theta_i)$.
4. Do the same to the key. Leave the value alone.
5. Compute attention scores from the rotated queries and keys.

Write $R(a)$ for the 2x2 matrix that rotates by angle $a$. A dot product $\langle Aq, Bk \rangle$
equals $\langle q, A^\top B k \rangle$, and $R(a)^\top R(b) = R(b - a)$ because the transpose of a
rotation is the rotation back. Each pair therefore contributes

$$\langle R(m\theta_i)\,q,\; R(n\theta_i)\,k \rangle = \langle q,\; R((n - m)\theta_i)\,k \rangle
= |q|\,|k|\cos\big(\varphi_q - \varphi_k + (m - n)\theta_i\big)$$

where $\varphi_q$ and $\varphi_k$ are the angles of the unrotated query pair and key pair, measured
from the first axis. The score is a sum of such terms over the pairs. Content sets $|q|$, $|k|$ and
the two angles; position enters only through $m - n$. Because of those angles the sign of the offset
matters: a head can prefer "two tokens earlier" over "two tokens later".

With $d = 64$, the head dimension in the pickup configs (512 / 8 or 256 / 4), there are 32 pairs.
Pair 0 turns 1 radian per position and repeats about every 6 positions; pair 31 turns
$10000^{-62/64} \approx 0.000133$ radians per position and repeats after about 47,000. Fast pairs
resolve neighbours, slow pairs resolve distant tokens.

The rest of the chapter depends on one consequence. Shifting a whole sequence changes no offset,
but inserting tokens between two groups changes every offset across the gap. With conditioning
tokens `C1 C2 C3` followed by action tokens `A1 A2`, `A1` reads `C3` at offset 1. Insert two padding
tokens after `C3` and it reads `C3` at offset 3, a different rotation in all 32 pairs. Offsets
inside each group are unchanged.

## In this repository

**Rotary, in the transformer.** In
[`vla_foundry/positional_embedding.py`](../../vla_foundry/positional_embedding.py), `get_pos_embed`
reads `positional_embedding_type` and returns `RotaryWithCast` (`"rotary"`), the same wrapped by
`Float32Module` (`"rotary_float32"`), a variant for evaluating older checkpoints
(`"rotary_legacy_autocast"`), or `identity_with_cast` (`"none"`, no position information).
`TransformerParams` in
[`vla_foundry/params/model_params.py`](../../vla_foundry/params/model_params.py) defaults to
`"rotary"`, and no pickup config overrides it.

`get_pos_embed` is called only from `CustomAttn.__init__` in
[`vla_foundry/models/transformer.py`](../../vla_foundry/models/transformer.py), so every layer has
its own rotary module. `CustomAttn.forward` reshapes queries, keys and values to
`[batch, tokens, heads, head_dim]` and calls `self.pos_embed(queries, keys, vals,
offset=past_length)` just before the attention function. `Transformer.forward` adds no position
vector to the embeddings; this call is the only place position enters.

Inside `RotaryEmbedding` and the two module-level functions it calls:

- `__init__` registers `inv_freq` as a buffer and `reset_parameters` sets it to
  `1 / 10000 ** (arange(0, dim, 2) / dim)`, the $\theta_i$ above. There are no trainable parameters.
- `apply_rotary_pos_emb` returns `x * cos + rotate_half(x) * sin`. `rotate_half` splits the last
  dimension into two halves and returns `(-second, first)`, so number `i` is paired with number
  `i + head_dim / 2`, not with its neighbour as in the paper. The rotation is the same.
- The `offset` argument of `forward` is the number of tokens already in the key-value cache
  (`past_key_value[0].shape[1]` in `CustomAttn.forward`), the keys and values of earlier tokens kept
  between generation steps ([generation](14-generation.md)). A token generated one at a time
  arrives as a sequence of length 1, and `offset` makes it rotate by its true position instead of
  position 0.

**A learned table, in the ViT.** `ViTPatchEmbeddings` in
[`vla_foundry/models/vit.py`](../../vla_foundry/models/vit.py) creates `position_embedding`, a
parameter of shape `[1, num_patches, hidden_dim]` (with the default `cls_flag: false`; one more row
when a class token is used) initialised with `torch.rand`, and adds it to the patch embeddings once
in `forward`. The stage-2 ViT (`sim/pickup/configs/custom_vlm.yaml`: 224 px, patch 14) has
16 x 16 = 256 rows; the policy ViT (`sim/pickup/configs/dp_vit.yaml`: patch 16) has
14 x 14 = 196 rows. `ViT.forward` folds several images into the batch dimension, so every image
receives the same table: it says where in an image a patch is, not which image it came from.

### The action head's sequence

`DiffusionPolicy._build_transformer_input` in
[`vla_foundry/models/diffusion_policy/diffusion_policy.py`](../../vla_foundry/models/diffusion_policy/diffusion_policy.py)
concatenates, in order, a time token (with the default `diffusion_step_conditioning: concat`),
the backbone's conditioning tokens, the state tokens and the action tokens. For
`sim/pickup/configs/dp_vit_lang.yaml` (two cameras at two time steps, patch 16, `text_tokens: 32`;
`lowdim_past_timesteps: 1` and `lowdim_future_timesteps: 14` from the data preset give two state
steps and 16 action steps):

```text
shape [1, 835, 256]

position   0      1 .. 32       33 .. 816           817 818   819 .. 834
token      time   text slots    patches (4 x 196)   state     actions (16)
```

This transformer has `is_causal: false` and is called without an attention mask in
`DiffusionPolicy.forward` and `generate_actions`, so every token attends to every other. A patch
token's content can carry its place within the image, from the ViT's table; which of the four
images it belongs to, and which time step an action token stands for, reach the action head only
through rotary position.

### Why the conditioning has a fixed length

`RoboticsProcessor.process_inputs` (`vla_foundry/data/processor/robotics_processor.py`) wraps each
instruction with `apply_chat_template` and tokenizes with `padding=True`, which pads a batch to its
longest prompt. The server (`sim/pickup/policy_server.py`) calls the same function on a batch of
one, where nothing is padded. If the padded length reached the action head, the offsets between
words, patches and action tokens would depend on the rest of the training batch. Two backbones
prevent that.

`ViTBackboneWrapper._embed_text` in
[`vit_backbone.py`](../../vla_foundry/models/vision_language_backbones/vit_backbone.py) sorts each
sample's real tokens to the front with a stable `argsort`, pads or truncates to exactly
`text_tokens` slots, adds a learned `text_position` of shape `[1, text_tokens, hidden_dim]`,
applies a layer norm, and multiplies padding slots by zero. Token `k` of the tokenized prompt
(counting from 0) is always at sequence position `1 + k`, and the patches start at position 33. The
prompt is not the bare instruction: the template puts `<|im_start|>`, `User`, `:` and one `<image>`
placeholder per image in front of it and `<end_of_utterance>` and a newline after it
([tokens](10-tokens.md)), so with four images the instruction's first word is always in slot 7,
sequence position 8.

`VLMFoundryBackboneWrapper._extract_action_conditioning` in
[`vlm_foundry_backbone.py`](../../vla_foundry/models/vision_language_backbones/vlm_foundry_backbone.py),
in `conditioning: all_tokens` mode, moves each sample's real tokens to the right-hand end, zeroes
the padding slots, and pads in front (or crops leading padding) to `conditioning_len` slots.
`vla_custom_tokens.yaml` sets `conditioning_len: 1040`, so the action head sees `[1, 1059, 256]`:
time at 0, conditioning at 1 to 1040 with the prompt's last token always at 1040, state at 1041 and
1042, actions at 1043 to 1058. A prompt with more real tokens than `conditioning_len` raises a
`ValueError`.

The count is fixed as well as the alignment. The action head has no mask, so a zeroed slot is
still a key that every token attends to (after `condition_encode`, a linear layer with a bias, a
constant vector), and a varying number of them would change every attention average.

The same file handles the single-vector mode (`conditioning: action_token`): one extra special
token is appended to the VLM's prompt, and its hidden states in the last layers are the single
conditioning vector. The code calls it the action token; it is not one of the action head's 16
action tokens. `_prepare_inputs_for_action_token` appends it and then stable-sorts real tokens
first, so it sits directly after the last real token instead of after the padding.

### Maximum sequence length

`max_seq_len` (2048 by default in `TransformerParams` and in every pickup config) only sets how
many positions `RotaryWithCast` tabulates at construction. It is not enforced:
`RotaryEmbedding.forward` calls `_update_cos_sin_tables(k.shape[1] + offset, ...)`, which rebuilds
larger tables when a longer sequence arrives. `Transformer.__init__` stores the value, and nothing
else under `vla_foundry/` or `sim/` reads it.

The limits that do bind are `text_tokens` and `conditioning_len` above, and the ViT's table: it has
exactly `(img_size // patch_size) ** 2` rows, so an image of another size fails on shape in
`ViTPatchEmbeddings.forward`. `VLMFoundryBackboneWrapper._prepare_inputs` avoids that by resizing
`pixel_values` to the ViT's `img_size`.

The sequences above are well under 2048: 835 and 1059 tokens for the two action heads, `seq_len:
256` (`custom_llm.yaml`) and `seq_len: 320` (`custom_vlm.yaml`) for the from-scratch language model
and VLM in stages 1 and 2, and about 1,035 prompt tokens when that VLM is the backbone in
`vla_custom*.yaml` (four images of 256 tokens each). That runs the VLM at offsets beyond the 320
tokens it was pretrained on; stage 3 trains all of it, so those offsets are learned there.

## What we measured

No run in the [lab notebook](../lab-notebook.md) compares position schemes. Two entries concern
positions.

- The bug table records that the single-vector mode's action token (the prompt token above, not an
  action-head token) was appended after the batch padding in `vlm_foundry_backbone`, so for a short
  instruction it sat one position later, behind a padding token, in a training batch than when
  served alone. It was fixed and a test was added; the notebook states that the effect on success
  was not measured.
- `conditioning: all_tokens` is listed with its effect not yet measured.

## Where it goes wrong

**Padding between conditioning and actions.** Nothing raises an error and the training loss looks
normal; the conditioning a sample gets depends on its batch, so the served policy receives inputs
it was not trained on ([train-inference skew](93-train-inference-skew.md)). Check: pass one sample
alone and inside a padded batch and compare the conditioning tensors, as the backbone tests under
"Check yourself" do.

**A prompt longer than the slots.** `_embed_text` truncates to `text_tokens` (32 in the pickup
configs) silently, keeping tokens from the front, so the two closing tokens are lost first and then
the end of the instruction. Compare the tokenized length of the longest prompt with `text_tokens`:
with four images the template tokens and placeholders take 9 slots and leave the instruction 23.

**Sequences longer than those trained.** Nothing stops a 3,000-token input and nothing is raised:
the angles are defined, but the weights were fitted on offsets up to the training length. Compare
the token count the transformer receives (`inputs_embeds.shape[1]`) with the training lengths under
"Maximum sequence length", and keep inference at or below them or train at the longer length.

**`positional_embedding_type: none` with `is_causal: false`.** Nothing fails: `get_pos_embed`
returns `identity_with_cast` and training runs. The action head then receives no order information:
the four images cannot be told apart and action tokens lose their time step. A causal model is a
different case, because the mask carries order. Background: Kazemnejad et al. (2023) found
decoder-only models without position encoding generalising to longer sequences better than the
explicit schemes they tested. Check this key in the resolved config before training a non-causal
model.

## Background and further reading

- Vaswani et al., "Attention Is All You Need", 2017, <https://arxiv.org/abs/1706.03762>. Introduced
  the transformer, with sinusoidal position vectors added to the embeddings; learned ones gave
  nearly identical results.
- Shaw et al., "Self-Attention with Relative Position Representations", 2018,
  <https://arxiv.org/abs/1803.02155>. Made attention depend on the signed offset between tokens,
  clipped at a maximum distance, through learned relative-position vectors added inside attention.
- Su et al., "RoFormer: Enhanced Transformer with Rotary Position Embedding", 2021,
  <https://arxiv.org/abs/2104.09864>. Rotates queries and keys so that their inner product depends
  on relative position; cited in `RotaryEmbedding`'s docstring.
- Dosovitskiy et al., "An Image is Worth 16x16 Words", 2020, <https://arxiv.org/abs/2010.11929>.
  The vision transformer: learned 1-D position embeddings added to patch embeddings, interpolated
  when the resolution changes.
- Kazemnejad et al., "The Impact of Positional Encoding on Length Generalization in Transformers",
  2023, <https://arxiv.org/abs/2305.19466>. Compares absolute, T5 relative, ALiBi, rotary and no
  position encoding in decoder-only models on sequences longer than those trained on; the common
  schemes generalised poorly and no encoding did best.

## Check yourself

1. Predict the four numbers before running this, then explain why the third equals the first.

   ```bash
   uv run python - <<'EOF'
   import torch
   from vla_foundry.positional_embedding import RotaryEmbedding

   rot = RotaryEmbedding(dim_model=2, seq_len=16)    # one pair, 1 radian per position
   q = torch.tensor([1.0, 0.0]).expand(1, 16, 1, 2)  # [batch, tokens, heads, head_dim]
   k = torch.tensor([1.0, 0.0]).expand(1, 16, 1, 2)
   q, k = rot(q, k)
   scores = torch.einsum("bqhd,bkhd->qk", q, k)      # scores[query position, key position]
   print(scores[3, 5].item(), scores[13, 15].item(), scores[5, 3].item(), scores[3, 4].item())
   EOF
   ```

   Change the key to `[0.0, 1.0]` and run it again. `scores[3, 5]` and `scores[5, 3]` now differ in
   sign; say why.

2. Run the module's unit tests and find those that pass an `offset`. The two rotary ones assert
   the output shape only. Write the missing check: rotating one token with `offset=5` must equal
   position 5 of rotating six copies of that token with `offset=0`.

   ```bash
   uv run pytest tests/essential/models/test_positional_embedding.py -q
   ```

3. Run the padding tests, then find the line of `_embed_text` that makes the input `[[0, 0, 8, 9]]`
   give the same conditioning as `[[8, 9]]`:

   ```bash
   uv run pytest tests/essential/models/test_vit_backbone_text.py \
     tests/essential/models/test_vlm_foundry_backbone_conditioning.py -q
   ```
