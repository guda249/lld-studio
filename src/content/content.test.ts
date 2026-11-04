/**
 * Content checks for every pattern: lesson structure, animation data (ids, layouts, text fit, line routing),
 * story code-line highlights, Try-it results, sequence diagrams, quizzes and flashcards.
 * Run all: npm test      One pattern: npm test -- strategy
 */
import type { PatternLesson } from "./types";
import type { Action, DiagramSpec, PatternAnimation, PatternQuiz, Story } from "../anim/types";
import { buildGeometry } from "../anim/Diagram";
import { badgeRect, maxLines, memberSets, textWidth, type Rect } from "../anim/geometry";
import { ALL_PATTERNS } from "./patterns";
import { Problems } from "../test/expect";

const lessons = import.meta.glob<{ default: PatternLesson }>("./patterns/*/lesson.ts", { eager: true });
const anims = import.meta.glob<{ default: PatternAnimation }>("./patterns/*/animation.ts", { eager: true });
const quizzes = import.meta.glob<{ default: PatternQuiz }>("./patterns/*/quiz.ts", { eager: true });
const slugOf = (k: string) => k.split("/")[2];
const byKey = <T>(m: Record<string, { default: T }>) => new Map(Object.entries(m).map(([k, v]) => [slugOf(k), v.default]));
const L = byKey(lessons), A = byKey(anims), Q = byKey(quizzes);

/** Portrait diagrams must be narrow enough that phone text stays readable (~0.95× at 390 px). */
const MAX_PORTRAIT_WIDTH = 360;
const ID_RE = /^[A-Za-z][\w-]*$/;

function idsIn(a: Action): string[] {
  if ("show" in a) return a.show;
  if ("hide" in a) return a.hide;
  if ("dim" in a) return a.dim;
  if ("spawn" in a) return [...a.spawn, a.from];
  if ("members" in a) return [a.members];
  if ("call" in a) return [...a.call, ...(a.back ?? [])];
  if ("ring" in a) return a.ring ? [a.ring] : [];
  if ("pulse" in a) return [a.pulse];
  if ("flash" in a) return [a.flash];
  if ("shake" in a) return [a.shake];
  if ("cross" in a) return [a.cross];
  if ("tag" in a) return [a.tag];
  if ("mark" in a) return [a.mark];
  return [];
}

const overlap = (a: Rect, b: Rect, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;

function segHitsRect(p: [number, number], q: [number, number], r: Rect): boolean {
  // Liang–Barsky clip of segment against rect shrunk by 3 px
  const x0 = r.x + 3, y0 = r.y + 3, x1 = r.x + r.w - 3, y1 = r.y + r.h - 3;
  if (x1 <= x0 || y1 <= y0) return false;
  let t0 = 0, t1 = 1;
  const dx = q[0] - p[0], dy = q[1] - p[1];
  const test = (pp: number, qq: number) => {
    if (pp === 0) return qq >= 0;
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
    return true;
  };
  return test(-dx, p[0] - x0) && test(dx, x1 - p[0]) && test(-dy, p[1] - y0) && test(dy, y1 - p[1]) && t0 < t1;
}

/** Checks one diagram plus the actions that will play on it. */
export function checkDiagram(P: Problems, where: string, spec: DiagramSpec, lists: Action[][], opts: { needPortrait: boolean }) {
  const nodeIds = new Set(spec.nodes.map((n) => n.id));
  const edgeIds = new Set(spec.edges.map((e) => e.id));
  const badgeIds = new Set((spec.badges ?? []).map((b) => b.id));
  const all = [...spec.nodes.map((n) => n.id), ...spec.edges.map((e) => e.id), ...(spec.badges ?? []).map((b) => b.id)];
  const dup = all.filter((id, i) => all.indexOf(id) !== i);
  P.check(!dup.length, `${where}: duplicate ids ${dup.join(", ")}`);
  for (const id of all) P.check(ID_RE.test(id), `${where}: bad id "${id}" (letters, digits, - and _ only)`);
  P.check(!!spec.label && spec.label.length > 20, `${where}: needs a one-sentence "label" for screen readers`);
  for (const e of spec.edges) {
    P.check(nodeIds.has(e.from), `${where}: edge ${e.id} from unknown node ${e.from}`);
    P.check(nodeIds.has(e.to), `${where}: edge ${e.id} to unknown node ${e.to}`);
  }
  for (const b of spec.badges ?? []) P.check(nodeIds.has(b.near), `${where}: badge ${b.id} near unknown node ${b.near}`);

  // actions refer to real things
  lists.forEach((list, li) => list.forEach((a, ai) => {
    const at = `${where} actions[${li}][${ai}]`;
    for (const id of idsIn(a)) {
      const base = id.endsWith("__x") ? id.slice(0, -3) : id;
      const okId = nodeIds.has(base) || edgeIds.has(id) || badgeIds.has(id);
      P.check(okId, `${at}: unknown id "${id}"`);
    }
    if ("call" in a) {
      P.check(a.call.length >= 2, `${at}: call needs at least 2 nodes`);
      for (const id of [...a.call, ...(a.back ?? [])]) P.check(nodeIds.has(id), `${at}: call through "${id}", which is not a node`);
      P.check(textWidth.pill(a.label) < 330, `${at}: call label too long ("${a.label}")`);
      if (a.result) P.check(textWidth.pill(a.result) < 330, `${at}: result too long ("${a.result}")`);
    }
    if ("members" in a && a.scalaLines) P.check(a.scalaLines.length === a.lines.length, `${at}: scalaLines must match lines`);
    for (const k of ["show", "hide", "dim", "spawn"] as const) {
      if (k in a) P.check(((a as Record<string, unknown>)[k] as string[]).length > 0, `${at}: empty ${k}`);
    }
  }));

  // layout checks in both orientations
  const sets = memberSets(spec, lists);
  const layouts: boolean[] = [false];
  if (opts.needPortrait) {
    P.check(!!spec.portraitWidth && !!spec.portraitHeight, `${where}: needs portraitWidth / portraitHeight (phone layout)`);
    P.check((spec.portraitWidth ?? 0) <= MAX_PORTRAIT_WIDTH, `${where}: portraitWidth ${spec.portraitWidth} > ${MAX_PORTRAIT_WIDTH} (phone text would be too small)`);
    for (const n of spec.nodes) P.check(!!n.portrait, `${where}: node ${n.id} has no portrait position`);
    if (spec.portraitWidth && spec.nodes.every((n) => n.portrait)) layouts.push(true);
  }
  for (const portrait of layouts) {
    const tag = `${where} [${portrait ? "portrait" : "landscape"}]`;
    const g = buildGeometry(spec, lists, portrait);
    const W = g.width, H = g.height;
    const captions = lists.flat().filter((a): a is Extract<Action, { ring: string | null }> => "ring" in a);
    for (const n of spec.nodes) {
      const r = g.rects.get(n.id)!;
      P.check(r.x >= 2 && r.y >= 2 && r.x + r.w <= W - 2 && r.y + r.h <= H - 2, `${tag}: node ${n.id} (${r.x},${r.y},${r.w}x${r.h}) is outside the ${W}x${H} viewBox`);
      const ringed = captions.some((c) => c.ring === n.id);
      if (ringed) {
        P.check(r.x - 6 >= 0 && r.x + r.w + 6 <= W && r.y - 6 >= 0, `${tag}: the ring around ${n.id} would be cut off`);
        if (captions.some((c) => c.ring === n.id && c.caption)) P.check(r.y + r.h + 26 <= H, `${tag}: ring caption under ${n.id} is cut off`);
      }
      const name = textWidth.name(n.name);
      P.check(name <= r.w - 8, `${tag}: name "${n.name}" (~${Math.round(name)}px) does not fit in ${n.id} (w ${r.w})`);
      for (const s of sets.get(n.id) ?? []) {
        for (const line of [...s.lines, ...(s.scala ?? [])]) {
          const w = textWidth.member(line);
          P.check(w <= r.w - 14, `${tag}: member "${line}" (~${Math.round(w)}px) does not fit in ${n.id} (w ${r.w})`);
        }
      }
      if (n.at.h) P.check(n.at.h >= (maxLines(sets.get(n.id)) ? 40 : 30), `${tag}: ${n.id} explicit height too small`);
    }
    for (let i = 0; i < spec.nodes.length; i++) {
      for (let j = i + 1; j < spec.nodes.length; j++) {
        const a = g.rects.get(spec.nodes[i].id)!, b = g.rects.get(spec.nodes[j].id)!;
        P.check(!overlap(a, b, 6), `${tag}: nodes ${spec.nodes[i].id} and ${spec.nodes[j].id} overlap or are closer than 6px`);
      }
    }
    for (const b of spec.badges ?? []) {
      const r = badgeRect(b, g.rects.get(b.near)!);
      P.check(r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H, `${tag}: badge ${b.id} is outside the viewBox`);
    }
    for (const e of spec.edges) {
      const route = g.edges.get(e.id);
      if (!route) continue;
      for (const p of route.points) P.check(p[0] >= 0 && p[1] >= 0 && p[0] <= W && p[1] <= H, `${tag}: edge ${e.id} leaves the viewBox`);
      for (const n of spec.nodes) {
        if (n.id === e.from || n.id === e.to) continue;
        const r = g.rects.get(n.id)!;
        for (let k = 0; k < route.points.length - 1; k++) {
          if (segHitsRect(route.points[k], route.points[k + 1], r)) {
            P.add(`${tag}: edge ${e.id} (${e.from}→${e.to}) crosses node ${n.id}; move boxes or add "via" points`);
            break;
          }
        }
      }
    }
  }
}

function checkStory(P: Problems, slug: string, story: Story, lesson: PatternLesson) {
  const where = `${slug} story`;
  checkDiagram(P, where, story.diagram, story.steps.map((s) => s.actions), { needPortrait: true });
  P.check(story.steps.length >= 5 && story.steps.length <= 10, `${where}: ${story.steps.length} steps (aim for 6–9)`);
  P.check(story.steps[0]?.code === "problem", `${where}: step 1 should show the problem code`);
  story.steps.forEach((s, i) => {
    const at = `${where} step ${i + 1}`;
    P.check(s.title.length > 5 && s.title.length <= 70, `${at}: title length`);
    P.check(s.what.length > 20, `${at}: "what" too short`);
    P.check(s.why.length > 20, `${at}: "why" too short`);
    P.check(s.actions.length > 0, `${at}: no actions (every step should move something on stage)`);
    const code = s.code === "problem" ? lesson.problem.code : lesson.code;
    for (const lang of ["python", "scala"] as const) {
      const lines = code[lang].replace(/\s+$/, "").split("\n");
      const hl = s.lines[lang];
      P.check(hl.length > 0, `${at}: no highlighted ${lang} lines`);
      for (const n of hl) {
        P.check(Number.isInteger(n) && n >= 1 && n <= lines.length, `${at}: ${lang} line ${n} is outside ${s.code} (${lines.length} lines)`);
        if (n >= 1 && n <= lines.length) P.check(lines[n - 1].trim() !== "", `${at}: ${lang} line ${n} is blank`);
      }
    }
  });
}

function checkQuiz(P: Problems, slug: string, quiz: PatternQuiz) {
  const where = `${slug} quiz`;
  P.check(quiz.slug === slug, `${where}: slug mismatch`);
  P.check(quiz.questions.length >= 6, `${where}: ${quiz.questions.length} questions (need 6, one of each type)`);
  const types = new Set(quiz.questions.map((q) => q.type));
  for (const t of ["mcq", "bug", "order", "diagram"]) P.check(types.has(t as never), `${where}: no "${t}" question`);
  const tags = new Set(quiz.questions.map((q) => q.tag));
  for (const t of ["Concept", "Find the problem", "Which pattern?", "Scenario", "Put in order", "Read the diagram"]) P.check(tags.has(t), `${where}: no "${t}" question`);
  quiz.questions.forEach((q, i) => {
    const at = `${where} q${i + 1}`;
    P.check(q.hint.length > 10 && q.explain.length > 30, `${at}: hint / explain too short`);
    if (q.type === "mcq") {
      P.check(q.options.length >= 3 && q.options.length <= 4, `${at}: 3–4 options`);
      P.check(q.answer >= 0 && q.answer < q.options.length, `${at}: answer index`);
      P.check(new Set(q.options).size === q.options.length, `${at}: duplicate options`);
    } else if (q.type === "bug") {
      const lines = q.code.text.split("\n");
      P.check(q.answer >= 1 && q.answer <= lines.length && !!lines[q.answer - 1]?.trim(), `${at}: answer line must be a non-blank line of the code`);
    } else if (q.type === "order") {
      const sorted = [...q.shuffled].sort((a, b) => a - b);
      P.check(JSON.stringify(sorted) === JSON.stringify(q.steps.map((_, k) => k)), `${at}: shuffled must be a permutation of the steps`);
      P.check(q.shuffled.some((s, k) => s !== k), `${at}: shuffled is already in the right order`);
      P.check(q.steps.length >= 3 && q.steps.length <= 6, `${at}: 3–6 steps`);
    } else if (q.type === "diagram") {
      P.check(q.options.length === 3, `${at}: exactly 3 diagrams`);
      P.check(q.answer >= 0 && q.answer < 3, `${at}: answer index`);
      q.options.forEach((d, k) => checkDiagram(P, `${at} diagram ${"ABC"[k]}`, d, [], { needPortrait: false }));
    }
  });
  const ids = quiz.cards.map((c) => c.id);
  P.check(quiz.cards.length >= 5, `${where}: ${quiz.cards.length} flashcards (need at least 5)`);
  P.check(new Set(ids).size === ids.length, `${where}: duplicate flashcard ids`);
}

function checkPattern(slug: string) {
  const P = new Problems();
  const lesson = L.get(slug);
  const anim = A.get(slug);
  const quiz = Q.get(slug);
  P.check(!!lesson, `${slug}: lesson.ts missing`);
  if (!lesson) P.throwIfAny(slug);
  P.check(lesson!.slug === slug, `${slug}: lesson slug mismatch`);
  P.check(lesson!.examples.length === 4, `${slug}: needs 4 examples`);
  P.check(!!anim, `${slug}: animation.ts missing`);
  P.check(!!quiz, `${slug}: quiz.ts missing`);
  if (anim && lesson) {
    P.check(anim.slug === slug, `${slug}: animation slug mismatch`);
    checkStory(P, slug, anim.story, lesson);
    const exIds = lesson.examples.map((e) => e.id).sort();
    P.check(JSON.stringify(Object.keys(anim.examples).sort()) === JSON.stringify(exIds), `${slug}: animation examples ${Object.keys(anim.examples).join(",")} must match lesson examples ${exIds.join(",")}`);
    for (const ex of lesson.examples) {
      const ea = anim.examples[ex.id];
      if (!ea) continue;
      const where = `${slug} example ${ex.id}`;
      P.check(ea.walk.length === ex.walkthrough.length, `${where}: walk has ${ea.walk.length} steps, walkthrough has ${ex.walkthrough.length} sentences`);
      ea.walk.forEach((w, i) => P.check(w.length > 0, `${where}: walk step ${i + 1} has no actions`));
      const lists = [...ea.walk];
      if ("groups" in ea.tryIt) {
        const t = ea.tryIt;
        lists.push(...Object.values(t.results).map((r) => r.actions));
        P.check(t.groups.length >= 1 && t.groups.length <= 2, `${where}: Try it needs 1 or 2 groups`);
        let keys: string[] = [""];
        for (const g of t.groups) {
          P.check(g.options.length >= 2 && g.options.length <= 4, `${where}: group "${g.label}" needs 2–4 options`);
          keys = keys.flatMap((k) => g.options.map((o) => (k ? k + "|" : "") + o.id));
        }
        for (const k of keys) {
          const r = t.results[k];
          P.check(!!r, `${where}: Try it has no result for "${k}"`);
          if (r) {
            P.check(!!r.output && r.output.length <= 40, `${where}: result "${k}" output must be short (≤ 40 chars)`);
            P.check(r.actions.length > 0, `${where}: result "${k}" plays nothing`);
          }
        }
        for (const k of Object.keys(t.results)) P.check(keys.includes(k), `${where}: unexpected result key "${k}"`);
      }
      checkDiagram(P, where, ea.diagram, lists, { needPortrait: true });
    }
    const seq = anim.sequence;
    const pids = new Set(seq.participants.map((p) => p.id));
    P.check(seq.participants.length >= 2 && seq.participants.length <= 6, `${slug} sequence: 2–6 participants`);
    P.check(seq.messages.length >= 3 && seq.messages.length <= 14, `${slug} sequence: 3–14 messages`);
    for (const m of seq.messages) P.check(pids.has(m.from) && pids.has(m.to), `${slug} sequence: message "${m.label}" uses unknown participant`);
  }
  if (quiz) checkQuiz(P, slug, quiz);
  P.throwIfAny(slug);
}

export const tests: Record<string, () => void> = {};
for (const p of ALL_PATTERNS) {
  if (L.has(p.slug)) tests[`content: ${p.slug}`] = () => checkPattern(p.slug);
}

import { RELATIONSHIPS, relActions, relDiagram } from "./uml/relationships";
tests["content: UML relationships lesson"] = () => {
  const P = new Problems();
  for (const r of RELATIONSHIPS) {
    checkDiagram(P, `uml ${r.id}`, relDiagram(r), [relActions(r)], { needPortrait: true });
    for (const lang of ["python", "scala"] as const) {
      const n = r.code[lang].split("\n").length;
      for (const l of r.hl[lang]) P.check(l >= 1 && l <= n, `uml ${r.id}: ${lang} line ${l} out of range`);
    }
  }
  P.throwIfAny("uml");
};
