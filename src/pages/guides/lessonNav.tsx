import { Link } from "react-router-dom";
import { UML_LESSONS } from "../../content/guides/load";

/** The lesson list shown on every UML Basics lesson. */
export function UmlLessonList({ current }: { current: string }) {
  return (
    <details className="card lessons-list">
      <summary>All UML Basics lessons</summary>
      <ol>
        {UML_LESSONS.map((l) => (
          <li key={l.id} className={l.id === current ? "now" : undefined}>
            {l.id === current ? <>{l.title} (you are here)</> : <Link to={`/uml/${l.id}`}>{l.title}</Link>}
          </li>
        ))}
      </ol>
      <p className="small-text" style={{ margin: "8px 0 0" }}><Link to="/uml/notation">Notation lab: every symbol, clickable</Link></p>
    </details>
  );
}

export function LessonPrevNext({ id }: { id: string }) {
  const i = UML_LESSONS.findIndex((l) => l.id === id);
  const prev = UML_LESSONS[i - 1], next = UML_LESSONS[i + 1];
  return (
    <nav className="lesson-nav" aria-label="Previous and next lesson">
      {prev ? <Link className="btn" to={`/uml/${prev.id}`}>← {prev.title}</Link> : <Link className="btn" to="/uml">← UML Basics</Link>}
      {next ? <Link className="btn primary" to={`/uml/${next.id}`}>{next.title} →</Link> : <Link className="btn primary" to="/solid">Next: OOP & SOLID →</Link>}
    </nav>
  );
}

