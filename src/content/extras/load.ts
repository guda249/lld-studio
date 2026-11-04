/** Lazy loaders for the Phase 6 extras: one chunk per comparison, case study and kata. */
import type { UmlModel } from "../../review/types";
import type { CaseStudy, Comparison, Kata, UmlSketch } from "./types";

const comparisons = import.meta.glob<{ default: Comparison }>("../compare/*/comparison.ts");
const cases = import.meta.glob<{ default: CaseStudy }>("../cases/*/case.ts");
const katas = import.meta.glob<{ default: Kata }>("../katas/*/kata.ts");

const idOf = (k: string) => k.split("/").slice(-2, -1)[0];
const all = <T,>(g: Record<string, () => Promise<{ default: T }>>) => Promise.all(Object.values(g).map((f) => f().then((m) => m.default)));
const one = <T,>(g: Record<string, () => Promise<{ default: T }>>, id: string) => {
  const k = Object.keys(g).find((x) => idOf(x) === id);
  return k ? g[k]().then((m) => m.default) : Promise.resolve(null);
};

export const comparisonIds = () => Object.keys(comparisons).map(idOf);
/** Comparison ids that include a pattern (ids are the side slugs joined by "-vs-"). */
export const comparisonsFor = (slug: string) => comparisonIds().filter((id) => id.split("-vs-").includes(slug));
export const loadComparisons = () => all(comparisons);
export const loadComparison = (id: string) => one(comparisons, id);
export const loadCaseStudies = () => all(cases);
export const loadCaseStudy = (slug: string) => one(cases, slug);
export const kataIds = () => Object.keys(katas).map(idOf);
export const loadKatas = () => all(katas);
export const loadKata = (id: string) => one(katas, id);

/** The compact sketch → the model the diagram engine and the UML↔code check use. */
export function sketchToUml(s: UmlSketch): UmlModel {
  return {
    classes: s.classes.map((c, i) => ({ id: `c${i}`, name: c.name, kind: c.kind, members: c.members ?? [] })),
    relations: s.relations.map((r, i) => ({ id: `r${i}`, from: r.from, to: r.to, type: r.type }))
  };
}
