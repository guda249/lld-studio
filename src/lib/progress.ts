/**
 * Learning progress: what the learner did (recorded here, kept in this browser) and the numbers the dashboard
 * shows (computed by pure functions so they can be tested).
 *
 * Keys written here (see also src/lib/store.ts):
 *   seen:<slug>          a pattern page was opened  { first, last, visits, updatedAt }
 *   quiz:<slug>          quiz results               { correct, total, at, best, history[] }
 *   activity:<date>      one local day              { date, seconds, lessons, quizzes, cards, reviews, updatedAt }
 *   uml:seen             UML relationships viewed   { ids[], updatedAt }
 * Read here: deck:<slug> (flashcards), attempt:<slug>:<id> (scratch-pad reviews).
 */
import { ALL_PATTERNS, PATTERNS, type Category } from "../content/patterns";
import { DAY } from "./sm2";
import { allKeys, getItem, setItem } from "./store";

export type Status = "none" | "learning" | "practised" | "mastered";
export type ActivityKind = "lessons" | "quizzes" | "cards" | "reviews";

export interface Seen { first: number; last: number; visits: number; updatedAt: number }
export interface QuizRun { correct: number; total: number; at: number }
export interface QuizRecord extends QuizRun { best?: number; history?: QuizRun[] }
export interface DayActivity { date: string; seconds: number; lessons: number; quizzes: number; cards: number; reviews: number; updatedAt: number }
export interface UmlSeen { ids: string[]; updatedAt: number }
interface DeckLike { cards: { due: number; reps: number }[]; title?: string }
interface AttemptLike { slug: string; lang: string; createdAt: number; report: { score: number; patternFound: boolean } }

/** Thresholds for "mastered": both the quiz and a scratch-pad review must be strong. */
export const MASTERY = { quiz: 0.8, review: 80 };

/** Local calendar day, e.g. "2026-11-02" (streaks follow the learner's own midnight, not UTC). */
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/* ---------------- recording ---------------- */

// Writes to one key are chained so quick events never overwrite each other.
const queues = new Map<string, Promise<void>>();
function update<T>(key: string, fn: (old: T | undefined) => T): Promise<void> {
  const next = (queues.get(key) ?? Promise.resolve()).then(async () => { await setItem(key, fn(await getItem<T>(key))); }).catch(() => {});
  queues.set(key, next);
  return next;
}

export function logActivity(kind: ActivityKind | "seconds", amount = 1, now = Date.now()): Promise<void> {
  const date = dayKey(now);
  return update<DayActivity>(`activity:${date}`, (old) => {
    const a: DayActivity = old ?? { date, seconds: 0, lessons: 0, quizzes: 0, cards: 0, reviews: 0, updatedAt: now };
    return { ...a, [kind]: (a[kind] ?? 0) + amount, updatedAt: now };
  });
}

export function markPatternSeen(slug: string, now = Date.now()): Promise<void> {
  void logActivity("lessons", 1, now);
  return update<Seen>(`seen:${slug}`, (old) => ({ first: old?.first ?? now, last: now, visits: (old?.visits ?? 0) + 1, updatedAt: now }));
}

export function recordQuiz(slug: string, correct: number, total: number, now = Date.now()): Promise<void> {
  void logActivity("quizzes", 1, now);
  return update<QuizRecord>(`quiz:${slug}`, (old) => {
    const history = [...(old?.history ?? (old ? [{ correct: old.correct, total: old.total, at: old.at }] : [])), { correct, total, at: now }].slice(-20);
    const pct = total ? correct / total : 0;
    return { correct, total, at: now, best: Math.max(pct, old?.best ?? (old && old.total ? old.correct / old.total : 0)), history };
  });
}

export function markUmlSeen(id: string, now = Date.now()): Promise<void> {
  return update<UmlSeen>("uml:seen", (old) => {
    const ids = old?.ids ?? [];
    return ids.includes(id) ? old! : { ids: [...ids, id], updatedAt: now };
  });
}

/** A UML Basics lesson, SOLID or anti-pattern guide was opened (key like "uml/sequence", "solid/srp"). */
export function markGuideSeen(key: string, now = Date.now()): Promise<void> {
  return update<UmlSeen>("guides:seen", (old) => {
    const ids = old?.ids ?? [];
    return ids.includes(key) ? old! : { ids: [...ids, key], updatedAt: now };
  });
}

/** Asks the browser to keep this site's data even when disk space runs low (it may say no; that's fine). */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    const s = (navigator as Navigator & { storage?: StorageManager }).storage;
    if (!s?.persist) return null;
    if (await s.persisted()) return true;
    return await s.persist();
  } catch { return null; }
}

/**
 * Counts active learning time: every 15 s while the tab is visible and the learner touched the page in the last
 * minute. Returns a function that stops it.
 */
export function startActiveTimer(step = 15_000): () => void {
  let lastInput = Date.now();
  const touch = () => { lastInput = Date.now(); };
  const events = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"];
  events.forEach((e) => window.addEventListener(e, touch, { passive: true, capture: true }));
  const timer = window.setInterval(() => {
    if (document.visibilityState === "visible" && Date.now() - lastInput < 60_000) void logActivity("seconds", step / 1000);
  }, step);
  return () => { window.clearInterval(timer); events.forEach((e) => window.removeEventListener(e, touch, { capture: true })); };
}

/** Everything the dashboard needs, read from the store in one go. */
export async function loadProgressData(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const prefix of ["seen:", "quiz:", "deck:", "attempt:", "activity:", "uml:", "guides:"]) {
    const keys = await allKeys(prefix);
    const values = await Promise.all(keys.map((k) => getItem(k)));
    keys.forEach((k, i) => { if (values[i] != null) out[k] = values[i]; });
  }
  return out;
}

/* ---------------- computing ---------------- */

export interface PatternProgress {
  slug: string; name: string; category: Category; status: Status;
  visits: number;
  quizLast: number | null; quizBest: number | null; quizRuns: number;
  reviewLast: number | null; reviewBest: number | null; attempts: number;
  cardsDue: number; cardsNew: number; cardsTotal: number;
  /** earliest due time of a card already studied (ms), null if none */
  nextDue: number | null;
}
export interface DueItem { slug: string; name: string; label: string; tone: "overdue" | "today" | "later"; cards: number; at: number }
export interface Progress {
  patterns: PatternProgress[];
  counts: Record<Status, number>;
  byCategory: { category: Category; done: number; total: number }[];
  streak: number; bestStreak: number; activeToday: boolean;
  quizAverage: number | null; reviewAverage: number | null;
  week: { date: string; label: string; minutes: number; actions: number }[];
  trend: { at: number; slug: string; name: string; lang: string; score: number }[];
  due: DueItem[]; dueCards: number;
  recent: (AttemptLike & { name: string })[];
  umlSeen: string[];
  /** Guide keys opened, e.g. "uml/sequence", "solid/srp". */
  guidesSeen: string[];
  empty: boolean;
}

const pctOf = (r: QuizRun) => (r.total ? r.correct / r.total : 0);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function statusOf(p: Pick<PatternProgress, "visits" | "quizRuns" | "attempts" | "quizBest" | "reviewBest" | "cardsTotal" | "cardsNew">): Status {
  if ((p.quizBest ?? 0) >= MASTERY.quiz && (p.reviewBest ?? 0) >= MASTERY.review) return "mastered";
  if (p.quizRuns > 0 || p.attempts > 0) return "practised";
  if (p.visits > 0 || p.cardsTotal - p.cardsNew > 0) return "learning";
  return "none";
}

function relativeDue(at: number, now: number): { label: string; tone: DueItem["tone"] } {
  const today = dayKey(now);
  if (at <= now) {
    const days = Math.round((new Date(today).getTime() - new Date(dayKey(at)).getTime()) / DAY);
    return days >= 1 ? { label: `Overdue ${days} day${days === 1 ? "" : "s"}`, tone: "overdue" } : { label: "Today", tone: "today" };
  }
  if (dayKey(at) === today) return { label: "Later today", tone: "today" };
  const days = Math.round((new Date(dayKey(at)).getTime() - new Date(today).getTime()) / DAY);
  return { label: days === 1 ? "Tomorrow" : `In ${days} days`, tone: "later" };
}

export function computeProgress(data: Record<string, unknown>, now = Date.now()): Progress {
  const get = <T,>(k: string) => data[k] as T | undefined;
  const attempts = Object.entries(data).filter(([k]) => k.startsWith("attempt:")).map(([, v]) => v as AttemptLike)
    .filter((a) => a && a.report && typeof a.report.score === "number").sort((a, b) => a.createdAt - b.createdAt);
  const nameOf = (slug: string) => ALL_PATTERNS.find((p) => p.slug === slug)?.name ?? slug;

  const patterns: PatternProgress[] = PATTERNS.map((info) => {
    const seen = get<Seen>(`seen:${info.slug}`);
    const quiz = get<QuizRecord>(`quiz:${info.slug}`);
    const runs: QuizRun[] = quiz ? (quiz.history?.length ? quiz.history : [quiz]) : [];
    const mine = attempts.filter((a) => a.slug === info.slug);
    const deck = get<DeckLike>(`deck:${info.slug}`);
    const cards = deck?.cards ?? [];
    const studied = cards.filter((c) => c.reps > 0);
    const p = {
      slug: info.slug, name: info.name, category: info.category, status: "none" as Status,
      visits: seen?.visits ?? 0,
      quizLast: runs.length ? pctOf(runs[runs.length - 1]) : null,
      quizBest: runs.length ? Math.max(quiz?.best ?? 0, ...runs.map(pctOf)) : null,
      quizRuns: runs.length,
      reviewLast: mine.length ? mine[mine.length - 1].report.score : null,
      reviewBest: mine.length ? Math.max(...mine.map((a) => a.report.score)) : null,
      attempts: mine.length,
      cardsDue: cards.filter((c) => c.due <= now).length,
      cardsNew: cards.filter((c) => c.reps === 0).length,
      cardsTotal: cards.length,
      nextDue: studied.length ? Math.min(...studied.map((c) => c.due)) : null
    };
    p.status = statusOf(p);
    return p;
  });

  const counts: Record<Status, number> = { none: 0, learning: 0, practised: 0, mastered: 0 };
  patterns.forEach((p) => counts[p.status]++);
  const byCategory = (["creational", "structural", "behavioral"] as Category[]).map((category) => {
    const ps = patterns.filter((p) => p.category === category);
    return { category, done: ps.filter((p) => p.status === "practised" || p.status === "mastered").length, total: ps.length };
  });

  // Active days: the activity log, plus dates of quizzes and attempts (so data from before tracking still counts).
  const days = new Map<string, { seconds: number; actions: number }>();
  const bump = (date: string, seconds: number, actions: number) => {
    const d = days.get(date) ?? { seconds: 0, actions: 0 };
    days.set(date, { seconds: d.seconds + seconds, actions: d.actions + actions });
  };
  for (const [k, v] of Object.entries(data)) {
    if (!k.startsWith("activity:")) continue;
    const a = v as DayActivity;
    bump(a.date ?? k.slice(9), a.seconds ?? 0, (a.lessons ?? 0) + (a.quizzes ?? 0) + (a.cards ?? 0) + (a.reviews ?? 0));
  }
  const logged = new Set(days.keys());
  const extra = (t: number) => { const d = dayKey(t); if (!logged.has(d)) bump(d, 0, 1); };
  attempts.forEach((a) => extra(a.createdAt));
  Object.entries(data).filter(([k]) => k.startsWith("quiz:")).forEach(([, v]) => {
    const q = v as QuizRecord;
    (q.history?.length ? q.history : [q]).forEach((r) => r?.at && extra(r.at));
  });
  const active = (d: string) => { const x = days.get(d); return !!x && (x.actions > 0 || x.seconds >= 60); };

  const activeToday = active(dayKey(now));
  let streak = 0;
  for (let t = activeToday ? now : addDays(now, -1); active(dayKey(t)); t = addDays(t, -1)) streak++;
  let bestStreak = 0, run = 0, prev: string | null = null;
  for (const d of [...days.keys()].filter(active).sort()) {
    run = prev && dayKey(addDays(new Date(`${prev}T12:00:00`).getTime(), 1)) === d ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = d;
  }

  const fmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  const week = Array.from({ length: 7 }, (_, i) => {
    const t = addDays(now, i - 6);
    const date = dayKey(t);
    const d = days.get(date);
    return { date, label: i === 6 ? "Today" : fmt.format(t), minutes: Math.round((d?.seconds ?? 0) / 60), actions: d?.actions ?? 0 };
  });

  // Decks that are not GoF patterns: concurrency lessons, comparisons, case studies.
  const extraDecks = Object.entries(data).filter(([k]) => k.startsWith("deck:") && !PATTERNS.some((p) => `deck:${p.slug}` === k))
    .map(([k, v]) => {
      const slug = k.slice(5), cards = (v as DeckLike)?.cards ?? [];
      const studied = cards.filter((c) => c.reps > 0);
      return { slug, name: (v as DeckLike)?.title ?? nameOf(slug), cardsTotal: cards.length, cardsDue: cards.filter((c) => c.due <= now).length,
        cardsNew: cards.filter((c) => c.reps === 0).length, nextDue: studied.length ? Math.min(...studied.map((c) => c.due)) : null };
    });
  const due: DueItem[] = [];
  for (const p of [...patterns, ...extraDecks]) {
    if (!p.cardsTotal) continue;
    const studiedDue = p.nextDue !== null && p.nextDue <= now;
    if (studiedDue || p.cardsDue > 0) {
      const at = studiedDue ? p.nextDue! : now;
      const r = studiedDue ? relativeDue(at, now) : { label: `${p.cardsNew} new card${p.cardsNew === 1 ? "" : "s"}`, tone: "today" as const };
      due.push({ slug: p.slug, name: p.name, ...r, cards: p.cardsDue, at });
    } else if (p.nextDue !== null) {
      due.push({ slug: p.slug, name: p.name, ...relativeDue(p.nextDue, now), cards: 0, at: p.nextDue });
    }
  }
  const order = { overdue: 0, today: 1, later: 2 };
  due.sort((a, b) => order[a.tone] - order[b.tone] || a.at - b.at);

  const latestQuiz = patterns.filter((p) => p.quizLast !== null).map((p) => p.quizLast!);
  const latestReview = patterns.filter((p) => p.reviewLast !== null).map((p) => p.reviewLast!);

  return {
    patterns, counts, byCategory, streak, bestStreak, activeToday,
    quizAverage: mean(latestQuiz), reviewAverage: mean(latestReview),
    week,
    trend: attempts.slice(-12).map((a) => ({ at: a.createdAt, slug: a.slug, name: nameOf(a.slug), lang: a.lang, score: a.report.score })),
    due, dueCards: [...patterns, ...extraDecks].reduce((s, p) => s + p.cardsDue, 0),
    recent: attempts.slice(-6).reverse().map((a) => ({ ...a, name: nameOf(a.slug) })),
    umlSeen: get<UmlSeen>("uml:seen")?.ids ?? [],
    guidesSeen: get<UmlSeen>("guides:seen")?.ids ?? [],
    empty: !Object.keys(data).length
  };
}

/** "Today", "Yesterday", "3 days ago", or a date. */
export function ago(t: number, now = Date.now()): string {
  const days = Math.round((new Date(dayKey(now)).getTime() - new Date(dayKey(t)).getTime()) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(t).toLocaleDateString();
}
