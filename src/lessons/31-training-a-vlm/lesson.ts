import { defineLesson } from "../define";
import { CoarseBands } from "./animations/CoarseBands";
import { MaskedLoss } from "./animations/MaskedLoss";
import { SimCaptions } from "./animations/SimCaptions";
import { WhichWordsTeach } from "./animations/WhichWordsTeach";

export default defineLesson({
  slug: "31-training-a-vlm",
  idea: "A vision-language model learns to see by guessing the words of picture captions, and only the words that depend on the picture teach it anything about seeing.",
  beats: [
    {
      title: "Guess the next word, with a picture",
      text: "Picture a quiz: guess the next word describing a photo. A vision-language model trains like a language model, predicting each next word, but a picture sits before the **caption**, the text describing it. Only caption words are graded. Each wrong guess sends a correction through every part, eyes included.",
      animation: MaskedLoss,
    },
    {
      title: "Only some words need the picture",
      text: "“Robot arm over a table. From left to right: a …” The opening words never change, so the model can guess them blind. Which object comes next is written only in the picture. Those few words are the ones that teach the model to see.",
      animation: WhichWordsTeach,
    },
    {
      title: "The simulator writes the captions",
      text: "A simulator knows where every object stands. It works out where each one lands in the camera picture, sorts them left to right and fills in a sentence. That gives thousands of correct captions for free, with nobody labelling pictures by hand.",
      animation: SimCaptions,
    },
    {
      title: "What captions cannot teach",
      text: "Captions say left, middle or right: bands about 30 cm wide on the table. A grasp needs about 1 cm. So captions teach the model which object is which, and the exact spot has to come from robot demonstrations. We saw that: captions mainly bought an earlier start.",
      animation: CoarseBands,
    },
  ],
  edgeCases: [
    "A low training error can come from the guessable words alone. It does not show the picture is being used.",
    "If every caption only listed objects in random order, the model could ace it knowing what is there and never where.",
    "A caption checks only an object's centre, so an object hidden behind the arm can still be named. Some labels are wrong.",
    "A caption too long for the row gets cut, and the cut can remove the start of the prompt without warning.",
  ],
  tips: [
    "Write captions whose key words can only come from the picture: the order, which is leftmost, which band.",
    "When the vision part starts from nothing, train every part together. A locked, untrained encoder cannot learn to see.",
    "Judge the model by a test of what only the picture knows, not by its training error.",
  ],
  takeaway: "A vision-language model learns to see by guessing caption words; only the words that depend on the picture teach vision, so the captions decide what it sees.",
  related: ["30-joining-vision-and-language", "32-testing-a-vlm", "13-training-a-language-model"],
  lab: [{ label: "Captions as pretraining for a robot backbone", href: "/lab#backbones" }],
  tryIt: ["sequence-layout"],
});
