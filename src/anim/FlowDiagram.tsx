import type { FlowEdge, FlowNode, FlowSpec } from "../content/guides/types";

type Pt = [number, number];
interface R { x: number; y: number; w: number; h: number }

/** Default sizes per kind (the content may override w / h). */
export const FLOW_SIZE: Record<FlowNode["kind"], [number, number]> = {
  initial: [20, 20], final: [24, 24], state: [140, 44], action: [150, 40], decision: [36, 36], merge: [36, 36],
  fork: [140, 6], join: [140, 6], actor: [40, 76], usecase: [150, 46], boundary: [240, 200], note: [140, 48], object: [130, 40]
};
export const flowRect = (n: FlowNode): R => ({ x: n.x, y: n.y, w: n.w ?? FLOW_SIZE[n.kind][0], h: n.h ?? FLOW_SIZE[n.kind][1] });
const centre = (r: R): Pt => [r.x + r.w / 2, r.y + r.h / 2];

/** Where a line from the node's centre towards p leaves the shape. */
export function flowBorder(n: FlowNode, p: Pt): Pt {
  const r = n.kind === "actor" ? { ...flowRect(n), h: 52 } : flowRect(n);
  const [cx, cy] = centre(r);
  const dx = p[0] - cx, dy = p[1] - cy;
  if (!dx && !dy) return [cx, cy];
  if (n.kind === "initial" || n.kind === "final" || n.kind === "usecase") {
    const a = r.w / 2, b = r.h / 2;
    const t = 1 / Math.sqrt((dx * dx) / (a * a) + (dy * dy) / (b * b));
    return [cx + dx * t, cy + dy * t];
  }
  if (n.kind === "decision" || n.kind === "merge") {
    const t = 1 / (Math.abs(dx) / (r.w / 2) + Math.abs(dy) / (r.h / 2));
    return [cx + dx * t, cy + dy * t];
  }
  const sx = dx ? r.w / 2 / Math.abs(dx) : Infinity, sy = dy ? r.h / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

export function edgePoints(spec: FlowSpec, e: FlowEdge): Pt[] {
  const a = spec.nodes.find((n) => n.id === e.from), b = spec.nodes.find((n) => n.id === e.to);
  if (!a || !b) return [];
  const via = e.via ?? [];
  const first = via[0] ?? centre(flowRect(b)), last = via[via.length - 1] ?? centre(flowRect(a));
  return [flowBorder(a, first), ...via, flowBorder(b, last)];
}

function Shape({ n }: { n: FlowNode }) {
  const r = flowRect(n);
  const [cx, cy] = centre(r);
  switch (n.kind) {
    case "initial": return <circle cx={cx} cy={cy} r={r.w / 2} className="fd-solid" />;
    case "final": return <g><circle cx={cx} cy={cy} r={r.w / 2} className="fd-ring" /><circle cx={cx} cy={cy} r={r.w / 2 - 5} className="fd-solid" /></g>;
    case "decision": case "merge":
      return <polygon points={`${cx},${r.y} ${r.x + r.w},${cy} ${cx},${r.y + r.h} ${r.x},${cy}`} className="fd-box fd-decision" />;
    case "fork": case "join": return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={2} className="fd-solid" />;
    case "actor": {
      const top = r.y;
      return (
        <g className="fd-actor">
          <circle cx={cx} cy={top + 9} r={8} />
          <line x1={cx} y1={top + 17} x2={cx} y2={top + 36} />
          <line x1={cx - 13} y1={top + 24} x2={cx + 13} y2={top + 24} />
          <line x1={cx} y1={top + 36} x2={cx - 11} y2={top + 52} />
          <line x1={cx} y1={top + 36} x2={cx + 11} y2={top + 52} />
        </g>
      );
    }
    case "usecase": return <ellipse cx={cx} cy={cy} rx={r.w / 2} ry={r.h / 2} className="fd-box fd-usecase" />;
    case "boundary": return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={4} className="fd-boundary" />;
    case "note": {
      const f = 12;
      return <path d={`M${r.x},${r.y} H${r.x + r.w - f} L${r.x + r.w},${r.y + f} V${r.y + r.h} H${r.x} Z M${r.x + r.w - f},${r.y} V${r.y + f} H${r.x + r.w}`} className="fd-note" />;
    }
    case "object": return <rect x={r.x} y={r.y} width={r.w} height={r.h} className="fd-box" />;
    case "state": return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={12} className="fd-box fd-state" />;
    default: return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={r.h / 2} className="fd-box fd-action" />;
  }
}

function Label({ n }: { n: FlowNode }) {
  if (!n.label) return null;
  const r = flowRect(n);
  const [cx, cy] = centre(r);
  if (n.kind === "actor") return <text x={cx} y={r.y + 68} textAnchor="middle" className="fd-text">{n.label}</text>;
  if (n.kind === "boundary") return <text x={r.x + 10} y={r.y + 20} className="fd-text fd-bold">{n.label}</text>;
  if (n.kind === "fork" || n.kind === "join" || n.kind === "initial" || n.kind === "final")
    return <text x={r.x + r.w + 8} y={cy + 4} className="fd-small">{n.label}</text>;
  if (n.kind === "decision" || n.kind === "merge") return <text x={r.x + r.w + 6} y={cy + 4} className="fd-small">{n.label}</text>;
  const lines = n.label.split("\n");
  return (
    <text x={cx} y={cy - ((lines.length - 1) * 16) / 2 + 5} textAnchor="middle" className={"fd-text" + (n.kind === "object" ? " fd-underline" : "")}>
      {lines.map((l, i) => <tspan key={i} x={cx} dy={i ? 16 : 0}>{l}</tspan>)}
    </text>
  );
}

/**
 * State machine, activity and use-case diagrams. Elements in `hidden` are faded out (used by lesson scenes to
 * build a diagram up step by step); `active` elements get an orange highlight.
 */
export default function FlowDiagram({ spec, hidden, active }: { spec: FlowSpec; hidden?: Set<string>; active?: Set<string> }) {
  const cls = (id: string) => "fd-el" + (hidden?.has(id) ? " fd-hidden" : "") + (active?.has(id) ? " fd-active" : "");
  const order = [...spec.nodes].sort((a, b) => (a.kind === "boundary" ? -1 : 0) - (b.kind === "boundary" ? -1 : 0));
  return (
    <div className="stage flow-stage">
      <svg viewBox={`0 0 ${spec.width} ${spec.height}`} className="diagram flow-diagram" role="img" aria-label={spec.label}
        style={{ maxWidth: spec.width }}>
        <defs>
          <marker id="fd-arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M1,1 L11,6 L1,11" className="fd-arrowhead" />
          </marker>
        </defs>
        {order.filter((n) => n.kind === "boundary").map((n) => <g key={n.id} className={cls(n.id)}><Shape n={n} /><Label n={n} /></g>)}
        {spec.edges.map((e) => {
          const pts = edgePoints(spec, e);
          if (pts.length < 2) return null;
          const [lx, ly] = e.labelAt ?? (() => { const i = Math.floor((pts.length - 1) / 2); return [(pts[i][0] + pts[i + 1][0]) / 2 + 6, (pts[i][1] + pts[i + 1][1]) / 2 - 4] as Pt; })();
          return (
            <g key={e.id} className={cls(e.id)}>
              <polyline points={pts.map((p) => p.join(",")).join(" ")} className={"fd-line" + (e.dashed ? " fd-dashed" : "")}
                markerEnd={e.arrow === "none" ? undefined : "url(#fd-arrow)"} />
              {e.label && <text x={lx} y={ly} className="fd-small fd-edge-label">{e.label}</text>}
            </g>
          );
        })}
        {order.filter((n) => n.kind !== "boundary").map((n) => <g key={n.id} className={cls(n.id)}><Shape n={n} /><Label n={n} /></g>)}
      </svg>
    </div>
  );
}
