import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { ALL_PATTERNS, CATEGORY_INFO, CONCURRENCY, PATTERNS, stars } from "../content/patterns";
import { loadPattern, type FullPattern } from "../content/lessons";
import type { UmlKind } from "../content/types";
import StoryPlayer from "../anim/StoryPlayer";
import ExamplesPanel from "../anim/ExamplesPanel";
import SequenceDiagram from "../anim/SequenceDiagram";
import { ClassDiagram } from "../anim/StaticDiagram";
import Legend from "../anim/Legend";
import CodePanel, { useCodeLang } from "../components/CodePanel";
import CheckYourself from "../components/CheckYourself";
import { speech } from "../lib/speech";
import { markPatternSeen } from "../lib/progress";
import NotFound from "./NotFound";
import { comparisonsFor, kataIds } from "../content/extras/load";

const KIND_LABEL: Record<UmlKind, string> = {
  interface: "«interface»", abstract: "«abstract»", concrete: "class", singleton: "«singleton»", enum: "«enumeration»", client: "«client»"
};

const SECTIONS = [
  { id: "problem", label: "The problem", rookie: true },
  { id: "lesson", label: "Animation & examples", rookie: true },
  { id: "uml", label: "UML", rookie: true, refresher: true },
  { id: "participants", label: "Participants", rookie: true },
  { id: "code", label: "Code", rookie: true, refresher: true },
  { id: "when", label: "When to use", rookie: true, refresher: true },
  { id: "confused", label: "Confused with", rookie: true, refresher: true },
  { id: "uses", label: "In real code", rookie: true },
  { id: "check", label: "Check yourself", rookie: true, refresher: true },
  { id: "practise", label: "Practise", rookie: true }
];

export default function PatternPage() {
  const { slug = "" } = useParams();
  const { mode } = useOutletContext<{ mode: "rookie" | "refresher" }>() ?? { mode: "rookie" };
  const info = ALL_PATTERNS.find((x) => x.slug === slug);
  const [data, setData] = useState<FullPattern | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setData(undefined);
    if (PATTERNS.some((p) => p.slug === slug)) void markPatternSeen(slug);
    loadPattern(slug).then((d) => { if (live) setData(d); }).catch(() => { if (live) setData(null); });
    window.scrollTo(0, 0);
    return () => { live = false; speech.stop(); };
  }, [slug]);

  if (!info) return <NotFound />;
  const group = info.category === "concurrency" ? CONCURRENCY : PATTERNS;
  const idx = group.indexOf(info);
  const prev = group[idx - 1], next = group[idx + 1];
  const refresher = mode === "refresher";
  const sections = SECTIONS.filter((s) => (refresher ? s.refresher : s.rookie) && (s.id !== "practise" || PATTERNS.includes(info)));

  return (
    <div className="page pattern-page">
      <nav aria-label="Breadcrumb" className="crumb">
        <Link to="/patterns">Patterns</Link> / {CATEGORY_INFO[info.category].label} / {info.name}
      </nav>
      <header className="pattern-head">
        <div className="chips-row">
          <span className={`chip ${info.category}`}>{CATEGORY_INFO[info.category].label}</span>
          {info.lenses.map((l) => <span key={l} className="chip">{l}</span>)}
          <span className="chip" aria-label={`Difficulty ${info.difficulty} of 3`}>{stars(info.difficulty)}</span>
          <span className="chip">Used: {info.usedInPractice}</span>
        </div>
        <h1>{info.name}</h1>
        <p className="lede">{info.intent}</p>
        {refresher && <p className="notice">Refresher mode: the essentials on one screen. Switch to Rookie at the top for the full story, animation and examples.</p>}
      </header>

      {data === undefined && <p className="muted-text">Loading the lesson…</p>}
      {data === null && <div className="notice warn">This lesson could not be loaded.</div>}
      {data && (
        <div className="pattern-layout">
          <nav className="toc" aria-label="On this page">
            <span className="toc-title">On this page</span>
            {sections.map((s) => <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); jump(s.id); }}>{s.label}</a>)}
          </nav>
          <div className="pattern-main">
            <Body data={data} name={info.name} refresher={refresher} confusedWith={info.confusedWith} />
            <nav className="prev-next" aria-label="Previous and next pattern">
              {prev ? <Link className="btn" to={`/patterns/${prev.slug}`}>← {prev.name}</Link> : <span />}
              {next ? <Link className="btn" to={`/patterns/${next.slug}`}>{next.name} →</Link> : <span />}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

/** Hash routes use the URL hash, so in-page links scroll by id instead. */
function jump(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

function Section({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} tabIndex={-1} className={"psec" + (className ? " " + className : "")} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

function Body({ data, name, refresher, confusedWith }: { data: FullPattern; name: string; refresher: boolean; confusedWith: string[] }) {
  const { lesson, animation, quiz } = data;
  const [lang] = useCodeLang();
  const [tab, setTab] = useState<"story" | "examples">("story");
  const [uml, setUml] = useState<"class" | "sequence">("class");
  const [variant, setVariant] = useState<"classic" | "idiomatic">("classic");
  const switchTab = (t: "story" | "examples") => { speech.stop(); setTab(t); };

  return (
    <>
      {!refresher && (
        <Section id="problem" title="Analogy and the problem">
          <div className="two-col">
            <div className="card prose">
              <h3>Real-world analogy</h3>
              <p>{lesson.analogy}</p>
              <h3>The problem</h3>
              <p>{lesson.problem.text}</p>
              <h3>The solution</h3>
              <p>{lesson.solution}</p>
            </div>
            <CodePanel code={lesson.problem.code} title="Before the pattern" note="Runs as-is. This is the code that hurts when requirements change." maxHeight={420} />
          </div>
        </Section>
      )}

      {!refresher && (
        <Section id="lesson" title="Animation & examples" className="card lesson-card">
          <div className="view-tabs" role="tablist" aria-label="View">
            <button type="button" role="tab" className="view-tab" aria-selected={tab === "story"} tabIndex={tab === "story" ? 0 : -1} onClick={() => switchTab("story")}>Story animation</button>
            <button type="button" role="tab" className="view-tab" aria-selected={tab === "examples"} tabIndex={tab === "examples" ? 0 : -1} onClick={() => switchTab("examples")}>Real-world examples</button>
          </div>
          <div hidden={tab !== "story"}>
            {animation
              ? <StoryPlayer story={animation.story} code={{ problem: lesson.problem.code, main: lesson.code }} idBase={`story-${lesson.slug}`} active={tab === "story"} />
              : <p className="notice">The story animation for {name} is coming soon. The code and examples below are ready.</p>}
          </div>
          <div hidden={tab !== "examples"}>
            {tab === "examples" && <ExamplesPanel lesson={lesson} anims={animation?.examples ?? {}} patternName={name} active={tab === "examples"} />}
          </div>
        </Section>
      )}

      <Section id="uml" title="UML">
        <div className="card uml-card">
          <div className="seg" role="group" aria-label="Diagram type">
            <button type="button" aria-pressed={uml === "class"} onClick={() => setUml("class")}>Class diagram</button>
            <button type="button" aria-pressed={uml === "sequence"} onClick={() => setUml("sequence")}>Sequence diagram</button>
          </div>
          {animation ? (
            uml === "class"
              ? <><ClassDiagram story={animation.story} lang={lang} /><Legend compact /></>
              : <SequenceDiagram spec={animation.sequence} />
          ) : <p className="muted-text">Diagram coming soon.</p>}
        </div>
      </Section>

      {!refresher && (
        <Section id="participants" title="Participants">
          <table className="ptable">
            <thead><tr><th scope="col">Role</th><th scope="col">In the code</th><th scope="col">Kind</th><th scope="col">Responsibility</th></tr></thead>
            <tbody>
              {lesson.participants.map((p) => (
                <tr key={p.role + p.name}>
                  <th scope="row" data-label="Role">{p.role}</th>
                  <td data-label="In the code"><code>{p.name}</code></td>
                  <td data-label="Kind"><span className={`kind-pill ${p.kind}`}>{KIND_LABEL[p.kind]}</span></td>
                  <td data-label="Responsibility">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <Section id="code" title="Code">
        <CodePanel
          code={variant === "classic" ? lesson.code : lesson.idiomatic.code}
          title={variant === "classic" ? "Classic version" : "Idiomatic version"}
          note={variant === "classic" ? "Runs as-is with Python 3.12 or Scala 3." : lesson.idiomatic.note}
          extra={
            <div className="seg small" role="group" aria-label="Version">
              <button type="button" aria-pressed={variant === "classic"} onClick={() => setVariant("classic")}>Classic</button>
              <button type="button" aria-pressed={variant === "idiomatic"} onClick={() => setVariant("idiomatic")}>Idiomatic</button>
            </div>
          }
        />
      </Section>

      <Section id="when" title="When to use it">
        <div className="grid-2">
          <div className="card"><h3>Use it when</h3><ul className="ticks">{lesson.whenToUse.map((t) => <li key={t}>{t}</li>)}</ul></div>
          <div className="card"><h3>Avoid it when</h3><ul className="crosses">{lesson.whenNotToUse.map((t) => <li key={t}>{t}</li>)}</ul></div>
          {!refresher && <div className="card"><h3>Pros</h3><ul className="ticks">{lesson.pros.map((t) => <li key={t}>{t}</li>)}</ul></div>}
          {!refresher && <div className="card"><h3>Cons</h3><ul className="crosses">{lesson.cons.map((t) => <li key={t}>{t}</li>)}</ul></div>}
        </div>
      </Section>

      <Section id="confused" title="Often confused with">
        <div className="grid-2">
          {lesson.confusedWith.map((c) => {
            const target = PATTERNS.find((p) => p.name === c.name);
            return (
              <div key={c.name} className="card">
                <h3>{target ? <Link to={`/patterns/${target.slug}`}>{c.name}</Link> : c.name}</h3>
                <p>{c.difference}</p>
              </div>
            );
          })}
        </div>
        {lesson.confusedWith.length === 0 && <p>{confusedWith.join(", ")}</p>}
        <div className="card solid-card"><h3>SOLID principles it applies</h3><p>{lesson.solid}</p></div>
      </Section>

      {!refresher && (
        <Section id="uses" title="Where you meet it in real code">
          <div className="grid-2">
            <div className="card"><h3>Libraries and frameworks</h3><ul>{lesson.realWorldUses.map((t) => <li key={t}>{t}</li>)}</ul></div>
            <div className="card"><h3>In LLD interviews</h3><ul>{lesson.interviewUses.map((t) => <li key={t}>{t}</li>)}</ul></div>
          </div>
        </Section>
      )}

      {(() => {
        const ids = comparisonsFor(lesson.slug);
        const names = (id: string) => id.split("-vs-").map((s) => ALL_PATTERNS.find((p) => p.slug === s)?.name ?? s).join(" vs ");
        return ids.length > 0 && (
          <p className="compare-links">Side by side: {ids.map((id, i) => <span key={id}>{i > 0 && " · "}<Link to={`/compare/${id}`}>{names(id)}</Link></span>)}</p>
        );
      })()}

      <Section id="check" title="Check yourself">
        {quiz ? <CheckYourself quiz={quiz} patternName={name} onReview={() => jump(refresher ? "uml" : "lesson")} /> : <p className="muted-text">The quiz for {name} is coming soon.</p>}
      </Section>

      {!refresher && PATTERNS.some((p) => p.slug === lesson.slug) && (
        <Section id="practise" title="Practise">
          <div className="card practise">
            <p>Write {name} yourself in the scratch pad, in Python or Scala, and get plain-English feedback. Nothing is run and nothing leaves your browser.</p>
            <div className="actions">
              <Link className="btn primary" to={`/scratch-pad/${lesson.slug}`}>Practise {name} in the scratch pad</Link>
              {kataIds().length > 0 && <Link className="btn" to={`/katas?pattern=${lesson.slug}`}>More {name} katas</Link>}
            </div>
          </div>
        </Section>
      )}
    </>
  );
}
