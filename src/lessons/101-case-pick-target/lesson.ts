import { defineLesson } from "../define";
import { FrozenCameras } from "./animations/FrozenCameras";
import { IgnoresScene } from "./animations/IgnoresScene";
import { OnsetOrder } from "./animations/OnsetOrder";
import { SlopeTest } from "./animations/SlopeTest";

export default defineLesson({
  slug: "101-case-pick-target",
  idea: "With three objects on the table, the first robots ignored the scene; long enough training made them look, and a simple test showed they looked only once.",
  beats: [
    {
      title: "Every first robot failed",
      text: "Three objects stand on the table and the instruction names one: “pick up the green can”. Every first robot moved well, closed its hand at the right height, and almost never lifted the named object: at most 6 times in 100. A **scripted teacher** (a program that knows where everything is) managed 99.",
      animation: IgnoresScene,
    },
    {
      title: "Not aiming between: not aiming at all",
      text: "First guess: it aimed between the objects. To check, compare how far the hand's closing point moves with how far the object moved: the **slope**. Following the object gives 1; aiming at the middle of three, about a third. The robots measured about 0: they ignored the scene.",
      animation: SlopeTest,
    },
    {
      title: "Practice long enough, and it clicks",
      text: "More **demonstrations** (recorded examples of the teacher) and a much longer training run changed that. First the slope rose: it headed for the right object. Then its misses shrank. Then it lifted the object, 85 times in 100. A run that stops before this looks exactly like a run that cannot learn.",
      animation: OnsetOrder,
    },
    {
      title: "It looked only once",
      text: "Does it keep watching while it reaches? Freeze its camera on the very first picture, and it still heads for the right object. It chose at the first glance, then followed its own arm. Varied demonstrations later fixed that, reaching 98 in 100: [a robot that corrects itself](/learn/103-case-self-correction).",
      animation: FrozenCameras,
    },
  ],
  edgeCases: [
    "A low training score said nothing here: robots with tiny training error lifted nothing. Only driving the real task tells you.",
    "Watching the robot fail is not enough. Measure where its hand closes, or you will guess the wrong cause, as we first did.",
    "Giving the robot its previous move as an input let it copy that move instead of looking, so it never learned to look.",
    "A training run that is too short never reaches the click, and resuming it later does not give you the long run.",
  ],
  tips: [
    "Score a new robot against a scripted teacher on the same tests: if the teacher fails too, the test is the problem.",
    "Plot where the hand closes against where the object stood. The slope says whether the robot looks at all.",
    "Decide the training length before you start, and test saved snapshots along the way.",
    "Freeze the camera or move the object to see what the robot really depends on.",
  ],
  takeaway: "First check whether a failing robot looks at the scene at all, then train long enough for it to start, then test whether it keeps looking.",
  related: ["100-case-pick-cube", "92-measuring-failure", "71-how-much-data-and-training", "103-case-self-correction"],
  lab: [
    { label: "The first rounds, and where the hand closed", href: "/lab#before-the-fix" },
    { label: "What the policies depend on", href: "/lab#what-it-depends-on" },
  ],
  tryIt: ["grasp-map", "onset"],
});
