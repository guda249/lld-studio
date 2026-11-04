import type { PatternRules, Finding } from "../types";

/**
 * Strategy: an interface with ≥ 2 implementations, and a context that holds one (typed as the interface,
 * passed in from outside) and delegates to it. Ported from the approved technical check (Notion 09).
 */
const rules: PatternRules = {
  slug: "strategy",
  name: "Strategy",
  review(m, h) {
    const out: Finding[] = [];
    let strategy = null, concretes: typeof m.classes = [];
    for (const i of h.abstractions()) {
      const impl = h.implementers(i.name, { concreteOnly: true });
      if (impl.length >= 2 && (!strategy || impl.length > concretes.length)) { strategy = i; concretes = impl; }
    }
    if (!strategy) {
      const findings: Finding[] = [{
        id: "strategy.no-shape", sev: "fail", title: "The Strategy shape isn't there yet",
        text: `I couldn't find an interface (${h.words.iface}) with at least two classes that implement it.`,
        fix: "Give each algorithm its own class, and make them all implement one interface with the same method.", lesson: "lesson"
      }];
      const b = m.classes.flatMap((c) => c.branches.map((x) => ({ cls: c.name, ...x })))[0];
      if (b) findings.push({
        id: "strategy.branches", sev: "note", line: b.line, title: `${b.cls} chooses between ${b.count} behaviours with ${h.words.ifElse}`,
        text: `That's exactly what Strategy replaces (line ${b.line}).`,
        fix: `Move each branch into its own class behind one interface, and let ${b.cls} hold one of them.`, lesson: "problem"
      });
      return { found: false, findings, suppress: ["general.branches"] };
    }
    const names = concretes.map((c) => c.name);
    const context = h.holdersOf([strategy.name, ...names], [strategy.name, ...names])[0];
    if (!context) {
      out.push({
        id: "strategy.no-context", sev: "fail", title: `Nothing holds a ${strategy.name} yet`,
        text: `${strategy.name} and its implementations (${h.list(names)}) are there, but no class keeps one in a field and delegates to it.`,
        fix: `Add a context class with a ${strategy.name} field, set through ${h.words.ctorParam}, and call it from a method.`, lesson: "lesson"
      });
      return { found: false, findings: out };
    }
    const roles = `${strategy.name} is the strategy, ${h.list(names)} implement it, and ${context.name} holds one.`;
    out.push({ id: "strategy.shape", sev: "pass", title: "Strategy shape found", text: roles });

    const created = h.createsOf(context, names);
    for (const cc of created) out.push({
      id: "strategy.context-creates-concrete", sev: "warn", line: cc.line, title: `${context.name} creates ${cc.type} itself`,
      text: `On line ${cc.line}, ${context.name} creates ${cc.type}, so it is locked to one algorithm and must be edited to use another.`,
      fix: `Accept a ${strategy.name} through ${h.words.ctorParam}${h.py ? " or a setter" : " or a setter (a var plus a method)"}; then new behaviour can be added without editing ${context.name} (Open/Closed).`,
      lesson: "lesson"
    });
    const fields = h.fieldsOfType(context, [strategy.name, ...names]);
    for (const f of fields.filter((x) => x.origin === "param" && x.type && names.includes(x.type))) out.push({
      id: "strategy.concrete-field", sev: "warn", line: f.line, title: `${context.name}.${f.name} is typed as a concrete class`,
      text: `${f.name} is declared as ${f.type}, so only that one algorithm fits.`,
      fix: `Type it as ${strategy.name} so any strategy can be plugged in (Dependency Inversion).`, lesson: "lesson"
    });
    if (!created.length && !out.some((x) => x.id === "strategy.concrete-field")) out.push({
      id: "strategy.depends-on-interface", sev: "pass", title: `${context.name} depends only on ${strategy.name}`,
      text: `${context.name} never names a concrete strategy, so new ones plug in without edits.`
    });
    // delegation
    const field = fields[0];
    const delegates = field ? h.callsOnField(context, field.name).length > 0 : false;
    out.push(delegates
      ? { id: "strategy.delegates", sev: "pass", title: `${context.name} delegates to its strategy`, text: `${context.name} calls the strategy instead of doing the work itself.` }
      : { id: "strategy.no-delegation", sev: "warn", line: field?.line, title: `${context.name} never calls its ${strategy.name}`,
          text: `${context.name} stores a ${strategy.name} but no method calls it.`,
          fix: `Forward the work: a method on ${context.name} should call ${h.py ? "self." : ""}${field?.name ?? "strategy"}.${h.commonMethods([strategy])[0] ?? "run"}(...).`, lesson: "lesson" });
    // swappable at runtime
    const setter = context.methods.some((x) => x.assigns.includes(field?.name ?? "\u0000") && x.name !== "__init__");
    if (!setter) out.push({
      id: "strategy.no-setter", sev: "note", title: "The strategy can't be swapped after creation",
      text: `${context.name} gets its ${strategy.name} once. That's fine if it never changes; add a setter if the client should switch while the program runs.`,
      fix: h.py ? `def set_${field?.name.replace(/^_/, "") ?? "strategy"}(self, s: ${strategy.name}) -> None: ...` : `def set${(field?.name ?? "strategy").replace(/^./, (c) => c.toUpperCase())}(s: ${strategy.name}): Unit = ...`
    });
    // type checks on strategies inside the context are the old if/elif again
    for (const mt of context.methods) {
      const tc = mt.typeChecks.find((t) => names.includes(t.type));
      if (tc) { out.push({ id: "strategy.type-check", sev: "warn", line: tc.line, title: `${context.name} checks which strategy it has`,
        text: `${context.name}.${mt.name} checks for ${tc.type} (line ${tc.line}); that brings the if/elif back.`,
        fix: "Let each strategy do its own work through the shared method instead.", lesson: "lesson" }); break; }
    }
    return { found: true, findings: out, roles, suppress: ["general.branches"] };
  }
};

export default rules;
