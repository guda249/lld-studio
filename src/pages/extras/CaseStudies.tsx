import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodePanel from "../../components/CodePanel";
import SequenceDiagram from "../../anim/SequenceDiagram";
import { loadCaseStudies, loadCaseStudy } from "../../content/extras/load";
import type { CaseStudy } from "../../content/extras/types";
import { ALL_PATTERNS } from "../../content/patterns";
import NotFound from "../NotFound";
import { ExtraQuiz, PatternLink, QAList, Section, Toc, UmlView, patternName, stars } from "./shared";

const cat = (slug: string) => ALL_PATTERNS.find((p) => p.slug === slug)?.category ?? "";

export function CaseIndex() {
  const [list, setList] = useState<CaseStudy[] | null>(null);
  useEffect(() => { void loadCaseStudies().then((l) => setList(l.sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title)))); }, []);
  return (
    <div className="page">
      <div className="pattern-head">
        <h1>LLD case studies</h1>
        <p className="lede">Interview-style design problems, worked end to end: the questions to ask first, requirements, classes, UML, one key flow, full Python and Scala code, and the patterns that earn their place.</p>
      </div>
      {!list ? <p className="muted-text">Loading…</p> : (
        <div className="grid">
          {list.map((c) => (
            <Link key={c.slug} to={`/case-studies/${c.slug}`} className="card extra-card">
              <span className="name">{c.title}</span>
              <span className="muted-text small-text">{c.tagline}</span>
              <span className="meta small-text"><span aria-label={`Difficulty ${c.difficulty} of 3`}>{stars(c.difficulty)}</span><span>{c.patterns.map((p) => patternName(p.slug)).join(", ")}</span></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CasePage() {
  const { slug = "" } = useParams();
  const [c, setC] = useState<CaseStudy | null | undefined>(undefined);
  useEffect(() => { setC(undefined); void loadCaseStudy(slug).then(setC); window.scrollTo(0, 0); }, [slug]);
  if (c === null) return <NotFound />;
  if (!c) return <div className="page"><p className="muted-text">Loading…</p></div>;
  const toc = [
    { id: "prompt", label: "The prompt" }, { id: "clarify", label: "Questions to ask" }, { id: "requirements", label: "Requirements" },
    { id: "entities", label: "Core classes" }, { id: "uml", label: "Class diagram" }, { id: "flow", label: "Key flow" },
    ...(c.states ? [{ id: "states", label: "State machine" }] : []),
    { id: "patterns", label: "Patterns used" }, { id: "code", label: "Code" }, { id: "tradeoffs", label: "Trade-offs" },
    { id: "followups", label: "Follow-ups" }, { id: "extend", label: "Extend it" }, { id: "check", label: "Check yourself" }
  ];
  return (
    <div className="page pattern-page">
      <nav aria-label="Breadcrumb" className="crumb"><Link to="/case-studies">Case studies</Link> / {c.title}</nav>
      <header className="pattern-head">
        <div className="chips-row">
          <span className="chip" aria-label={`Difficulty ${c.difficulty} of 3`}>{stars(c.difficulty)}</span>
          {c.patterns.map((p) => <span key={p.slug} className={`chip ${cat(p.slug)}`}>{patternName(p.slug)}</span>)}
        </div>
        <h1>{c.title}</h1>
        <p className="lede">{c.tagline}</p>
      </header>
      <div className="pattern-layout">
        <Toc items={toc} />
        <div className="pattern-main">
          <Section id="prompt" title="The prompt">
            <blockquote className="prompt-quote">{c.prompt}</blockquote>
            <p className="muted-text small-text">Try sketching your own design for a few minutes before reading on.</p>
          </Section>

          <Section id="clarify" title="Questions to ask first">
            <p className="muted-text">A strong answer starts by pinning down scope. Open each one to see the answer we assume.</p>
            <QAList items={c.clarify} />
          </Section>

          <Section id="requirements" title="Requirements">
            <div className="grid-2">
              <div className="card"><h3>Must do</h3><ul className="ticks">{c.requirements.functional.map((t) => <li key={t}>{t}</li>)}</ul></div>
              <div className="card"><h3>Qualities</h3><ul>{c.requirements.nonFunctional.map((t) => <li key={t}>{t}</li>)}</ul>
                <h3>Out of scope</h3><ul className="crosses">{c.requirements.outOfScope.map((t) => <li key={t}>{t}</li>)}</ul></div>
            </div>
          </Section>

          <Section id="entities" title="Core classes">
            <table className="ptable">
              <thead><tr><th scope="col">Class</th><th scope="col">Responsible for</th></tr></thead>
              <tbody>{c.entities.map((e) => <tr key={e.name}><th scope="row"><code>{e.name}</code></th><td data-label="Responsible for">{e.responsibility}</td></tr>)}</tbody>
            </table>
          </Section>

          <Section id="uml" title="Class diagram">
            <UmlView sketch={c.uml} />
          </Section>

          <Section id="flow" title={`Key flow: ${c.flow.title}`}>
            <SequenceDiagram spec={c.flow.sequence} />
          </Section>

          {c.states && (
            <Section id="states" title={`State machine: ${c.states.name}`}>
              <p className="chips-row">{c.states.states.map((s) => <span key={s} className="chip state-chip">{s}</span>)}</p>
              <table className="ptable">
                <thead><tr><th scope="col">From</th><th scope="col">On</th><th scope="col">To</th></tr></thead>
                <tbody>{c.states.transitions.map((t, i) => <tr key={i}><th scope="row">{t.from}</th><td data-label="On">{t.on}</td><td data-label="To">{t.to}</td></tr>)}</tbody>
              </table>
            </Section>
          )}

          <Section id="patterns" title="Patterns used, and why">
            <div className="grid-2">
              {c.patterns.map((p) => (
                <div key={p.slug} className={`card pattern-card ${cat(p.slug)}`}>
                  <h3 style={{ margin: 0 }}><PatternLink slug={p.slug} /></h3>
                  <p className="small-text"><strong>Where:</strong> {p.where}</p>
                  <p className="small-text" style={{ margin: 0 }}><strong>Why:</strong> {p.why}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="code" title="Code">
            <CodePanel code={c.code} title={c.title} maxHeight={640} />
          </Section>

          <Section id="tradeoffs" title="Trade-offs">
            <ul>{c.tradeoffs.map((t) => <li key={t}>{t}</li>)}</ul>
          </Section>

          <Section id="followups" title="Interviewer follow-ups">
            <QAList items={c.followUps} />
          </Section>

          <Section id="extend" title="Extend it yourself">
            <ol className="steps-list">{c.extend.map((t) => <li key={t}>{t}</li>)}</ol>
            <p className="small-text muted-text">Practise the patterns involved in the <Link to="/scratch-pad">scratch pad</Link> or with a <Link to="/katas">kata</Link>.</p>
          </Section>

          <Section id="check" title="Check yourself">
            <ExtraQuiz deck={`case-${c.slug}`} title={c.title} questions={c.quiz} onReview={() => document.getElementById("uml")?.scrollIntoView()} />
          </Section>
        </div>
      </div>
    </div>
  );
}
