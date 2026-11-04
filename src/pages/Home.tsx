import { Link } from "react-router-dom";
import { ALL_PATTERNS, CATEGORY_INFO, type Category } from "../content/patterns";

const PATH = [
  { n: "01", title: "UML Basics", text: "Nine short lessons: class boxes, the six relationships, multiplicity, sequence, state, activity and use-case diagrams.", to: "/uml" },
  { n: "02", title: "OOP & SOLID", text: "The object-oriented basics and the five principles every pattern is built on.", to: "/solid" },
  { n: "03", title: "Design Patterns", text: "22 patterns plus 4 concurrency patterns, with animations, UML and Python / Scala code.", to: "/patterns" },
  { n: "04", title: "Compare look-alikes", text: "Strategy vs State, Decorator vs Proxy vs Adapter, and more: same example, side by side.", to: "/compare" },
  { n: "05", title: "Anti-patterns", text: "God objects, Singleton abuse, patterns where they don't belong, and what to do instead.", to: "/anti-patterns" },
  { n: "06", title: "LLD case studies", text: "Parking Lot, Elevator, Vending Machine, Splitwise and more.", to: "/case-studies" },
  { n: "07", title: "Refactoring katas", text: "Smelly code to refactor into a pattern, checked by the review.", to: "/katas" }
];

export default function Home() {
  const count = (c: Category) => ALL_PATTERNS.filter((p) => p.category === c).length;
  return (
    <div className="page">
      <section className="card" style={{ background: "var(--ink)", color: "var(--bg)", padding: 32, display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.8 }}>Start here</span>
        <h1 style={{ color: "var(--bg)" }}>Learn why designs look the way they do</h1>
        <p style={{ margin: 0, fontSize: 17, maxWidth: "62ch", opacity: 0.85 }}>
          Watch each pattern grow out of a real problem, read it in Python and Scala, then practise and get plain-English feedback.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link className="btn primary" to="/patterns/strategy" style={{ background: "var(--bg)", color: "var(--ink)", borderColor: "var(--bg)" }}>Try the Strategy lesson</Link>
          <Link className="btn" to="/uml" style={{ background: "transparent", color: "var(--bg)", borderColor: "var(--muted)" }}>UML Basics</Link>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Your learning path</h2>
        <ol className="grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {PATH.map((s) => (
            <li key={s.n} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)" }}>{s.n}</span>
              <Link to={s.to} style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", textDecoration: "none" }}>{s.title}</Link>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Browse patterns</h2>
        <div className="grid">
          {(Object.keys(CATEGORY_INFO) as Category[]).map((c) => (
            <Link key={c} to="/patterns" className="card" style={{ textDecoration: "none", color: "var(--ink)", display: "flex", flexDirection: "column", gap: 8 }}>
              <span className={`chip ${c}`} style={{ alignSelf: "flex-start" }}>{CATEGORY_INFO[c].label} · {count(c)}</span>
              <span style={{ fontSize: 15, color: "var(--muted)" }}>{CATEGORY_INFO[c].question}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
