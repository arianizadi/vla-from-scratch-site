import { defineLesson } from "../define";
import { BlindGuess } from "./animations/BlindGuess";
import { FinishSentence } from "./animations/FinishSentence";
import { SwapPicture } from "./animations/SwapPicture";
import { TwoPaths } from "./animations/TwoPaths";

export default defineLesson({
  slug: "32-testing-a-vlm",
  idea: "A good training score does not prove a model looks at the picture: test it on new scenes, swap the picture, and feed it exactly as in training.",
  beats: [
    {
      title: "A good score with eyes shut",
      text: "A student can pass a quiz by learning the pattern of the questions. Much of a caption can be guessed from the words before it, so a model's training score can look great while it ignores the picture. A robot built on it would hear the instruction and see nothing.",
      animation: BlindGuess,
    },
    {
      title: "Ask what only the picture knows",
      text: "Show a scene the model has never seen, stop the caption at “from left to right:”, and let it finish. The simulator knows the true order. Guessing three objects in the right order succeeds about 1 time in 24, so a high score means the model really looked.",
      animation: FinishSentence,
    },
    {
      title: "Swap the picture",
      text: "Now keep the caption and change only the picture. Measure how surprised the model is by the true caption with its own picture, then with another scene's. A model that looks is far more surprised by the wrong picture. Equal surprise means the picture is not getting through.",
      animation: SwapPicture,
    },
    {
      title: "Test it the way you use it",
      text: "Training and real use often prepare pictures with different code. Run one picture through both routes and compare what comes out. Our first test scored no better than guessing for exactly this reason: the picture reached the model on a different brightness scale than in training.",
      animation: TwoPaths,
    },
  ],
  edgeCases: [
    "A test that loads pictures the way training does repeats training's mistakes, and passes while the model in real use is blind.",
    "A mistake made the same way in training and in use passes all three tests. Test the parts on their own too.",
    "Two scenes can share a caption. Swap in a picture from a clearly different scene, and average over many.",
    "Exact-match scoring counts a missing word as a wrong object. Read a few answers before trusting a low score.",
    "A test that fails early in training may pass later. Check the saved copies along the way, not only the last.",
  ],
  tips: [
    "Work out what guessing would score before you read any result.",
    "Compare the two routes first: it needs no model at all, and it can run as an automatic check.",
    "Print the smallest and largest pixel value right where the model receives it, in training and in use.",
  ],
  takeaway: "Never trust a training score alone: ask what only the picture knows, swap the picture, and make sure the model is fed exactly as it was trained.",
  related: ["31-training-a-vlm", "93-train-inference-skew", "92-measuring-failure"],
  lab: [{ label: "The data, the runs and what went wrong", href: "/lab#datasets-runs-bugs" }],
});
