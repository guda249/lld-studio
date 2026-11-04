import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "builder",
  task: "HttpRequest takes eight positional arguments, so the timeout and retry count get swapped and a GET with a body slips through. Refactor it into the Builder pattern so each setting is named and build() refuses invalid requests.",
  goals: [
    "An HttpRequestBuilder class that starts with sensible defaults for every optional setting",
    "One named step method per setting (method, header, body, timeout...) that returns the builder so calls chain",
    "A build() method that checks cross-field rules (a GET has no body, the timeout is positive) before creating the request",
    "HttpRequest is immutable once built (a frozen dataclass in Python, a case class in Scala)",
    "The demo creates requests only through the builder"
  ],
  hints: [
    "Which arguments does almost every caller leave at the same value? Those become defaults stored in the builder.",
    "Give each setting its own method on the builder that stores the value and returns self (this in Scala).",
    "Write build(): first raise ValueError (or use require in Scala) for invalid combinations, then return HttpRequest(...) with the stored values."
  ]
};

export default exercise;
