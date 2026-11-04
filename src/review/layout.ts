/**
 * Layered class-diagram layout for UML models (scratch pad, comparisons, case studies).
 *
 *  1. Rows: a parent (interface / base class) sits above its children, a whole above its parts, a user above
 *     what it uses. Cycles are broken, and classes with nothing above them move down next to what they point at.
 *  2. Order within a row: a few barycenter sweeps so lines cross as little as possible. Rows wider than the
 *     page wrap onto an extra row.
 *  3. Across: boxes slide towards the boxes they are linked to (straight vertical lines where possible) without
 *     overlapping.
 *  4. Lines: every line that needs a bend gets its own lane between the rows, and its own attachment point on the
 *     box, so no two lines share a segment. Lines that skip rows go down a free corridor between boxes (or along
 *     the right edge), never through a box. Generalisation lines between neighbouring rows are left to the engine,
 *     which draws them as the usual shared "bus" to the interface.
 */
import type { RelType } from "../anim/types";
import { textWidth } from "../anim/geometry";
import type { UmlModel } from "./types";

type Pt = [number, number];
export interface LaidOut {
  pos: Map<string, { x: number; y: number; w: number }>;
  /** Bend points per relation id, listed from the decorated end (as DEdge.via expects). */
  via: Map<string, Pt[]>;
  W: number;
  H: number;
}

const GAP_X = 40, MARGIN = 16, LANE = 13, MIN_GAP = 56;
const isGen = (t: RelType) => t === "inheritance" || t === "realization";
const decoratedAtFrom = (t: RelType) => t === "aggregation" || t === "composition";

export const boxWidth = (c: UmlModel["classes"][number]) =>
  Math.max(120, Math.ceil(Math.max(textWidth.name(c.name || "(unnamed)") + 24, ...c.members.map((m) => textWidth.member(m) + 28))));
export const boxHeight = (c: UmlModel["classes"][number]) => (c.kind === "concrete" ? 32 : 44) + (c.members.length ? c.members.length * 20 + 10 : 0);

export function layoutUml(u: UmlModel, maxW: number, same: (a: string, b: string) => boolean): LaidOut {
  const cls = u.classes;
  const ids = cls.map((c) => c.id);
  const idOf = (name: string) => cls.find((c) => same(c.name, name))?.id;
  const rels = u.relations
    .map((r) => ({ ...r, f: idOf(r.from), t: idOf(r.to) }))
    .filter((r): r is typeof r & { f: string; t: string } => !!r.f && !!r.t && r.f !== r.t);
  const W0 = new Map(cls.map((c) => [c.id, Math.min(boxWidth(c), maxW - 2 * MARGIN)]));
  const H0 = new Map(cls.map((c) => [c.id, boxHeight(c)]));

  /* 1. layers ------------------------------------------------------------------------------------------ */
  const below = new Map<string, Set<string>>(ids.map((i) => [i, new Set()]));
  const reach = (a: string, b: string): boolean => {
    const seen = new Set<string>(), stack = [a];
    while (stack.length) {
      const x = stack.pop()!;
      if (x === b) return true;
      if (seen.has(x)) continue;
      seen.add(x);
      below.get(x)!.forEach((y) => stack.push(y));
    }
    return false;
  };
  const order = [...rels].sort((a, b) => rank(a.type) - rank(b.type));
  for (const r of order) {
    const [up, down] = isGen(r.type) ? [r.t, r.f] : [r.f, r.t];
    if (!reach(down, up)) below.get(up)!.add(down);
  }
  const above = new Map<string, string[]>(ids.map((i) => [i, ids.filter((j) => below.get(j)!.has(i))]));
  const layer = new Map<string, number>();
  const lay = (i: string): number => {
    if (layer.has(i)) return layer.get(i)!;
    const ps = above.get(i)!;
    const v = ps.length ? Math.max(...ps.map(lay)) + 1 : 0;
    layer.set(i, v);
    return v;
  };
  ids.forEach(lay);
  // a class nobody points down at sits just above the highest thing it points to
  for (let k = 0; k < 3; k++) {
    for (const i of ids) {
      if (above.get(i)!.length || !below.get(i)!.size) continue;
      layer.set(i, Math.max(layer.get(i)!, Math.min(...[...below.get(i)!].map((j) => layer.get(j)!)) - 1));
    }
  }

  /* 2. order within layers, then wrap into rows -------------------------------------------------------- */
  const nLayers = Math.max(0, ...ids.map((i) => layer.get(i)!)) + 1;
  let layers: string[][] = Array.from({ length: nLayers }, (_, k) => ids.filter((i) => layer.get(i) === k));
  const nbrs = new Map<string, string[]>(ids.map((i) => [i, []]));
  for (const r of rels) { nbrs.get(r.f)!.push(r.t); nbrs.get(r.t)!.push(r.f); }
  const posIn = () => {
    const m = new Map<string, number>();
    layers.forEach((row) => row.forEach((i, k) => m.set(i, (k + 0.5) / row.length)));
    return m;
  };
  for (let sweep = 0; sweep < 6; sweep++) {
    const p = posIn();
    const seq = sweep % 2 ? [...layers.keys()].reverse() : [...layers.keys()];
    for (const k of seq) {
      const bary = (i: string) => {
        const ns = nbrs.get(i)!.filter((j) => layer.get(j) !== k);
        return ns.length ? ns.reduce((s, j) => s + p.get(j)!, 0) / ns.length : p.get(i)!;
      };
      layers[k] = [...layers[k]].sort((a, b) => bary(a) - bary(b));
    }
  }
  const rows: string[][] = [];
  for (const row of layers) {
    let cur: string[] = [], w = MARGIN;
    for (const i of row) {
      if (cur.length && w + W0.get(i)! > maxW - MARGIN) { rows.push(cur); cur = []; w = MARGIN; }
      cur.push(i);
      w += W0.get(i)! + GAP_X;
    }
    if (cur.length) rows.push(cur);
  }
  layers = rows;
  const rowOf = new Map<string, number>();
  rows.forEach((r, k) => r.forEach((i) => rowOf.set(i, k)));

  /* 3. x positions ------------------------------------------------------------------------------------ */
  const rowW = (r: string[]) => r.reduce((s, i) => s + W0.get(i)!, 0) + GAP_X * (r.length - 1);
  let W = Math.max(200, ...rows.map((r) => rowW(r) + 2 * MARGIN));
  const x = new Map<string, number>();
  for (const r of rows) {
    let cx = (W - rowW(r)) / 2;
    for (const i of r) { x.set(i, cx); cx += W0.get(i)! + GAP_X; }
  }
  const center = (i: string) => x.get(i)! + W0.get(i)! / 2;
  for (let it = 0; it < 8; it++) {
    const seq = it % 2 ? [...rows.keys()].reverse() : [...rows.keys()];
    for (const k of seq) {
      const r = rows[k];
      const want = r.map((i) => {
        const ns = nbrs.get(i)!.filter((j) => rowOf.get(j) !== k);
        return ns.length ? ns.reduce((s, j) => s + center(j), 0) / ns.length - W0.get(i)! / 2 : x.get(i)!;
      });
      // keep order, no overlap, inside the page; then pull back from the right edge
      const nx = want.map((v) => v);
      for (let j = 0; j < r.length; j++) nx[j] = Math.max(nx[j], j ? nx[j - 1] + W0.get(r[j - 1])! + GAP_X : MARGIN);
      for (let j = r.length - 1; j >= 0; j--) nx[j] = Math.min(nx[j], j < r.length - 1 ? nx[j + 1] - GAP_X - W0.get(r[j])! : W - MARGIN - W0.get(r[j])!);
      for (let j = 0; j < r.length; j++) nx[j] = Math.max(nx[j], j ? nx[j - 1] + W0.get(r[j - 1])! + GAP_X : MARGIN);
      r.forEach((i, j) => x.set(i, Math.round(nx[j])));
    }
  }

  /* 4. lines: ports, lanes and corridors -------------------------------------------------------------- */
  // Gap g lies between row g-1 and row g (gap 0 is above the first row, gap rows.length below the last).
  // Every line is routed here, so no two lines share a stretch: each bend runs in its own lane, each line leaves a
  // box at its own port. Generalisation lines to one parent share a "bus" lane and the parent's centre port.
  type Side = "top" | "bottom";
  type Plan =
    | { kind: "lane"; gF: number; gT: number; key: string; skip: boolean }
    | { kind: "same"; g: number; key: string }
    | { kind: "beside" };
  const plans = new Map<string, Plan>();
  const ports = new Map<string, { rel: string; other: string; center: boolean }[]>();
  const usePort = (node: string, side: Side, rel: string, other: string, center = false) =>
    ports.set(`${node}|${side}`, [...(ports.get(`${node}|${side}`) ?? []), { rel, other, center }]);
  const lanesNeeded = new Map<number, string[]>();
  const needLane = (g: number, key: string) => {
    const l = lanesNeeded.get(g) ?? [];
    if (!l.includes(key)) l.push(key);
    lanesNeeded.set(g, l);
  };
  const sideOf = new Map<string, { f: Side; t: Side }>();

  for (const r of rels) {
    const rf = rowOf.get(r.f)!, rt = rowOf.get(r.t)!;
    if (rf === rt) {
      const row = rows[rf], a = row.indexOf(r.f), b = row.indexOf(r.t);
      if (Math.abs(a - b) === 1) { plans.set(r.id, { kind: "beside" }); continue; }
      usePort(r.f, "top", r.id, r.t); usePort(r.t, "top", r.id, r.f);
      sideOf.set(r.id, { f: "top", t: "top" });
      needLane(rf, r.id);
      plans.set(r.id, { kind: "same", g: rf, key: r.id });
      continue;
    }
    const down = rt > rf;
    const sF: Side = down ? "bottom" : "top", sT: Side = down ? "top" : "bottom";
    sideOf.set(r.id, { f: sF, t: sT });
    const gF = down ? rf + 1 : rf, gT = down ? rt : rt + 1;
    const skip = Math.abs(rf - rt) > 1;
    if (isGen(r.type) && !skip) {
      // child (f) → parent (t): bus lane keyed by the parent and the gap. A child with several parents (a class
      // implementing two interfaces) gets one port per parent instead of sharing its centre.
      const parents = rels.filter((q) => isGen(q.type) && q.f === r.f && Math.abs(rowOf.get(q.t)! - rf) === 1 && (rowOf.get(q.t)! > rf) === down).length;
      usePort(r.f, sF, r.id, r.t, parents === 1); usePort(r.t, sT, r.id, r.f, true);
      const key = `bus:${r.t}`;
      needLane(gF, key);
      plans.set(r.id, { kind: "lane", gF, gT: gF, key, skip: false });
      continue;
    }
    usePort(r.f, sF, r.id, r.t); usePort(r.t, sT, r.id, r.f);
    needLane(gF, r.id + ":f");
    if (skip) needLane(gT, r.id + ":t");
    plans.set(r.id, { kind: "lane", gF, gT, key: r.id, skip });
  }

  // ports: centre for buses; other lines spread along the side, ordered by where they go, avoiding the centre
  const portAt = new Map<string, number>();
  for (const [k, list] of ports) {
    const node = k.split("|")[0];
    const L = x.get(node)!, w = W0.get(node)!;
    const others = list.filter((p) => !p.center).sort((a, b) => center(a.other) - center(b.other));
    const hasBus = list.some((p) => p.center);
    const n = others.length;
    let slots = Array.from({ length: n + (hasBus ? 1 : 0) + 1 }, (_, j) => (j + 1) / (n + (hasBus ? 1 : 0) + 2));
    if (hasBus || n % 2 === 0) slots = slots.sort((a, b) => Math.abs(b - 0.5) - Math.abs(a - 0.5)).slice(0, n).sort((a, b) => a - b);
    else slots = slots.slice(0, n);
    others.forEach((p, j) => portAt.set(`${k}|${p.rel}`, Math.round(L + w * slots[j])));
    list.filter((p) => p.center).forEach((p) => portAt.set(`${k}|${p.rel}`, Math.round(L + w / 2)));
  }
  const portX = (node: string, side: Side, rel: string) => portAt.get(`${node}|${side}|${rel}`) ?? Math.round(center(node));

  // straight lines where possible: a neighbouring-row line whose two ports can meet inside the boxes' overlap
  const straight = new Map<string, number>();
  for (const r of rels) {
    const p = plans.get(r.id);
    if (!p || p.kind !== "lane" || p.skip || isGen(r.type)) continue;
    const sd = sideOf.get(r.id)!;
    const ox1 = Math.max(x.get(r.f)!, x.get(r.t)!) + 12, ox2 = Math.min(x.get(r.f)! + W0.get(r.f)!, x.get(r.t)! + W0.get(r.t)!) - 12;
    if (ox2 < ox1) continue;
    const taken = (node: string, side: Side) => [...portAt.entries()].filter(([k]) => k.startsWith(`${node}|${side}|`) && !k.endsWith(`|${r.id}`)).map(([, v]) => v);
    const busy = [...taken(r.f, sd.f), ...taken(r.t, sd.t), ...[...straight.values()]];
    const want = (portX(r.f, sd.f, r.id) + portX(r.t, sd.t, r.id)) / 2;
    const cands = [want, ...Array.from({ length: 12 }, (_, j) => ox1 + ((ox2 - ox1) * j) / 11)]
      .map((v) => Math.round(Math.min(ox2, Math.max(ox1, v))))
      .filter((v) => busy.every((b) => Math.abs(b - v) >= 12))
      .sort((a, b) => Math.abs(a - want) - Math.abs(b - want));
    if (!cands.length) continue;
    straight.set(r.id, cands[0]);
    portAt.set(`${r.f}|${sd.f}|${r.id}`, cands[0]); portAt.set(`${r.t}|${sd.t}|${r.id}`, cands[0]);
    const l = lanesNeeded.get(p.gF)!;
    l.splice(l.indexOf(r.id + ":f"), 1);
  }

  // short vertical stubs from different boxes into one gap must not sit on the same x: nudge the movable one
  type Stub = { rel: string; node: string; side: Side; group: string; fixed: boolean };
  const stubs = new Map<number, Stub[]>();
  const addStub = (g: number, st: Stub) => stubs.set(g, [...(stubs.get(g) ?? []), st]);
  for (const r of rels) {
    const p = plans.get(r.id);
    if (!p || p.kind === "beside") continue;
    const sd = sideOf.get(r.id)!;
    const group = isGen(r.type) ? `bus:${r.t}` : r.id;
    if (p.kind === "same") { addStub(p.g, { rel: r.id, node: r.f, side: "top", group, fixed: false }); addStub(p.g, { rel: r.id, node: r.t, side: "top", group, fixed: false }); continue; }
    const fixed = straight.has(r.id) || isGen(r.type);
    // the child end of a generalisation may slide sideways; the parent end (the bus point) stays put
    addStub(p.gF, { rel: r.id, node: r.f, side: sd.f, group: isGen(r.type) ? r.id : group, fixed: straight.has(r.id) });
    addStub(p.skip ? p.gT : p.gF, { rel: r.id, node: r.t, side: sd.t, group, fixed: fixed || isGen(r.type) });
  }
  const px = (st: Stub) => portX(st.node, st.side, st.rel);
  for (const list of stubs.values()) {
    for (let pass = 0; pass < 3; pass++) {
      for (const a of list) {
        if (a.fixed) continue;
        const clash = (v: number) => list.some((b) => b !== a && b.group !== a.group && Math.abs(px(b) - v) < 12);
        if (!clash(px(a))) continue;
        const L = x.get(a.node)!, w = W0.get(a.node)!;
        const sameSide = [...portAt.entries()].filter(([k]) => k.startsWith(`${a.node}|${a.side}|`) && !k.endsWith(`|${a.rel}`)).map(([, v]) => v);
        const cands = Array.from({ length: Math.max(1, Math.floor((w - 24) / 6)) }, (_, j) => Math.round(L + 12 + j * 6))
          .filter((v) => !clash(v) && sameSide.every((o) => Math.abs(o - v) >= 12))
          .sort((m, n) => Math.abs(m - px(a)) - Math.abs(n - px(a)));
        if (cands.length) portAt.set(`${a.node}|${a.side}|${a.rel}`, cands[0]);
      }
    }
  }

  // vertical corridors for lines that skip rows: a gap between boxes, free in every row they pass
  const corridorUse = new Map<string, number>();
  function corridor(lo: number, hi: number, near: number): number {
    const free = (cx: number) => {
      for (let k = lo; k <= hi; k++) for (const i of rows[k]) if (cx > x.get(i)! - 10 && cx < x.get(i)! + W0.get(i)! + 10) return false;
      return true;
    };
    const cands: number[] = [];
    for (let k = lo; k <= hi; k++) {
      const r = [...rows[k]].sort((a, b) => x.get(a)! - x.get(b)!);
      for (let j = 0; j + 1 < r.length; j++) cands.push((x.get(r[j])! + W0.get(r[j])! + x.get(r[j + 1])!) / 2);
      if (r.length) { cands.push(x.get(r[0])! - 16); cands.push(x.get(r[r.length - 1])! + W0.get(r[r.length - 1])! + 16); }
    }
    const ok = cands.filter((c) => c > 6 && free(c)).sort((a, b) => Math.abs(a - near) - Math.abs(b - near));
    let cx = ok.length ? ok[0] : W + 6;
    const key = String(Math.round(cx));
    const used = corridorUse.get(key) ?? 0;
    corridorUse.set(key, used + 1);
    cx += (used % 2 ? -1 : 1) * Math.ceil(used / 2) * 12;
    if (cx > W - 10) W = cx + MARGIN;
    return Math.round(cx);
  }

  /* 5. y positions: each gap is tall enough for its lanes ---------------------------------------------- */
  const nLanes = (g: number) => lanesNeeded.get(g)?.length ?? 0;
  const gapH = (g: number) => {
    const n = nLanes(g);
    if (g === 0 || g === rows.length) return n ? 14 + LANE * n + 4 : MARGIN;
    return Math.max(MIN_GAP, 28 + LANE * Math.max(0, n - 1) + 14);
  };
  const rowH = (k: number) => Math.max(...rows[k].map((i) => H0.get(i)!));
  const rowY: number[] = [];
  let y = gapH(0);
  rows.forEach((_, k) => { rowY.push(y); y += rowH(k) + gapH(k + 1); });
  const H = y;
  const gapTop = (g: number) => (g === 0 ? 0 : rowY[g - 1] + rowH(g - 1));
  const lane = (g: number, key: string) => {
    const keys = lanesNeeded.get(g) ?? [];
    const n = keys.length, idx = Math.max(0, keys.indexOf(key));
    const top = gapTop(g), h = gapH(g);
    const span = LANE * Math.max(0, n - 1);
    return Math.round(top + (h - span) / 2 + idx * LANE);
  };

  const pos = new Map(ids.map((i) => [i, { x: x.get(i)!, y: rowY[rowOf.get(i)!], w: W0.get(i)! }]));
  const via = new Map<string, Pt[]>();
  const pairCount = new Map<string, number>();
  for (const r of rels) {
    const p = plans.get(r.id)!;
    let pts: Pt[];
    if (p.kind === "beside") {
      // neighbours in one row: a straight horizontal line; several lines between one pair get their own heights
      const pk = [r.f, r.t].sort().join("|");
      const k = pairCount.get(pk) ?? 0;
      pairCount.set(pk, k + 1);
      const m = rels.filter((q) => [q.f, q.t].sort().join("|") === pk).length;
      const a = x.get(r.f)! < x.get(r.t)! ? r.f : r.t, b = a === r.f ? r.t : r.f;
      const mx = (x.get(a)! + W0.get(a)! + x.get(b)!) / 2;
      const top = rowY[rowOf.get(r.f)!], hmin = Math.min(H0.get(r.f)!, H0.get(r.t)!);
      pts = [[Math.round(mx), Math.round(top + (hmin * (k + 1)) / (m + 1))]];
    } else if (p.kind === "same") {
      const yl = lane(p.g, p.key);
      pts = [[portX(r.f, "top", r.id), yl], [portX(r.t, "top", r.id), yl]];
    } else {
      const sd = sideOf.get(r.id)!;
      const xf = portX(r.f, sd.f, r.id), xt = portX(r.t, sd.t, r.id);
      if (straight.has(r.id)) {
        pts = [[xf, Math.round(gapTop(p.gF) + gapH(p.gF) / 2)]];
      } else if (!p.skip) {
        const yl = lane(p.gF, isGen(r.type) ? p.key : r.id + ":f");
        pts = [[xf, yl], [xt, yl]];
      } else {
        const rf = rowOf.get(r.f)!, rt = rowOf.get(r.t)!;
        const cx = corridor(Math.min(rf, rt) + 1, Math.max(rf, rt) - 1, (xf + xt) / 2);
        const y1 = lane(p.gF, r.id + ":f"), y2 = lane(p.gT, r.id + ":t");
        pts = [[xf, y1], [cx, y1], [cx, y2], [xt, y2]];
      }
    }
    via.set(r.id, decoratedAtFrom(r.type) ? pts : [...pts].reverse());
  }
  return { pos, via, W: Math.ceil(W), H: Math.ceil(H) };
}

/** Strong relations decide the rows first; dependencies only fill in. */
function rank(t: RelType): number {
  return t === "inheritance" || t === "realization" ? 0 : t === "composition" || t === "aggregation" ? 1 : t === "association" ? 2 : 3;
}
