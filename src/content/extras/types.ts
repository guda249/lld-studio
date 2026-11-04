/**
 * Phase 6 extras: comparisons, LLD case studies and refactoring katas.
 *
 * Code is real files imported with Vite `?raw` (Python 3.12 with `print`, Scala 3 with `@main def demo(): Unit =`,
 * indentation syntax). Every file must run as-is. Class diagrams are written as a small `UmlSketch` and drawn by the
 * same engine as the scratch pad; the content tests read the code with tree-sitter and check that the sketch's
 * classes and relationships really are in the code.
 */
import type { CodePair } from "../types";
import type { Question, SequenceSpec } from "../../anim/types";
import type { RelType } from "../../anim/types";
import type { UmlKind } from "../types";

/** A class diagram, compact to write. Class names must match the code exactly. */
export interface UmlSketch {
  classes: { name: string; kind: UmlKind; /** e.g. "+ pay(amount)", "- method: PaymentMethod" (max ~5) */ members?: string[] }[];
  /** from → to, e.g. { from: "Card", to: "PaymentMethod", type: "realization" }; for has-a, from = the whole. */
  relations: { from: string; to: string; type: RelType }[];
}

/* ---------------- comparisons ("confused with") ---------------- */

export interface ComparisonSide {
  /** Pattern slug from src/content/patterns.ts. */
  slug: string;
  /** What this pattern is for, in this example, one sentence. */
  oneLiner: string;
  /** The SAME scenario solved with this pattern (both languages, runnable, 25–60 lines each). */
  code: CodePair;
  uml: UmlSketch;
  /** 2–4 short sentences: what happens at runtime in this version. */
  howItWorks: string[];
  /** 2–3 bullet points: pick this one when… */
  pickWhen: string[];
}

export interface Comparison {
  /** The side slugs joined by "-vs-", e.g. "strategy-vs-state"; also the folder name under src/content/compare/. */
  id: string;
  /** e.g. "Strategy vs State" */
  title: string;
  /** One sentence: why people mix them up. */
  tagline: string;
  /** The shared scenario every side implements, 2–3 sentences. */
  scenario: string;
  /** The one question that decides which pattern you want. */
  decidingQuestion: string;
  /** 2 or 3 sides. */
  sides: ComparisonSide[];
  /** 4–7 rows; `values` has one entry per side, in order. */
  table: { aspect: string; values: string[] }[];
  /** 2–4 common mistakes ("using X when you meant Y" and how to notice). */
  mixups: string[];
  /** 4–5 questions (mcq / bug / order; no "diagram"), at least one "Which pattern?" scenario. */
  quiz: Question[];
}

/* ---------------- LLD case studies ---------------- */

export interface CaseStudy {
  /** e.g. "parking-lot"; also the folder name under src/content/cases/. */
  slug: string;
  title: string;
  difficulty: 1 | 2 | 3;
  /** One line for the index card. */
  tagline: string;
  /** The interview prompt, as an interviewer would say it. */
  prompt: string;
  /** 4–6 clarifying questions a good candidate asks, each with the answer we assume. */
  clarify: { q: string; a: string }[];
  requirements: { functional: string[]; nonFunctional: string[]; outOfScope: string[] };
  /** The core classes and what each is responsible for (5–10). */
  entities: { name: string; responsibility: string }[];
  /** Class diagram of the core design (6–12 classes). */
  uml: UmlSketch;
  /** One key flow as a sequence diagram (4–10 messages). */
  flow: { title: string; sequence: SequenceSpec };
  /** Optional state machine (elevator, vending machine, order…). */
  states?: { name: string; states: string[]; transitions: { from: string; to: string; on: string }[] };
  /** Which patterns appear, where (class names) and why. Slugs from src/content/patterns.ts (2–5). */
  patterns: { slug: string; where: string; why: string }[];
  /** The whole design, runnable, with a short demo (120–260 lines each). */
  code: CodePair;
  /** 3–5 trade-offs or design decisions, each "We chose X over Y because …". */
  tradeoffs: string[];
  /** 4–6 follow-up questions interviewers ask, with a short model answer. */
  followUps: { q: string; a: string }[];
  /** 3–4 "extend it yourself" challenges. */
  extend: string[];
  /** 3–4 quiz questions (mcq / order / bug). */
  quiz: Question[];
}

/* ---------------- refactoring katas ---------------- */

export interface Kata {
  /** e.g. "strategy-shipping"; also the folder name under src/content/katas/. */
  id: string;
  /** Pattern slug whose review rules check the result (a GoF pattern with rules in src/review/rules/). */
  slug: string;
  title: string;
  /** Domain, e.g. "Food delivery". Different from the pattern lesson's own examples. */
  domain: string;
  difficulty: 1 | 2 | 3;
  /** 1–2 sentences: the smell and the change request that makes it hurt. */
  task: string;
  /** 3–5 checklist items, matching what the pattern's review rules check. */
  goals: string[];
  /** 3 hints, gentle → nearly the answer. */
  hints: string[];
  /** The smelly code the learner starts from (runs as-is). The review must NOT pass it as the pattern. */
  starter: CodePair;
  /** One good refactoring (runs as-is). The review must recognise it with no problems. Shown only on request. */
  solution: CodePair;
}
