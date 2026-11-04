import { SITE_URL } from "./site";

const SITE = "LLD Studio";
const HOME_TITLE = `${SITE} · Learn UML, SOLID and design patterns`;

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el && el.getAttribute(attr) !== value) el.setAttribute(attr, value);
}

/**
 * Keeps the tab title, description and canonical link in step with the page shown: the title comes from the page's
 * h1 and the description from its lede. Pages load their content lazily, so this watches <main> for changes.
 */
export function watchPageMeta(main: HTMLElement, getPath: () => string): () => void {
  const fallbackDesc = document.head.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  let frame = 0;
  const update = () => {
    frame = 0;
    const path = getPath();
    const h1 = main.querySelector("h1")?.textContent?.trim() ?? "";
    const title = path === "/" || !h1 ? HOME_TITLE : h1.includes(SITE) ? h1 : `${h1} · ${SITE}`;
    if (document.title !== title) document.title = title;
    const lede = main.querySelector(".lede")?.textContent?.trim().replace(/\s+/g, " ") ?? "";
    const desc = path === "/" || lede.length < 40 ? fallbackDesc : lede.length > 160 ? lede.slice(0, 157).replace(/\s+\S*$/, "") + "…" : lede;
    setMeta('meta[name="description"]', "content", desc);
    if (SITE_URL) setMeta('link[rel="canonical"]', "href", SITE_URL + (path === "/" ? "/" : path));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const obs = new MutationObserver(schedule);
  obs.observe(main, { childList: true, subtree: true, characterData: true });
  schedule();
  return () => { obs.disconnect(); if (frame) cancelAnimationFrame(frame); };
}
