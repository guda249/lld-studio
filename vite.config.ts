import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { headPlugin, licencesPlugin, sitePlugin, siteUrl } from "./scripts/site-plugin.mjs";

// The website (Cloudflare Pages): clean addresses like /patterns/strategy, served from the site root.
// Cloudflare Pages answers unknown paths with index.html when there is no 404.html, so deep links work.
export default defineConfig({
  base: "/",
  plugins: [react(), headPlugin(), licencesPlugin(), sitePlugin()],
  define: { __HASH_ROUTES__: "false", __SITE_URL__: JSON.stringify(siteUrl()) },
  build: { sourcemap: false, minify: "esbuild", cssMinify: true },
  server: { port: 5173, open: true }
});
