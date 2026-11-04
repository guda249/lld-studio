import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "facade",
  task: "Both controllers repeat the same four-service checkout sequence, so a change to the flow means editing every copy. Refactor it into the Facade pattern so each controller makes one call and the sequence lives in one place.",
  goals: [
    "One facade class that holds Inventory, PaymentService, ShippingService and Notifier",
    "The services are passed in through the constructor (not created inside)",
    "One method on the facade runs the whole flow in the right order",
    "The controllers call only the facade, never the four services one by one",
    "The facade only coordinates; the services keep the real work and don't know the facade exists"
  ],
  hints: [
    "Look at what the two controllers have in common: that shared sequence is the facade's method.",
    "Make a class with four fields, one per service, set through the constructor.",
    "Move the reserve, charge, schedule and send calls into one place_order method (placeOrder in Scala), and make each controller call it."
  ]
};

export default exercise;
