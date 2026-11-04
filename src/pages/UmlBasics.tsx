import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RELATIONSHIPS, SPOT_QUESTIONS, relActions, relDiagram, type Relationship } from "../content/uml/relationships";
import Stage from "../anim/Stage";
import type { StageEngine } from "../anim/compile";
import { NextIcon, PrevIcon, SpeedSelect, VoiceToggle, useSpeed } from "../anim/controls";
import CodePanel, { CodeLines, useCodeLang } from "../components/CodePanel";
import { speech, useSpeech, forListening } from "../lib/speech";
import { useReducedMotion } from "../lib/motion";
import { markGuideSeen, markUmlSeen } from "../lib/progress";
import { Link } from "react-router-dom";
import { LessonPrevNext, UmlLessonList } from "./guides/lessonNav";


/** Small arrow icon for a relationship (dashed lines drawn from the symbol end). */
function RelIcon({ r, w = 48 }: { r: Relationship; w?: number }) {
  const dashed = r.type === "dependency" || r.type === "realization";
  const diamond = r.type === "aggregation" || r.type === "composition";
  const tri = r.type === "inheritance" || r.type === "realization";
  const x1 = diamond ? 14 : 2, x2 = tri ? w - 12 : w - 2;
  return (
    <svg width={w} height={16} viewBox={`0 0 ${w} 16`} aria-hidden="true">
      <line x1={x2} y1={8} x2={x1} y2={8} stroke="currentColor" strokeWidth={2} strokeDasharray={dashed ? "5 4" : undefined} />
      {!tri && !diamond && <polyline points={`${w - 10},3 ${w - 2},8 ${w - 10},13`} fill="none" stroke="currentColor" strokeWidth={2} />}
      {tri && <polygon points={`${w - 12},2 ${w - 1},8 ${w - 12},14`} fill="var(--surface)" stroke="currentColor" strokeWidth={2} />}
      {diamond && <polygon points="1,8 7.5,3 14,8 7.5,13" fill={r.type === "composition" ? "currentColor" : "var(--surface)"} stroke="currentColor" strokeWidth={2} />}
    </svg>
  );
}

export default function UmlBasics() {
  const [lang] = useCodeLang();
  const [speed] = useSpeed();
  const voice = useSpeech();
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(() => new Set([RELATIONSHIPS[0].id]));
  const [autoplay, setAutoplay] = useState(false);
  const engine = useRef<StageEngine | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const playToken = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panel = useRef<HTMLElement>(null);
  const r = RELATIONSHIPS[current];
  const spec = useMemo(() => relDiagram(r), [r]);
  const actions = useMemo(() => relActions(r), [r]);
  const lists = useMemo(() => [actions], [actions]);

  const playScene = useCallback((): Promise<void> => {
    const e = engine.current;
    if (!e) return Promise.resolve();
    tl.current?.kill();
    e.reset();
    const t = e.compile(actions);
    t.pause();
    tl.current = t;
    t.timeScale(speedRef.current);
    return new Promise((resolve) => {
      if (reduce) { t.progress(1); resolve(); return; }
      t.eventCallback("onComplete", () => resolve());
      t.play();
    });
  }, [actions, reduce]);

  const speakRel = useCallback((rel: Relationship) => speech.speak([
    { text: `${rel.name}. ${rel.notation}.` },
    { id: "what", text: forListening(rel.what) },
    { id: "spot", text: "How to spot it. " + forListening(rel.spot) },
    { id: "why", text: "When to use it. " + forListening(rel.why) }
  ], speedRef.current), []);

  // a new relationship (or a redraw for language / orientation) plays its scene
  const pending = useRef<((v: void) => void) | null>(null);
  const onEngine = useCallback((e: StageEngine | null) => {
    engine.current = e;
    if (!e) return;
    playScene().then(() => { pending.current?.(); pending.current = null; });
  }, [playScene]);

  function show(i: number, focus = false) {
    const n = (i + RELATIONSHIPS.length) % RELATIONSHIPS.length;
    setSeen((s) => new Set(s).add(RELATIONSHIPS[n].id));
    void markUmlSeen(RELATIONSHIPS[n].id);
    if (n === current) { playScene(); speakRel(RELATIONSHIPS[n]); }
    else setCurrent(n);
    if (focus) window.setTimeout(() => tabs.current[n]?.focus(), 0);
  }
  useEffect(() => { if (!autoplay) speakRel(RELATIONSHIPS[current]); }, [current]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { tl.current?.timeScale(speed); }, [speed]);
  useEffect(() => () => { playToken.current++; tl.current?.kill(); speech.stop(); }, []);
  useEffect(() => { void markUmlSeen(RELATIONSHIPS[0].id); void markGuideSeen("uml/relationships"); }, []);

  function stopAll() { playToken.current++; setAutoplay(false); speech.stop(); }
  function go(i: number, focus = false) { stopAll(); show(i, focus); }

  async function playAll() {
    const token = ++playToken.current;
    setAutoplay(true);
    for (let i = current; i < RELATIONSHIPS.length; i++) {
      if (token !== playToken.current) return;
      const rel = RELATIONSHIPS[i];
      setSeen((s) => new Set(s).add(rel.id));
      void markUmlSeen(rel.id);
      const scene = i === current
        ? playScene()
        : new Promise<void>((res) => { pending.current = res; setCurrent(i); });
      await Promise.all([scene, speakRel(rel)]);
      if (token !== playToken.current) return;
      await new Promise((res) => window.setTimeout(res, speech.state.on ? 700 : 2200 / speedRef.current));
    }
    if (token === playToken.current) setAutoplay(false);
  }

  return (
    <div className="page uml-page">
      <div className="pattern-head">
        <span className="crumb"><Link to="/uml">UML Basics</Link> · Lesson 3 of 9</span>
        <h1>The six relationships</h1>
        <p className="lede">Every line between two class boxes answers one question: how strongly are these classes tied? Pick a relationship to see it drawn, what it means in practice, and the same idea in Python and Scala.</p>
      </div>
      <UmlLessonList current="relationships" />

      <div className="uml-lesson">
        <nav className="card rel-list" role="tablist" aria-label="Relationships" aria-orientation="vertical"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); go(current + 1, true); }
            else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); go(current - 1, true); }
          }}>
          {RELATIONSHIPS.map((rel, i) => (
            <button key={rel.id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" className="rel-tab"
              aria-selected={i === current} tabIndex={i === current ? 0 : -1} aria-controls="rel-panel" id={`rel-tab-${i}`}
              onClick={() => go(i)}>
              <RelIcon r={rel} />
              <span>
                <span className="nm">{rel.name}{seen.has(rel.id) && <span className="done" aria-label="seen"> ✓</span>}</span>
                <span className="sh">{rel.short}</span>
              </span>
            </button>
          ))}
        </nav>

        <section className="card rel-main" id="rel-panel" role="tabpanel" aria-labelledby={`rel-tab-${current}`} ref={panel} tabIndex={-1}>
          <div className="rel-head">
            <h2>{r.name}: {r.short}</h2>
            <span className="notation"><RelIcon r={r} /> {r.notation}</span>
          </div>
          <Stage key={r.id} spec={spec} actionLists={lists} lang={lang} onEngine={onEngine} />
          <div className="scale" aria-label="How strong the tie is">
            <div>
              <h3>How tightly the classes are tied</h3>
              <div className="seg-row">
                {RELATIONSHIPS.slice(0, 4).map((x) => <span key={x.id} className={"seg-cell" + (x.id === r.id ? " on" : "")}>{x.name}</span>)}
              </div>
              <div className="seg-ends"><span>loose</span><span>tight</span></div>
            </div>
            <div>
              <h3>"Is a kind of" relationships</h3>
              <div className="seg-row">
                {RELATIONSHIPS.slice(4).map((x) => <span key={x.id} className={"seg-cell" + (x.id === r.id ? " on" : "")}>{x.name}</span>)}
              </div>
            </div>
          </div>
          <div className="controls">
            <div className="ctl-main">
              <button className="btn" type="button" aria-label="Previous relationship" disabled={current === 0} onClick={() => go(current - 1)}><PrevIcon /></button>
              <button className="btn primary play" type="button" onClick={() => (autoplay ? stopAll() : playAll())}>{autoplay ? "Pause" : "Play all six"}</button>
              <button className="btn" type="button" aria-label="Next relationship" disabled={current === RELATIONSHIPS.length - 1} onClick={() => go(current + 1)}><NextIcon /></button>
            </div>
            <div className="ctl-more">
              <button className="btn" type="button" onClick={() => go(current)}>Replay</button>
              <SpeedSelect />
              <VoiceToggle onTurnOn={() => speakRel(r)} />
            </div>
          </div>
          <div className="story-below">
            <div className="rel-narration" aria-live="polite">
              <div className={"box what" + (voice.speakingId === "what" ? " speaking" : "")}><h3>What it means</h3><p>{r.what}</p></div>
              <div className={"box spot" + (voice.speakingId === "spot" ? " speaking" : "")}><h3>How to spot it in code</h3><p>{r.spot}</p></div>
              <div className={"box why" + (voice.speakingId === "why" ? " speaking" : "")}><h3>When to use it</h3><p>{r.why}</p></div>
            </div>
            <CodePanel code={r.code} hl={r.hl} note="Runs as-is. Highlighted lines create the relationship." label={`${r.name} code example`} maxHeight={420} />
          </div>
        </section>
      </div>

      <Practice onReview={(id) => {
        go(RELATIONSHIPS.findIndex((x) => x.id === id));
        panel.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }} />
      <LessonPrevNext id="relationships" />
    </div>
  );
}

function Practice({ onReview }: { onReview: (id: Relationship["id"]) => void }) {
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<Relationship["id"] | null>(null);
  const [finished, setFinished] = useState(false);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const q = SPOT_QUESTIONS[qi];
  const right = RELATIONSHIPS.find((x) => x.id === q.answer)!;
  const ok = picked === q.answer;

  return (
    <section className="card practice" aria-labelledby="practice-title">
      <div className="q-top">
        <h2 id="practice-title">Spot the relationship</h2>
        <span className="muted-text">Score: {score} / {SPOT_QUESTIONS.length}</span>
      </div>
      <p className="muted-text" style={{ margin: 0 }}>Read the code and pick the line you would draw between the two classes.</p>
      {finished ? (
        <>
          <p className="q-prompt">You scored {score} out of {SPOT_QUESTIONS.length}.{score === SPOT_QUESTIONS.length ? " All six spotted." : " Review the ones you missed above, then try again."}</p>
          <div className="actions"><button className="btn primary" type="button" onClick={() => { setQi(0); setScore(0); setPicked(null); setFinished(false); }}>Try again</button></div>
        </>
      ) : (
        <>
          <span className="q-count">Question {qi + 1} of {SPOT_QUESTIONS.length} · {q.lang === "python" ? "Python" : "Scala 3"}</span>
          <p className="q-prompt">{q.prompt}</p>
          <pre className="code q-code" tabIndex={0} aria-label="Code to classify"><CodeLines text={q.code} lang={q.lang} /></pre>
          <div className="answers" role="group" aria-label="Answers">
            {RELATIONSHIPS.map((rel) => {
              const cls = ["ans"];
              if (picked && rel.id === q.answer) cls.push("right");
              else if (picked === rel.id) cls.push("wrong");
              return (
                <button key={rel.id} type="button" className={cls.join(" ")} disabled={!!picked} onClick={() => {
                  setPicked(rel.id);
                  if (rel.id === q.answer) setScore((s) => s + 1);
                  window.setTimeout(() => nextBtn.current?.focus(), 0);
                }}>
                  <RelIcon r={rel} w={44} /><span>{rel.name}</span>
                </button>
              );
            })}
          </div>
          {picked && (
            <div className={"feedback " + (ok ? "ok" : "bad")} aria-live="polite">
              <span className="verdict">{ok ? "Correct." : `Not quite. It's ${right.name.toLowerCase()}.`}</span>
              <span>{q.why}</span>
            </div>
          )}
          {picked && (
            <div className="actions">
              {!ok && <button className="btn" type="button" onClick={() => onReview(q.answer)}>See this relationship again</button>}
              <button className="btn primary" type="button" ref={nextBtn} onClick={() => {
                if (qi < SPOT_QUESTIONS.length - 1) { setQi(qi + 1); setPicked(null); } else setFinished(true);
              }}>{qi === SPOT_QUESTIONS.length - 1 ? "See your result" : "Next question"}</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
