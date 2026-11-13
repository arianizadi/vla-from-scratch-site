import { defineLesson } from "../define";
import { Heartbeat } from "./animations/Heartbeat";
import { SavePoints } from "./animations/SavePoints";
import { WatcherLoop } from "./animations/WatcherLoop";
import { WhatASaveHolds } from "./animations/WhatASaveHolds";

export default defineLesson({
  slug: "81-surviving-long-runs",
  idea: "A long training run survives by saving its progress often, giving a sign of life, and having a watcher that restarts it from the last save when it stops.",
  beats: [
    {
      title: "Save points",
      text: "Training a policy can take hours, and anything can stop it. A [checkpoint](/learn/80-the-training-loop) is a save point, as in a video game. After a crash the run goes back to its newest save and loses only the work since. Saving more often loses less.",
      animation: SavePoints,
    },
    {
      title: "Resume, don't restart",
      text: "Keeping only the weights is like keeping a book but losing the bookmark. A save point also holds the **optimiser memory**, a running record of recent steps that shapes the next one, and the step count that sets the stride. Restore it all and the run carries on unchanged.",
      animation: WhatASaveHolds,
    },
    {
      title: "Loud crashes, silent hangs",
      text: "A crash is loud: the program stops. A **hang** is silent: the program waits forever and still looks alive. So a run needs a **heartbeat**, like a patient's monitor: a sign that changes only while training moves, such as a progress line written every second or so.",
      animation: Heartbeat,
    },
    {
      title: "A watcher that restarts",
      text: "Think of a lifeguard. A **supervisor** is a small program that starts the run and checks its heartbeat every half minute. Silent for minutes? It stops the run and starts again from the newest save, until training reports it is done. A failure overnight then costs minutes.",
      animation: WatcherLoop,
    },
  ],
  edgeCases: [
    "A run stopped on purpose and a hung run look the same from outside. Leave a note when you stop one, so neither you nor the watcher mistakes it.",
    "Saving a large checkpoint makes the heartbeat pause. Too short a wait before restarting kills healthy runs.",
    "An error that repeats, like a wrong setting, makes the watcher restart forever. A save count that never grows is the sign.",
  ],
  tips: [
    "Try a tiny run from start to finish before the long one.",
    "Choose how often to save by asking how much work you can afford to lose.",
    "Check that every save fits on disk before you start: each holds the weights, the optimiser's memory and the averaged copy.",
    "Judge a run that looks stuck by its heartbeat, not by whether the program still exists.",
  ],
  takeaway: "Save often, give the run a heartbeat, and let a watcher restart it from the last save: a crash then costs minutes, not the night.",
  related: ["80-the-training-loop", "90-closed-loop-evaluation", "71-how-much-data-and-training"],
  lab: [{ label: "Bugs found and fixed, the silent hang among them", href: "/lab#bugs" }],
});
