import { defineLesson } from "../define";
import { FreezeOrTune } from "./animations/FreezeOrTune";
import { HeadStart } from "./animations/HeadStart";
import { WhatAndWhere } from "./animations/WhatAndWhere";
import { WhatTheLossReads } from "./animations/WhatTheLossReads";

export default defineLesson({
  slug: "22-pretrained-vision-encoders",
  idea: "A pretrained vision encoder arrives already knowing what things look like; what it was graded on decides whether it also knows where they are.",
  beats: [
    {
      title: "Borrowed eyes",
      text: "Someone who has seen millions of photos learns faster than a newborn. A **pretrained encoder** is a vision model trained on a huge pile of pictures before it meets the robot. To grasp, the robot needs two things from it: **what** each object is, and exactly **where** it stands.",
      animation: WhatAndWhere,
    },
    {
      title: "The grade shapes the eye",
      text: "Students learn what the test checks. Encoders trained to match pictures with captions are graded on one summary of the whole picture: strong on what, vague on where. Encoders trained to fill in hidden patches are graded on every patch, so their patches keep where. Some robot models use both.",
      animation: WhatTheLossReads,
    },
    {
      title: "Frozen or still learning",
      text: "**Freezing** an encoder means locking its numbers while the rest of the robot trains. It keeps what it learned and saves memory, but cannot adapt to the robot's camera. **Fine-tuning** keeps it learning so it can adapt, at the risk of a few thousand robot examples wearing away what it knew.",
      animation: FreezeOrTune,
    },
    {
      title: "A head start, not a shortcut",
      text: "We trained the same robot model twice: once on a backbone pretrained on captions, once from scratch. The pretrained one started using the camera about four times sooner, and both ended up working. Here, pretraining bought mainly an earlier start.",
      animation: HeadStart,
    },
  ],
  edgeCases: [
    "Every pretrained encoder expects pictures at its own size and brightness scale. Feed it another and it fails quietly, with no error.",
    "An encoder that hands over only its summary throws its patches away. They might be fine, but the robot never sees them.",
    "Bigger pictures or smaller patches mean more tokens, and the work grows with the square of the count.",
    "A frozen encoder cannot learn your camera's quirks; a fully retrained one can forget what made it useful.",
  ],
  tips: [
    "Fixed cameras and a few known objects: a small encoder trained from scratch can be enough.",
    "New objects or real cameras: start from a pretrained encoder and keep its patch tokens.",
    "Whatever the encoder, hand the robot every patch token, not one summary.",
    "Prepare pictures exactly the way the encoder was trained on: same size, same brightness scale.",
  ],
  takeaway: "A pretrained encoder lends a robot eyes; what it was graded on decides whether those eyes see what, where, or both.",
  related: ["21-pooled-vs-patch-tokens", "61-pretrained-backbones", "102-case-pretrained-backbones"],
  lab: [{ label: "Backbones from scratch and pretrained, side by side", href: "/lab#backbones" }],
  tryIt: ["patchify"],
});
