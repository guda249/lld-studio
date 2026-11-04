/**
 * Data model for every animated diagram in LLD Studio: pattern story animations, the animated mini diagrams of
 * real-world examples, quiz diagrams and the UML Basics lessons. One engine draws and animates all of them.
 *
 * Coordinates are SVG user units. Each diagram has a landscape layout (`at`) and, for anything shown on phones,
 * a portrait layout (`portrait`), so text is never shrunk into unreadable sizes (docs/design-system.md).
 */
import type { CodePair, UmlKind } from "../content/types";

export interface Box {
  x: number;
  y: number;
  /** Width. Height is computed from the content (see geometry.ts: nodeHeight) unless `h` is given. */
  w: number;
  h?: number;
}

export interface DNode {
  /** Unique within the diagram; used by edges and actions. Letters, digits, - and _. */
  id: string;
  kind: UmlKind;
  /** Class / trait / object name shown in bold. Italic automatically for abstract classes. */
  name: string;
  /** Overrides the stereotype text, e.g. "«trait»". Default comes from `kind`. Use "" for none. */
  stereotype?: string;
  /** Member lines in UML style, e.g. "- method: PaymentMethod", "+ pay(amount)". Max ~4 lines. */
  members?: string[];
  /** Scala spelling of the members when it differs (camelCase etc.). Same length as `members`. */
  scalaMembers?: string[];
  /** Thick orange border: this class plays the key role of the pattern. */
  key?: boolean;
  /** Starts invisible; an action (show / spawn) reveals it. */
  hidden?: boolean;
  at: Box;
  portrait?: Box;
}

export type RelType = "association" | "dependency" | "aggregation" | "composition" | "inheritance" | "realization";

export interface DEdge {
  id: string;
  /**
   * association / dependency: arrowhead at `to`.
   * inheritance / realization: `from` is the child, hollow triangle at `to` (the parent / interface).
   * aggregation / composition: `from` is the WHOLE (diamond drawn at `from`), `to` is the part.
   */
  from: string;
  to: string;
  type: RelType;
  label?: string;
  /** Multiplicity text near each end, e.g. "1", "0..*". */
  fromMult?: string;
  toMult?: string;
  hidden?: boolean;
  /**
   * Optional bend points (landscape / portrait), listed from the DECORATED end (arrowhead, triangle or diamond)
   * towards the other end. Without them the engine routes the line itself (straight or one orthogonal bend).
   */
  via?: [number, number][];
  viaPortrait?: [number, number][];
  /** "straight": a single straight line between the box borders, even if diagonal. */
  route?: "auto" | "straight";
}

export interface DBadge {
  id: string;
  text: string;
  tone: "warn" | "ok" | "info";
  /** Node the badge sits next to. */
  near: string;
  place?: "above" | "below";
  /** Badges start hidden unless this is false. */
  hidden?: boolean;
}

export interface DiagramSpec {
  /** Landscape viewBox size. */
  width: number;
  height: number;
  /** Portrait viewBox size (phones). Required when any node has `portrait`. */
  portraitWidth?: number;
  portraitHeight?: number;
  nodes: DNode[];
  edges: DEdge[];
  badges?: DBadge[];
  /** One-sentence description for screen readers. */
  label: string;
}

/**
 * Things that happen on stage. A step's actions run one after another; set `together: true` on an action to
 * start it at the same time as the previous one.
 */
export type Action = (
  /** Fade in nodes, edges (line draws in), badges or cross marks. Restores dimmed items to full strength. */
  | { show: string[] }
  | { hide: string[] }
  /** Fade to 25 %: "this still exists but no longer matters". */
  | { dim: string[] }
  /** Reveal hidden nodes by flying them out of another node (e.g. if/elif branches becoming classes). */
  | { spawn: string[]; from: string }
  /** Replace a node's member lines (fade). `stagger` reveals the new lines one by one. */
  | { members: string; lines: string[]; scalaLines?: string[]; stagger?: boolean }
  /** A message pill travels through the listed nodes (centres). `result` travels back the same way (or `back`). */
  | { call: string[]; label: string; scalaLabel?: string; result?: string; back?: string[]; hold?: number }
  /** Orange "active" ring around a node, with an optional caption under it; `null` removes it. */
  | { ring: string | null; caption?: string }
  | { pulse: string }
  /** Warning flash (vermillion outline) on a node. */
  | { flash: string }
  | { shake: string }
  /** Cross a node out (deleted / destroyed). Its id for show/hide is `<node>__x`. */
  | { cross: string }
  /** Small value tag under a node (e.g. "state: Paid", "count = 3"). `null` text hides it. */
  | { tag: string; text: string | null }
  /** Highlight one member line of a node (0-based); `null` removes it. */
  | { mark: string; member: number | null }
  | { wait: number }
) & { together?: boolean };

export interface StoryStep {
  title: string;
  /** What is happening (shown and spoken). */
  what: string;
  /** Why it matters (shown after "Why it matters:"). */
  why: string;
  /** Spoken versions, written for listening ("U P I", no code symbols). Default: the written text. */
  say?: { what?: string; why?: string };
  /** Which code file the code panel shows during this step. */
  code: "problem" | "main";
  /** 1-based highlighted lines for each language; other lines are dimmed. Empty = no highlight. */
  lines: { python: number[]; scala: number[] };
  actions: Action[];
}

export interface Story {
  diagram: DiagramSpec;
  steps: StoryStep[];
}

export interface TryOption {
  id: string;
  label: string;
}

export interface TryResult {
  /** The value the code would produce, shown big (must match the example code's real output). */
  output: string;
  /** How it was worked out, shown small. */
  note?: string;
  /** What the mini diagram plays, usually a ring move plus a call with this output as the result. */
  actions: Action[];
}

/** Generic Try-it: one or two groups of chips; every combination has a precomputed result. */
export interface TryIt {
  prompt: string;
  groups: { label: string; options: TryOption[] }[];
  /** Keyed by option ids joined with "|" in group order, e.g. "surge" or "surge|night". Every combination. */
  results: Record<string, TryResult>;
}

export interface ExampleAnimation {
  diagram: DiagramSpec;
  /** One list of actions per walkthrough sentence (same length as the lesson example's `walkthrough`). */
  walk: Action[][];
  /** Generic Try-it, or the id of a custom widget (Strategy's approved prototype widgets). */
  tryIt: TryIt | { custom: string };
}

export interface SeqParticipant {
  id: string;
  name: string;
  kind: UmlKind;
}

export interface SeqMessage {
  from: string;
  to: string;
  label: string;
  /** call (solid, filled arrow), return (dashed, open arrow), create (dashed «create»), self (loop). */
  kind?: "call" | "return" | "create" | "self";
}

export interface SequenceSpec {
  participants: SeqParticipant[];
  messages: SeqMessage[];
  /** One sentence for screen readers. */
  label: string;
}

export interface PatternAnimation {
  slug: string;
  story: Story;
  /** Keyed by the lesson example id. */
  examples: Record<string, ExampleAnimation>;
  sequence: SequenceSpec;
}

/* ---------- quiz and flashcards ---------- */

export type QuizLang = "python" | "scala";

interface QBase {
  /** One of: Concept, Find the problem, Which pattern?, Scenario, Put in order, Read the diagram. */
  tag: string;
  prompt: string;
  hint: string;
  /** Why the right answer is right (and the others wrong). */
  explain: string;
}

export type Question =
  | (QBase & { type: "mcq"; code?: { lang: QuizLang; text: string }; options: string[]; answer: number })
  | (QBase & { type: "bug"; code: { lang: QuizLang; text: string }; /** 1-based line */ answer: number })
  | (QBase & { type: "order"; /** In the CORRECT order. */ steps: string[]; /** Display order (indices into steps). */ shuffled: number[] })
  | (QBase & { type: "diagram"; /** Exactly 3 small diagrams (landscape only), labelled A, B, C. */ options: DiagramSpec[]; answer: number });

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  code?: { lang: QuizLang; text: string };
}

export interface PatternQuiz {
  slug: string;
  questions: Question[];
  cards: Flashcard[];
}

export type { CodePair };
