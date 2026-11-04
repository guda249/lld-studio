import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const elevator: CaseStudy = {
  slug: "elevator",
  title: "Elevator System",
  difficulty: 3,
  tagline: "Hall calls, car calls and a state machine that moves the cars.",
  prompt:
    "Design the control system for a building with several elevators. People press up or down on a floor, and " +
    "press a floor number inside the car. Decide which car answers a call, and show how a car moves, stops and opens its doors.",
  clarify: [
    { q: "How many cars and floors?", a: "A handful of cars and up to a few dozen floors. The demo uses 2 cars and floors 0 to 9." },
    { q: "Which car answers a hall call?", a: "The nearest car that is idle or already going that way past the floor. The rule must be easy to swap (zoning, rush hour)." },
    { q: "Once moving, in what order does a car serve its stops?", a: "Keep going in the same direction while there are stops that way, then turn around (the classic \"elevator algorithm\", also called SCAN)." },
    { q: "How do we model time?", a: "In ticks. Each tick a car moves one floor, or its doors stay open for one tick. The caller drives the ticks, so the demo is repeatable." },
    { q: "Do we handle weight limits, emergencies or maintenance mode?", a: "Not in the core design. We discuss them as follow-ups (maintenance is one more state)." }
  ],
  requirements: {
    functional: [
      "A hall call (floor + up/down) is assigned to one car",
      "A car call (floor pressed inside a car) is added to that car's stops",
      "Each tick a car moves one floor toward its next stop, or opens its doors at a stop",
      "A car keeps its direction while it has stops ahead, then turns around or goes idle",
      "Reject floors that do not exist"
    ],
    nonFunctional: [
      "Deterministic simulation: time is a tick counter passed in, no clock and no threads",
      "Each state's rules live in one class, so a new state (maintenance, fire mode) is easy to add",
      "The dispatch rule can be swapped without touching the cars"
    ],
    outOfScope: ["Door sensors and weight limits", "Real motors and timing", "A user interface", "Multiple controllers or a network"]
  },
  entities: [
    { name: "ElevatorController", responsibility: "The building's entry point: takes hall and car calls, picks a car, advances time." },
    { name: "Elevator", responsibility: "One car: current floor, set of stops, and its current state object." },
    { name: "ElevatorState", responsibility: "What one tick means for the car, and which state comes next." },
    { name: "DoorsOpenState", responsibility: "Serves the floor, then decides: keep going, turn around, or go idle." },
    { name: "DispatchStrategy", responsibility: "Chooses which car answers a hall call (NearestCarStrategy)." },
    { name: "Request", responsibility: "A hall call: floor and the direction the person wants to go." },
    { name: "Direction", responsibility: "Up, down or idle; used by requests, states and dispatch." }
  ],
  uml: {
    classes: [
      { name: "ElevatorController", kind: "concrete", members: ["- elevators: list[Elevator]", "- strategy: DispatchStrategy", "+ hall_call(request)", "+ car_call(name, floor)", "+ step()"] },
      { name: "Elevator", kind: "concrete", members: ["+ floor: int", "+ stops: set[int]", "- state: ElevatorState", "+ set_state(state)", "+ step(tick)"] },
      { name: "ElevatorState", kind: "interface", members: ["+ step(elevator)", "+ direction()", "+ label()"] },
      { name: "IdleState", kind: "concrete", members: ["+ step(elevator)"] },
      { name: "MovingUpState", kind: "concrete", members: ["+ step(elevator)"] },
      { name: "MovingDownState", kind: "concrete", members: ["+ step(elevator)"] },
      { name: "DoorsOpenState", kind: "concrete", members: ["+ going: Direction", "+ step(elevator)"] },
      { name: "DispatchStrategy", kind: "interface", members: ["+ choose(elevators, request)"] },
      { name: "NearestCarStrategy", kind: "concrete", members: ["+ cost(e, request)", "+ choose(elevators, request)"] },
      { name: "Request", kind: "concrete", members: ["+ floor: int", "+ direction: Direction"] },
      { name: "Direction", kind: "enum", members: ["UP", "DOWN", "IDLE"] }
    ],
    relations: [
      { from: "ElevatorController", to: "Elevator", type: "aggregation" },
      { from: "ElevatorController", to: "DispatchStrategy", type: "association" },
      { from: "ElevatorController", to: "Request", type: "dependency" },
      { from: "Elevator", to: "ElevatorState", type: "composition" },
      { from: "ElevatorState", to: "Elevator", type: "dependency" },
      { from: "IdleState", to: "ElevatorState", type: "realization" },
      { from: "MovingUpState", to: "ElevatorState", type: "realization" },
      { from: "MovingDownState", to: "ElevatorState", type: "realization" },
      { from: "DoorsOpenState", to: "ElevatorState", type: "realization" },
      { from: "DoorsOpenState", to: "Direction", type: "association" },
      { from: "NearestCarStrategy", to: "DispatchStrategy", type: "realization" },
      { from: "DispatchStrategy", to: "Request", type: "dependency" },
      { from: "Request", to: "Direction", type: "association" }
    ]
  },
  flow: {
    title: "A hall call is answered",
    sequence: {
      label: "A person calls from floor 5; the controller asks the dispatch strategy for a car, adds the stop to car B, and on later ticks car B's moving-down state reaches floor 5 and switches the car to doors open.",
      participants: [
        { id: "person", name: "Person on floor 5", kind: "client" },
        { id: "ctl", name: "ElevatorController", kind: "concrete" },
        { id: "strat", name: "NearestCarStrategy", kind: "concrete" },
        { id: "car", name: "Elevator B", kind: "concrete" },
        { id: "state", name: "MovingDownState", kind: "concrete" }
      ],
      messages: [
        { from: "person", to: "ctl", label: "hall_call(Request(5, DOWN))" },
        { from: "ctl", to: "strat", label: "choose(elevators, request)" },
        { from: "strat", to: "ctl", label: "car B", kind: "return" },
        { from: "ctl", to: "car", label: "add_stop(5)" },
        { from: "ctl", to: "person", label: "B is coming", kind: "return" },
        { from: "ctl", to: "car", label: "step(tick)" },
        { from: "car", to: "state", label: "step(elevator)" },
        { from: "state", to: "car", label: "floor -= 1 → 5" },
        { from: "state", to: "car", label: "set_state(DoorsOpenState(DOWN))" }
      ]
    }
  },
  states: {
    name: "One elevator car",
    states: ["Idle", "MovingUp", "MovingDown", "DoorsOpen"],
    transitions: [
      { from: "Idle", to: "MovingUp", on: "a stop above" },
      { from: "Idle", to: "MovingDown", on: "a stop below" },
      { from: "Idle", to: "DoorsOpen", on: "a call on this floor" },
      { from: "MovingUp", to: "DoorsOpen", on: "reached a stop" },
      { from: "MovingDown", to: "DoorsOpen", on: "reached a stop" },
      { from: "DoorsOpen", to: "MovingUp", on: "doors close, stops above" },
      { from: "DoorsOpen", to: "MovingDown", on: "doors close, stops below" },
      { from: "DoorsOpen", to: "Idle", on: "doors close, no stops" }
    ]
  },
  patterns: [
    { slug: "state", where: "ElevatorState → IdleState, MovingUpState, MovingDownState, DoorsOpenState; Elevator.set_state", why: "What a tick does depends on what the car is doing. Each state class holds its own rules and picks the next state, so there is no big if/elif on a status string, and a MaintenanceState is one new class." },
    { slug: "strategy", where: "DispatchStrategy → NearestCarStrategy, used by ElevatorController", why: "Buildings want different dispatch rules (zoning, morning rush to the lobby, energy saving). A new rule is a new class passed into the controller." },
    { slug: "facade", where: "ElevatorController.hall_call / car_call / step", why: "Buttons and the clock talk to one object. They never pick cars or touch states, so the inside can change without changing them." }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose State classes over an enum plus if/elif in Elevator because each state's rules grow (door timers, overload, maintenance) and stay readable in their own class.",
    "We chose to keep going in one direction (SCAN) over always serving the nearest stop because nearest-first can starve far floors; SCAN serves every stop within one sweep.",
    "We chose a tick-driven simulation over threads and sleeps because it is deterministic and easy to test; a real controller calls step() from a timer.",
    "We chose to assign a hall call to one car at once over re-assigning on every tick because it is simpler to reason about; re-assignment is a later optimisation."
  ],
  followUps: [
    { q: "How would you add a maintenance mode?", a: "Add a MaintenanceState whose step() does nothing and whose dispatch cost is infinite. The controller sets it; nothing else changes." },
    { q: "How do you make dispatch better at rush hour?", a: "Swap in a different DispatchStrategy, for example one that sends idle cars back to the lobby at 9 am, or zones (cars 1–2 serve floors 0–10)." },
    { q: "What if calls arrive from many threads?", a: "Put calls into a thread-safe queue that the controller drains at the start of each tick, so only one thread changes the cars (single writer)." },
    { q: "How do you stop one far-away floor from waiting forever?", a: "SCAN already guarantees it is served within one sweep. You can also add waiting time to the dispatch cost, so old calls win ties." },
    { q: "How would you show the car's position on every floor's display?", a: "Let Elevator notify observers in set_state and when the floor changes (Observer). Displays subscribe; the states stay unchanged." }
  ],
  extend: [
    "Add a MaintenanceState: the car ignores stops and the strategy never chooses it.",
    "Write a ZoneStrategy: car A serves floors 0–4, car B serves 5–9, and compare the demo output.",
    "Keep the doors open for two ticks instead of one (hint: a counter inside DoorsOpenState).",
    "Add a third car and a burst of five hall calls; check that every call is served."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "Why does Elevator delegate step() to a state object instead of using if/elif on a status field?",
      options: [
        "Each state's rules live in one class, and a new state is a new class instead of edits in many branches",
        "State objects make the elevator move faster",
        "Python and Scala cannot compare enums in if statements",
        "So the controller can choose which car answers a call"
      ],
      answer: 0,
      hint: "Think about what happens when you add a maintenance or fire mode.",
      explain: "That is the State pattern: behaviour that depends on the current mode lives in that mode's class. Speed is unaffected, enums compare fine, and choosing a car is the dispatch strategy's job."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This DoorsOpenState makes the car bounce between floors and starve far stops. Tap the line that causes it.",
      code: { lang: "python", text: `class DoorsOpenState(ElevatorState):
    def step(self, elevator: Elevator) -> None:
        elevator.stops.discard(elevator.floor)
        nearest = min(elevator.stops, default=None, key=lambda s: abs(s - elevator.floor))
        if nearest is None:
            elevator.set_state(IdleState())
        elif nearest > elevator.floor:
            elevator.set_state(MovingUpState())
        else:
            elevator.set_state(MovingDownState())` },
      answer: 4,
      hint: "Which stop does it pick, and does it care which way the car was going?",
      explain: "Line 4 always goes to the nearest stop and forgets the current direction. New calls close by keep winning, so a far stop can wait forever. Keep the direction while stops remain ahead (SCAN), as the real DoorsOpenState does."
    },
    {
      type: "order", tag: "Put in order", prompt: "A person on floor 5 presses down. Put what happens in order.",
      steps: [
        "ElevatorController receives hall_call(Request(5, DOWN))",
        "The DispatchStrategy chooses car B",
        "Floor 5 is added to car B's stops",
        "On each tick, car B's MovingDownState moves it one floor",
        "At floor 5, the state switches the car to DoorsOpenState"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "A car must be chosen before it can get a stop, and it must move before its doors open.",
      explain: "Call, choose, add stop, move tick by tick, open doors. The controller cannot add the stop before choosing a car, and the doors open only when the moving state reaches the stop."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "A building owner wants to send idle cars to the lobby every morning at 8–10 am. Which part of the design changes?",
      options: [
        "Add a new DispatchStrategy (Strategy) and pass it to the controller",
        "Add a new ElevatorState subclass for each floor",
        "Edit MovingUpState to check the time",
        "Make ElevatorController a Singleton"
      ],
      answer: 0,
      hint: "Which interface decides which car goes where?",
      explain: "Choosing cars is the DispatchStrategy's job, so a rush-hour rule is a new strategy. States describe how one car moves, not where the fleet goes; editing MovingUpState mixes concerns; and a Singleton changes nothing about dispatch."
    }
  ]
};

export default elevator;
