/**
 * One plain line per field note, shown before the note's full text (which
 * opens on click). Keyed by the entry number in content/notes.md; a new
 * entry without a line here shows its title alone.
 */
export const PLAIN_NOTES: Record<number, string> = {
  1: "Before blaming the robot, make sure a hand-written program can do the task in the same test.",
  2: "A robot can look great while practising and still fail every real try. Only real tries tell.",
  3: "Record where the gripper closed, not only whether it worked: the miss tells you why.",
  4: "Find out how close is close enough before chasing precision.",
  5: "Squeezing a picture into one summary loses where things are. The robot needs the pieces.",
  6: "The failing robot was not aiming between the objects. It was not looking at all.",
  7: "Keep training: looking at the scene can appear suddenly, long after it seems hopeless.",
  8: "Giving the robot its last move let it guess the goal from that instead of using its cameras.",
  9: "A robot that succeeds may still glance once and never check again.",
  10: "Which examples you show shapes when, and how well, the robot learns to look.",
  11: "A robot recovers from a mistake only if its examples show someone recovering.",
  12: "Keep an averaged copy of the model, and try fewer refinement steps: they were enough.",
  13: "What looked like a hard grasp was mostly one hidden bug.",
  14: "Feed the robot exactly the same way when testing as when training. Small differences hide well.",
  15: "Long training runs crash. Save often and restart automatically.",
  16: "A pretrained starting point helped the robot learn to look sooner, not end much better.",
  17: "Many experiments on one machine invite mix-ups. Check which model each test is talking to.",
};
