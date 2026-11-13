import { defineLesson } from "../define";
import { EveryObjectNamed } from "./animations/EveryObjectNamed";
import { SameTable } from "./animations/SameTable";
import { WhichObject } from "./animations/WhichObject";
import { WordsMeetPictures } from "./animations/WordsMeetPictures";

export default defineLesson({
  slug: "51-language-conditioning",
  idea: "An instruction can steer the arm only if its words reach the action head beside the image pieces, and the policy learns it needs them.",
  beats: [
    {
      title: "Only the words say which",
      text: "Three objects lie on the table and the picture looks the same whatever you ask for. “Pick up the green can” is the only clue to which one. So the sentence must reach the **action head**, the part that writes the moves, or the robot can only guess.",
      animation: WhichObject,
    },
    {
      title: "Words say which, pictures say where",
      text: "Like a friend pointing at a photo while you say “that one”, the policy joins two clues. The sentence becomes word **tokens** placed in the same row as the image pieces. The word “can” says which; the piece showing the can says where. Change two words, and the target moves.",
      animation: WordsMeetPictures,
    },
    {
      title: "Is it listening?",
      text: "Keep the table, change the sentence. A policy that listens closes its gripper at a different object each time; one that ignores the words closes at the same spot. With three objects, ignoring still hits the named one about one time in three. That is **chance**, not listening.",
      animation: SameTable,
    },
    {
      title: "Make the words necessary",
      text: "If each training scene comes with one sentence, a policy can memorise scenes instead of reading, like a student who knows which answer goes with which page. We recorded each scene several times, naming every object in turn. Then only the words differ, and our policy learned to listen sooner.",
      animation: EveryObjectNamed,
    },
  ],
  edgeCases: [
    "Closing near the named object is not grasping it. A policy can point the right way and still miss by centimetres.",
    "These policies know only the training sentences. A new wording maps to word tokens they never learned.",
    "A policy can read the sentence once at the start and then follow its own arm. Changing course mid-reach needs other training.",
    "The words being in the row does not mean they are used. Our policies ignored them for a long stretch of training.",
  ],
  tips: [
    "Compare how often it closes at the named object with chance: one in three, for three objects.",
    "Keep the table and change only the sentence. A listening policy goes somewhere different.",
    "Name every object of a training scene in turn, so only the words tell runs apart.",
  ],
  takeaway: "Words say which, pictures say where; the instruction steers the arm only when both sit in the action head's row and training makes the words necessary.",
  related: ["10-tokens", "50-what-the-action-head-sees", "72-which-demonstrations-teach", "92-measuring-failure"],
  lab: [
    { label: "When the policy starts to follow the instruction", href: "/lab#what-it-depends-on" },
    { label: "Which demonstrations made it listen sooner", href: "/lab#demonstrations" },
  ],
  tryIt: ["sequence-layout", "grasp-map"],
});
