import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "prototype",
  task: "Every offer letter is set up by hand, and Arjun's copy has already drifted from Priya's. Refactor it into the Prototype pattern so each letter is a copy of one configured template and only the differences are changed.",
  goals: [
    "An interface (an ABC in Python, a trait in Scala) with a duplicate() method",
    "Document implements duplicate() and returns a new object, not itself",
    "The copy is deep: the sections and metadata of a copy are its own, so editing it never changes the template",
    "Optional: a registry that stores named templates and hands out copies, never the templates themselves"
  ],
  hints: [
    "Build one fully configured offer letter first. What would you need to make the next one from it?",
    "Give Document a duplicate() method. Watch out: the sections list and the metadata map must be copied too, not shared.",
    "In Python, return copy.deepcopy(self). In Scala, return Document(title, mutable.ListBuffer.from(sections), mutable.Map.from(metadata)). Then keep the template in a registry whose create(key) returns templates[key].duplicate()."
  ]
};

export default exercise;
