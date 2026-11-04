import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ALL_PATTERNS, CATEGORY_INFO } from "../content/patterns";
import { UML_LESSONS, loadGuides, loadNotation } from "../content/guides/load";
import { loadCaseStudies, loadComparisons, loadKatas } from "../content/extras/load";
import "../styles/guides.css";

interface Item { kind: string; title: string; text: string; to: string }

const STATIC: Item[] = [
  ...ALL_PATTERNS.map((p) => ({ kind: `${CATEGORY_INFO[p.category].label} pattern`, title: p.name, text: [p.intent, ...p.lenses, `confused with ${p.confusedWith.join(", ")}`].join(" · "), to: `/patterns/${p.slug}` })),
  ...UML_LESSONS.map((l) => ({ kind: "UML Basics", title: l.title, text: l.short, to: `/uml/${l.id}` })),
  { kind: "Page", title: "Scratch pad", text: "Write a pattern in Python or Scala and get a review. Draw class diagrams.", to: "/scratch-pad" },
  { kind: "Page", title: "Your progress", text: "Dashboard: streak, quiz scores, flashcards due, review trend.", to: "/dashboard" },
  { kind: "Page", title: "Review session", text: "Flashcards that are due, spaced repetition.", to: "/review" },
  { kind: "Page", title: "Suggest a correction", text: "Feedback: report a mistake, a bug in code, a wrong quiz answer or a typo by email.", to: "/feedback" },
  { kind: "Page", title: "About, privacy & licences", text: "What LLD Studio is, what stays in your browser, and the open-source libraries and fonts it uses.", to: "/about" },
  { kind: "Page", title: "Notation lab", text: "Every UML symbol: visibility, multiplicity, arrows, diamonds, states, actors.", to: "/uml/notation" }
];

async function loadAll(): Promise<Item[]> {
  const [solid, anti, notes, comps, cases, katas] = await Promise.all([loadGuides("solid"), loadGuides("anti"), loadNotation(), loadComparisons(), loadCaseStudies(), loadKatas()]);
  return [
    ...STATIC,
    ...solid.map((g) => ({ kind: "OOP & SOLID", title: g.title, text: `${g.short} ${g.lede}`, to: `/solid/${g.id}` })),
    ...anti.map((g) => ({ kind: "Anti-pattern", title: g.title, text: `${g.short} ${g.lede}`, to: `/anti-patterns/${g.id}` })),
    ...notes.map((s) => ({ kind: "UML symbol", title: s.name, text: `${s.group}: ${s.meaning}`, to: "/uml/notation" })),
    ...comps.map((c) => ({ kind: "Comparison", title: c.title, text: `${c.tagline} ${c.decidingQuestion}`, to: `/compare/${c.id}` })),
    ...cases.map((c) => ({ kind: "Case study", title: c.title, text: `${c.tagline} ${c.prompt}`, to: `/case-studies/${c.slug}` })),
    ...katas.map((k) => ({ kind: "Kata", title: k.title, text: `${k.domain} · ${k.task}`, to: `/scratch-pad/kata/${k.id}` }))
  ];
}

const words = (q: string) => q.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}-]/gu, "")).filter((w) => w.length > 1);

function score(it: Item, ws: string[]): number {
  const t = it.title.toLowerCase(), x = it.text.toLowerCase();
  let s = 0;
  for (const w of ws) {
    if (t.includes(w)) s += t.startsWith(w) || t.includes(" " + w) ? 6 : 4;
    else if (x.includes(w)) s += 1;
    else return 0;
  }
  return s;
}

function Marked({ text, ws }: { text: string; ws: string[] }) {
  if (!ws.length) return <>{text}</>;
  const re = new RegExp(`(${ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(re).map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}</>;
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [items, setItems] = useState<Item[]>(STATIC);
  const [loading, setLoading] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); void loadAll().then((a) => { setItems(a); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const ws = useMemo(() => words(q), [q]);
  const hits = useMemo(() => (ws.length ? items.map((it) => ({ it, s: score(it, ws) })).filter((h) => h.s > 0).sort((a, b) => b.s - a.s).slice(0, 40) : []), [items, ws]);
  return (
    <div className="page">
      <div className="pattern-head"><h1>Search</h1><p className="lede">Patterns, UML lessons, SOLID, anti-patterns, comparisons, case studies and katas.</p></div>
      <form className="search-box" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className="sr-only">Search LLD Studio</label>
        <input id="q" ref={input} type="search" value={q} placeholder="Try “undo”, “parking”, “interface”, “thread”…" autoComplete="off"
          onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }} />
      </form>
      {ws.length > 0 && (
        <p className="muted-text" role="status" style={{ margin: 0 }}>
          {hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : loading ? "Searching…" : "Nothing found. Try a shorter or different word."}
        </p>
      )}
      <ul className="search-results">
        {hits.map(({ it }, i) => (
          <li key={i}>
            <Link to={it.to}>
              <span className="kind">{it.kind}</span>
              <strong><Marked text={it.title} ws={ws} /></strong>
              <span className="small-text muted-text"><Marked text={it.text.length > 180 ? it.text.slice(0, 177) + "…" : it.text} ws={ws} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
