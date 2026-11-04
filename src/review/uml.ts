/**
 * The learner's UML diagram: build one from code, lay it out for drawing, and compare it with the code.
 */
import type { UmlKind } from "../content/types";
import type { DiagramSpec, RelType } from "../anim/types";
import type { ClassInfo, CodeModel } from "./model";
import type { Finding, UmlModel, UmlRelation } from "./types";
import { layoutUml } from "./layout";
import { layoutProblems } from "./layoutCheck";

const KIND: Record<ClassInfo["kind"], UmlKind> = {
  class: "concrete", case: "concrete", abstract: "abstract", interface: "interface", object: "singleton", enum: "enum"
};

export interface CodeRelation { from: string; to: string; type: RelType; line: number; why: string }

/** Relationships the code implies, using the lesson's rules (created inside = composition, passed in = association...). */
export function codeRelations(m: CodeModel): CodeRelation[] {
  const names = new Set(m.classes.map((c) => c.name));
  const out: CodeRelation[] = [];
  const add = (r: CodeRelation) => { if (!out.some((x) => x.from === r.from && x.to === r.to)) out.push(r); };
  for (const c of m.classes) {
    for (const b of c.bases) {
      const bc = m.classes.find((x) => x.name === b);
      if (!bc) continue;
      add({ from: c.name, to: b, type: bc.kind === "interface" ? "realization" : "inheritance", line: c.line, why: `${c.name} extends ${b}` });
    }
  }
  for (const c of m.classes) {
    for (const f of c.fields) {
      const target = [f.type, f.elementType, ...f.created].find((t) => t && names.has(t) && t !== c.name);
      if (!target) continue;
      if (f.origin === "created") add({ from: c.name, to: target, type: "composition", line: f.line, why: `${c.name} creates its ${target} itself` });
      else if (f.origin === "collection" && f.elementType) add({ from: c.name, to: target, type: "aggregation", line: f.line, why: `${c.name} keeps a collection of ${target}` });
      else add({ from: c.name, to: target, type: "association", line: f.line, why: `${c.name} keeps a ${target} in a field` });
    }
    for (const mt of c.methods) {
      for (const p of mt.params) {
        const t = p.type?.replace(/^["']|["']$/g, "").split("[")[0].trim();
        if (t && names.has(t) && t !== c.name) add({ from: c.name, to: t, type: "dependency", line: mt.line, why: `${c.name}.${mt.name} takes a ${t}` });
      }
    }
  }
  return out;
}

/** "Start from my code": a diagram with every class, its members and the relationships the code implies. */
export function codeToUml(m: CodeModel): UmlModel {
  const classes = m.classes.map((c) => ({
    id: c.name,
    name: c.name,
    kind: KIND[c.kind],
    members: [
      ...c.fields.filter((f) => !f.name.startsWith("__")).slice(0, 4).map((f) => `${f.name.startsWith("_") ? "-" : "+"} ${f.name}${f.type ? ": " + f.type : ""}`),
      ...c.methods.filter((x) => x.name !== "__init__" && !x.name.startsWith("__")).slice(0, 4).map((x) => `${x.name.startsWith("_") ? "-" : "+"} ${x.name}(${x.params.filter((p) => p.name !== "self" && p.name !== "cls").map((p) => p.name).join(", ")})`)
    ]
  }));
  const relations: UmlRelation[] = codeRelations(m).map((r, i) => ({ id: "r" + i, from: r.from, to: r.to, type: r.type }));
  return { classes, relations };
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const REL_WORDS: Record<RelType, string> = {
  association: "association (solid line, open arrow)", dependency: "dependency (dashed line, open arrow)",
  aggregation: "aggregation (hollow diamond)", composition: "composition (filled diamond)",
  inheritance: "inheritance (solid line, hollow triangle)", realization: "realization (dashed line, hollow triangle)"
};

/** Compares the learner's diagram with the code and explains every disagreement. */
export function compareUml(diagram: UmlModel, m: CodeModel): Finding[] {
  const out: Finding[] = [];
  if (!diagram.classes.length) return out;
  const codeNames = m.classes.map((c) => c.name);
  const findCode = (n: string) => m.classes.find((c) => same(c.name, n));
  const missingInDiagram = codeNames.filter((n) => !diagram.classes.some((d) => same(d.name, n)));
  const missingInCode = diagram.classes.filter((d) => !findCode(d.name)).map((d) => d.name);
  if (missingInCode.length) out.push({
    id: "uml.class-not-in-code", sev: "warn", title: "Classes in the diagram but not in the code",
    text: `Your diagram has ${missingInCode.join(", ")}, but the code has no class with ${missingInCode.length > 1 ? "those names" : "that name"}.`,
    fix: "Rename the box to match the code, add the class to the code, or remove the box.", lesson: "uml"
  });
  if (missingInDiagram.length) out.push({
    id: "uml.class-not-in-diagram", sev: "note", title: "Classes in the code but not in the diagram",
    text: `The code has ${missingInDiagram.join(", ")}, which ${missingInDiagram.length > 1 ? "are" : "is"} not in your diagram.`,
    fix: "Add a box for each class that plays a role in the design (helper classes can stay out).", lesson: "uml"
  });
  for (const d of diagram.classes) {
    const c = findCode(d.name);
    if (!c) continue;
    const want = KIND[c.kind];
    const ok = want === d.kind || (want === "abstract" && d.kind === "interface") || (want === "interface" && d.kind === "abstract") || (want === "singleton" && d.kind === "concrete");
    if (!ok) out.push({
      id: "uml.kind", sev: "warn", line: c.line, title: `${d.name} is drawn as the wrong kind of box`,
      text: `The diagram shows ${d.name} as ${d.kind === "interface" ? "an «interface»" : d.kind === "abstract" ? "an «abstract» class" : "a " + d.kind + " class"}, but in the code it is ${want === "interface" ? "an interface" : want === "abstract" ? "an abstract class" : "a " + want + " class"}.`,
      fix: "Change the box's kind to match the code.", lesson: "uml"
    });
  }
  const rels = codeRelations(m);
  /** Is `name` the class `target` or one of its descendants? (holding a CardPayment counts as holding a PaymentMethod) */
  const isOrExtends = (name: string, target: string): boolean => {
    if (same(name, target)) return true;
    const c = findCode(name);
    return !!c && c.bases.some((b) => isOrExtends(b, target));
  };
  for (const r of diagram.relations) {
    const fromC = findCode(r.from), toC = findCode(r.to);
    if (!fromC || !toC) continue;
    const code = rels.find((x) => same(x.from, fromC.name) && same(x.to, toC.name))
      ?? rels.find((x) => same(x.from, toC.name) && same(x.to, fromC.name) && (r.type === "aggregation" || r.type === "composition"))
      ?? rels.find((x) => same(x.from, fromC.name) && x.type !== "inheritance" && x.type !== "realization" && isOrExtends(x.to, toC.name));
    if (!code) {
      out.push({ id: "uml.rel-not-in-code", sev: "warn", line: fromC.line, title: `No ${r.from} → ${r.to} link in the code`,
        text: `Your diagram draws ${REL_WORDS[r.type]} from ${r.from} to ${r.to}, but the code of ${r.from} never refers to ${r.to}.`,
        fix: "Remove the line, or add the field / parameter / base class it stands for.", lesson: "uml" });
      continue;
    }
    if (code.type === r.type) continue;
    const loose = (t: RelType) => t === "association" || t === "aggregation";
    if (loose(code.type) && loose(r.type)) continue; // both acceptable for "passed in"
    out.push({
      id: "uml.rel-type", sev: "warn", line: code.line, title: `${r.from} → ${r.to}: the line type doesn't match the code`,
      text: `The diagram shows ${REL_WORDS[r.type]}, but in the code ${code.why}, which is ${REL_WORDS[code.type]}.`,
      fix: code.type === "composition" ? "Draw a filled diamond at the whole, or change the code so the part is passed in."
        : code.type === "realization" ? "Use a dashed line with a hollow triangle for implementing an interface."
        : code.type === "inheritance" ? "Use a solid line with a hollow triangle for extending a class."
        : `Use ${REL_WORDS[code.type]}.`,
      lesson: "uml"
    });
  }
  const important = rels.filter((r) => r.type !== "dependency");
  const missingRels = important.filter((r) => !diagram.relations.some((d) =>
    (same(d.from, r.from) && same(d.to, r.to)) || (same(d.from, r.to) && same(d.to, r.from))
    || (same(d.from, r.from) && r.type !== "inheritance" && r.type !== "realization" && isOrExtends(r.to, d.to))));
  if (missingRels.length) out.push({
    id: "uml.rel-missing", sev: "warn", title: "Relationships missing from the diagram",
    text: `The code has ${missingRels.map((r) => `${r.from} → ${r.to} (${r.type})`).join(", ")}, which your diagram doesn't show.`,
    fix: "Add a line for each one; the lines are what makes a class diagram useful.", lesson: "uml"
  });
  if (!out.some((f) => f.sev === "warn")) out.push({ id: "uml.agrees", sev: "pass", title: "Diagram and code agree", text: "Every class and relationship in your diagram matches the code." });
  return out;
}

/** Lays a UML model out as a DiagramSpec (see layout.ts), in landscape and phone portrait. */
export function umlToDiagram(u: UmlModel): DiagramSpec {
  const land = layoutUml(u, 980, same);
  const port = layoutUml(u, 340, same);
  const nid = (id: string) => "n_" + id.replace(/[^\w-]/g, "_");
  const spec: DiagramSpec = {
    label: `Class diagram: ${u.classes.map((c) => c.name).join(", ")}.`,
    width: land.W, height: land.H, portraitWidth: port.W, portraitHeight: port.H,
    nodes: u.classes.map((c) => ({
      id: nid(c.id), kind: c.kind, name: c.name || "(unnamed)", members: c.members,
      at: land.pos.get(c.id)!, portrait: port.pos.get(c.id)!
    })),
    edges: u.relations
      .filter((r) => u.classes.some((c) => same(c.name, r.from)) && u.classes.some((c) => same(c.name, r.to)))
      .map((r) => ({
        id: "e_" + r.id.replace(/[^\w-]/g, "_"), type: r.type,
        from: nid(u.classes.find((c) => same(c.name, r.from))!.id),
        to: nid(u.classes.find((c) => same(c.name, r.to))!.id),
        ...(land.via.get(r.id) ? { via: land.via.get(r.id) } : {}),
        ...(port.via.get(r.id) ? { viaPortrait: port.via.get(r.id) } : {})
      }))
  };
  // A phone layout is used only when it draws cleanly (small diagrams). Big ones keep the wide layout at a readable
  // size and scroll sideways in their box, instead of a tall tangle of lines.
  if (layoutProblems(spec, true).length) {
    delete spec.portraitWidth; delete spec.portraitHeight;
    spec.nodes.forEach((n) => { delete n.portrait; });
    spec.edges.forEach((e) => { delete e.viaPortrait; });
  }
  return spec;
}
