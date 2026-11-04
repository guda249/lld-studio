/**
 * Simplified SM-2 spaced repetition, as approved for the flashcards (Notion 08):
 * Again → back of today's session; Hard → 1 day (then ×1.2); Good → 3 days (then × ease);
 * Easy → 7 days (then × ease × 1.3). Ease starts at 2.5, drops on Again / Hard, rises on Easy.
 */
export type Rating = "again" | "hard" | "good" | "easy";
export const RATINGS: Rating[] = ["again", "hard", "good", "easy"];
export const DAY = 86_400_000;

export interface CardState {
  /** Interval in days; 0 = new or failed. */
  ivl: number;
  ease: number;
  /** Due time (ms since epoch); 0 = due now. */
  due: number;
  reps: number;
}

export const freshState = (): CardState => ({ ivl: 0, ease: 2.5, due: 0, reps: 0 });

export function schedule(card: Pick<CardState, "ivl" | "ease">, rating: Rating): { ivl: number; ease: number } {
  let { ivl, ease } = card;
  if (rating === "again") { ivl = 0; ease = Math.max(1.3, ease - 0.2); }
  else if (rating === "hard") { ivl = ivl === 0 ? 1 : Math.max(1, Math.round(ivl * 1.2)); ease = Math.max(1.3, ease - 0.15); }
  else if (rating === "good") { ivl = ivl === 0 ? 3 : Math.round(ivl * ease); }
  else { ivl = ivl === 0 ? 7 : Math.round(ivl * ease * 1.3); ease = ease + 0.15; }
  return { ivl, ease: Math.round(ease * 100) / 100 };
}

/** Applies a rating; "again" makes the card due immediately (it comes back later in this session). */
export function rate(card: CardState, rating: Rating, now = Date.now()): CardState {
  const s = schedule(card, rating);
  return { ivl: s.ivl, ease: s.ease, reps: card.reps + 1, due: rating === "again" ? 0 : now + s.ivl * DAY };
}

export const formatInterval = (d: number): string =>
  d === 0 ? "again soon" : d === 1 ? "1 day" : d < 30 ? `${d} days` : `${Math.round(d / 30)} months`;
