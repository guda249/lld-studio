import { useMemo, useRef } from "react";
import { useWidth } from "../../lib/motion";
import { Link } from "react-router-dom";
import type { Question } from "../../anim/types";
import { StaticDiagram } from "../../anim/StaticDiagram";
import Legend from "../../anim/Legend";
import CheckYourself from "../../components/CheckYourself";
import { useCodeLang } from "../../components/CodePanel";
import { ALL_PATTERNS } from "../../content/patterns";
import { sketchToUml } from "../../content/extras/load";
import type { UmlSketch } from "../../content/extras/types";
import { umlToDiagram } from "../../review/uml";
import "../../styles/extras.css";

/** A class diagram drawn from a compact sketch (landscape, or the portrait layout on phones). */
export function UmlView({ sketch, legend = true }: { sketch: UmlSketch; legend?: boolean }) {
  const [lang] = useCodeLang();
  const spec = useMemo(() => umlToDiagram(sketchToUml(sketch)), [sketch]);
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const scrolls = !spec.portraitWidth && width > 0 && width < spec.width * 0.9;
  return (
    <div className="uml-view" ref={box}>
      {scrolls && <p className="small-text muted-text swipe-hint">Swipe sideways to see the whole diagram. The table of core classes above lists every class.</p>}
      <StaticDiagram spec={spec} lang={lang} />
      {legend && <Legend compact />}
    </div>
  );
}

export const patternName = (slug: string) => ALL_PATTERNS.find((p) => p.slug === slug)?.name ?? slug;
export const PatternLink = ({ slug }: { slug: string }) => <Link to={`/patterns/${slug}`}>{patternName(slug)}</Link>;

/** Expandable question → answer list (clarifying questions, interview follow-ups). */
export function QAList({ items, open = false }: { items: { q: string; a: string }[]; open?: boolean }) {
  return (
    <div className="qa-list">
      {items.map((x) => (
        <details key={x.q} open={open}>
          <summary>{x.q}</summary>
          <p>{x.a}</p>
        </details>
      ))}
    </div>
  );
}

/** The usual quiz + flashcards block; missed questions become cards in a deck named after the page. */
export function ExtraQuiz({ deck, title, questions, onReview }: { deck: string; title: string; questions: Question[]; onReview: () => void }) {
  const quiz = useMemo(() => ({ slug: deck, questions, cards: [] }), [deck, questions]);
  return <CheckYourself quiz={quiz} patternName={title} onReview={onReview} deckTitle={title} />;
}

/** Hash routes use the URL hash, so in-page links scroll by id. */
export function jump(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} tabIndex={-1} className="psec" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav className="toc" aria-label="On this page">
      <span className="toc-title">On this page</span>
      {items.map((s) => <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); jump(s.id); }}>{s.label}</a>)}
    </nav>
  );
}

export const stars = (d: number) => "★".repeat(d) + "☆".repeat(3 - d);
