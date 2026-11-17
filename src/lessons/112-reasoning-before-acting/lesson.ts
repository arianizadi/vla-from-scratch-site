import { defineLesson } from "../define";
import { CountMiss } from "./animations/CountMiss";
import { HiddenLabel } from "./animations/HiddenLabel";
import { LookupFails } from "./animations/LookupFails";
import { ResetMove } from "./animations/ResetMove";
import { NoteSwapWithFilm } from "./animations/WithFilm";
import { V2PipelineWithFilm } from "./animations/WithFilm";

export default defineLesson({
  slug: "112-reasoning-before-acting",
  idea: "When the shoot to cut must be seen, counted or remembered, a robot does better if it first works the answer out, then hands the arm one small step.",
  beats: [
    {
      title: "Same words, different shoot",
      text: "“The second jar from the top” depends on the shelf. The plant of [the pruning lesson](/learn/111-pruning-a-plant) is the same: with three shoots, “the second from the top” is the middle one; with two, the lowest. A policy mapping words to a shoot cannot tell, and solved 21 tries in 100.",
      animation: LookupFails,
    },
    {
      title: "Write a note, then act",
      text: "A **vision-language model** reads pictures and words. It writes a short **note**: what it sees, the question, the answer, the next step. A small **fast policy** reads only the next step and moves the arm: 133 tries in 200. Swap that line for another shoot's, and the arm follows it.",
      animation: NoteSwapWithFilm,
    },
    {
      title: "A note remembers",
      text: "A card in the pot names the shoot, but often faces away. The robot turns the plant to read it, then turns the named shoot into reach, which often hides the card again. The camera has lost it; the note has not. Without a note, the robot can only guess.",
      animation: HiddenLabel,
    },
    {
      title: "Two faults in the note writer",
      text: "It could not count. Its training graded only the words of its notes, never what it saw, so it wrote “2 shoots” for almost every plant with three. Training cost it language too: as downloaded, the model got the meaning of 92 new wordings in 100; after, 60.",
      animation: CountMiss,
    },
    {
      title: "Eyes, memory and a written program",
      text: "Version two splits it up. Trained **eyes** turn pictures into one record per part, counting right in 97–99% of them. A **scene memory** keeps the records. The language model, never retrained, writes the instruction as a tiny **program**; code runs it. The same fast policy acts: 169 tries in 200.",
      animation: V2PipelineWithFilm,
    },
    {
      title: "A reset, and the next limit",
      text: "The arm is now the limit. About one try in ten, it goes for a shoot facing away without turning the plant. A **reset** sends it back to the start to choose again. Told which way to turn, it turned well but lost as many tries by turning too far.",
      animation: ResetMove,
    },
  ],
  edgeCases: [
    "A note can be narration. Unless swapping its words changes what the arm does, a fine note proves nothing about the action.",
    "Right in almost every picture is not right in every try. The eyes, trained on the expert's tries, sometimes saw a cut that never happened.",
    "Not yet tested on this robot: change the lighting, the camera or the bench, and the newest pruning policies fall to 0–4 tries in 100. Redrawing the examples in new looks did not fix it.",
    "A grammar makes every program well formed, not correct. Eight new wordings in 100 became programs that meant something else.",
    "More memory is not always better. A fast policy that also saw a picture from one second earlier did no better than one without.",
  ],
  tips: [
    "Test each level alone. Give the arm perfect sub-goals, and give the planner the true scene. The gap shows which level to fix.",
    "Grade a model on what it must see, not only on what it writes. A count learned from words alone may never be learned.",
    "Try a language model as it comes, with a few worked examples, before training it on a narrow format.",
    "Repeat a result with a second training run before trusting it. A second fast policy gave 175 and 157, close to 180 and 165.",
    "Watch the first move. Many lost tries began with the arm heading for a shoot it could not reach.",
  ],
  takeaway: "When the answer has to be seen, counted or remembered, work it out first in a form you can check, then hand the arm one small, clear step.",
  related: ["111-pruning-a-plant", "51-language-conditioning", "14-generation", "52-history-and-shortcuts"],
  lab: [{ label: "The reasoning robot, its numbers and its films", href: "/lab" }],
});
