import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodePanel from "../../components/CodePanel";
import { loadComparison, loadComparisons } from "../../content/extras/load";
import type { Comparison } from "../../content/extras/types";
import { ALL_PATTERNS } from "../../content/patterns";
import NotFound from "../NotFound";
import { ExtraQuiz, PatternLink, Section, Toc, UmlView, patternName } from "./shared";

const cat = (slug: string) => ALL_PATTERNS.find((p) => p.slug === slug)?.category ?? "";

export function CompareIndex() {
  const [list, setList] = useState<Comparison[] | null>(null);
  useEffect(() => { void loadComparisons().then((l) => setList(l.sort((a, b) => a.title.localeCompare(b.title)))); }, []);
  return (
    <div className="page">
      <div className="pattern-head">
        <h1>Compare look-alikes</h1>
        <p className="lede">Some patterns look the same on a class diagram. Each comparison solves one scenario with both patterns, side by side, and gives you the one question that decides between them.</p>
      </div>
      {!list ? <p className="muted-text">Loading…</p> : (
        <div className="grid">
          {list.map((c) => (
            <Link key={c.id} to={`/compare/${c.id}`} className="card extra-card">
              <span className="chips-row">{c.sides.map((s) => <span key={s.slug} className={`chip ${cat(s.slug)}`}>{patternName(s.slug)}</span>)}</span>
              <span className="name">{c.title}</span>
              <span className="muted-text small-text">{c.tagline}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ComparePage() {
  const { id = "" } = useParams();
  const [c, setC] = useState<Comparison | null | undefined>(undefined);
  useEffect(() => { setC(undefined); void loadComparison(id).then(setC); window.scrollTo(0, 0); }, [id]);
  if (c === null) return <NotFound />;
  if (!c) return <div className="page"><p className="muted-text">Loading…</p></div>;
  const toc = [
    { id: "scenario", label: "The scenario" }, { id: "sides", label: "Side by side" }, { id: "code", label: "Code" },
    { id: "table", label: "Differences" }, { id: "mixups", label: "Common mix-ups" }, { id: "check", label: "Check yourself" }
  ];
  return (
    <div className="page pattern-page">
      <nav aria-label="Breadcrumb" className="crumb"><Link to="/compare">Compare</Link> / {c.title}</nav>
      <header className="pattern-head">
        <div className="chips-row">{c.sides.map((s) => <span key={s.slug} className={`chip ${cat(s.slug)}`}>{patternName(s.slug)}</span>)}</div>
        <h1>{c.title}</h1>
        <p className="lede">{c.tagline}</p>
      </header>
      <div className="pattern-layout">
        <Toc items={toc} />
        <div className="pattern-main">
          <Section id="scenario" title="The scenario">
            <p className="prose">{c.scenario}</p>
            <div className="decide"><span className="decide-label">The deciding question</span><p>{c.decidingQuestion}</p></div>
          </Section>

          <Section id="sides" title="Side by side">
            <div className={`sides n${c.sides.length}`}>
              {c.sides.map((s) => (
                <article key={s.slug} className={`card side ${cat(s.slug)}`} aria-labelledby={`side-${s.slug}`}>
                  <h3 id={`side-${s.slug}`}><PatternLink slug={s.slug} /></h3>
                  <p className="side-one">{s.oneLiner}</p>
                  <UmlView sketch={s.uml} legend={false} />
                  <h4>How it works</h4>
                  <ol className="steps-list">{s.howItWorks.map((t) => <li key={t}>{t}</li>)}</ol>
                  <h4>Pick it when</h4>
                  <ul className="ticks">{s.pickWhen.map((t) => <li key={t}>{t}</li>)}</ul>
                </article>
              ))}
            </div>
          </Section>

          <Section id="code" title="Code">
            <p className="muted-text">The same scenario in each pattern. Switch Python / Scala at the top of any panel.</p>
            {c.sides.map((s) => <CodePanel key={s.slug} code={s.code} title={patternName(s.slug)} maxHeight={480} />)}
          </Section>

          <Section id="table" title="Differences">
            <table className="ptable">
              <thead><tr><th scope="col">Aspect</th>{c.sides.map((s) => <th key={s.slug} scope="col">{patternName(s.slug)}</th>)}</tr></thead>
              <tbody>
                {c.table.map((r) => (
                  <tr key={r.aspect}><th scope="row">{r.aspect}</th>{r.values.map((v, i) => <td key={i} data-label={patternName(c.sides[i].slug)}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section id="mixups" title="Common mix-ups">
            <ul className="crosses">{c.mixups.map((t) => <li key={t}>{t}</li>)}</ul>
          </Section>

          <Section id="check" title="Check yourself">
            <ExtraQuiz deck={`compare-${c.id}`} title={c.title} questions={c.quiz} onReview={() => document.getElementById("sides")?.scrollIntoView()} />
          </Section>
        </div>
      </div>
    </div>
  );
}
