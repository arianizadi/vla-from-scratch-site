import { defineLesson } from "../define";
import { OffsetGap } from "./animations/OffsetGap";
import { OrderBlind } from "./animations/OrderBlind";
import { PositionCollapse } from "./animations/PositionCollapse";
import { RotaryDial } from "./animations/RotaryDial";

export default defineLesson({
  slug: "12-positions",
  idea: "Attention alone cannot tell word order, so each word is turned by an angle set by its place, and words then see how far apart they are.",
  beats: [
    {
      title: "A bag of words",
      text: "Tip Scrabble tiles into a bag and the order is gone. Attention has the same blind spot: it compares words by what they are, not where they are. So “red cube left of green can” and “green can left of red cube” look identical. For a robot, that order decides which object moves.",
      animation: OrderBlind,
    },
    {
      title: "Turn each word by its place",
      text: "Picture each word as a clock hand. **Rotary positions** turn the hand by an angle set by the word's **position**, its place number in the line. When two words compare, only the angle between them counts, and that depends on how far apart they sit. Same gap, same match, anywhere in the sentence.",
      animation: RotaryDial,
    },
    {
      title: "Same gaps in practice and on the job",
      text: "If friends sit two seats apart at every rehearsal, moving them on opening night confuses everyone. In training, prompts are stacked with blank padding; served alone, a prompt has none. That would change the gaps between words and actions. So every prompt gets the same number of seats, and each word always sits in the same place.",
      animation: OffsetGap,
    },
    {
      title: "Every word needs its own place",
      text: "If a post office rounded house numbers, three houses would share one number and their mail would mix. Positions stored with too few digits do the same: neighbours round to one place and lose their order, with no error. When we gave every step its own exact place, our robot picked the named object more often.",
      animation: PositionCollapse,
    },
  ],
  edgeCases: [
    "Order is not free. Without position information, a transformer reads a sentence as a bag of words.",
    "Rotary positions change how words compare, not what they mean: each word's content is untouched.",
    "A model only learned the gaps it saw. Inputs much longer than in training can confuse it.",
    "If training and real use place words differently, the model meets gaps it never learned, and nothing warns you.",
  ],
  tips: [
    "Think in gaps, not addresses: the model cares how far apart two words are.",
    "Lay out inputs the same way in training and in use, blanks included.",
    "Give every item its own place. Two items on one place look like one.",
  ],
  takeaway: "Rotary positions turn each word by its place, so attention sees how far apart words are; keep those gaps the same in training and in use.",
  related: ["11-the-transformer-block", "13-training-a-language-model", "93-train-inference-skew"],
  lab: [{ label: "Success before and after every step got its own place", href: "/lab#position-fix" }],
  tryIt: ["rotary"],
});
