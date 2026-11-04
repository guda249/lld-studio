import type { PatternRules, Finding } from "../types";
import type { ClassInfo, FieldInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Mediator: colleagues hold a link to one mediator (ideally typed as its interface) and talk only through it;
 * the concrete mediator holds the colleagues and calls them back. Many-to-many links become many-to-one.
 * The lighter idiomatic form, an event bus (topic -> list of handlers), is recognised with a note.
 */
const ADD = /^(append|add|insert|addOne|\+=|setdefault)$/;

const unquote = (t: string | null) => (t ? t.replace(/^["']|["']$/g, "") : t);
const isSelf = (r: string | null) => r !== null && /^(self|this)$/.test(r);
const fieldRe = (name: string) => new RegExp(`^(self\\.|this\\.)?${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
const typesOf = (f: FieldInfo) => [unquote(f.type), unquote(f.elementType), ...f.created].filter(Boolean) as string[];

interface Candidate {
  hub: ClassInfo;
  iface: ClassInfo | undefined;
  colleagues: ClassInfo[];
  /** colleague -> the field that points at the mediator (may live on a colleague base class) */
  links: Map<ClassInfo, FieldInfo>;
  held: FieldInfo[];
}

/** Every method name a class (and its bases) declares. */
function methodNames(h: Helpers, c: ClassInfo): Set<string> {
  const names = new Set<string>();
  for (const k of [c, ...h.ancestors(c).map((n) => h.cls(n)).filter(Boolean) as ClassInfo[]])
    for (const mt of k.methods) if (!/^__\w+__$/.test(mt.name)) names.add(mt.name);
  return names;
}

/** The field of colleague c (or of one of its bases) that points at the mediator. */
function mediatorField(h: Helpers, c: ClassInfo, medTypes: Set<string>, medMethods: Set<string>): FieldInfo | undefined {
  for (const k of [c, ...h.ancestors(c).map((n) => h.cls(n)).filter(Boolean) as ClassInfo[]]) {
    const typed = k.fields.find((f) => typesOf(f).some((t) => medTypes.has(t)));
    if (typed) return typed;
    // untyped field: recognise it by what is called on it
    const untyped = k.fields.find((f) => !f.type && h.callsOnField(k, f.name).some((x) => medMethods.has(x.call.method)));
    if (untyped) return untyped;
    // the model misses tuple assignments (self.a, self.b = a, b): fall back to calls on self.<x> plus a typed constructor parameter
    for (const mt of k.methods) for (const x of mt.calls) {
      const mm = x.receiver?.match(/^(?:self|this)\.(\w+)$/);
      if (!mm || !medMethods.has(x.method)) continue;
      const p = k.ctorParams.find((q) => unquote(q.type?.replace(/\s*\|.*$/, "") ?? null) && medTypes.has(unquote(q.type!.replace(/\s*\|.*$/, ""))!));
      if (!p && !k.ctorParams.some((q) => mm[1].replace(/^_+/, "") === q.name)) continue;
      return { name: mm[1], line: k.methods.find((y) => y.name === "__init__")?.line ?? k.line, type: p ? unquote(p.type!.replace(/\s*\|.*$/, "")) : null,
        origin: "param", created: [], classLevel: false, elementType: null };
    }
  }
  return undefined;
}

function candidates(h: Helpers): Candidate[] {
  const out: Candidate[] = [];
  for (const hub of h.concretes()) {
    const anc = h.ancestors(hub);
    const medTypes = new Set([hub.name, ...anc]);
    const medMethods = methodNames(h, hub);
    const links = new Map<ClassInfo, FieldInfo>();
    for (const c of h.classes) {
      if (c === hub || anc.includes(c.name) || h.isA(c, hub.name)) continue;
      const f = mediatorField(h, c, medTypes, medMethods);
      if (f) links.set(c, f);
    }
    if (!links.size) continue;
    const collNames = new Set([...links.keys()].flatMap((c) => [c.name, ...h.ancestors(c)]));
    let held = hub.fields.filter((f) => typesOf(f).some((t) => collNames.has(t)));
    if (!held.length && hub.methods.some((mt) => mt.params.some((p) => collNames.has(unquote(p.type?.replace(/\s*\|.*$/, "") ?? null) ?? ""))))
      held = hub.fields.filter((f) => f.origin === "collection" && !f.type?.match(/^(set|Set)$/)).slice(0, 1); // untyped list/dict of colleagues
    if (!held.length) continue;
    const ifaceName = [...links.values()].flatMap(typesOf).find((t) => anc.includes(t) && h.isAbstraction(h.cls(t)!))
      ?? anc.find((n) => { const k = h.cls(n); return !!k && h.isAbstraction(k); });
    const colleagues = [...links.keys()];
    out.push({ hub, iface: h.cls(ifaceName), colleagues, links, held });
  }
  // a real mediator holds many colleagues (a collection, or several fields) while each colleague holds ONE mediator
  const score = (c: Candidate) => c.colleagues.length + (c.iface ? 0.5 : 0)
    + (c.held.some((f) => f.origin === "collection") || c.held.length >= 2 ? 1 : 0)
    + ([...c.links.values()].every((f) => f.origin !== "collection") ? 1 : 0);
  return out.sort((a, b) => score(b) - score(a));
}

/** Event bus: a map of topic -> handlers, a subscribe(topic, handler) and a publish that loops over handlers. */
function eventBus(h: Helpers) {
  for (const c of h.classes) for (const f of c.fields) {
    if (f.origin !== "collection" && !f.elementType) continue;
    const starts = new RegExp(`^(self\\.|this\\.)?${f.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    const sub = c.methods.find((mt) => mt.params.filter((p) => p.name !== "self").length >= 2
      && mt.calls.some((x) => x.receiver && starts.test(x.receiver) && !fieldRe(f.name).test(x.receiver) && ADD.test(x.method)));
    const pub = c.methods.find((mt) => mt !== sub && mt.loopsOver.includes(f.name));
    if (sub && pub) return { bus: c, field: f, sub, pub };
  }
  return undefined;
}

const rules: PatternRules = {
  slug: "mediator",
  name: "Mediator",
  review(m, h) {
    const out: Finding[] = [];
    const best = candidates(h)[0];

    if (!best) {
      const bus = eventBus(h);
      if (bus) {
        const roles = `${bus.bus.name} is the mediator: senders call ${bus.pub.name} with a topic, and ${bus.bus.name} passes it to every handler registered with ${bus.sub.name} for that topic.`;
        return { found: true, roles, findings: [
          { id: "mediator.shape", sev: "pass", title: "Mediator shape found (event bus)", text: roles },
          { id: "mediator.event-bus", sev: "note", line: bus.bus.line, title: "This is the event-bus form of Mediator",
            text: `${bus.bus.name} is the lighter, idiomatic form from the lesson: senders and listeners share only topic names and never know each other. It fits when the rules are simple "pass it on" rules.`,
            fix: `If the routing grows real rules (who may talk to whom, muting, ordering), move them into a mediator class whose colleagues each hold a link to it.`, lesson: "idiomatic" }
        ] };
      }
      const findings: Finding[] = [{
        id: "mediator.no-shape", sev: "fail", title: "The Mediator shape isn't there yet",
        text: "I couldn't find a mediator: one class that holds the other objects (the colleagues), while each colleague holds a link back to it and sends everything through it.",
        fix: `Create a mediator ${h.py ? "class" : "class (with a trait for its interface)"} that keeps the colleagues. Give each colleague one field pointing at the mediator, and replace direct calls between colleagues with a call on the mediator, such as ${h.py ? "self.mediator.send(...)" : "mediator.send(...)"}.`,
        lesson: "lesson"
      }];
      // the smell: a class keeps links to others of its own kind (a mesh of peers)
      for (const c of m.classes) {
        const self = c.fields.find((f) => typesOf(f).includes(c.name))
          ?? c.fields.find((f) => f.origin === "collection" && c.methods.some((mt) => mt.calls.some((x) => fieldRe(f.name).test(x.receiver ?? "") && ADD.test(x.method)) && mt.params.some((p) => unquote(p.type) === c.name)));
        if (!self) continue;
        findings.push({
          id: "mediator.mesh", sev: "note", line: self.line, title: `Every ${c.name} links to the other ${c.name}s`,
          text: `${c.name}.${self.name} (line ${self.line}) keeps direct links to its peers, so n objects need about n × n links, and each one repeats the shared rules. Adding one more ${c.name} means wiring it to all the others.`,
          fix: `Replace ${self.name} with one link to a mediator (for example a ChatRoom) that keeps the ${c.name}s and decides who gets what.`,
          lesson: "problem"
        });
        break;
      }
      return { found: false, findings };
    }

    const { hub, iface, colleagues, links } = best;
    const concreteColl = colleagues.flatMap((c) => (h.isAbstraction(c) ? h.implementers(c.name, { concreteOnly: true }) : [c]))
      .filter((c, i, a) => a.indexOf(c) === i && c !== hub);
    const collNames = concreteColl.map((c) => c.name);
    const allColl = new Set(colleagues.flatMap((c) => [c.name, ...h.ancestors(c)]).concat(collNames));
    const medTypes = new Set([hub.name, ...h.ancestors(hub)]);
    const medMethods = methodNames(h, hub);
    const roles = `${iface ? `${iface.name} is the mediator interface, ${hub.name} is the concrete mediator` : `${hub.name} is the mediator`}, and ${h.list(collNames.length ? collNames : colleagues.map((c) => c.name))} ${collNames.length === 1 ? "is a colleague that talks" : "are colleagues that talk"} only through it.`;
    out.push({ id: "mediator.shape", sev: "pass", title: "Mediator shape found", text: roles });

    // 1. colleagues depend on the mediator interface
    const concreteLinks = [...links.entries()].filter(([, f]) => typesOf(f).includes(hub.name));
    if (iface && concreteLinks.length) {
      const [c, f] = concreteLinks[0];
      out.push({ id: "mediator.colleague-knows-concrete-mediator", sev: "warn", line: f.line, title: `${c.name}.${f.name} is typed as ${hub.name}`,
        text: `${iface.name} already exists, but ${c.name} points at the concrete ${hub.name}. Then ${c.name} can't be reused with another mediator, and a test can't hand it a fake one.`,
        fix: `Type ${f.name} as ${iface.name} (Dependency Inversion).`, lesson: "lesson" });
    } else if (iface) {
      out.push({ id: "mediator.depends-on-interface", sev: "pass", title: `Colleagues depend on ${iface.name}`,
        text: `Colleagues know only the ${iface.name} interface, so the routing rules can change, or a whole new mediator can be used, without editing them.` });
    } else {
      out.push({ id: "mediator.no-interface", sev: "note", title: `There is no mediator interface`,
        text: `Colleagues point straight at ${hub.name}. That is fine while there is only one mediator. An interface helps when you want a second one, or a fake one in tests.`,
        fix: `Optional: add ${h.words.iface} (say ${hub.name}Mediator) with the methods colleagues call, make ${hub.name} implement it, and type the colleagues' link as that interface.` });
    }

    // 2. colleagues never talk to each other directly
    let direct: Finding | undefined;
    for (const c of concreteColl) {
      const owner = [c, ...h.ancestors(c).map((n) => h.cls(n)).filter(Boolean) as ClassInfo[]];
      const peer = owner.flatMap((k) => k.fields).find((f) => !typesOf(f).some((t) => medTypes.has(t)) && typesOf(f).some((t) => allColl.has(t)));
      const made = h.createsOf(c, [...allColl]);
      if (!peer && !made.length) continue;
      const line = peer?.line ?? made[0].line;
      const otherType = peer ? typesOf(peer).find((t) => allColl.has(t))! : made[0].type;
      const other = otherType === c.name ? `another ${otherType}` : otherType;
      direct = { id: "mediator.colleague-knows-colleague", sev: "warn", line, title: `${c.name} talks to ${other} directly`,
        text: `On line ${line}, ${c.name} ${peer ? `keeps a link to ${other} (${peer.name})` : `creates ${other === otherType ? otherType : `a ${otherType}`}`}. Colleagues should know only the mediator; every direct link brings back the tangle Mediator removes, and the rules end up in two places.`,
        fix: `Remove that link. When ${c.name} needs ${other} to react, call the mediator and let ${hub.name} decide what happens.`, lesson: "lesson" };
      break;
    }
    out.push(direct ?? { id: "mediator.no-direct-links", sev: "pass", title: "Colleagues don't know each other",
      text: `No colleague keeps a link to another one; they all go through ${hub.name}, so adding a colleague doesn't touch the others.` });

    // 3. colleagues actually send through the mediator
    const silent = concreteColl.filter((c) => {
      const fields = [c, ...h.ancestors(c).map((n) => h.cls(n)).filter(Boolean) as ClassInfo[]].flatMap((k) => k.fields.filter((f) => typesOf(f).some((t) => medTypes.has(t)) || links.get(k) === f));
      const viaField = fields.some((f) => h.callsOnField(c, f.name).length > 0);
      const viaName = c.methods.some((mt) => mt.calls.some((x) => x.receiver && !isSelf(x.receiver) && medMethods.has(x.method)));
      return !viaField && !viaName && !h.ancestors(c).some((n) => { const b = h.cls(n); return !!b && b.methods.some((mt) => mt.calls.some((x) => x.receiver && !isSelf(x.receiver) && medMethods.has(x.method))); });
    });
    if (silent.length && silent.length === concreteColl.length) {
      const c = silent[0];
      out.push({ id: "mediator.colleague-never-calls", sev: "warn", line: links.get(c)?.line ?? c.line, title: `${c.name} never calls ${iface?.name ?? hub.name}`,
        text: `${c.name} keeps a link to the mediator but never uses it, so nothing it does reaches the other colleagues.`,
        fix: `When something happens in ${c.name}, tell the mediator: ${h.py ? "self." : ""}${links.get(c)?.name ?? "mediator"}.${[...medMethods][0] ?? "notify"}(...).`, lesson: "lesson" });
    } else {
      out.push({ id: "mediator.colleagues-send", sev: "pass", title: "Colleagues send through the mediator",
        text: `Colleagues report to ${hub.name} instead of reaching each other.` });
    }

    // 4. the mediator calls colleagues back (it routes, not just stores)
    const collMethods = new Set(concreteColl.concat(colleagues).flatMap((c) => c.methods).filter((mt) => !/^__\w+__$/.test(mt.name) && mt.name !== "<init>").map((mt) => mt.name));
    const exampleColl = concreteColl[0];
    const exampleMethod = exampleColl ? [...h.publicMethods(exampleColl)].reverse().find((n) => !/^__/.test(n)) : undefined;
    const collExample = exampleColl && exampleMethod ? `${h.words.snake(exampleColl.name)}.${exampleMethod}(...)` : "colleague.receive(...)";
    const heldNames = best.held.map((f) => f.name);
    const routes = hub.methods.some((mt) => mt.calls.some((x) => x.receiver && !isSelf(x.receiver) && collMethods.has(x.method))
      || mt.assigns.some((a) => heldNames.some((n) => a.startsWith(n + "."))));
    // Python attribute writes on a colleague (self.button.enabled = ...) are not in the class model, so with
    // named colleague fields we can't be sure nothing is routed: say so gently instead of warning.
    const unsure = !routes && h.py && best.held.every((f) => f.origin !== "collection");
    if (unsure) out.push({ id: "mediator.routing-unseen", sev: "note", line: best.held[0].line, title: `I couldn't see ${hub.name} react`,
      text: `${hub.name} keeps its colleagues in fields but I couldn't find a call on any of them. If it changes their attributes directly (for example self.${heldNames[0]}.enabled = ...), that is fine.`,
      fix: `Make sure the method colleagues call ends by updating or calling the colleagues that should react.`, lesson: "lesson" });
    else out.push(routes
      ? { id: "mediator.routes", sev: "pass", title: `${hub.name} passes messages on`, text: `${hub.name} decides who should react and calls them. The interaction rules live in one place (Single Responsibility).` }
      : { id: "mediator.no-routing", sev: "warn", line: best.held[0].line, title: `${hub.name} never calls a colleague`,
          text: `${hub.name} keeps the colleagues in ${best.held[0].name} but never calls any of them, so a message sent to it goes nowhere.`,
          fix: `In the method colleagues call, decide who should react and call them, for example ${collExample} for each one.`, lesson: "lesson" });

    // 5. the mediator shouldn't check colleague types one by one
    const tc = hub.methods.flatMap((mt) => mt.typeChecks.filter((t) => allColl.has(t.type)));
    if (tc.length >= 2) out.push({ id: "mediator.type-checks", sev: "warn", line: tc[0].line, title: `${hub.name} checks which colleague it got`,
      text: `${hub.name} uses ${h.words.typeCheck} on ${h.list([...new Set(tc.map((t) => t.type))])} (line ${tc[0].line}). Each new colleague means another branch here.`,
      fix: `Give colleagues a shared method the mediator can call, or let each colleague tell the mediator what happened through a dedicated method (for example ${h.name("on_checkbox_changed")}).`, lesson: "lesson" });

    return { found: true, findings: out, roles, suppress: tc.length >= 2 ? ["general.type-checks"] : [] };
  }
};

export default rules;
