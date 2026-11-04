import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";

/**
 * State: a state type with ≥ 2 concrete states, and a context that holds the current state, delegates its
 * actions to it, and lets the states decide which state comes next. Also recognises the lighter data-driven form
 * (an enum of states plus a transition function) from the lesson's idiomatic code.
 */

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CTOR = new Set(["__init__", "<init>"]);

/** Does the method use the field (a call on it, or `field.x` in its last expression, for Scala calls without parentheses)? */
function usesField(mt: MethodInfo, field: string): boolean {
  const recv = new RegExp(`^(self\\.|this\\.)?${esc(field)}$`);
  if (mt.calls.some((c) => c.receiver !== null && recv.test(c.receiver))) return true;
  const txt = new RegExp(`(^|[^\\w.])(self\\.|this\\.)?${esc(field)}\\.\\w+`);
  return mt.returns.some((r) => txt.test(r));
}

/** Concrete states this method switches to: created (Python, Scala classes) or named as a value (Scala objects). */
function statesNamed(mt: MethodInfo, names: string[]): { type: string; line: number }[] {
  const out = mt.creates.filter((c) => names.includes(c.type)).map((c) => ({ type: c.type, line: c.line }));
  for (const r of mt.returns) for (const n of names) {
    if (new RegExp(`(^|(^|[^=!<>])=>?\\s*|\\b(then|else|yield)\\s+|[(,]\\s*)${esc(n)}\\b(?!\\s*[.:\\[])`).test(r) && !out.some((o) => o.type === n)) out.push({ type: n, line: mt.line });
  }
  return out;
}

/** Members (methods or fields) available on c, own or inherited, that have a body. */
function concreteMembers(c: ClassInfo, h: { cls: (n: string) => ClassInfo | undefined; ancestors: (c: ClassInfo) => string[] }): Set<string> {
  const out = new Set<string>();
  for (const k of [c, ...h.ancestors(c).map((n) => h.cls(n)).filter((x): x is ClassInfo => !!x)]) {
    for (const m of k.methods) if (!m.abstract) out.add(m.name);
    for (const f of k.fields) out.add(f.name);
  }
  return out;
}


/** The lighter form: an enum of states, plus a function (state, event) -> state or a class that moves its enum-typed field. */
function findDataDriven(m: { functions: MethodInfo[]; classes: ClassInfo[] }, enums: ClassInfo[]) {
  for (const en of enums) {
    const fn = m.functions.find((f) => f.params.some((p) => p.type?.includes(en.name)) && (f.returnType ?? "").includes(en.name));
    if (fn) return { en, who: fn.name, line: fn.line, how: "turns a state and an event into the next state" };
  }
  if (!enums.length) return null;
  for (const c of m.classes) {
    if (c.kind === "enum") continue;
    for (const f of c.fields) {
      const en = enums.find((e) => f.type === e.name) ?? (f.type === null && /state|status|phase|stage/i.test(f.name) ? enums[0] : undefined);
      if (!en) continue;
      const mover = c.methods.find((mt) => !CTOR.has(mt.name) && mt.assigns.includes(f.name));
      if (mover) return { en, who: `${c.name}.${mover.name}`, line: mover.line, how: `moves its ${f.name} field to the next state` };
    }
  }
  return null;
}

const rules: PatternRules = {
  slug: "state",
  name: "State",
  review(m, h) {
    const out: Finding[] = [];

    // 1. candidate state types: anything (trait, ABC or plain base class) with ≥ 2 concrete subtypes,
    //    preferring one that another class holds in a field (the context)
    type Cand = { base: ClassInfo; states: ClassInfo[]; context?: ClassInfo };
    const cands: Cand[] = [];
    for (const base of m.classes) {
      if (base.kind === "object" || base.kind === "enum") continue;
      const states = h.implementers(base.name, { concreteOnly: true });
      if (states.length < 2) continue;
      const names = states.map((s) => s.name);
      const hier = new Set([base.name, ...names, ...h.implementers(base.name).map((c) => c.name)]);
      const context = m.classes.filter((c) => !hier.has(c.name) && h.fieldsOfType(c, [base.name, ...names]).length > 0)
        .sort((a, b) => b.methods.length - a.methods.length)[0];
      cands.push({ base, states, context });
    }
    cands.sort((a, b) => Number(!!b.context) - Number(!!a.context) || b.states.length - a.states.length);
    const best = cands[0];

    if (!best || !best.context) {
      // the lighter, data-driven form: an enum of states and a function from (state, event) to the next state
      const enums = m.classes.filter((c) => c.kind === "enum");
      const lite = !best ? findDataDriven(m, enums) : null;
      if (lite) {
        const { en, who, line, how } = lite;
        const roles = `${en.name} lists the states and ${who} ${how}: the lighter, data-driven form.`;
        out.push({
          id: "state.idiomatic", sev: "note", line, title: "The data-driven form of State",
          text: `${en.name} is an enum of states and ${who} (line ${line}) ${how}. That is the lighter version the lesson shows: easy to test and to draw, and a good fit while the states have no behaviour beyond their transitions.`,
          fix: `If each state starts to need its own logic, move to the class form: one ${h.words.ifaceShort} for the state, a class per state, and a context class that holds the current state.`,
          lesson: "lesson"
        });
        return { found: true, findings: out, roles, suppress: ["general.branches"] };
      }
      if (best) {
        const names = best.states.map((s) => s.name);
        out.push({
          id: "state.no-context", sev: "fail", line: best.base.line, title: `Nothing holds a ${best.base.name} yet`,
          text: `${best.base.name} and its states (${h.list(names)}) are there, but no class keeps the current state in a field. Without that context there is nothing whose behaviour changes.`,
          fix: `Add a context class with a ${best.base.name} field (start it at ${names[0]}), and make each of its actions call the current state.`,
          lesson: "lesson"
        });
        return { found: false, findings: out };
      }
      out.push({
        id: "state.no-shape", sev: "fail", title: "The State shape isn't there yet",
        text: `I couldn't find a shared state type (a base class, or ${h.words.iface}) with at least two state classes, held by a context class that hands its actions to the current state.`,
        fix: "Make one class per state. Put every action in a shared base type, let each state class handle the actions that are valid for it, and let the context hold the current state and call it.",
        lesson: "lesson"
      });
      // the smell: one status field reassigned in several methods, or long if/elif chains
      for (const c of m.classes) {
        const counts = new Map<string, MethodInfo[]>();
        for (const mt of c.methods) if (!CTOR.has(mt.name)) for (const a of new Set(mt.assigns)) counts.set(a, [...(counts.get(a) ?? []), mt]);
        const hot = [...counts.entries()].filter(([, ms]) => ms.length >= 2).sort((a, b) => b[1].length - a[1].length)[0];
        if (hot) {
          const [field, ms] = hot;
          out.push({
            id: "state.status-checks", sev: "note", line: ms[0].line,
            title: `${c.name}.${field} is checked and changed in ${ms.length} methods`,
            text: `${h.list(ms.map((x) => x.name))} each look at ${field} and change it. The rules for one status are spread over every method, and a new status means editing all of them. That's what State replaces.`,
            fix: `Turn each value of ${field} into its own class, and let ${c.name} hold the current one and call it.`,
            lesson: "problem"
          });
          break;
        }
        const br = c.branches[0];
        if (br) {
          out.push({
            id: "state.status-checks", sev: "note", line: br.line, title: `${c.name} chooses its behaviour with ${h.words.ifElse}`,
            text: `Line ${br.line} picks one of ${br.count} behaviours. If the choice depends on what state the object is in, each branch can become a state class.`,
            fix: `Move each branch into its own state class, and let ${c.name} hold the current state and call it.`,
            lesson: "problem"
          });
          break;
        }
      }
      return { found: false, findings: out, suppress: ["general.branches"] };
    }

    const { base, states, context } = best;
    const names = states.map((s) => s.name);
    const all = [base.name, ...names];
    const roles = `${base.name} is the state, ${h.list(names)} are the concrete states, and ${context.name} is the context that holds the current one.`;
    out.push({ id: "state.shape", sev: "pass", title: "State shape found", text: roles });

    const fields = h.fieldsOfType(context, all);
    const field = fields[0];
    const action = base.methods.find((x) => !x.name.startsWith("_") && (x.returnType ?? "").includes(base.name))?.name
      ?? base.methods.find((x) => !x.name.startsWith("_"))?.name ?? "next";
    const callOf = (mt: MethodInfo) => mt.calls.find((c) => c.receiver !== null && new RegExp(`^(self\\.|this\\.)?${esc(field.name)}$`).test(c.receiver))?.method ?? action;
    const suppress = ["general.branches"];

    // delegation: the context's actions call the current state
    const delegating = context.methods.filter((mt) => !CTOR.has(mt.name) && usesField(mt, field.name));
    out.push(delegating.length
      ? { id: "state.delegates", sev: "pass", title: `${context.name} hands its actions to the current state`,
          text: `${h.list(delegating.map((x) => x.name))} ${delegating.length === 1 ? "calls" : "call"} the current state instead of checking a status.` }
      : { id: "state.no-delegation", sev: "warn", line: field.line, title: `${context.name} never calls its state`,
          text: `${context.name} keeps a ${base.name} in ${field.name}, but none of its methods call it, so the state has no effect.`,
          fix: `Make each action forward to the state, e.g. ${h.py ? `self.${field.name}.${action}(...)` : `${field.name}.${action}(...)`}, and store the state it hands back (or let the state set the next one).`,
          lesson: "lesson" });

    // the context must not pick concrete states with if/elif or type checks
    for (const mt of context.methods) {
      const tc = mt.typeChecks.find((t) => all.includes(t.type));
      if (!tc) continue;
      out.push({ id: "state.context-checks-state", sev: "warn", line: tc.line,
        title: `${context.name}.${mt.name} checks which state it is in`,
        text: `It checks for ${tc.type} with ${h.words.typeCheck} on line ${tc.line}. That is the status check the pattern removes: every new state means editing ${context.name} again (Open/Closed).`,
        fix: `Delete the check and just call the state; put the different behaviour in the state classes themselves.`, lesson: "lesson" });
      suppress.push("general.type-checks");
      break;
    }

    // transitions: the states decide what comes next
    const setters = context.methods.filter((mt) => !CTOR.has(mt.name) && mt.assigns.includes(field.name)).map((mt) => mt.name);
    const viaSetter = (k: ClassInfo) => k.methods.some((mt) => mt.calls.some((c) => c.receiver !== null
      && (setters.includes(c.method) || /^(set_?state|change_?to|transition_?to|set_?status)$/i.test(c.method))
      && (mt.params.some((p) => p.name === c.receiver) || /^(self\.|this\.)?(context|ctx|owner)$/.test(c.receiver))));
    const inStates = [...states.flatMap((s) => s.methods.flatMap((mt) => statesNamed(mt, names))),
      ...states.filter(viaSetter).map((s) => ({ type: s.name, line: s.line }))];
    const inBase = [...base.methods.flatMap((mt) => statesNamed(mt, names)), ...(viaSetter(base) ? [{ type: base.name, line: base.line }] : [])];
    const byContext = context.methods.filter((mt) => !CTOR.has(mt.name)).flatMap((mt) => statesNamed(mt, names).map((x) => ({ ...x, mt })));
    if (inStates.length || inBase.length) {
      out.push({ id: "state.transitions-in-states", sev: "pass", title: "The states decide what comes next",
        text: `Each state knows its own next state, so ${context.name} never needs to know the rules. Adding a state means adding a class, not editing the others (Open/Closed).` });
    }
    if (byContext.length) {
      const b = byContext[0];
      out.push({ id: "state.context-picks-next", sev: "warn", line: b.line, title: `${context.name} switches to ${b.type} itself`,
        text: `${context.name}.${b.mt.name} chooses ${b.type} on line ${b.line}. When the context decides the transitions, its methods fill up with state rules again and every new state means editing it.`,
        fix: `Let the current state choose: have the state's ${callOf(b.mt)} return the next state (${h.py ? `self.${field.name} = self.${field.name}.${callOf(b.mt)}()` : `${field.name} = ${field.name}.${callOf(b.mt)}`}) or call a setter on ${context.name}.`,
        lesson: "lesson" });
    } else if (!inStates.length && !inBase.length) {
      out.push({ id: "state.no-transitions", sev: "warn", line: states[0].line, title: "The state never changes",
        text: `None of ${h.list(names)} switch ${context.name} to another state, so the object stays in whatever state it starts in. With no transitions this is the Strategy pattern, not State.`,
        fix: `Have each state action return the next state (or set it on ${context.name}), e.g. ${names[0]}'s action ${h.py ? `returns ${names[1]}()` : `returns ${names[1]}`}.`,
        lesson: "confused" });
    }

    // every state must answer every action: either it implements it, or the base gives a default
    const actions = base.methods.filter((mt) => mt.abstract && !mt.name.startsWith("_")).map((mt) => mt.name);
    let missing = false;
    for (const s of states) {
      const have = concreteMembers(s, h);
      const gap = actions.filter((a) => !have.has(a));
      if (gap.length) {
        missing = true;
        out.push({ id: "state.missing-action", sev: "warn", line: s.line, title: `${s.name} doesn't say what ${h.list(gap)} ${gap.length === 1 ? "does" : "do"}`,
          text: `${base.name} declares ${h.list(gap)} without a body, and ${s.name} doesn't provide ${gap.length === 1 ? "it" : "them"}. ${h.py ? `Python will refuse to create ${s.name}` : `Scala won't compile ${s.name}`}.`,
          fix: `Either add ${h.list(gap)} to ${s.name}, or give ${base.name} a default that refuses the action with a clear error, and override it only in the states where it is allowed.`,
          lesson: "lesson" });
      }
    }
    if (!missing && base.methods.length) out.push({ id: "state.all-actions", sev: "pass", title: "Every state answers every action",
      text: `${base.name} covers every action, so ${context.name} can call any of them in any state; an action that isn't allowed is refused instead of silently ignored.` });

    // the field should be typed as the state type, not one concrete state
    for (const f of fields) {
      if (f.type && names.includes(f.type) && !(f.origin === "created" && f.created.includes(f.type))) {
        out.push({ id: "state.concrete-field", sev: "warn", line: f.line, title: `${context.name}.${f.name} is typed as ${f.type}`,
          text: `The current state is declared as ${f.type}, so it can't hold any other state.`,
          fix: `Declare it as ${base.name} (Dependency Inversion: depend on the abstraction).`, lesson: "lesson" });
        break;
      }
    }

    return { found: true, findings: out, roles, suppress };
  }
};

export default rules;
