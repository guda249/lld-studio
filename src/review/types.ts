import type { Lang, UmlKind } from "../content/types";
import type { RelType } from "../anim/types";
import type { CodeModel } from "./model";
import type { Helpers } from "./helpers";

export type Severity = "pass" | "warn" | "fail" | "note";

/** One piece of plain-English feedback. */
export interface Finding {
  /** Stable id, e.g. "strategy.context-creates-concrete" (used by tests and to avoid duplicates). */
  id: string;
  sev: Severity;
  /** Short headline, e.g. "Checkout creates CardPayment itself". */
  title: string;
  /** What is wrong (or right) and why it matters, in plain English. */
  text: string;
  /** How to fix it, when there is something to fix. */
  fix?: string;
  /** 1-based code line the finding is about. */
  line?: number;
  /** Section of the pattern page to read again: "problem", "lesson", "uml", "code", "when", "confused". */
  lesson?: string;
}

/** The learner's class diagram (the UML editor's model; also built from code with "Start from my code"). */
export interface UmlClass { id: string; name: string; kind: UmlKind; members: string[] }
export interface UmlRelation { id: string; from: string; to: string; type: RelType }
export interface UmlModel { classes: UmlClass[]; relations: UmlRelation[] }

export interface PatternResult {
  /** Did the code have the pattern's shape at all? */
  found: boolean;
  findings: Finding[];
  /** One sentence naming who plays which role, used in the summary. Only when found. */
  roles?: string;
  /** Generic finding ids this pattern makes irrelevant (e.g. Visitor legitimately has many visit methods). */
  suppress?: string[];
}

/** Pattern conformance rules. One file per pattern in src/review/rules/<slug>.ts. */
export interface PatternRules {
  slug: string;
  /** Pattern name as shown to the learner. */
  name: string;
  review(model: CodeModel, h: Helpers): PatternResult;
}

export interface ReviewInput {
  slug: string;
  lang: Lang;
  code: string;
  diagram?: UmlModel | null;
}

export interface Report {
  slug: string;
  lang: Lang;
  /** 0–100. */
  score: number;
  patternFound: boolean;
  summary: string;
  findings: Finding[];
  /** The whole report as Markdown (saved as review.md). */
  markdown: string;
  createdAt: number;
}

/** A practice task for the scratch pad (src/content/patterns/<slug>/exercise.ts). */
export interface Exercise {
  slug: string;
  /** One or two sentences: what to do. */
  task: string;
  /** Checklist of what a good answer has (3–5 short items). */
  goals: string[];
  /** Progressive hints, from gentle to nearly the answer. */
  hints: string[];
}
