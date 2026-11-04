/**
 * Small, well-named queries over the class model, so each pattern's rules read like the lesson:
 * "find an interface with at least two implementations", "which class holds one of them", ...
 */
import type { Lang } from "../content/types";
import type { ClassInfo, CodeModel, FieldInfo, MethodInfo } from "./model";

export function makeHelpers(m: CodeModel) {
  const byName = new Map(m.classes.map((c) => [c.name, c]));
  const py = m.lang === "python";

  /** Every ancestor name of a class (bases, their bases, ...). */
  function ancestors(c: ClassInfo, seen = new Set<string>()): string[] {
    for (const b of c.bases) {
      if (seen.has(b)) continue;
      seen.add(b);
      const bc = byName.get(b);
      if (bc) ancestors(bc, seen);
    }
    return [...seen];
  }

  const h = {
    model: m,
    lang: m.lang as Lang,
    py,
    classes: m.classes,
    cls: (name: string | null | undefined) => (name ? byName.get(name) : undefined),
    isAbstraction: (c: ClassInfo) => c.kind === "interface" || c.kind === "abstract",
    abstractions: () => m.classes.filter((c) => c.kind === "interface" || c.kind === "abstract"),
    concretes: () => m.classes.filter((c) => c.kind !== "interface" && c.kind !== "abstract"),
    ancestors,
    /** Classes that extend / implement `name`, directly or through other classes. */
    implementers(name: string, opts: { concreteOnly?: boolean; direct?: boolean } = {}): ClassInfo[] {
      return m.classes.filter((c) => c.name !== name
        && (opts.direct ? c.bases.includes(name) : ancestors(c).includes(name))
        && (!opts.concreteOnly || (c.kind !== "interface" && c.kind !== "abstract")));
    },
    /** Does class c extend / implement `name` (directly or indirectly)? */
    isA: (c: ClassInfo, name: string) => ancestors(c).includes(name),
    /** Fields of c that point at any of the given types (by declared type, element type or what was created). */
    fieldsOfType(c: ClassInfo, types: string[]): FieldInfo[] {
      const set = new Set(types);
      return c.fields.filter((f) => (f.type && set.has(f.type)) || (f.elementType && set.has(f.elementType)) || f.created.some((t) => set.has(t)));
    },
    /** Classes (other than those listed) that hold a field of one of the given types. */
    holdersOf(types: string[], exclude: string[] = []): ClassInfo[] {
      const ex = new Set([...exclude, ...types]);
      return m.classes.filter((c) => !ex.has(c.name) && h.fieldsOfType(c, types).length > 0);
    },
    method: (c: ClassInfo, name: string) => c.methods.find((x) => x.name === name),
    methodsMatching: (c: ClassInfo, re: RegExp) => c.methods.filter((x) => re.test(x.name)),
    /** Calls made inside c whose receiver mentions the field (self.f / this.f / f). */
    callsOnField(c: ClassInfo, field: string): { method: MethodInfo; call: MethodInfo["calls"][number] }[] {
      const re = new RegExp(`^(self\\.|this\\.)?${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
      return c.methods.flatMap((mt) => mt.calls.filter((x) => x.receiver !== null && re.test(x.receiver)).map((call) => ({ method: mt, call })));
    },
    /** Constructor calls of the given types made inside c (with line numbers). */
    createsOf: (c: ClassInfo, types: string[]) => c.creates.filter((x) => types.includes(x.type)),
    /** Overridden method names shared by all classes in the list. */
    commonMethods(list: ClassInfo[]): string[] {
      if (!list.length) return [];
      const sets = list.map((c) => new Set(c.methods.map((x) => x.name)));
      return [...sets[0]].filter((n) => sets.every((s) => s.has(n)));
    },
    /** Public (non-underscore) method names of a class. */
    publicMethods: (c: ClassInfo) => c.methods.filter((x) => !x.name.startsWith("_")).map((x) => x.name),
    /** "A", "A and B", "A, B and C" */
    list(names: string[]): string {
      if (names.length <= 1) return names.join("");
      return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    },
    /** Language-specific words for messages. */
    words: {
      iface: py ? "an abstract base class (ABC) or Protocol" : "a trait",
      ifaceShort: py ? "ABC" : "trait",
      ctorParam: py ? "an __init__ parameter" : "a constructor parameter",
      self: py ? "self" : "this",
      ifElse: py ? "if/elif" : "if/else or match",
      typeCheck: py ? "isinstance" : "a type match",
      snake: (s: string) => (py ? s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase() : s)
    },
    /** Pythonic or Scala spelling of a method name written in snake_case. */
    name: (snake: string) => (py ? snake : snake.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase()))
  };
  return h;
}

export type Helpers = ReturnType<typeof makeHelpers>;
