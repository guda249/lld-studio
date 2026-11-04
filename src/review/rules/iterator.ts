import type { PatternRules, Finding } from "../types";
import type { ClassInfo, MethodInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Iterator: a class that walks a collection one element at a time and remembers where it is (Python __next__
 * plus __iter__, Scala hasNext + next / extends Iterator[T], or a custom has_next/next interface), handed out by
 * the collection (the aggregate) or built over a collection it is given. Lighter forms the lesson teaches
 * (generator functions, __iter__ that yields, Scala functions returning Iterator[T]) are recognised with a note.
 * The end of the walk: Python's __next__ must raise StopIteration (the review checks for it).
 */

const NEXT = /^(__next__|next)$/;
const HAS_NEXT = /^(has_next|hasNext|has_more|hasMore)$/;
const ITER_BASES = new Set(["Iterator", "AbstractIterator", "BufferedIterator"]);
const ITER_TYPE = /^(Iterator|Generator|Iterable|LazyList)\b/;
const strip = (t: string | null | undefined) => (t ? t.replace(/^["']|["']$/g, "").split("[")[0].trim() : "");

const isIteratorClass = (c: ClassInfo, h: Helpers) => {
  if (h.isAbstraction(c)) return false;
  const names = c.methods.map((m) => m.name);
  if (names.includes("__next__")) return true;
  if (c.bases.some((b) => ITER_BASES.has(b))) return true;
  return names.some((n) => NEXT.test(n)) && names.some((n) => HAS_NEXT.test(n));
};

/** Does a walking method move the position forward (assigns a field, pops a buffer/stack, or pulls from another iterator)? */
function movesForward(c: ClassInfo, h: Helpers): boolean {
  const fieldNames = new Set(c.fields.map((f) => f.name));
  const walkers = c.methods.filter((m) => NEXT.test(m.name) || HAS_NEXT.test(m.name));
  return walkers.some((m: MethodInfo) =>
    // Python assigns are always self.x (tuple-assigned fields are not in the model, so don't require a known field)
    m.assigns.some((a) => h.py || fieldNames.has(a)) ||
    m.calls.some((x) => /^(pop|popleft|next|nextOption|__next__|dequeue|remove|pop_front|drop|tail)$/.test(x.method) || /\+=|-=$/.test(x.method)));
}

/** Light forms: generator functions / functions returning Iterator[T]; classes whose __iter__ / iterator delegates. */
function lightForm(h: Helpers): { what: string; line: number } | null {
  const fns = h.model.functions.filter((f) => ITER_TYPE.test(f.returnType ?? ""));
  if (fns.length) return { what: `the function${fns.length > 1 ? "s" : ""} ${h.list(fns.map((f) => f.name))} ${fns.length > 1 ? "return iterators" : "returns an iterator"}, so callers can loop lazily`, line: fns[0].line };
  for (const c of h.classes) {
    const it = c.methods.find((m) => (m.name === "__iter__" || m.name === "iterator") && !m.abstract && !m.returnsSelf);
    if (it) return { what: `${c.name}.${it.name} gives out ${h.py ? "a generator or a built-in iterator" : "a ready-made Iterator"}, so ${c.name} can be looped over directly`, line: it.line };
  }
  return null;
}

const rules: PatternRules = {
  slug: "iterator",
  name: "Iterator",
  review(m, h) {
    const out: Finding[] = [];
    const candidates = m.classes.filter((c) => isIteratorClass(c, h));
    // prefer an iterator someone else creates (has an aggregate), then the one with most walking methods
    const creatorsOf = (it: ClassInfo) => m.classes.filter((c) => c !== it && h.createsOf(c, [it.name]).length > 0);
    const iter = [...candidates].sort((a, b) => creatorsOf(b).length - creatorsOf(a).length)[0];

    if (!iter) {
      const light = lightForm(h);
      if (light) {
        const roles = `${light.what}.`;
        return { found: true, roles, findings: [
          { id: "iterator.shape", sev: "pass", title: "Iterator found (built-in form)", text: `${roles.charAt(0).toUpperCase()}${roles.slice(1)}` },
          { id: "iterator.light-form", sev: "note", line: light.line, title: "Using the language's own iterators",
            text: h.py
              ? "This is the idiomatic form from the lesson: a generator (yield) keeps the position for you, and for loops just work."
              : "This is the idiomatic form from the lesson: Scala's Iterator and its combinators keep the position for you.",
            fix: h.py
              ? "Write your own iterator class (with __iter__ and __next__) only when the walk needs state that a generator can't hold neatly."
              : "Write your own class that extends Iterator[T] (hasNext and next) only when the walk needs its own state.",
            lesson: "lesson" }
        ] };
      }
      const findings: Finding[] = [{
        id: "iterator.no-shape", sev: "fail", title: "The Iterator shape isn't there yet",
        text: h.py
          ? "I couldn't find an iterator: a class with __next__ (and __iter__) that hands out one element at a time and remembers where it is."
          : "I couldn't find an iterator: a class with hasNext and next (for example one that extends Iterator[T]) that hands out one element at a time and remembers where it is.",
        fix: h.py
          ? "Move the walking loop into an iterator class with __iter__ (return self) and __next__ (return the next item, raise StopIteration at the end), and give the collection an __iter__ that returns a new one."
          : "Move the walking loop into a class that extends Iterator[T] with hasNext and next, and give the collection a def iterator that returns a new one.",
        lesson: "lesson"
      }];
      // the smell: the client walks the collection by hand (the same method called again and again)
      const counts = new Map<string, { n: number; line: number }>();
      for (const c of m.topCalls) if (c.receiver) {
        const k = `${c.receiver}.${c.method}`;
        const e = counts.get(k);
        counts.set(k, { n: (e?.n ?? 0) + 1, line: Math.min(e?.line ?? c.line, c.line) });
      }
      const own = new Set(m.classes.flatMap((c) => c.methods.map((x) => x.name)));
      const walk = [...counts.entries()].filter(([k, v]) => v.n >= 2 && own.has(k.split(".").pop()!)).sort((a, b) => b[1].n - a[1].n)[0];
      if (walk) findings.push({
        id: "iterator.client-walks", sev: "note", line: walk[1].line, title: `The client calls ${walk[0]} ${walk[1].n} times`,
        text: `From line ${walk[1].line}, the caller walks the data by hand. Every caller repeats that loop and has to know how the data is stored, so a change in storage breaks all of them.`,
        fix: "Put the walking logic in one iterator, so every caller can use a plain for loop.", lesson: "problem"
      });
      return { found: false, findings };
    }

    const aggregates = creatorsOf(iter);
    const agg = aggregates[0];
    const iface = iter.bases.map((b) => h.cls(b)).find((b): b is ClassInfo => !!b && h.isAbstraction(b));
    const nextName = iter.methods.find((x) => NEXT.test(x.name))?.name ?? h.name("next");
    const sources = iter.ctorParams.filter((p) => p.type).map((p) => strip(p.type));

    const roles = `${iter.name} is the iterator${iface ? ` (it implements ${iface.name})` : ""}${agg ? `, and ${agg.name} is the collection that hands it out` : ""}.`;
    out.push({ id: "iterator.shape", sev: "pass", title: "Iterator shape found", text: roles });

    // 1. follows the language's iterator protocol
    const names = iter.methods.map((x) => x.name);
    if (h.py) {
      if (names.includes("__next__")) {
        if (!names.includes("__iter__")) out.push({ id: "iterator.missing-iter", sev: "warn", line: iter.line, title: `${iter.name} has __next__ but no __iter__`,
          text: `Python's for loop first calls iter() on what it gets. Without __iter__, "for x in ${iter.name}(...)" fails, even though next() works.`,
          fix: `Add to ${iter.name}:  def __iter__(self) -> "${iter.name}": return self`, lesson: "code" });
        else out.push({ id: "iterator.protocol", sev: "pass", title: "Follows Python's iterator protocol",
          text: `${iter.name} has __iter__ and __next__, so for loops, list(), sum() and next() all work with it.` });
        const nx = iter.methods.find((x) => x.name === "__next__")!;
        if (!nx.yields && !nx.raises.includes("StopIteration") && !nx.calls.some((c) => c.method === "next" || c.method === "__next__")) out.push({
          id: "iterator.no-stop", sev: "warn", line: nx.line, title: `__next__ never says "no more items"`,
          text: `A for loop over ${iter.name} only ends when __next__ raises StopIteration. Without it, the loop runs past the end (or returns None forever).`,
          fix: "At the start of __next__: if the position is past the last item, raise StopIteration.", lesson: "code" });
        else if (nx.raises.includes("StopIteration")) out.push({ id: "iterator.stops", sev: "pass", title: "Signals the end of the walk", text: `__next__ raises StopIteration when there is nothing left, so loops stop cleanly.` });
      } else out.push({ id: "iterator.custom-protocol", sev: "note", line: iter.line, title: `${iter.name} uses its own has_next / next`,
        text: "That is the classic textbook shape and it works, but Python's for loop can't use it.",
        fix: `Also add __iter__ (return self) and __next__ (raise StopIteration at the end) so ${iter.name} works in a plain for loop.` });
    } else {
      if (iter.bases.some((b) => ITER_BASES.has(b))) out.push({ id: "iterator.protocol", sev: "pass", title: `${iter.name} extends Iterator`,
        text: `${iter.name} is a real Scala Iterator, so for loops and map, filter, take and friends all work with it.` });
      else out.push({ id: "iterator.extend-iterator", sev: "note", line: iter.line, title: `${iter.name} doesn't extend Scala's Iterator`,
        text: "Your own hasNext/next interface is the classic shape and works, but the standard library can't use it.",
        fix: `Declare it as class ${iter.name}(...) extends Iterator[T] to get for loops and all the collection methods for free.` });
      if (!names.some((n) => HAS_NEXT.test(n)) || !names.some((n) => NEXT.test(n))) out.push({ id: "iterator.missing-method", sev: "warn", line: iter.line,
        title: `${iter.name} needs both hasNext and next`, text: "An iterator must say whether there is more (hasNext) and hand out the next element (next).",
        fix: "def hasNext: Boolean = ...\ndef next(): T = ...", lesson: "code" });
    }

    // 2. remembers its position
    out.push(movesForward(iter, h)
      ? { id: "iterator.keeps-position", sev: "pass", title: `${iter.name} remembers where it is`,
          text: `${nextName} moves the position forward, so each call returns the following element.` }
      : { id: "iterator.no-position", sev: "warn", line: iter.methods.find((x) => NEXT.test(x.name))?.line ?? iter.line, title: `${nextName} never moves forward`,
          text: `I couldn't see ${nextName} update any field, so it may return the same element forever.`,
          fix: h.py ? `Keep a position field (for example self._index) and increase it in ${nextName}.` : `Keep a private var position and increase it in ${nextName}.`, lesson: "lesson" });

    // 3. who hands out the iterator: the collection (fresh one per loop), or the client over data it passes in
    const selfFilled = !agg && iter.methods.some((x) => !NEXT.test(x.name) && !HAS_NEXT.test(x.name) && !/^(__init__|__iter__|<init>)$/.test(x.name)
      && x.calls.some((c) => /^(self\.|this\.)?\w+$/.test(c.receiver ?? "") && /^(append|add|\+=|insert|extend|push)$/.test(c.method)));
    if (agg) {
      const method = agg.methods.find((x) => x.creates.some((c) => c.type === iter.name));
      out.push({ id: "iterator.aggregate", sev: "pass", title: `${agg.name} hands out a fresh iterator`,
        text: `${agg.name}.${method?.name ?? "iterator"} creates a new ${iter.name} each time, so two loops never disturb each other and callers never see how ${agg.name} stores its data.` });
      if (method && h.py && method.name !== "__iter__" && !agg.methods.some((x) => x.name === "__iter__")) out.push({ id: "iterator.aggregate-iter", sev: "note", line: method.line,
        title: `${agg.name} can't be used in a for loop directly`,
        text: `Callers must call ${method.name}() first. That is fine when there are several ways to walk (like in-order and shuffled).`,
        fix: `If there is one main order, add def __iter__(self): return ${iter.name}(...) to ${agg.name}.` });
    } else if (selfFilled) out.push({ id: "iterator.single-pass", sev: "warn", line: iter.line, title: `${iter.name} is both the collection and its iterator`,
      text: `${iter.name} stores the items and also walks them, so there is only one position. After the first loop ends, a second loop gets nothing, and two loops at once mix each other up.`,
      fix: `Split it: keep the items in the collection class, and let its ${h.py ? "__iter__" : "iterator"} method return a new iterator object each time.`, lesson: "lesson" });
    else if (sources.length) out.push({ id: "iterator.aggregate", sev: "pass", title: `${iter.name} walks a ${sources[0]} it is given`,
      text: `The client builds ${iter.name} over a ${sources[0]}, and the iterator keeps the walking logic out of the caller.` });
    else out.push({ id: "iterator.no-aggregate", sev: "warn", line: iter.line, title: `It isn't clear what ${iter.name} walks over`,
      text: `Nothing creates ${iter.name} and it isn't given a collection, so the link between the data and its iterator is missing.`,
      fix: `Give ${iter.name} the collection through ${h.words.ctorParam}, and add a method on the collection that returns ${h.py ? `${iter.name}(self)` : `${iter.name}(this)`}.`, lesson: "lesson" });

    // 4. the collection returns the iterator interface, not the concrete class (only when there is one)
    if (agg && iface) {
      const leaky = agg.methods.filter((x) => strip(x.returnType) === iter.name);
      if (leaky.length) out.push({ id: "iterator.returns-concrete", sev: "warn", line: leaky[0].line, title: `${agg.name}.${leaky[0].name} returns ${iter.name}`,
        text: `Callers then depend on the concrete iterator, so swapping in another walk order means changing them too.`,
        fix: `Declare the return type as ${iface.name} (Dependency Inversion).`, lesson: "lesson" });
      else out.push({ id: "iterator.returns-interface", sev: "pass", title: `Callers only see ${iface.name}`,
        text: `${agg.name} returns ${iface.name}, so different walk orders can be swapped without changing the callers.` });
    }

    return { found: true, findings: out, roles };
  }
};

export default rules;
