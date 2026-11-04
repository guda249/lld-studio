import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "proxy",
  task: "Every caller must remember the role check before reading a document (export_document forgot it), and the slow store connects even if nobody reads. Refactor it into the Proxy pattern so the check happens in one place and the real store is created only on the first allowed read.",
  goals: [
    "An interface (an ABC in Python, a trait in Scala) with the read method",
    "The real store and a proxy class both implement it",
    "The proxy checks the role before passing the call on",
    "The proxy creates the real store only on the first allowed read",
    "Client functions take the interface type, so they can't tell proxy from real store"
  ],
  hints: [
    "Start with the interface: which one method do callers need from the store?",
    "Write a proxy class that implements that interface and keeps the role plus a field for the real store, empty at first.",
    "In the proxy's read: refuse the call if the role isn't allowed, create the real store if the field is still empty, then return the real store's read result."
  ]
};

export default exercise;
