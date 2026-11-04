import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";

/**
 * Flyweight: a factory that keeps a cache (a dict / Map field, or Python's @cache) and hands out shared
 * objects of one class (the flyweight), creating each only once. A context class usually holds a reference
 * to a flyweight plus its own unique (extrinsic) state.
 */

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CACHE_DECOS = /^(cache|lru_cache|cached|memoize|memoized)$/;
const CACHE_CALLS = /^(getOrElseUpdate|setdefault|get|getOrElse|computeIfAbsent|update|put)$/;
const BIG_TYPES = /^(bytes|bytearray|Array|memoryview|Image|Bitmap|Texture|Mesh|Sprite|Icon|Glyph)$/;

interface Factory { owner: ClassInfo | null; method: MethodInfo; flyweight: string; cache: string; createLine: number }

/** Does this method use one of the cache names (a call on it, a subscript in a return, or an assignment)? */
function usesCache(mt: MethodInfo, names: string[]): string | null {
  for (const n of names) {
    const re = new RegExp(`^(self\\.|cls\\.|this\\.|${"[A-Z]\\w*\\."})?${esc(n)}(\\[|$)`);
    if (mt.calls.some((c) => c.receiver && re.test(c.receiver) && CACHE_CALLS.test(c.method))) return n;
    if (mt.returns.some((r) => re.test(r.trim()) && /\[/.test(r))) return n;
    if (mt.assigns.some((a) => re.test(a))) return n;
  }
  return null;
}

const rules: PatternRules = {
  slug: "flyweight",
  name: "Flyweight",
  review(m, h) {
    const out: Finding[] = [];
    const known = new Set(m.classes.map((c) => c.name));

    // Find factories: a method that creates a known class and uses a cache to keep it.
    const factories: Factory[] = [];
    const nearMiss: { owner: ClassInfo | null; method: MethodInfo; flyweight: string; line: number }[] = [];
    for (const c of m.classes) {
      const cacheFields = c.fields.filter((f) => f.origin === "collection" || /^(dict|Map|TrieMap|HashMap|mutable)/.test(f.type ?? "") || f.elementType).map((f) => f.name);
      for (const mt of c.methods) {
        const made = mt.creates.find((x) => known.has(x.type) && x.type !== c.name);
        if (!made) continue;
        const cache = usesCache(mt, cacheFields);
        if (cache) factories.push({ owner: c, method: mt, flyweight: made.type, cache, createLine: made.line });
        else if (mt.returnType && new RegExp(`\\b${esc(made.type)}\\b`).test(mt.returnType)) nearMiss.push({ owner: c, method: mt, flyweight: made.type, line: made.line });
      }
    }
    for (const fn of m.functions) {
      const made = fn.creates.find((x) => known.has(x.type));
      if (!made) {
        // A pre-built pool: a lookup function that returns POOL[key], typed as a class whose objects are made once.
        const t = fn.returnType ? [...known].find((k) => new RegExp(`\\b${esc(k)}\\b`).test(fn.returnType!)) : undefined;
        const fnNames = new Set(m.functions.map((f) => f.name));
        const pool = h.py
          ? (fn.returns.length && fn.returns.every((r) => /^[A-Za-z_]\w*\[/.test(r.trim())) ? fn.returns[0].trim().split("[")[0] : null)
          : fn.calls.find((c) => c.receiver === null && /^[a-z_]\w*$/.test(c.method) && !fnNames.has(c.method) && !/^(println|print|require|assert)$/.test(c.method))?.method ?? null;
        if (t && pool && m.topCreates.some((x) => x.type === t))
          factories.push({ owner: null, method: fn, flyweight: t, cache: pool, createLine: -1 });
        continue;
      }
      // (the model keeps a trailing comment in decorator text, so compare the first word only)
      const deco = fn.decorators.map((d) => d.trim().split(/[\s#(]/)[0]).find((d) => CACHE_DECOS.test(d));
      const subscript = fn.returns.find((r) => /^[a-z_]\w*\[/.test(r.trim()));
      const cacheCall = fn.calls.find((c) => c.receiver && /^[a-z_]\w*$/.test(c.receiver) && /^(getOrElseUpdate|setdefault)$/.test(c.method));
      const cache = deco ? `@${deco}` : subscript ? subscript.split("[")[0] : cacheCall?.receiver ?? null;
      if (cache) factories.push({ owner: null, method: fn, flyweight: made.type, cache, createLine: made.line });
      else if (fn.returnType && new RegExp(`\\b${esc(made.type)}\\b`).test(fn.returnType)) nearMiss.push({ owner: null, method: fn, flyweight: made.type, line: made.line });
    }

    if (!factories.length) {
      const nm = nearMiss[0];
      if (nm) {
        const where = nm.owner ? `${nm.owner.name}.${nm.method.name}` : `${nm.method.name}()`;
        out.push({ id: "flyweight.no-cache", sev: "fail", line: nm.line, title: `${where} makes a new ${nm.flyweight} every time`,
          text: `${where} creates a fresh ${nm.flyweight} on each call (line ${nm.line}), so nothing is shared and memory use stays the same. The heart of Flyweight is reusing one object for every request with the same key.`,
          fix: h.py
            ? `Keep a dict from key to ${nm.flyweight}: if the key is missing, create and store it; then return the stored one. (Or put @functools.cache on a small factory function.)`
            : `Keep a Map from key to ${nm.flyweight} and return cache.getOrElseUpdate(key, ${nm.flyweight}(...)).`,
          lesson: "lesson" });
      } else {
        out.push({ id: "flyweight.no-shape", sev: "fail", title: "The Flyweight shape isn't there yet",
          text: "I couldn't find a factory that keeps a cache and hands out shared objects. Without one, every object carries its own copy of data that many objects have in common.",
          fix: `Move the shared (intrinsic) data into its own small immutable class, and add a factory with a ${h.py ? "dict" : "Map"} cache that returns the existing object for a key instead of making a new one.`,
          lesson: "lesson" });
      }
      const big = m.classes.flatMap((c) => c.fields.filter((f) => f.type && BIG_TYPES.test(f.type) && !f.classLevel).map((f) => ({ c, f })))[0];
      if (big) out.push({ id: "flyweight.duplicated-state", sev: "note", line: big.f.line, title: `Every ${big.c.name} carries its own ${big.f.name}`,
        text: `${big.c.name}.${big.f.name} (line ${big.f.line}) is heavy data that is usually the same for many objects. With thousands of ${big.c.name} objects, that copy is repeated thousands of times.`,
        fix: `Move ${big.f.name} (and anything else shared, such as ${h.list(big.c.fields.filter((x) => x !== big.f && x.type && /^(str|String)$/.test(x.type)).map((x) => x.name)) || "its style"}) into a shared flyweight class, and keep only the per-object values in ${big.c.name}.`,
        lesson: "problem" });
      return { found: false, findings: out };
    }

    // Prefer a factory whose flyweight is held by some other class (a context).
    const holders = (fw: string) => h.holdersOf([fw]).filter((c) => !factories.some((f) => f.owner === c));
    const fac = factories.find((f) => holders(f.flyweight).length) ?? factories[0];
    const fw = h.cls(fac.flyweight)!;
    const context = holders(fw.name)[0];
    const facName = fac.owner ? `${fac.owner.name}.${fac.method.name}` : `the ${fac.method.name}() function`;
    const roles = `${fw.name} is the shared flyweight, ${facName} is the factory that hands it out${context ? `, and ${context.name} is the context that holds one plus its own data` : ""}.`;
    out.push({ id: "flyweight.shape", sev: "pass", title: "Flyweight shape found", text: roles });
    if (!fac.owner) out.push({ id: "flyweight.function-factory", sev: "note", line: fac.method.line, title: fac.createLine === -1 ? "A fixed pool works as the factory" : "A cached function works as the factory",
      text: fac.createLine === -1
        ? `${fac.method.name}() looks up ready-made objects in ${fac.cache}, a fixed pool built once. That works well when the set of shared objects is small and known in advance.`
        : fac.cache.startsWith("@")
        ? `This is the lighter Python form from the lesson: ${fac.cache} on ${fac.method.name}() makes it return the same ${fw.name} for the same arguments. It does the job of a factory class in one line.`
        : `${fac.method.name}() keeps its objects in ${fac.cache}, so it does the job of a factory class.` });

    // 1. The flyweight must be immutable: many objects share it.
    const mutator = fw.methods.find((mt) => !["__init__", "__post_init__", "<init>"].includes(mt.name) && mt.assigns.some((a) => fw.fields.some((f) => f.name === a.replace(/^(self\.|this\.)/, ""))));
    if (mutator) out.push({ id: "flyweight.mutable", sev: "warn", line: mutator.line, title: `${fw.name}.${mutator.name} changes shared state`,
      text: `${mutator.name} changes a field of ${fw.name}. Because one ${fw.name} is shared by many objects, that change shows up in all of them at once, which is almost never what you want.`,
      fix: h.py
        ? `Make ${fw.name} immutable: remove ${mutator.name}, and use @dataclass(frozen=True). If one object needs a different value, ask the factory for a different ${fw.name}.`
        : `Make ${fw.name} immutable: remove ${mutator.name} and use val (a final case class is ideal). If one object needs a different value, ask the factory for a different ${fw.name}.`,
      lesson: "lesson" });
    else {
      out.push({ id: "flyweight.immutable", sev: "pass", title: `${fw.name} doesn't change after creation`,
        text: `No method of ${fw.name} changes its fields, so sharing one object is safe.${fw.frozen ? (h.py ? " It is a frozen dataclass, so even outside code can't change it." : " All its fields are vals.") : ""}` });
      if (fw.dataclass && !fw.frozen) out.push({ id: "flyweight.not-frozen", sev: "note", line: fw.line, title: `Outside code could still change ${fw.name}`,
        text: h.py ? `${fw.name} is a dataclass without frozen=True, so code holding one shared object can still write to its fields and change it for everyone.` : `${fw.name} has a var field, so code holding the shared object can change it for everyone.`,
        fix: h.py ? `Use @dataclass(frozen=True) for ${fw.name}.` : `Make ${fw.name}'s fields vals.`, lesson: "lesson" });
    }

    // 2. Clients should go through the factory, not build flyweights themselves.
    const insideFactory = new Set(fac.method.creates.map((x) => x.line));
    const bypass = fac.createLine === -1 ? undefined : [
      ...m.topCreates.filter((x) => x.type === fw.name && !insideFactory.has(x.line)).map((x) => ({ who: "the client code", line: x.line })),
      ...m.classes.filter((c) => c !== fac.owner && c !== fw).flatMap((c) => h.createsOf(c, [fw.name]).map((x) => ({ who: c.name, line: x.line })))
    ].filter((x) => !factories.some((f) => f.createLine === x.line))[0];
    if (bypass) out.push({ id: "flyweight.bypasses-factory", sev: "warn", line: bypass.line, title: `${bypass.who.replace(/^the/, "The")} creates ${fw.name} directly`,
      text: `Line ${bypass.line} builds a new ${fw.name} instead of asking the factory, so this one is not shared and the memory saving is lost for it.`,
      fix: `Replace ${fw.name}(...) with ${fac.owner ? `${fac.owner.name}.${fac.method.name}` : fac.method.name}(...) so equal styles come back as the same object.`, lesson: "lesson" });
    else out.push({ id: "flyweight.uses-factory", sev: "pass", title: `Every ${fw.name} comes from the factory`,
      text: fac.createLine === -1 ? `Each ${fw.name} is built once for the pool, and everything else looks it up.` : `Nothing outside the factory builds one, so equal ${fw.name} objects are always shared.` });

    // 3. A context holds the flyweight and keeps only the unique (extrinsic) state.
    if (!context) out.push({ id: "flyweight.no-context", sev: "note", title: `Nothing holds a ${fw.name} yet`,
      text: `Usually a small context class keeps the data unique to each object (such as a position) plus a reference to a shared ${fw.name}.`,
      fix: `Add a class with the per-object fields and one field typed ${fw.name}, filled from the factory.` });
    else {
      const intrinsic = new Set(fw.fields.filter((f) => !f.classLevel).map((f) => f.name.replace(/^_/, "")));
      const dup = context.fields.find((f) => intrinsic.has(f.name.replace(/^_/, "")) && f.type !== fw.name);
      if (dup) out.push({ id: "flyweight.context-duplicates", sev: "warn", line: dup.line, title: `${context.name} keeps its own ${dup.name}`,
        text: `${dup.name} is already part of the shared ${fw.name}, yet every ${context.name} stores another copy. That brings back the duplication Flyweight removes.`,
        fix: `Remove ${dup.name} from ${context.name} and read it through the ${fw.name} it holds (for example ${h.py ? "self." : ""}${h.fieldsOfType(context, [fw.name])[0]?.name ?? "style"}.${dup.name}).`, lesson: "lesson" });
      else out.push({ id: "flyweight.context-split", sev: "pass", title: `${context.name} keeps only its own data`,
        text: `${context.name} holds its unique (extrinsic) values and points at a shared ${fw.name} for the rest.` });
    }

    return { found: true, findings: out, roles };
  }
};

export default rules;
