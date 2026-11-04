import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Guide, GuideBlock, NotationSymbol } from "../../content/guides/types";
import { UML_LESSONS, loadGuide, loadGuides, loadNotation } from "../../content/guides/load";
import { computeProgress, loadProgressData, markGuideSeen } from "../../lib/progress";
import CodePanel from "../../components/CodePanel";
import { ExtraQuiz, PatternLink, UmlView } from "../extras/shared";
import NotFound from "../NotFound";
import { Rich } from "./parts";
import { FLOW_SIZE } from "../../anim/FlowDiagram";
import "../../styles/guides.css";

function useSeen() {
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => { void loadProgressData().then((d) => { const p = computeProgress(d); setSeen([...p.guidesSeen, ...(p.umlSeen.length ? ["uml/relationships"] : [])]); }); }, []);
  return seen;
}

export function UmlIndex() {
  const seen = useSeen();
  return (
    <div className="page">
      <div className="pattern-head">
        <h1>UML Basics</h1>
        <p className="lede">Nine short lessons on the diagrams you draw in Low-Level Design: what each symbol means, how to spot it in Python and Scala, and when to draw it. Each lesson builds diagrams step by step and ends with practice.</p>
      </div>
      <ol className="lesson-index">
        {UML_LESSONS.map((l) => (
          <li key={l.id}>
            <Link to={`/uml/${l.id}`} className="card">
              <span className="num">Lesson {l.order}</span>
              <span className="ttl">{l.title}</span>
              <span className="small-text muted-text">{l.short}</span>
              {seen.includes(`uml/${l.id}`) && <span className="seen">✓ Opened</span>}
            </Link>
          </li>
        ))}
        <li>
          <Link to="/uml/notation" className="card">
            <span className="num">Reference</span>
            <span className="ttl">Notation lab</span>
            <span className="small-text muted-text">Every UML symbol in one place. Click one to see what it means and the Python / Scala it stands for.</span>
          </Link>
        </li>
      </ol>
    </div>
  );
}

/* ---------------- notation lab ---------------- */

const REL_GLYPH: Record<string, { dashed: boolean; end: "arrow" | "tri" | "dia" | "dia-filled" }> = {
  association: { dashed: false, end: "arrow" }, dependency: { dashed: true, end: "arrow" }, aggregation: { dashed: false, end: "dia" },
  composition: { dashed: false, end: "dia-filled" }, inheritance: { dashed: false, end: "tri" }, realization: { dashed: true, end: "tri" }
};

export function Glyph({ glyph }: { glyph: string }) {
  const [kind, value = ""] = [glyph.slice(0, glyph.indexOf(":")), glyph.slice(glyph.indexOf(":") + 1)];
  if (kind === "rel" && REL_GLYPH[value]) {
    const g = REL_GLYPH[value], w = 56;
    return (
      <svg width={w} height={16} viewBox={`0 0 ${w} 16`} aria-hidden="true">
        <line x1={g.end === "dia" || g.end === "dia-filled" ? 14 : 2} y1={8} x2={g.end === "tri" ? w - 12 : w - 2} y2={8} stroke="currentColor" strokeWidth={2} strokeDasharray={g.dashed ? "5 4" : undefined} />
        {g.end === "arrow" && <polyline points={`${w - 10},3 ${w - 2},8 ${w - 10},13`} fill="none" stroke="currentColor" strokeWidth={2} />}
        {g.end === "tri" && <polygon points={`${w - 12},2 ${w - 1},8 ${w - 12},14`} fill="var(--surface)" stroke="currentColor" strokeWidth={2} />}
        {(g.end === "dia" || g.end === "dia-filled") && <polygon points="1,8 7.5,3 14,8 7.5,13" fill={g.end === "dia-filled" ? "currentColor" : "var(--surface)"} stroke="currentColor" strokeWidth={2} />}
      </svg>
    );
  }
  if (kind === "box") return <span className={`mini-box ${value}`} aria-hidden="true">{value === "interface" ? "«interface»" : value === "enum" ? "«enum»" : value === "singleton" ? "object" : value === "abstract" ? "Abstract" : "Class"}</span>;
  if (kind === "flow") {
    const [w, h] = FLOW_SIZE[value as keyof typeof FLOW_SIZE] ?? [30, 20];
    const s = Math.min(1, 40 / w, 24 / h), W = Math.max(8, w * s), H = Math.max(6, h * s);
    return (
      <svg width={Math.max(W, 30) + 4} height={Math.max(H, 16) + 4} viewBox={`-2 -2 ${Math.max(W, 30) + 4} ${Math.max(H, 16) + 4}`} aria-hidden="true">
        {value === "initial" ? <circle cx={8} cy={8} r={7} fill="currentColor" />
          : value === "final" ? <><circle cx={9} cy={9} r={8} fill="none" stroke="currentColor" strokeWidth={2} /><circle cx={9} cy={9} r={4} fill="currentColor" /></>
          : value === "decision" || value === "merge" ? <polygon points="10,0 20,10 10,20 0,10" fill="none" stroke="currentColor" strokeWidth={2} />
          : value === "fork" || value === "join" ? <rect x={0} y={6} width={30} height={5} fill="currentColor" />
          : value === "usecase" ? <ellipse cx={18} cy={9} rx={17} ry={8} fill="none" stroke="currentColor" strokeWidth={2} />
          : value === "actor" ? <g fill="none" stroke="currentColor" strokeWidth={2}><circle cx={10} cy={4} r={3.5} /><line x1={10} y1={8} x2={10} y2={14} /><line x1={4} y1={10} x2={16} y2={10} /><line x1={10} y1={14} x2={5} y2={19} /><line x1={10} y1={14} x2={15} y2={19} /></g>
          : <rect x={0} y={1} width={30} height={16} rx={value === "state" || value === "action" ? 7 : 0} fill="none" stroke="currentColor" strokeWidth={2} />}
      </svg>
    );
  }
  return <span className="glyph-text" aria-hidden="true">{value || glyph}</span>;
}

export function NotationLab() {
  const [list, setList] = useState<NotationSymbol[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const detail = useRef<HTMLDivElement>(null);
  useEffect(() => { void loadNotation().then((l) => { setList(l); setSel(l[0]?.id ?? null); }); void markGuideSeen("uml/notation"); }, []);
  const s = list?.find((x) => x.id === sel);
  const groups = list ? [...new Set(list.map((x) => x.group))] : [];
  return (
    <div className="page">
      <div className="pattern-head">
        <span className="crumb"><Link to="/uml">UML Basics</Link> · Reference</span>
        <h1>Notation lab</h1>
        <p className="lede">Every symbol you will meet in a UML class, sequence, state, activity or use-case diagram. Pick one to see what it means and the Python and Scala it stands for.</p>
      </div>
      {!list ? <p className="muted-text">Loading…</p> : (
        <div className="notation-lab">
          <div>
            {groups.map((g) => (
              <section key={g} className="symbol-group" aria-labelledby={`g-${g}`}>
                <h2 id={`g-${g}`}>{g}</h2>
                <div className="symbol-grid">
                  {list.filter((x) => x.group === g).map((x) => (
                    <button key={x.id} type="button" className="symbol-btn" aria-pressed={x.id === sel}
                      onClick={() => { setSel(x.id); if (window.matchMedia("(max-width: 860px)").matches) window.setTimeout(() => detail.current?.scrollIntoView({ block: "start" }), 0); }}>
                      <Glyph glyph={x.glyph} />
                      <span className="sym-name">{x.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="card symbol-detail" ref={detail} aria-live="polite" tabIndex={-1}>
            {s && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Glyph glyph={s.glyph} /><h2 style={{ margin: 0 }}>{s.name}</h2></div>
                <p style={{ margin: 0, lineHeight: 1.6 }}><Rich text={s.meaning} /></p>
                {s.code && <CodePanel code={s.code} title="In code" maxHeight={320} legend={false} />}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- SOLID and anti-pattern guides ---------------- */

const SECTION = {
  solid: { title: "OOP & SOLID", path: "/solid", lede: "The five principles every design pattern is built on, plus the object-oriented basics they need. Each one starts from code that hurts, shows the fix, and points to the patterns that apply it." },
  anti: { title: "Anti-patterns", path: "/anti-patterns", lede: "Designs that look reasonable and cause pain later, including patterns used where they don't belong. How to spot each one in code, and what to do instead." }
} as const;

export function GuideIndex({ section }: { section: "solid" | "anti" }) {
  const [list, setList] = useState<Guide[] | null>(null);
  const seen = useSeen();
  useEffect(() => { setList(null); void loadGuides(section).then(setList); }, [section]);
  const S = SECTION[section];
  return (
    <div className="page">
      <div className="pattern-head"><h1>{S.title}</h1><p className="lede">{S.lede}</p></div>
      {!list ? <p className="muted-text">Loading…</p> : (
        <ol className="lesson-index">
          {list.map((g) => (
            <li key={g.id}>
              <Link to={`${S.path}/${g.id}`} className="card">
                <span className="num">{section === "solid" ? `Lesson ${g.order}` : `Anti-pattern ${g.order}`}</span>
                <span className="ttl">{g.title}</span>
                <span className="small-text muted-text">{g.short}</span>
                {seen.includes(`${section}/${g.id}`) && <span className="seen">✓ Opened</span>}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Block({ b }: { b: GuideBlock }) {
  switch (b.type) {
    case "text": return <p className="gtext"><Rich text={b.text} /></p>;
    case "callout": return <div className={`callout ${b.tone}`}><h2 className="block-h">{b.title}</h2><p><Rich text={b.text} /></p></div>;
    case "list": return <div>{b.title && <h2 className="block-h">{b.title}</h2>}<ul className={b.style === "plain" ? undefined : b.style ?? "ticks"}>{b.items.map((t) => <li key={t}><Rich text={t} /></li>)}</ul></div>;
    case "code": return <div><h2 className="block-h">{b.title}</h2><CodePanel code={b.code} title="Code" note={b.note} maxHeight={480} /></div>;
    case "diagram": return <div><h2 className="block-h">{b.title}</h2><UmlView sketch={b.uml} /></div>;
    case "patterns":
      return (
        <div><h2 className="block-h">{b.title}</h2>
          <div className="grid-2">{b.items.map((p) => <div key={p.slug} className="card"><strong><PatternLink slug={p.slug} /></strong><p className="small-text" style={{ margin: "6px 0 0" }}><Rich text={p.how} /></p></div>)}</div>
        </div>
      );
    case "compare":
      return (
        <div className="before-after">
          {(["before", "after"] as const).map((k) => (
            <div key={k} className={`card ${k}`}>
              <h2 className="block-h">{b[k].title}</h2>
              <p style={{ margin: 0 }}><Rich text={b[k].text} /></p>
              {b[k].uml && <UmlView sketch={b[k].uml!} legend={false} />}
              <CodePanel code={b[k].code} title={k === "before" ? "Before" : "After"} maxHeight={420} legend={false} />
            </div>
          ))}
        </div>
      );
  }
}

export function GuidePage({ section }: { section: "solid" | "anti" }) {
  const { id = "" } = useParams();
  const [g, setG] = useState<Guide | null | undefined>(undefined);
  const [all, setAll] = useState<Guide[]>([]);
  useEffect(() => {
    setG(undefined);
    void loadGuide(section, id).then(setG);
    void loadGuides(section).then(setAll);
    void markGuideSeen(`${section}/${id}`);
    window.scrollTo(0, 0);
  }, [section, id]);
  if (g === null) return <NotFound />;
  if (!g) return <div className="page"><p className="muted-text">Loading…</p></div>;
  const S = SECTION[section];
  const i = all.findIndex((x) => x.id === g.id);
  const prev = all[i - 1], next = all[i + 1];
  return (
    <div className="page">
      <div className="pattern-head">
        <span className="crumb"><Link to={S.path}>{S.title}</Link> · {g.order} of {all.length || "…"}</span>
        <h1>{g.title}</h1>
        <p className="lede"><Rich text={g.lede} /></p>
      </div>
      <div className="guide-body">
        {g.blocks.map((b, k) => <Block key={k} b={b} />)}
        <section className="card" aria-labelledby="gq-h" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 id="gq-h" style={{ margin: 0 }}>Check yourself</h2>
          <ExtraQuiz deck={`${section}-${g.id}`} title={g.title} questions={g.quiz} onReview={() => window.scrollTo(0, 0)} />
        </section>
      </div>
      <nav className="lesson-nav" aria-label="Previous and next">
        {prev ? <Link className="btn" to={`${S.path}/${prev.id}`}>← {prev.title}</Link> : <Link className="btn" to={S.path}>← {S.title}</Link>}
        {next ? <Link className="btn primary" to={`${S.path}/${next.id}`}>{next.title} →</Link>
          : section === "solid" ? <Link className="btn primary" to="/patterns">Next: the patterns →</Link> : <Link className="btn primary" to="/compare">Next: compare look-alikes →</Link>}
      </nav>
    </div>
  );
}
