import type { PatternRules, Finding } from "../types";
import type { ClassInfo, FieldInfo, MethodInfo } from "../model";

/**
 * Adapter: a class that implements the target interface the client expects, holds the adaptee (an existing class
 * with a different interface) and translates each target call into adaptee calls. Also recognised: a class adapter
 * (inherits target and adaptee), a Python function/closure adapter, and a Scala single-method trait filled by a lambda.
 */
const SCALAR = /^(str|int|float|bool|bytes|None|dict|list|set|tuple|String|Int|Long|Double|Float|Boolean|Unit|Map|List|Seq|Vector|Decimal|BigDecimal|Any|object)$/;
const isSelfRecv = (r: string | null) => r === null || r === "self" || r === "this" || r === "super()" || r === "super";
const an = (w: string) => (/^[AEIOUaeiou]/.test(w) ? "an " : "a ") + w;
const plain = (t: string | null) => (t ?? "").replace(/["']/g, "").split("[")[0].split(".").pop()!.trim();

const rules: PatternRules = {
  slug: "adapter",
  name: "Adapter",
  review(m, h) {
    const out: Finding[] = [];
    const py = h.py;

    type Cand = { target: ClassInfo; adapter: ClassInfo; adaptee: ClassInfo; field?: FieldInfo; impl: MethodInfo[]; forwards: boolean; classForm: boolean };
    const cands: Cand[] = [];
    for (const target of h.abstractions()) {
      const targetMethods = target.methods.filter((x) => x.abstract).map((x) => x.name);
      for (const a of h.implementers(target.name, { concreteOnly: true })) {
        const impl = a.methods.filter((x) => targetMethods.includes(x.name) || target.methods.some((t) => t.name === x.name));
        // object adapter: holds a concrete class outside the target's family
        for (const f of a.fields) {
          const b = h.cls(f.type) ?? h.cls(f.created[0]);
          if (!b || b === a || b === target || h.isA(b, target.name) || h.isAbstraction(b) && h.implementers(b.name).includes(a)) continue;
          const forwards = impl.some((mt) => h.callsOnField(a, f.name).some((x) => x.method === mt));
          cands.push({ target, adapter: a, adaptee: b, field: f, impl, forwards, classForm: false });
        }
        // class adapter: also inherits from the adaptee
        for (const bn of a.bases) {
          const b = h.cls(bn);
          if (!b || b === target || h.isAbstraction(b) || h.isA(b, target.name)) continue;
          const bNames = new Set(b.methods.map((x) => x.name));
          const forwards = impl.some((mt) => mt.calls.some((x) => isSelfRecv(x.receiver) && bNames.has(x.method)));
          cands.push({ target, adapter: a, adaptee: b, impl, forwards, classForm: true });
        }
      }
    }
    cands.sort((x, y) => Number(y.forwards) - Number(x.forwards) || Number(!!y.field) - Number(!!x.field));
    const best = cands[0];

    if (!best) {
      // lighter forms: a function that wraps the adaptee, or a lambda filling a single-method trait
      const own = new Set(m.classes.map((c) => c.name));
      const fnAdapter = m.functions.find((f) => {
        const p = f.params.find((x) => { const c = h.cls(plain(x.type)); return !!c && !h.isAbstraction(c); });
        if (!p) return false;
        const rt = plain(f.returnType);
        return !!rt && rt !== plain(p.type) && !SCALAR.test(rt) && (!own.has(rt) || h.isAbstraction(h.cls(rt)!));
      });
      const samTrait = !py ? h.abstractions().find((t) => t.methods.filter((x) => x.abstract).length === 1 && h.implementers(t.name).length === 0
        && m.functions.some((f) => f.params.some((p) => plain(p.type) === t.name))) : undefined;
      // the lambda / extension method body itself is not in the model, so accept a concrete class that nothing calls directly
      const adapteeCalled = samTrait ? m.classes.find((c) => !h.isAbstraction(c) && !h.isA(c, samTrait.name) && c.methods.length > 0
        && ![...m.topCalls, ...m.classes.flatMap((k) => k.methods.flatMap((x) => x.calls))].some((x) => x.receiver && c.methods.some((mt) => mt.name === x.method))) : undefined;
      if (fnAdapter || (samTrait && adapteeCalled)) {
        const p = fnAdapter?.params.find((x) => h.cls(plain(x.type)));
        const adaptee = fnAdapter ? plain(p!.type) : adapteeCalled!.name;
        const roles = fnAdapter
          ? `${fnAdapter.name}() is the adapter, taking ${an(adaptee)} and returning ${an(plain(fnAdapter.returnType))} the client can call.`
          : `${samTrait!.name} is the target, ${adaptee} is the adaptee, and a lambda (or extension method) fills in ${samTrait!.name} as the adapter.`;
        out.push({ id: "adapter.shape", sev: "pass", title: "Adapter shape found (lighter form)", text: roles });
        out.push({ id: "adapter.function-form", sev: "note", line: fnAdapter?.line ?? samTrait!.line, title: fnAdapter ? "The adapter is a function" : "The adapter is a lambda",
          text: `There is no adapter class, but ${fnAdapter ? `${fnAdapter.name}() wraps ${adaptee}` : `${samTrait!.name} has a single method, so a lambda can stand in for it. (I can't read inside lambdas and extension methods, so make sure one of them does call ${adaptee}.)`}. When the target is one operation, this is the lighter idiomatic form the lesson shows.`.replace(".).", ".)"),
          fix: `If the target grows to several methods, switch to a class that ${py ? "inherits from" : "extends"} the target and holds the ${adaptee}.`, lesson: "code" });
        return { found: true, findings: out, roles, suppress: ["general.unused-interface"] };
      }
      const findings: Finding[] = [{
        id: "adapter.no-shape", sev: "fail", title: "The Adapter shape isn't there yet",
        text: `I couldn't find a class that implements the interface your code expects (${h.words.iface}) and holds the existing class it adapts.`,
        fix: `Write the interface your code wants (the target). Then add an adapter class that ${py ? "inherits from" : "extends"} it, takes the existing class through ${h.words.ctorParam}, and translates each call.`,
        lesson: "lesson"
      }];
      // the smell: many call sites talk to the same foreign API directly
      const calls = [...m.functions.flatMap((f) => f.calls), ...m.classes.flatMap((c) => c.methods.flatMap((x) => x.calls))]
        .filter((x) => x.receiver && !/^(self|this)$/.test(x.receiver));
      const byMethod = new Map<string, { n: number; line: number; cls: string }>();
      for (const x of calls) {
        const c = m.classes.find((k) => k.methods.some((mt) => mt.name === x.method && !mt.name.startsWith("_")));
        if (!c) continue;
        const cur = byMethod.get(x.method);
        byMethod.set(x.method, { n: (cur?.n ?? 0) + 1, line: cur?.line ?? x.line, cls: c.name });
      }
      const spread = [...byMethod.entries()].sort((a, b) => b[1].n - a[1].n)[0];
      if (spread && spread[1].n >= 2) findings.push({
        id: "adapter.direct-calls", sev: "note", line: spread[1].line, title: `${spread[1].n} places call ${spread[1].cls}.${spread[0]} directly`,
        text: `Each call site (first at line ${spread[1].line}) has to know ${spread[1].cls}'s units and formats, and they can get it wrong in different ways. Swapping ${spread[1].cls} for another one would mean editing every place.`,
        fix: `Put all the translation in one adapter class behind an interface, and let these call sites use the interface.`, lesson: "problem" });
      return { found: false, findings };
    }

    const { target, adapter, adaptee, field, impl, forwards, classForm } = best;
    const client = m.classes.find((c) => c !== adapter && !h.isA(c, target.name) && c.fields.some((f) => f.type === target.name || f.elementType === target.name));
    const roles = `${target.name} is the target, ${adapter.name} is the adapter, ${adaptee.name} is the adaptee${client ? `, and ${client.name} uses it only through ${target.name}` : ""}.`;
    out.push({ id: "adapter.shape", sev: "pass", title: "Adapter shape found", text: roles });
    if (classForm) out.push({ id: "adapter.class-adapter", sev: "note", line: adapter.line, title: `${adapter.name} inherits from ${adaptee.name}`,
      text: `This is a class adapter: it inherits the adaptee instead of holding it. It works, but it exposes all of ${adaptee.name}'s methods and ties ${adapter.name} to that one class.`,
      fix: `Prefer composition: keep a ${adaptee.name} in a field, passed in through ${h.words.ctorParam} (an object adapter).`, lesson: "lesson" });

    // 1. it translates: target methods call the adaptee
    out.push(forwards
      ? { id: "adapter.translates", sev: "pass", title: `${adapter.name} translates calls to ${adaptee.name}`,
          text: `${adapter.name}'s ${h.list(impl.map((x) => x.name + "()"))} turn${impl.length === 1 ? "s" : ""} the target's call into ${adaptee.name}'s own methods, so the client never sees ${adaptee.name}'s interface.` }
      : { id: "adapter.no-forwarding", sev: "warn", line: impl[0]?.line ?? adapter.line, title: `${adapter.name} never calls ${adaptee.name}`,
          text: `${adapter.name} has ${an(adaptee.name)}${field ? ` in ${field.name}` : ""}, but its ${target.name} methods don't use it, so nothing is being adapted.`,
          fix: `In ${impl[0]?.name ?? "each target method"}, convert the arguments and call the matching ${adaptee.name} method${field ? ` on ${py ? "self." : ""}${field.name}` : ""}, then convert the result back.`, lesson: "lesson" });

    // 2. every target method is implemented
    const missing = target.methods.filter((x) => x.abstract && !adapter.methods.some((y) => y.name === x.name)
      && !m.classes.some((c) => c !== target && h.isA(adapter, c.name) && h.isA(c, target.name) && c.methods.some((y) => y.name === x.name && !y.abstract)));
    if (missing.length) out.push({ id: "adapter.missing-method", sev: "warn", line: adapter.line, title: `${adapter.name} doesn't implement ${h.list(missing.map((x) => x.name + "()"))}`,
      text: `The client may call ${h.list(missing.map((x) => x.name + "()"))} on any ${target.name}. ${py ? `Python will refuse to create ${adapter.name} while an abstract method is missing.` : `Scala won't compile ${adapter.name} until it is implemented.`}`,
      fix: `Add ${h.list(missing.map((x) => x.name + "()"))} to ${adapter.name}, translating ${missing.length > 1 ? "each" : "it"} into ${adaptee.name} calls.`, lesson: "lesson" });

    // 3. the adaptee is passed in, not created inside
    if (field) {
      const made = h.createsOf(adapter, [adaptee.name])[0];
      if (field.origin === "created" || made) out.push({ id: "adapter.creates-adaptee", sev: "warn", line: made?.line ?? field.line, title: `${adapter.name} creates its own ${adaptee.name}`,
        text: `${adapter.name} builds the ${adaptee.name} itself, so you can't hand it an already configured one or a test fake.`,
        fix: `Take the ${adaptee.name} through ${h.words.ctorParam}: ${py ? `def __init__(self, ${h.words.snake(adaptee.name)}: ${adaptee.name})` : `class ${adapter.name}(${adaptee.name[0].toLowerCase() + adaptee.name.slice(1)}: ${adaptee.name})`}.`, lesson: "lesson" });
      else if (field.origin === "param") out.push({ id: "adapter.adaptee-injected", sev: "pass", title: `${adapter.name} receives its ${adaptee.name}`,
        text: `The adaptee is passed in, so any configured ${adaptee.name} (or a fake in tests) can be wrapped.` });
    }

    // 4. the client depends on the target, not on the adapter or the adaptee
    const leaky = m.classes.find((c) => c !== adapter && c !== adaptee && !h.isA(c, target.name)
      && c.fields.some((f) => f.type === adapter.name || f.type === adaptee.name || f.created.includes(adaptee.name)));
    if (leaky) {
      const f = leaky.fields.find((x) => x.type === adapter.name || x.type === adaptee.name || x.created.includes(adaptee.name))!;
      const isAdaptee = f.type === adaptee.name || f.created.includes(adaptee.name);
      out.push({ id: "adapter.client-bypasses", sev: "warn", line: f.line, title: `${leaky.name} depends on ${isAdaptee ? adaptee.name : adapter.name} directly`,
        text: isAdaptee
          ? `${leaky.name}.${f.name} is ${an(adaptee.name)}, so ${leaky.name} still talks to the old interface and the adapter is skipped.`
          : `${leaky.name}.${f.name} is typed as the concrete ${adapter.name}, so it can't work with any other ${target.name} (Dependency Inversion).`,
        fix: `Type ${f.name} as ${target.name} and pass in ${adapter.name}(...) from outside.`, lesson: "lesson" });
    } else if (client) out.push({ id: "adapter.client-uses-target", sev: "pass", title: `${client.name} only knows ${target.name}`,
      text: `${client.name} never names ${adaptee.name} or ${adapter.name}, so another adapter (wrapping some other class, or a test fake) plugs in without edits (Open/Closed).` });

    return { found: true, findings: out, roles };
  }
};

export default rules;
