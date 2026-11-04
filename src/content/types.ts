/**
 * Content model for a pattern lesson.
 *
 * Code lives in real files next to each lesson (`code/*.py`, `code/*.scala`) and is imported with Vite's `?raw`,
 * so every snippet can be run and checked as-is (Python 3.12 with `print`, Scala 3 with `@main def ...(): Unit =`).
 *
 * Still to come (they need the Phase 1 engines first): story-animation steps with highlighted lines,
 * mini-diagram + Try-it configs for the examples, quiz questions and flashcards.
 */

export type Lang = "python" | "scala";

/** The same program in both default languages. */
export interface CodePair {
  python: string;
  scala: string;
}

/** UML element kinds; they map to the colours in docs/design-system.md. */
export type UmlKind = "interface" | "abstract" | "concrete" | "singleton" | "enum" | "client";

export interface Participant {
  /** Pattern role, e.g. "Strategy", "Context", "Concrete strategy". */
  role: string;
  /** Class / trait name(s) in the main code, e.g. "PaymentStrategy". */
  name: string;
  kind: UmlKind;
  description: string;
}

/** Maps a pattern role to the class that plays it in one example (feeds the mini diagram later). */
export interface RoleMapping {
  role: string;
  name: string;
}

export interface RealWorldExample {
  /** Short id, unique within the pattern, e.g. "ride". */
  id: string;
  /** Industry / area, e.g. "Ride-hailing". */
  domain: string;
  title: string;
  /** The situation a developer faces, before the pattern. */
  situation: string;
  roles: RoleMapping[];
  /** Why this pattern fits here. */
  why: string;
  /** One practical caveat or tip ("Good to know"). */
  goodToKnow: string;
  /** Plain-English walkthrough, one sentence per step (later drives the animated mini diagram). */
  walkthrough: string[];
  code: CodePair;
}

export interface NamedDifference {
  name: string;
  difference: string;
}

export interface PatternLesson {
  /** Must match the slug in src/content/patterns.ts. */
  slug: string;
  analogy: string;
  problem: {
    text: string;
    /** A short "before" snippet showing the pain (Python and Scala). */
    code: CodePair;
  };
  solution: string;
  participants: Participant[];
  /** The classic version of the pattern. */
  code: CodePair;
  /** The lighter, language-idiomatic version (functions, objects, case classes...). */
  idiomatic: {
    note: string;
    code: CodePair;
  };
  /** Where it shows up in libraries and frameworks people already use. */
  realWorldUses: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  pros: string[];
  cons: string[];
  confusedWith: NamedDifference[];
  solid: string;
  interviewUses: string[];
  /** Exactly four. */
  examples: RealWorldExample[];
}
