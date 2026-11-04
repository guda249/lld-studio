import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Factory Method: a creator class with a method that makes an object, overridden by at least one subclass that
 * returns its own product; the creator's other methods call it instead of naming concrete classes.
 * Also recognises the lighter idiomatic form: a class that receives a factory function and calls it.
 */

const SKIP = /^(__\w+__|<init>|<module>|<top>|toString|equals|hashCode)$/;

/** Classes a method makes: constructor calls, or `return Foo` / last expression naming a known class. */
function made(mt: MethodInfo, known: Set<string>): { type: string; line: number }[] {
  const out = mt.creates.map((c) => ({ type: c.type, line: c.line }));
  for (const r of mt.returns) {
    const t = r.trim().split("(")[0];
    if (known.has(t) && !out.some((x) => x.type === t)) out.push({ type: t, line: mt.line });
  }
  return out;
}

function baseOf(t: string | null): string | null {
  if (!t) return null;
  const s = t.trim().replace(/^["']|["']$/g, "");
  const opt = s.match(/^(?:Optional|Option)\[(.+)\]$/);
  return (opt ? opt[1] : s).split("|")[0].split("[")[0].trim() || null;
}

interface Candidate {
  creator: ClassInfo;
  fm: MethodInfo;
  overrides: { cls: ClassInfo; mt: MethodInfo; products: string[] }[];
  score: number;
}

function findCandidate(h: Helpers): Candidate | null {
  const known = new Set(h.classes.map((c) => c.name));
  let best: Candidate | null = null;
  for (const creator of h.classes) {
    for (const fm of creator.methods) {
      if (SKIP.test(fm.name) || !fm.name || fm.name === "?") continue;
      const overrides = h.implementers(creator.name)
        .map((cls) => ({ cls, mt: h.method(cls, fm.name) }))
        .filter((x): x is { cls: ClassInfo; mt: MethodInfo } => !!x.mt && !x.mt.abstract)
        .map((x) => ({ ...x, products: [...new Set(made(x.mt, known).map((p) => p.type))].filter((p) => p !== x.cls.name && p !== creator.name) }))
        .filter((x) => x.products.length > 0);
      if (!overrides.length) continue;
      // creator's own other methods calling it make the case much stronger
      const used = creator.methods.some((o) => o !== fm && o.calls.some((c) => c.method === fm.name && (c.receiver === null || /^(self|this)$/.test(c.receiver))));
      const score = overrides.length * 2 + (fm.abstract ? 2 : 0) + (used ? 3 : 0) + (/^(create|make|new|build|get)/i.test(fm.name) ? 1 : 0);
      if (!best || score > best.score) best = { creator, fm, overrides, score };
    }
  }
  return best;
}

/** Idiomatic form: a class that is handed a function (Callable / () => T) and calls it. */
function findFunctionFactory(h: Helpers): { cls: ClassInfo; field: string } | null {
  for (const c of h.classes) {
    const params = c.ctorParams.filter((p) => p.type && (/^Callable\b/.test(p.type) || /=>/.test(p.type)));
    for (const p of params) {
      const field = c.fields.find((f) => f.origin === "param" && (f.name === p.name || f.name === "_" + p.name))?.name ?? p.name;
      const called = c.methods.some((mt) => mt.calls.some((x) => x.method === field || (x.receiver ?? "").replace(/^(self|this)\./, "").startsWith(field + "(")));
      if (called) return { cls: c, field };
    }
  }
  return null;
}

const rules: PatternRules = {
  slug: "factory-method",
  name: "Factory Method",
  review(m, h) {
    const out: Finding[] = [];
    const cand = findCandidate(h);

    if (!cand) {
      const fn = findFunctionFactory(h);
      if (fn) {
        const roles = `${fn.cls.name} is handed a factory function (${fn.field}) and calls it to make what it needs.`;
        out.push({ id: "factory-method.shape", sev: "pass", title: "Factory Method (function form) found", text: roles });
        out.push({
          id: "factory-method.function-form", sev: "note", title: "You used the lighter idiomatic form",
          text: `Instead of a creator subclass per product, ${fn.cls.name} receives a function that makes the product. In ${h.py ? "Python" : "Scala"} that is often the simplest choice, and it keeps the same benefit: ${fn.cls.name} never names a concrete class.`,
          fix: `Keep it. Switch to the classic form (an overridable ${h.name("create_product")}() method with one subclass per product) only if users are expected to extend ${fn.cls.name}.`,
          lesson: "lesson"
        });
        return { found: true, findings: out, roles };
      }
      out.push({
        id: "factory-method.no-shape", sev: "fail", title: "The Factory Method shape isn't there yet",
        text: "I couldn't find a creator class with a method that makes an object, which a subclass overrides to make a different object.",
        fix: `Move the object creation into its own method on a base class (for example ${h.name("create_message")}()), make the base class's other methods call it, and add one subclass per product that overrides it.`,
        lesson: "lesson"
      });
      // the tell-tale smell: one method choosing which class to create
      const smell = m.classes.flatMap((c) => c.methods.map((mt) => ({ c, mt })))
        .find(({ mt }) => mt.branches.length > 0 && new Set(mt.creates.map((x) => x.type)).size >= 2);
      if (smell) {
        const line = smell.mt.branches[0].line;
        const types = [...new Set(smell.mt.creates.map((x) => x.type))];
        out.push({
          id: "factory-method.branches", sev: "note", line,
          title: `${smell.c.name}.${smell.mt.name} picks which class to create with ${h.words.ifElse}`,
          text: `On line ${line}, ${smell.c.name}.${smell.mt.name} chooses between ${h.list(types)}. Every new kind means editing this method again, which is what Factory Method removes (Open/Closed).`,
          fix: `Replace the choice with a call to an overridable creation method, and let one subclass of ${smell.c.name} per kind return ${h.list(types)}.`,
          lesson: "problem"
        });
      }
      return { found: false, findings: out, suppress: ["general.branches"] };
    }

    const { creator, fm, overrides } = cand;
    const concreteCreators = overrides.map((o) => o.cls.name);
    const products = [...new Set(overrides.flatMap((o) => o.products))];
    // the product interface: the declared return type, or an abstraction every product shares
    const declared = baseOf(fm.returnType) ?? overrides.map((o) => baseOf(o.mt.returnType)).find(Boolean) ?? null;
    const declaredCls = h.cls(declared);
    let product: ClassInfo | undefined = declaredCls && h.isAbstraction(declaredCls) ? declaredCls : undefined;
    if (!product) {
      const productClasses = products.map((p) => h.cls(p)).filter((c): c is ClassInfo => !!c);
      product = h.abstractions().find((a) => productClasses.length > 0 && productClasses.every((pc) => h.isA(pc, a.name)));
    }
    const fmCall = `${fm.name}()`;
    const roles = `${creator.name} is the creator with the factory method ${fmCall}, ${h.list(concreteCreators)} override${concreteCreators.length === 1 ? "s" : ""} it to make ${h.list(products)}${product ? `, and ${product.name} is the product they share` : ""}.`;
    out.push({ id: "factory-method.shape", sev: "pass", title: "Factory Method shape found", text: roles });

    // 1. the creator's own logic uses the factory method
    const users = creator.methods.filter((o) => o !== fm && o.calls.some((c) => c.method === fm.name && (c.receiver === null || /^(self|this)$/.test(c.receiver))));
    out.push(users.length
      ? { id: "factory-method.creator-uses-it", sev: "pass", title: `${creator.name}.${users[0].name} calls ${fmCall}`,
          text: `The shared logic asks the factory method for its object, so it works the same for every subclass.` }
      : { id: "factory-method.unused", sev: "warn", line: fm.line, title: `Nothing in ${creator.name} calls ${fmCall}`,
          text: `The factory method exists, but no other method of ${creator.name} uses it. The point of the pattern is that the creator's own work calls the factory method instead of creating objects itself.`,
          fix: `In the ${creator.name} method that does the work, get the object with ${h.py ? "self." : ""}${fmCall} and use it.`, lesson: "lesson" });

    // 2. the creator does not create concrete products itself
    const productNames = products.filter((p) => p !== product?.name);
    const createdHere = creator.creates.filter((c) => productNames.includes(c.type) && !(fm.creates.some((x) => x.line === c.line)));
    for (const cc of createdHere.slice(0, 2)) out.push({
      id: "factory-method.creator-creates-concrete", sev: "warn", line: cc.line, title: `${creator.name} creates ${cc.type} itself`,
      text: `On line ${cc.line}, ${creator.name} names ${cc.type} directly, outside the factory method. That ties the shared logic to one product again.`,
      fix: `Call ${h.py ? "self." : ""}${fmCall} there instead, and leave the choice of class to the subclasses.`, lesson: "lesson"
    });

    // 3. the factory method returns the product interface, not a concrete class
    // (only the creator's declaration counts: a subclass may narrow its own override's return type)
    const concreteReturns = [fm]
      .map((mt) => ({ mt, t: baseOf(mt.returnType) }))
      .filter((x) => x.t && productNames.includes(x.t) && h.cls(x.t) && !h.isAbstraction(h.cls(x.t)!));
    if (!product) out.push({
      id: "factory-method.no-product-interface", sev: "warn", line: fm.line, title: `${h.list(products)} share no interface`,
      text: `The objects made by ${fmCall} don't have a common ${h.words.ifaceShort}, so ${creator.name} can't treat them the same way without knowing their classes.`,
      fix: `Add ${h.words.iface} for the product, with the method ${creator.name} needs from it; make ${h.list(products)} ${h.py ? "inherit from" : "extend"} it, and declare ${fmCall} to return it (Dependency Inversion).`,
      lesson: "lesson"
    });
    else if (concreteReturns.length) {
      const x = concreteReturns[0];
      out.push({
        id: "factory-method.concrete-return-type", sev: "warn", line: x.mt.line, title: `${fmCall} is declared to return ${x.t}`,
        text: `The return type names one concrete product, so callers are tied to it even though ${product.name} exists.`,
        fix: `Declare the return type as ${product.name}${h.py ? ` (-> ${product.name})` : ` (: ${product.name})`}.`, lesson: "lesson"
      });
    } else out.push({
      id: "factory-method.returns-interface", sev: "pass", title: `${fmCall} hands back a ${product.name}`,
      text: `${creator.name} only knows the ${product.name} interface, so a new product needs no change to it (Dependency Inversion).`
    });

    // 4. choosing a product inside the creator brings the if/elif back
    const chooser = [creator, ...overrides.map((o) => o.cls)].flatMap((c) => c.methods.map((mt) => ({ c, mt })))
      .find(({ mt }) => (mt.branches.length > 0 && new Set(mt.creates.map((x) => x.type)).size >= 2) || mt.typeChecks.some((t) => products.includes(t.type)));
    if (chooser) {
      const line = chooser.mt.branches[0]?.line ?? chooser.mt.typeChecks[0]?.line ?? chooser.mt.line;
      out.push({
        id: "factory-method.branches-in-creator", sev: "warn", line, title: `${chooser.c.name}.${chooser.mt.name} still picks the class with ${h.words.ifElse}`,
        text: `Line ${line} chooses between products by checking a value. With Factory Method the subclass is the choice, so this branch has to be edited for every new product (Open/Closed).`,
        fix: `Give each case its own subclass of ${creator.name} whose ${fmCall} returns one product, and remove the branch.`, lesson: "lesson"
      });
    }

    // 5. abstract or default factory method; how many creators
    out.push(fm.abstract
      ? { id: "factory-method.abstract-factory-method", sev: "pass", title: `${fmCall} is abstract in ${creator.name}`, text: "Every subclass must decide what it makes, so none can forget." }
      : { id: "factory-method.default-product", sev: "note", line: fm.line, title: `${creator.name} gives ${fmCall} a default`,
          text: `${creator.name} makes a product itself unless a subclass overrides ${fmCall}. That is a valid variant (handy when most users never subclass); just keep the default inside the factory method only.` });
    if (overrides.length === 1) out.push({
      id: "factory-method.one-creator", sev: "note", title: `Only ${concreteCreators[0]} overrides ${fmCall}`,
      text: "One override already shows the idea. A second concrete creator making a different product shows the real benefit: new products without editing the creator."
    });

    return { found: true, findings: out, roles, suppress: ["general.branches"] };
  }
};

export default rules;
