import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "decorator",
  task: "Logging and caching are added by subclassing, so every mix of features needs its own class (LoggingCachingClient) and the logging code is copied. Refactor it into the Decorator pattern so features are wrappers you can stack in any order at runtime.",
  goals: [
    "A component interface (an ABC in Python, a trait in Scala) with get(url)",
    "The real client implements it and does the actual work",
    "Each feature is a class that implements the interface AND holds a wrapped client passed in through the constructor",
    "Every wrapper method does its extra work and then calls the wrapped client",
    "The client code builds the stack, e.g. LoggingClient(CachingClient(BasicHttpClient()))"
  ],
  hints: [
    "First write the interface that both the real client and every feature will share.",
    "A feature no longer inherits from BasicHttpClient; instead it keeps an HttpClient in a field that it was given.",
    "LoggingClient.get prints the log line, then returns the wrapped client's get(url). Optionally move the field and the plain forwarding into a ClientDecorator base class."
  ]
};

export default exercise;
