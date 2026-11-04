import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-statement.py?raw";
import ex1Scala from "./code/ex1-statement.scala?raw";
import ex2Py from "./code/ex2-game.py?raw";
import ex2Scala from "./code/ex2-game.scala?raw";
import ex3Py from "./code/ex3-tests.py?raw";
import ex3Scala from "./code/ex3-tests.scala?raw";
import ex4Py from "./code/ex4-booking.py?raw";
import ex4Scala from "./code/ex4-booking.scala?raw";

const lesson: PatternLesson = {
  slug: "template-method",
  analogy:
    "Making any kind of tea: boil water, add the leaves, steep, add extras, serve. The order is always the same; masala chai, green tea and lemon tea only differ in the leaves and extras steps.",
  problem: {
    text: "CsvImporter and KeyValueImporter both parse input, drop invalid records and save the rest. Only parsing differs, yet the validate-and-save code is copy-pasted, so a fix to validation must be made twice and the two copies slowly drift apart.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "The base class defines one method, run() (the template method), that calls the steps in a fixed order. Steps that must differ are abstract, so each subclass has to fill them in. Optional steps are hooks: they have a default and a subclass overrides them only when it needs to. In Scala, run() is final so no subclass can change the order.",
  participants: [
    { role: "Abstract class", name: "DataImporter", kind: "abstract", description: "Owns the template method run(), the abstract step parse() and the hooks is_valid() and save()." },
    { role: "Concrete class", name: "CsvImporter, KeyValueImporter", kind: "concrete", description: "Fill in the abstract steps and optionally override hooks. They never change the order of steps." },
    { role: "Client", name: "Demo code", kind: "client", description: "Calls run() on whichever importer it has; it does not see the individual steps." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "You can get the same effect with composition: pass the varying step in as a function, such as run_import(raw, parse_csv). That is effectively Strategy and avoids inheritance. Use Template Method when the steps share a lot of state or there are several related hooks.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python unittest.TestCase: the framework runs setUp, then the test, then tearDown; you fill in the steps.",
    "Django class-based views: dispatch() calls get() or post(), with hooks such as get_context_data().",
    "Java AbstractList, and HttpServlet.service() calling doGet() or doPost().",
    "ETL and data-pipeline base classes (extract, transform, load).",
  ],
  whenToUse: [
    "Several classes run the same algorithm with small variations.",
    "You want to enforce the order of steps (for example, validate before save) while still allowing customisation.",
    "You are writing a framework with “we call you” extension points (the Hollywood principle).",
  ],
  whenNotToUse: [
    "The variations are large or must be combined at runtime: use Strategy.",
    "The inheritance tree is deep: when every level overrides hooks, the flow becomes hard to follow.",
  ],
  pros: [
    "Removes duplication; the fixed order lives in one place.",
    "Subclasses override only the steps they need.",
  ],
  cons: [
    "Tied to inheritance; a subclass can break the algorithm by misusing a hook (a Liskov risk).",
    "The more steps and hooks there are, the harder the base class is to maintain.",
  ],
  confusedWith: [
    { name: "Strategy", difference: "Strategy uses composition and swaps the whole algorithm at runtime; Template Method uses inheritance and varies single steps, fixed when the class is written." },
    { name: "Factory Method", difference: "A factory method is often one step inside a template method: the “create the thing” step." },
  ],
  solid:
    "Open/Closed (a new importer needs no change to run()), Liskov Substitution (each importer works wherever a DataImporter is expected) and, alongside SOLID, Don't Repeat Yourself.",
  interviewUses: [
    "Report generation (fetch, format, send).",
    "Game turn loops (start, play turns, end).",
    "Data importers and ETL jobs.",
    "Payment flows (validate, authorise, capture, notify) with provider-specific steps.",
  ],
  examples: [
    {
      id: "statement",
      domain: "Fintech",
      title: "Bank statements",
      situation:
        "A bank sends the same monthly statement by email and as a short SMS. Both list the transactions and the net amount, but each channel formats them differently, and the two generators had been written as separate copies.",
      roles: [
        { role: "Abstract class", name: "StatementGenerator" },
        { role: "Concrete class", name: "EmailStatement" },
        { role: "Concrete class", name: "SmsStatement" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The shape of a statement (header, one line per transaction, footer) never changes; only the formatting does. generate() fixes the order once, and each channel fills in header and format_txn.",
      goodToKnow:
        "Hooks such as separator() keep the base class small: SmsStatement overrides only what it needs, and EmailStatement uses the defaults.",
      walkthrough: [
        "The demo builds three transactions: salary, rent paid by UPI and groceries.",
        "EmailStatement.generate() runs the template: header first, then one formatted line per transaction.",
        "The footer hook adds up the amounts and prints the net, ₹56,600.",
        "SmsStatement runs the same generate() but with short lines.",
        "It overrides the separator hook, so the whole statement fits on one line.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "game",
      domain: "Games",
      title: "Turn-based game loop",
      situation:
        "A small games studio builds several two-to-four player turn games. Every game repeats the same loop of setting up, taking turns until someone wins, and announcing the winner, and each team rewrote that loop.",
      roles: [
        { role: "Abstract class", name: "TurnGame" },
        { role: "Concrete class", name: "NimGame" },
        { role: "Concrete class", name: "DiceRace" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The loop is the same for every game; only a turn, the end condition and the winner differ. play() owns the loop, so a new game only fills in those steps.",
      goodToKnow:
        "The max_turns hook is a safety limit in the base class. Put guards like this in the template so no subclass can create an endless loop.",
      walkthrough: [
        "play() calls the setup hook, then loops while the game is not over.",
        "In NimGame each turn takes one to three sticks from the pile; Asha takes the last stick after five turns.",
        "DiceRace overrides setup to give every player a score of zero.",
        "Each DiceRace turn adds a seeded dice roll until someone reaches 15.",
        "The same play() method returns the winner for both games.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "tests",
      domain: "Developer tools",
      title: "Mini test runner",
      situation:
        "A team writes its own lightweight test runner for a code kata. Every test needs setup, the check itself and clean-up, and clean-up must happen even when the check fails.",
      roles: [
        { role: "Abstract class", name: "TestCase" },
        { role: "Concrete class", name: "CartTotalTest" },
        { role: "Concrete class", name: "DiscountTest" },
        { role: "Client", name: "Test runner loop" },
      ],
      why: "This is how unittest and JUnit work: the framework owns run() and calls your set_up, test and tear_down. You write only the steps; the framework decides when they run.",
      goodToKnow:
        "Putting tear_down in a finally block inside the template guarantees clean-up for every test. No subclass can forget it.",
      walkthrough: [
        "The runner loops over two test cases and calls run() on each.",
        "CartTotalTest sets up a cart of ₹499 and ₹250, checks the total of 749 and passes.",
        "DiscountTest opens a pretend database in its set_up hook.",
        "Its check fails because 10% off ₹1000 is 900, not 910.",
        "run() still calls tear_down, which closes the database, and then reports the failure.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "booking",
      domain: "Travel",
      title: "Booking flow",
      situation:
        "A travel app books flights and hotels. Both must hold the inventory, charge the traveller and issue a document, but flights also need an ID check and a convenience fee.",
      roles: [
        { role: "Abstract class", name: "BookingFlow" },
        { role: "Concrete class", name: "FlightBooking" },
        { role: "Concrete class", name: "HotelBooking" },
        { role: "Factory method step", name: "create_ticket" },
      ],
      why: "The booking steps always run in the same order, and charging must come after the hold. book() fixes that order, and hooks switch the optional ID check and fee on or off per product.",
      goodToKnow:
        "create_ticket is a factory method inside the template method. The two patterns often appear together: the template fixes the steps, and one step creates the product.",
      walkthrough: [
        "FlightBooking.book() first holds seat 14C on the Bengaluru to Delhi flight.",
        "Its needs_id_check hook returns true, so the optional ID check runs.",
        "The fee hook adds ₹350, so the traveller is charged ₹5,750.",
        "The create_ticket step returns a boarding pass.",
        "HotelBooking uses the default hooks: no ID check and no fee, and it returns a hotel voucher.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
