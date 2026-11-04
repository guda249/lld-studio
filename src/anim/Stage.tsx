import { useLayoutEffect, useRef, useState } from "react";
import type { Lang } from "../content/types";
import type { Action, DiagramSpec } from "./types";
import Diagram, { useGeometry, type Geometry } from "./Diagram";
import { StageEngine } from "./compile";
import { useWidth } from "../lib/motion";

/** Below this scale the landscape diagram's text would get too small, so phones get the portrait layout. */
const MIN_SCALE = 0.72;

interface Props {
  spec: DiagramSpec;
  actionLists: Action[][];
  lang: Lang;
  /** Called with a fresh engine whenever the diagram is (re)drawn: first render, language or orientation change. */
  onEngine: (engine: StageEngine | null, geom: Geometry) => void;
  className?: string;
  labelledBy?: string;
}

/** Draws a diagram, picks landscape or portrait for the available width, and hands an animation engine back. */
export default function Stage({ spec, actionLists, lang, onEngine, className, labelledBy }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const width = useWidth(box);
  const hasPortrait = !!spec.portraitWidth && spec.nodes.every((n) => n.portrait);
  const portrait = hasPortrait && width > 0 && width / spec.width < MIN_SCALE;
  const geom = useGeometry(spec, actionLists, portrait);
  const [version, setVersion] = useState(0);
  const cb = useRef(onEngine);
  cb.current = onEngine;

  useLayoutEffect(() => {
    if (!svg.current) return;
    const engine = new StageEngine(svg.current, spec, geom, lang);
    cb.current(engine, geom);
    setVersion((v) => v + 1);
    return () => cb.current(null, geom);
  }, [spec, geom, lang]);

  return (
    <div
      ref={box}
      className={`stage${geom.portrait ? " portrait" : ""}${className ? " " + className : ""}`}
      data-version={version}
      style={!geom.portrait && !hasPortrait ? { overflowX: "auto" } : undefined}
    >
      <Diagram
        ref={svg}
        spec={spec}
        geom={geom}
        lang={lang}
        actionLists={actionLists}
        labelledBy={labelledBy}
        style={!hasPortrait ? { minWidth: Math.round(spec.width * MIN_SCALE) } : undefined}
      />
    </div>
  );
}
