import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "flyweight-parcels",
  slug: "flyweight",
  title: "Parcels that share carrier styles",
  domain: "Parcel depot",
  difficulty: 3,
  task: "Every Parcel stores its own copy of the carrier's logo bytes and service text, though a depot only uses a handful of carrier styles. At 50,000 parcels a day, the label service is running out of memory. Refactor it so parcels with the same carrier and service share one style object, and each parcel keeps only its own tracking number and weight.",
  goals: [
    "A CarrierStyle flyweight holding the shared data (carrier, service, logo) that never changes after creation",
    "A CarrierCatalog factory with a dict / Map cache that returns the same CarrierStyle for the same (carrier, service)",
    "Parcel (the context) keeps only tracking and weight plus a reference to a shared CarrierStyle",
    "No code outside the factory creates a CarrierStyle directly",
    "Same printed labels as before"
  ],
  hints: [
    "Split Parcel's fields into two groups: the ones that differ for every parcel, and the ones that repeat for many parcels.",
    "Move the repeated fields into their own immutable class. Then you need one place that hands out an existing object instead of making a new one.",
    "Write CarrierCatalog.style(carrier, service) that looks up (carrier, service) in a dict and creates CarrierStyle(...) only when it is missing (getOrElseUpdate in Scala). Pass the result into Parcel(tracking, weight, style)."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
