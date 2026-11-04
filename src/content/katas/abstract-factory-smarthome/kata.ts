import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "abstract-factory-smarthome",
  slug: "abstract-factory",
  title: "Smart home devices that always match",
  domain: "Smart home",
  difficulty: 2,
  task: "HomeHub picks Zigbee or Wi-Fi lights and locks with an if/else on the protocol name. A Thread protocol is coming, and every routine (evening, away, wake-up) would need another branch, with nothing stopping a Wi-Fi lock from slipping into a Zigbee home. Refactor it so each protocol's devices come as one matching set.",
  goals: [
    "Light and Lock interfaces (ABCs in Python, traits in Scala) that each device implements",
    "A DeviceFactory interface with one creation method per device: create_light and create_lock",
    "One factory per protocol (ZigbeeFactory, WifiFactory) that makes the whole matching family",
    "HomeHub receives a DeviceFactory in its constructor and never names a concrete device class",
    "No if/else on the protocol name left in HomeHub"
  ],
  hints: [
    "Two things change together when the protocol changes: the light and the lock. That pair is a family.",
    "Give the light and the lock each an interface, then write one interface whose methods make a light and a lock.",
    "Write ZigbeeFactory and WifiFactory implementing DeviceFactory, and pass one into HomeHub(...) instead of the protocol string."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
