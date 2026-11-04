/**
 * Checks for UML Basics lessons, the notation lab, and the SOLID / anti-pattern guides. Code is read with
 * tree-sitter, never run. Diagrams: class diagrams must match their code where the code defines the classes and
 * draw cleanly; flow diagrams (state / activity / use case) must fit a phone, keep boxes apart and keep lines out of
 * other boxes; scene steps may only name elements that exist.
 */
import { ALL_PATTERNS } from "../patterns";
import type { FlowSpec, Guide, NotationSymbol, UmlLesson, Visual } from "./types";
import { UML_LESSONS } from "./load";
import { edgePoints, flowRect } from "../../anim/FlowDiagram";
import { readCode } from "../../review/index";
import { codeToUml } from "../../review/uml";
import { Problems } from "../../test/expect";
import { between, checkCode, checkLayout, checkQuestions, checkSequence } from "../../test/contentChecks";

const lessons = import.meta.glob<{ default: UmlLesson }>("../uml/lessons/*.ts", { eager: true });
const notation = import.meta.glob<{ default: NotationSymbol[] }>("../uml/notation.ts", { eager: true });
const solid = import.meta.glob<{ default: Guide }>("../solid/*.ts", { eager: true });
const anti = import.meta.glob<{ default: Guide }>("../anti/*.ts", { eager: true });
const fileId = (k: string) => k.split("/").pop()!.replace(/\.ts$/, "");

function checkFlow(P: Problems, where: string, f: FlowSpec) {
  P.check(f.width <= 360, `${where}: flow diagram is ${f.width} wide (max 360, so it stays readable on phones)`);
  P.check(f.label.length > 10, `${where}: label for screen readers missing`);
  const ids = new Set<string>();
  for (const n of f.nodes) {
    P.check(!ids.has(n.id), `${where}: duplicate id ${n.id}`); ids.add(n.id);
    const r = flowRect(n);
    P.check(r.x >= 0 && r.y >= 0 && r.x + r.w <= f.width + 0.5 && r.y + r.h <= f.height + 0.5, `${where}: ${n.id} is outside the ${f.width}×${f.height} diagram`);
  }
  for (const e of f.edges) { P.check(!ids.has(e.id), `${where}: duplicate id ${e.id}`); ids.add(e.id); }
  const solid = f.nodes.filter((n) => n.kind !== "boundary");
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
    const a = flowRect(solid[i]), b = flowRect(solid[j]);
    if (a.x < b.x + b.w + 4 && b.x < a.x + a.w + 4 && a.y < b.y + b.h + 4 && b.y < a.y + a.h + 4) P.add(`${where}: ${solid[i].id} and ${solid[j].id} overlap or touch`);
  }
  for (const e of f.edges) {
    P.check(f.nodes.some((n) => n.id === e.from) && f.nodes.some((n) => n.id === e.to), `${where}: edge ${e.id} uses an unknown node`);
    const pts = edgePoints(f, e);
    for (let k = 0; k + 1 < pts.length; k++) {
      const [p, q] = [pts[k], pts[k + 1]];
      for (const n of solid) {
        if (n.id === e.from || n.id === e.to) continue;
        const r = flowRect(n);
        // sample the segment
        for (let t = 0.05; t < 1; t += 0.05) {
          const x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
          if (x > r.x + 2 && x < r.x + r.w - 2 && y > r.y + 2 && y < r.y + r.h - 2) { P.add(`${where}: edge ${e.id} passes through ${n.id}`); break; }
        }
      }
    }
  }
}

function visualIds(v: Visual): Set<string> {
  if (v.kind === "class") return new Set([...v.uml.classes.map((c) => c.name), ...v.uml.relations.map((r) => `${r.from}>${r.to}`)]);
  if (v.kind === "sequence") return new Set([...v.spec.participants.map((p) => p.id), ...v.spec.messages.map((_, i) => `m${i + 1}`)]);
  return new Set([...v.spec.nodes.map((n) => n.id), ...v.spec.edges.map((e) => e.id)]);
}

async function checkLesson(key: string, l: UmlLesson) {
  const P = new Problems();
  const meta = UML_LESSONS.find((m) => m.id === l.id);
  P.check(l.id === fileId(key), `${l.id}: id must match the file name ${fileId(key)}`);
  P.check(!!meta && meta.order === l.order && meta.title === l.title, `${l.id}: order / title must match UML_LESSONS in src/content/guides/load.ts`);
  P.check(l.lede.length > 40, `${l.id}: lede too short`);
  P.check(l.id === "quiz" ? l.concepts.length === 0 : between(l.concepts.length, 3, 8), `${l.id}: 3–8 concepts (quiz lesson: none)`);
  const cids = new Set<string>();
  for (const c of l.concepts) {
    const at = `${l.id} / ${c.id}`;
    P.check(!cids.has(c.id), `${at}: duplicate concept id`); cids.add(c.id);
    P.check(c.short.length <= 60 && c.what.length > 40 && c.spot.length > 30 && c.when.length > 30, `${at}: short (≤60) / what / spot / when`);
    P.check(between(c.scene.length, 2, 5), `${at}: 2–5 scene steps`);
    const ids = visualIds(c.visual);
    for (const s of c.scene) {
      P.check(s.say.length > 15, `${at}: a scene step needs a sentence`);
      for (const id of s.show) P.check(ids.has(id), `${at}: scene shows "${id}", which is not in the diagram (have: ${[...ids].join(", ")})`);
    }
    if (c.visual.kind === "class") checkLayout(P, `${at} diagram`, c.visual.uml);
    if (c.visual.kind === "sequence") checkSequence(P, `${at} sequence`, c.visual.spec, 2, 10);
    if (c.visual.kind === "flow") checkFlow(P, `${at} flow`, c.visual.spec);
    await checkCode(P, at, c.code);
    for (const lang of ["python", "scala"] as const) {
      const n = c.code[lang].split("\n").length;
      for (const h of c.hl?.[lang] ?? []) P.check(h >= 1 && h <= n, `${at} (${lang}): highlighted line ${h} out of range`);
    }
  }
  if (l.draw) {
    await checkCode(P, `${l.id} draw`, l.draw.code);
    const m = codeToUml(await readCode(l.draw.code.python, "python"));
    P.check(between(m.classes.length, 3, 7) && m.relations.length >= 2, `${l.id} draw: the code should imply 3–7 classes and at least 2 relationships (has ${m.classes.length} / ${m.relations.length})`);
  }
  checkQuestions(P, `${l.id} practice`, l.practice, 5, 10);
  P.throwIfAny(l.id);
}

async function checkGuide(key: string, g: Guide, section: "solid" | "anti") {
  const P = new Problems();
  const at = `${section}/${g.id}`;
  P.check(g.section === section && g.id === fileId(key), `${at}: section / id must match the folder and file name`);
  P.check(g.short.length > 10 && g.short.length <= 110 && g.lede.length > 40, `${at}: short (≤110) / lede`);
  P.check(g.blocks.length >= 4, `${at}: at least 4 blocks`);
  P.check(g.blocks.some((b) => b.type === "compare" || b.type === "code"), `${at}: needs code (a compare or code block)`);
  for (const [i, b] of g.blocks.entries()) {
    const w = `${at} block ${i + 1}`;
    if (b.type === "code") await checkCode(P, w, b.code);
    if (b.type === "diagram") checkLayout(P, w, b.uml);
    if (b.type === "compare") {
      for (const k of ["before", "after"] as const) await checkCode(P, `${w} ${k}`, b[k].code, b[k].uml);
      for (const k of ["before", "after"] as const) if (b[k].uml) checkLayout(P, `${w} ${k}`, b[k].uml!);
    }
    if (b.type === "patterns") for (const p of b.items) P.check(ALL_PATTERNS.some((x) => x.slug === p.slug), `${w}: unknown pattern ${p.slug}`);
  }
  checkQuestions(P, `${at} quiz`, g.quiz, 4, 6);
  P.throwIfAny(at);
}

export const tests: Record<string, () => Promise<void> | void> = {};
for (const [k, m] of Object.entries(lessons)) tests[`guides: uml ${fileId(k)}`] = () => checkLesson(k, m.default);
for (const [k, m] of Object.entries(solid)) tests[`guides: solid ${fileId(k)}`] = () => checkGuide(k, m.default, "solid");
for (const [k, m] of Object.entries(anti)) tests[`guides: anti ${fileId(k)}`] = () => checkGuide(k, m.default, "anti");
for (const [, m] of Object.entries(notation)) tests["guides: notation lab"] = async () => {
  const P = new Problems();
  const list = m.default;
  P.check(list.length >= 30, `notation: ${list.length} symbols (want at least 30)`);
  const ids = new Set(list.map((s) => s.id));
  P.check(ids.size === list.length, "notation: duplicate ids");
  for (const g of new Set(list.map((s) => s.group))) P.check(list.filter((s) => s.group === g).length >= 3, `notation: group ${g} needs at least 3 symbols`);
  for (const s of list) {
    P.check(/^(rel:(association|dependency|aggregation|composition|inheritance|realization)|text:.+|box:(interface|abstract|concrete|singleton|enum)|flow:(initial|final|state|action|decision|merge|fork|join|actor|usecase|boundary|note|object))$/.test(s.glyph), `notation ${s.id}: bad glyph "${s.glyph}"`);
    P.check(s.meaning.length > 30, `notation ${s.id}: meaning too short`);
    if (s.code) for (const lang of ["python", "scala"] as const) {
      const r = await readCode(s.code[lang], lang);
      P.check(!r.errorLines.length, `notation ${s.id} (${lang}): code doesn't parse (line ${r.errorLines[0]})`);
    }
  }
  P.throwIfAny("notation");
};
tests["guides: every UML lesson is written"] = () => {
  const have = new Set(Object.keys(lessons).map(fileId));
  const missing = UML_LESSONS.filter((l) => l.id !== "relationships" && !have.has(l.id)).map((l) => l.id);
  if (Object.keys(lessons).length && missing.length) throw new Error(`missing: ${missing.join(", ")}`);
};
