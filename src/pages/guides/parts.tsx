import { Fragment, useMemo, useRef, useState } from "react";
import type { Lang } from "../../content/types";
import type { Visual } from "../../content/guides/types";
import { sketchToUml } from "../../content/extras/load";
import { umlToDiagram, codeToUml, compareUml } from "../../review/uml";
import type { Finding, UmlModel } from "../../review/types";
import { StaticDiagram } from "../../anim/StaticDiagram";
import SequenceDiagram from "../../anim/SequenceDiagram";
import FlowDiagram from "../../anim/FlowDiagram";
import Legend from "../../anim/Legend";
import CodePanel, { useCodeLang } from "../../components/CodePanel";
import UmlEditor from "../../scratch/UmlEditor";
import { DiagramExport } from "../../components/DiagramExport";
import "../../styles/guides.css";

/** Plain text with `code` and **bold** (the only formatting lesson text uses). */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => p.startsWith("`") && p.endsWith("`") && p.length > 1 ? <code key={i}>{p.slice(1, -1)}</code>
        : p.startsWith("**") && p.endsWith("**") && p.length > 3 ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <Fragment key={i}>{p}</Fragment>)}
    </>
  );
}

/** A class / sequence / flow diagram where some elements can be hidden (scenes build diagrams up step by step). */
export function VisualView({ visual, hidden, active, name }: { visual: Visual; hidden?: Set<string>; active?: Set<string>; name: string }) {
  const [lang] = useCodeLang();
  const box = useRef<HTMLDivElement>(null);
  const cls = useMemo(() => {
    if (visual.kind !== "class") return null;
    const model = sketchToUml(visual.uml);
    const spec = umlToDiagram(model);
    const ids = new Map<string, string>();
    model.classes.forEach((c) => ids.set(c.name, "n_" + c.id));
    model.relations.forEach((r) => ids.set(`${r.from}>${r.to}`, "e_" + r.id));
    return { spec, ids };
  }, [visual]);
  let body: React.ReactNode;
  if (visual.kind === "class" && cls) {
    const omit = new Set([...(hidden ?? [])].map((h) => cls.ids.get(h)).filter((x): x is string => !!x));
    body = <><StaticDiagram spec={cls.spec} lang={lang} omit={omit} /><Legend compact /></>;
  } else if (visual.kind === "sequence") {
    const h = hidden ?? new Set<string>();
    const spec = {
      ...visual.spec,
      participants: visual.spec.participants.filter((p) => !h.has(p.id)),
      messages: visual.spec.messages.filter((_, i) => !h.has(`m${i + 1}`))
    };
    body = <SequenceDiagram spec={spec} />;
  } else if (visual.kind === "flow") {
    body = <FlowDiagram spec={visual.spec} hidden={hidden} active={active} />;
  }
  return (
    <div className="visual-view" ref={box}>
      {body}
      <DiagramExport target={box} name={name} />
    </div>
  );
}

const SEV = { fail: "✗", warn: "⚠", note: "ℹ", pass: "✓" } as const;

/** "Draw your first diagram": read the code, draw its class diagram, check it against the code. */
export function DrawExercise({ task, code, tips }: { task: string; code: { python: string; scala: string }; tips: string[] }) {
  const [lang] = useCodeLang();
  const [diagram, setDiagram] = useState<UmlModel>({ classes: [], relations: [] });
  const [result, setResult] = useState<Finding[] | null>(null);
  const [answer, setAnswer] = useState<UmlModel | null>(null);
  const [busy, setBusy] = useState(false);
  const read = async (l: Lang) => { const { readCode } = await import("../../review/index"); return readCode(code[l], l); };
  async function check() {
    setBusy(true);
    try {
      const m = await read(lang);
      const f = compareUml(diagram, m);
      setResult(diagram.classes.length ? f : [{ id: "empty", sev: "warn", title: "Your diagram is empty", text: "Add a class for each class in the code, then the lines between them." }]);
    } finally { setBusy(false); }
  }
  const answerSpec = useMemo(() => (answer ? umlToDiagram(answer) : null), [answer]);
  return (
    <section className="card draw-check" aria-labelledby="draw-h" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 id="draw-h" style={{ margin: 0 }}>Your turn: draw it</h2>
      <p style={{ margin: 0 }}><Rich text={task} /></p>
      <ul className="ticks">{tips.map((t) => <li key={t}><Rich text={t} /></li>)}</ul>
      <CodePanel code={code} title="The code" note="Read it, then draw the class diagram below. Switch Python / Scala any time." maxHeight={420} />
      <UmlEditor value={diagram} onChange={(d) => { setDiagram(d); setResult(null); }} />
      <div className="actions">
        <button type="button" className="btn primary" onClick={check} disabled={busy}>{busy ? "Reading the code…" : "Check my diagram"}</button>
        <button type="button" className="btn" onClick={async () => setAnswer(answer ? null : codeToUml(await read(lang)))}>{answer ? "Hide the answer" : "Show the answer"}</button>
      </div>
      {result && (
        <ul className="findings" aria-live="polite">
          {result.map((f, i) => (
            <li key={i} className={`finding ${f.sev}`}>
              <span className="f-icon" aria-hidden="true">{SEV[f.sev as keyof typeof SEV] ?? "•"}</span>
              <div><strong>{f.title}</strong><p style={{ margin: "4px 0 0" }}>{f.text}</p>{f.fix && <p className="f-fix" style={{ margin: "4px 0 0" }}>{f.fix}</p>}</div>
            </li>
          ))}
        </ul>
      )}
      {answerSpec && <div><h3>The diagram this code implies</h3><StaticDiagram spec={answerSpec} lang={lang} /><Legend compact /></div>}
    </section>
  );
}
