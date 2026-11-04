import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "proxy-geocoding",
  slug: "proxy",
  title: "One cache in front of a paid map API",
  domain: "Maps and delivery",
  difficulty: 2,
  task: "Every function that needs coordinates checks and fills a shared cache by hand before calling the paid map API. A new delivery-time feature needs lookups too, and if its author forgets the cache, the bill goes up. Refactor it so the caching lives in one place and callers just ask for coordinates.",
  goals: [
    "A Geocoder interface (an ABC in Python, a trait in Scala) with the lookup method",
    "MapApiGeocoder and a caching proxy class both implement Geocoder",
    "The proxy holds the real geocoder and calls it only for addresses it hasn't seen yet",
    "plan_route and drop_pin take a Geocoder and contain no cache code",
    "The demo prints the same lines, with the same number of API calls"
  ],
  hints: [
    "Look at what plan_route and drop_pin repeat: the check-then-fill around every lookup call.",
    "Write a class that has the same lookup method as MapApiGeocoder, keeps the cache as its own field, and holds the real geocoder.",
    "Add a Geocoder interface that both classes implement, pass CachingGeocoder(MapApiGeocoder()) to the callers, and type their parameter as Geocoder."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
