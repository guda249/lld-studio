import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "command-playlist",
  slug: "command",
  title: "Playlist edits you can undo",
  domain: "Music streaming",
  difficulty: 3,
  task: "PlaylistEditor does each edit in one if/elif and reverses it in a second if/elif, using tuples as its history. Product wants \"rename\" and \"shuffle\" next, and every new action means editing both branches and keeping the tuple layout in sync. Refactor it so each edit is an object that knows how to do and undo itself.",
  goals: [
    "A Command interface (an ABC in Python, a trait in Scala) with execute and undo",
    "AddSong, RemoveSong and MoveSong each implement it and get the Playlist from outside",
    "Commands remember what undo needs (like the old position) during execute",
    "PlaylistEditor runs any Command, keeps a history of Command objects and never names a concrete command",
    "The demo prints the same three lines as before"
  ],
  hints: [
    "Each branch of edit() has a twin in undo(). Those two pieces belong together in one class.",
    "Write a Command with execute() and undo(), then one class per action that holds the playlist, the song and anything undo must remember (the old index).",
    "Turn PlaylistEditor into an invoker: run(command) calls command.execute() and pushes it on a history list; undo() pops the last command and calls its undo(). The demo creates AddSong(playlist, \"Intro\") and so on."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
