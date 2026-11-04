import { useMemo, useRef } from "react";
import type { Lang } from "../content/types";
import type { Action, DiagramSpec, Story } from "./types";
import Diagram, { buildGeometry } from "./Diagram";
import { useWidth } from "../lib/motion";

/** Ids that are not visible once the story has finished (so the UML tab shows the final design only). */
export function hiddenAtEnd(story: Story): Set<string> {
  const vis = new Map<string, boolean>();
  for (const n of story.diagram.nodes) vis.set(n.id, !n.hidden);
  for (const e of story.diagram.edges) vis.set(e.id, !e.hidden);
  for (const b of story.diagram.badges ?? []) vis.set(b.id, b.hidden === false);
  const apply = (a: Action) => {
    if ("show" in a) a.show.forEach((id) => vis.set(id, true));
    if ("spawn" in a) a.spawn.forEach((id) => vis.set(id, true));
    if ("hide" in a) a.hide.forEach((id) => vis.set(id, false));
  };
  story.steps.forEach((s) => s.actions.forEach(apply));
  const out = new Set<string>();
  for (const [id, v] of vis) if (!v) out.add(id);
  // badges are story-only decoration
  for (const b of story.diagram.badges ?? []) out.add(b.id);
  return out;
}

/** The members a node shows at the end of the story (last `members` action wins). */
function finalSpec(story: Story): DiagramSpec {
  const last = new Map<string, { lines: string[]; scala?: string[] }>();
  story.steps.forEach((s) => s.actions.forEach((a) => {
    if ("members" in a) last.set(a.members, { lines: a.lines, scala: a.scalaLines });
  }));
  return {
    ...story.diagram,
    nodes: story.diagram.nodes.map((n) => {
      const m = last.get(n.id);
      return m ? { ...n, members: m.lines, scalaMembers: m.scala } : n;
    })
  };
}

/** A diagram drawn without animation: the UML class view of a pattern, or a quiz option. */
export function StaticDiagram({ spec, lang, omit, allowPortrait = true }: { spec: DiagramSpec; lang: Lang; omit?: Set<string>; allowPortrait?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const hasPortrait = allowPortrait && !!spec.portraitWidth && spec.nodes.every((n) => n.portrait);
  const portrait = hasPortrait && width > 0 && width / spec.width < 0.72;
  const geom = useMemo(() => buildGeometry(spec, [], portrait), [spec, portrait]);
  return (
    <div ref={box} className={`stage static${geom.portrait ? " portrait" : ""}`} style={!hasPortrait ? { overflowX: "auto" } : undefined}>
      <Diagram spec={spec} geom={geom} lang={lang} actionLists={[]} staticView omit={omit}
        style={!hasPortrait && allowPortrait ? { minWidth: Math.round(spec.width * 0.9) } : undefined} />
    </div>
  );
}

/** Final class diagram of a story. */
export function ClassDiagram({ story, lang }: { story: Story; lang: Lang }) {
  const spec = useMemo(() => finalSpec(story), [story]);
  const omit = useMemo(() => hiddenAtEnd(story), [story]);
  return <StaticDiagram spec={spec} lang={lang} omit={omit} />;
}
