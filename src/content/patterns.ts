export type Category = "creational" | "structural" | "behavioral" | "concurrency";

export interface PatternInfo {
  slug: string;
  name: string;
  category: Category;
  intent: string;
  difficulty: 1 | 2 | 3;
  usedInPractice: string;
  confusedWith: string[];
  lenses: string[];
  /** true once the full lesson (animation, examples, quiz) exists */
  ready?: boolean;
}

export const CATEGORY_INFO: Record<Category, { label: string; question: string }> = {
  creational: { label: "Creational", question: "How are objects created?" },
  structural: { label: "Structural", question: "How do objects fit together?" },
  behavioral: { label: "Behavioral", question: "How do objects talk and share work?" },
  concurrency: { label: "Concurrency", question: "How do threads share work safely?" }
};

export const PATTERNS: PatternInfo[] = [
  { slug: "factory-method", name: "Factory Method", category: "creational", intent: "Let subclasses decide which class to create.", difficulty: 2, usedInPractice: "High", confusedWith: ["Abstract Factory"], lenses: ["Control how objects are created"], ready: true },
  { slug: "abstract-factory", name: "Abstract Factory", category: "creational", intent: "Create families of related objects that belong together.", difficulty: 3, usedInPractice: "Medium", confusedWith: ["Factory Method", "Builder"], lenses: ["Control how objects are created"], ready: true },
  { slug: "builder", name: "Builder", category: "creational", intent: "Build a complex object step by step.", difficulty: 2, usedInPractice: "High", confusedWith: ["Abstract Factory"], lenses: ["Control how objects are created"], ready: true },
  { slug: "prototype", name: "Prototype", category: "creational", intent: "Make new objects by copying an existing one.", difficulty: 1, usedInPractice: "Medium", confusedWith: ["Memento"], lenses: ["Control how objects are created", "Save memory or resources"], ready: true },
  { slug: "singleton", name: "Singleton", category: "creational", intent: "Exactly one shared instance, reachable from anywhere.", difficulty: 1, usedInPractice: "High (overused)", confusedWith: ["Static class", "Flyweight"], lenses: ["Control how objects are created"], ready: true },
  { slug: "adapter", name: "Adapter", category: "structural", intent: "Make an incompatible interface fit the one you expect.", difficulty: 1, usedInPractice: "High", confusedWith: ["Facade", "Decorator", "Proxy"], lenses: ["Make incompatible or complex things easy to use"], ready: true },
  { slug: "bridge", name: "Bridge", category: "structural", intent: "Split two dimensions that vary so each can change alone.", difficulty: 3, usedInPractice: "Low–Medium", confusedWith: ["Adapter", "Strategy"], lenses: ["Make incompatible or complex things easy to use"], ready: true },
  { slug: "composite", name: "Composite", category: "structural", intent: "Treat a single item and a tree of items the same way.", difficulty: 2, usedInPractice: "Medium", confusedWith: ["Decorator"], lenses: ["Work with trees / collections"], ready: true },
  { slug: "decorator", name: "Decorator", category: "structural", intent: "Wrap an object to add behaviour, layer by layer.", difficulty: 2, usedInPractice: "High", confusedWith: ["Proxy", "Python @decorator"], lenses: ["Add behaviour without editing the class"], ready: true },
  { slug: "facade", name: "Facade", category: "structural", intent: "One simple entry point to a complicated subsystem.", difficulty: 1, usedInPractice: "High", confusedWith: ["Adapter", "Mediator"], lenses: ["Make incompatible or complex things easy to use"], ready: true },
  { slug: "flyweight", name: "Flyweight", category: "structural", intent: "Share common state to fit many objects in memory.", difficulty: 3, usedInPractice: "Low", confusedWith: ["Singleton"], lenses: ["Save memory or resources"], ready: true },
  { slug: "proxy", name: "Proxy", category: "structural", intent: "A stand-in that controls access to the real object.", difficulty: 2, usedInPractice: "Medium", confusedWith: ["Decorator", "Adapter"], lenses: ["Add behaviour without editing the class", "Save memory or resources"], ready: true },
  { slug: "chain-of-responsibility", name: "Chain of Responsibility", category: "behavioral", intent: "Pass a request along handlers until one deals with it.", difficulty: 2, usedInPractice: "Medium", confusedWith: ["Decorator"], lenses: ["Decouple who talks to whom", "Add behaviour without editing the class"], ready: true },
  { slug: "command", name: "Command", category: "behavioral", intent: "Turn a request into an object you can queue or undo.", difficulty: 2, usedInPractice: "High", confusedWith: ["Strategy"], lenses: ["Undo / history", "Decouple who talks to whom"], ready: true },
  { slug: "iterator", name: "Iterator", category: "behavioral", intent: "Walk a collection without exposing how it is stored.", difficulty: 1, usedInPractice: "High (built-in)", confusedWith: ["Visitor"], lenses: ["Work with trees / collections"], ready: true },
  { slug: "mediator", name: "Mediator", category: "behavioral", intent: "Objects talk through one hub instead of each other.", difficulty: 2, usedInPractice: "Low–Medium", confusedWith: ["Observer", "Facade"], lenses: ["Decouple who talks to whom"], ready: true },
  { slug: "memento", name: "Memento", category: "behavioral", intent: "Save and restore an object's state without exposing its internals.", difficulty: 2, usedInPractice: "Low", confusedWith: ["Command", "Prototype"], lenses: ["Undo / history"], ready: true },
  { slug: "observer", name: "Observer", category: "behavioral", intent: "Notify every subscriber when something changes.", difficulty: 2, usedInPractice: "High", confusedWith: ["Mediator", "Pub/Sub"], lenses: ["Decouple who talks to whom"], ready: true },
  { slug: "state", name: "State", category: "behavioral", intent: "Change behaviour when internal state changes.", difficulty: 2, usedInPractice: "Medium", confusedWith: ["Strategy"], lenses: ["Swap behaviour or algorithm"], ready: true },
  { slug: "strategy", name: "Strategy", category: "behavioral", intent: "Swap an algorithm at runtime behind one interface.", difficulty: 1, usedInPractice: "High", confusedWith: ["State", "Template Method"], lenses: ["Swap behaviour or algorithm"], ready: true },
  { slug: "template-method", name: "Template Method", category: "behavioral", intent: "Fix the steps of an algorithm and let subclasses fill some in.", difficulty: 1, usedInPractice: "Medium", confusedWith: ["Strategy", "Factory Method"], lenses: ["Swap behaviour or algorithm"], ready: true },
  { slug: "visitor", name: "Visitor", category: "behavioral", intent: "Add new operations to a stable class structure.", difficulty: 3, usedInPractice: "Low", confusedWith: ["Iterator", "Strategy"], lenses: ["Add behaviour without editing the class", "Work with trees / collections"], ready: true }
];

/** Concurrency patterns (Phase 6 extras). Not part of the 22 GoF patterns, so the "/ 22" counts leave them out. */
export const CONCURRENCY: PatternInfo[] = [
  { slug: "producer-consumer", name: "Producer–Consumer", category: "concurrency", intent: "Hand work from producers to consumers through a bounded, thread-safe queue.", difficulty: 2, usedInPractice: "High", confusedWith: ["Observer", "Thread Pool"], lenses: ["Run work safely in parallel"], ready: true },
  { slug: "thread-pool", name: "Thread Pool", category: "concurrency", intent: "Reuse a fixed set of worker threads for many short tasks.", difficulty: 2, usedInPractice: "High (built-in)", confusedWith: ["Producer–Consumer", "Command"], lenses: ["Run work safely in parallel", "Save memory or resources"], ready: true },
  { slug: "read-write-lock", name: "Read–Write Lock", category: "concurrency", intent: "Let many readers in at once, but give a writer the data to itself.", difficulty: 3, usedInPractice: "Medium", confusedWith: ["Mutex", "Proxy"], lenses: ["Run work safely in parallel"], ready: true },
  { slug: "thread-safe-singleton", name: "Thread-safe Singleton", category: "concurrency", intent: "Create one shared instance lazily, exactly once, even when threads race.", difficulty: 2, usedInPractice: "Medium", confusedWith: ["Singleton"], lenses: ["Run work safely in parallel", "Control how objects are created"], ready: true }
];

/** The 22 GoF patterns plus the concurrency patterns (catalog, pattern pages, content checks). */
export const ALL_PATTERNS: PatternInfo[] = [...PATTERNS, ...CONCURRENCY];

export const LENSES = [
  "Control how objects are created",
  "Make incompatible or complex things easy to use",
  "Add behaviour without editing the class",
  "Work with trees / collections",
  "Swap behaviour or algorithm",
  "Decouple who talks to whom",
  "Undo / history",
  "Save memory or resources",
  "Run work safely in parallel"
];

export const stars = (d: number) => "★".repeat(d) + "☆".repeat(3 - d);
