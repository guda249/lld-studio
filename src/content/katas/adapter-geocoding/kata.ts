import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "adapter-geocoding",
  slug: "adapter",
  title: "Hide the geocoding vendor's units",
  domain: "Grocery delivery",
  difficulty: 1,
  task: "StoreFinder and DeliveryZone both call the vendor's geocode() and divide its millionths-of-a-degree numbers by hand. The company is moving to a cheaper geocoding vendor with a different response shape, which would mean rewriting both classes. Refactor it so only one class knows the vendor, and the rest of the code asks a simple Geocoder for (lat, lng).",
  goals: [
    "A Geocoder interface (an ABC in Python, a trait in Scala) with locate(address) returning (lat, lng) in degrees",
    "A GeoCodeApiAdapter that implements Geocoder, receives the GeoCodeApi through its constructor and does the unit conversion",
    "StoreFinder and DeliveryZone take a Geocoder and never name GeoCodeApi",
    "GeoCodeApi itself stays unchanged (it is third-party code)"
  ],
  hints: [
    "Find every place that reads lat_e6 or lng_e6. That knowledge belongs in one place.",
    "Write the interface your own code wishes the vendor had: one method that takes an address and returns degrees.",
    "Make a class that implements that interface, holds a GeoCodeApi, calls geocode() and divides by 1,000,000. Pass it into StoreFinder and DeliveryZone instead of the raw api."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
