import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "observer",
  task: "StockTicker creates PriceDisplay and PriceAlert itself and calls each one by name, so every new consumer means editing it. Refactor it into the Observer pattern so new consumers can subscribe from outside without touching StockTicker.",
  goals: [
    "One observer interface (an ABC or Protocol in Python, a trait in Scala) with an update method",
    "PriceDisplay and PriceAlert implement it",
    "StockTicker keeps a list typed as the interface, with subscribe and unsubscribe methods",
    "StockTicker loops over the list to notify every observer when a price changes",
    "StockTicker never creates or names a concrete consumer"
  ],
  hints: [
    "What do PriceDisplay and PriceAlert have in common? Both want to hear about a new price. Give that one shared method a name.",
    "Write the interface with that method, make both classes implement it, and remove the two consumer fields from StockTicker.",
    "Give StockTicker a list of observers, subscribe/unsubscribe methods that add and remove, and have set_price (setPrice in Scala) loop over the list calling update(symbol, price)."
  ]
};

export default exercise;
