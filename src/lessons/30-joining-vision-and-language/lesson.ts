import { defineLesson } from "../define";
import { LookBack } from "./animations/LookBack";
import { MergeTiles } from "./animations/MergeTiles";
import { ReservedSeats } from "./animations/ReservedSeats";
import { ThreeParts } from "./animations/ThreeParts";

export default defineLesson({
  slug: "30-joining-vision-and-language",
  idea: "A vision-language model reshapes picture tokens to look like word tokens and seats them in the sentence, so one model reads both.",
  beats: [
    {
      title: "Three parts, one row",
      text: "Think of an interpreter between two people. A **vision-language model** joins three parts. A vision encoder turns the picture into patch tokens. A **projector**, a small learned translator, reshapes each one to the size of a word token. A language model then reads picture and words as one row.",
      animation: ThreeParts,
    },
    {
      title: "Seats saved for the picture",
      text: "Like reserving seats before the guests arrive. The prompt holds one **placeholder** token per patch, so the row already has the right length. Once the picture is encoded, each patch token is copied into its seat in reading order. The language model never knows which seats held a picture.",
      animation: ReservedSeats,
    },
    {
      title: "Each token looks back",
      text: "The language model reads left to right: each token sees only what came before it. The picture comes first, so picture tokens cannot see the instruction, while words can see the picture. The last token sees everything, a natural place to collect a summary for the robot.",
      animation: LookBack,
    },
    {
      title: "Fewer, wider tokens",
      text: "Every token costs work, so many models glue each 2 by 2 block of neighbouring patches into one wider token: four times fewer tokens. The price is place. Our cube is about one patch wide, so after gluing, the model only knows which bigger square holds it.",
      animation: MergeTiles,
    },
  ],
  edgeCases: [
    "The number of seats must equal the number of patch tokens exactly. Change the patch size and the seat count has to follow.",
    "Picture tokens never see the instruction. Anything that mixes “what was asked” with “what is in view” happens at word positions.",
    "With two cameras and the previous moment, four pictures come before the words, and the row grows to about a thousand tokens.",
    "A model that lists objects left to right shows that rough position survives the join, not that it is precise enough to grasp.",
  ],
  tips: [
    "Sketch the row before training: start tokens, every picture's seats, then the words. Count it.",
    "Put the instruction after the pictures, so the words can look back at what is in view.",
    "Glue patches together only if the smallest object still spans several glued tokens.",
  ],
  takeaway: "A vision-language model seats reshaped picture tokens in the sentence; because it reads left to right, what each token can know depends on where it sits.",
  related: ["20-images-to-tokens", "31-training-a-vlm", "50-what-the-action-head-sees"],
  lab: [{ label: "Backbones built on this model, against pretrained ones", href: "/lab#backbones" }],
  tryIt: ["sequence-layout"],
});
