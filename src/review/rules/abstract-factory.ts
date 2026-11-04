import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Abstract Factory: a factory interface with one creation method per product (at least two), and two or more
 * concrete factories that each make a matching family. The client receives the factory as the interface.
 * Also recognises the idiomatic form: a dataclass / case class bundling matching functions, built once per family.
 */

const SKIP = /^(__\w+__|<init>|<module>|<top>|toString|equals|hashCode)$/;

function baseOf(t: string | null): string | null {
  if (!t) return null;
  const s = t.trim().replace(/^["']|["']$/g, "");
  const opt = s.match(/^(?:Optional|Option)\[(.+)\]$/);
  return (opt ? opt[1] : s).split("|")[0].split("[")[0].trim() || null;
}

/** Known classes a method makes: constructor calls, or a returned name of a known class. */
function made(mt: MethodInfo, known: Set<string>): { type: string; line: number }[] {
  const out = mt.creates.filter((c) => known.has(c.type)).map((c) => ({ type: c.type, line: c.line }));
  for (const r of mt.returns) {
    const t = r.trim().split("(")[0];
    if (known.has(t) && !out.some((x) => x.type === t)) out.push({ type: t, line: mt.line });
  }
  return out;
}

interface Slot { name: string; decl: MethodInfo; made: { factory: ClassInfo; mt: MethodInfo; product: string; line: number }[] }
interface Candidate { factory: ClassInfo; concretes: ClassInfo[]; slots: Slot[] }

function findCandidate(h: Helpers): Candidate | null {
  const known = new Set(h.classes.map((c) => c.name));
  let best: Candidate | null = null;
  for (const f of h.abstractions()) {
    const concretes = h.implementers(f.name, { concreteOnly: true });
    if (!concretes.length) continue;
    const slots: Slot[] = [];
    for (const decl of f.methods) {
      if (SKIP.test(decl.name) || decl.name === "?") continue;
      const madeHere: Slot["made"] = [];
      for (const c of concretes) {
        const mt = h.method(c, decl.name);
        if (!mt || mt.abstract) continue;
        const p = made(mt, known).find((x) => x.type !== c.name && x.type !== f.name);
        if (p) madeHere.push({ factory: c, mt, product: p.type, line: p.line });
      }
      if (madeHere.length) slots.push({ name: decl.name, decl, made: madeHere });
    }
    if (!slots.length) continue;
    const rank = (x: Candidate) => x.slots.length * 10 + x.concretes.length;
    const cand = { factory: f, concretes, slots };
    if (!best || rank(cand) > rank(best)) best = cand;
  }
  return best;
}

/** Idiomatic form: a dataclass / case class holding two or more functions, built once per family. */
function findKit(h: Helpers): { kit: ClassInfo; fns: string[]; families: number } | null {
  for (const c of h.classes) {
    if (!c.dataclass) continue;
    const fns = c.ctorParams.filter((p) => p.type && (/^Callable\b/.test(p.type) || /=>/.test(p.type))).map((p) => p.name);
    if (fns.length < 2) continue;
    const families = h.model.topCreates.filter((x) => x.type === c.name).length
      + h.classes.reduce((n, o) => n + o.creates.filter((x) => x.type === c.name).length, 0);
    if (families >= 2) return { kit: c, fns, families };
  }
  return null;
}

const rules: PatternRules = {
  slug: "abstract-factory",
  name: "Abstract Factory",
  review(m, h) {
    const out: Finding[] = [];
    const cand = findCandidate(h);
    const fmName = h.name("create_storage");

    if (!cand || cand.slots.length < 2) {
      const kit = findKit(h);
      if (kit && !cand) {
        const roles = `${kit.kit.name} bundles the matching functions (${h.list(kit.fns)}), and each of its ${kit.families} instances is one family.`;
        out.push({ id: "abstract-factory.shape", sev: "pass", title: "Abstract Factory (bundle form) found", text: roles });
        out.push({
          id: "abstract-factory.kit-form", sev: "note", title: "You used the lighter idiomatic form",
          text: `Each ${kit.kit.name} value is a whole family of matching functions, so picking one value picks the whole family and parts can't be mixed. In ${h.py ? "Python" : "Scala"} that is often enough.`,
          fix: `Keep it while the products are simple functions. Switch to a factory ${h.words.ifaceShort} with one ${h.name("create_x")}() method per product when the products carry state or several methods.`,
          lesson: "lesson"
        });
        return { found: true, findings: out, roles };
      }
      if (cand) {
        const s = cand.slots[0];
        out.push({
          id: "abstract-factory.one-product", sev: "fail", line: s.decl.line, title: `${cand.factory.name} makes only one kind of product`,
          text: `${cand.factory.name} has one creation method, ${s.name}(). An Abstract Factory makes a family: two or more kinds of product that belong together. With one product this is the Factory Method pattern.`,
          fix: `Add a second creation method to ${cand.factory.name} for the other product in the family, and implement it in ${h.list(cand.concretes.map((c) => c.name))}.`,
          lesson: "lesson"
        });
        return { found: false, findings: out };
      }
      out.push({
        id: "abstract-factory.no-shape", sev: "fail", title: "The Abstract Factory shape isn't there yet",
        text: `I couldn't find a factory interface, written as ${h.words.iface}, with a creation method for each product in a family, implemented by factory classes that each make a matching set.`,
        fix: `Write a factory ${h.words.ifaceShort} with one method per product (for example ${fmName}() and ${h.name("create_queue")}()), add one factory class per family that implements all of them, and pass a factory into the code that needs the products.`,
        lesson: "lesson"
      });
      // the tell-tale smell: one class creating products of several families itself
      const known = new Set(h.classes.map((c) => c.name));
      const smell = m.classes.map((c) => ({ c, types: [...new Set(c.creates.filter((x) => known.has(x.type)).map((x) => x.type))] }))
        .filter((x) => x.types.length >= 3).sort((a, b) => b.types.length - a.types.length)[0];
      if (smell) {
        const line = smell.c.branches[0]?.line ?? smell.c.creates[0].line;
        out.push({
          id: "abstract-factory.branches", sev: "note", line,
          title: `${smell.c.name} picks every product class itself`,
          text: `${smell.c.name} creates ${h.list(smell.types)} directly (from line ${line}), choosing them by a value. It must know every family's classes, and nothing stops it from mixing parts of two families.`,
          fix: `Move each family's creation into its own factory class behind one factory ${h.words.ifaceShort}, and give ${smell.c.name} a factory instead of a name.`,
          lesson: "problem"
        });
      }
      return { found: false, findings: out, suppress: ["general.branches"] };
    }

    const { factory, concretes, slots } = cand;
    const cNames = concretes.map((c) => c.name);
    const allProducts = [...new Set(slots.flatMap((s) => s.made.map((x) => x.product)))];
    // product interface per slot: the declared return type, or an abstraction all its products share
    const slotIface = (s: Slot): ClassInfo | undefined => {
      const d = h.cls(baseOf(s.decl.returnType));
      if (d && h.isAbstraction(d)) return d;
      const ps = s.made.map((x) => h.cls(x.product)).filter((c): c is ClassInfo => !!c);
      return h.abstractions().find((a) => a.name !== factory.name && ps.length > 0 && ps.every((p) => h.isA(p, a.name)));
    };
    const ifaces = slots.map(slotIface);
    const ifaceNames = [...new Set(ifaces.filter((x): x is ClassInfo => !!x).map((x) => x.name))];

    // client: holds or receives the factory (as a field, constructor or method parameter, or a top-level function)
    const familyTypes = [factory.name, ...cNames];
    const typed = (t: string | null) => { const b = baseOf(t); return b && familyTypes.includes(b) ? b : null; };
    const clients = h.classes.filter((c) => !familyTypes.includes(c.name) && !allProducts.includes(c.name) && !ifaceNames.includes(c.name))
      .map((c) => {
        const refs = [
          ...c.fields.map((f) => ({ t: typed(f.type), line: f.line })),
          ...c.ctorParams.map((p) => ({ t: typed(p.type), line: c.line })),
          ...c.methods.flatMap((mt) => mt.params.map((p) => ({ t: typed(p.type), line: mt.line })))
        ].filter((x): x is { t: string; line: number } => !!x.t);
        return { c, refs };
      }).filter((x) => x.refs.length > 0);
    const fnClients = m.functions.filter((f) => f.params.some((p) => typed(p.type)));
    const client = clients[0];

    const roles = `${factory.name} is the abstract factory with ${h.list(slots.map((s) => s.name + "()"))}, ${h.list(cNames)} make${cNames.length === 1 ? "s" : ""} the families${ifaceNames.length ? `, ${h.list(ifaceNames)} ${ifaceNames.length === 1 ? "is the product" : "are the products"}` : ""}${client ? `, and ${client.c.name} is the client` : fnClients[0] ? `, and ${fnClients[0].name}() is the client` : ""}.`;
    out.push({ id: "abstract-factory.shape", sev: "pass", title: "Abstract Factory shape found", text: roles });

    // 1. at least two families
    if (concretes.length < 2) out.push({
      id: "abstract-factory.one-family", sev: "warn", line: concretes[0].line, title: `Only one family (${cNames[0]})`,
      text: `With one concrete factory there is nothing to switch between yet; the pattern pays off when ${factory.name} has two or more families.`,
      fix: `Add a second factory class that ${h.py ? "inherits from" : "extends"} ${factory.name} and makes its own matching products.`, lesson: "lesson"
    });

    // 2. every factory makes the whole family
    const declared = [...new Set([...slots.map((s) => s.name), ...factory.methods.filter((x) => x.abstract && !SKIP.test(x.name) && x.name !== "?").map((x) => x.name)])];
    for (const c of concretes) {
      const missing = declared.filter((n) => { const mt = h.method(c, n); return !mt || mt.abstract; })
        .filter((n) => { const own = h.method(factory, n); return !own || own.abstract; });
      if (missing.length) { out.push({
        id: "abstract-factory.incomplete-factory", sev: "warn", line: c.line, title: `${c.name} is missing ${h.list(missing.map((x) => x + "()"))}`,
        text: `Every factory must make every product in the family; otherwise code using ${c.name} breaks as soon as it asks for that product.`,
        fix: `Implement ${h.list(missing.map((x) => x + "()"))} in ${c.name}, returning the product that matches its family.`, lesson: "lesson"
      }); }
    }
    if (!out.some((x) => x.id === "abstract-factory.incomplete-factory") && concretes.length >= 2) out.push({
      id: "abstract-factory.complete-families", sev: "pass", title: "Every factory makes the whole family",
      text: `${h.list(cNames)} each implement ${h.list(declared.map((x) => x + "()"))}.`
    });

    // 3. families don't share products (a mixed family, like the AWS queue in the GCP branch)
    for (const s of slots) {
      const seen = new Map<string, string>();
      for (const x of s.made) {
        const prev = seen.get(x.product);
        if (prev && prev !== x.factory.name) {
          out.push({
            id: "abstract-factory.shared-product", sev: "warn", line: x.line, title: `${prev} and ${x.factory.name} both make ${x.product}`,
            text: `${x.factory.name}.${s.name}() returns ${x.product}, the same product as ${prev}. That mixes two families, which is exactly the bug Abstract Factory is meant to prevent.`,
            fix: `Give ${x.factory.name} its own product class for ${s.name}(), one that belongs to its family.`, lesson: "problem"
          });
          break;
        }
        seen.set(x.product, x.factory.name);
      }
    }

    // 4. products behind interfaces
    slots.forEach((s, i) => {
      const iface = ifaces[i];
      const products = [...new Set(s.made.map((x) => x.product))];
      if (!iface) out.push({
        id: "abstract-factory.no-product-interface", sev: "warn", line: s.decl.line, title: `What ${s.name}() makes has no interface`,
        text: `${h.list(products)} don't share a ${h.words.ifaceShort}, so code using the factory has to know the concrete classes.`,
        fix: `Add ${h.words.iface} for this product, make ${h.list(products)} ${h.py ? "inherit from" : "extend"} it, and declare ${s.name}() in ${factory.name} to return it.`, lesson: "lesson"
      });
      else {
        const rt = baseOf(s.decl.returnType);
        if (rt && rt !== iface.name && products.includes(rt)) out.push({
          id: "abstract-factory.concrete-return-type", sev: "warn", line: s.decl.line, title: `${factory.name}.${s.name}() is declared to return ${rt}`,
          text: `The factory ${h.words.ifaceShort} names one family's concrete class, so other families can't fit.`,
          fix: `Declare the return type as ${iface.name}.`, lesson: "lesson"
        });
      }
    });
    if (!out.some((x) => x.id === "abstract-factory.no-product-interface" || x.id === "abstract-factory.concrete-return-type")) out.push({
      id: "abstract-factory.product-interfaces", sev: "pass", title: "Products are used through interfaces",
      text: `Every creation method hands back ${h.list(ifaceNames)}, so families can be swapped without changing the code that uses them (Dependency Inversion).`
    });

    // 5. the client gets a factory and never names concrete classes
    if (client) {
      const concreteRef = client.refs.find((r) => cNames.includes(r.t));
      const makes = h.createsOf(client.c, [...cNames, ...allProducts]);
      const factoryField = client.c.fields.find((f) => typed(f.type)) ?? client.c.ctorParams.find((p) => typed(p.type));
      const factoryIsField = client.c.fields.some((f) => typed(f.type));
      const productSlot = (t: string) => slots.find((s) => s.made.some((x) => x.product === t || h.isA(h.cls(t) ?? client.c, baseOf(s.decl.returnType) ?? "\u0000")))?.name ?? slots[0].name;
      if (concreteRef) out.push({
        id: "abstract-factory.client-concrete-factory", sev: "warn", line: concreteRef.line, title: `${client.c.name} asks for ${concreteRef.t}, not ${factory.name}`,
        text: `${client.c.name} is typed against one family's factory, so it can't be given another family.`,
        fix: `Type that field or parameter as ${factory.name} (Dependency Inversion).`, lesson: "lesson"
      });
      for (const mk of makes.slice(0, 2)) out.push({
        id: "abstract-factory.client-creates-concrete", sev: "warn", line: mk.line, title: `${client.c.name} creates ${mk.type} itself`,
        text: `On line ${mk.line}, ${client.c.name} names a concrete ${cNames.includes(mk.type) ? "factory" : "product"}, so it is tied to one family again.`,
        fix: cNames.includes(mk.type)
          ? `Receive the ${factory.name} through ${h.words.ctorParam} and let the caller choose the family.`
          : `Ask the factory for it (${h.py && factoryIsField ? "self." : ""}${factoryField?.name ?? "factory"}.${productSlot(mk.type)}()) instead of calling the constructor.`, lesson: "lesson"
      });
      if (!concreteRef && !makes.length) out.push({
        id: "abstract-factory.client-uses-interface", sev: "pass", title: `${client.c.name} only knows ${factory.name}`,
        text: `${client.c.name} receives a factory and never names a concrete class, so it can only ever get one family's products.`
      });
    } else if (!fnClients.length) out.push({
      id: "abstract-factory.no-client", sev: "note", title: `Nothing receives a ${factory.name} yet`,
      text: `The factories are there, but no class takes a ${factory.name} and uses its products. That client is where the benefit shows: it works with any family.`,
      fix: `Add a class that takes a ${factory.name} through ${h.words.ctorParam} and creates its products through it.`
    });

    // 6. a factory choosing with if/elif is the old problem in a new place
    const chooser = concretes.flatMap((c) => c.methods.map((mt) => ({ c, mt }))).find(({ mt }) => mt.branches.length > 0 && new Set(mt.creates.map((x) => x.type)).size >= 2);
    if (chooser) out.push({
      id: "abstract-factory.branches-in-factory", sev: "warn", line: chooser.mt.branches[0].line, title: `${chooser.c.name}.${chooser.mt.name} chooses between products`,
      text: `A concrete factory should make one family's products. Choosing with ${h.words.ifElse} inside it brings back the edit-for-every-family problem (Open/Closed).`,
      fix: `Split each case into its own factory class implementing ${factory.name}.`, lesson: "lesson"
    });

    return { found: true, findings: out, roles };
  }
};

export default rules;
