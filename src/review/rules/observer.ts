import type { PatternRules, Finding } from "../types";
import type { ClassInfo, FieldInfo, MethodInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Observer: a subject keeps a list of observers (typed as an interface), lets them subscribe / unsubscribe,
 * and loops over the list to notify each one when its state changes. The lighter idiomatic form (a list of
 * functions / callbacks) is recognised too.
 */
const ADD = /^(append|add|insert|addOne|prepend|appendleft|\+=|\+=:|::=|addListener|push)$/;
const REMOVE = /^(remove|discard|pop|clear|-=|subtractOne|filterInPlace|filterNot|filter|delete)$/;
const ADD_NAME = /(sub|add|attach|register|listen|watch|follow|join|^on)/i;
const REMOVE_NAME = /(unsub|remove|detach|unregister|unwatch|unfollow|leave|off)/i;
const NOTIFY_NAME = /^_?(notify|publish|emit|fire|broadcast|dispatch|announce)/i;
const BUILTIN = /^(str|int|float|bool|bytes|dict|list|set|tuple|object|String|Int|Long|Double|Float|Boolean|Char|Unit|Any|AnyRef|BigDecimal|BigInt)$/;

interface Candidate {
  subject: ClassInfo;
  field: FieldInfo;
  type: string | null;
  adders: MethodInfo[];
  removers: MethodInfo[];
  loops: MethodInfo[];
  score: number;
}

const isCtor = (mt: MethodInfo) => mt.name === "__init__" || mt.name === "<init>";

/** Receiver is the field itself, or one entry of it (self._subs[topic], subs.getOrElseUpdate(...)): topic-keyed lists. */
function onField(field: string) {
  const re = new RegExp(`^(self\\.|this\\.)?${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\[.*\\]|\\.(getOrElseUpdate|setdefault|get)\\(.*\\))?$`);
  return (receiver: string | null) => receiver !== null && re.test(receiver);
}

function candidates(h: Helpers): Candidate[] {
  const out: Candidate[] = [];
  for (const c of h.classes) {
    for (const f of c.fields) {
      if (f.classLevel && h.py && f.origin !== "collection") continue;
      if (f.origin !== "collection" && !f.elementType) continue;
      const hit = onField(f.name);
      const methods = c.methods.filter((mt) => !isCtor(mt));
      const adders = methods.filter((mt) => mt.calls.some((x) => hit(x.receiver) && ADD.test(x.method))
        || (mt.assigns.includes(f.name) && ADD_NAME.test(mt.name) && !REMOVE_NAME.test(mt.name)));
      if (!adders.length) continue;
      const removers = methods.filter((mt) => mt.calls.some((x) => hit(x.receiver) && REMOVE.test(x.method) && x.method !== "clear")
        || (mt.assigns.includes(f.name) && !adders.includes(mt)));
      const loops = methods.filter((mt) => mt.loopsOver.includes(f.name));
      // what kind of thing is stored? element type, else the adder's parameter type
      let type = f.elementType;
      if (!type) {
        const ps = adders[0].params.filter((p) => p.name !== "self");
        if (ps.length === 1 && ps[0].type) type = ps[0].type.replace(/\[.*$/, "").trim() || null;
      }
      if (!type) {
        // untyped list: look at what the notify loop calls, and find the abstraction that declares it
        const called = new Set(loops.flatMap((mt) => mt.calls.filter((x) => x.receiver && !/^(self|this)\b/.test(x.receiver)).map((x) => x.method)));
        type = h.abstractions().find((a) => a.methods.some((mm) => called.has(mm.name)))?.name ?? null;
      }
      if (type) type = type.replace(/^["']|["']$/g, "") || null;
      if (type && (BUILTIN.test(type) || /^[a-z]/.test(type))) continue;
      const cls = h.cls(type);
      if (!cls && !loops.length) continue; // a list of unknown things that nobody loops over is just data
      let score = cls ? (h.isAbstraction(cls) ? 3 : 2) : type ? 1 : loops.length ? 1 : 0;
      if (!score) continue;
      if (cls && cls.name === c.name) continue;
      score += (loops.length ? 1 : 0) + (removers.length ? 0.5 : 0);
      out.push({ subject: c, field: f, type, adders, removers, loops, score });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

const rules: PatternRules = {
  slug: "observer",
  name: "Observer",
  review(m, h) {
    const out: Finding[] = [];
    const best = candidates(h)[0];
    if (!best) {
      const findings: Finding[] = [{
        id: "observer.no-shape", sev: "fail", title: "The Observer shape isn't there yet",
        text: "I couldn't find a class that keeps a list of observers, lets them subscribe, and tells each of them when something changes.",
        fix: `Make an observer interface (${h.words.iface}) with one method such as ${h.name("update")}. Give the subject a list of them, a ${h.name("subscribe")} method that adds to the list, and a method that loops over the list and calls ${h.name("update")} on each.`,
        lesson: "lesson"
      }];
      // the smell: one class creates several consumers itself and calls each one by name
      for (const c of m.classes) {
        const own = c.fields.filter((f) => f.origin === "created" && f.created.some((t) => h.cls(t) && t !== c.name));
        if (own.length < 2) continue;
        const caller = c.methods.find((mt) => own.filter((f) => mt.calls.some((x) => onField(f.name)(x.receiver))).length >= 2);
        if (!caller) continue;
        const types = own.map((f) => f.type ?? f.created[0]);
        findings.push({
          id: "observer.hardwired", sev: "note", line: own[0].line, title: `${c.name} knows every consumer by name`,
          text: `${c.name} creates ${h.list(types)} itself and ${c.name}.${caller.name} calls each one directly (line ${caller.line}). Every new listener means editing ${c.name} again (Open/Closed Principle). This is exactly what Observer fixes.`,
          fix: `Give ${h.list(types)} one shared interface, keep a list of them in ${c.name}, and let the client subscribe them from outside.`,
          lesson: "problem"
        });
        break;
      }
      return { found: false, findings };
    }

    const { subject, field, type, adders, removers, loops } = best;
    const obs = h.cls(type);
    const update = obs ? (obs.methods.find((x) => x.abstract) ?? obs.methods.find((x) => !isCtor(x)))?.name ?? h.name("update") : h.name("update");
    let impls = obs ? h.implementers(obs.name, { concreteOnly: true }) : [];
    if (obs && !impls.length && h.isAbstraction(obs)) {
      // Python Protocols are structural: a class "implements" it just by having the same methods
      const need = obs.methods.filter((x) => x.abstract).map((x) => x.name);
      if (need.length) impls = h.concretes().filter((c) => c !== subject && need.every((n) => c.methods.some((x) => x.name === n)));
    }
    // untyped list whose loop calls a method on each element: objects by duck typing, not callbacks
    const duckCall = !obs && !type ? loops.flatMap((mt) => mt.calls).find((x) => x.receiver && !/^(self|this)\b/.test(x.receiver) && !onField(field.name)(x.receiver)) : undefined;
    const functional = !obs && !duckCall;
    const roles = duckCall
      ? `${subject.name} is the subject: it keeps a list of observers in ${field.name} and calls ${duckCall.method} on each one when something changes.`
      : functional
      ? `${subject.name} is the subject: it keeps a list of ${type && !/^(Callable|Function\d*)$/.test(type) ? `${type} ` : ""}functions (callbacks) in ${field.name} and calls each one when something changes.`
      : impls.length
        ? `${subject.name} is the subject, ${obs!.name} is the observer interface, and ${h.list(impls.map((c) => c.name))} ${impls.length === 1 ? "observes" : "observe"} it.`
        : `${subject.name} is the subject and keeps a list of ${obs!.name} observers.`;
    out.push({ id: "observer.shape", sev: "pass", title: "Observer shape found", text: roles });

    // 1. the list holds the abstraction, not one concrete class
    if (duckCall) {
      out.push({
        id: "observer.untyped-observers", sev: "note", line: field.line, title: `${subject.name}.${field.name} doesn't say what it holds`,
        text: `Any object with a method called ${duckCall.method} can subscribe, which works, but nothing in the code says so. A reader has to guess what an observer must look like.`,
        fix: h.py
          ? `Add an observer interface (class Observer(ABC) or Protocol) with def ${duckCall.method}(self, ...), and annotate the list: self.${field.name}: list[Observer] = [].`
          : `Add trait Observer with def ${duckCall.method}(...): Unit and type the list as a list of Observer.`,
        lesson: "lesson"
      });
    } else if (functional) {
      out.push({
        id: "observer.function-observers", sev: "note", title: "Observers are plain functions",
        text: `${subject.name} stores functions instead of objects. That is the lighter, idiomatic form the lesson shows, and it works well when an observer only needs one method.`,
        fix: `If observers grow more than one method (or need their own state), switch to an observer interface (${h.words.iface}).`,
        lesson: "idiomatic"
      });
    } else if (h.isAbstraction(obs!)) {
      out.push({
        id: "observer.depends-on-interface", sev: "pass", title: `${subject.name} depends only on ${obs!.name}`,
        text: `${field.name} holds ${obs!.name} values, so any new kind of observer can subscribe without editing ${subject.name} (Open/Closed, Dependency Inversion).`
      });
    } else {
      out.push({
        id: "observer.concrete-observer-type", sev: "warn", line: field.line, title: `${subject.name}.${field.name} holds only ${obs!.name}`,
        text: `The list is typed as the concrete class ${obs!.name}, so only that one kind of listener can subscribe. A second kind (say, a mobile push service) would need ${subject.name} to change.`,
        fix: `Add an observer interface (${h.words.iface}) with ${h.py ? `def ${update}(self, ...)` : `def ${update}(...): Unit`}, make ${obs!.name} implement it, and type ${field.name} as a list of that interface.`,
        lesson: "lesson"
      });
    }

    // 2. subject never creates or names concrete observers
    const concreteNames = obs ? [...impls.map((c) => c.name), ...(h.isAbstraction(obs) ? [] : [obs.name])] : [];
    const created = h.createsOf(subject, concreteNames);
    const named = subject.fields.filter((f) => f !== field && f.type && concreteNames.includes(f.type));
    if (created.length || named.length) {
      const line = created[0]?.line ?? named[0].line;
      const t = created[0]?.type ?? named[0].type!;
      out.push({
        id: "observer.subject-knows-concrete", sev: "warn", line, title: `${subject.name} knows about ${t}`,
        text: `On line ${line}, ${subject.name} ${created.length ? "creates" : "keeps a field typed as"} ${t}. The subject should not know which observers exist; that is the whole point of the pattern.`,
        fix: `Remove it from ${subject.name}. Let the client create ${t} and call ${subject.name}.${adders[0].name}(...) with it.`,
        lesson: "lesson"
      });
    } else if (!functional) {
      out.push({ id: "observer.no-hardwired", sev: "pass", title: `${subject.name} doesn't create its observers`,
        text: "Observers are created by the client and subscribed from outside, so the subject stays unaware of them." });
    }

    // 3. subscribe and unsubscribe
    if (removers.length) {
      out.push({ id: "observer.subscribe-unsubscribe", sev: "pass", title: "Observers can come and go",
        text: `${subject.name}.${adders[0].name} adds an observer and ${removers[0] === adders[0] ? `the function it returns` : `${subject.name}.${removers[0].name}`} removes one.` });
    } else {
      out.push({
        id: "observer.no-unsubscribe", sev: "warn", line: adders[0].line, title: `Observers can't unsubscribe from ${subject.name}`,
        text: `${subject.name}.${adders[0].name} adds to ${field.name}, but nothing removes from it. An observer that is no longer needed keeps getting notified, and is never freed (a common memory leak).`,
        fix: h.py
          ? `Add def unsubscribe(self, observer) -> None: self.${field.name}.remove(observer)`
          : `Add def unsubscribe(o: ${type ?? "Observer"}): Unit = ${field.name} -= o`,
        lesson: "lesson"
      });
    }

    // 4. notify: a loop over the list that calls each observer
    const loop = loops[0];
    if (!loop) {
      out.push({
        id: "observer.no-notify-loop", sev: "warn", line: field.line, title: `${subject.name} never notifies its observers`,
        text: `${subject.name} collects observers in ${field.name} but no method loops over them, so nobody hears about changes.`,
        fix: h.py
          ? `Add def _notify(self, ...) -> None: for o in list(self.${field.name}): o.${update}(...), and call it whenever the state changes.`
          : `Add private def notifyAll(...): Unit = ${field.name}.toList.foreach(_.${update}(...)), and call it whenever the state changes.`,
        lesson: "lesson"
      });
    } else {
      out.push({ id: "observer.notifies", sev: "pass", title: `${subject.name} notifies every observer`,
        text: `${subject.name}.${loop.name} loops over ${field.name} and tells each observer about the change.` });
      // notify must be triggered by the subject's own state change, not left to the client
      const triggered = subject.methods.some((mt) => mt !== loop && mt.calls.some((x) => x.method === loop.name && (x.receiver === null || /^(self|this)$/.test(x.receiver))));
      // a notify(...) that receives the news itself is an event method (publish(title)); one with no arguments
      // only re-sends state that changed elsewhere, so someone must remember to call it
      const noArgs = loop.params.filter((p) => p.name !== "self").length === 0;
      if (!triggered && noArgs && NOTIFY_NAME.test(loop.name)) out.push({
        id: "observer.manual-notify", sev: "note", line: loop.line, title: `Nothing in ${subject.name} calls ${loop.name}`,
        text: `Clients have to remember to call ${loop.name} themselves after each change. If one forgets, observers miss the update.`,
        fix: `Call ${h.py ? "self." : ""}${loop.name}() at the end of the method that changes ${subject.name}'s state${h.py ? `, and start its name with _ to mark it private` : `, and make it private`}.`,
        lesson: "lesson"
      });
      // checking observer types inside the loop brings back the hard-wiring
      const tc = loop.typeChecks.find((t) => concreteNames.includes(t.type));
      if (tc) out.push({
        id: "observer.type-check", sev: "warn", line: tc.line, title: `${subject.name} checks which observer it has`,
        text: `${subject.name}.${loop.name} checks for ${tc.type} (line ${tc.line}), so the subject knows the concrete observers again.`,
        fix: `Call ${update} on every observer and let each one decide what to do with the news.`,
        lesson: "lesson"
      });
    }
    // a Python Protocol is implemented by shape, so the general "no implementations" note would be wrong
    const structural = !!obs && impls.length > 0 && h.implementers(obs.name).length === 0;
    return { found: true, findings: out, roles, suppress: structural ? ["general.unused-interface"] : [] };
  }
};

export default rules;
