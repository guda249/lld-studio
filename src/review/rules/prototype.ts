import type { PatternRules, Finding } from "../types";
import type { ClassInfo, FieldInfo, MethodInfo } from "../model";

/**
 * Prototype: a class that can copy itself (duplicate / clone / copy / __deepcopy__), ideally declared on a shared
 * interface, copying its nested mutable state deeply, and optionally a registry that hands out copies.
 * The lighter idiomatic form (frozen dataclass + dataclasses.replace, case class + copy(...)) is recognised too.
 */
const COPY_NAME = /^(duplicate|clone|cloned|copy|deep_copy|deepCopy|make_copy|makeCopy|replicate|__copy__|__deepcopy__)$/;
/** Calls that make a fresh collection (or a deep copy) inside a copy method. */
const FRESH = /^(list|dict|set|deque|deepcopy|copy|clone|from|toBuffer|toList|toMap|toSet|toVector|toArray|toSeq)$/;

function isMutableField(f: FieldInfo, py: boolean): boolean {
  if (f.classLevel) return false;
  const t = f.type ?? "";
  if (py) return /^(list|dict|set|deque|bytearray|defaultdict|OrderedDict|List|Dict|Set)$/.test(t) || (!t && f.origin === "collection");
  return /^(mutable\.|scala\.collection\.mutable\.|collection\.mutable\.)/.test(t) || /^(ListBuffer|ArrayBuffer|HashMap|HashSet|Array|StringBuilder|Buffer)$/.test(t);
}

function ownParams(mt: MethodInfo) { return mt.params.filter((p) => p.name !== "self" && p.name !== "cls"); }

/** Is mt a method that copies its own object? */
function copyMethodOf(c: ClassInfo): MethodInfo | undefined {
  const named = c.methods.find((mt) => !mt.abstract && !mt.static && COPY_NAME.test(mt.name));
  if (named) return named;
  return c.methods.find((mt) => !mt.abstract && !mt.static && mt.name !== "__init__" && ownParams(mt).length === 0
    && (mt.copies || mt.creates.some((x) => x.type === c.name))
    && ((mt.returnType ?? "").replace(/["']/g, "").trim() === c.name || mt.returns.includes(c.name) || mt.returnType === "Self"));
}

const rules: PatternRules = {
  slug: "prototype",
  name: "Prototype",
  review(m, h) {
    const out: Finding[] = [];
    const py = h.py;
    const protos = m.classes
      .filter((c) => !h.isAbstraction(c) && c.kind !== "enum")
      .map((c) => ({ c, mt: copyMethodOf(c) }))
      .filter((x): x is { c: ClassInfo; mt: MethodInfo } => !!x.mt);

    if (!protos.length) {
      // lighter idiomatic form: immutable value + replace(...) / .copy(...) by the client
      const values = m.classes.filter((c) => c.dataclass);
      const allCalls = [...m.topCalls, ...m.classes.flatMap((c) => c.methods.flatMap((x) => x.calls))];
      const idiom = values.length ? allCalls.find((x) => py
        ? (x.receiver === null && x.method === "replace") || (x.receiver === "dataclasses" && x.method === "replace") || (x.receiver === "copy" && x.method === "deepcopy")
        : x.method === "copy" && x.receiver !== null) : undefined;
      if (idiom) {
        const v = values[0];
        const roles = `${v.name} is the prototype, and new values are made by copying an existing one with ${py ? "replace(...)" : ".copy(...)"} instead of building them from scratch.`;
        out.push({ id: "prototype.shape", sev: "pass", title: "Prototype shape found (idiomatic form)", text: roles });
        out.push({ id: "prototype.idiomatic", sev: "note", line: idiom.line, title: `Lighter form: ${py ? "a dataclass and replace()" : "a case class and copy()"}`,
          text: `There is no duplicate() method, but line ${idiom.line} makes a changed copy of an existing ${v.name}. With immutable data this is the Prototype pattern without the extra classes, as the lesson's idiomatic version shows.`,
          fix: py ? `Make sure ${v.name} is @dataclass(frozen=True) and its collections are tuples, so a template can never be edited by accident.` : `Keep ${v.name}'s fields as vals with immutable collections (List, Map, Vector) so sharing the template stays safe.`,
          lesson: "code" });
        const mut = v.fields.filter((f) => isMutableField(f, py));
        if (mut.length && !(py && idiom.method === "deepcopy")) out.push({
          id: "prototype.shallow-copy", sev: "warn", line: mut[0].line, title: `Copies of ${v.name} share ${mut.map((f) => f.name).join(", ")}`,
          text: `${py ? "replace()" : "copy()"} only copies the outer object. ${h.list(mut.map((f) => f.name))} ${mut.length > 1 ? "are" : "is a"} mutable collection${mut.length > 1 ? "s" : ""}, so the copy and the template point at the same one: adding to the copy changes the template too.`,
          fix: py ? `Use tuples (or frozenset) for ${h.list(mut.map((f) => f.name))}, or copy them when replacing: replace(t, ${mut[0].name}=list(t.${mut[0].name}))` : `Use immutable List / Map / Vector for ${h.list(mut.map((f) => f.name))} instead of mutable collections.`,
          lesson: "lesson" });
        return { found: true, findings: out, roles };
      }
      const findings: Finding[] = [{
        id: "prototype.no-shape", sev: "fail", title: "The Prototype shape isn't there yet",
        text: `I couldn't find a class that can copy itself: a method such as duplicate() that returns a new object with the same settings.`,
        fix: py
          ? "Add a duplicate(self) method that returns copy.deepcopy(self), declare it on an ABC, and make new objects by copying a configured example."
          : "Add a duplicate(): T method (declared on a trait) that builds a new object with copies of the fields, and make new objects by copying a configured example.",
        lesson: "lesson"
      }];
      const counts = new Map<string, number>();
      for (const cr of m.topCreates) counts.set(cr.type, (counts.get(cr.type) ?? 0) + 1);
      const repeated = [...counts.entries()].find(([t, n]) => n >= 2 && h.cls(t));
      if (repeated) {
        const line = m.topCreates.find((x) => x.type === repeated[0])?.line;
        findings.push({ id: "prototype.repeated-setup", sev: "note", line, title: `${repeated[0]} is built from scratch ${repeated[1]} times`,
          text: `Each ${repeated[0]} is set up by hand (first at line ${line}). Repeated setup like this drifts apart over time; that is what Prototype fixes.`,
          fix: `Build one fully configured ${repeated[0]} as a template, then make the others by copying it and changing only what differs.`, lesson: "problem" });
      }
      return { found: false, findings };
    }

    const { c: proto, mt: copy } = protos[0];
    const protoNames = protos.map((x) => x.c.name);
    const iface = h.abstractions().find((a) => a.methods.some((x) => x.name === copy.name && x.abstract) && h.isA(proto, a.name));
    const registry = h.holdersOf(iface ? [iface.name, ...protoNames] : protoNames, protoNames)
      .find((c) => c.fields.some((f) => (f.elementType && (protoNames.includes(f.elementType) || f.elementType === iface?.name))));
    const roles = `${iface ? `${iface.name} declares ${copy.name}(), ` : ""}${h.list(protoNames)} ${protoNames.length > 1 ? "copy themselves" : "copies itself"} with ${copy.name}()${registry ? `, and ${registry.name} keeps the prototypes` : ""}.`;
    out.push({ id: "prototype.shape", sev: "pass", title: "Prototype shape found", text: roles });

    // the copy must be a new object
    for (const p of protos) {
      if (p.mt.returnsSelf) out.push({ id: "prototype.returns-same", sev: "warn", line: p.mt.line, title: `${p.c.name}.${p.mt.name} returns the same object`,
        text: `${p.mt.name}() returns ${h.words.self} itself, so the "copy" and the template are one object: changing one changes the other.`,
        fix: py ? `Return a new object: return copy.deepcopy(self).` : `Return a new object: ${p.c.name}(...) with copies of each field.`, lesson: "lesson" });
    }

    // deep versus shallow copy of nested mutable state
    for (const p of protos.filter((x) => !x.mt.returnsSelf)) {
      const mut = p.c.fields.filter((f) => isMutableField(f, py));
      if (!mut.length) continue;
      const calls = p.mt.calls;
      const deep = calls.some((x) => x.method === "deepcopy");
      const shallowCall = calls.find((x) => (x.receiver === "copy" && x.method === "copy") || (!py && x.method === "copy" && (x.receiver === null || x.receiver === "this")));
      const fresh = calls.filter((x) => FRESH.test(x.method) && x !== shallowCall && !(x.receiver === "copy" && x.method === "copy")).length;
      const bareCopy = py && p.mt.copies && !calls.some((x) => /^(deepcopy|copy)$/.test(x.method));
      if (deep || fresh >= mut.length) out.push({ id: "prototype.deep-copy", sev: "pass", title: `${p.c.name} copies its nested data too`,
        text: `${p.mt.name}() gives the copy its own ${h.list(mut.map((f) => f.name))}, so editing a copy never changes the template.` });
      else if (bareCopy) out.push({ id: "prototype.check-deep", sev: "note", line: p.mt.line, title: `Check that ${p.c.name}.${p.mt.name} copies deeply`,
        text: `${p.mt.name}() copies the object, but I can't tell whether it is copy() or deepcopy(). ${h.list(mut.map((f) => f.name))} must be copied too.`,
        fix: "Use deepcopy(self) (from the copy module) so nested lists and dicts are copied." });
      else out.push({ id: "prototype.shallow-copy", sev: "warn", line: p.mt.line, title: `${p.c.name}.${p.mt.name} shares ${mut.map((f) => f.name).join(", ")} with the template`,
        text: `${p.mt.name}() makes a shallow copy: the new object points at the same ${h.list(mut.map((f) => f.name))} as the original, so adding an item to the copy adds it to the template as well. This is the most common Prototype bug.`,
        fix: py ? `Return copy.deepcopy(self), or build the copy with fresh collections, e.g. list(self.${mut[0].name.replace(/^_/, "_")}).` : `Copy each mutable field when building the new object, e.g. mutable.ListBuffer.from(${mut[0].name}).`,
        lesson: "lesson" });
    }

    // a shared interface lets callers copy without knowing the concrete class
    if (iface) out.push({ id: "prototype.interface", sev: "pass", title: `${copy.name}() is declared on ${iface.name}`,
      text: `Code can copy any ${iface.name} without knowing its concrete class (Dependency Inversion).` });
    else out.push({ id: "prototype.no-interface", sev: "note", line: copy.line, title: `${copy.name}() isn't part of an interface`,
      text: `${proto.name} can copy itself, which is the heart of the pattern. Declaring ${copy.name}() on ${h.words.iface} lets other code copy any prototype without knowing its class.`,
      fix: py ? `class Prototype(ABC): with @abstractmethod def ${copy.name}(self) -> "Prototype": ..., and make ${proto.name} inherit from it.` : `trait Prototype[T]:\n  def ${copy.name}(): T\nand make ${proto.name} extend Prototype[${proto.name}].`,
      lesson: "lesson" });

    // a registry must hand out copies, never the stored templates
    if (registry) {
      const field = registry.fields.find((f) => f.elementType && (protoNames.includes(f.elementType) || f.elementType === iface?.name))!;
      const bare = field.name.replace(/^_/, "");
      const leaking = registry.methods.find((mt) => !/^(Unit|None)$/.test(mt.returnType ?? "") && mt.returns.some((r) => !/[^=!<>]=[^=]/.test(r) && r.replace(/^(self\.|this\.)/, "").replace(/^_/, "").startsWith(bare))
        && !mt.copies && !mt.calls.some((x) => x.method === copy.name || COPY_NAME.test(x.method)));
      const copies = registry.methods.some((mt) => mt.copies || mt.calls.some((x) => x.method === copy.name));
      if (leaking) out.push({ id: "prototype.registry-leaks", sev: "warn", line: leaking.line, title: `${registry.name}.${leaking.name} hands out the template itself`,
        text: `${leaking.name}() returns the stored prototype, not a copy. The first caller who edits it changes the template for everyone.`,
        fix: `Return a copy: ${py ? `self.${field.name}[key].${copy.name}()` : `${field.name}(key).${copy.name}()`}.`, lesson: "lesson" });
      else if (copies) out.push({ id: "prototype.registry-copies", sev: "pass", title: `${registry.name} hands out copies`,
        text: `Callers get a fresh copy each time, so the stored templates stay untouched.` });
    }

    // building the object from scratch in the client defeats the purpose
    const own = m.topCreates.filter((x) => protoNames.includes(x.type));
    if (own.length >= 3) out.push({ id: "prototype.client-builds", sev: "note", line: own[2].line, title: `The client builds ${own[2].type} from scratch ${own.length} times`,
      text: `Prototype pays off when you configure one example and copy it. Here new objects are still built with the constructor.`,
      fix: `Create one configured ${own[2].type}, then call ${copy.name}() on it and change only what differs.` });

    return { found: true, findings: out, roles };
  }
};

export default rules;
