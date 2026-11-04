/**
 * Checks a drawn class diagram: boxes must not overlap, no line may pass through a box it doesn't connect, and no
 * two unrelated lines may run on top of each other (lines from several children to one parent share a "bus" on
 * purpose). Used by umlToDiagram to decide whether the phone layout is clean enough to use, and by the tests.
 */
import type { DiagramSpec } from "../anim/types";
import { boxOf, routeEdges, type Pt, type Rect } from "../anim/geometry";

export function layoutProblems(spec: DiagramSpec, portrait: boolean): string[] {
  const out: string[] = [];
  const rects = new Map<string, Rect>(spec.nodes.map((n) => [n.id, boxOf(n, portrait, n.members?.length ?? 0)]));
  const names = new Map(spec.nodes.map((n) => [n.id, n.name]));
  for (const [a, ra] of rects) for (const [b, rb] of rects) {
    if (a < b && ra.x < rb.x + rb.w && rb.x < ra.x + ra.w && ra.y < rb.y + rb.h && rb.y < ra.y + ra.h) out.push(`boxes ${names.get(a)} and ${names.get(b)} overlap`);
  }
  const routed = routeEdges(spec, rects, portrait);
  const segsOf = (id: string): [Pt, Pt][] => { const pts = routed.get(id)?.points ?? []; return pts.slice(1).map((p, i) => [pts[i], p]); };
  const edge = (id: string) => spec.edges.find((x) => x.id === id)!;
  const label = (id: string) => `${names.get(edge(id).from)} → ${names.get(edge(id).to)}`;
  const inside = (v: number, lo: number, hi: number) => v > lo + 2 && v < hi - 2;
  for (const e of spec.edges) {
    for (const [p, q] of segsOf(e.id)) {
      for (const [id, r] of rects) {
        if (id === e.from || id === e.to) continue;
        const hit = p[0] === q[0]
          ? inside(p[0], r.x, r.x + r.w) && Math.max(p[1], q[1]) > r.y + 2 && Math.min(p[1], q[1]) < r.y + r.h - 2
          : p[1] === q[1]
            ? inside(p[1], r.y, r.y + r.h) && Math.max(p[0], q[0]) > r.x + 2 && Math.min(p[0], q[0]) < r.x + r.w - 2
            : false;
        if (hit) out.push(`the line ${label(e.id)} goes through ${names.get(id)}`);
      }
    }
  }
  const deco = (id: string) => { const e = edge(id); return e.type === "aggregation" || e.type === "composition" ? e.from : e.to; };
  const gen = (id: string) => /inheritance|realization/.test(edge(id).type);
  const es = spec.edges.map((e) => e.id);
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    if (gen(es[i]) && gen(es[j]) && deco(es[i]) === deco(es[j])) continue;
    for (const [a1, a2] of segsOf(es[i])) for (const [b1, b2] of segsOf(es[j])) {
      const horiz = a1[1] === a2[1] && b1[1] === b2[1] && Math.abs(a1[1] - b1[1]) < 3;
      const vert = a1[0] === a2[0] && b1[0] === b2[0] && Math.abs(a1[0] - b1[0]) < 3;
      if (!horiz && !vert) continue;
      const k = horiz ? 0 : 1;
      const lo = Math.max(Math.min(a1[k], a2[k]), Math.min(b1[k], b2[k])), hi = Math.min(Math.max(a1[k], a2[k]), Math.max(b1[k], b2[k]));
      if (hi - lo > 6) out.push(`lines ${label(es[i])} and ${label(es[j])} run on top of each other`);
    }
  }
  return [...new Set(out)];
}
