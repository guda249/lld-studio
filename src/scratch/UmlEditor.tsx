import { useMemo, useState } from "react";
import type { UmlKind } from "../content/types";
import type { RelType } from "../anim/types";
import type { UmlModel } from "../review/types";
import { umlToDiagram } from "../review/uml";
import { StaticDiagram } from "../anim/StaticDiagram";
import Legend from "../anim/Legend";

const KINDS: { v: UmlKind; label: string }[] = [
  { v: "interface", label: "«interface» / trait" }, { v: "abstract", label: "«abstract» class" }, { v: "concrete", label: "class" },
  { v: "singleton", label: "«singleton» / object" }, { v: "enum", label: "«enumeration»" }, { v: "client", label: "«client»" }
];
const RELS: { v: RelType; label: string }[] = [
  { v: "realization", label: "implements (dashed, hollow triangle)" }, { v: "inheritance", label: "extends (solid, hollow triangle)" },
  { v: "association", label: "knows a / holds (solid arrow)" }, { v: "aggregation", label: "has a, parts live on (hollow diamond)" },
  { v: "composition", label: "owns, parts die with it (filled diamond)" }, { v: "dependency", label: "uses briefly (dashed arrow)" }
];

let counter = 0;
const newId = () => `c${Date.now().toString(36)}${(counter++).toString(36)}`;

interface Props {
  value: UmlModel;
  onChange: (m: UmlModel) => void;
  /** Builds a diagram from the current code (may be unavailable until the code reader loads). */
  fromCode?: () => Promise<UmlModel>;
}

/** A form-based class-diagram editor that works with keyboard, screen readers and on phones. */
export default function UmlEditor({ value, onChange, fromCode }: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const spec = useMemo(() => (value.classes.length ? umlToDiagram(value) : null), [value]);
  const names = value.classes.map((c) => c.name).filter(Boolean);

  const setClass = (id: string, patch: Partial<UmlModel["classes"][number]>) => {
    const old = value.classes.find((c) => c.id === id);
    const relations = patch.name !== undefined && old
      ? value.relations.map((r) => ({ ...r, from: r.from === old.name ? patch.name! : r.from, to: r.to === old.name ? patch.name! : r.to }))
      : value.relations;
    onChange({ classes: value.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)), relations });
  };

  async function startFromCode() {
    if (!fromCode) return;
    if (value.classes.length && !confirmReplace) { setConfirmReplace(true); return; }
    setConfirmReplace(false);
    setBusy(true);
    try { onChange(await fromCode()); } finally { setBusy(false); }
  }

  return (
    <div className="uml-editor">
      <div className="uml-tools">
        {fromCode && <button type="button" className="btn" onClick={startFromCode} disabled={busy}>
          {busy ? "Reading your code…" : confirmReplace ? "Replace my diagram? Click again" : "Start from my code"}
        </button>}
        {confirmReplace && <button type="button" className="btn" onClick={() => setConfirmReplace(false)}>Keep my diagram</button>}
        <span className="muted-text small-text">Draw what you intend; the review compares it with your code.</span>
      </div>

      <div className="uml-columns">
        <section aria-labelledby="uml-classes-h" className="uml-col">
          <h3 id="uml-classes-h">Classes</h3>
          {value.classes.length === 0 && <p className="muted-text">No classes yet. Add one, or start from your code.</p>}
          {value.classes.map((c, i) => (
            <fieldset key={c.id} className="uml-row">
              <legend className="sr-only">Class {i + 1}</legend>
              <div className="uml-row-top">
                <label><span className="sr-only">Name</span>
                  <input type="text" value={c.name} placeholder="ClassName" aria-label={`Class ${i + 1} name`} onChange={(e) => setClass(c.id, { name: e.target.value.replace(/\s/g, "") })} />
                </label>
                <label><span className="sr-only">Kind</span>
                  <select value={c.kind} aria-label={`Class ${i + 1} kind`} onChange={(e) => setClass(c.id, { kind: e.target.value as UmlKind })}>
                    {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
                  </select>
                </label>
                <button type="button" className="btn icon" aria-label={`Remove ${c.name || "class " + (i + 1)}`} onClick={() => onChange({
                  classes: value.classes.filter((x) => x.id !== c.id),
                  relations: value.relations.filter((r) => r.from !== c.name && r.to !== c.name)
                })}>✕</button>
              </div>
              <label className="uml-members">
                <span className="small-text muted-text">Members, one per line (e.g. <code>+ pay(amount)</code>, <code>- method: PaymentMethod</code>)</span>
                <textarea rows={Math.max(2, c.members.length + 1)} value={c.members.join("\n")} aria-label={`${c.name || "Class " + (i + 1)} members`}
                  onChange={(e) => setClass(c.id, { members: e.target.value.split("\n").filter((x, k, arr) => x.trim() || k < arr.length - 1) })} />
              </label>
            </fieldset>
          ))}
          <button type="button" className="btn" onClick={() => onChange({ ...value, classes: [...value.classes, { id: newId(), name: `Class${value.classes.length + 1}`, kind: "concrete", members: [] }] })}>+ Add class</button>
        </section>

        <section aria-labelledby="uml-rels-h" className="uml-col">
          <h3 id="uml-rels-h">Relationships</h3>
          {value.relations.length === 0 && <p className="muted-text">No lines yet.</p>}
          {value.relations.map((r, i) => (
            <fieldset key={r.id} className="uml-row uml-rel">
              <legend className="sr-only">Relationship {i + 1}</legend>
              <select value={r.from} aria-label={`Relationship ${i + 1}: from`} onChange={(e) => onChange({ ...value, relations: value.relations.map((x) => (x.id === r.id ? { ...x, from: e.target.value } : x)) })}>
                {names.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <select value={r.type} aria-label={`Relationship ${i + 1}: type`} onChange={(e) => onChange({ ...value, relations: value.relations.map((x) => (x.id === r.id ? { ...x, type: e.target.value as RelType } : x)) })}>
                {RELS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
              </select>
              <select value={r.to} aria-label={`Relationship ${i + 1}: to`} onChange={(e) => onChange({ ...value, relations: value.relations.map((x) => (x.id === r.id ? { ...x, to: e.target.value } : x)) })}>
                {names.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button type="button" className="btn icon" aria-label={`Remove relationship ${i + 1}`} onClick={() => onChange({ ...value, relations: value.relations.filter((x) => x.id !== r.id) })}>✕</button>
            </fieldset>
          ))}
          <button type="button" className="btn" disabled={names.length < 2} onClick={() => onChange({
            ...value, relations: [...value.relations, { id: newId(), from: names[1] ?? names[0], to: names[0], type: "realization" }]
          })}>+ Add relationship</button>
          <p className="small-text muted-text">For "has a" / "owns", put the whole first and the part second (the diamond is drawn at the whole).</p>
        </section>
      </div>

      <section aria-label="Diagram preview" className="uml-preview">
        <h3>Preview</h3>
        {spec ? <><div style={{ maxWidth: Math.max(spec.width, 340) }}><StaticDiagram spec={spec} lang="python" /></div><Legend compact /></> : <p className="muted-text">Your diagram appears here.</p>}
      </section>
    </div>
  );
}
