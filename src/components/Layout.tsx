import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { watchPageMeta } from "../lib/pageMeta";
import MadeBy from "./MadeBy";
import { HASH_ROUTES } from "../lib/site";
import { requestPersistence, startActiveTimer } from "../lib/progress";
import { usePreference } from "./usePreference";

const LINKS = [
  { to: "/", label: "Learn", end: true },
  { to: "/uml", label: "UML" },
  { to: "/solid", label: "SOLID" },
  { to: "/patterns", label: "Patterns" },
  { to: "/compare", label: "Compare" },
  { to: "/case-studies", label: "Case Studies" },
  { to: "/scratch-pad", label: "Scratch Pad" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/feedback", label: "Feedback" }
];

export default function Layout() {
  const [mode, setMode] = usePreference<"rookie" | "refresher">("mode", "rookie");
  // learning time for the dashboard; ask the browser to keep saved progress
  useEffect(() => { void requestPersistence(); return startActiveTimer(); }, []);
  // phones: the menu folds behind a button and closes after each navigation
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  // "Report a mistake on this page": carries the page's title and link into the feedback form
  const report = () => {
    const title = document.querySelector("main h1")?.textContent?.trim() ?? "";
    const page = loc.pathname + loc.search;
    navigate(`/feedback?title=${encodeURIComponent(title)}&page=${encodeURIComponent(page)}`);
  };
  useEffect(() => setOpen(false), [loc.pathname]);
  // tab title, description and canonical link follow the page shown
  const mainRef = useRef<HTMLElement>(null);
  const pathRef = useRef(loc.pathname);
  pathRef.current = loc.pathname;
  useEffect(() => (mainRef.current ? watchPageMeta(mainRef.current, () => pathRef.current) : undefined), []);
  // a new page starts at the top (the browser keeps the old scroll position otherwise)
  // (or at the #section named in the address, once the lazily loaded page has drawn it)
  useEffect(() => {
    if (!loc.hash || HASH_ROUTES) { window.scrollTo(0, 0); return; }
    let tries = 0, timer = 0;
    const go = () => {
      const el = document.getElementById(decodeURIComponent(loc.hash.slice(1)));
      if (el) el.scrollIntoView(); else if (tries++ < 20) timer = window.setTimeout(go, 50);
    };
    go();
    return () => clearTimeout(timer);
  }, [loc.pathname, loc.hash]);
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
      <header className="top">
        <NavLink to="/" className="brand" aria-label="LLD Studio home">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18" />
          </svg>
          LLD Studio
        </NavLink>
        <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          Menu
        </button>
        <nav className={"nav" + (open ? " open" : "")} id="primary-nav" aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : undefined)}>{l.label}</NavLink>
          ))}
        </nav>
        <NavLink to="/search" className={({ isActive }) => "search-link" + (isActive ? " active" : "")} aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        </NavLink>
        <div className="mode" role="group" aria-label="Learning mode">
          <button type="button" aria-pressed={mode === "rookie"} onClick={() => setMode("rookie")}>Rookie</button>
          <button type="button" aria-pressed={mode === "refresher"} onClick={() => setMode("refresher")}>Refresher</button>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet context={{ mode }} />
      </main>
      <footer className="footer">
        {loc.pathname !== "/feedback" && (
          <button type="button" className="btn report-btn" onClick={report}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v12H8l-4 4z" /><path d="M12 7v4M12 14h.01" /></svg>
            Report a mistake on this page
          </button>
        )}
        <span>Your progress stays in this browser on this device. <Link to="/about">About, privacy &amp; licences</Link></span>
        <span>Content <Link to="/about#licence">CC BY-NC-SA 4.0</Link></span>
        <MadeBy />
      </footer>
    </>
  );
}
