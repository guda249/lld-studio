import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "flyweight",
  task: "Every CarMarker keeps its own copy of the same 50 KB icon, so 100,000 cars would need gigabytes of identical data. Refactor it into the Flyweight pattern so all markers with the same icon and colour share one style object.",
  goals: [
    "A small immutable style class holds the shared (intrinsic) data: icon and colour",
    "A factory keeps a cache and returns the existing style for the same key",
    "The marker class keeps only its own (extrinsic) data, its position, plus a reference to a style",
    "The client gets styles from the factory and never builds them directly",
    "Nothing changes a style after it is created"
  ],
  hints: [
    "Sort CarMarker's fields into two groups: the same for many cars, and different for every car.",
    "Put the shared fields into their own frozen dataclass (a final case class in Scala), and give the marker one field of that type.",
    "Write a factory with a dict (a Map in Scala) from (icon, colour) to style: return the stored one if the key is there, otherwise create, store and return it."
  ]
};

export default exercise;
