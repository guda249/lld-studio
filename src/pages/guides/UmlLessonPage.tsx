import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { UmlLesson } from "../../content/guides/types";
import { UML_LESSONS, loadUmlLesson } from "../../content/guides/load";
import CodePanel from "../../components/CodePanel";
import { StepControls, useSpeed } from "../../anim/controls";
import { speech, useSpeech, forListening } from "../../lib/speech";
import { useReducedMotion } from "../../lib/motion";
import { markGuideSeen } from "../../lib/progress";
import { ExtraQuiz } from "../extras/shared";
import NotFound from "../NotFound";
import { LessonPrevNext, UmlLessonList } from "./lessonNav";
import { DrawExercise, Rich, VisualView } from "./parts";

export default function UmlLessonPage() {
  const { id = "" } = useParams();
  const meta = UML_LESSONS.find((l) => l.id === id);
  const [lesson, setLesson] = useState<UmlLesson | null | undefined>(undefined);
  useEffect(() => {
    setLesson(undefined);
    void loadUmlLesson(id).then((l) => setLesson(l));
    void markGuideSeen(`uml/${id}`);
    window.scrollTo(0, 0);
    return () => speech.stop();
  }, [id]);
  if (!meta || lesson === null) return <NotFound />;
  return (
    <div className="page uml-page">
      <div className="pattern-head">
        <span className="crumb"><Link to="/uml">UML Basics</Link> · Lesson {meta.order} of {UML_LESSONS.length}</span>
        <h1>{meta.title}</h1>
        {lesson && <p className="lede"><Rich text={lesson.lede} /></p>}
      </div>
      <UmlLessonList current={id} />
      {!lesson ? <p className="muted-text">Loading the lesson…</p> : (
        <>
          {lesson.concepts.length > 0 && <Concepts lesson={lesson} />}
          {lesson.draw && <DrawExercise {...lesson.draw} />}
          <section className="card" aria-labelledby="practice-h" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 id="practice-h" style={{ margin: 0 }}>{lesson.practiceTitle}</h2>
            <ExtraQuiz deck={`uml-${lesson.id}`} title={`UML: ${meta.title}`} questions={lesson.practice}
              onReview={() => document.getElementById("concept-panel")?.scrollIntoView()} />
          </section>
        </>
      )}
      <LessonPrevNext id={id} />
    </div>
  );
}

function Concepts({ lesson }: { lesson: UmlLesson }) {
  const [ci, setCi] = useState(0);
  const [step, setStep] = useState(1);
  const [seen, setSeen] = useState<Set<string>>(() => new Set([lesson.concepts[0].id]));
  const [playing, setPlaying] = useState(false);
  const [speed] = useSpeed();
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const voice = useSpeech();
  const reduce = useReducedMotion();
  const token = useRef(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const c = lesson.concepts[ci];
  const total = c.scene.length;

  const hidden = useMemo(() => new Set(c.scene.slice(step).flatMap((s) => s.show)), [c, step]);
  const active = useMemo(() => new Set(c.scene[step - 1]?.show ?? []), [c, step]);

  const sayStep = useCallback((n: number) => speech.speak([{ id: "say", text: forListening(c.scene[n - 1].say) }], speedRef.current), [c]);
  const sayConcept = useCallback(() => speech.speak([
    { text: `${c.name}.` }, { id: "what", text: forListening(c.what) },
    { id: "spot", text: "How to spot it. " + forListening(c.spot) }, { id: "why", text: "When to use it. " + forListening(c.when) }
  ], speedRef.current), [c]);

  const stop = () => { token.current++; setPlaying(false); speech.stop(); };
  const pick = (i: number, focus = false) => {
    stop();
    const n = (i + lesson.concepts.length) % lesson.concepts.length;
    setCi(n); setStep(1);
    setSeen((s) => new Set(s).add(lesson.concepts[n].id));
    if (focus) window.setTimeout(() => tabs.current[n]?.focus(), 0);
  };
  const goStep = (n: number) => { stop(); setStep(Math.max(1, Math.min(total, n))); void sayStep(Math.max(1, Math.min(total, n))); };

  async function play() {
    if (playing) { stop(); return; }
    const my = ++token.current;
    setPlaying(true);
    for (let n = 1; n <= total; n++) {
      if (my !== token.current) return;
      setStep(n);
      await Promise.all([sayStep(n), new Promise((r) => window.setTimeout(r, reduce ? 600 : 2400 / speedRef.current))]);
    }
    if (my !== token.current) return;
    await sayConcept();
    if (my === token.current) setPlaying(false);
  }

  return (
    <div className="uml-lesson">
      <nav className="card rel-list" role="tablist" aria-label="Concepts" aria-orientation="vertical"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); pick(ci + 1, true); }
          else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); pick(ci - 1, true); }
        }}>
        {lesson.concepts.map((x, i) => (
          <button key={x.id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" className="rel-tab concept-tab"
            aria-selected={i === ci} tabIndex={i === ci ? 0 : -1} aria-controls="concept-panel" id={`concept-tab-${i}`} onClick={() => pick(i)}>
            {x.notation && <span className="notation-badge" aria-hidden="true">{x.notation}</span>}
            <span>
              <span className="nm">{x.name}{seen.has(x.id) && <span className="done" aria-label="seen"> ✓</span>}</span>
              <span className="sh">{x.short}</span>
            </span>
          </button>
        ))}
      </nav>

      <section className="card rel-main" id="concept-panel" role="tabpanel" aria-labelledby={`concept-tab-${ci}`} tabIndex={-1}>
        <div className="rel-head">
          <h2>{c.name}</h2>
          {c.notation && <span className="notation"><span className="glyph-text">{c.notation}</span></span>}
        </div>
        <VisualView key={c.id} visual={c.visual} hidden={hidden} active={active} name={`${lesson.id}-${c.id}`} />
        <p className={"scene-say" + (voice.speakingId === "say" ? " speaking" : "")} aria-live="polite">
          <span className="sr-only">Step {step} of {total}: </span><Rich text={c.scene[step - 1].say} />
        </p>
        <StepControls current={step} total={total} stepTitles={c.scene.map((s) => s.say.split(/[.:]/)[0])}
          onPrev={() => goStep(step - 1)} onNext={() => goStep(step + 1)} onJump={goStep} onReplay={() => goStep(step)}
          onPlay={play} playLabel={playing ? "Pause" : "Play the scene"} onVoiceOn={() => sayStep(step)}
          prevLabel="Previous step" nextLabel="Next step" />
        <div className="story-below">
          <div className="rel-narration">
            <div className={"box what" + (voice.speakingId === "what" ? " speaking" : "")}><h3>What it means</h3><p><Rich text={c.what} /></p></div>
            <div className={"box spot" + (voice.speakingId === "spot" ? " speaking" : "")}><h3>How to spot it in code</h3><p><Rich text={c.spot} /></p></div>
            <div className={"box why" + (voice.speakingId === "why" ? " speaking" : "")}><h3>When to use it</h3><p><Rich text={c.when} /></p></div>
          </div>
          <CodePanel code={c.code} hl={c.hl} note="Runs as-is." label={`${c.name} code example`} maxHeight={420} />
        </div>
        <div className="lesson-nav">
          <button type="button" className="btn" disabled={ci === 0} onClick={() => pick(ci - 1)}>← {lesson.concepts[ci - 1]?.name ?? "Previous"}</button>
          <button type="button" className="btn" disabled={ci === lesson.concepts.length - 1} onClick={() => pick(ci + 1)}>{lesson.concepts[ci + 1]?.name ?? "Next"} →</button>
        </div>
      </section>
    </div>
  );
}
