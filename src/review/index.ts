/**
 * Scratch-pad review: read the code (never run it), build the class model, apply the pattern's rules and the
 * general rules, compare with the learner's diagram, then write plain-English feedback with a score.
 */
import type { Lang } from "../content/types";
import { getParser } from "./parser";
import { buildModel, type CodeModel } from "./model";
import { makeHelpers } from "./helpers";
import { compareUml } from "./uml";
import type { Finding, PatternRules, Report, ReviewInput } from "./types";

const ruleFiles = import.meta.glob<{ default: PatternRules }>(["./rules/*.ts", "!./rules/*.cases.ts"], { eager: true });
export const RULES: Record<string, PatternRules> = Object.fromEntries(
  Object.values(ruleFiles).map((m) => [m.default.slug, m.default])
);

export async function readCode(code: string, lang: Lang): Promise<CodeModel> {
  const parser = await getParser(lang);
  const tree = parser.parse(code);
  const model = buildModel(tree.rootNode, lang);
  tree.delete?.();
  return model;
}

/** General checks that apply to every pattern. */
export function generalFindings(m: CodeModel): Finding[] {
  const out: Finding[] = [];
  const h = makeHelpers(m);
  if (m.errorLines.length) {
    const ls = m.errorLines.slice(0, 8);
    out.push({ id: "general.unreadable", sev: "note", line: ls[0], title: "Some lines couldn't be read",
      text: `I couldn't read line${ls.length > 1 ? "s" : ""} ${ls.join(", ")}${m.errorLines.length > 8 ? " and more" : ""}, so anything there was skipped. The rest was reviewed. (The code is never run, only read.)`,
      fix: "Look for a missing colon, bracket, quote or indentation near those lines." });
  }
  // naming
  const badClasses = m.classes.filter((c) => !/^[A-Z][A-Za-z0-9]*$/.test(c.name)).map((c) => c.name);
  const methodRe = h.py ? /^_{0,2}[a-z][a-z0-9_]*_{0,2}$/ : /^([a-z][A-Za-z0-9]*|[+\-*/=<>!&|^%~:]+|unary_[!~+-])$/;
  const badMethods = m.classes.flatMap((c) => c.methods.filter((x) => !methodRe.test(x.name) && !x.name.startsWith("<")).map((x) => `${c.name}.${x.name}`));
  if (badClasses.length || badMethods.length) {
    out.push({ id: "general.naming", sev: "warn", title: "Naming",
      text: [badClasses.length ? `Class names should be PascalCase (${badClasses.join(", ")}).` : "",
        badMethods.length ? `Method names should be ${h.py ? "snake_case" : "camelCase"} (${badMethods.slice(0, 6).join(", ")}).` : ""].filter(Boolean).join(" "),
      fix: h.py ? "PEP 8: classes like PaymentMethod, methods like set_method." : "Scala style: types like PaymentMethod, members like setMethod." });
  } else if (m.classes.length) {
    out.push({ id: "general.naming", sev: "pass", title: "Naming", text: `Names follow ${h.py ? "PEP 8" : "Scala"} conventions.` });
  }
  // unused abstractions
  for (const a of h.abstractions()) {
    if (h.implementers(a.name).length === 0 && !m.classes.some((c) => c.fields.some((f) => f.type === a.name))) {
      out.push({ id: "general.unused-interface", sev: "note", line: a.line, title: `${a.name} has no implementations yet`,
        text: `${a.name} is ${a.kind === "interface" ? "an interface" : "abstract"}, but no class implements it.`,
        fix: `Add classes that ${h.py ? `inherit from ${a.name}` : `extend ${a.name}`}, or remove it if it isn't needed.` });
    }
  }
  // type checks on own classes
  const own = new Set(m.classes.map((c) => c.name));
  for (const c of m.classes) for (const mt of c.methods) {
    const checks = mt.typeChecks.filter((t) => own.has(t.type));
    if (checks.length >= 2) {
      out.push({ id: "general.type-checks", sev: "warn", line: checks[0].line, title: `${c.name}.${mt.name} checks types one by one`,
        text: `${c.name}.${mt.name} uses ${h.words.typeCheck} on ${h.list([...new Set(checks.map((x) => x.type))])} (line ${checks[0].line}). Every new type means editing this method again (Open/Closed Principle).`,
        fix: "Put the behaviour in the classes themselves (polymorphism), so the caller just calls one method." });
      break;
    }
  }
  // long if/elif chains choosing behaviour
  const chain = m.classes.flatMap((c) => c.branches.filter((b) => b.count >= 3).map((b) => ({ ...b, cls: c.name })))[0];
  if (chain) out.push({ id: "general.branches", sev: "note", line: chain.line, title: `${chain.cls} chooses between ${chain.count} behaviours with ${h.words.ifElse}`,
    text: `Line ${chain.line} picks one of ${chain.count} behaviours. If this list keeps growing, it is the kind of code design patterns replace.`,
    fix: "Ask: does each branch belong in its own class behind one interface?" });
  // god class
  const big = m.classes.find((c) => c.methods.length > 12);
  if (big) out.push({ id: "general.big-class", sev: "note", line: big.line, title: `${big.name} does a lot`,
    text: `${big.name} has ${big.methods.length} methods. Large classes are hard to change safely (Single Responsibility).`,
    fix: "See whether some methods belong together in a smaller class." });
  return out;
}

const SEV_ORDER = { fail: 0, warn: 1, note: 2, pass: 3 } as const;
const ICON = { pass: "✓", warn: "⚠", fail: "✗", note: "ℹ" } as const;

export function score(found: boolean, findings: Finding[]): number {
  let s = 100;
  for (const f of findings) s -= f.sev === "fail" ? 30 : f.sev === "warn" ? 10 : 0;
  if (!found) s = Math.min(s, 35);
  return Math.max(0, Math.min(100, s));
}

export function summarise(name: string, found: boolean, roles: string | undefined, findings: Finding[]): string {
  const warns = findings.filter((f) => f.sev === "warn" || f.sev === "fail");
  if (!found) {
    const fail = findings.find((f) => f.sev === "fail");
    return `${fail ? fail.text : `I couldn't find the ${name} pattern in this code yet.`} Have another look at the lesson, then try again.`;
  }
  const head = roles ? `Your design is recognisably the ${name} pattern: ${roles}` : `Your design is recognisably the ${name} pattern.`;
  if (!warns.length) return `${head} Nicely done: nothing important to change.`;
  const n = warns.length;
  return `${head} ${n === 1 ? "One thing" : `${n} things`} to improve: ${warns.slice(0, 3).map((w) => w.title).join("; ")}${n > 3 ? "; and more" : ""}.`;
}

export function toMarkdown(r: Omit<Report, "markdown">, name: string): string {
  const lines = [
    `# Review: ${name} (${r.lang === "python" ? "Python" : "Scala 3"})`,
    "",
    `Score: **${r.score} / 100** · ${new Date(r.createdAt).toLocaleString()}`,
    "",
    r.summary,
    ""
  ];
  for (const f of r.findings) {
    lines.push(`## ${ICON[f.sev]} ${f.title}${f.line ? ` (line ${f.line})` : ""}`, "", f.text);
    if (f.fix) lines.push("", `**How to fix:** ${f.fix}`);
    lines.push("");
  }
  lines.push("---", "Reviewed by LLD Studio in your browser: the code was read, never run.");
  return lines.join("\n");
}

export async function review(input: ReviewInput): Promise<Report> {
  const createdAt = Date.now();
  const rules = RULES[input.slug];
  const name = rules?.name ?? input.slug;
  if (!input.code.trim()) {
    const findings: Finding[] = [{ id: "general.empty", sev: "fail", title: "No code yet", text: "Write some code in the editor first, then ask for a review." }];
    const base = { slug: input.slug, lang: input.lang, score: 0, patternFound: false, summary: "There is no code to review yet.", findings, createdAt };
    return { ...base, markdown: toMarkdown(base, name) };
  }
  const model = await readCode(input.code, input.lang);
  const res = rules ? rules.review(model, makeHelpers(model)) : { found: false, findings: [] as Finding[] };
  const suppress = new Set(res.suppress ?? []);
  let findings = [...res.findings, ...generalFindings(model).filter((f) => !suppress.has(f.id))];
  if (input.diagram && input.diagram.classes.length) findings.push(...compareUml(input.diagram, model));
  // de-duplicate by id+line, keep the most severe first
  const seen = new Set<string>();
  findings = findings.filter((f) => { const k = f.id + ":" + (f.line ?? ""); if (seen.has(k)) return false; seen.add(k); return true; });
  findings.sort((a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev]);
  const sc = score(res.found, findings);
  const base = { slug: input.slug, lang: input.lang, score: sc, patternFound: res.found, summary: summarise(name, res.found, res.roles, findings), findings, createdAt };
  return { ...base, markdown: toMarkdown(base, name) };
}
