// Build helpers shared by vite.config.ts (the website) and vite.standalone.config.ts (the double-click file).
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE_NAME = "LLD Studio";

/** The published address, e.g. https://lldstudio.pages.dev (no trailing slash). Set SITE_URL when building. */
export const siteUrl = () => (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");

/* ---------- licences: a virtual module listing every library shipped to the browser ---------- */

const EXTRA = [
  { name: "tree-sitter-python (grammar)", version: "from tree-sitter-wasms 0.1.12", license: "MIT", url: "https://github.com/tree-sitter/tree-sitter-python" },
  { name: "tree-sitter-scala (grammar)", version: "0.24.0", license: "MIT", url: "https://github.com/tree-sitter/tree-sitter-scala" },
  { name: "IBM Plex (typeface)", version: "via Fontsource", license: "OFL-1.1", url: "https://github.com/IBM/plex" }
];
const LICENSE_NOTE = { gsap: "GSAP Standard License (free of charge, not open source)" };

function cleanUrl(p) {
  const u = p.homepage || (typeof p.repository === "string" ? p.repository : p.repository?.url) || "";
  return u.replace(/^git\+/, "").replace(/\.git$/, "").replace(/^git:\/\//, "https://");
}

export function licences(root = process.cwd()) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const deps = Object.keys(pkg.dependencies ?? {}).sort().map((name) => {
    const p = JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8"));
    return { name, version: p.version, license: LICENSE_NOTE[name] ?? p.license ?? "see package", url: cleanUrl(p) };
  });
  return [...deps, ...EXTRA];
}

export function licencesPlugin() {
  const id = "virtual:licences", resolved = "\0" + id;
  return {
    name: "lld-licences",
    resolveId: (s) => (s === id ? resolved : null),
    load: (s) => (s === resolved ? `export default ${JSON.stringify(licences())};` : null)
  };
}

/* ---------- website only: absolute preview links, sitemap, robots, no prototypes ---------- */

const ls = (dir) => (existsSync(dir) ? readdirSync(dir).filter((x) => !x.startsWith(".") && x !== "code").map((x) => x.replace(/\.ts$/, "")) : []);

export function routes(root = process.cwd()) {
  const c = (d) => ls(join(root, "src/content", d));
  return [
    "", "patterns", "uml", "uml/relationships", "uml/notation", "solid", "anti-patterns", "compare", "case-studies",
    "katas", "scratch-pad", "feedback", "about",
    ...c("patterns").filter((x) => !x.includes(".")).map((x) => `patterns/${x}`),
    ...c("uml/lessons").map((x) => `uml/${x}`),
    ...c("solid").map((x) => `solid/${x}`),
    ...c("anti").map((x) => `anti-patterns/${x}`),
    ...c("compare").map((x) => `compare/${x}`),
    ...c("cases").map((x) => `case-studies/${x}`),
    ...c("katas").map((x) => `scratch-pad/kata/${x}`)
  ];
}

/** Fills the page head: absolute link-preview addresses when SITE_URL is known (website only). */
export function headPlugin({ standalone = false } = {}) {
  return {
    name: "lld-head",
    transformIndexHtml: { order: "pre", handler(html) {
      const url = standalone ? "" : siteUrl();
      return html
        .replace(/%SITE_URL%/g, url || (standalone ? "." : ""))
        .replace(/\s*<meta property="og:url" content="\/?"\s*\/>/, url ? `\n    <meta property="og:url" content="${url}/" />` : "")
        .replace(/\s*<link rel="canonical" href="\/?"\s*\/>/, url ? `\n    <link rel="canonical" href="${url}/" />` : "");
    } }
  };
}

export function sitePlugin() {
  let outDir = "dist";
  return {
    name: "lld-site",
    configResolved(cfg) { outDir = cfg.build.outDir; },
    closeBundle() {
      // Design prototypes are internal references, not part of the published site.
      rmSync(join(outDir, "prototypes"), { recursive: true, force: true });
      // JS and CSS are minified by Vite; the small HTML shell is tidied here (comments and indentation removed).
      const index = join(outDir, "index.html");
      writeFileSync(index, readFileSync(index, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim() + "\n");
      const url = siteUrl();
      const robots = ["User-agent: *", "Allow: /", url ? `Sitemap: ${url}/sitemap.xml` : ""].filter(Boolean).join("\n") + "\n";
      writeFileSync(join(outDir, "robots.txt"), robots);
      if (url) {
        const body = routes().map((r) => `  <url><loc>${url}/${r}</loc></url>`).join("\n");
        writeFileSync(join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
      }
      console.log(`${SITE_NAME}: robots.txt${url ? ` and sitemap.xml (${routes().length} pages) for ${url}` : " written; set SITE_URL to also write sitemap.xml and absolute link-preview tags"}`);
    }
  };
}
