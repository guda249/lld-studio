import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "singleton-fxrates",
  slug: "singleton",
  title: "One exchange-rate table for the whole app",
  domain: "Travel booking",
  difficulty: 1,
  task: "Every price lookup creates a new ExchangeRates, which downloads the rate feed again. The bank has started rate-limiting the app, and hotel and flight prices can be quoted with different rates. Refactor ExchangeRates so the rates load once and every caller shares the same object.",
  goals: [
    "Only one ExchangeRates object can exist (Python: a class-level _instance and __new__; Scala: an object)",
    "The rates are loaded once, the first time they are needed",
    "In Python, creation is guarded by a lock so two threads can't load the rates twice",
    "HotelPricing and FlightPricing keep working with the same printed prices"
  ],
  hints: [
    "Count how many times ExchangeRates() runs in the demo. How many times should the rates be downloaded?",
    "Python: keep the one object on the class (_instance = None) and hand it out from __new__. Scala: there is a keyword for a class with exactly one instance.",
    "Python: in __new__, create the object and load the rates only when cls._instance is None, inside 'with cls._lock:'. Scala: change 'class ExchangeRates' to 'object ExchangeRates' and call ExchangeRates.convert(...) directly."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
