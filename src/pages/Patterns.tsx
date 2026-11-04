import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ALL_PATTERNS, CATEGORY_INFO, LENSES, stars, type Category, type PatternInfo } from "../content/patterns";

function Card({ p }: { p: PatternInfo }) {
  return (
    <Link to={`/patterns/${p.slug}`} className={`card pattern-card ${p.category}`}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span className="name">{p.name}</span>
        {p.ready && <span className="ready">Lesson ready</span>}
      </span>
      <span style={{ fontSize: 14, color: "var(--muted)" }}>{p.intent}</span>
      <span className="meta"><span aria-label={`Difficulty ${p.difficulty} of 3`}>{stars(p.difficulty)}</span><span>Used: {p.usedInPractice}</span></span>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>Confused with: {p.confusedWith.join(", ")}</span>
    </Link>
  );
}

export default function Patterns() {
  const [group, setGroup] = useState<"gof" | "lens">("gof");
  const [difficulty, setDifficulty] = useState<0 | 1 | 2 | 3>(0);
  const list = useMemo(() => ALL_PATTERNS.filter((p) => !difficulty || p.difficulty === difficulty), [difficulty]);

  return (
    <div className="page">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1>Design pattern catalog</h1>
        <p className="lede">22 classic patterns plus 4 concurrency patterns. Group them by intent, or start from the problem you have. Not sure which of two patterns fits? <Link to="/compare">Compare look-alikes</Link>.</p>
      </div>
      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", padding: 14 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Group by</span>
        <div className="seg" role="group" aria-label="Group by">
          <button type="button" aria-pressed={group === "gof"} onClick={() => setGroup("gof")}>GoF category</button>
          <button type="button" aria-pressed={group === "lens"} onClick={() => setGroup("lens")}>Problem lens</button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14 }}>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value) as 0 | 1 | 2 | 3)} style={{ height: 44, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", padding: "0 10px" }}>
            <option value={0}>Any</option><option value={1}>★ Easy</option><option value={2}>★★ Medium</option><option value={3}>★★★ Hard</option>
          </select>
        </label>
      </div>

      {group === "gof"
        ? (Object.keys(CATEGORY_INFO) as Category[]).map((c) => {
            const items = list.filter((p) => p.category === c);
            if (!items.length) return null;
            return (
              <section key={c} id={c} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20, display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={`chip ${c}`}>{CATEGORY_INFO[c].label}</span>{CATEGORY_INFO[c].question}
                </h2>
                <div className="grid">{items.map((p) => <Card key={p.slug} p={p} />)}</div>
              </section>
            );
          })
        : LENSES.map((lens) => {
            const items = list.filter((p) => p.lenses.includes(lens));
            if (!items.length) return null;
            return (
              <section key={lens} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{lens}</h2>
                <div className="grid">{items.map((p) => <Card key={p.slug} p={p} />)}</div>
              </section>
            );
          })}
    </div>
  );
}
