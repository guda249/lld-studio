import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "factory-method-rides",
  slug: "factory-method",
  title: "Ride booking without the if/elif",
  domain: "Ride hailing",
  difficulty: 1,
  task: "RideBooking.quote() picks Bike or Car with an if/elif on a string. The product team wants scooters and vans next month, and each one means editing quote() again. Refactor it so a new ride type is a new subclass and quote() never changes.",
  goals: [
    "A Vehicle interface (an ABC in Python, a trait in Scala) that Bike and Car implement",
    "RideBooking has a factory method (create_vehicle / createVehicle) that returns a Vehicle",
    "quote() calls the factory method and never names Bike or Car",
    "At least two RideBooking subclasses, each overriding the factory method to make its own vehicle",
    "No if/elif on the ride kind left anywhere"
  ],
  hints: [
    "Compare the branches: only the line that makes the vehicle differs. The price text is the same for every ride.",
    "Move the vehicle creation into its own method on RideBooking, and make quote() call it instead of branching.",
    "Make that method abstract, then write BikeBooking and CarBooking that override it to return Bike() and Car()."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
