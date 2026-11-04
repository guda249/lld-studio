import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "chain-of-responsibility",
  task: "All approval rules live in one if/elif function, so adding a Finance check or changing the order means editing it again. Refactor it into a Chain of Responsibility so each approver is its own class and the chain can be rebuilt without touching them.",
  goals: [
    "One handler type (a base class or ABC in Python, an abstract class or trait in Scala) with an approve method",
    "A field for the next handler, typed as the handler type and passed in from outside",
    "At least two approver classes: each approves what it can and passes the rest to the next one",
    "The client builds the chain and only talks to the first link",
    "A sensible answer when the request reaches the end of the chain"
  ],
  hints: [
    "Each if/elif branch is one approver. What does every approver need to know besides its own limit?",
    "Give the handler type a next field (None / Option when there is no next) and an approve method: handle it if within the limit, otherwise call next.approve.",
    "Make TeamLead, Manager and Director subclasses that only set their name and limit, then build TeamLead(Manager(Director())) in the client and call approve on it."
  ]
};

export default exercise;
