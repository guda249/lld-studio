import type { PatternRules, Finding } from "../types";
import type { ClassInfo, FieldInfo, MethodInfo, Param } from "../model";
import type { Helpers } from "../helpers";

/**
 * Chain of Responsibility: a handler type (base class / ABC / trait) whose objects hold a link to the NEXT
 * handler (a field typed as the handler type), at least two handler classes, and a handle method that either
 * deals with the request or passes it along to the next link. The client builds the chain from outside.
 * Lighter forms the lesson teaches (a list of functions returning None; Scala PartialFunctions joined with
 * orElse) are recognised with a note.
 */

/** "Approver | None", "Optional[Approver]", "Option[Approver]", '"Approver"' -> "Approver" */
const baseType = (t: string | null | undefined): string | null => {
  if (!t) return null;
  let s = t.trim().replace(/^["']|["']$/g, "");
  const opt = s.match(/^(?:Optional|Option)\[(.+)\]$/);
  if (opt) s = opt[1];
  s = s.split("|").map((x) => x.trim()).find((x) => x && x !== "None") ?? "";
  return s.split("[")[0].trim() || null;
};
const optionalType = (t: string | null | undefined) => !!t && /None|Optional\[|Option\[/.test(t);
const LOOPISH = /^(foreach|map|flatMap|fold|getOrElse|orElse|collect|exists|forall)$/;

interface Candidate {
  base: ClassInfo;
  holder: ClassInfo;
  field: FieldInfo;
  family: ClassInfo[];
  concretes: ClassInfo[];
}

/** The field of c that links to the next handler, typed as one of `types` (directly, or via a setter's param). */
function linkField(c: ClassInfo, types: Set<string>, h: Helpers): FieldInfo | undefined {
  // the same handler type, or a sibling handler (typed concretely, which a later check warns about)
  const related = (t: string) => types.has(t) || (!!h.cls(t) && h.ancestors(h.cls(t)!).some((a) => types.has(a) && h.cls(a)));
  const direct = c.fields.find((f) => !f.classLevel && f.type && related(f.type));
  if (direct) return direct;
  for (const mt of c.methods) {
    const p = mt.params.find((x) => types.has(baseType(x.type) ?? ""));
    if (!p) continue;
    const name = mt.assigns.find((a) => c.fields.some((f) => f.name === a && !f.classLevel));
    if (name) return c.fields.find((f) => f.name === name);
  }
  return undefined;
}

/** Handler objects created outside the handler classes (by the client): top-level code or other classes. */
function instancesOf(h: Helpers, names: string[]): { type: string; line: number; by: string | null }[] {
  const set = new Set(names);
  return [
    ...h.model.topCreates.filter((x) => set.has(x.type)).map((x) => ({ ...x, by: null })),
    ...h.classes.filter((c) => !set.has(c.name)).flatMap((c) => c.creates.filter((x) => set.has(x.type)).map((x) => ({ type: x.type, line: x.line, by: c.name })))
  ];
}

function findChain(h: Helpers): Candidate | null {
  let best: Candidate | null = null;
  for (const c of h.classes) {
    const own = new Set([c.name, ...h.ancestors(c)]);
    const field = linkField(c, own, h);
    if (!field) continue;
    // the most general handler type that both c and the field's type belong to
    const ft = field.type ?? baseType(c.methods.flatMap((m) => m.params).find((p) => own.has(baseType(p.type) ?? ""))?.type) ?? c.name;
    const ftCls = h.cls(ft);
    const options = [ft, ...(ftCls ? h.ancestors(ftCls) : [])].filter((n) => own.has(n) && h.cls(n));
    if (!options.length) continue;
    let base: ClassInfo | undefined;
    for (const n of options) {
      const b = h.cls(n)!;
      if (!base || h.implementers(b.name).length > h.implementers(base.name).length) base = b;
    }
    if (!base) continue;
    const family = [base, ...h.implementers(base.name)];
    const concretes = family.filter((x) => x.kind !== "interface" && x.kind !== "abstract");
    const subclasses = h.implementers(base.name);
    // either several handler classes, or one configurable handler class linked to itself (several objects)
    const instances = instancesOf(h, family.map((x) => x.name)).length;
    if (!((subclasses.length && concretes.length >= 2) || (concretes.length && instances >= 2))) continue;
    if (!best || family.length > best.family.length) best = { base, holder: c, field, family, concretes };
  }
  return best;
}

const isSelfish = (r: string) => /^(self|this|super\(\)|super)$/.test(r) || r.startsWith("super");

/** Calls that pass the request on: on the link field, or the same method called on another object (Scala `case Some(n) => n.handle`). */
function forwards(family: ClassInfo[], field: string): { cls: ClassInfo; method: MethodInfo; via: string; line: number } | null {
  const re = new RegExp(`^(self\\.|this\\.)?${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  for (const c of family) for (const mt of c.methods) {
    for (const call of mt.calls) {
      if (!call.receiver) continue;
      if (re.test(call.receiver)) return { cls: c, method: mt, via: LOOPISH.test(call.method) ? mt.name : call.method, line: call.line };
      if (call.method === mt.name && !isSelfish(call.receiver)) return { cls: c, method: mt, via: call.method, line: call.line };
    }
  }
  return null;
}

/** Python: two or more functions returning "X | None" plus a runner; Scala: PartialFunctions joined with orElse. */
function functionalForm(h: Helpers): string | null {
  const m = h.model;
  // middleware style: the LAST parameter is the next step, and the function may call it
  const passing = m.functions.filter((f) => {
    const last = f.params[f.params.length - 1];
    return f.params.length >= 2 && !!last && f.calls.some((c) => c.receiver === null && c.method === last.name);
  });
  if (passing.length >= 2) return `${h.list(passing.map((f) => f.name))} each get the next step as a function and decide whether to call it`;
  if (h.py) {
    const opt = m.functions.filter((f) => optionalType(f.returnType));
    const runner = m.functions.find((f) => !opt.includes(f) && f.params.some((p) => /^(list|List|Sequence|Iterable|tuple)\b/.test(p.type ?? "")));
    if (opt.length >= 2 && runner) return `the functions ${h.list(opt.map((f) => f.name))} each return a result or None, and ${runner.name} tries them in order`;
    return null;
  }
  const orElse = [...m.topCalls, ...m.functions.flatMap((f) => f.calls)].filter((c) => c.method === "orElse");
  return orElse.length ? "the PartialFunctions are joined with orElse, so the first one defined for a request handles it" : null;
}

const rules: PatternRules = {
  slug: "chain-of-responsibility",
  name: "Chain of Responsibility",
  review(m, h) {
    const out: Finding[] = [];
    const cand = findChain(h);

    if (!cand) {
      const fn = functionalForm(h);
      if (fn) {
        const roles = `${fn}.`;
        return {
          found: true, roles, suppress: ["general.branches"],
          findings: [
            { id: "chain-of-responsibility.shape", sev: "pass", title: "Chain of Responsibility found (function form)", text: `${fn.charAt(0).toUpperCase()}${fn.slice(1)}.` },
            { id: "chain-of-responsibility.functional", sev: "note", title: "A light, function-based chain",
              text: "This is the idiomatic form from the lesson: each step is a function, and the chain is just their order. That's a fine choice when handlers keep no state.",
              fix: `If handlers need their own settings or state, move each one into a class that ${h.py ? "inherits from" : "extends"} one handler type and keeps a link to the next.`,
              lesson: "lesson" }
          ]
        };
      }
      const findings: Finding[] = [{
        id: "chain-of-responsibility.no-shape", sev: "fail", title: "The chain isn't there yet",
        text: `I couldn't find a handler type (${h.py ? "a base class or an ABC" : "an abstract class or a trait"}) whose objects keep a link to the next handler, with at least two handlers linked together. In a chain, each handler deals with the request if it can and passes it on otherwise.`,
        fix: `Make one handler type with a handle method and a field for the next handler (set through ${h.words.ctorParam} or a set_next method). Then give each rule its own class that ${h.py ? "inherits from" : "extends"} it.`,
        lesson: "lesson"
      }];
      const b = [
        ...m.functions.flatMap((f) => f.branches.map((x) => ({ who: f.name, ...x }))),
        ...m.classes.flatMap((c) => c.branches.map((x) => ({ who: c.name, ...x })))
      ].sort((a, b2) => b2.count - a.count)[0];
      if (b) findings.push({
        id: "chain-of-responsibility.branches", sev: "note", line: b.line, title: `${b.who} checks ${b.count} cases with ${h.words.ifElse}`,
        text: `Line ${b.line} decides who handles the request in one place. Every new step or a different order means editing it again, which is what the chain replaces.`,
        fix: `Turn each branch into its own handler class, link them in order, and send the request to the first one.`, lesson: "problem"
      });
      return { found: false, findings, suppress: ["general.branches"] };
    }

    const { base, holder, field, family, concretes } = cand;
    const names = family.map((c) => c.name);
    const concreteNames = concretes.filter((c) => c !== base).map((c) => c.name);
    const handlers = concreteNames.length ? concreteNames : concretes.map((c) => c.name);
    const fwd = forwards(family, field.name);
    const handleName = fwd?.via ?? base.methods.find((x) => x.abstract)?.name ?? h.publicMethods(base).find((x) => x !== "__init__") ?? h.name("handle");
    const fieldRef = `${h.py ? "self." : ""}${field.name}`;

    const single = concreteNames.length === 0;
    const roles = single
      ? `${base.name} is the handler, and ${fwd ? `each ${base.name} object keeps the next one in ${field.name} and passes ${handleName} along` : `each ${base.name} object keeps the next one in ${field.name}`}.`
      : `${base.name} is the handler type, ${h.list(handlers)} ${handlers.length > 1 ? "are the links" : "is a link"}, and ${fwd ? `each keeps the next handler in ${field.name} and passes ${handleName} along` : `the next handler is kept in ${field.name}`}.`;
    out.push({ id: "chain-of-responsibility.shape", sev: "pass", title: "Chain of Responsibility shape found", text: roles });

    // 1. passes the request on
    out.push(fwd
      ? { id: "chain-of-responsibility.forwards", sev: "pass", title: "Requests are passed along the chain",
          text: `${fwd.cls.name}.${fwd.method.name} hands the request to the next handler (line ${fwd.line}) when it can't deal with it.` }
      : { id: "chain-of-responsibility.no-forwarding", sev: "warn", line: field.line, title: `Nothing calls the next handler`,
          text: `${holder.name} keeps the next handler in ${field.name}, but no method ever calls it, so a request stops at the first link.`,
          fix: `In ${base.name}.${handleName}, when this handler can't deal with the request, pass it on: ${fieldRef}.${handleName}(request)${h.py ? " (if it isn't None)" : ` (or ${field.name}.map(_.${handleName}(request)) when it is an Option)`}.`, lesson: "lesson" });

    // 2. link typed as the handler type, not a concrete handler
    if (field.type && field.type !== base.name && concreteNames.includes(field.type)) out.push({
      id: "chain-of-responsibility.concrete-next", sev: "warn", line: field.line, title: `${holder.name}.${field.name} is typed as ${field.type}`,
      text: `The next link can only ever be a ${field.type}, so you can't reorder the chain or put a new step in between.`,
      fix: `Type ${field.name} as ${base.name} so any handler can come next (Dependency Inversion).`, lesson: "lesson"
    });
    else out.push({ id: "chain-of-responsibility.next-is-abstract", sev: "pass", title: `The next link is any ${base.name}`,
      text: `${field.name} is typed as ${base.name}, so handlers can be reordered or added without edits.` });

    // 3. handlers don't create their own next link: the client builds the chain
    const selfMade = family.flatMap((c) => h.createsOf(c, names).map((x) => ({ cls: c.name, ...x })));
    if (selfMade.length) {
      const s = selfMade[0];
      out.push({ id: "chain-of-responsibility.creates-next", sev: "warn", line: s.line, title: `${s.cls} creates ${s.type} itself`,
        text: `On line ${s.line}, ${s.cls} builds its own next link, so the order of the chain is fixed inside the handlers. Changing it means editing them (Open/Closed).`,
        fix: `Pass the next handler in through ${h.words.ctorParam} or a set_next method, and build the chain in the client code.`, lesson: "lesson" });
    } else {
      const made = instancesOf(h, names);
      const by = [...new Set(made.map((x) => x.by ?? "the client code"))];
      out.push(made.length >= 2
        ? { id: "chain-of-responsibility.client-builds", sev: "pass", title: "The chain is built from outside",
            text: `${h.list(by).replace(/^t/, "T")} links the handlers together, so the order can change without touching the handler classes.` }
        : { id: "chain-of-responsibility.client-builds", sev: "note", title: "Where is the chain built?",
            text: "I couldn't see code that links the handlers together. The chain is usually assembled once by the client, which then talks only to the first link.",
            fix: h.py ? `chain = ${handlers[0]}(${handlers[1] ?? handlers[0]}())  # then call chain.${handleName}(...)` : `val chain = ${handlers[0]}(Some(${handlers[1] ?? handlers[0]}()))  // then chain.${handleName}(...)` });
    }

    // 4. the end of the chain
    const optional = family.some((c) => [...c.ctorParams, ...c.methods.flatMap((x): Param[] => x.params)]
      .some((p) => names.includes(baseType(p.type) ?? "") && optionalType(p.type)))
      || (field.origin !== "param" && holder.methods.some((x) => x.name !== "__init__" && x.assigns.includes(field.name)));
    if (optional) out.push({ id: "chain-of-responsibility.end-of-chain", sev: "pass", title: "The last link is allowed to have no next",
      text: `The next handler is optional, so the chain can end with None. Make sure the last handler, or the end, gives a sensible default answer.` });
    else out.push({ id: "chain-of-responsibility.end-of-chain", sev: "note", line: field.line, title: "What happens at the end of the chain?",
      text: `${field.name} always needs a next handler, so the last link has nothing to pass to. A request that nobody handles must still get an answer.`,
      fix: h.py ? `Type it as "${base.name} | None" with a default of None, and return a default answer when it is None.` : `Use Option[${base.name}] and handle None with a default answer.`, lesson: "lesson" });

    // 5. the if/elif must not come back inside a handler
    const typeCheck = family.flatMap((c) => c.methods.flatMap((mt) => mt.typeChecks.filter((t) => names.includes(t.type)).map((t) => ({ cls: c.name, mt: mt.name, ...t }))))[0];
    if (typeCheck) out.push({ id: "chain-of-responsibility.type-check", sev: "warn", line: typeCheck.line, title: `${typeCheck.cls} checks which handler comes next`,
      text: `${typeCheck.cls}.${typeCheck.mt} checks for ${typeCheck.type} (line ${typeCheck.line}). Handlers should not know who the other links are.`,
      fix: `Just pass the request to ${fieldRef}; each handler decides for itself.`, lesson: "lesson" });
    const big = family.flatMap((c) => c.branches.filter((b) => b.count >= 3).map((b) => ({ cls: c.name, ...b })))[0];
    if (big) out.push({ id: "chain-of-responsibility.branches-in-handler", sev: "warn", line: big.line, title: `${big.cls} still decides ${big.count} cases with ${h.words.ifElse}`,
      text: `Line ${big.line} handles several cases in one handler, which is the old if/elif chain again.`,
      fix: "Give each case its own handler class and link them, so every handler checks one thing (Single Responsibility).", lesson: "lesson" });

    return { found: true, findings: out, roles, suppress: ["general.branches"] };
  }
};

export default rules;
