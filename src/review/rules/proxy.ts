import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo, Call } from "../model";
import type { Helpers } from "../helpers";

/**
 * Proxy: a class that implements the same interface as the real object, holds (or lazily creates) the real
 * object, and controls access to it before forwarding: a permission check, lazy creation, a cache, a rate
 * limit, logging. Python's __getattr__ forwarding and a Scala class without a shared trait are accepted as
 * lighter forms with a note or a warning.
 */

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const a = (w: string) => (/^[AEIOU]/i.test(w) ? "an " : "a ") + w;
const CTOR = new Set(["__init__", "<init>", "__post_init__"]);

/** Is this call made on the field (self.f, this.f, f, f.get, self.f.x ...)? */
const onField = (c: Call, f: string) => !!c.receiver && new RegExp(`^(self\\.|this\\.)?${esc(f)}(\\.|\\(|$)`).test(c.receiver);

interface Candidate { proxy: ClassInfo; field: string; realType: string; subject: ClassInfo | null; forwards: MethodInfo[]; remote?: boolean }

/** Does the method do something besides forwarding (the "control" part of a proxy)? */
function controls(mt: MethodInfo, field: string, real: string): string | null {
  if (mt.creates.some((x) => x.type === real)) return "creates the real object on first use";
  if (mt.calls.some((c) => c.receiver === null && /(Error|Exception|Denied|Forbidden)$/.test(c.method))) return "refuses some calls";
  if (mt.branches.length) return "decides when to forward";
  const other = mt.calls.filter((c) => !onField(c, field));
  if (other.length) return "does its own work around the call";
  if (mt.assigns.length) return "keeps state about the calls";
  // Python: several return paths, or answering from another field (a cache), means the call is controlled.
  if (mt.returns.length > 1) return "decides when to forward";
  if (mt.returns.some((r) => /^(self\.|this\.)\w+/.test(r) && !new RegExp(`^(self\\.|this\\.)?${esc(field)}\\b`).test(r))) return "answers some calls itself";
  return null;
}

/**
 * The model doesn't record a single `if` (only if/elif chains) or `throw` of library exceptions, so a
 * proxy that holds extra state next to the real object (a role, a cache, a limit) is taken as controlling.
 */
function extraState(c: ClassInfo, field: string): string[] {
  return c.fields.filter((f) => f.name !== field && !f.classLevel).map((f) => f.name);
}

function forwardingMethods(c: ClassInfo, field: string): MethodInfo[] {
  return c.methods.filter((mt) => !CTOR.has(mt.name) && mt.calls.some((x) => onField(x, field)));
}

function smell(h: Helpers): Finding | null {
  // Several functions call the same class directly, each guarding it its own way.
  const m = h.model;
  for (const c of m.classes) {
    const users = m.functions.filter((f) => f.params.some((p) => p.type && new RegExp(`\\b${esc(c.name)}\\b`).test(p.type)));
    if (users.length >= 2) return {
      id: "proxy.callers-guard", sev: "note", line: users[0].line, title: `${h.list(users.map((u) => u.name))} all use ${c.name} directly`,
      text: `Each of them talks to ${c.name} itself, so each must repeat any check (who may call it, whether it is ready yet). One forgotten copy is a bug or a leak.`,
      fix: `Put an interface in front of ${c.name}, add a proxy class that implements it and does the check once, and type these parameters as the interface.`,
      lesson: "problem"
    };
  }
  return null;
}

const rules: PatternRules = {
  slug: "proxy",
  name: "Proxy",
  review(m, h) {
    const out: Finding[] = [];
    const known = new Set(m.classes.map((c) => c.name));

    // 1. Classic form: P implements S and holds an S (or an implementer of S).
    const cands: Candidate[] = [];
    for (const s of h.abstractions()) {
      const family = [s.name, ...h.implementers(s.name).map((c) => c.name)];
      for (const p of h.implementers(s.name, { concreteOnly: true })) {
        for (const f of h.fieldsOfType(p, family.filter((x) => x !== p.name))) {
          const realType = [f.type, f.elementType, ...f.created].find((t) => t && family.includes(t) && t !== p.name)!;
          const fw = forwardingMethods(p, f.name);
          cands.push({ proxy: p, field: f.name, realType, subject: s, forwards: fw });
        }
      }
    }
    // 2. No shared interface: P holds an R (any class) and has methods with R's names that forward to it.
    if (!cands.some((c) => c.forwards.length)) for (const p of m.classes) {
      for (const f of p.fields) {
        const r = h.cls([f.type, f.elementType, ...f.created].find((t) => t && known.has(t) && t !== p.name));
        if (!r) continue;
        const names = new Set(r.methods.map((x) => x.name).filter((n) => !CTOR.has(n)));
        const fw = forwardingMethods(p, f.name).filter((mt) => names.has(mt.name));
        if (fw.length) cands.push({ proxy: p, field: f.name, realType: r.name, subject: null, forwards: fw });
      }
      // Scala idiomatic: `lazy val real = factory()` has no type; match forwarded calls by R's method names.
      if (!h.py) for (const f of p.fields.filter((x) => !x.type)) {
        const fw = forwardingMethods(p, f.name);
        const r = m.classes.find((rc) => rc !== p && fw.some((mt) => rc.methods.some((x) => x.name === mt.name) && mt.calls.some((c) => onField(c, f.name) && c.method === mt.name)));
        if (r && !cands.some((c) => c.proxy === p)) cands.push({ proxy: p, field: f.name, realType: r.name, subject: null, forwards: fw.filter((mt) => r.methods.some((x) => x.name === mt.name)) });
      }
    }
    // 2b. Remote proxy: implements S and turns calls into messages through a function field (send / transport).
    if (!cands.some((c) => c.forwards.length)) for (const s of h.abstractions()) {
      for (const p of h.implementers(s.name, { concreteOnly: true })) {
        const fnField = p.fields.find((f) => /Callable|=>/.test(p.ctorParams.find((x) => x.name === f.name)?.type ?? f.type ?? ""));
        if (!fnField) continue;
        const callsFn = (mt: MethodInfo) => mt.calls.some((c) => c.method === fnField.name && (c.receiver === null || /^(self|this)$/.test(c.receiver)));
        const helpers = new Set(p.methods.filter(callsFn).map((x) => x.name));
        const fw = p.methods.filter((mt) => !CTOR.has(mt.name) && (callsFn(mt) || mt.calls.some((c) => helpers.has(c.method))));
        const real = h.implementers(s.name, { concreteOnly: true }).find((x) => x !== p);
        if (fw.length) cands.push({ proxy: p, field: fnField.name, realType: real?.name ?? s.name, subject: s, forwards: fw, remote: true });
      }
    }
    const best = cands.filter((c) => c.forwards.length).sort((a, b) => (b.subject ? 1 : 0) - (a.subject ? 1 : 0) || b.forwards.length - a.forwards.length)[0];

    // 3. Python's generic proxy: __getattr__ forwarding to a wrapped object.
    if (!best && h.py) {
      const gp = m.classes.find((c) => c.methods.some((mt) => mt.name === "__getattr__" && mt.calls.some((x) => x.method === "getattr")));
      if (gp) {
        const realType = [...gp.fields.flatMap((f) => [f.elementType, f.type]), ...gp.methods.map((mt) => mt.returnType)].find((t) => t && known.has(t) && t !== gp.name);
        const lazy = gp.methods.some((mt) => mt.decorators.some((d) => /^(cached_property|cache|lru_cache)/.test(d.trim())));
        const roles = `${gp.name} is the proxy and forwards every attribute${realType ? ` to a ${realType}` : ""} through __getattr__${lazy ? ", building it on first use" : ""}.`;
        out.push({ id: "proxy.shape", sev: "pass", title: "Proxy shape found (generic form)", text: roles });
        out.push({ id: "proxy.getattr-form", sev: "note", line: gp.methods.find((x) => x.name === "__getattr__")!.line, title: "__getattr__ makes a generic proxy",
          text: `This is the lighter Python form from the lesson: __getattr__ runs only for names ${gp.name} doesn't have, and forwards them to the real object, so one small class can stand in for any class. The cost is that tools and readers can't see which methods exist; when the interface matters, write a proxy class that implements the ${h.words.ifaceShort} instead.` });
        return { found: true, findings: out, roles };
      }
    }

    if (!best) {
      out.push({ id: "proxy.no-shape", sev: "fail", title: "The Proxy shape isn't there yet",
        text: `I couldn't find a class that stands in for another one: same interface (${h.words.iface}), holds the real object, and passes calls on to it.`,
        fix: `Put an interface in front of the real class, make a proxy class that implements it too, give the proxy a field for the real object, and have each method check what it needs before calling the real one.`,
        lesson: "lesson" });
      const s = smell(h);
      if (s) out.push(s);
      return { found: false, findings: out };
    }

    const { proxy, field, realType, subject, forwards, remote } = best;
    const realCls = h.cls(realType);
    const realIsIface = !!realCls && h.isAbstraction(realCls);
    // Scala: "lazy val real = factory()" with a function parameter is lazy creation (the model can't see "lazy").
    const factoryParam = !h.py && proxy.ctorParams.some((p) => p.type && /=>/.test(p.type) && p.name !== field);
    const lazy = forwards.some((mt) => mt.creates.some((x) => x.type === realType)) || factoryParam;
    const ctrl = forwards.map((mt) => ({ mt, why: remote ? "turns the call into a message for the real object elsewhere" : controls(mt, field, realType) }));
    const extra = extraState(proxy, field).filter((f) => !(factoryParam && proxy.ctorParams.some((p) => p.name === f)));
    const control = ctrl.find((x) => x.why)
      ?? (factoryParam ? { mt: forwards[0], why: "creates the real object through a factory on first use" } : null)
      ?? (extra.length ? { mt: forwards[0], why: `keeps ${h.list(extra)} next to the real object to decide how calls are handled` } : null);
    const kind = remote ? "remote" : lazy ? "virtual (lazy)" : control?.why === "refuses some calls" ? "protection" : null;
    const roles = subject
      ? `${subject.name} is the subject, ${realIsIface ? `any ${realType}` : realType} is the real object, and ${proxy.name} is the ${kind ? kind + " " : ""}proxy that stands in for it.`
      : `${proxy.name} is the ${kind ? kind + " " : ""}proxy in front of ${realType}.`;
    out.push({ id: "proxy.shape", sev: "pass", title: "Proxy shape found", text: roles });

    // Same interface, so clients can't tell the difference.
    if (subject) out.push({ id: "proxy.same-interface", sev: "pass", title: `${proxy.name} and ${realType} share ${subject.name}`,
      text: `Code that expects ${a(subject.name)} works with either one, so the proxy can be slipped in without changing callers (Liskov Substitution).` });
    else {
      const iface = realCls ? h.abstractions().find((a) => h.isA(realCls, a.name)) : undefined;
      const msg = iface
        ? { sev: "warn" as const, text: `${realType} implements ${iface.name}, but ${proxy.name} doesn't, so code that expects ${a(iface.name)} can't be given the proxy.`, fix: `Make ${proxy.name} ${h.py ? `inherit from ${iface.name}` : `extend ${iface.name}`}.` }
        : { sev: "note" as const, text: `${proxy.name} copies ${realType}'s method names, which works as long as callers only call those methods. Without a shared ${h.words.ifaceShort}, though, a function typed to take ${a(realType)} won't accept the proxy, and nothing checks that the two stay in step.`,
            fix: `Add ${h.words.iface} with ${h.list(forwards.map((x) => x.name))}, and make both ${realType} and ${proxy.name} implement it.` };
      out.push({ id: "proxy.no-shared-interface", sev: msg.sev, line: proxy.line, title: `${proxy.name} doesn't share an interface with ${realType}`, text: msg.text, fix: msg.fix, lesson: "lesson" });
    }

    // The proxy must add control, otherwise it's just a pass-through wrapper.
    if (control) out.push({ id: "proxy.controls", sev: "pass", title: `${proxy.name} controls access`,
      text: `${proxy.name}${control.why!.startsWith("keeps") ? "" : "." + control.mt.name} ${control.why}. That control is what makes it a proxy rather than a plain wrapper.` });
    else out.push({ id: "proxy.no-control", sev: "warn", line: forwards[0].line, title: `${proxy.name} only passes calls on`,
      text: `Every method of ${proxy.name} just calls the real object and returns the result. A proxy earns its place by controlling access: checking permission, creating the real object only when first needed, caching results, or limiting calls.`,
      fix: `Add the control you need in ${proxy.name}.${forwards[0].name}, for example ${h.py ? `"if self._real is None: self._real = ${realIsIface ? "..." : realType + "()"}"` : `"if real.isEmpty then real = Some(${realIsIface ? "..." : realType + "()"})"`} for lazy creation, or a permission check before the call.`, lesson: "lesson" });

    // Every interface method should be forwarded (or deliberately refused).
    if (subject && !remote) {
      const abstractNames = subject.methods.filter((x) => x.abstract).map((x) => x.name);
      const dead = proxy.methods.find((mt) => abstractNames.includes(mt.name) && !forwards.includes(mt) && !mt.calls.some((c) => c.receiver === null && /(Error|Exception)$/.test(c.method)));
      if (dead) out.push({ id: "proxy.method-not-forwarded", sev: "warn", line: dead.line, title: `${proxy.name}.${dead.name} never reaches the real object`,
        text: `${dead.name} is part of ${subject.name}, but the proxy answers it on its own without calling ${realType}. Callers expect the same behaviour as the real object.`,
        fix: `Forward it: call ${h.py ? "self." : ""}${field.replace(/^self\./, "")}.${dead.name}(...) after any checks, or raise an error if the call is not allowed.`, lesson: "lesson" });
    }

    // Created up front vs on demand.
    const eager = proxy.creates.find((x) => x.type === realType && x.inCtor);
    if (lazy) out.push({ id: "proxy.lazy", sev: "pass", title: `${realType} is created only when needed`,
      text: `${proxy.name} builds the real object on the first call that needs it, so nothing expensive happens for callers that never use it.` });
    else if (eager) out.push({ id: "proxy.eager-real", sev: "note", line: eager.line, title: `${proxy.name} creates ${realType} up front`,
      text: `The real object is built as soon as the proxy is, even if no call is ever allowed or made. That's fine when it's cheap; for an expensive object, create it on the first call instead (a virtual proxy).`,
      fix: h.py ? `Start with self.${field} = None and create it inside the method when it is still None.` : `Use private lazy val ${field} = ${realType}(), or a var holding an Option set on first use.` });

    // Clients should depend on the interface.
    if (subject && !remote) {
      const concrete = [proxy.name, ...h.implementers(subject.name, { concreteOnly: true }).map((c) => c.name)];
      const fn = m.functions.map((f) => ({ f, p: f.params.find((p) => p.type && concrete.some((n) => new RegExp(`\\b${esc(n)}\\b`).test(p.type!))) })).find((x) => x.p);
      if (fn) out.push({ id: "proxy.client-concrete", sev: "warn", line: fn.f.line, title: `${fn.f.name} asks for ${a(fn.p!.type!)}`,
        text: `The parameter ${fn.p!.name} is typed as a concrete class, so you can't pass the ${fn.p!.type === proxy.name ? "real object" : "proxy"} instead. The whole point of a proxy is that clients can't tell the difference.`,
        fix: `Type ${fn.p!.name} as ${subject.name} (Dependency Inversion).`, lesson: "lesson" });
    }

    return { found: true, findings: out, roles };
  }
};

export default rules;
