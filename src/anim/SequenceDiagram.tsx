import { useRef } from "react";
import type { SequenceSpec } from "./types";
import { useWidth } from "../lib/motion";
import { textWidth } from "./geometry";

const KIND_CLASS: Record<string, string> = {
  interface: "k-iface", abstract: "k-abstract", concrete: "k-concrete", singleton: "k-object", enum: "k-enum", client: "k-client"
};

/**
 * UML sequence diagram. On phones it becomes numbered message steps instead of a shrunken drawing
 * (docs/design-system.md, "Layout rules").
 */
export default function SequenceDiagram({ spec }: { spec: SequenceSpec }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const ps = spec.participants;
  const colW = Math.max(150, ...ps.map((p) => textWidth.name(p.name) + 30), ...spec.messages.map((m) => Math.min(260, textWidth.member(m.label) + 30)));
  // a self-call on the right-most lifeline writes its label to the right of the line: make room for it
  const lastId = ps[ps.length - 1]?.id;
  const selfExtra = Math.max(0, ...spec.messages.filter((m) => (m.kind === "self" || m.from === m.to) && m.from === lastId)
    .map((m, i) => 44 + textWidth.member(`${i + 1}. ${m.label}`) + 16 - colW / 2));
  const W = colW * ps.length + 20 + selfExtra;
  const asList = width > 0 && width < Math.min(W * 0.75, 620);
  const xOf = (id: string) => 10 + colW * ps.findIndex((p) => p.id === id) + colW / 2;
  const top = 16, headH = 40, rowH = 42;
  const H = top + headH + 20 + spec.messages.length * rowH + 20;
  const name = (id: string) => ps.find((p) => p.id === id)?.name ?? id;

  return (
    <div ref={box} className="seq">
      {asList ? (
        <ol className="seq-list" aria-label={spec.label}>
          {spec.messages.map((m, i) => (
            <li key={i} className={m.kind === "return" ? "ret" : undefined}>
              <span className="seq-n">{i + 1}</span>
              <span>
                <strong>{name(m.from)}</strong> {m.kind === "return" ? "returns" : m.kind === "create" ? "creates" : "→"} <strong>{m.kind === "self" ? "itself" : name(m.to)}</strong>
                <code>{m.label}</code>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="stage seq-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label={spec.label} style={{ minWidth: Math.min(W, Math.max(640, Math.round(W / 1.35))) }}>
            {ps.map((p) => {
              const x = xOf(p.id);
              return (
                <g key={p.id} className={`node ${KIND_CLASS[p.kind]}`}>
                  <line x1={x} y1={top + headH} x2={x} y2={H - 10} className="lifeline" />
                  <rect x={x - colW / 2 + 10} y={top} width={colW - 20} height={headH} rx={8} className={p.kind === "client" ? "frame-client" : "band seq-head"} />
                  <text x={x} y={top + 25} textAnchor="middle" className="t name">{p.name}</text>
                </g>
              );
            })}
            {spec.messages.map((m, i) => {
              const y = top + headH + 34 + i * rowH;
              const x1 = xOf(m.from), x2 = xOf(m.to);
              const ret = m.kind === "return" || m.kind === "create";
              if (m.kind === "self" || m.from === m.to) {
                return (
                  <g key={i}>
                    <path d={`M${x1},${y - 8} h36 v18 h-36`} className="rel" />
                    <polyline points={`${x1 + 9},${y + 5} ${x1},${y + 10} ${x1 + 9},${y + 15}`} className="rel" />
                    <text x={x1 + 44} y={y + 4} className="t mono">{i + 1}. {m.label}</text>
                  </g>
                );
              }
              const dir = x2 > x1 ? 1 : -1;
              return (
                <g key={i}>
                  <line x1={x2 - dir * 1} y1={y} x2={x1} y2={y} className={"rel" + (ret ? " dashed" : "")} />
                  {ret
                    ? <polyline points={`${x2 - dir * 10},${y - 5} ${x2},${y} ${x2 - dir * 10},${y + 5}`} className="rel" />
                    : <polygon points={`${x2 - dir * 10},${y - 5} ${x2},${y} ${x2 - dir * 10},${y + 5}`} className="arrow-fill" />}
                  <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" className={"t mono" + (ret ? " muted" : "")}>
                    {i + 1}. {m.kind === "create" ? "«create» " : ""}{m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
