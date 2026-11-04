import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-ride.py?raw";
import ex1Scala from "./code/ex1-ride.scala?raw";
import ex2Py from "./code/ex2-sort.py?raw";
import ex2Scala from "./code/ex2-sort.scala?raw";
import ex3Py from "./code/ex3-ship.py?raw";
import ex3Scala from "./code/ex3-ship.scala?raw";
import ex4Py from "./code/ex4-retry.py?raw";
import ex4Scala from "./code/ex4-retry.scala?raw";

const lesson: PatternLesson = {
  slug: "strategy",
  analogy:
    "Getting to the airport: cab, metro or bus. Same goal, different route, time and cost. You pick based on today's budget and traffic, and you can change your mind tomorrow. The trip doesn't care how you travel, only that you arrive.",
  problem: {
    text: "Checkout picks the payment type with if/elif. Every new payment method means editing Checkout, re-testing all branches, and merge conflicts for everyone touching it. That breaks the Open/Closed Principle.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Pull each algorithm out into its own class that implements one shared PaymentMethod interface. Checkout (the context) holds one payment method and forwards the call to it, without ever naming a concrete class. The client chooses which one to plug in, and can swap it while the program runs.",
  participants: [
    { role: "Strategy", name: "PaymentMethod", kind: "interface", description: "The one interface every payment algorithm shares: pay(amount)." },
    { role: "Concrete strategy", name: "CardPayment, UpiPayment, WalletPayment, PayLaterPayment", kind: "concrete", description: "One algorithm each. They know nothing about Checkout." },
    { role: "Context", name: "Checkout", kind: "concrete", description: "Holds a strategy and delegates to it. It never names a concrete strategy." },
    { role: "Client", name: "App (the demo code)", kind: "client", description: "Picks the strategy, plugs it into Checkout and may swap it at runtime." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "When a strategy is a single method, a function is the strategy: pass it in instead of writing a class. Keep classes when strategies carry state (such as a wallet balance) or several related methods.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python sorted(items, key=...): the key function is the strategy.",
    "Scala list.sorted(using ordering) and Java Comparator: the ordering is the strategy.",
    "Payment, shipping-cost, discount and tax rules selected per order or country.",
    "Route planners (fastest, shortest, avoid tolls), compression algorithms and ML optimisers chosen by configuration.",
  ],
  whenToUse: [
    "There are several ways to do the same job, chosen at runtime or by configuration.",
    "A growing if/elif or match decides which algorithm to run.",
    "You want to test each algorithm on its own.",
  ],
  whenNotToUse: [
    "Only two fixed options that will never grow: a plain if is clearer.",
    "The client should not have to know the options exist: hide the choice inside a factory instead.",
  ],
  pros: [
    "New algorithms are added without touching the context (Open/Closed).",
    "Each algorithm is small and testable on its own (Single Responsibility).",
    "Behaviour can be swapped at runtime, and conditionals are replaced by polymorphism.",
  ],
  cons: [
    "More small classes to find and name.",
    "The client must know which strategy to choose.",
  ],
  confusedWith: [
    { name: "State", difference: "Same shape. Strategies are picked from outside and don't know each other; states switch themselves." },
    { name: "Template Method", difference: "Template Method varies parts of an algorithm through inheritance; Strategy swaps the whole algorithm through composition." },
    { name: "Command", difference: "Command represents a request to run later; Strategy represents how to do something." },
    { name: "Bridge", difference: "Bridge separates two hierarchies so both can grow; Strategy swaps one algorithm." },
  ],
  solid:
    "Open/Closed (new strategies without editing Checkout), Dependency Inversion (Checkout depends on the PaymentMethod abstraction, not on concrete classes) and Single Responsibility (each algorithm lives in its own class).",
  interviewUses: [
    "Payment systems (card, UPI, wallet).",
    "Parking fee calculation (hourly, flat, weekend).",
    "Ride pricing (normal, surge, pool).",
    "Discount engines and coupon rules.",
    "Sorting or matching algorithms, such as debt simplification in a Splitwise-style app.",
  ],
  examples: [
    {
      id: "ride",
      domain: "Ride-hailing",
      title: "Ride fares",
      situation:
        "A ride app charges one way for a normal trip, more at peak demand, and less for a shared ride. Pricing rules change every few weeks and new ones keep being requested.",
      roles: [
        { role: "Client", name: "Rider app" },
        { role: "Context", name: "Ride" },
        { role: "Strategy", name: "PricingStrategy" },
        { role: "Concrete strategy", name: "NormalPricing" },
        { role: "Concrete strategy", name: "SurgePricing" },
        { role: "Concrete strategy", name: "PoolPricing" },
      ],
      why: "Booking a ride never changes; only the fare formula does. Each formula is a strategy chosen per ride, so a new pricing rule is a new class, not an edit to the booking code.",
      goodToKnow:
        "Who picks the strategy? Usually a small factory or config (city, time, demand) decides, so that choice stays out of Ride too.",
      walkthrough: [
        "Ride holds one PricingStrategy. Three pricing rules implement it: normal, surge and pool.",
        "The rider app sets up the ride with NormalPricing.",
        "Asking for a quote goes through the interface to NormalPricing, and the fare comes back.",
        "At peak time the app swaps in SurgePricing. The same quote call now returns a higher fare.",
        "For a shared ride it swaps in PoolPricing. The Ride class never changed.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "sort",
      domain: "E-commerce search",
      title: "Sorting results",
      situation:
        "A shop's search page lets shoppers sort the same results by lowest price, top rating or newest. Marketing wants to add “best sellers” next month.",
      roles: [
        { role: "Client", name: "Search page" },
        { role: "Context", name: "SearchResults" },
        { role: "Strategy", name: "Ordering[Product]" },
        { role: "Concrete strategy", name: "PriceLowHigh" },
        { role: "Concrete strategy", name: "TopRated" },
        { role: "Concrete strategy", name: "Newest" },
      ],
      why: "The search stays the same; only the ordering rule changes. Here the strategy is just a function (Python) or an Ordering (Scala), the lightest form of the pattern.",
      goodToKnow:
        "No class hierarchy needed when a strategy is a single operation. Reach for classes only when a strategy carries state or several methods.",
      walkthrough: [
        "SearchResults holds one Ordering. Each sort option is its own strategy.",
        "The search page starts with PriceLowHigh.",
        "Sorting asks the Ordering to compare products, and the results come back cheapest first.",
        "The shopper switches to TopRated. Same sort call, different order.",
        "Newest is just one more strategy. Adding best sellers later means adding one more, nothing else.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "ship",
      domain: "Online orders",
      title: "Shipping cost",
      situation:
        "Checkout offers standard and express delivery, and a promotion makes shipping free above a minimum order value. Finance changes the rates and the threshold often.",
      roles: [
        { role: "Client", name: "Checkout" },
        { role: "Context", name: "Order" },
        { role: "Strategy", name: "ShippingStrategy" },
        { role: "Concrete strategy", name: "StandardShipping" },
        { role: "Concrete strategy", name: "ExpressShipping" },
        { role: "Concrete strategy", name: "FreeAbove" },
      ],
      why: "Order totals are always “items + shipping”; only the shipping rule varies. Each rule is a strategy, and FreeAbove even wraps another strategy as its fallback.",
      goodToKnow:
        "Strategies can be composed: FreeAbove(499, StandardShipping) reuses an existing rule instead of copying it.",
      walkthrough: [
        "Order holds one ShippingStrategy. Standard, express and free-above are three interchangeable rules.",
        "With StandardShipping, the cost call returns ₹40 plus ₹10 per kg.",
        "Swap in ExpressShipping: same call, higher price.",
        "With FreeAbove, an order of ₹650 is over the ₹499 threshold, so shipping is free.",
        "For a ₹400 order, FreeAbove passes the call on to StandardShipping. Strategies can be combined.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "retry",
      domain: "Distributed systems",
      title: "Retry back-off",
      situation:
        "A service calls a flaky payment API. When a call fails, it should wait before retrying. How long to wait differs per dependency, and the team wants to tune it without touching the client.",
      roles: [
        { role: "Client", name: "PaymentService" },
        { role: "Context", name: "RetryingClient" },
        { role: "Strategy", name: "BackoffStrategy" },
        { role: "Concrete strategy", name: "FixedDelay" },
        { role: "Concrete strategy", name: "ExponentialBackoff" },
        { role: "Concrete strategy", name: "FullJitter" },
      ],
      why: "The retry loop is always “try, wait, try again”; only the waiting rule changes. Swapping the back-off strategy changes retry behaviour without touching the client code.",
      goodToKnow:
        "Exponential back-off with random jitter avoids thousands of clients retrying at the exact same moment after an outage.",
      walkthrough: [
        "RetryingClient holds one BackoffStrategy. FullJitter extends ExponentialBackoff.",
        "With FixedDelay, the third retry waits 1 second, like every other retry.",
        "With ExponentialBackoff, the wait doubles each time, so the third retry waits 2 seconds.",
        "FullJitter reuses the exponential wait and picks a random time below it, so thousands of clients don't retry at the same instant.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
