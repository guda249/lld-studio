import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { headPlugin, licencesPlugin } from "./scripts/site-plugin.mjs";

// "Double-click to open" build: all JavaScript, CSS and fonts are packed into index.html,
// so it works straight from disk (file://) with no server and no commands.
// A file opened from disk can't use clean addresses, so this build keeps #/ addresses.
// The prototypes are copied next to it in prototypes/.
export default defineConfig({
  base: "./",
  plugins: [react(), headPlugin({ standalone: true }), licencesPlugin(), viteSingleFile()],
  define: { __HASH_ROUTES__: "true", __SITE_URL__: JSON.stringify("") },
  build: { outDir: "dist-standalone", emptyOutDir: true, sourcemap: false, minify: "esbuild", cssMinify: true }
});
