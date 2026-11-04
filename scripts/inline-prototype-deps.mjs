// After the standalone build: put the GSAP animation library inside each prototype,
// so the double-click version also works offline (only fonts fall back to system fonts).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "dist-standalone/prototypes";
const gsap = readFileSync("node_modules/gsap/dist/gsap.min.js", "utf8");
const cdnTag = /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/[^"]+"><\/script>/;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
  const path = join(dir, file);
  const html = readFileSync(path, "utf8");
  if (!cdnTag.test(html)) { console.log(`${file}: no CDN script to inline`); continue; }
  writeFileSync(path, html.replace(cdnTag, () => `<script>${gsap}</script>`));
  console.log(`${file}: GSAP inlined`);
}
