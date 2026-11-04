/**
 * Checks for the Phase 6 extras (comparisons, case studies, katas). Code is read with tree-sitter, never run:
 *  - every file parses cleanly, Python prints, Scala has an @main entry point;
 *  - each class diagram's classes and relationships really are in the code (same check as the scratch pad);
 *  - each comparison side is recognised as its pattern by the review engine (when the pattern has rules);
 *  - each kata's starter is NOT passed as the pattern, and its solution is, with no problems.
 */
import { ALL_PATTERNS, PATTERNS } from "../patterns";
import type { CaseStudy, Comparison, Kata } from "./types";
import { review, RULES } from "../../review/index";
import { Problems } from "../../test/expect";
import { between, checkCode, checkQuestions, checkSequence, checkSketch } from "../../test/contentChecks";

const comparisons = import.meta.glob<{ default: Comparison }>("../compare/*/comparison.ts", { eager: true });
const cases = import.meta.glob<{ default: CaseStudy }>("../cases/*/case.ts", { eager: true });
const katas = import.meta.glob<{ default: Kata }>("../katas/*/kata.ts", { eager: true });
const folder = (k: string) => k.split("/").slice(-2, -1)[0];
const isPattern = (s: string) => ALL_PATTERNS.some((p) => p.slug === s);
async function checkComparison(key: string, c: Comparison) {
  const P = new Problems();
  P.check(c.id === folder(key), `${c.id}: id must match its folder ${folder(key)}`);
  P.check(between(c.sides.length, 2, 3), `${c.id}: 2–3 sides`);
  P.check(c.id === c.sides.map((x) => x.slug).join("-vs-"), `${c.id}: id must be the side slugs joined by "-vs-" (pattern pages link to it)`);
  P.check(c.tagline.length > 20 && c.scenario.length > 40 && c.decidingQuestion.endsWith("?"), `${c.id}: tagline / scenario / deciding question`);
  P.check(between(c.table.length, 4, 7), `${c.id}: 4–7 table rows`);
  for (const row of c.table) P.check(row.values.length === c.sides.length, `${c.id}: table row "${row.aspect}" needs one value per side`);
  P.check(between(c.mixups.length, 2, 4), `${c.id}: 2–4 mix-ups`);
  for (const s of c.sides) {
    const at = `${c.id} / ${s.slug}`;
    P.check(isPattern(s.slug), `${at}: unknown pattern slug`);
    P.check(between(s.howItWorks.length, 2, 4) && between(s.pickWhen.length, 2, 3), `${at}: 2–4 howItWorks, 2–3 pickWhen`);
    checkSketch(P, at, s.uml, 2, 7);
    await checkCode(P, at, s.code, s.uml);
    if (RULES[s.slug]) {
      for (const lang of ["python", "scala"] as const) {
        const r = await review({ slug: s.slug, lang, code: s.code[lang] });
        P.check(r.patternFound, `${at} (${lang}): the review doesn't recognise this as ${s.slug}: ${r.summary}`);
        const bad = r.findings.filter((f) => f.sev === "fail");
        P.check(!bad.length, `${at} (${lang}): review problems: ${bad.map((f) => f.title).join("; ")}`);
      }
    }
  }
  checkQuestions(P, `${c.id} quiz`, c.quiz, 4, 5);
  P.check(c.quiz.some((q) => q.tag === "Which pattern?"), `${c.id} quiz: include a "Which pattern?" scenario question`);
  P.throwIfAny(c.id);
}

async function checkCase(key: string, c: CaseStudy) {
  const P = new Problems();
  P.check(c.slug === folder(key), `${c.slug}: slug must match its folder ${folder(key)}`);
  P.check(c.prompt.length > 40 && c.tagline.length > 10, `${c.slug}: prompt / tagline`);
  P.check(between(c.clarify.length, 4, 6), `${c.slug}: 4–6 clarifying questions`);
  P.check(c.requirements.functional.length >= 4 && c.requirements.nonFunctional.length >= 2 && c.requirements.outOfScope.length >= 1, `${c.slug}: requirements`);
  P.check(between(c.entities.length, 5, 10), `${c.slug}: 5–10 entities`);
  checkSketch(P, `${c.slug} diagram`, c.uml, 6, 12);
  for (const e of c.entities) P.check(c.uml.classes.some((k) => k.name === e.name), `${c.slug}: entity ${e.name} is not in the class diagram`);
  checkSequence(P, `${c.slug} flow`, c.flow.sequence, 4, 10);
  if (c.states) {
    const st = new Set(c.states.states);
    P.check(st.size >= 3, `${c.slug} states: at least 3 states`);
    for (const t of c.states.transitions) P.check(st.has(t.from) && st.has(t.to), `${c.slug} states: transition ${t.from} → ${t.to} uses an unknown state`);
  }
  P.check(between(c.patterns.length, 2, 5), `${c.slug}: 2–5 patterns`);
  for (const p of c.patterns) P.check(isPattern(p.slug), `${c.slug}: unknown pattern ${p.slug}`);
  await checkCode(P, c.slug, c.code, c.uml);
  for (const lang of ["python", "scala"] as const) {
    const n = c.code[lang].split("\n").length;
    P.check(between(n, 100, 320), `${c.slug} (${lang}): ${n} lines (want 120–260)`);
  }
  P.check(between(c.tradeoffs.length, 3, 5) && between(c.followUps.length, 4, 6) && between(c.extend.length, 3, 4), `${c.slug}: trade-offs 3–5, follow-ups 4–6, extend 3–4`);
  checkQuestions(P, `${c.slug} quiz`, c.quiz, 3, 4);
  P.throwIfAny(c.slug);
}

async function checkKata(key: string, k: Kata) {
  const P = new Problems();
  P.check(k.id === folder(key), `${k.id}: id must match its folder ${folder(key)}`);
  P.check(!!RULES[k.slug], `${k.id}: ${k.slug} has no review rules`);
  P.check(between(k.goals.length, 3, 5) && k.hints.length === 3 && k.task.length > 30, `${k.id}: task, 3–5 goals, 3 hints`);
  await checkCode(P, `${k.id} starter`, k.starter);
  await checkCode(P, `${k.id} solution`, k.solution);
  if (RULES[k.slug]) {
    for (const lang of ["python", "scala"] as const) {
      const before = await review({ slug: k.slug, lang, code: k.starter[lang] });
      P.check(!before.patternFound || before.findings.some((f) => (f.sev === "warn" || f.sev === "fail") && f.id.startsWith(k.slug + ".")),
        `${k.id} starter (${lang}): the review already passes the starter as ${k.slug}`);
      const after = await review({ slug: k.slug, lang, code: k.solution[lang] });
      P.check(after.patternFound, `${k.id} solution (${lang}): not recognised as ${k.slug}: ${after.summary}`);
      const bad = after.findings.filter((f) => f.sev === "fail" || (f.sev === "warn" && f.id.startsWith(k.slug + ".")));
      P.check(!bad.length, `${k.id} solution (${lang}): ${bad.map((f) => `${f.id} (${f.title})`).join("; ")}`);
    }
  }
  P.throwIfAny(k.id);
}

export const tests: Record<string, () => Promise<void>> = {};
for (const [k, m] of Object.entries(comparisons)) tests[`extras: compare ${folder(k)}`] = () => checkComparison(k, m.default);
for (const [k, m] of Object.entries(cases)) tests[`extras: case ${folder(k)}`] = () => checkCase(k, m.default);
for (const [k, m] of Object.entries(katas)) tests[`extras: kata ${folder(k)}`] = () => checkKata(k, m.default);
tests["extras: every GoF pattern has a kata"] = async () => {
  const have = new Set(Object.values(katas).map((m) => m.default.slug));
  const missing = PATTERNS.filter((p) => !have.has(p.slug)).map((p) => p.slug);
  if (Object.keys(katas).length && missing.length) throw new Error(`no kata yet for: ${missing.join(", ")}`);
};
