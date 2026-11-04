import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "strategy",
  task: "Checkout picks the payment type with if/elif, and every new payment means editing it. Refactor it into the Strategy pattern so a new payment type can be added without touching Checkout.",
  goals: [
    "One interface (an ABC in Python, a trait in Scala) with a pay method",
    "At least two payment classes that implement it",
    "Checkout receives a payment method from outside and delegates to it",
    "Checkout never creates or names a concrete payment class",
    "Optional: a setter so the payment method can be swapped at runtime"
  ],
  hints: [
    "Start by writing the interface: what is the one method every payment type must have?",
    "Move the body of each if/elif branch into its own class that implements that interface.",
    "Give Checkout a field typed as the interface, set through the constructor, and make Checkout.pay call it."
  ]
};

export default exercise;
