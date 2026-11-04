import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "bridge-payouts",
  slug: "bridge",
  title: "Driver payouts: speed times rail",
  domain: "Gig economy",
  difficulty: 3,
  task: "There is one payout class for every speed-and-rail pair (instant or Friday batch, bank or wallet), with the fee and the transfer text copied between them. Finance wants a UPI rail and an \"express\" speed next quarter, which would mean five more classes. Refactor it so a new speed or a new rail is one new class, not one per combination.",
  goals: [
    "A PayoutRail interface (an ABC in Python, a trait in Scala) with transfer(), implemented by BankRail and WalletRail",
    "A Payout base class that receives a PayoutRail through its constructor and keeps it in a field (the bridge)",
    "InstantPayout and ScheduledPayout extend Payout and call the rail for the transfer part",
    "The payout side never names BankRail or WalletRail, and never checks which rail it has",
    "Same printed output as before"
  ],
  hints: [
    "Two separate things change here: when and how much the driver is paid, and how the money moves. Name each one.",
    "Put \"how the money moves\" behind its own interface with one class per rail. Give the payout side a field of that interface type.",
    "Write Payout(rail) as an abstract base, then InstantPayout and ScheduledPayout whose send() works out the amount and calls self._rail.transfer(...) (rail.transfer in Scala). The demo picks the pairs: InstantPayout(BankRail())."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
