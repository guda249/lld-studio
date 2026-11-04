import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";

/**
 * Visitor: a visitor type with one visit method per element type, element classes whose accept(visitor) calls
 * the visit method for their own type (double dispatch), and concrete visitors that each hold one operation.
 * Also recognises the lighter forms from the lesson: functools.singledispatch, or a function that matches on a
 * sealed trait.
 */

/** "ItemVisitor[R]" -> "ItemVisitor", "'Book'" -> "Book". */
const typeName = (t: string | null | undefined) => (t ?? "").replace(/["']/g, "").split("[")[0].split("|")[0].trim();

type Visit = { method: MethodInfo; element: string };

/** Methods of v that take exactly one argument typed as one of our own classes (the visit methods). */
function visitMethods(v: ClassInfo, own: Set<string>): Visit[] {
  const out: Visit[] = [];
  for (const mt of v.methods) {
    const ps = mt.params.filter((p) => p.name !== "self");
    const el = ps.map((p) => typeName(p.type)).find((t) => own.has(t) && t !== v.name);
    if (el && !out.some((o) => o.element === el)) out.push({ method: mt, element: el });
  }
  return out;
}

/** The method of c that takes a visitor (typed as the visitor or one of its implementations), if any. */
function acceptOf(c: ClassInfo, visitorTypes: Set<string>): { mt: MethodInfo; param: string } | undefined {
  for (const mt of c.methods) {
    const p = mt.params.find((x) => visitorTypes.has(typeName(x.type)));
    if (p) return { mt, param: p.name };
  }
  return undefined;
}

const rules: PatternRules = {
  slug: "visitor",
  name: "Visitor",
  review(m, h) {
    const out: Finding[] = [];
    const own = new Set(m.classes.map((c) => c.name));
    const suppress = ["general.type-checks", "general.branches"];

    // 1. the visitor type: the class with the most one-element visit methods (at least two)
    let visitor: ClassInfo | null = null, visits: Visit[] = [];
    for (const c of m.classes) {
      if (c.kind === "enum") continue;
      const vs = visitMethods(c, own);
      const better = vs.length > visits.length || (vs.length === visits.length && visitor && h.isAbstraction(c) && !h.isAbstraction(visitor));
      if (vs.length >= 2 && (!visitor || better)) { visitor = c; visits = vs; }
    }
    // prefer the abstraction above a concrete visitor that was picked
    if (visitor && !h.isAbstraction(visitor)) {
      const up = visitor.bases.map((b) => h.cls(b)).find((b) => b && visitMethods(b, own).length >= 2);
      if (up) { visitor = up; visits = visitMethods(up, own); }
    }
    const visitorTypes = visitor ? new Set([visitor.name, ...h.implementers(visitor.name).map((c) => c.name)]) : new Set<string>();
    const dispatching = visitor
      ? m.classes.filter((c) => !visitorTypes.has(c.name)).flatMap((c) => {
          const a = acceptOf(c, visitorTypes);
          const call = a ? a.mt.calls.find((x) => x.receiver === a.param) : undefined;
          return a && call ? [{ cls: c, accept: a.mt, call }] : [];
        })
      : [];

    if (!visitor || !dispatching.length) {
      // the lighter forms: singledispatch, or one function that matches on the element type
      const sd = m.functions.find((f) => f.decorators.includes("singledispatch") || f.decorators.includes("singledispatchmethod"));
      const matcher = m.functions.find((f) => f.params.some((p) => {
        const t = h.cls(typeName(p.type));
        return !!t && h.implementers(t.name).length >= 2;
      }) && (f.branches.length > 0 || f.typeChecks.length >= 2));
      const lite = sd ?? matcher;
      if (lite && !visitor) {
        const how = sd ? "@singledispatch picks the function by the argument's type" : `${lite.name} matches on the element type in one place`;
        const roles = `${lite.name} is one operation over the element types, and ${how}: the lighter form of Visitor.`;
        out.push({ id: "visitor.idiomatic", sev: "note", line: lite.line, title: "The lighter form of Visitor",
          text: `${sd ? `${lite.name} uses @singledispatch` : `${lite.name} matches on the type of its argument`} (line ${lite.line}), so the operation lives in one place and the element classes need no accept method. That is the everyday replacement the lesson shows.${sd ? "" : " With a sealed trait the compiler warns you when a new type is not handled."}`,
          fix: "Use the full Visitor (accept plus one visit method per type) when you need many operations that share a common interface, or element classes you cannot pattern-match on.",
          lesson: "lesson" });
        return { found: true, findings: out, roles, suppress };
      }
      if (visitor) {
        out.push({ id: "visitor.no-accept", sev: "fail", line: visitor.line, title: "The elements never call the visitor",
          text: `${visitor.name} has a visit method for ${h.list(visits.map((v) => v.element))}, but none of those classes has an accept method that calls it. Without that call (the second half of "double dispatch") nothing chooses the right visit method.`,
          fix: `In each element class add ${h.py ? `def accept(self, visitor: ${visitor.name}): return visitor.${visits[0].method.name}(self)` : `def accept(v: ${visitor.name}) = v.${visits[0].method.name}(this)`}, using the visit method that matches that class.`,
          lesson: "lesson" });
        return { found: false, findings: out, suppress };
      }
      out.push({ id: "visitor.no-shape", sev: "fail", title: "The Visitor shape isn't there yet",
        text: "I couldn't find a visitor type with one visit method per element type, together with element classes whose accept method calls the matching visit method.",
        fix: `Create a visitor ${h.words.ifaceShort} with one method per element class (${h.py ? "visit_book(self, item: Book)" : "visitBook(b: Book)"}, ...). Give every element an accept(visitor) that calls its own visit method, and move each operation into a visitor class.`,
        lesson: "lesson" });
      // the smell: the same operations copied into every element class
      const groups = m.classes.filter((c) => c.kind !== "interface" && c.kind !== "abstract" && c.kind !== "enum");
      const shared = h.commonMethods(groups).filter((n) => !n.startsWith("_"));
      if (groups.length >= 2 && shared.length >= 2) {
        const first = groups[groups.length - 1];
        out.push({ id: "visitor.operations-in-elements", sev: "note", line: first.methods.find((x) => x.name === shared[0])?.line ?? first.line,
          title: `${h.list(shared)} are written in every class`,
          text: `${h.list(groups.map((g) => g.name))} each carry their own ${h.list(shared)}. Every new operation means editing every one of these classes, and the rule for one operation is spread over all of them.`,
          fix: `Move each operation into one visitor class (e.g. ${shared[0].replace(/^./, (c) => c.toUpperCase()).replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase())}Visitor) with a method per element type, and leave only accept(visitor) in the element classes.`,
          lesson: "problem" });
      }
      return { found: false, findings: out, suppress };
    }

    // a catch-all such as fallback(item: ClaimItem) for the element base is not a per-type visit method
    const isBase = (n: string) => m.classes.some((c) => c.name !== n && h.isA(c, n));
    if (visits.filter((v) => !isBase(v.element)).length >= 2) visits = visits.filter((v) => !isBase(v.element));
    const concreteVisitors = h.implementers(visitor.name, { concreteOnly: true });
    const elementNames = visits.map((v) => v.element);
    const roles = `${visitor.name} is the visitor, ${h.list(dispatching.map((d) => d.cls.name))} accept it${concreteVisitors.length ? `, and ${h.list(concreteVisitors.map((c) => c.name))} ${concreteVisitors.length === 1 ? "is an operation" : "are the operations"}` : ""}.`;
    out.push({ id: "visitor.shape", sev: "pass", title: "Visitor shape found", text: roles });

    // double dispatch: each element calls the visit method for its OWN type
    const wrong = dispatching.find((d) => {
      const v = visits.find((x) => x.method.name === d.call.method);
      return v && v.element !== d.cls.name && !h.isA(d.cls, v.element);
    });
    if (wrong) {
      const v = visits.find((x) => x.method.name === wrong.call.method)!;
      const right = visits.find((x) => x.element === wrong.cls.name);
      out.push({ id: "visitor.wrong-visit", sev: "warn", line: wrong.call.line, title: `${wrong.cls.name}.${wrong.accept.name} calls the ${v.element} visit method`,
        text: `${wrong.cls.name} passes itself to ${wrong.call.method}, which is meant for ${v.element}. Every visitor will treat a ${wrong.cls.name} as if it were a ${v.element}.`,
        fix: right ? `Call ${right.method.name} instead.` : `Add a visit method for ${wrong.cls.name} to ${visitor.name} and call it.`, lesson: "lesson" });
    }
    // every concrete element must accept a visitor, and have a visit method
    const elementBases = new Set(dispatching.flatMap((d) => d.cls.bases).filter((b) => own.has(b) && !visitorTypes.has(b)));
    const allElements = new Map<string, ClassInfo>();
    for (const n of elementNames) { const c = h.cls(n); if (c && !h.isAbstraction(c) && !isBase(n)) allElements.set(n, c); }
    for (const b of elementBases) for (const c of h.implementers(b, { concreteOnly: true })) if (!isBase(c.name)) allElements.set(c.name, c);
    const noAccept = [...allElements.values()].filter((c) => !dispatching.some((d) => d.cls.name === c.name)
      && !h.ancestors(c).some((a) => dispatching.some((d) => d.cls.name === a)));
    for (const c of noAccept.slice(0, 2)) out.push({ id: "visitor.missing-accept", sev: "warn", line: c.line, title: `${c.name} can't be visited`,
      text: `${c.name} has no accept method that calls the visitor, so no visitor can reach it and every operation silently leaves it out (or the code fails when accept is called on it).`,
      fix: `Add ${h.py ? `def accept(self, visitor: ${visitor.name}): return visitor.${visits.find((v) => v.element === c.name)?.method.name ?? `visit_${h.words.snake(c.name)}`}(self)` : `def accept(v: ${visitor.name}) = v.${visits.find((v) => v.element === c.name)?.method.name ?? `visit${c.name}`}(this)`} to ${c.name}.`,
      lesson: "lesson" });
    const unvisited = [...allElements.keys()].filter((n) => !elementNames.includes(n));
    for (const n of unvisited.slice(0, 2)) out.push({ id: "visitor.element-not-covered", sev: "warn", line: allElements.get(n)!.line, title: `${visitor.name} has no visit method for ${n}`,
      text: `${n} is an element, but ${visitor.name} has nothing for it, so no operation can handle it.`,
      fix: `Add ${h.py ? `visit_${h.words.snake(n)}(self, item: ${n})` : `visit${n}(x: ${n})`} to ${visitor.name} and to every concrete visitor.`, lesson: "lesson" });
    if (!wrong && !noAccept.length && !unvisited.length) out.push({ id: "visitor.double-dispatch", sev: "pass", title: "Double dispatch works",
      text: `Each element's accept calls the visit method for its own type, so the right code runs without checking types by hand.` });

    // the element base type should declare accept, so client code can call it on any element
    for (const b of elementBases) {
      const bc = h.cls(b)!;
      if (!acceptOf(bc, visitorTypes) && !bc.methods.some((x) => x.name === dispatching[0].accept.name)) {
        out.push({ id: "visitor.base-lacks-accept", sev: "warn", line: bc.line, title: `${b} doesn't declare ${dispatching[0].accept.name}`,
          text: `The elements share ${b}, but ${b} itself has no ${dispatching[0].accept.name}, so code holding a list of ${b} can't call it without knowing the concrete type.`,
          fix: h.py ? `Add @abstractmethod def ${dispatching[0].accept.name}(self, visitor: ${visitor.name}) to ${b}.` : `Add def ${dispatching[0].accept.name}[R](v: ${visitor.name}[R]): R to ${b}.`,
          lesson: "lesson" });
        break;
      }
    }

    // every concrete visitor handles every element type
    if (!concreteVisitors.length) out.push({ id: "visitor.no-concrete-visitor", sev: "warn", line: visitor.line, title: "No operation implements the visitor yet",
      text: `${visitor.name} is declared, but no class ${h.py ? "inherits from" : "extends"} it, so there is no operation to run over the elements.`,
      fix: `Add a class per operation (for example a tax or export visitor) that ${h.py ? `inherits from ${visitor.name}` : `extends ${visitor.name}`} and implements every visit method.`,
      lesson: "lesson" });
    let incomplete = false;
    for (const cv of concreteVisitors) {
      const have = new Set([cv, ...h.ancestors(cv).map((a) => h.cls(a)).filter((x): x is ClassInfo => !!x)]
        .flatMap((k) => k.methods.filter((x) => !x.abstract).map((x) => x.name)));
      const gap = visits.filter((v) => !have.has(v.method.name)).map((v) => v.method.name);
      if (gap.length) {
        incomplete = true;
        out.push({ id: "visitor.missing-visit", sev: "warn", line: cv.line, title: `${cv.name} doesn't handle ${h.list(gap)}`,
          text: `${cv.name} leaves ${h.list(gap)} without a body, so ${h.py ? `Python refuses to create ${cv.name}` : `Scala won't compile ${cv.name}`}. A visitor must say what to do for every element type.`,
          fix: `Add ${h.list(gap)} to ${cv.name}, even if a method just returns a neutral value such as 0.`, lesson: "lesson" });
      }
    }
    if (concreteVisitors.length && !incomplete) out.push({ id: "visitor.complete-visitors", sev: "pass", title: "Every operation handles every element",
      text: `${h.list(concreteVisitors.map((c) => c.name))} implement all ${visits.length} visit methods, so a new operation is a new class and the elements stay untouched (Open/Closed).` });

    // type checks inside visitors or accept undo the double dispatch
    const typed = [...concreteVisitors, ...dispatching.map((d) => d.cls)].flatMap((c) => c.methods.flatMap((mt) =>
      mt.typeChecks.filter((t) => allElements.has(t.type) || elementBases.has(t.type)).map((t) => ({ c, mt, t }))))[0];
    if (typed) out.push({ id: "visitor.type-checks", sev: "warn", line: typed.t.line, title: `${typed.c.name}.${typed.mt.name} checks for ${typed.t.type}`,
      text: `It uses ${h.words.typeCheck} on line ${typed.t.line}. accept and the visit methods already choose the code by type; checking again by hand brings back the chain of type checks that Visitor removes.`,
      fix: `Put that code in the visit method for ${typed.t.type} instead.`, lesson: "lesson" });

    return { found: true, findings: out, roles, suppress };
  }
};

export default rules;
