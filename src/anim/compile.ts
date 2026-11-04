import { gsap } from "gsap";
import type { Lang } from "../content/types";
import type { Action, DiagramSpec } from "./types";
import type { Geometry } from "./Diagram";
import { center, headerHeight, textWidth, type Pt } from "./geometry";

const SVGNS = "http://www.w3.org/2000/svg";

type Vis = "hidden" | "shown" | "dimmed";

/**
 * Turns actions into GSAP timelines on one rendered diagram. It keeps track of what is visible as it compiles,
 * so a long story can be compiled into one master timeline that seeks correctly in both directions.
 */
export class StageEngine {
  private vis = new Map<string, Vis>();
  private mset = new Map<string, number>();
  private tagShown = new Map<string, number | null>();
  private ringAt: string | null = null;
  private ringCap: number | null = null;
  private markAt = new Map<string, number | null>();

  constructor(
    private root: SVGSVGElement,
    private spec: DiagramSpec,
    private geom: Geometry,
    private lang: Lang
  ) {}

  el(id: string): SVGGElement | null {
    return this.root.querySelector(`[data-el="${CSS.escape(id)}"]`);
  }
  private nodeEl(id: string): SVGGElement | null {
    return this.root.querySelector(`[data-node="${CSS.escape(id)}"]`);
  }
  private get ring(): SVGRectElement { return this.root.querySelector("[data-ring]") as SVGRectElement; }
  private caption(i: number): SVGTextElement | null { return this.root.querySelector(`[data-ringcap="${i}"]`); }

  private isNode(id: string) { return this.spec.nodes.some((n) => n.id === id); }
  private isEdge(id: string) { return this.spec.edges.some((e) => e.id === id); }

  /** Initial state. `revealAll` shows every node and edge (examples before a walkthrough starts). */
  reset(revealAll = false): void {
    this.root.querySelectorAll('[data-layer="pills"] > *').forEach((p) => p.remove());
    const all = this.root.querySelectorAll("[data-el], [data-mset], [data-tag], [data-flash], [data-mark], [data-ring], [data-ringcap], [data-line], [data-deco], [data-label]");
    gsap.killTweensOf(all);
    gsap.set(all, { clearProps: "transform,opacity" });
    this.vis.clear(); this.mset.clear(); this.tagShown.clear(); this.markAt.clear();
    this.ringAt = null; this.ringCap = null;
    for (const n of this.spec.nodes) {
      const el = this.el(n.id);
      const v: Vis = n.hidden && !revealAll ? "hidden" : "shown";
      this.vis.set(n.id, v);
      if (el) gsap.set(el, { opacity: v === "hidden" ? 0 : 1, x: 0, y: 0, scale: 1 });
      this.mset.set(n.id, 0);
      this.root.querySelectorAll(`[data-node="${CSS.escape(n.id)}"] [data-mset]`).forEach((g, i) => gsap.set(g, { opacity: i === 0 ? 1 : 0 }));
      this.root.querySelectorAll(`[data-node="${CSS.escape(n.id)}"] [data-tag]`).forEach((g) => gsap.set(g, { opacity: 0 }));
      const x = this.el(n.id + "__x");
      if (x) gsap.set(x, { opacity: 0 });
      this.vis.set(n.id + "__x", "hidden");
    }
    for (const e of this.spec.edges) {
      const el = this.el(e.id);
      const v: Vis = e.hidden && !revealAll ? "hidden" : "shown";
      this.vis.set(e.id, v);
      if (!el) continue;
      gsap.set(el, { opacity: v === "hidden" ? 0 : 1 });
      const solid = el.querySelector('[data-line="solid"]');
      if (solid) gsap.set(solid, { strokeDashoffset: v === "hidden" ? 1 : 0 });
    }
    for (const b of this.spec.badges ?? []) {
      const el = this.el(b.id);
      const v: Vis = b.hidden === false ? "shown" : "hidden";
      this.vis.set(b.id, v);
      if (el) gsap.set(el, { opacity: v === "hidden" ? 0 : 1, y: 0 });
    }
    gsap.set(this.ring, { opacity: 0 });
    this.root.querySelectorAll("[data-ringcap]").forEach((c) => gsap.set(c, { opacity: 0 }));
    this.root.querySelectorAll("[data-flash], [data-mark]").forEach((c) => gsap.set(c, { opacity: 0 }));
  }

  /** Re-read the state from the DOM (after a timeline was jumped to its end or killed). */
  syncFromDom(): void {
    for (const id of [...this.vis.keys()]) {
      const el = this.el(id);
      if (!el) continue;
      const o = Number(gsap.getProperty(el, "opacity"));
      this.vis.set(id, o < 0.05 ? "hidden" : o < 0.6 ? "dimmed" : "shown");
    }
  }

  private ringBox(id: string) {
    const r = this.geom.rects.get(id)!;
    return { x: r.x - 6, y: r.y - 6, width: r.w + 12, height: r.h + 12 };
  }

  private clampX(x: number, w: number) {
    const half = w / 2 + 4;
    return Math.min(Math.max(x, half), this.geom.width - half);
  }

  private pill(label: string, isResult: boolean): SVGGElement {
    const layer = this.root.querySelector('[data-layer="pills"]')!;
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "token" + (isResult ? " result" : ""));
    g.setAttribute("opacity", "0");
    const w = Math.ceil(textWidth.pill(label)) + 22;
    const r = document.createElementNS(SVGNS, "rect");
    r.setAttribute("x", String(-w / 2)); r.setAttribute("y", "-13");
    r.setAttribute("width", String(w)); r.setAttribute("height", "26"); r.setAttribute("rx", "13");
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("text-anchor", "middle"); t.setAttribute("y", "4");
    t.textContent = label;
    g.append(r, t);
    g.dataset.w = String(w);
    layer.appendChild(g);
    return g;
  }

  private travel(g: SVGGElement, ids: string[], seg: number, hold: number) {
    const w = Number(g.dataset.w);
    const pts: Pt[] = ids.map((id) => center(this.geom.rects.get(id)!));
    const t = gsap.timeline();
    t.set(g, { x: this.clampX(pts[0][0], w), y: pts[0][1] });
    t.to(g, { opacity: 1, duration: 0.2 });
    for (let i = 1; i < pts.length; i++) t.to(g, { x: this.clampX(pts[i][0], w), y: pts[i][1], duration: seg, ease: "power1.inOut" });
    t.to(g, { opacity: 0, duration: 0.25 }, "+=" + hold);
    return t;
  }

  private pulseTl(target: Element) {
    return gsap.timeline()
      .to(target, { scale: 1.06, duration: 0.18, transformOrigin: "50% 50%" })
      .to(target, { scale: 1, duration: 0.22 });
  }

  private showOne(id: string): gsap.core.Timeline {
    const t = gsap.timeline();
    const el = this.el(id);
    if (!el) return t;
    const v = this.vis.get(id) ?? (Number(gsap.getProperty(el, "opacity")) > 0.5 ? "shown" : "hidden");
    if (v === "shown") return t;
    this.vis.set(id, "shown");
    if (v === "dimmed") return t.to(el, { opacity: 1, duration: 0.35 });
    if (this.isNode(id)) {
      return t.fromTo(el, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false });
    }
    if (this.isEdge(id)) {
      const solid = el.querySelector('[data-line="solid"]');
      const extras = el.querySelectorAll("[data-deco], text");
      if (solid) {
        t.set(el, { opacity: 1 })
          .set(extras, { opacity: 0 })
          .fromTo(solid, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut", immediateRender: false })
          .to(extras, { opacity: 1, duration: 0.3 });
        return t;
      }
      return t.to(el, { opacity: 1, duration: 0.5 });
    }
    // badges, cross marks
    return t.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false });
  }

  private compileOne(a: Action): gsap.core.Timeline {
    const t = gsap.timeline();
    if ("show" in a) {
      a.show.forEach((id, i) => t.add(this.showOne(id), i === 0 ? 0 : ">-0.15"));
    } else if ("hide" in a) {
      const els = a.hide.map((id) => { this.vis.set(id, "hidden"); return this.el(id); }).filter(Boolean);
      t.to(els, { opacity: 0, duration: 0.35 });
      if (a.hide.includes(this.ringAt ?? "\u0000")) this.ringOff(t);
    } else if ("dim" in a) {
      const els = a.dim.map((id) => { this.vis.set(id, "dimmed"); return this.el(id); }).filter(Boolean);
      t.to(els, { opacity: 0.25, duration: 0.5 });
    } else if ("spawn" in a) {
      const [sx, sy] = center(this.geom.rects.get(a.from)!);
      a.spawn.forEach((id, i) => {
        const el = this.el(id);
        const r = this.geom.rects.get(id);
        if (!el || !r) return;
        this.vis.set(id, "shown");
        const [cx, cy] = center(r);
        t.fromTo(el,
          { opacity: 0, x: sx - cx, y: sy - cy, scale: 0.5, transformOrigin: "50% 50%" },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: 1.0, ease: "power2.inOut", immediateRender: false },
          i * 0.18);
      });
    } else if ("members" in a) {
      const idx = this.geom.memberIndex.get(a) ?? 0;
      const cur = this.mset.get(a.members) ?? 0;
      const node = this.nodeEl(a.members);
      if (node) {
        const sets = node.querySelectorAll("[data-mset]");
        const next = sets[idx];
        if (cur !== idx && sets[cur]) t.to(sets[cur], { opacity: 0, duration: 0.3 });
        if (next) {
          if (a.stagger) {
            const lines = next.querySelectorAll("text");
            t.set(next, { opacity: 1 }).set(lines, { opacity: 0 });
            lines.forEach((l) => t.to(l, { opacity: 1, duration: 0.45 }, "+=0.35"));
          } else {
            t.to(next, { opacity: 1, duration: 0.4 });
          }
        }
      }
      this.mset.set(a.members, idx);
    } else if ("call" in a) {
      const ids = a.call.filter((id) => this.geom.rects.has(id));
      if (ids.length) {
        const label = this.lang === "scala" && a.scalaLabel ? a.scalaLabel : a.label;
        const seg = ids.length > 3 ? 0.45 : 0.55;
        const c = this.pill(label, false);
        t.add(this.travel(c, ids, seg, 0.05));
        const last = this.el(ids[ids.length - 1]);
        if (last) t.add(this.pulseTl(last), "-=0.3");
        if (a.result) {
          const back = (a.back ?? ids.slice().reverse()).filter((id) => this.geom.rects.has(id));
          const r = this.pill(a.result, true);
          t.add(this.travel(r, back, seg - 0.05, a.hold ?? 0.5));
        }
      }
    } else if ("ring" in a) {
      if (a.ring === null) this.ringOff(t);
      else this.ringTo(t, a.ring, a.caption);
    } else if ("pulse" in a) {
      const el = this.el(a.pulse);
      if (el) t.add(this.pulseTl(el));
    } else if ("flash" in a) {
      const f = this.nodeEl(a.flash)?.querySelector("[data-flash]");
      if (f) t.to(f, { opacity: 1, duration: 0.15 }).to(f, { opacity: 0, duration: 0.6 });
    } else if ("shake" in a) {
      const el = this.el(a.shake);
      if (el) t.to(el, { x: -5, duration: 0.06 }).to(el, { x: 5, duration: 0.08, repeat: 3, yoyo: true }).to(el, { x: 0, duration: 0.06 });
    } else if ("cross" in a) {
      t.add(this.showOne(a.cross + "__x"));
    } else if ("tag" in a) {
      const node = this.nodeEl(a.tag);
      const texts = this.geom.tagIndex.get(a.tag) ?? [];
      const want = a.text === null ? null : texts.indexOf(a.text);
      const cur = this.tagShown.get(a.tag) ?? null;
      if (node && cur !== want) {
        if (cur !== null) t.to(node.querySelector(`[data-tag="${cur}"]`), { opacity: 0, duration: 0.25 });
        if (want !== null && want >= 0) t.fromTo(node.querySelector(`[data-tag="${want}"]`), { opacity: 0, scale: 0.8, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.35, immediateRender: false });
      }
      this.tagShown.set(a.tag, want);
    } else if ("mark" in a) {
      const m = this.nodeEl(a.mark)?.querySelector("[data-mark]") as SVGRectElement | null;
      const r = this.geom.rects.get(a.mark);
      const n = this.spec.nodes.find((x) => x.id === a.mark);
      if (m && r && n) {
        const head = headerHeight(n);
        if (a.member === null) t.to(m, { opacity: 0, duration: 0.3 });
        else {
          const y = r.y + head + 5 + a.member * 20;
          if ((this.markAt.get(a.mark) ?? null) === null) t.set(m, { attr: { y } }).to(m, { opacity: 1, duration: 0.35 });
          else t.to(m, { attr: { y }, duration: 0.35 });
        }
        this.markAt.set(a.mark, a.member);
      }
    } else if ("wait" in a) {
      t.to({}, { duration: a.wait });
    }
    return t;
  }

  private ringTo(t: gsap.core.Timeline, id: string, caption?: string) {
    if (!this.geom.rects.has(id)) return;
    const box = this.ringBox(id);
    const capIdx = caption ? this.geom.captions.indexOf(caption) : -1;
    const capPos = { x: box.x + box.width / 2, y: box.y + box.height + 16 };
    if (this.ringAt === null) {
      t.set(this.ring, { attr: box }).to(this.ring, { opacity: 1, duration: 0.4 });
    } else {
      t.to(this.ring, { attr: box, duration: 0.6, ease: "power2.inOut" });
    }
    const prevCap = this.ringCap;
    if (prevCap !== null && prevCap !== capIdx) t.to(this.caption(prevCap), { opacity: 0, duration: 0.25 }, "<");
    if (capIdx >= 0) {
      const c = this.caption(capIdx);
      if (prevCap === capIdx) t.to(c, { attr: capPos, duration: 0.6, ease: "power2.inOut" }, "<");
      else t.set(c, { attr: capPos }, "<").to(c, { opacity: 1, duration: 0.35 }, "<");
    }
    this.ringAt = id;
    this.ringCap = capIdx >= 0 ? capIdx : null;
  }

  private ringOff(t: gsap.core.Timeline) {
    if (this.ringAt === null) return;
    t.to(this.ring, { opacity: 0, duration: 0.3 });
    if (this.ringCap !== null) t.to(this.caption(this.ringCap), { opacity: 0, duration: 0.3 }, "<");
    this.ringAt = null; this.ringCap = null;
  }

  /** One timeline for a list of actions (run in order unless an action says `together`). */
  compile(actions: Action[]): gsap.core.Timeline {
    const t = gsap.timeline();
    for (const a of actions) t.add(this.compileOne(a), a.together ? "<" : ">");
    return t;
  }
}
