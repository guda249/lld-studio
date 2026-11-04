/**
 * Review engine tests: every pattern's own lesson code must be recognised cleanly (main.py / main.scala),
 * the "before" code must not be (problem.py / problem.scala), and each pattern's hand-written cases must
 * produce the expected findings.
 */
import type { PatternLesson } from "../content/types";
import { review, RULES } from "./index";
import type { ReviewCase } from "./cases";
import { Problems } from "../test/expect";

const lessons = import.meta.glob<{ default: PatternLesson }>("../content/patterns/*/lesson.ts", { eager: true });
const caseFiles = import.meta.glob<{ default: ReviewCase[] }>("./rules/*.cases.ts", { eager: true });
const slugOf = (k: string) => k.split("/").slice(-2, -1)[0];
const casesFor = (slug: string) => Object.entries(caseFiles).find(([k]) => k.endsWith(`/${slug}.cases.ts`))?.[1].default ?? [];

async function checkPattern(slug: string) {
  const P = new Problems();
  const lesson = Object.entries(lessons).find(([k]) => slugOf(k) === slug)?.[1].default;
  if (!lesson) throw new Error(`no lesson for ${slug}`);
  for (const lang of ["python", "scala"] as const) {
    const good = await review({ slug, lang, code: lesson.code[lang] });
    P.check(good.patternFound, `${slug} main.${lang === "python" ? "py" : "scala"}: pattern not recognised (${good.summary})`);
    const bad = good.findings.filter((f) => f.sev === "fail" || (f.sev === "warn" && f.id.startsWith(slug + ".")));
    P.check(!bad.length, `${slug} main.${lang === "python" ? "py" : "scala"}: unexpected ${bad.map((f) => `${f.id} (${f.title})`).join("; ")}`);
    P.check(!good.findings.some((f) => f.id === "general.unreadable"), `${slug} main.${lang}: tree-sitter could not read lines ${good.findings.find((f) => f.id === "general.unreadable")?.text}`);
    const before = await review({ slug, lang, code: lesson.problem.code[lang] });
    P.check(!before.patternFound || before.findings.some((f) => (f.sev === "warn" || f.sev === "fail") && f.id.startsWith(slug + ".")),
      `${slug} problem.${lang}: the "before" code passed as the pattern with no complaints`);
  }
  const cases = casesFor(slug);
  P.check(cases.length >= 4, `${slug}: needs at least 4 review cases in src/review/rules/${slug}.cases.ts (has ${cases.length})`);
  for (const c of cases) {
    const r = await review({ slug, lang: c.lang, code: c.code, diagram: c.diagram });
    const ids = new Set(r.findings.map((f) => f.id));
    P.check(r.patternFound === c.expect.found, `${slug} case "${c.name}": expected found=${c.expect.found}, got ${r.patternFound}`);
    for (const id of c.expect.ids ?? []) P.check(ids.has(id), `${slug} case "${c.name}": missing finding ${id}; got ${[...ids].join(", ")}`);
    for (const id of c.expect.none ?? []) P.check(!ids.has(id), `${slug} case "${c.name}": should not report ${id}`);
  }
  P.throwIfAny(slug);
}

export const tests: Record<string, () => Promise<void>> = {};
for (const slug of Object.keys(RULES)) tests[`review: ${slug}`] = () => checkPattern(slug);
