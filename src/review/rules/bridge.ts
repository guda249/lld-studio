import type { PatternRules, Finding } from "../types";
import type { ClassInfo, CodeModel, FieldInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Bridge: an implementation interface with concrete implementations, and a separate abstraction hierarchy whose
 * base class holds one implementation (the bridge field) and calls it. Detected from structure, not names.
 */

const strip = (r: string) => r.replace(/^(self\.|this\.)/, "");
/** "A or B", "A, B or C" */
const orList = (h: Helpers, xs: string[]) => h.list(xs).replace(/ and (?=\S+$)/, " or ");

/** Calls made in c on any of the given field names (self.f.x(), this.f.x(), f.x(), or f(...) for a function field). */
function callsOn(c: ClassInfo, names: Set<string>) {
  return c.methods.flatMap((mt) => mt.calls.filter((x) => x.receiver !== null && names.has(strip(x.receiver).split(".")[0])).map((call) => ({ method: mt, call })));
}

/** Lighter idiomatic form: a class whose constructor takes a function and calls it, with ≥ 2 top-level functions to pass in. */
function functionBridge(m: CodeModel, h: Helpers): { cls: ClassInfo; field: FieldInfo } | null {
  const fns = m.functions.filter((f) => !f.decorators.some((d) => d === "main") && !/^main$/.test(f.name));
  if (fns.length < 2) return null;
  for (const c of m.classes) {
    for (const f of c.fields) {
      if (f.origin !== "param") continue;
      const t = (c.ctorParams.find((p) => p.name === f.name)?.type ?? f.type ?? "");
      const looksFn = /=>|Callable/.test(t) || (!!f.type && /^[A-Z]/.test(f.type) && !h.cls(f.type) && !/^(String|Int|Long|Double|Float|Boolean|List|Seq|Map|Set|Vector|Option|BigDecimal)$/.test(f.type));
      if (!looksFn) continue;
      const called = c.methods.some((mt) => mt.calls.some((x) =>
        (x.receiver === null && x.method === f.name) || ((x.receiver === "self" || x.receiver === "this") && x.method === f.name)));
      if (called) return { cls: c, field: f };
    }
  }
  return null;
}

const rules: PatternRules = {
  slug: "bridge",
  name: "Bridge",
  review(m, h) {
    const out: Finding[] = [];

    // 1. Implementation side: an abstraction with concrete implementations that some class OUTSIDE its hierarchy holds.
    type Cand = { impl: ClassInfo; concretes: ClassInfo[]; holders: ClassInfo[] };
    let best: Cand | null = null;
    for (const i of h.abstractions()) {
      const concretes = h.implementers(i.name, { concreteOnly: true });
      if (!concretes.length) continue;
      const types = [i.name, ...concretes.map((c) => c.name)];
      const side = new Set([i.name, ...h.implementers(i.name).map((c) => c.name)]);
      const holders = m.classes.filter((c) => !side.has(c.name) && h.fieldsOfType(c, types).length > 0);
      if (!holders.length) continue;
      const score = concretes.length * 10 + holders.length;
      if (!best || score > best.concretes.length * 10 + best.holders.length) best = { impl: i, concretes, holders };
    }

    if (!best) {
      const fb = functionBridge(m, h);
      if (fb) {
        const roles = `${fb.cls.name} is the abstraction and its ${fb.field.name} field is the bridge, filled with a plain function instead of an implementation object.`;
        return {
          found: true, roles, suppress: ["general.branches"],
          findings: [
            { id: "bridge.shape", sev: "pass", title: "Bridge shape found (function form)", text: roles },
            { id: "bridge.function-form", sev: "note", line: fb.field.line, title: "Lighter form: the implementation is a function",
              text: `${fb.cls.name} receives a function and calls it, so the "how" side is swapped by passing a different function. That's a fine Bridge when the implementation is a single operation.`,
              fix: `If the implementation side grows to several related operations, turn it into ${h.words.iface} with one class per implementation.`, lesson: "lesson" }
          ]
        };
      }
      const findings: Finding[] = [{
        id: "bridge.no-shape", sev: "fail", title: "The Bridge shape isn't there yet",
        text: `I couldn't find two separate sides joined by a field: an implementation interface (${h.words.iface}) with classes that implement it, and a different class that holds one of them and calls it.`,
        fix: `Split the two things that vary. Put the "how" (for example the output format) behind one interface with a class per variant, and give the "what" side a field of that interface type, set through ${h.words.ctorParam}.`,
        lesson: "lesson"
      }];
      // the smell: several unrelated classes with the same method (one class per combination)
      const loose = m.classes.filter((c) => c.bases.filter((b) => h.cls(b)).length === 0 && c.kind !== "interface" && c.kind !== "abstract" && c.methods.length > 0);
      const groups = new Map<string, ClassInfo[]>();
      for (const c of loose) for (const mt of h.publicMethods(c).filter((x) => !x.startsWith("__"))) groups.set(mt, [...(groups.get(mt) ?? []), c]);
      const big = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)[0];
      if (big && big[1].length >= 3) findings.push({
        id: "bridge.class-explosion", sev: "note", line: big[1][0].line,
        title: `${big[1].length} separate classes each write their own ${big[0]}`,
        text: `${h.list(big[1].map((c) => c.name))} all have ${big[0]} but share nothing. When one class exists per combination of two things (like report × format), every new option multiplies the classes (line ${big[1][0].line}).`,
        fix: "Find the two things that vary, give each its own small hierarchy, and join them with a field.", lesson: "problem"
      });
      return { found: false, findings, suppress: ["general.branches"] };
    }

    const { impl, concretes } = best;
    const implNames = concretes.map((c) => c.name);
    const implTypes = [impl.name, ...implNames];
    const implSide = new Set([impl.name, ...h.implementers(impl.name).map((c) => c.name)]);
    const holders = best.holders;
    const holderSet = new Set(holders.map((c) => c.name));

    // 2. Abstraction side: the root is the holder none of whose ancestors also hold; prefer one with subclasses.
    const roots = holders.filter((c) => !h.ancestors(c).some((a) => holderSet.has(a)));
    let root = roots.find((c) => h.implementers(c.name).length > 0) ?? roots[0];
    let fieldNotInBase: { base: ClassInfo; holders: ClassInfo[] } | null = null;
    if (!h.implementers(root.name).length) {
      // several sibling holders sharing a base that does not hold the field itself
      for (const r of roots) {
        for (const b of r.bases) {
          const bc = h.cls(b);
          if (!bc || implSide.has(b)) continue;
          const sib = roots.filter((x) => x.bases.includes(b));
          if (sib.length >= 2) { fieldNotInBase = { base: bc, holders: sib }; break; }
        }
        if (fieldNotInBase) break;
      }
      if (fieldNotInBase) root = fieldNotInBase.base;
    }
    const refined = h.implementers(root.name);
    const absSide = [root, ...refined];
    const bridgeField = h.fieldsOfType(root, implTypes)[0] ?? h.fieldsOfType(fieldNotInBase?.holders[0] ?? root, implTypes)[0];
    const fieldNames = new Set(absSide.flatMap((c) => h.fieldsOfType(c, implTypes).map((f) => f.name)));
    // Scala: `class SalesReport(r: Renderer) extends Report(r)` – r is a pass-through, the base field is the bridge
    const fname = bridgeField?.name ?? "impl";

    const roles = `${impl.name} is the implementation (${h.list(implNames)}), ${root.name} is the abstraction${refined.length ? ` (refined by ${h.list(refined.map((c) => c.name))})` : ""}, and ${fieldNotInBase ? "the" : "its"} ${fname} field is the bridge between them.`;
    out.push({ id: "bridge.shape", sev: "pass", title: "Bridge shape found", text: roles });

    // check: two hierarchies (the abstraction side varies too)
    if (fieldNotInBase) {
      out.push({
        id: "bridge.field-not-in-base", sev: "warn", line: fieldNotInBase.base.line, title: `The ${impl.name} field is repeated instead of living in ${root.name}`,
        text: `${h.list(fieldNotInBase.holders.map((c) => c.name))} each keep their own ${impl.name}, but their shared parent ${root.name} doesn't. The bridge belongs in the abstraction's base class, so every variant gets it once.`,
        fix: h.py
          ? `Move the field into ${root.name}.__init__ (self._${h.words.snake(impl.name)} = ${h.words.snake(impl.name)}) and let the subclasses call super().__init__(...).`
          : `Make it a constructor parameter of ${root.name} (protected val ${impl.name.replace(/^./, (c) => c.toLowerCase())}: ${impl.name}) and pass it up with extends ${root.name}(...).`,
        lesson: "lesson"
      });
    } else if (refined.length) {
      out.push({ id: "bridge.two-hierarchies", sev: "pass", title: "Both sides can grow on their own",
        text: `${root.name} has ${refined.length === 1 ? "a variant" : "its own variants"} (${h.list(refined.map((c) => c.name))}) and ${impl.name} has ${h.list(implNames)}, so a new one on either side is one new class, not one per combination.` });
    } else {
      out.push({ id: "bridge.one-abstraction", sev: "note", line: root.line, title: `Only ${root.name} on the abstraction side`,
        text: `With a single ${root.name} class this looks just like Strategy. Bridge pays off when the "what" side has variants too (for example several kinds of ${root.name}).`,
        fix: `If ${root.name} will have variants, make it the base class that holds the ${impl.name} and add subclasses for each variant.`, lesson: "confused" });
    }

    // check: field typed as the interface, not a concrete implementation
    // a refined class whose parent already holds the bridge only passes its parameter up (Scala `extends Shape(c)`)
    const passThrough = (c: ClassInfo) => c !== root && !fieldNotInBase && h.fieldsOfType(root, implTypes).length > 0;
    const concreteFields = absSide.filter((c) => !passThrough(c)).flatMap((c) => c.fields.filter((f) => f.origin === "param" && f.type && implNames.includes(f.type)).map((f) => ({ c, f })));
    for (const { c, f } of concreteFields) out.push({
      id: "bridge.concrete-field", sev: "warn", line: f.line, title: `${c.name}.${f.name} is typed as ${f.type}`,
      text: `${f.name} is declared as the concrete ${f.type}, so ${c.name} only works with that one implementation and the two sides are welded together again.`,
      fix: `Type it as ${impl.name} so any implementation fits (Dependency Inversion).`, lesson: "lesson"
    });

    // check: the abstraction side must not create implementations itself
    const created = absSide.flatMap((c) => h.createsOf(c, implNames).map((x) => ({ c, x })));
    for (const { c, x } of created) out.push({
      id: "bridge.abstraction-creates-impl", sev: "warn", line: x.line, title: `${c.name} creates ${x.type} itself`,
      text: `On line ${x.line}, ${c.name} makes its own ${x.type}, so it is stuck with that implementation and you're back to one class per combination.`,
      fix: `Pass the ${impl.name} in through ${h.words.ctorParam} instead, and let the client code choose ${orList(h, implNames)} (Open/Closed).`,
      lesson: "lesson"
    });
    if (!concreteFields.length && !created.length) out.push({
      id: "bridge.depends-on-interface", sev: "pass", title: `${root.name} depends only on ${impl.name}`,
      text: `The abstraction side never names ${orList(h, implNames)}, so a new implementation plugs in without edits.`
    });

    // check: the abstraction forwards work across the bridge
    const delegations = absSide.flatMap((c) => callsOn(c, fieldNames));
    out.push(delegations.length
      ? { id: "bridge.delegates", sev: "pass", title: `${root.name} hands the low-level work to ${impl.name}`, text: `The abstraction side calls its ${fname} instead of doing the "how" itself.` }
      : { id: "bridge.no-delegation", sev: "warn", line: bridgeField?.line, title: `The ${impl.name} is stored but never used`,
          text: `${root.name} keeps a ${impl.name} in ${fname}, but no method on the abstraction side calls it, so the bridge carries nothing.`,
          fix: `In each operation, do the "what" part and call ${h.py ? "self." : ""}${fname}.${h.commonMethods([impl])[0] ?? "render"}(...) for the "how".`, lesson: "lesson" });

    // check: no type checks / branches on implementations inside the abstraction
    for (const c of absSide) {
      const mt = c.methods.find((x) => x.typeChecks.some((t) => implTypes.includes(t.type)));
      if (mt) {
        const tc = mt.typeChecks.find((t) => implTypes.includes(t.type))!;
        out.push({ id: "bridge.type-check", sev: "warn", line: tc.line, title: `${c.name} checks which ${impl.name} it has`,
          text: `${c.name}.${mt.name} tests for ${tc.type} (line ${tc.line}). The abstraction should not care which implementation it got; that brings the combinations back.`,
          fix: `Add what you need as a method on ${impl.name} and let each implementation do it its own way.`, lesson: "lesson" });
        break;
      }
    }

    // check: the bridge goes one way – implementations don't know about the abstraction
    const absNames = absSide.map((c) => c.name);
    for (const c of concretes) {
      const back = h.fieldsOfType(c, absNames)[0];
      const mk = h.createsOf(c, absNames)[0];
      if (back || mk) {
        out.push({ id: "bridge.impl-knows-abstraction", sev: "warn", line: back?.line ?? mk?.line, title: `${c.name} depends on the abstraction side`,
          text: `${c.name} ${back ? `keeps a ${back.type ?? root.name}` : `creates ${mk!.type}`}. Implementations should only do low-level work; if they know about ${root.name}, the two sides can no longer change separately.`,
          fix: `Remove that dependency: pass ${c.name} the plain data it needs as method arguments.`, lesson: "lesson" });
        break;
      }
    }

    if (concretes.length < 2) out.push({ id: "bridge.one-implementation", sev: "note", title: `${impl.name} has only one implementation so far`,
      text: `That's fine to start with; the bridge pays off once there are two or more (${concretes[0].name} and another).` });

    return { found: true, findings: out, roles, suppress: ["general.branches"] };
  }
};

export default rules;
