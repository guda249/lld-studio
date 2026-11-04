import type { UmlKind } from "../content/types";
import type { Action, Box, DBadge, DEdge, DiagramSpec, DNode } from "./types";

export type Pt = [number, number];
export interface Rect { x: number; y: number; w: number; h: number }

export const LINE_H = 20;
const HEADER_STEREO = 44;
const HEADER_PLAIN = 32;

const STEREO: Record<UmlKind, string> = {
  interface: "«interface»", abstract: "«abstract»", concrete: "", singleton: "«singleton»", enum: "«enumeration»", client: "«client»"
};

export const stereotypeOf = (n: DNode): string => (n.stereotype !== undefined ? n.stereotype : STEREO[n.kind]);
export const headerHeight = (n: DNode): number => (stereotypeOf(n) ? HEADER_STEREO : HEADER_PLAIN);

/** All member-line sets a node will ever show: its own plus any set by `members` actions. */
export function memberSets(spec: DiagramSpec, actionLists: Action[][]): Map<string, { lines: string[]; scala?: string[] }[]> {
  const sets = new Map<string, { lines: string[]; scala?: string[] }[]>();
  for (const n of spec.nodes) sets.set(n.id, [{ lines: n.members ?? [], scala: n.scalaMembers }]);
  for (const list of actionLists) {
    for (const a of list) {
      if ("members" in a) {
        const arr = sets.get(a.members);
        if (arr) arr.push({ lines: a.lines, scala: a.scalaLines });
      }
    }
  }
  return sets;
}

export function maxLines(sets: { lines: string[] }[] | undefined): number {
  return sets ? Math.max(0, ...sets.map((s) => s.lines.length)) : 0;
}

export function nodeHeight(n: DNode, lines: number): number {
  const box = n.at;
  if (box.h) return box.h;
  return headerHeight(n) + (lines ? lines * LINE_H + 10 : 0);
}

export function boxOf(n: DNode, portrait: boolean, lines: number): Rect {
  const b: Box = portrait && n.portrait ? n.portrait : n.at;
  return { x: b.x, y: b.y, w: b.w, h: b.h ?? nodeHeight(n, lines) };
}

export const center = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];

/** Point where the ray from the box centre towards p leaves the box. */
function clipToBorder(r: Rect, p: Pt): Pt {
  const [cx, cy] = center(r);
  const dx = p[0] - cx, dy = p[1] - cy;
  if (dx === 0 && dy === 0) return [cx, r.y];
  const sx = dx !== 0 ? (r.w / 2) / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? (r.h / 2) / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

/** Where a line heading to (or coming from) p meets the box; prefers straight orthogonal attachment. */
function attach(r: Rect, p: Pt): Pt {
  const [px, py] = p;
  if (px >= r.x && px <= r.x + r.w) {
    if (py <= r.y) return [px, r.y];
    if (py >= r.y + r.h) return [px, r.y + r.h];
  }
  if (py >= r.y && py <= r.y + r.h) {
    if (px <= r.x) return [r.x, py];
    if (px >= r.x + r.w) return [r.x + r.w, py];
  }
  return clipToBorder(r, p);
}

export const decoratedAtFrom = (t: DEdge["type"]): boolean => t === "aggregation" || t === "composition";

export interface RoutedEdge {
  /** Polyline starting at the decorated end (arrowhead / triangle / diamond). */
  points: Pt[];
  labelAt?: { x: number; y: number; anchor: "middle" | "start" };
  fromMultAt?: Pt;
  toMultAt?: Pt;
}

/**
 * Route every edge. Lines go from the decorated end to the other end, so dashed lines always meet their symbol
 * with a full dash (docs/design-system.md). Several edges that share a decorated node and lie on the same side
 * share one "bus" line, like the usual UML drawing of three classes implementing one interface.
 */
export function routeEdges(spec: DiagramSpec, rects: Map<string, Rect>, portrait: boolean): Map<string, RoutedEdge> {
  const out = new Map<string, RoutedEdge>();
  const ends = (e: DEdge) => {
    const dId = decoratedAtFrom(e.type) ? e.from : e.to;
    const oId = decoratedAtFrom(e.type) ? e.to : e.from;
    return { d: rects.get(dId)!, o: rects.get(oId)!, dId, oId };
  };

  // bus groups: same decorated node, other ends all strictly below (or above), at least 2 edges
  const busY = new Map<string, number>();
  const groups = new Map<string, DEdge[]>();
  for (const e of spec.edges) {
    const via = portrait ? e.viaPortrait : e.via;
    if (via?.length || e.route === "straight") continue;
    const { d, o, dId } = ends(e);
    if (!d || !o) continue;
    const below = o.y >= d.y + d.h + 16, above = o.y + o.h <= d.y - 16;
    if (!below && !above) continue;
    const k = dId + (below ? ":below" : ":above");
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  for (const [k, list] of groups) {
    if (list.length < 2) continue;
    const below = k.endsWith(":below");
    const d = ends(list[0]).d;
    const near = below ? Math.min(...list.map((e) => ends(e).o.y)) : Math.max(...list.map((e) => { const o = ends(e).o; return o.y + o.h; }));
    const y = below ? (d.y + d.h + near) / 2 : (d.y + near) / 2;
    for (const e of list) busY.set(e.id, y);
  }

  for (const e of spec.edges) {
    const { d, o } = ends(e);
    if (!d || !o) continue;
    const via = portrait ? e.viaPortrait : e.via;
    let pts: Pt[];
    const [dcx, dcy] = center(d), [ocx, ocy] = center(o);
    if (via && via.length) {
      pts = [attach(d, via[0]), ...via, attach(o, via[via.length - 1])];
    } else if (e.route === "straight") {
      pts = [clipToBorder(d, [ocx, ocy]), clipToBorder(o, [dcx, dcy])];
    } else {
      const ox1 = Math.max(d.x, o.x), ox2 = Math.min(d.x + d.w, o.x + o.w);
      const oy1 = Math.max(d.y, o.y), oy2 = Math.min(d.y + d.h, o.y + o.h);
      const oBelow = o.y >= d.y + d.h + 8, oAbove = o.y + o.h <= d.y - 8;
      const oRight = o.x >= d.x + d.w + 8, oLeft = o.x + o.w <= d.x - 8;
      const bus = busY.get(e.id);
      if ((oBelow || oAbove) && bus !== undefined) {
        const dy = oBelow ? d.y + d.h : d.y, oy = oBelow ? o.y : o.y + o.h;
        pts = dcx === ocx ? [[dcx, dy], [ocx, oy]] : [[dcx, dy], [dcx, bus], [ocx, bus], [ocx, oy]];
      } else if ((oBelow || oAbove) && ox2 - ox1 >= 24) {
        const x = (ox1 + ox2) / 2;
        pts = oBelow ? [[x, d.y + d.h], [x, o.y]] : [[x, d.y], [x, o.y + o.h]];
      } else if ((oRight || oLeft) && oy2 - oy1 >= 16) {
        const y = (oy1 + oy2) / 2;
        pts = oRight ? [[d.x + d.w, y], [o.x, y]] : [[d.x, y], [o.x + o.w, y]];
      } else if (oBelow || oAbove) {
        const dy = oBelow ? d.y + d.h : d.y, oy = oBelow ? o.y : o.y + o.h;
        const my = (dy + oy) / 2;
        pts = [[dcx, dy], [dcx, my], [ocx, my], [ocx, oy]];
      } else if (oRight || oLeft) {
        const dx = oRight ? d.x + d.w : d.x, ox = oRight ? o.x : o.x + o.w;
        const mx = (dx + ox) / 2;
        pts = [[dx, dcy], [mx, dcy], [mx, ocy], [ox, ocy]];
      } else {
        pts = [clipToBorder(d, [ocx, ocy]), clipToBorder(o, [dcx, dcy])];
      }
    }
    out.set(e.id, { points: pts, ...placeLabels(e, pts) });
  }
  return out;
}

function placeLabels(e: DEdge, pts: Pt[]): Omit<RoutedEdge, "points"> {
  const res: Omit<RoutedEdge, "points"> = {};
  if (e.label) {
    let best = 0, bestLen = -1;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      if (len > bestLen) { bestLen = len; best = i; }
    }
    const [a, b] = [pts[best], pts[best + 1]];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const vertical = Math.abs(a[0] - b[0]) < Math.abs(a[1] - b[1]);
    res.labelAt = vertical ? { x: mx + 8, y: my + 4, anchor: "start" } : { x: mx, y: my - 8, anchor: "middle" };
  }
  const near = (p: Pt, q: Pt): Pt => {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const ux = (q[0] - p[0]) / len, uy = (q[1] - p[1]) / len;
    return [p[0] + ux * 26 - uy * 12, p[1] + uy * 26 + ux * 12 + 4];
  };
  const decoFrom = decoratedAtFrom(e.type);
  const first = pts[0], second = pts[1], last = pts[pts.length - 1], prev = pts[pts.length - 2];
  const fromEnd = decoFrom ? near(first, second) : near(last, prev);
  const toEnd = decoFrom ? near(last, prev) : near(first, second);
  if (e.fromMult) res.fromMultAt = fromEnd;
  if (e.toMult) res.toMultAt = toEnd;
  return res;
}

/** Length of the symbol at the decorated end; the line itself starts this far along the first segment. */
export function decorationLength(t: DEdge["type"]): number {
  if (t === "inheritance" || t === "realization") return 13;
  if (t === "aggregation" || t === "composition") return 22;
  return 0;
}

export function shorten(points: Pt[], by: number): Pt[] {
  if (!by || points.length < 2) return points;
  const [a, b] = points;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const k = Math.min(by, len) / len;
  return [[a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], ...points.slice(1)];
}

export const isDashed = (t: DEdge["type"]): boolean => t === "dependency" || t === "realization";

/** Rough text widths for IBM Plex at the sizes the stage uses (used for pills, badges and the content checks). */
export const textWidth = {
  name: (s: string) => s.length * 7.2,
  member: (s: string) => s.length * 6.95,
  pill: (s: string) => s.length * 7.25,
  small: (s: string) => s.length * 6.3
};

export function badgeRect(b: DBadge, node: Rect): Rect {
  const w = Math.max(80, textWidth.small(b.text) + 26);
  const cx = node.x + node.w / 2;
  const y = b.place === "below" ? node.y + node.h + 10 : node.y - 36;
  return { x: cx - w / 2, y, w, h: 26 };
}
