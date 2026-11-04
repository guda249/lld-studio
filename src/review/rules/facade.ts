import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo, Call } from "../model";
import type { Helpers } from "../helpers";

/**
 * Facade: one class that holds (or makes) several subsystem objects and offers a simple method that
 * coordinates two or more of them. Lighter forms are accepted too: a Python module function that calls
 * private `_helpers`, or a Scala `object` whose public method calls its own helpers.
 */

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Which subsystem classes does this method talk to? Through a field, or through `Type()` made on the spot. */
function usesIn(mt: MethodInfo, fieldTypes: Map<string, string>, subs: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const c of mt.calls) {
    if (!c.receiver) continue;
    const r = c.receiver.replace(/^(self\.|this\.)/, "").split(".")[0];
    const t = fieldTypes.get(r);
    if (t) { out.add(t); continue; }
    const made = c.receiver.match(/^([A-Z]\w*)\(/);
    if (made && subs.has(made[1])) out.add(made[1]);
  }
  return out;
}

/** Field name -> subsystem class name, for fields of c that point at another class in the code. */
function subsystemFields(c: ClassInfo, known: Set<string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of c.fields) {
    const t = [f.type, f.elementType, ...f.created].find((x) => x && x !== c.name && known.has(x));
    if (t) map.set(f.name, t);
  }
  return map;
}

/** Calls (in a function or loose top-level code) that use methods owned by subsystem classes. */
function orchestrated(calls: Call[], owner: Map<string, string>): { classes: string[]; line: number } {
  const hit = calls.filter((c) => c.receiver !== null && owner.has(c.method));
  return { classes: [...new Set(hit.map((c) => owner.get(c.method)!))], line: hit[0]?.line ?? 0 };
}

function methodOwners(subs: ClassInfo[], skip: Set<string>): Map<string, string> {
  const owner = new Map<string, string>();
  const dup = new Set<string>();
  for (const s of subs) for (const mt of s.methods) {
    if (mt.name.startsWith("__") || mt.name.startsWith("<") || skip.has(mt.name)) continue;
    if (owner.has(mt.name) && owner.get(mt.name) !== s.name) dup.add(mt.name);
    owner.set(mt.name, s.name);
  }
  for (const d of dup) owner.delete(d);
  return owner;
}

function smellNote(h: Helpers): Finding | null {
  const m = h.model;
  const owner = methodOwners(m.classes, new Set());
  for (const fn of m.functions) {
    const o = orchestrated(fn.calls, owner);
    if (o.classes.length >= 3) return {
      id: "facade.client-choreography", sev: "note", line: o.line,
      title: `${fn.name} talks to ${o.classes.length} services itself`,
      text: `${fn.name} calls ${h.list(o.classes)} one after another (from line ${o.line}). Every caller that repeats this sequence has to keep the steps and their order right, and has to change when the flow changes.`,
      fix: "Move this sequence into one method on a new facade class that holds those services, and let callers make that one call instead.",
      lesson: "problem"
    };
  }
  return null;
}

const rules: PatternRules = {
  slug: "facade",
  name: "Facade",
  review(m, h) {
    const out: Finding[] = [];
    const known = new Set(m.classes.map((c) => c.name));

    // 1. Classic form: the class whose single method coordinates the most subsystem classes.
    let best: { facade: ClassInfo; fields: Map<string, string>; entry: MethodInfo; used: Set<string> } | null = null;
    for (const c of m.classes) {
      if (c.kind === "interface") continue;
      const fields = subsystemFields(c, known);
      const others = new Set([...known].filter((x) => x !== c.name));
      for (const mt of c.methods) {
        if (mt.abstract) continue;
        const used = usesIn(mt, fields, others);
        if (used.size >= 2 && (!best || used.size > best.used.size)) best = { facade: c, fields, entry: mt, used };
      }
    }

    if (!best) {
      // 2. Lighter forms from the idiomatic lesson.
      if (h.py) {
        const helpers = new Set(m.functions.filter((f) => f.name.startsWith("_") && !f.name.startsWith("__")).map((f) => f.name));
        const entry = m.functions.find((f) => !f.name.startsWith("_") && new Set(f.calls.filter((c) => c.receiver === null && helpers.has(c.method)).map((c) => c.method)).size >= 2);
        if (entry) {
          const hidden = [...new Set(entry.calls.filter((c) => c.receiver === null && helpers.has(c.method)).map((c) => c.method + "()"))];
          const roles = `the module function ${entry.name}() is the facade and hides ${h.list(hidden)}.`;
          out.push({ id: "facade.shape", sev: "pass", title: "Facade shape found (module form)", text: `In this module, ${roles}` });
          out.push({ id: "facade.module-form", sev: "note", line: entry.line, title: "A module works as a facade",
            text: "This is the lighter Python form from the lesson: one public function and private helpers with a leading underscore. It is a good choice when the parts have no state worth injecting. Use a class when callers need several facades with different services, or when you want to pass in fakes for testing." });
          return { found: true, findings: out, roles: roles.replace(/^the/, "The") };
        }
      } else {
        for (const c of m.classes.filter((x) => x.kind === "object")) {
          const own = new Set(c.methods.map((x) => x.name));
          const entry = c.methods.find((mt) => new Set(mt.calls.filter((x) => (x.receiver === null || x.receiver === "this") && own.has(x.method) && x.method !== mt.name).map((x) => x.method)).size >= 2);
          if (entry) {
            const hidden = [...new Set(entry.calls.filter((x) => (x.receiver === null || x.receiver === "this") && own.has(x.method) && x.method !== entry.name).map((x) => x.method))];
            const roles = `the object ${c.name} is the facade: ${entry.name} coordinates ${h.list(hidden)}.`;
            out.push({ id: "facade.shape", sev: "pass", title: "Facade shape found (object form)", text: `Here ${roles}` });
            out.push({ id: "facade.object-form", sev: "note", line: entry.line, title: "A singleton object works as a facade",
              text: `This is the lighter Scala form from the lesson. Mark ${h.list(hidden)} as private so callers can only use ${entry.name}. (The review can't see private, so check this yourself.) Use a class with constructor parameters when you want to pass in different services, for example fakes in tests.` });
            return { found: true, findings: out, roles: roles.replace(/^the/, "The") };
          }
        }
      }

      // 3. Not found: say what is missing, and point at the smell.
      const nearMiss = m.classes.map((c) => ({ c, f: subsystemFields(c, known) })).find((x) => new Set(x.f.values()).size >= 2);
      if (nearMiss) {
        const types = [...new Set(nearMiss.f.values())];
        out.push({ id: "facade.no-coordination", sev: "fail", line: nearMiss.c.line, title: `${nearMiss.c.name} holds services but doesn't coordinate them`,
          text: `${nearMiss.c.name} keeps ${h.list(types)} in fields, but no single method calls two or more of them. A facade's job is to run a multi-step flow for the caller.`,
          fix: `Add one method on ${nearMiss.c.name} that runs the whole flow: it calls ${h.list([...nearMiss.f.keys()].map((f) => (h.py && !f.startsWith("self.") ? "self." : "") + f))} in the right order, so callers make one call instead of several.`, lesson: "lesson" });
      } else {
        out.push({ id: "facade.no-shape", sev: "fail", title: "The Facade shape isn't there yet",
          text: "I couldn't find a class that holds two or more other classes (the subsystem) and offers one method that calls them in order.",
          fix: `Create a facade class that receives the services through ${h.words.ctorParam}, and give it one method that runs the whole flow.`, lesson: "lesson" });
      }
      const smell = smellNote(h);
      if (smell) out.push(smell);
      return { found: false, findings: out };
    }

    const { facade, fields, entry, used } = best;
    const subs = [...new Set([...fields.values(), ...used])];
    const subClasses = subs.map((s) => h.cls(s)).filter((x): x is ClassInfo => !!x);
    const roles = `${facade.name} is the facade, and its ${entry.name} method coordinates ${h.list([...used])}.`;
    out.push({ id: "facade.shape", sev: "pass", title: "Facade shape found", text: roles });

    // The subsystem must not know the facade (otherwise it is a Mediator, and the layers are tangled).
    const knows = subClasses.find((s) => h.fieldsOfType(s, [facade.name]).length || h.createsOf(s, [facade.name]).length
      || s.methods.some((mt) => mt.params.some((p) => p.type && new RegExp(`\\b${esc(facade.name)}\\b`).test(p.type))));
    if (knows) {
      const f = h.fieldsOfType(knows, [facade.name])[0];
      out.push({ id: "facade.subsystem-knows-facade", sev: "warn", line: f?.line ?? knows.line, title: `${knows.name} knows about ${facade.name}`,
        text: `${knows.name} is part of the subsystem, but it refers back to ${facade.name}. The subsystem should not know the facade exists: it should work on its own, so other code can still use it directly. When the parts talk to each other through a central class, that is the Mediator pattern instead.`,
        fix: `Remove the ${facade.name} reference from ${knows.name}; let ${facade.name} call ${knows.name}, never the other way round.`, lesson: "confused" });
    } else out.push({ id: "facade.subsystem-independent", sev: "pass", title: "The subsystem doesn't know the facade",
      text: `${h.list(subs)} work on their own, so code that needs fine control can still use them directly.` });

    // Coordination, not business rules.
    // A chain whose first test calls a service ("if not seats.lock(...) ... else if not pay(...)") is a
    // sequence of step guards, which is coordination; a chain on plain data is a business rule.
    const guardLine = (mt: MethodInfo, line: number) => usesIn({ ...mt, calls: mt.calls.filter((c) => c.line === line) }, fields, new Set(subs)).size > 0;
    const rulesHere = facade.methods.map((mt) => ({ mt, b: mt.branches.find((x) => x.count >= 3 && !guardLine(mt, x.line)), t: mt.typeChecks[0] })).find((x) => x.b || x.t);
    if (rulesHere) {
      const line = rulesHere.b?.line ?? rulesHere.t!.line;
      out.push({ id: "facade.business-logic", sev: "warn", line, title: `${facade.name} is making decisions itself`,
        text: `${facade.name}.${rulesHere.mt.name} ${rulesHere.b ? `chooses between ${rulesHere.b.count} cases with ${h.words.ifElse}` : `checks types with ${h.words.typeCheck}`} (line ${line}). A facade should only coordinate: call the services in the right order. Rules like this grow it into a "god object" (one class that does everything), which breaks Single Responsibility.`,
        fix: `Move the decision into the service that owns that knowledge (or a small class of its own), and let ${facade.name} just call it.`, lesson: "when" });
    } else out.push({ id: "facade.coordinates-only", sev: "pass", title: `${facade.name} only coordinates`,
      text: `${facade.name} calls the services in order and leaves the real work to them.` });

    // Created inside vs passed in.
    const made = facade.creates.filter((x) => subs.includes(x.type));
    if (made.length) out.push({ id: "facade.creates-subsystem", sev: "note", line: made[0].line, title: `${facade.name} creates ${h.list([...new Set(made.map((x) => x.type))])} itself`,
      text: `That is fine for a start. Passing the services in through ${h.words.ctorParam} instead lets you share them with other code and swap in fakes when testing (Dependency Inversion).`,
      fix: `Take ${h.list([...new Set(made.map((x) => x.type))])} as constructor parameters, and create them in the client code.` });

    // Leaking a subsystem object defeats the simple surface.
    const fieldRe = (f: string) => new RegExp(`^(self\\.|this\\.)?${esc(f)}$`);
    const leak = facade.methods.filter((mt) => !mt.name.startsWith("_") && mt.name !== "<init>")
      .map((mt) => ({ mt, f: [...fields.keys()].find((f) => mt.returns.some((r) => fieldRe(f).test(r.trim()))) })).find((x) => x.f);
    if (leak) out.push({ id: "facade.leaks-subsystem", sev: "warn", line: leak.mt.line, title: `${facade.name}.${leak.mt.name} hands out ${leak.f}`,
      text: `${leak.mt.name} returns the ${fields.get(leak.f!)} object itself, so callers go back to talking to the subsystem and depending on it. The point of a facade is a smaller surface.`,
      fix: `Add a facade method for what callers need from ${fields.get(leak.f!)}, or let the few callers that need full control create and use ${fields.get(leak.f!)} directly, side by side with the facade.`, lesson: "lesson" });

    // A simple surface: not too many public methods.
    const pub = facade.methods.filter((mt) => !mt.name.startsWith("_") && mt.name !== "<init>" && !mt.abstract);
    if (pub.length > 7) out.push({ id: "facade.too-wide", sev: "warn", line: facade.line, title: `${facade.name} has ${pub.length} public methods`,
      text: `A facade is meant to offer a small, simple surface (Interface Segregation). With ${pub.length} public methods it is turning into a copy of the whole subsystem.`,
      fix: `Keep the few flows most callers need. Split the rest into a second facade for a different kind of caller, or let those callers use the services directly.`, lesson: "when" });
    else out.push({ id: "facade.small-surface", sev: "pass", title: "A small, simple surface",
      text: `${facade.name} offers ${pub.length} public method${pub.length === 1 ? "" : "s"}, so callers depend on one class instead of ${subs.length} services.` });

    // Callers that still run the multi-service sequence themselves.
    const owner = methodOwners(subClasses, new Set(facade.methods.map((x) => x.name)));
    const fnLines = new Set(m.functions.flatMap((f) => f.calls.map((c) => `${c.line}:${c.method}`)));
    const callers = [
      ...m.functions.map((f) => ({ name: f.name, calls: f.calls })),
      { name: "the top-level code", calls: m.topCalls.filter((c) => !fnLines.has(`${c.line}:${c.method}`)) },
      ...m.classes.filter((c) => c !== facade && !subs.includes(c.name)).flatMap((c) => c.methods.map((mt) => ({ name: `${c.name}.${mt.name}`, calls: mt.calls })))
    ];
    for (const cl of callers) {
      const o = orchestrated(cl.calls, owner);
      if (o.classes.length >= 2) {
        out.push({ id: "facade.client-bypasses", sev: "warn", line: o.line, title: `${cl.name} still runs the flow itself`,
          text: `${cl.name} calls ${h.list(o.classes)} directly (from line ${o.line}), even though ${facade.name} offers ${entry.name}. Now there are two copies of the sequence to keep in step.`,
          fix: `Call ${facade.name}.${entry.name}(...) here instead. Using one service directly for a special case is fine; repeating the multi-step flow is not.`, lesson: "problem" });
        break;
      }
    }

    return { found: true, findings: out, roles, suppress: rulesHere ? ["general.branches"] : [] };
  }
};

export default rules;
