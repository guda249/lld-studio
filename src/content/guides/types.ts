/**
 * UML Basics lessons, the OOP & SOLID primer and the anti-patterns guide.
 *
 * UML lessons follow the approved template (Notion 07, "The six relationships"): a list of concepts on the left; a
 * stage where each concept's diagram builds up step by step with narration; What it means / How to spot it in code /
 * When to use it; runnable Python + Scala; and a practice round at the end.
 *
 * Code is real files imported with `?raw` (Python 3.12 that prints; Scala 3 with `@main def demo(): Unit =`).
 */
import type { Question, SequenceSpec } from "../../anim/types";
import type { CodePair } from "../types";
import type { UmlSketch } from "../extras/types";

/* ---------------- diagrams that are not class diagrams: state machine, activity, use case ---------------- */

export interface FlowNode {
  /** Unique within the diagram (letters, digits, - and _). */
  id: string;
  /**
   * initial (filled dot), final (bullseye), state (rounded box), action (rounded box, activity), decision / merge
   * (diamond), fork / join (thick bar), actor (stick figure, label below), usecase (ellipse), boundary (system
   * rectangle with its name at the top; drawn behind everything), note (folded-corner box), object (plain box).
   */
  kind: "initial" | "final" | "state" | "action" | "decision" | "merge" | "fork" | "join" | "actor" | "usecase" | "boundary" | "note" | "object";
  label?: string;
  /** Top-left corner and size in diagram units (px at 100%). Sizes have sensible defaults per kind. */
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  /** e.g. "coin inserted [credit ≥ price] / dispense" or "«include»" */
  label?: string;
  /** Dashed line (use-case «include» / «extend», notes). */
  dashed?: boolean;
  /** "none" for plain association lines (actor — use case, note links). Default: open arrowhead at `to`. */
  arrow?: "open" | "none";
  /** Optional bend points, from `from` towards `to`. */
  via?: [number, number][];
  /** Where the label sits (default: middle of the line, nudged right). */
  labelAt?: [number, number];
}

export interface FlowSpec {
  /** Keep diagrams narrow and tall: width at most 360 so they stay readable on phones without shrinking. */
  width: number;
  height: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** One sentence for screen readers. */
  label: string;
}

export type Visual =
  | { kind: "class"; uml: UmlSketch }
  | { kind: "sequence"; spec: SequenceSpec }
  | { kind: "flow"; spec: FlowSpec };

/**
 * One narration step of a concept's scene. `show` lists the elements that appear in this step (they stay for the
 * following steps; the first step usually shows the starting elements):
 *  - class diagram: class names, and relations as "From>To";
 *  - sequence diagram: participant ids, and messages as "m1", "m2" … (1-based order in `messages`);
 *  - flow diagram: node and edge ids.
 * Elements never listed in any step are visible from the start.
 */
export interface SceneStep { say: string; show: string[] }

export interface Concept {
  /** Unique within the lesson. */
  id: string;
  name: string;
  /** A few words, shown under the name in the list. */
  short: string;
  /** The notation in a few characters, shown next to the name (e.g. "+ - # ~", "0..*", "«interface»"). */
  notation?: string;
  visual: Visual;
  /** 2–5 steps that build the diagram up and say why it matters. */
  scene: SceneStep[];
  what: string;
  spot: string;
  when: string;
  code: CodePair;
  /** 1-based lines to highlight per language (the lines the notation stands for). */
  hl?: { python: number[]; scala: number[] };
}

export interface UmlLesson {
  /** e.g. "class-anatomy"; the file name under src/content/uml/lessons/. */
  id: string;
  /** Position in UML Basics, 1–9 (3 is "The six relationships", which has its own page). */
  order: number;
  title: string;
  lede: string;
  /** 3–8 concepts (the final quiz lesson has none). */
  concepts: Concept[];
  /** Practice at the end: 5–10 questions (mcq / bug / order). */
  practiceTitle: string;
  practice: Question[];
  /** "Draw your first diagram": read the code, draw its class diagram, and the app checks it against the code. */
  draw?: { task: string; code: CodePair; tips: string[] };
}

/** One clickable symbol in the notation lab. */
export interface NotationSymbol {
  id: string;
  group: "Class box" | "Relationships" | "Multiplicity" | "Sequence" | "State & activity" | "Use case";
  name: string;
  /**
   * How the symbol is drawn in the list: "rel:<association|dependency|aggregation|composition|inheritance|realization>",
   * "text:<characters>" (shown in a monospace badge, e.g. "text:+", "text:«interface»", "text:0..*"),
   * "box:<interface|abstract|concrete|singleton|enum>", or "flow:<FlowNode kind>".
   */
  glyph: string;
  meaning: string;
  /** Python and Scala lines that the symbol stands for (short; runnable is not required here). */
  code?: CodePair;
}

/* ---------------- OOP & SOLID primer, anti-patterns ---------------- */

export type GuideBlock =
  | { type: "text"; text: string }
  | { type: "callout"; tone: "tip" | "warn"; title: string; text: string }
  | { type: "list"; title?: string; items: string[]; style?: "ticks" | "crosses" | "plain" }
  | { type: "code"; title: string; code: CodePair; note?: string }
  | { type: "diagram"; title: string; uml: UmlSketch }
  | { type: "compare"; before: { title: string; text: string; code: CodePair; uml?: UmlSketch }; after: { title: string; text: string; code: CodePair; uml?: UmlSketch } }
  | { type: "patterns"; title: string; items: { slug: string; how: string }[] };

export interface Guide {
  section: "solid" | "anti";
  /** e.g. "srp"; the file name under src/content/solid/ or src/content/anti/. */
  id: string;
  /** Position in its section (1, 2, …). */
  order: number;
  title: string;
  /** One line for the index card. */
  short: string;
  lede: string;
  blocks: GuideBlock[];
  /** 4–6 questions (mcq / bug / order). */
  quiz: Question[];
}
