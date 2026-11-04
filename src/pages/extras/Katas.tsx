import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadKatas } from "../../content/extras/load";
import type { Kata } from "../../content/extras/types";
import { CATEGORY_INFO, PATTERNS } from "../../content/patterns";
import { listAttempts, type Attempt } from "../../scratch/storage";
import { stars } from "./shared";
import "../../styles/extras.css";

export default function Katas() {
  const [params, setParams] = useSearchParams();
  const only = params.get("pattern") ?? "";
  const [list, setList] = useState<Kata[] | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    void loadKatas().then((l) => setList(l));
    void listAttempts().then((as: Attempt[]) => {
      const b: Record<string, number> = {};
      for (const a of as) if (a.kata) b[a.kata] = Math.max(b[a.kata] ?? 0, a.report.score);
      setBest(b);
    });
  }, []);
  const shown = PATTERNS.filter((p) => !only || p.slug === only);

  return (
    <div className="page">
      <div className="pattern-head">
        <h1>Refactoring katas</h1>
        <p className="lede">Short practice drills. Each kata hands you working but smelly code from a real-looking domain; refactor it into the pattern in the scratch pad and the review tells you how you did. Your code is read, never run.</p>
      </div>
      <div className="card kata-filter">
        <label>Pattern
          <select value={only} onChange={(e) => setParams(e.target.value ? { pattern: e.target.value } : {})}>
            <option value="">All patterns</option>
            {PATTERNS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        {only && <button type="button" className="btn link" onClick={() => setParams({})}>Show all</button>}
      </div>
      {!list ? <p className="muted-text">Loading…</p> : (["creational", "structural", "behavioral"] as const).map((c) => {
        const items = list.filter((k) => shown.some((p) => p.slug === k.slug && p.category === c))
          .sort((a, b) => PATTERNS.findIndex((p) => p.slug === a.slug) - PATTERNS.findIndex((p) => p.slug === b.slug) || a.difficulty - b.difficulty);
        if (!items.length) return null;
        return (
          <section key={c} style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby={`k-${c}`}>
            <h2 id={`k-${c}`} style={{ margin: 0, fontSize: 20 }}><span className={`chip ${c}`}>{CATEGORY_INFO[c].label}</span></h2>
            <div className="grid">
              {items.map((k) => (
                <article key={k.id} className={`card extra-card pattern-card ${c}`}>
                  <span className="meta small-text">
                    <span>{PATTERNS.find((p) => p.slug === k.slug)?.name}</span>
                    <span aria-label={`Difficulty ${k.difficulty} of 3`}>{stars(k.difficulty)}</span>
                    {best[k.id] !== undefined && <span className={best[k.id] >= 80 ? "kata-done" : ""}>Best {best[k.id]}/100{best[k.id] >= 80 ? " ✓" : ""}</span>}
                  </span>
                  <h3 className="name" style={{ margin: 0 }}>{k.title}</h3>
                  <span className="muted-text small-text">{k.domain}</span>
                  <p className="small-text" style={{ margin: 0 }}>{k.task}</p>
                  <Link className="btn primary" to={`/scratch-pad/kata/${k.id}`} style={{ alignSelf: "flex-start" }}>Start kata</Link>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
