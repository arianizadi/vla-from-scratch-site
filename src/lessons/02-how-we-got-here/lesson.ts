import { defineLesson } from "../define";
import { DriftOffPath } from "./animations/DriftOffPath";
import { LookAtEveryWord } from "./animations/LookAtEveryWord";
import { PictureToPatches } from "./animations/PictureToPatches";
import { ThreeLinesMeet } from "./animations/ThreeLinesMeet";

export default defineLesson({
  slug: "02-how-we-got-here",
  idea: "Today's robot models join three older ideas: models that read text, models that see pictures, and robots that learn by copying people.",
  beats: [
    {
      title: "Reading a whole sentence at once",
      text: "Repeat a long sentence after hearing it once and details slip. Early translation programs squeezed each sentence into one small memory, and lost details. **Attention** fixed it: each word looks back at every other word and takes what it needs. That is how a robot tells which cube “red” means.",
      animation: LookAtEveryWord,
    },
    {
      title: "Pictures read like sentences",
      text: "A mosaic is a picture made of tiles. Cut a camera image into small squares, called **patches**, line them up like words, and the same reading machine can look at pictures. Trained on millions of pictures with captions, it learned what things look like and what they are called.",
      animation: PictureToPatches,
    },
    {
      title: "Robots that learn by copying",
      text: "In 1988 a van learned to steer by watching a human driver: for each camera view, copy the driver's action. This is **imitation learning**. The catch: a small slip takes it somewhere no example showed, where it slips more. Examples of getting back on track are the cure.",
      animation: DriftOffPath,
    },
    {
      title: "The three lines meet",
      text: "Around 2023, researchers took a model that already read and saw, and taught it robot actions too: a **vision-language-action model**, or VLA. The web taught it what a cube is; robot demonstrations taught it how to grab one. Those demonstrations are still the scarce part: nobody posts them online.",
      animation: ThreeLinesMeet,
    },
  ],
  edgeCases: [
    "“Robot models came from robotics.” Most of their parts were invented for translation, photo search and captions, then borrowed.",
    "“A bigger language model makes a better robot.” On our simple task a model built from scratch did as well; the one that first learned from the web mainly started learning sooner.",
    "“Copying is enough.” A copier that never saw a mistake cannot recover from its own; it needs examples of recovering.",
    "“Robot data is everywhere, like text.” It is not: every demonstration has to be driven by a person or by a program.",
  ],
  tips: [
    "Read each new part as an old idea with a new job: attention, patches, copying.",
    "When a robot model fails, ask which of the three lines the failing skill came from: reading, seeing or doing.",
    "To teach recovery, show recoveries, not only perfect runs.",
  ],
  takeaway: "A robot model is a reader, a seer and a copier joined together: the web teaches it what things are, and demonstrations teach it how to move.",
  related: ["03-the-landscape", "11-the-transformer-block", "20-images-to-tokens", "43-imitation-learning", "61-pretrained-backbones"],
  lab: [
    { label: "Pretrained or from scratch: what changed", href: "/lab#backbones" },
    { label: "Teaching recovery with disturbed demonstrations", href: "/lab#outside-the-training-conditions" },
  ],
});
