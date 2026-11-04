import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { HASH_ROUTES } from "./lib/site";
import App from "./App";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-400-italic.css";
import "./styles/app.css";

// Ask the browser to keep this site's saved data (progress, flashcards, attempts)
// instead of clearing it automatically when the device is low on space.
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => { /* not critical */ });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Website: clean addresses (/patterns/strategy). Double-click file: #/ addresses, the only kind file:// supports. */}
    {HASH_ROUTES ? <HashRouter><App /></HashRouter> : <BrowserRouter><App /></BrowserRouter>}
  </StrictMode>
);
