import type { PatternRules, Finding } from "../types";
import type { ClassInfo, CodeModel, FieldInfo, MethodInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Decorator: a component type, a real (concrete) component, and a decorator that both implements the component
 * type AND holds one (passed in), forwarding each call to it while adding something before or after.
 * Also recognises the lighter function form (a function that takes and returns the same function type).
 */

const strip = (r: string) => r.replace(/^(self\.|this\.)/, "");
const isSuper = (r: string | null) => r === "super()" || r === "super" || (r ?? "").startsWith("super(");

/** Calls on field f (self.f.x(), this.f.x(), f.x(), or f(...) when the field is a function). */
const callsOnField = (mt: MethodInfo, f: string) => mt.calls.filter((c) => c.receiver !== null && strip(c.receiver).split(".")[0] === f);

const PLAIN = /^(String|Int|Long|Double|Float|Boolean|Unit|Char|BigDecimal|BigInt|List\b|Seq\b|Map\b|Set\b|Vector\b|Option\b)/;
const an = (w: string) => (/^[AEIOU]/.test(w) ? "an " : "a ") + w;

/** The lighter form: functions that take a value of some type and return the same type (with_logging(inner: Fetch) -> Fetch). */
function functionForm(m: CodeModel) {
  const wrappers = m.functions.filter((f) => f.returnType && /^[A-Z]/.test(f.returnType) && !PLAIN.test(f.returnType) && f.params.some((p) => p.type && p.type.replace(/\s/g, "") === f.returnType!.replace(/\s/g, "")));
  return wrappers.length ? wrappers : null;
}

/** The smell: subclasses chained to combine features (LoggingCachingClient extends CachingClient extends BasicClient). */
function inheritanceCombo(m: CodeModel, h: Helpers) {
  const own = new Set(m.classes.map((c) => c.name));
  for (const c of m.classes) {
    const chain = h.ancestors(c).filter((a) => own.has(a) && !h.isAbstraction(h.cls(a)!));
    if (chain.length >= 2 && c.methods.some((mt) => mt.calls.some((x) => isSuper(x.receiver) && x.method === mt.name))) return { c, chain };
  }
  return null;
}

const rules: PatternRules = {
  slug: "decorator",
  name: "Decorator",
  review(m, h) {
    const out: Finding[] = [];

    // 1. A component type and decorators: subclasses that also keep a component in a field.
    type Cand = { comp: ClassInfo; ops: MethodInfo[]; decs: { c: ClassInfo; f: FieldInfo }[]; rank: number };
    let best = null as Cand | null;
    for (const comp of m.classes) {
      const subs = h.implementers(comp.name);
      if (!subs.length) continue;
      const family = [comp.name, ...subs.map((s) => s.name)];
      const ops = comp.methods.filter((x) => !x.name.startsWith("_") && x.name !== "<init>");
      const opNames = new Set(ops.map((o) => o.name));
      const decs: { c: ClassInfo; f: FieldInfo }[] = [];
      for (const s of subs) {
        let f = h.fieldsOfType(s, family)[0];
        // untyped Python: a constructor parameter that the methods call with the component's operations
        if (!f) f = s.fields.find((x) => x.origin === "param" && !x.type && s.methods.some((mt) => callsOnField(mt, x.name).some((c) => opNames.has(c.method)))) as FieldInfo;
        if (f) decs.push({ c: s, f });
      }
      if (!decs.length) continue;
      const rank = (h.isAbstraction(comp) ? 100 : 0) + decs.length * 10 + subs.length;
      if (!best || rank > best.rank) best = { comp, ops, decs, rank };
    }

    if (!best) {
      const fw = functionForm(m);
      if (fw) {
        const roles = `${h.list(fw.map((f) => f.name))} ${fw.length > 1 ? "are decorators" : "is a decorator"}: each takes ${an(fw[0].returnType ?? "value")} and returns a new one that wraps it.`;
        return {
          found: true, roles,
          findings: [
            { id: "decorator.shape", sev: "pass", title: "Decorator shape found (function form)", text: roles },
            { id: "decorator.function-form", sev: "note", line: fw[0].line, title: "Lighter form: wrapping functions",
              text: `The component here is a function type (${fw[0].returnType}), and each wrapper returns a new function with the same shape. That's a clean Decorator when the component has a single operation.`,
              fix: `If the component grows to several related methods, switch to ${h.words.iface} plus wrapper classes that hold one and forward every method.`, lesson: "lesson" }
          ]
        };
      }
      const findings: Finding[] = [{
        id: "decorator.no-shape", sev: "fail", title: "The Decorator shape isn't there yet",
        text: `I couldn't find a wrapper class that both implements a shared component type (${h.words.iface}) and keeps another object of that same type in a field. A decorator has to do both: look like the thing it wraps, and hold it.`,
        fix: `Create a component interface, keep the real class as one implementation, and write each extra feature as a class that implements the interface, takes the wrapped object through ${h.words.ctorParam}, and calls it inside each method.`,
        lesson: "lesson"
      }];
      const combo = inheritanceCombo(m, h);
      if (combo) findings.push({
        id: "decorator.inheritance-combo", sev: "note", line: combo.c.line, title: `${combo.c.name} combines features by inheriting`,
        text: `${combo.c.name} inherits from ${h.list(combo.chain)} to get several features at once. Each new mix of features needs another subclass, so the number of classes doubles with every feature (line ${combo.c.line}).`,
        fix: "Make each feature a wrapper you can stack at runtime instead, for example Logging(Caching(Basic())).", lesson: "problem"
      });
      return { found: false, findings };
    }

    const { comp, ops, decs } = best;
    const decNames = new Set(decs.map((d) => d.c.name));
    // the base decorator is a holder none of whose ancestors also holds; concrete decorators are its subclasses (or the holders themselves)
    const roots = decs.filter((d) => !h.ancestors(d.c).some((a) => decNames.has(a)));
    const base = roots.find((d) => h.implementers(d.c.name).length > 0) ?? roots[0];
    const refined = h.implementers(base.c.name);
    const concreteDecs = refined.length ? [...refined, ...roots.filter((r) => r !== base).map((r) => r.c)] : roots.map((r) => r.c);
    const allDecs = new Set([...decs.map((d) => d.c.name), ...refined.map((c) => c.name)]);
    const components = h.implementers(comp.name, { concreteOnly: true }).filter((c) => !allDecs.has(c.name));
    const compNames = components.map((c) => c.name);

    const roles = `${comp.name} is the component, ${compNames.length ? `${h.list(compNames)} ${compNames.length > 1 ? "are the real objects" : "is the real object"}, ` : ""}${refined.length ? `${base.c.name} is the base decorator and ${h.list(concreteDecs.map((c) => c.name))} wrap it` : `${h.list(concreteDecs.map((c) => c.name))} ${concreteDecs.length > 1 ? "are decorators that wrap" : "is a decorator that wraps"} ${an(comp.name)}`}.`;
    out.push({ id: "decorator.shape", sev: "pass", title: "Decorator shape found", text: roles });

    // check: the wrapped field is typed as the component and passed in
    for (const d of roots) {
      if (d.f.origin === "created" || d.f.created.length) out.push({
        id: "decorator.creates-wrapped", sev: "warn", line: d.f.line, title: `${d.c.name} creates the object it wraps`,
        text: `${d.c.name} makes its own ${d.f.created[0] ?? d.f.type ?? comp.name} instead of receiving one, so it always wraps that exact object and can't be stacked on top of other decorators.`,
        fix: `Take the wrapped ${comp.name} through ${h.words.ctorParam} and let the client build the stack, for example ${concreteDecs[0]?.name ?? "Logging"}(${compNames[0] ?? "Real"}()).`, lesson: "lesson"
      });
      else if (d.f.type && compNames.includes(d.f.type)) out.push({
        id: "decorator.wraps-concrete", sev: "warn", line: d.f.line, title: `${d.c.name} can only wrap ${d.f.type}`,
        text: `${d.c.name}.${d.f.name} is typed as ${d.f.type}, so it can't wrap another decorator, and decorators stop being stackable.`,
        fix: `Type it as ${comp.name}, so ${d.c.name} can wrap the real object or any other decorator.`, lesson: "lesson"
      });
      else if (!d.f.type && h.py) out.push({
        id: "decorator.untyped-wrapped", sev: "note", line: d.f.line, title: `Say what ${d.c.name} wraps`,
        text: `${d.c.name}.${d.f.name} has no type hint, so readers (and tools) can't see it must be ${an(comp.name)}.`,
        fix: `Annotate the parameter: ${d.f.name.replace(/^_/, "")}: ${comp.name}.`
      });
    }
    if (!out.some((f) => ["decorator.wraps-concrete", "decorator.creates-wrapped"].includes(f.id))) out.push({
      id: "decorator.holds-component", sev: "pass", title: `${base.c.name} holds ${an(comp.name)} and is one`,
      text: `${base.c.name} implements ${comp.name} and receives the ${comp.name} it wraps, so wrappers can go around the real object or around each other.`
    });

    // check: every operation of the component is implemented and forwarded
    const missing: { d: ClassInfo; op: string }[] = [];
    const notForwarding: { d: ClassInfo; mt: MethodInfo }[] = [];
    for (const d of roots) {
      for (const op of ops) {
        const mt = h.method(d.c, op.name);
        if (!mt) {
          // an abstract base decorator may leave it to every subclass
          if (!(h.isAbstraction(d.c) && refined.length && refined.every((r) => h.method(r, op.name)))) missing.push({ d: d.c, op: op.name });
          continue;
        }
        if (mt.abstract) continue;
        const fwd = callsOnField(mt, d.f.name).length > 0 || mt.calls.some((c) => c.receiver === null && c.method === d.f.name);
        if (!fwd) notForwarding.push({ d: d.c, mt });
      }
    }
    for (const c of refined) {
      for (const op of ops) {
        const mt = h.method(c, op.name);
        if (!mt) continue; // inherits the forwarding version: fine
        const own = h.fieldsOfType(c, [comp.name]).map((f) => f.name);
        const fwd = mt.calls.some((x) => isSuper(x.receiver)) || own.some((f) => callsOnField(mt, f).length > 0) || callsOnField(mt, base.f.name).length > 0;
        if (!fwd) notForwarding.push({ d: c, mt });
      }
    }
    for (const x of missing.slice(0, 1)) out.push({
      id: "decorator.missing-op", sev: "warn", line: x.d.line, title: `${x.d.name} doesn't implement ${x.op}`,
      text: `${comp.name} declares ${x.op}, but ${x.d.name} doesn't provide it, so a wrapped object can't be used everywhere the real one can.`,
      fix: h.py ? `Add def ${x.op}(self, ...) that returns self.${roots[0].f.name}.${x.op}(...).` : `Add def ${x.op}(...) = ${roots[0].f.name}.${x.op}(...).`, lesson: "lesson"
    });
    for (const x of notForwarding.slice(0, 1)) out.push({
      id: "decorator.no-forwarding", sev: "warn", line: x.mt.line, title: `${x.d.name}.${x.mt.name} doesn't call the wrapped object`,
      text: `${x.d.name}.${x.mt.name} never passes the call on, so it replaces the wrapped behaviour instead of adding to it, and everything wrapped inside is skipped.`,
      fix: refined.includes(x.d)
        ? `Do the extra work, then call ${h.py ? "super()" : "super"}.${x.mt.name}(...) (or the wrapped object directly) and return its result.`
        : `Do the extra work, then call ${h.py ? "self." : ""}${base.f.name}.${x.mt.name}(...) and return its result.`,
      lesson: "lesson"
    });
    if (!missing.length && !notForwarding.length && ops.length) out.push({
      id: "decorator.forwards", sev: "pass", title: "Every wrapper passes the call on",
      text: `The decorators add their bit and then call the wrapped ${comp.name}, so the real work still happens at the centre of the stack.`
    });

    // check: decorators don't check what they wrap
    for (const c of [base.c, ...concreteDecs]) {
      const family = new Set([comp.name, ...h.implementers(comp.name).map((x) => x.name)]);
      const mt = c.methods.find((x) => x.typeChecks.some((t) => family.has(t.type)));
      if (mt) {
        const tc = mt.typeChecks.find((t) => family.has(t.type))!;
        out.push({ id: "decorator.type-check", sev: "warn", line: tc.line, title: `${c.name} checks what it wraps`,
          text: `${c.name}.${mt.name} asks whether the wrapped object is ${an(tc.type)} (line ${tc.line}). A decorator should work the same around anything that is ${an(comp.name)}; otherwise the order of wrapping starts to matter in hidden ways.`,
          fix: `Remove the check and only use the ${comp.name} methods on the wrapped object.`, lesson: "lesson" });
        break;
      }
    }

    // check: something real to wrap, and more than one feature to stack
    if (!components.length) out.push({ id: "decorator.no-real-component", sev: "warn", line: comp.line, title: `Nothing real to wrap`,
      text: `Every class that implements ${comp.name} is a decorator, so at the centre of the stack there is nothing that does the actual work.`,
      fix: `Add a plain class that implements ${comp.name} and does the job itself, without holding another ${comp.name}.`, lesson: "lesson" });
    if (concreteDecs.length >= 2) out.push({ id: "decorator.stackable", sev: "pass", title: "Features can be mixed freely",
      text: `With ${h.list(concreteDecs.map((c) => c.name))} as separate wrappers, any combination is built at runtime by nesting them, with no class per combination.` });
    else out.push({ id: "decorator.one-decorator", sev: "note", title: "Only one decorator so far",
      text: `${concreteDecs[0]?.name ?? base.c.name} is the only wrapper. Decorator pays off when there are several features to stack in any order.` });

    return { found: true, findings: out, roles, suppress: ["general.branches"] };
  }
};

export default rules;
