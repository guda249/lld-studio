/** Content checks shared by the extras and guides tests (code read with tree-sitter, never run). */
import type { Question, SequenceSpec } from "../anim/types";
import type { CodePair } from "../content/types";
import type { UmlSketch } from "../content/extras/types";
import { sketchToUml } from "../content/extras/load";
import { readCode } from "../review/index";
import { compareUml, umlToDiagram } from "../review/uml";
import { layoutProblems } from "../review/layoutCheck";
import type { Problems } from "./expect";

export const BAD_UML = new Set(["uml.class-not-in-code", "uml.kind", "uml.rel-not-in-code", "uml.rel-type"]);
export const between = (n: number, lo: number, hi: number) => n >= lo && n <= hi;

export async function checkCode(P: Problems, where: string, code: CodePair, sketch?: UmlSketch) {
  for (const lang of ["python", "scala"] as const) {
    const text = code[lang] ?? "";
    const at = `${where} (${lang})`;
    P.check(text.trim().length > 0, `${at}: code missing`);
    if (lang === "python") P.check(/\bprint\(/.test(text), `${at}: Python demo must print something`);
    else P.check(/@main\s+def\s+\w+\(\)/.test(text), `${at}: Scala needs @main def …(): Unit =`);
    P.check(!/\t/.test(text), `${at}: use spaces, not tabs`);
    const m = await readCode(text, lang);
    P.check(!m.errorLines.length, `${at}: tree-sitter could not read line(s) ${m.errorLines.slice(0, 5).join(", ")}`);
    if (sketch) {
      const bad = compareUml(sketchToUml(sketch), m).filter((f) => BAD_UML.has(f.id));
      for (const f of bad) P.add(`${at}: diagram vs code: ${f.title}. ${f.text}`);
    }
  }
}

/** The drawn diagram: no line through a box it doesn't connect, no two unrelated lines on top of each other. */
export function checkLayout(P: Problems, where: string, s: UmlSketch) {
  const spec = umlToDiagram(sketchToUml(s));
  for (const f of layoutProblems(spec, false)) P.add(`${where} wide diagram: ${f}`);
  if (spec.portraitWidth) for (const f of layoutProblems(spec, true)) P.add(`${where} phone diagram: ${f}`);
}

export function checkSketch(P: Problems, where: string, s: UmlSketch, min: number, max: number) {
  checkLayout(P, where, s);
  P.check(between(s.classes.length, min, max), `${where}: ${s.classes.length} classes in the diagram (want ${min}–${max})`);
  const names = new Set(s.classes.map((c) => c.name));
  P.check(names.size === s.classes.length, `${where}: duplicate class names in the diagram`);
  for (const r of s.relations) P.check(names.has(r.from) && names.has(r.to), `${where}: relation ${r.from} → ${r.to} uses a class not in the diagram`);
  P.check(s.relations.length >= 1, `${where}: diagram has no relationships`);
}

export function checkSequence(P: Problems, where: string, seq: SequenceSpec, min = 4, max = 12) {
  const ids = new Set(seq.participants.map((p) => p.id));
  P.check(between(seq.messages.length, min, max), `${where}: ${seq.messages.length} messages (want ${min}–${max})`);
  P.check(seq.label.length > 10, `${where}: label for screen readers missing`);
  for (const m of seq.messages) P.check(ids.has(m.from) && ids.has(m.to), `${where}: message "${m.label}" uses an unknown participant`);
}

export function checkQuestions(P: Problems, where: string, qs: Question[], min: number, max: number) {
  P.check(between(qs.length, min, max), `${where}: ${qs.length} questions (want ${min}–${max})`);
  qs.forEach((q, i) => {
    const at = `${where} q${i + 1}`;
    P.check(q.prompt.length > 10 && q.hint.length > 10 && q.explain.length > 30, `${at}: prompt / hint / explain too short`);
    if (q.type === "mcq") {
      P.check(between(q.options.length, 3, 4), `${at}: 3–4 options`);
      P.check(q.answer >= 0 && q.answer < q.options.length, `${at}: answer index`);
      P.check(new Set(q.options).size === q.options.length, `${at}: duplicate options`);
    } else if (q.type === "bug") {
      const lines = q.code.text.split("\n");
      P.check(q.answer >= 1 && q.answer <= lines.length && !!lines[q.answer - 1]?.trim(), `${at}: answer must be a non-blank line`);
    } else if (q.type === "order") {
      P.check(JSON.stringify([...q.shuffled].sort((a, b) => a - b)) === JSON.stringify(q.steps.map((_, k) => k)), `${at}: shuffled must be a permutation`);
      P.check(q.shuffled.some((s, k) => s !== k), `${at}: shuffled is already in order`);
      P.check(between(q.steps.length, 3, 6), `${at}: 3–6 steps`);
    } else P.add(`${at}: use mcq, bug or order questions here`);
  });
}

