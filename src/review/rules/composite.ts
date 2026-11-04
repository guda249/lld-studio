import type { PatternRules, Finding } from "../types";
import type { ClassInfo, CodeModel, FieldInfo, MethodInfo } from "../model";
import type { Helpers } from "../helpers";

/**
 * Composite: a component type, at least one leaf that implements it, and a composite that implements it too,
 * keeps a collection of components (its children) and answers each operation by asking its children.
 * Also recognises the lighter "closed set + recursive functions" form from the lesson's idiomatic code.
 */

const strip = (r: string) => r.replace(/^(self\.|this\.)/, "");
const COLLECTION_TYPE = /^(list|tuple|set|deque|List|Seq|Vector|Set|ListBuffer|ArrayBuffer|Buffer|Array|mutable)$/;
const ADD_CALL = /^(append|extend|add|insert|appendleft|\+=|\+\+=|addOne|addAll|prepend|\+=:|::=|:\+=)$/;

/** Is f a list of children (a collection field, or a field typed as a collection)? */
const isCollection = (f: FieldInfo) => f.origin === "collection" || !!f.elementType || (!!f.type && COLLECTION_TYPE.test(f.type));

/** Does method mt pass the work on to the items of the children field? */
function recurses(mt: MethodInfo, field: string): boolean {
  if (mt.loopsOver.includes(field)) return true;
  // child.size() / c.render(...) / _.render(...) on something that isn't self, or self.children.map(...)
  return mt.calls.some((c) => (c.receiver !== null && c.receiver !== "self" && c.receiver !== "this" && c.method === mt.name)
    || (c.receiver !== null && strip(c.receiver).split(".")[0] === field && /^(map|foreach|sum|flatMap|foldLeft|exists|forall|count)$/.test(c.method)));
}

/** Top-level functions that check node types one by one (the smell Composite removes). */
function typeCheckingFunction(m: CodeModel) {
  const own = new Set(m.classes.map((c) => c.name));
  const all = [...m.functions.map((f) => ({ owner: null as string | null, f })), ...m.classes.flatMap((c) => c.methods.map((f) => ({ owner: c.name as string | null, f })))];
  for (const { owner, f } of all) {
    const checks = [...new Set(f.typeChecks.filter((t) => own.has(t.type)).map((t) => t.type))];
    if (checks.length >= 2) return { owner, f, checks, line: f.typeChecks[0].line };
  }
  return null;
}

/** Lighter form: data classes for nodes + recursive functions with match (no shared methods). */
function functionalForm(m: CodeModel, h: Helpers, hasBase: boolean): { composite: ClassInfo; field: FieldInfo; fn: MethodInfo; leaf: ClassInfo | undefined } | null {
  // a recursive function that matches on the node (Scala: map(itself) over the children)
  const fn = m.functions.find((f) => f.branches.length > 0
    && (f.calls.some((c) => c.receiver === null && c.method === f.name) || f.calls.some((c) => /^(map|flatMap|foreach)$/.test(c.method)))
    // without a shared base type (Python), isinstance checks mean it's the "before" code, not the closed-set form
    && (hasBase || !f.typeChecks.some((t) => h.cls(t.type))));
  if (!fn) return null;
  for (const c of m.classes) {
    const field = c.fields.find((f) => isCollection(f));
    if (!field) continue;
    const leaf = m.classes.find((x) => x !== c && !x.fields.some((f) => isCollection(f)) && x.kind !== "interface" && x.kind !== "abstract");
    if (leaf) return { composite: c, field, fn, leaf };
  }
  return null;
}

const rules: PatternRules = {
  slug: "composite",
  name: "Composite",
  review(m, h) {
    const out: Finding[] = [];

    // 1. Find component + composite: a subclass of the component that keeps a collection of children.
    type Cand = { comp: ClassInfo; composite: ClassInfo; field: FieldInfo; leaves: ClassInfo[]; rank: number };
    let best = null as Cand | null;
    for (const comp of m.classes) {
      const subs = h.implementers(comp.name);
      if (!subs.length) continue;
      const family = new Set([comp.name, ...subs.map((s) => s.name)]);
      for (const k of subs) {
        if (h.isAbstraction(k) && k.methods.every((x) => x.abstract)) continue;
        const fields = k.fields.filter((f) => isCollection(f));
        for (const f of fields) {
          const elemOk = f.elementType === comp.name ? 3 : f.elementType && family.has(f.elementType) ? 2 : !f.elementType ? 1 : 0;
          const used = k.methods.some((mt) => recurses(mt, f.name)) ? 1 : 0;
          if (!elemOk && !used) continue;
          const leaves = subs.filter((s) => s !== k && !h.isAbstraction(s) && !h.isA(s, k.name) && !s.fields.some((x) => isCollection(x) && (x.elementType === null || family.has(x.elementType))));
          const rank = elemOk * 10 + used * 5 + (leaves.length ? 3 : 0) + (h.isAbstraction(comp) ? 1 : 0);
          if (!best || rank > best.rank) best = { comp, composite: k, field: f, leaves, rank };
        }
      }
    }

    // functional / closed-set form (sealed trait + case classes, or dataclasses + match)
    const compHasOps = best ? best.comp.methods.some((x) => !x.name.startsWith("_") && x.name !== "<init>") : false;
    if (!best || !compHasOps) {
      const fn = functionalForm(m, h, !!best);
      const comp = best?.comp;
      const composite = best?.composite ?? fn?.composite;
      const field = best?.field ?? fn?.field;
      if (fn && composite && field) {
        const leafName = best?.leaves[0]?.name ?? fn.leaf?.name ?? "a leaf";
        const roles = `${comp ? `${comp.name} is the component, ` : ""}${leafName} is a leaf and ${composite.name} is the composite holding ${field.name}, and operations such as ${fn.fn.name} are recursive functions.`;
        return {
          found: true, roles, suppress: ["general.branches", "general.type-checks"],
          findings: [
            { id: "composite.shape", sev: "pass", title: "Composite shape found (data + functions form)", text: roles },
            { id: "composite.functional-form", sev: "note", line: fn.fn.line, title: "Lighter form: a closed set of node types",
              text: `Your nodes are plain data and ${fn.fn.name} walks the tree by matching on the node type. That's a good fit when the node types rarely change and new operations are added often.`,
              fix: `If new node types will keep arriving (like a Shortcut), give ${comp?.name ?? "the nodes"} a shared method${h.py ? " in a base class" : " in the trait"} and let each node answer it, so no function needs editing.`, lesson: "lesson" }
          ]
        };
      }
    }

    if (!best) {
      const findings: Finding[] = [{
        id: "composite.no-shape", sev: "fail", title: "The Composite shape isn't there yet",
        text: `I couldn't find a shared component type (${h.py ? "an abstract base class, a Protocol" : "a trait"} or a plain base class) that both a single item (the leaf) and a container (the composite) implement, where the container keeps a list of components.`,
        fix: `Give leaves and containers one common type with the shared operations. Make the container ${h.py ? "inherit from" : "extend"} it too and keep its children as ${h.py ? "list[Component]" : "a ListBuffer[Component] or List[Component]"}, so a container can hold leaves and other containers alike.`,
        lesson: "lesson"
      }];
      const tc = typeCheckingFunction(m);
      if (tc) findings.push({
        id: "composite.type-checks", sev: "note", line: tc.line, title: `${tc.owner ? tc.owner + "." : ""}${tc.f.name} checks which kind of item it got`,
        text: `${tc.f.name} uses ${h.words.typeCheck} on ${h.list(tc.checks)} (line ${tc.line}). Every new item type means editing every such function; that's the smell Composite removes.`,
        fix: `Move each branch into the class it checks for, as one shared method (for example ${h.py ? "size()" : "size"}), and let containers sum their children's answers.`, lesson: "problem"
      });
      return { found: false, findings, suppress: ["general.type-checks"] };
    }

    const { comp, composite, field, leaves } = best;
    const fam = new Set([comp.name, ...h.implementers(comp.name).map((s) => s.name)]);
    const roles = `${comp.name} is the component, ${leaves.length ? `${h.list(leaves.map((c) => c.name))} ${leaves.length > 1 ? "are leaves" : "is a leaf"}, ` : ""}and ${composite.name} is the composite that keeps its children in the ${field.name} field.`;
    out.push({ id: "composite.shape", sev: "pass", title: "Composite shape found", text: roles });

    const adder = composite.methods.find((mt) => mt.name !== "__init__" && (mt.calls.some((c) => c.receiver !== null && strip(c.receiver) === field.name && ADD_CALL.test(c.method)) || mt.assigns.includes(field.name)));
    const addName = adder?.name ?? "add";
    // check: children typed as the component
    if (field.elementType === comp.name) out.push({ id: "composite.children-typed-component", sev: "pass", title: `Children are typed as ${comp.name}`,
      text: `${composite.name}.${field.name} holds any ${comp.name}, so a ${composite.name} can contain leaves and other ${composite.name}s alike.` });
    else if (field.elementType && fam.has(field.elementType)) out.push({
      id: "composite.children-concrete", sev: "warn", line: field.line, title: `${composite.name} can only hold ${field.elementType}`,
      text: `${field.name} is typed as a collection of ${field.elementType}, not ${comp.name}, so ${field.elementType === composite.name ? "leaves" : `a ${composite.name}`} can't be put inside and the tree can't nest freely.`,
      fix: h.py ? `Annotate it as list[${comp.name}] (and the ${addName} parameter as ${comp.name}).` : `Declare it as ListBuffer[${comp.name}] or List[${comp.name}] (and take ${comp.name} in ${addName}).`, lesson: "lesson"
    });
    else out.push({
      id: "composite.children-untyped", sev: "note", line: field.line, title: `${composite.name}.${field.name} has no element type`,
      text: `I can't see what ${field.name} holds. It should hold any ${comp.name}, so leaves and containers mix freely.`,
      fix: h.py ? `Write self.${field.name}: list[${comp.name}] = [].` : `Write ListBuffer.empty[${comp.name}] or List[${comp.name}].`
    });

    // check: operations declared on the component and recursive in the composite
    const ops = comp.methods.filter((x) => !x.name.startsWith("_") && x.name !== "<init>" && !ADD_CALL.test(x.name) && !/^(remove|children|get_?child|getChild|name)$/i.test(x.name));
    const notRecursive: string[] = [];
    let anyRecursive = false;
    for (const op of ops) {
      const own = h.method(composite, op.name);
      if (!own) continue;
      if (recurses(own, field.name) || own.calls.some((c) => (c.receiver === "self" || c.receiver === "this" || c.receiver === null) && ops.some((o) => o.name === c.method && o.name !== op.name && h.method(composite, o.name) && recurses(h.method(composite, o.name)!, field.name)))) anyRecursive = true;
      else notRecursive.push(op.name);
    }
    if (notRecursive.length) {
      const mt = h.method(composite, notRecursive[0])!;
      out.push({ id: "composite.no-recursion", sev: "warn", line: mt.line, title: `${composite.name}.${mt.name} doesn't ask its children`,
        text: `${composite.name}.${mt.name} never goes through ${field.name}, so a container answers as if it were empty (or works it out some other way). In Composite, a container's answer is built from its children's answers.`,
        fix: h.py ? `Loop over self.${field.name} and combine child.${mt.name}(...) for each child, for example sum(c.${mt.name}() for c in self.${field.name}).`
          : `Combine the children's answers, for example ${field.name}.map(_.${mt.name}).sum.`, lesson: "lesson" });
    } else if (anyRecursive) out.push({ id: "composite.recurses", sev: "pass", title: `${composite.name} builds its answer from its children`,
      text: `${composite.name} passes each operation on to its children, so the whole tree is handled by one call on the top node.` });

    // check: an operation that only the composite has (client must tell them apart)
    const compOps = new Set(comp.methods.map((x) => x.name));
    const onlyHere = composite.methods.find((mt) => !compOps.has(mt.name) && !mt.name.startsWith("_") && recurses(mt, field.name) && !mt.calls.some((c) => c.receiver !== null && strip(c.receiver) === field.name && ADD_CALL.test(c.method)));
    if (onlyHere) out.push({ id: "composite.op-not-in-component", sev: "warn", line: onlyHere.line, title: `${onlyHere.name} exists only on ${composite.name}`,
      text: `${composite.name}.${onlyHere.name} walks the children, but ${comp.name} doesn't declare it, so client code has to check whether it holds a leaf or a container before calling it. Treating both the same is the point of Composite.`,
      fix: `Declare ${onlyHere.name} on ${comp.name} and implement it in every leaf too.`, lesson: "lesson" });
    else if (ops.length) out.push({ id: "composite.uniform-interface", sev: "pass", title: `Leaves and containers share ${comp.name}'s operations`,
      text: `Client code can call ${h.list(ops.slice(0, 3).map((o) => o.name))} on any ${comp.name} without knowing whether it is a leaf or a container.` });

    // check: a way to put children in
    const viaCtor = field.origin === "param";
    if (!adder && !viaCtor) out.push({ id: "composite.no-add", sev: "warn", line: field.line, title: `There's no way to add children to ${composite.name}`,
      text: `${composite.name}.${field.name} starts empty and nothing fills it, so the tree can never grow.`,
      fix: h.py ? `Add def add(self, child: ${comp.name}) -> None: self.${field.name}.append(child).` : `Add def add(child: ${comp.name}): Unit = ${field.name} += child.`, lesson: "lesson" });

    // check: no type checks on the family inside the classes
    for (const c of [composite, ...leaves]) {
      const mt = c.methods.find((x) => x.typeChecks.some((t) => fam.has(t.type)));
      if (mt) {
        const tc = mt.typeChecks.find((t) => fam.has(t.type))!;
        out.push({ id: "composite.type-check", sev: "warn", line: tc.line, title: `${c.name}.${mt.name} checks for ${tc.type}`,
          text: `On line ${tc.line}, ${c.name}.${mt.name} asks whether an item is a ${tc.type}. With Composite every item answers the same method, so this check isn't needed and breaks when a new kind of item arrives.`,
          fix: `Just call the shared method on each child and let the child (leaf or container) decide.`, lesson: "lesson" });
        break;
      }
    }

    if (!leaves.length) out.push({ id: "composite.no-leaf", sev: "note", title: `No leaf class yet`,
      text: `Only ${composite.name} implements ${comp.name}. Add at least one simple item class (a leaf) that does the real work, so the tree has something at the bottom.` });

    const suppress = ["general.branches"];
    if (out.some((f) => f.id === "composite.type-check")) suppress.push("general.type-checks");
    return { found: true, findings: out, roles, suppress };
  }
};

export default rules;
