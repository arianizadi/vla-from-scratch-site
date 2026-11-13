import { defineLesson } from "../define";
import { FiftyTries } from "./animations/FiftyTries";
import { Handshakes } from "./animations/Handshakes";
import { PooledVsPatches } from "./animations/PooledVsPatches";
import { SameCaption } from "./animations/SameCaption";

export default defineLesson({
  slug: "21-pooled-vs-patch-tokens",
  idea: "A picture can reach the robot as one summary or as one token per patch; only the patches keep where things are, and grabbing needs where.",
  beats: [
    {
      title: "A summary or the whole map",
      text: "Describe a photo in one sentence and the layout is gone. **Pooling** does that: it blends every patch token into one list of numbers, a **summary vector**. Keep the patch tokens instead and their grid survives. The summary can say what is there; only the grid says where.",
      animation: PooledVsPatches,
    },
    {
      title: "A caption never says where",
      text: "Some **encoders**, models that turn pictures into numbers, learn by matching pictures to captions. “A red cube on a table” stays true when the cube slides 3 cm, so nothing pushes their summary to tell those pictures apart. A robot hand cares: a few centimetres decide whether a grasp holds.",
      animation: SameCaption,
    },
    {
      title: "What happened on the robot",
      text: "We tried both on one pick-up task. With one summary per picture, the robot lifted the cube in 2 of 50 new layouts; with every patch, in 15. Other parts of the two robots differed too, so read it as a strong hint, not a clean test.",
      animation: FiftyTries,
    },
    {
      title: "More tokens, more comparisons",
      text: "Inside the model, every token compares itself with every other, like guests at a party who all shake hands. Double the guests and the handshakes grow fourfold. Every patch of every camera picture adds up to hundreds of tokens, so keeping where costs real work each time the robot acts.",
      animation: Handshakes,
    },
  ],
  edgeCases: [
    "Having every patch token is not the same as using it. Robots given all the patches still failed until other parts of the recipe let them look.",
    "A summary is not empty of position. Some survives inside its numbers, blurred and hard to read.",
    "Big patches blur position too. A patch two or three cubes wide hides where inside it the cube sits.",
    "A robot can reach a low training loss and still grasp thin air. A low loss does not prove it looks at the scene.",
  ],
  tips: [
    "Ask what the robot needs: naming objects can live with a summary, grasping needs where.",
    "Count tokens before training: cameras times moments times patches per picture, plus the words.",
    "If the gripper closes on empty air, move the object and check whether the grasp follows it.",
  ],
  takeaway: "Pooling keeps what is in a picture and blurs where it is; a robot that must grasp needs the patch tokens that keep where.",
  related: ["20-images-to-tokens", "22-pretrained-vision-encoders", "50-what-the-action-head-sees"],
  lab: [
    { label: "How far off a grasp can be and still hold", href: "/lab#grasp-tolerance" },
    { label: "Robots that had every patch and still failed", href: "/lab#before-the-fix" },
  ],
  tryIt: ["pooled-vs-tokens"],
});
