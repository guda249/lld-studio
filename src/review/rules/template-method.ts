import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";

/**
 * Template Method: a base class with one method (the template) that calls several of its own steps in a fixed
 * order; at least one step is abstract (or overridden), and subclasses fill in the steps without redefining the
 * template. Also recognises the lighter form from the lesson: a function that takes the varying step as a
 * function argument.
 */

const SELF = /^(self|this|super\(\)|super)$/;

/** Names of c's own methods that mt calls (self.x(...) in Python, x(...) or this.x(...) in Scala). */
function stepsCalled(mt: MethodInfo, own: Set<string>): { name: string; line: number }[] {
  const out: { name: string; line: number }[] = [];
  for (const call of mt.calls) {
    if (call.method === mt.name || !own.has(call.method)) continue;
    if (call.receiver !== null && !SELF.test(call.receiver)) continue;
    if (!out.some((o) => o.name === call.method)) out.push({ name: call.method, line: call.line });
  }
  return out;
}

/** All methods visible on c (own first, then inherited), by name. */
function visible(c: ClassInfo, h: { cls: (n: string) => ClassInfo | undefined; ancestors: (c: ClassInfo) => string[] }): Map<string, MethodInfo> {
  const out = new Map<string, MethodInfo>();
  for (const k of [c, ...h.ancestors(c).map((n) => h.cls(n)).filter((x): x is ClassInfo => !!x)]) {
    for (const m of k.methods) if (!out.has(m.name)) out.set(m.name, m);
    for (const f of k.fields) if (!out.has(f.name)) out.set(f.name, { ...m0(f.name), abstract: false });
  }
  return out;
}
/** Is this a step subclasses must provide? Python marks `pass` hooks as stubs too, so there it needs @abstractmethod
 *  (or a stub that promises a return value, e.g. `-> str: raise NotImplementedError`). */
function required(mt: MethodInfo | undefined, py: boolean): boolean {
  if (!mt || !mt.abstract) return false;
  if (!py) return true;
  return mt.decorators.includes("abstractmethod") || (!!mt.returnType && mt.returnType !== "None");
}
const m0 = (name: string): MethodInfo => ({ name, line: 0, abstract: false, static: false, decorators: [], params: [], returnType: null, calls: [], creates: [], typeChecks: [], loopsOver: [], returnsSelf: false, copies: false, branches: [], returns: [], assigns: [], raises: [], yields: false });

const rules: PatternRules = {
  slug: "template-method",
  name: "Template Method",
  review(m, h) {
    const out: Finding[] = [];

    // 1. find the base class and its template method
    type Cand = { base: ClassInfo; tmpl: MethodInfo; steps: { name: string; line: number }[]; subs: ClassInfo[]; score: number };
    let best: Cand | null = null;
    for (const base of m.classes) {
      if (base.kind === "object" || base.kind === "enum") continue;
      const subs = h.implementers(base.name, { concreteOnly: true });
      if (!subs.length) continue;
      const own = new Set(base.methods.map((x) => x.name));
      for (const tmpl of base.methods) {
        if (tmpl.abstract || tmpl.name.startsWith("__")) continue;
        const steps = stepsCalled(tmpl, own);
        if (steps.length < 2) continue;
        const stepMethods = steps.map((s) => base.methods.find((x) => x.name === s.name)!);
        const varying = stepMethods.filter((s) => required(s, h.py) || subs.some((c) => c.methods.some((x) => x.name === s.name)));
        if (!varying.length) continue;
        const score = varying.length * 10 + steps.length + subs.length;
        if (!best || score > best.score) best = { base, tmpl, steps, subs, score };
      }
    }

    if (!best) {
      // the lighter form: a function whose varying step is a function argument it calls
      for (const fn of m.functions) {
        const p = fn.params.find((x) => fn.calls.some((c) => c.receiver === null && c.method === x.name));
        if (!p || fn.name === "main" || fn.decorators.includes("main")) continue;
        // a recipe: the varying step plus at least two fixed steps around it
        if (new Set(fn.calls.filter((c) => c.method !== p.name).map((c) => c.method)).size < 2) continue;
        const roles = `${fn.name} keeps the fixed order of steps and takes the varying step, ${p.name}, as a function: the lighter, composition-based form.`;
        out.push({
          id: "template-method.idiomatic", sev: "note", line: fn.line, title: "The function-based form of Template Method",
          text: `${fn.name} (line ${fn.line}) runs the steps in a fixed order and calls ${p.name}, which the caller passes in. That is the lighter version the lesson shows. It avoids inheritance, and it is really Strategy with a function.`,
          fix: `If several steps vary together, or they share a lot of state, move to the class form: a base class whose ${h.name("run")} calls abstract steps that subclasses fill in.`,
          lesson: "lesson"
        });
        return { found: true, findings: out, roles };
      }
      out.push({
        id: "template-method.no-shape", sev: "fail", title: "The Template Method shape isn't there yet",
        text: "I couldn't find a base class with one method that calls several of its own steps in a fixed order, where at least one step is left for subclasses to fill in.",
        fix: `Make a base class (${h.py ? "an ABC" : "an abstract class"}) whose main method calls the steps in order. Mark the step that differs as ${h.py ? "@abstractmethod" : "abstract (a def with no body)"}, and let each subclass implement only that step.`,
        lesson: "lesson"
      });
      // the smell: unrelated classes with the same method doing the same calls
      const pairs: { a: ClassInfo; b: ClassInfo; name: string; shared: string[]; line: number }[] = [];
      const free = m.classes.filter((c) => c.kind !== "enum" && c.kind !== "interface");
      for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
        const a = free[i], b = free[j];
        if (h.isA(a, b.name) || h.isA(b, a.name)) continue;
        for (const ma of a.methods) {
          const mb = b.methods.find((x) => x.name === ma.name && !x.name.startsWith("__"));
          if (!mb) continue;
          const sb = new Set(mb.calls.map((x) => x.method));
          const shared = [...new Set(ma.calls.map((x) => x.method).filter((x) => sb.has(x)))];
          if (shared.length >= 2) pairs.push({ a, b, name: ma.name, shared, line: mb.line });
        }
      }
      const p = pairs.sort((x, y) => y.shared.length - x.shared.length)[0];
      if (p) out.push({
        id: "template-method.duplicated-steps", sev: "note", line: p.line,
        title: `${p.a.name}.${p.name} and ${p.b.name}.${p.name} repeat the same steps`,
        text: `Both ${p.name} methods follow the same recipe (they both call ${h.list(p.shared.slice(0, 3))}), so a fix to the shared part must be made in each copy. That's the duplication Template Method removes.`,
        fix: `Move ${p.name} into a shared base class, split it into steps, and leave only the step that differs to ${p.a.name} and ${p.b.name}.`,
        lesson: "problem"
      });
      return { found: false, findings: out };
    }

    const { base, tmpl, steps, subs } = best;
    const subNames = subs.map((s) => s.name);
    const stepNames = steps.map((s) => s.name);
    const abstractSteps = stepNames.filter((n) => required(base.methods.find((x) => x.name === n), h.py));
    const hooks = stepNames.filter((n) => !abstractSteps.includes(n));
    const roles = `${base.name}.${tmpl.name} is the template method, it calls the steps ${h.list(stepNames)}, and ${h.list(subNames)} ${subNames.length === 1 ? "fills" : "fill"} them in.`;
    out.push({ id: "template-method.shape", sev: "pass", title: "Template Method shape found", text: roles });

    // the skeleton must stay in the base class
    const overriders = subs.filter((s) => s.methods.some((x) => x.name === tmpl.name));
    if (overriders.length) {
      const s = overriders[0], mt = s.methods.find((x) => x.name === tmpl.name)!;
      out.push({ id: "template-method.template-overridden", sev: "warn", line: mt.line, title: `${s.name} overrides ${tmpl.name}`,
        text: `${tmpl.name} is the fixed recipe that every subclass should share. When ${s.name} writes its own ${tmpl.name}, the order of steps lives in two places again and a fix to the base no longer reaches ${s.name}.`,
        fix: `Delete ${s.name}.${tmpl.name} and override only the steps that differ (${h.list(stepNames)}). Mark ${base.name}.${tmpl.name} ${h.py ? "with @final (from typing)" : "as final def"} so this can't happen again.`,
        lesson: "lesson" });
    } else {
      const isFinal = tmpl.decorators.includes("final");
      out.push({ id: "template-method.skeleton-fixed", sev: "pass", title: `The order of steps lives only in ${base.name}`,
        text: `No subclass redefines ${tmpl.name}, so the recipe is written once.${isFinal ? "" : ` You can make that a rule by marking it ${h.py ? "@final (from typing)" : "final def"}.`}` });
    }

    // at least one step must be left to the subclasses
    if (abstractSteps.length) out.push({ id: "template-method.abstract-steps", sev: "pass", title: "Subclasses must fill in the varying steps",
      text: `${h.list(abstractSteps)} ${abstractSteps.length === 1 ? "has" : "have"} no body in ${base.name}, so every subclass is required to provide ${abstractSteps.length === 1 ? "it" : "them"}.${hooks.length ? ` ${h.list(hooks)} ${hooks.length === 1 ? "is a hook" : "are hooks"} with a default that subclasses may override.` : ""}` });
    else {
      const s = steps.find((x) => subs.some((c) => c.methods.some((y) => y.name === x.name))) ?? steps[0];
      out.push({ id: "template-method.no-abstract-step", sev: "warn", line: base.methods.find((x) => x.name === s.name)?.line ?? base.line,
        title: "No step is required", text: `Every step ${tmpl.name} calls already has a body in ${base.name}, so a new subclass compiles and runs without filling anything in, and it is easy to forget the step that should differ.`,
        fix: `Make the step that must differ abstract: ${h.py ? `@abstractmethod on ${base.name}.${s.name} (and ${base.name}(ABC))` : `declare ${s.name} without a body in ${base.name} and make it an abstract class`}. Keep bodies only for optional hooks.`,
        lesson: "lesson" });
    }

    // every concrete subclass fills in every abstract step (directly or through a middle class)
    let missing = false;
    const allAbstract = base.methods.filter((x) => required(x, h.py)).map((x) => x.name);
    for (const s of subs) {
      const vis = visible(s, h);
      const gap = allAbstract.filter((n) => { const v = vis.get(n); return !v || required(v, h.py); });
      if (!gap.length) continue;
      missing = true;
      out.push({ id: "template-method.missing-step", sev: "warn", line: s.line, title: `${s.name} doesn't fill in ${h.list(gap)}`,
        text: `${base.name} leaves ${h.list(gap)} for subclasses, but ${s.name} doesn't provide ${gap.length === 1 ? "it" : "them"}. ${h.py ? (gap.some((g) => base.methods.find((x) => x.name === g)?.decorators.includes("abstractmethod")) ? `Python will refuse to create ${s.name}` : `${tmpl.name} will fail when it reaches that step`) : `Scala won't compile ${s.name}`}.`,
        fix: `Add ${h.list(gap.map((g) => h.py ? `def ${g}(self, ...)` : `def ${g}(...)`))} to ${s.name}.`, lesson: "lesson" });
    }
    if (!missing && allAbstract.length) out.push({ id: "template-method.steps-filled", sev: "pass", title: "Every subclass fills in its steps",
      text: `${h.list(subNames)} each provide ${h.list(allAbstract)}.` });

    // a subclass re-writing the recipe in another method (calls several steps itself)
    const baseSteps = new Set(stepNames);
    for (const s of subs) {
      for (const mt of s.methods) {
        if (mt.name === tmpl.name || baseSteps.has(mt.name)) continue;
        const again = mt.calls.filter((c) => baseSteps.has(c.method) && (c.receiver === null || SELF.test(c.receiver)));
        if (new Set(again.map((c) => c.method)).size >= 2) {
          out.push({ id: "template-method.duplicated-skeleton", sev: "warn", line: mt.line, title: `${s.name}.${mt.name} repeats the recipe`,
            text: `${s.name}.${mt.name} calls ${h.list([...new Set(again.map((c) => c.method))])} itself, which is the job of ${base.name}.${tmpl.name}. Two copies of the order of steps can drift apart.`,
            fix: `Call ${h.py ? "self." : ""}${tmpl.name}(...) instead, or move any extra step into ${base.name} as a hook.`, lesson: "lesson" });
          break;
        }
      }
    }

    // the base class should not check which subclass it is
    for (const mt of base.methods) {
      const tc = mt.typeChecks.find((t) => subNames.includes(t.type));
      if (tc) {
        out.push({ id: "template-method.type-check", sev: "warn", line: tc.line, title: `${base.name}.${mt.name} checks for ${tc.type}`,
          text: `The base class asks which subclass it is (line ${tc.line}). That puts subclass details back into the recipe, so every new subclass means editing ${base.name} (Open/Closed).`,
          fix: `Turn that branch into a step or hook, and let ${tc.type} override it.`, lesson: "lesson" });
        break;
      }
    }

    return { found: true, findings: out, roles };
  }
};

export default rules;
