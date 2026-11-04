import { forwardRef, useMemo } from "react";
import type { Lang } from "../content/types";
import type { Action, DEdge, DiagramSpec, DNode } from "./types";
import {
  LINE_H, badgeRect, boxOf, decorationLength, headerHeight, isDashed, maxLines, memberSets,
  routeEdges, shorten, stereotypeOf, type Pt, type Rect, type RoutedEdge
} from "./geometry";

export interface Geometry {
  rects: Map<string, Rect>;
  edges: Map<string, RoutedEdge>;
  width: number;
  height: number;
  portrait: boolean;
  /** Member-set index of each `members` action. */
  memberIndex: Map<Action, number>;
  /** Index of each distinct tag text per node, and of each ring caption. */
  tagIndex: Map<string, string[]>;
  captions: string[];
}

/** Everything the renderer and the animation compiler need for one diagram + the actions it will play. */
export function useGeometry(spec: DiagramSpec, actionLists: Action[][], portrait: boolean): Geometry {
  return useMemo(() => buildGeometry(spec, actionLists, portrait), [spec, actionLists, portrait]);
}

export function buildGeometry(spec: DiagramSpec, actionLists: Action[][], portrait: boolean): Geometry {
  const sets = memberSets(spec, actionLists);
  const memberIndex = new Map<Action, number>();
  const counters = new Map<string, number>();
  const tagIndex = new Map<string, string[]>();
  const captions: string[] = [];
  for (const list of actionLists) {
    for (const a of list) {
      if ("members" in a) {
        const c = (counters.get(a.members) ?? 0) + 1;
        counters.set(a.members, c);
        memberIndex.set(a, c);
      } else if ("tag" in a && a.text !== null) {
        const arr = tagIndex.get(a.tag) ?? [];
        if (!arr.includes(a.text)) arr.push(a.text);
        tagIndex.set(a.tag, arr);
      } else if ("ring" in a && a.caption && !captions.includes(a.caption)) {
        captions.push(a.caption);
      }
    }
  }
  const usePortrait = portrait && !!spec.portraitWidth && spec.nodes.every((n) => n.portrait);
  const rects = new Map<string, Rect>();
  for (const n of spec.nodes) rects.set(n.id, boxOf(n, usePortrait, maxLines(sets.get(n.id))));
  return {
    rects,
    edges: routeEdges(spec, rects, usePortrait),
    width: usePortrait ? spec.portraitWidth! : spec.width,
    height: usePortrait ? spec.portraitHeight! : spec.height,
    portrait: usePortrait,
    memberIndex,
    tagIndex,
    captions
  };
}

const KIND_CLASS: Record<DNode["kind"], string> = {
  interface: "k-iface", abstract: "k-abstract", concrete: "k-concrete", singleton: "k-object", enum: "k-enum", client: "k-client"
};

function NodeBox({ n, r, sets, lang, tags }: {
  n: DNode; r: Rect; sets: { lines: string[]; scala?: string[] }[]; lang: Lang; tags: string[];
}) {
  const stereo = stereotypeOf(n);
  const head = headerHeight(n);
  const cls = KIND_CLASS[n.kind];
  const cx = r.x + r.w / 2;
  return (
    <g data-el={n.id} data-node={n.id} className={`node ${cls}`}>
      {n.kind === "client" ? (
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} className="frame-client" />
      ) : (
        <>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={9} className="fill-surface" />
          <rect x={r.x} y={r.y} width={r.w} height={head} rx={9} className="band" />
          {r.h > head && <rect x={r.x} y={r.y + head - 10} width={r.w} height={10} className="band" />}
          {r.h > head && <line x1={r.x} y1={r.y + head} x2={r.x + r.w} y2={r.y + head} className="divider" />}
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={9} className={n.key ? "frame-key" : "box-frame"} />
        </>
      )}
      <rect data-mark="" x={r.x + 4} y={r.y + head + 5} width={r.w - 8} height={LINE_H} rx={4} className="member-hl" opacity={0} />
      {stereo && <text x={cx} y={r.y + 16} textAnchor="middle" className="t small stereo">{stereo}</text>}
      <text x={cx} y={r.y + (stereo ? 33 : 21)} textAnchor="middle" className={`t name${n.kind === "abstract" ? " italic" : ""}`}>{n.name}</text>
      {sets.map((s, i) => {
        const lines = lang === "scala" && s.scala ? s.scala : s.lines;
        return (
          <g key={i} data-mset={i} opacity={i === 0 ? 1 : 0}>
            {lines.map((m, j) => (
              <text key={j} x={r.x + 12} y={r.y + head + 19 + j * LINE_H} className={`t mono${n.kind === "interface" ? " italic" : ""}`}>{m}</text>
            ))}
          </g>
        );
      })}
      <rect data-flash="" x={r.x} y={r.y} width={r.w} height={r.h} rx={10} className="flash" opacity={0} />
      {tags.map((t, i) => {
        const w = Math.max(60, t.length * 6.9 + 20);
        return (
          <g key={t} data-tag={i} opacity={0}>
            <rect x={cx - w / 2} y={r.y + r.h - 11} width={w} height={22} rx={11} className="tag-box" />
            <text x={cx} y={r.y + r.h + 4} textAnchor="middle" className="t mono tag-text">{t}</text>
          </g>
        );
      })}
    </g>
  );
}

function Decoration({ e, pts }: { e: DEdge; pts: Pt[] }) {
  const [a, b] = pts;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
  const nx = -uy, ny = ux;
  const P = (along: number, side: number) => `${a[0] + ux * along + nx * side},${a[1] + uy * along + ny * side}`;
  switch (e.type) {
    case "association":
    case "dependency":
      return <polyline points={`${P(12, 6)} ${P(0, 0)} ${P(12, -6)}`} className="rel" data-deco="" />;
    case "inheritance":
    case "realization":
      return <polygon points={`${P(0, 0)} ${P(13, 8)} ${P(13, -8)}`} className="tri" data-deco="" />;
    case "aggregation":
      return <polygon points={`${P(0, 0)} ${P(11, 7)} ${P(22, 0)} ${P(11, -7)}`} className="dia-hollow" data-deco="" />;
    case "composition":
      return <polygon points={`${P(0, 0)} ${P(11, 7)} ${P(22, 0)} ${P(11, -7)}`} className="dia-filled" data-deco="" />;
  }
}

function EdgeView({ e, route }: { e: DEdge; route: RoutedEdge }) {
  const line = shorten(route.points, decorationLength(e.type));
  const d = "M" + line.map((p) => `${p[0]},${p[1]}`).join(" L");
  const dashed = isDashed(e.type);
  return (
    <g data-el={e.id} className="edge">
      {dashed
        ? <path d={d} className="rel dashed" data-line="dashed" />
        : <path d={d} className="rel" data-line="solid" pathLength={1} strokeDasharray="1 1" strokeDashoffset={0} />}
      <Decoration e={e} pts={route.points} />
      {e.label && route.labelAt && (
        <text x={route.labelAt.x} y={route.labelAt.y} textAnchor={route.labelAt.anchor} className="t small muted halo" data-label="">{e.label}</text>
      )}
      {e.fromMult && route.fromMultAt && <text x={route.fromMultAt[0]} y={route.fromMultAt[1]} textAnchor="middle" className="t small muted halo">{e.fromMult}</text>}
      {e.toMult && route.toMultAt && <text x={route.toMultAt[0]} y={route.toMultAt[1]} textAnchor="middle" className="t small muted halo">{e.toMult}</text>}
    </g>
  );
}

export interface DiagramProps {
  spec: DiagramSpec;
  geom: Geometry;
  lang: Lang;
  actionLists: Action[][];
  /** Static rendering for UML / quiz views: hidden items are left out completely. */
  staticView?: boolean;
  /** For static views: element ids to leave out (e.g. nodes hidden at the end of a story). */
  omit?: Set<string>;
  className?: string;
  labelledBy?: string;
  style?: React.CSSProperties;
}

/** Renders a diagram as SVG. Animation code finds the parts through data-* attributes. */
const Diagram = forwardRef<SVGSVGElement, DiagramProps>(function Diagram(
  { spec, geom, lang, actionLists, staticView, omit, className, labelledBy, style }, ref
) {
  const sets = useMemo(() => memberSets(spec, actionLists), [spec, actionLists]);
  const skip = (id: string, hidden?: boolean) => !!omit?.has(id) || (!!staticView && !!hidden && !omit);
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${geom.width} ${geom.height}`}
      className={`diagram${className ? " " + className : ""}`}
      style={style}
      role="img"
      aria-label={labelledBy ? undefined : spec.label}
      aria-labelledby={labelledBy}
    >
      {labelledBy && <desc>{spec.label}</desc>}
      <g data-layer="edges">
        {spec.edges.map((e) => (skip(e.id, e.hidden) ? null : <EdgeView key={e.id} e={e} route={geom.edges.get(e.id)!} />))}
      </g>
      <g data-layer="nodes">
        {spec.nodes.map((n) => (skip(n.id, n.hidden) ? null : (
          <NodeBox key={n.id} n={n} r={geom.rects.get(n.id)!} sets={sets.get(n.id)!} lang={lang} tags={geom.tagIndex.get(n.id) ?? []} />
        )))}
      </g>
      <g data-layer="marks">
        {spec.nodes.map((n) => {
          const r = geom.rects.get(n.id)!;
          return (
            <g key={n.id} data-el={`${n.id}__x`} className="xmark" opacity={0}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10} />
              <line x1={r.x + 14} y1={r.y + 10} x2={r.x + r.w - 14} y2={r.y + r.h - 10} />
              <line x1={r.x + r.w - 14} y1={r.y + 10} x2={r.x + 14} y2={r.y + r.h - 10} />
            </g>
          );
        })}
        {(spec.badges ?? []).map((b) => {
          const node = geom.rects.get(b.near);
          if (!node || skip(b.id, b.hidden !== false)) return null;
          const r = badgeRect(b, node);
          return (
            <g key={b.id} data-el={b.id} className={`badge badge-${b.tone}`} opacity={b.hidden === false ? 1 : 0}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={13} />
              <text x={r.x + r.w / 2} y={r.y + 17} textAnchor="middle" className="t small">{b.text}</text>
            </g>
          );
        })}
        {!staticView && (
          <>
            <rect data-ring="" x={0} y={0} width={10} height={10} rx={12} className="ring" opacity={0} />
            {geom.captions.map((c, i) => (
              <text key={c} data-ringcap={i} x={0} y={0} textAnchor="middle" className="t small key-ink" opacity={0}>{c}</text>
            ))}
          </>
        )}
      </g>
      <g data-layer="pills" />
    </svg>
  );
});

export default Diagram;
