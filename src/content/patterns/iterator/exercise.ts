import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "iterator",
  task: "Two callers copy the same paging loop over OrderPages, and both break if the API changes. Refactor it into the Iterator pattern so every caller can walk all orders with a plain for loop and never sees a page number.",
  goals: [
    "An iterator class (Python: __iter__ and __next__; Scala: extends Iterator[String] with hasNext and next)",
    "The iterator remembers its position (page and buffer) and fetches the next page only when it needs it",
    "OrderPages hands out a fresh iterator each time (Python __iter__, Scala def iterator)",
    "Both callers become plain for loops with no paging code"
  ],
  hints: [
    "The paging loop is written twice. Which variables does it keep between steps? Those become the iterator's fields.",
    "In next, fetch a new page only when the buffer is empty, then hand out one order from the buffer; signal the end when a page comes back empty (StopIteration in Python, hasNext false in Scala).",
    "Give OrderPages a method that returns OrderIterator(self) / OrderIterator(this), then write: for order in pages (Python) or for order <- pages.iterator do (Scala)."
  ]
};

export default exercise;
