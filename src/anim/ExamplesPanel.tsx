import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PatternLesson, RealWorldExample } from "../content/types";
import type { Action, ExampleAnimation, TryIt } from "./types";
import type { StageEngine } from "./compile";
import Stage from "./Stage";
import { useSpeed, VoiceToggle } from "./controls";
import CodePanel, { useCodeLang } from "../components/CodePanel";
import { speech, forListening } from "../lib/speech";
import { useReducedMotion } from "../lib/motion";
import { CUSTOM_INITIAL_RING, CUSTOM_WIDGETS } from "./customWidgets";

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

interface Props {
  lesson: PatternLesson;
  anims: Record<string, ExampleAnimation>;
  patternName: string;
  active: boolean;
}

/** Real-world examples tab: picker, animated mini diagram, narrated walkthrough, Try it, and runnable code. */
export default function ExamplesPanel({ lesson, anims, patternName, active }: Props) {
  const [index, setIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const ex = lesson.examples[index];
  const select = (i: number, focus = true) => {
    const n = (i + lesson.examples.length) % lesson.examples.length;
    setIndex(n);
    if (focus) window.setTimeout(() => tabs.current[n]?.focus(), 0);
  };
  return (
    <div className="examples">
      <p className="ex-intro">Four places the {patternName} pattern shows up in real products. Pick one, watch it or try it, then read the code.</p>
      <div className="ex-picker" role="tablist" aria-label="Examples"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); select(index + 1); }
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); select(index - 1); }
        }}>
        {lesson.examples.map((e, i) => (
          <button key={e.id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" className="ex-card"
            id={`ex-tab-${lesson.slug}-${i}`} aria-selected={i === index} tabIndex={i === index ? 0 : -1}
            aria-controls={`ex-body-${lesson.slug}`} onClick={() => select(i, false)}>
            <span className="dom">{e.domain}</span>
            <span className="ttl">{e.title}</span>
          </button>
        ))}
      </div>
      <ExampleView key={ex.id} ex={ex} anim={anims[ex.id]} patternName={patternName} slug={lesson.slug} index={index} active={active} />
    </div>
  );
}

function ExampleView({ ex, anim, patternName, slug, index, active }: {
  ex: RealWorldExample; anim?: ExampleAnimation; patternName: string; slug: string; index: number; active: boolean;
}) {
  const [lang] = useCodeLang();
  const [speed] = useSpeed();
  const reduce = useReducedMotion();
  const engine = useRef<StageEngine | null>(null);
  const miniTl = useRef<gsap.core.Timeline | null>(null);
  const walkToken = useRef(0);
  const [walking, setWalking] = useState(false);
  const [caption, setCaption] = useState<{ text: string; n?: number; total?: number }>({ text: "" });
  const generic = anim && "groups" in anim.tryIt ? (anim.tryIt as TryIt) : null;
  const customId = anim && "custom" in anim.tryIt ? anim.tryIt.custom : null;
  const Custom = customId ? CUSTOM_WIDGETS[customId] : null;
  const firstKey = generic ? generic.groups.map((g) => g.options[0].id).join("|") : "";
  const [selKey, setSelKey] = useState(firstKey);
  const [resetSignal, setResetSignal] = useState(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const actionLists = useMemo(() => {
    if (!anim) return [];
    const lists = [...anim.walk];
    if (generic) lists.push(...Object.values(generic.results).map((r) => r.actions));
    return lists;
  }, [anim, generic]);

  const playMini = useCallback((t: gsap.core.Timeline): Promise<void> => {
    if (miniTl.current && miniTl.current !== t) { miniTl.current.progress(1); miniTl.current.kill(); }
    miniTl.current = t;
    t.timeScale(speedRef.current);
    return new Promise((resolve) => {
      if (reduce) { t.progress(1); resolve(); return; }
      t.eventCallback("onComplete", () => resolve());
      t.play();
    });
  }, [reduce]);

  /** Everything visible, with the ring on the currently selected option (state before / after a walkthrough). */
  const showAll = useCallback((key: string) => {
    const e = engine.current;
    if (!e) return;
    if (miniTl.current) { miniTl.current.progress(1); miniTl.current.kill(); miniTl.current = null; }
    e.reset(true);
    const res = generic?.results[key];
    const rings: Action[] = res ? res.actions.filter((a) => "ring" in a) : customId && CUSTOM_INITIAL_RING[customId] ? [{ ring: CUSTOM_INITIAL_RING[customId] }] : [];
    if (rings.length) e.compile(rings).progress(1);
  }, [generic, customId]);

  const cancelWalk = useCallback(() => {
    walkToken.current++;
    setWalking(false);
    speech.stop();
    showAll(selKey);
  }, [showAll, selKey]);

  const onEngine = useCallback((e: StageEngine | null) => {
    engine.current = e;
    if (e) showAll(selKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCaption({ text: `Pick an option in Try it to watch the call travel, or watch the walkthrough.` });
  }, []);
  useEffect(() => { if (!active) cancelWalk(); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { walkToken.current++; speech.stop(); miniTl.current?.kill(); }, []);

  async function runWalkthrough() {
    const e = engine.current;
    if (!e || !anim) return;
    const token = ++walkToken.current;
    setWalking(true);
    setResetSignal((n) => n + 1);
    if (generic) setSelKey(firstKey);
    if (miniTl.current) { miniTl.current.progress(1); miniTl.current.kill(); miniTl.current = null; }
    e.reset(false);
    for (let s = 0; s < ex.walkthrough.length; s++) {
      if (token !== walkToken.current) return;
      const text = ex.walkthrough[s];
      setCaption({ text, n: s + 1, total: ex.walkthrough.length });
      const t = e.compile(anim.walk[s] ?? []);
      t.pause();
      await Promise.all([playMini(t), speech.speak([{ text: forListening(text) }], speedRef.current)]);
      if (token !== walkToken.current) return;
      await sleep(speech.state.on ? 500 : 1400 / speedRef.current);
    }
    if (token === walkToken.current) {
      setWalking(false);
      setCaption({ text: "Done. Now try the options yourself in Try it below and watch each call travel." });
    }
  }

  /** Called by Try it (generic or custom) with the actions to play and a caption. */
  const play = useCallback((actions: Action[], text: string) => {
    if (walking) { walkToken.current++; setWalking(false); speech.stop(); }
    const e = engine.current;
    if (!e) return;
    if (miniTl.current) { miniTl.current.progress(1); miniTl.current.kill(); miniTl.current = null; }
    setCaption({ text });
    const t = e.compile(actions);
    t.pause();
    playMini(t);
  }, [walking, playMini]);

  return (
    <div className="ex-view" id={`ex-body-${slug}`} role="tabpanel" aria-labelledby={`ex-tab-${slug}-${index}`}>
      <section className="card ex-body">
        <h3 className="ex-title">{ex.title}</h3>
        <div><h4>The situation</h4><p>{ex.situation}</p></div>
        {anim ? (
          <>
            <Stage spec={anim.diagram} actionLists={actionLists} lang={lang} onEngine={onEngine} className="mini" />
            <div className="mini-bar">
              <div className="mini-cap" aria-live="polite">
                {caption.n && <span className="k">Step {caption.n} of {caption.total}</span>}
                {caption.text}
              </div>
              <button className="btn primary" type="button" onClick={() => (walking ? (cancelWalk(), setCaption({ text: "Walkthrough stopped." })) : runWalkthrough())}>
                {walking ? "Stop walkthrough" : "Watch walkthrough"}
              </button>
              <VoiceToggle picker={false} />
            </div>
            <div className="try">
              {generic && <GenericTryIt tryIt={generic} selKey={selKey} onPick={(key) => {
                setSelKey(key);
                const r = generic.results[key];
                if (r) play(r.actions, `Now the same call returns ${r.output}.`);
              }} />}
              {Custom && <Custom onPlay={play} resetSignal={resetSignal} />}
            </div>
          </>
        ) : (
          <ol className="ref-list">{ex.walkthrough.map((s) => <li key={s}>{s}</li>)}</ol>
        )}
      </section>
      <div className="ex-grid">
        <section className="card ex-body" aria-label="Why it fits">
          <div>
            <h4>Who plays which role</h4>
            <div className="tags">
              {ex.roles.map((r) => (
                <span key={r.role + r.name} className="tag">
                  <span className="tag-role">{r.role}</span> <code>{r.name}</code>
                </span>
              ))}
            </div>
          </div>
          <div><h4>Why {patternName} fits</h4><p>{ex.why}</p></div>
          <p className="watch"><strong>Good to know:</strong> {ex.goodToKnow}</p>
        </section>
        <CodePanel code={ex.code} note="Runs as-is. Numbers are illustrative." label={`Example code: ${ex.title}`} maxHeight={640} />
      </div>
    </div>
  );
}

function GenericTryIt({ tryIt, selKey, onPick }: { tryIt: TryIt; selKey: string; onPick: (key: string) => void }) {
  const parts = selKey.split("|");
  const result = tryIt.results[selKey];
  return (
    <>
      <h4>Try it</h4>
      <p className="try-prompt">{tryIt.prompt}</p>
      {tryIt.groups.map((g, gi) => (
        <div key={g.label} className="try-group">
          <span className="try-label">{g.label}</span>
          <div className="chips" role="group" aria-label={g.label}>
            {g.options.map((o) => (
              <button key={o.id} type="button" className="chip" aria-pressed={parts[gi] === o.id}
                onClick={() => { const next = parts.slice(); next[gi] = o.id; onPick(next.join("|")); }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {result && (
        <div className="result" aria-live="polite">
          <span className="big-num">{result.output}</span>
          {result.note && <span className="formula">{result.note}</span>}
        </div>
      )}
    </>
  );
}
