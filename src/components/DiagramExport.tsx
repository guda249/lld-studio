import { useState } from "react";

const PROPS = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-opacity",
  "opacity", "font-family", "font-size", "font-weight", "font-style", "text-anchor", "dominant-baseline", "text-decoration", "paint-order",
  "visibility", "display"];

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** A standalone copy of a drawn diagram: page styles are copied onto each element, with the page background. */
export function diagramSvg(svg: SVGSVGElement): { text: string; w: number; h: number } {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...svg.querySelectorAll("*")], dst = [clone, ...clone.querySelectorAll("*")];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const style = PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";");
    (dst[i] as Element).setAttribute("style", style);
    (dst[i] as Element).removeAttribute("class");
  });
  const vb = svg.viewBox.baseVal;
  const w = Math.round(vb?.width || svg.clientWidth), h = Math.round(vb?.height || svg.clientHeight);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w)); clone.setAttribute("height", String(h));
  clone.removeAttribute("role");
  let bg = "#FFFFFF";
  for (let e: Element | null = svg; e; e = e.parentElement) {
    const c = getComputedStyle(e).backgroundColor;
    if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") { bg = c; break; }
  }
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", String(vb?.x ?? 0)); rect.setAttribute("y", String(vb?.y ?? 0));
  rect.setAttribute("width", String(w)); rect.setAttribute("height", String(h)); rect.setAttribute("style", `fill:${bg}`);
  clone.insertBefore(rect, clone.firstChild);
  return { text: new XMLSerializer().serializeToString(clone), w, h };
}

export async function exportDiagram(svg: SVGSVGElement, name: string, kind: "svg" | "png") {
  const { text, w, h } = diagramSvg(svg);
  const file = name.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "diagram";
  if (kind === "svg") { save(new Blob([text], { type: "image/svg+xml" }), `${file}.svg`); return; }
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
  await img.decode();
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale; canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, w, h);
  await new Promise<void>((resolve) => canvas.toBlob((b) => { if (b) save(b, `${file}.png`); resolve(); }, "image/png"));
}

/** "Save as SVG / PNG" for the first diagram inside `target`. */
export function DiagramExport({ target, name }: { target: React.RefObject<HTMLElement | null>; name: string }) {
  const [err, setErr] = useState("");
  const run = async (kind: "svg" | "png") => {
    setErr("");
    const svg = target.current?.querySelector("svg.diagram") as SVGSVGElement | null;
    if (!svg) { setErr("No diagram to save yet."); return; }
    try { await exportDiagram(svg, name, kind); } catch { setErr("This browser couldn't make the image. Try SVG instead."); }
  };
  return (
    <div className="export-row">
      {err && <span className="small-text muted-text" role="status">{err}</span>}
      <button type="button" className="btn" onClick={() => run("svg")} aria-label={`Save the ${name} diagram as SVG`}>Save SVG</button>
      <button type="button" className="btn" onClick={() => run("png")} aria-label={`Save the ${name} diagram as PNG`}>Save PNG</button>
    </div>
  );
}
