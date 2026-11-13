import { defineLesson } from "../define";
import { HiddenAnswer } from "./animations/HiddenAnswer";
import { OneExample } from "./animations/OneExample";
import { PixelScale } from "./animations/PixelScale";
import { TwoKitchens } from "./animations/TwoKitchens";

export default defineLesson({
  slug: "93-train-inference-skew",
  idea: "A model must be fed the same kind of numbers on the robot as in training; a silent difference breaks it without any error message.",
  beats: [
    {
      title: "Two kitchens, one recipe",
      text: "Bake a recipe written in grams on a scale set to ounces: every step looks right, the cake fails, nothing warns you. A model has two kitchens. The **training path** prepares inputs from stored files; the **serving path** prepares them live on the robot. Any difference between them is **skew**.",
      animation: TwoKitchens,
    },
    {
      title: "Same picture, different numbers",
      text: "Pixel brightness is stored from 0 to 255. One path divided it by 255; the other did not. Same picture, numbers hundreds of times larger, no error. Training only checks itself, so its score looked fine. With the paths matched, a model that rarely listed a scene's objects in order got most right.",
      animation: PixelScale,
    },
    {
      title: "An answer hidden in the input",
      text: "Picture practice tests with the first answer pencilled in the margin. A policy with **memory** gets its previous move as input. In training, the first “previous move” was copied from the expert and already pointed at the target. On the robot it said “stay still”. Fixing that slot lifted success from 1 to 22 in 100.",
      animation: HiddenAnswer,
    },
    {
      title: "Taste one spoonful from both",
      text: "Take one stored example, prepare it on both paths, and compare what reaches the model: its size, its range and its values. Wherever they differ, there is your skew. After fixing it, add a small automatic test that fails the moment the difference comes back.",
      animation: OneExample,
    },
  ],
  edgeCases: [
    "A mistake both paths share passes every comparison. Both can be wrong in the same way, and only a check of what the numbers should be will find it.",
    "A test that builds its own inputs can disagree with the real robot. Feed checks the way the robot is fed.",
    "Filler added to make training batches the same length can shift where a special marker sits, while the robot, with no filler, puts it elsewhere.",
    "Closing a skew does not remove a shortcut both paths share. After the first move, the previous move still predicts the next one.",
  ],
  tips: [
    "Let one shared piece of code prepare inputs for both training and the robot, so there is only one way to get it wrong.",
    "Print the size and the smallest and largest value of every input, once from training and once from the robot.",
    "Write down what must never change, such as “padding a prompt must not change the answer”, and turn it into a test.",
    "When a trained model looks broken, suspect the inputs before the model.",
  ],
  takeaway: "The training score can't catch a mismatch between training and the robot; push one example through both paths and compare what the model receives.",
  related: ["10-tokens", "32-testing-a-vlm", "52-history-and-shortcuts", "94-debugging-flowchart"],
  lab: [
    { label: "Policies with and without memory of their last move", href: "/lab#history" },
    { label: "A bug shared by both paths, and the models it reached", href: "/lab#position-fix" },
  ],
  tryIt: ["padding-shift"],
});
