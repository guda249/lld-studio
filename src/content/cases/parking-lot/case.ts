import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const parkingLot: CaseStudy = {
  slug: "parking-lot",
  title: "Parking Lot",
  difficulty: 2,
  tagline: "Spots, tickets and fees: the classic first LLD interview.",
  prompt:
    "Design a parking lot. It has several levels, each with spots of different sizes. Cars, motorbikes and vans come in, " +
    "get a ticket and a spot, and pay when they leave. Walk me through your classes and show me the park and leave flow.",
  clarify: [
    { q: "Which vehicle types and spot sizes are there?", a: "Three sizes: small (motorbike), medium (car), large (van). A vehicle may use a spot of its size or bigger." },
    { q: "How do we choose a spot when several are free?", a: "Lowest level first, then the smallest spot that fits, so large spots stay free for large vehicles. This rule may change later." },
    { q: "How is the fee worked out?", a: "Per started hour, by vehicle size, with the first 15 minutes free. Other pricing (weekends, events) may come later." },
    { q: "Is there a display that shows free spots?", a: "Yes, each entrance has a board that shows how many spots are free on each level." },
    { q: "Do we need payment methods, reservations or a database?", a: "No. We only compute the amount. Payment, booking and storage are out of scope." },
    { q: "How many gates work at the same time?", a: "Assume one process handles the gates one call at a time; we discuss concurrency as a follow-up." }
  ],
  requirements: {
    functional: [
      "Park a vehicle: find a fitting spot, mark it taken and issue a ticket",
      "Refuse a vehicle when no fitting spot is free",
      "Leave: free the spot and return the fee for the ticket",
      "Show the number of free spots per level on every display board",
      "Spot choice and pricing rules can change without editing the lot"
    ],
    nonFunctional: [
      "Deterministic: the time is passed in as a minute number, not read from a clock",
      "Easy to extend: new pricing or spot-choice rules are new classes",
      "Clear errors for unknown tickets and for a vehicle parked twice"
    ],
    outOfScope: ["Payment processing", "Reservations", "Persistence and a web API", "Multiple gates in parallel"]
  },
  entities: [
    { name: "ParkingLot", responsibility: "The entry point for the gates: park and leave. Holds the levels, the active tickets and the rules." },
    { name: "Level", responsibility: "A floor with its list of spots; counts how many are free." },
    { name: "ParkingSpot", responsibility: "One spot: its size, the vehicle in it, and whether a vehicle fits." },
    { name: "Vehicle", responsibility: "A plate number and a size. Plain data." },
    { name: "Ticket", responsibility: "Proof of entry: vehicle, spot and entry time. Used to compute the fee." },
    { name: "SpotFinder", responsibility: "The rule that picks a free spot (NearestFinder is the default)." },
    { name: "FeePolicy", responsibility: "The rule that turns a ticket and an exit time into an amount (HourlyFee)." },
    { name: "LotObserver", responsibility: "Anything that wants to hear about free-spot changes (DisplayBoard)." }
  ],
  uml: {
    classes: [
      { name: "ParkingLot", kind: "concrete", members: ["- levels: list[Level]", "- finder: SpotFinder", "- fees: FeePolicy", "+ park(vehicle, minute)", "+ leave(ticketId, minute)"] },
      { name: "Level", kind: "concrete", members: ["+ number: int", "+ spots: list[ParkingSpot]", "+ free_count()"] },
      { name: "ParkingSpot", kind: "concrete", members: ["+ size: VehicleSize", "+ vehicle: Vehicle?", "+ fits(vehicle)", "+ assign(vehicle)"] },
      { name: "Vehicle", kind: "concrete", members: ["+ plate: str", "+ size: VehicleSize"] },
      { name: "VehicleSize", kind: "enum", members: ["SMALL", "MEDIUM", "LARGE"] },
      { name: "Ticket", kind: "concrete", members: ["+ vehicle: Vehicle", "+ spot: ParkingSpot", "+ entry_minute: int"] },
      { name: "SpotFinder", kind: "interface", members: ["+ find(levels, vehicle)"] },
      { name: "NearestFinder", kind: "concrete", members: ["+ find(levels, vehicle)"] },
      { name: "FeePolicy", kind: "interface", members: ["+ fee(ticket, exit_minute)"] },
      { name: "HourlyFee", kind: "concrete", members: ["+ fee(ticket, exit_minute)"] },
      { name: "LotObserver", kind: "interface", members: ["+ on_change(level, free)"] },
      { name: "DisplayBoard", kind: "concrete", members: ["+ on_change(level, free)"] }
    ],
    relations: [
      { from: "ParkingLot", to: "Level", type: "aggregation" },
      { from: "ParkingLot", to: "SpotFinder", type: "association" },
      { from: "ParkingLot", to: "FeePolicy", type: "association" },
      { from: "ParkingLot", to: "LotObserver", type: "aggregation" },
      { from: "ParkingLot", to: "Ticket", type: "aggregation" },
      { from: "Level", to: "ParkingSpot", type: "aggregation" },
      { from: "ParkingSpot", to: "Vehicle", type: "association" },
      { from: "Vehicle", to: "VehicleSize", type: "association" },
      { from: "Ticket", to: "Vehicle", type: "association" },
      { from: "Ticket", to: "ParkingSpot", type: "association" },
      { from: "NearestFinder", to: "SpotFinder", type: "realization" },
      { from: "HourlyFee", to: "FeePolicy", type: "realization" },
      { from: "DisplayBoard", to: "LotObserver", type: "realization" },
      { from: "FeePolicy", to: "Ticket", type: "dependency" }
    ]
  },
  flow: {
    title: "A car parks",
    sequence: {
      label: "A gate asks the parking lot to park a car; the lot asks its spot finder for a spot, assigns the car, creates a ticket, updates the display board and returns the ticket.",
      participants: [
        { id: "gate", name: "Gate", kind: "client" },
        { id: "lot", name: "ParkingLot", kind: "concrete" },
        { id: "finder", name: "NearestFinder", kind: "concrete" },
        { id: "spot", name: "ParkingSpot", kind: "concrete" },
        { id: "ticket", name: "Ticket", kind: "concrete" },
        { id: "board", name: "DisplayBoard", kind: "concrete" }
      ],
      messages: [
        { from: "gate", to: "lot", label: "park(car, 545)" },
        { from: "lot", to: "finder", label: "find(levels, car)" },
        { from: "finder", to: "lot", label: "L1-02", kind: "return" },
        { from: "lot", to: "spot", label: "assign(car)" },
        { from: "lot", to: "ticket", label: "new Ticket(T2, car, L1-02, 545)", kind: "create" },
        { from: "lot", to: "board", label: "on_change(1, 1)" },
        { from: "lot", to: "gate", label: "ticket T2", kind: "return" }
      ]
    }
  },
  patterns: [
    { slug: "strategy", where: "SpotFinder → NearestFinder, FeePolicy → HourlyFee", why: "Spot choice and pricing are the rules most likely to change (weekend rates, EV-first spots). Each new rule is a new class passed into ParkingLot; ParkingLot never changes." },
    { slug: "observer", where: "LotObserver → DisplayBoard, ParkingLot.subscribe", why: "Boards, a mobile app or an alert can all listen for free-spot changes. ParkingLot only knows the LotObserver interface, so adding a listener does not touch it." },
    { slug: "facade", where: "ParkingLot.park / ParkingLot.leave", why: "The gates make two simple calls. They never deal with levels, spots, finders and fee rules directly, so the inside can be reorganised freely." }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose to pass the time in (a minute number) over reading the clock because it makes the demo and tests repeatable; a real gate passes the current time.",
    "We chose a SpotFinder strategy over a fixed loop inside ParkingLot because the spot rule is the first thing product teams ask to change.",
    "We chose to let a small vehicle take a bigger spot over strict size matching because a lot that refuses a bike while large spots are empty annoys everyone; the finder still prefers the smallest fitting spot.",
    "We chose a linear scan of spots over per-size free lists because it is simple and fast enough for a few hundred spots; free lists are the upgrade for very large lots."
  ],
  followUps: [
    { q: "Two gates try to park at the same moment. What can go wrong?", a: "Both may pick the same free spot. Make find-and-assign one atomic step: a lock around park/leave, or per-size queues of free spots where taking a spot is a single atomic pop." },
    { q: "How would you find a spot in O(1) for a 10,000-spot lot?", a: "Keep a free list (or min-heap by level) per spot size. Parking pops from the smallest fitting size; leaving pushes the spot back. The SpotFinder interface hides this change." },
    { q: "How would you add electric-vehicle charging spots?", a: "Add a spot feature (EV) and a finder that tries EV spots first for EVs. Charging fees become a FeePolicy that wraps HourlyFee and adds energy cost (Decorator)." },
    { q: "How do you handle a lost ticket?", a: "Look up the active ticket by plate number and charge a fixed lost-ticket fee through a separate FeePolicy." },
    { q: "Where does payment fit in?", a: "leave() returns the amount; a separate PaymentService (with card, cash, UPI strategies) takes it. Keeping payment out of ParkingLot keeps it focused on spaces." }
  ],
  extend: [
    "Add a WeekendFee policy (flat 50 per visit) and switch the lot to it without editing ParkingLot.",
    "Write a FarthestFirstFinder that fills the top level first, and compare the demo output.",
    "Add a second observer that prints \"FULL\" when a level reaches zero free spots.",
    "Support reserving a spot for a plate number for the next 30 minutes."
  ],
  quiz: [
    {
      type: "mcq", tag: "Scenario",
      prompt: "Management wants weekend pricing: a flat 50 per visit on Saturdays and Sundays. In this design, what do you change?",
      options: [
        "Add an if/else on the day inside ParkingLot.leave",
        "Write a WeekendFee class that implements FeePolicy and pass it to ParkingLot",
        "Add a weekend flag to Ticket and check it in HourlyFee",
        "Subclass ParkingLot as WeekendParkingLot"
      ],
      answer: 1,
      hint: "Which interface exists so that pricing can change without editing the lot?",
      explain: "FeePolicy is a Strategy: a new pricing rule is a new class passed in. An if/else in ParkingLot or HourlyFee edits working code for every new rule, and subclassing the whole lot for one rule does not scale."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the design: the lot can no longer change its spot rule.",
      code: { lang: "python", text: `class ParkingLot:
    def __init__(self, levels: list[Level], fees: FeePolicy):
        self._levels = levels
        self._finder = NearestFinder()
        self._fees = fees

    def park(self, vehicle: Vehicle, minute: int):
        spot = self._finder.find(self._levels, vehicle)` },
      answer: 4,
      hint: "Which line decides the rule, and who should decide it?",
      explain: "Line 4 creates NearestFinder inside the lot, so the lot is locked to one rule. Take a SpotFinder in the constructor, as with FeePolicy on line 5, so the caller chooses."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of lot.park(car, 545) in order.",
      steps: [
        "The gate calls park(car, 545) on ParkingLot",
        "ParkingLot asks the SpotFinder for a fitting spot",
        "The spot is assigned to the car",
        "A Ticket is created and stored as active",
        "Observers hear the new free count",
        "The ticket is returned to the gate"
      ],
      shuffled: [3, 0, 5, 1, 4, 2],
      hint: "You need a spot before you can write a ticket, and you tell the boards after the spot is taken.",
      explain: "Find, assign, record, notify, return. Notifying before the spot is taken would show the wrong free count, and a ticket needs the spot it points to."
    },
    {
      type: "mcq", tag: "Concept", prompt: "Why does ParkingLot keep a list of LotObserver instead of a DisplayBoard field?",
      options: [
        "So any number of listeners (boards, an app, alerts) can be added without editing ParkingLot",
        "Because DisplayBoard cannot be passed to a constructor",
        "To make park() faster",
        "Because Python and Scala do not allow fields of a concrete type"
      ],
      answer: 0,
      hint: "Think about what happens when a second kind of listener appears.",
      explain: "Depending on the LotObserver interface (Observer pattern) lets you add new listeners with subscribe(). The other options are false: concrete fields are allowed, constructors take any type, and it has nothing to do with speed."
    }
  ]
};

export default parkingLot;
