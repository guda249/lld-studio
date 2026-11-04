import type { PatternLesson } from "./types";
import type { PatternAnimation, PatternQuiz } from "../anim/types";

// One lazily loaded chunk per file: a pattern's text, code and animations download only when its page is opened.
const lessons = import.meta.glob<{ default: PatternLesson }>("./patterns/*/lesson.ts");
const animations = import.meta.glob<{ default: PatternAnimation }>("./patterns/*/animation.ts");
const quizzes = import.meta.glob<{ default: PatternQuiz }>("./patterns/*/quiz.ts");
const key = (slug: string, file: string) => `./patterns/${slug}/${file}.ts`;

export const hasLesson = (slug: string): boolean => key(slug, "lesson") in lessons;
export const hasAnimation = (slug: string): boolean => key(slug, "animation") in animations;

export function loadLesson(slug: string): Promise<PatternLesson> | null {
  const load = lessons[key(slug, "lesson")];
  return load ? load().then((m) => m.default) : null;
}

export interface FullPattern {
  lesson: PatternLesson;
  animation: PatternAnimation | null;
  quiz: PatternQuiz | null;
}

/** Lesson + animation + quiz for one pattern; the last two are optional. */
export async function loadPattern(slug: string): Promise<FullPattern | null> {
  const l = lessons[key(slug, "lesson")];
  if (!l) return null;
  const a = animations[key(slug, "animation")];
  const q = quizzes[key(slug, "quiz")];
  const [lesson, animation, quiz] = await Promise.all([
    l().then((m) => m.default),
    a ? a().then((m) => m.default) : Promise.resolve(null),
    q ? q().then((m) => m.default) : Promise.resolve(null)
  ]);
  return { lesson, animation, quiz };
}

/** All quizzes (used by the dashboard's "due for review"). */
export function quizSlugs(): string[] {
  return Object.keys(quizzes).map((k) => k.split("/")[2]);
}

const exercises = import.meta.glob<{ default: import("../review/types").Exercise }>("./patterns/*/exercise.ts");
/** The scratch-pad exercise of a pattern (null until one is written). */
export function loadExercise(slug: string): Promise<import("../review/types").Exercise | null> {
  const load = exercises[key(slug, "exercise")];
  return load ? load().then((m) => m.default) : Promise.resolve(null);
}

/** Just the quiz + flashcards of a pattern (the review session needs nothing else). */
export function loadQuiz(slug: string): Promise<PatternQuiz | null> {
  const load = quizzes[key(slug, "quiz")];
  return load ? load().then((m) => m.default) : Promise.resolve(null);
}
