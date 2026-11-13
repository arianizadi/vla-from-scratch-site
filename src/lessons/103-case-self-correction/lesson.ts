import { defineLesson } from "../define";
import { DataMix } from "./animations/DataMix";
import { MoveTest } from "./animations/MoveTest";
import { Retry } from "./animations/Retry";
import { TwoTeachers } from "./animations/TwoTeachers";

export default defineLesson({
  slug: "103-case-self-correction",
  idea: "A robot that only looked once learned to follow a moved object and retry a missed grasp, once its examples showed recoveries.",
  beats: [
    {
      title: "The test: slide the object away",
      text: "Imagine reaching for your mug while someone slides it aside. Our robot lifted the named object 93 times in 100. But slide the object mid-reach and it failed every time, closing its hand where the object used to be. It chose its target at the first look, then followed its own arm.",
      animation: MoveTest,
    },
    {
      title: "Can anyone recover?",
      text: "Before blaming the learner, check the teacher. A **scripted teacher** (a hand-written program that knows where everything is) that plans once fails this test too. One that plans again whenever the object moves succeeds every time. So recovering is possible; the robot's examples had never shown it.",
      animation: TwoTeachers,
    },
    {
      title: "Examples that go wrong on purpose",
      text: "So we recorded new **demonstrations** (examples the robot copies). The arm starts from random poses, and in about a third the object is moved while the teacher recovers. Think of a driving instructor who practises skids, not only straight roads. The robot itself and its training stayed the same.",
      animation: DataMix,
    },
    {
      title: "It keeps looking, and tries again",
      text: "Now the robot follows a moved object. When its jaws close on nothing, it rises and tries again. It succeeds about 9 times in 10, whatever the disturbance. Freeze its cameras after the first picture and it fails: it really steers by what it sees.",
      animation: Retry,
    },
  ],
  edgeCases: [
    "A second grab is not a success: it can miss too. Count lifted objects, not attempts.",
    "Sometimes there is no free spot to move the object to. Leave those tries out, or the score looks better than it is.",
    "Recoveries alone cost a few points on the undisturbed task. Adding random start poses won most of them back.",
    "Clean examples teach a shortcut: the arm's own path already points at the goal, so the robot stops looking.",
    "Every example ends at the lift. Nothing yet teaches what to do after the task is done.",
  ],
  tips: [
    "Disturb your robot on purpose: move the object mid-reach and at the grasp, and watch what it does.",
    "Check that a scripted teacher can recover before you expect a learner to.",
    "Put mistakes and their fixes into the examples, not only perfect runs.",
    "Freeze the cameras after the first picture to test whether the robot uses what it sees later.",
  ],
  takeaway: "A robot copies what its examples show. If they never go wrong, it never learns to recover; show it recoveries, and it keeps looking and tries again.",
  related: ["101-case-pick-target", "95-what-a-policy-looks-at", "72-which-demonstrations-teach"],
  lab: [
    { label: "Every policy under every disturbance", href: "/lab#outside-the-training-conditions" },
    { label: "What the demonstrations contain", href: "/lab#demonstrations" },
  ],
  tryIt: ["disturbance", "arm-replay"],
});
