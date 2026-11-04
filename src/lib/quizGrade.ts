import type { Question } from "../anim/types";

/** The learner's answer: an option index (mcq, diagram), a 1-based line (bug), or an ordering of step indices. */
export type Answer = number | number[] | null;

export function isComplete(q: Question, a: Answer): boolean {
  if (a === null) return false;
  if (q.type === "order") return Array.isArray(a) && a.length === q.steps.length;
  return typeof a === "number";
}

export function grade(q: Question, a: Answer): boolean {
  if (!isComplete(q, a)) return false;
  if (q.type === "order") return (a as number[]).every((s, i) => s === i);
  return a === q.answer;
}

export interface QuizResult { correct: boolean; hint: boolean }

export function resultMessage(correct: number, total: number, pattern: string): string {
  if (correct === total) return `Excellent. You've got ${pattern}.`;
  if (correct >= total - 1) return "Nearly there. Have a look at the one you missed.";
  return "Worth another look at the lesson before moving on.";
}
