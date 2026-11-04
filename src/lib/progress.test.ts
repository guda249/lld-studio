import { computeProgress, dayKey, statusOf } from "./progress";
import { DAY } from "./sm2";
import { eq, ok } from "../test/expect";

// Noon local time, so adding / removing whole days never crosses midnight.
const NOW = new Date(2026, 10, 2, 12, 0, 0).getTime();
const daysAgo = (n: number) => NOW - n * DAY;
const attempt = (slug: string, score: number, at: number, lang = "python") =>
  ({ slug, lang, code: "", diagram: { classes: [], relations: [] }, createdAt: at, id: String(at), report: { score, patternFound: score > 35 } });
const base = { visits: 0, quizRuns: 0, attempts: 0, quizBest: null, reviewBest: null, cardsTotal: 0, cardsNew: 0 };

export const tests = {
  "progress: status rules (learning, practised, mastered)"() {
    eq(statusOf(base), "none");
    eq(statusOf({ ...base, visits: 1 }), "learning");
    eq(statusOf({ ...base, cardsTotal: 5, cardsNew: 4 }), "learning");
    eq(statusOf({ ...base, cardsTotal: 5, cardsNew: 5 }), "none", "a deck of unseen cards is not learning yet");
    eq(statusOf({ ...base, quizRuns: 1, quizBest: 0.6 }), "practised");
    eq(statusOf({ ...base, attempts: 1, reviewBest: 90 }), "practised");
    eq(statusOf({ ...base, quizRuns: 1, attempts: 1, quizBest: 0.8, reviewBest: 79 }), "practised");
    eq(statusOf({ ...base, quizRuns: 1, attempts: 1, quizBest: 0.8, reviewBest: 80 }), "mastered");
  },
  "progress: streaks count consecutive local days, today or up to yesterday"() {
    const day = (n: number, extra = {}) => ({ [`activity:${dayKey(daysAgo(n))}`]: { date: dayKey(daysAgo(n)), seconds: 0, lessons: 1, quizzes: 0, cards: 0, reviews: 0, updatedAt: daysAgo(n), ...extra } });
    let p = computeProgress({ ...day(0), ...day(1), ...day(2), ...day(4) }, NOW);
    eq([p.streak, p.bestStreak, p.activeToday], [3, 3, true]);
    p = computeProgress({ ...day(1), ...day(2) }, NOW);
    eq([p.streak, p.activeToday], [2, false], "a streak still counts until today ends");
    p = computeProgress({ ...day(2), ...day(3) }, NOW);
    eq(p.streak, 0);
    p = computeProgress({ ...day(0, { lessons: 0, seconds: 30 }) }, NOW);
    eq(p.streak, 0, "under a minute with no actions is not an active day");
    p = computeProgress({ "attempt:strategy:1": attempt("strategy", 70, daysAgo(0)), "quiz:observer": { correct: 3, total: 5, at: daysAgo(1) } }, NOW);
    eq(p.streak, 2, "quizzes and attempts saved before tracking still count");
  },
  "progress: per-pattern numbers, averages and category coverage"() {
    const data = {
      "seen:strategy": { first: daysAgo(3), last: daysAgo(1), visits: 4, updatedAt: daysAgo(1) },
      "quiz:strategy": { correct: 4, total: 5, at: daysAgo(1), best: 0.8, history: [{ correct: 2, total: 5, at: daysAgo(2) }, { correct: 4, total: 5, at: daysAgo(1) }] },
      "quiz:observer": { correct: 3, total: 5, at: daysAgo(1) },
      "attempt:strategy:1": attempt("strategy", 35, daysAgo(2)),
      "attempt:strategy:2": attempt("strategy", 100, daysAgo(1), "scala"),
      "attempt:builder:1": attempt("builder", 60, daysAgo(0))
    };
    const p = computeProgress(data, NOW);
    const s = p.patterns.find((x) => x.slug === "strategy")!;
    eq([s.status, s.quizRuns, s.quizLast, s.reviewBest, s.reviewLast, s.attempts], ["mastered", 2, 0.8, 100, 100, 2]);
    eq(p.counts, { none: 19, learning: 0, practised: 2, mastered: 1 });
    eq(Math.round(p.quizAverage! * 100), 70);
    eq(p.reviewAverage, 80);
    eq(p.byCategory.map((c) => `${c.category} ${c.done}/${c.total}`), ["creational 1/5", "structural 0/7", "behavioral 2/10"]);
    eq(p.trend.map((t) => t.score), [35, 100, 60]);
    eq(p.recent[0].slug, "builder", "most recent attempt first");
    ok(!p.empty, "not empty");
    ok(computeProgress({}, NOW).empty, "empty store is empty");
  },
  "progress: due for review (overdue, today, new cards, later) and the 7-day chart"() {
    const card = (due: number, reps: number) => ({ id: String(Math.random()), front: "", back: "", ivl: 1, ease: 2.5, due, reps });
    const p = computeProgress({
      "deck:observer": { cards: [card(daysAgo(2), 2), card(NOW + 3 * DAY, 1)] },
      "deck:singleton": { cards: [card(NOW - 1000, 1)] },
      "deck:builder": { cards: [card(0, 0), card(0, 0)] },
      "deck:facade": { cards: [card(NOW + 3 * DAY, 2)] },
      [`activity:${dayKey(NOW)}`]: { date: dayKey(NOW), seconds: 600, lessons: 1, quizzes: 0, cards: 4, reviews: 0, updatedAt: NOW }
    }, NOW);
    eq(p.due.map((d) => `${d.name}: ${d.label} (${d.cards})`), [
      "Observer: Overdue 2 days (1)", "Singleton: Today (1)", "Builder: 2 new cards (2)", "Facade: In 3 days (0)"
    ]);
    eq(p.dueCards, 4);
    eq(p.week.length, 7);
    eq([p.week[6].label, p.week[6].minutes, p.week[6].actions], ["Today", 10, 5]);
  },
  "progress: decks of comparisons, case studies and concurrency lessons are due too, with their titles"() {
    const card = (due: number, reps: number) => ({ id: String(Math.random()), front: "", back: "", ivl: 1, ease: 2.5, due, reps });
    const p = computeProgress({
      "deck:compare-strategy-vs-state": { title: "Strategy vs State", cards: [card(0, 0), card(daysAgo(1), 1)] },
      "deck:thread-pool": { cards: [card(NOW + 2 * DAY, 1)] }
    }, NOW);
    eq(p.due.map((d) => `${d.name}: ${d.label}`), ["Strategy vs State: Overdue 1 day", "Thread Pool: In 2 days"]);
    eq(p.dueCards, 2);
    eq(p.counts.none, 22, "extra decks do not change the 22 pattern statuses");
  }
};
