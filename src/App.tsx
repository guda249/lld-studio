import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Patterns from "./pages/Patterns";
import PatternPage from "./pages/PatternPage";
import UmlBasics from "./pages/UmlBasics";
import Dashboard from "./pages/Dashboard";
import ReviewSession from "./pages/ReviewSession";
import NotFound from "./pages/NotFound";

// The scratch pad brings the code editor and code reader; load it only when it is opened.
const ScratchPad = lazy(() => import("./pages/ScratchPad"));
const loading = <div className="page"><p className="muted-text">Loading the scratch pad…</p></div>;
// Phase 6 extras: one chunk each, loaded when opened.
const CompareIndex = lazy(() => import("./pages/extras/Compare").then((m) => ({ default: m.CompareIndex })));
const ComparePage = lazy(() => import("./pages/extras/Compare").then((m) => ({ default: m.ComparePage })));
const CaseIndex = lazy(() => import("./pages/extras/CaseStudies").then((m) => ({ default: m.CaseIndex })));
const CasePage = lazy(() => import("./pages/extras/CaseStudies").then((m) => ({ default: m.CasePage })));
const Katas = lazy(() => import("./pages/extras/Katas"));
const UmlLessonPage = lazy(() => import("./pages/guides/UmlLessonPage"));
const UmlIndex = lazy(() => import("./pages/guides/Guides").then((m) => ({ default: m.UmlIndex })));
const NotationLab = lazy(() => import("./pages/guides/Guides").then((m) => ({ default: m.NotationLab })));
const GuideIndex = lazy(() => import("./pages/guides/Guides").then((m) => ({ default: m.GuideIndex })));
const GuidePage = lazy(() => import("./pages/guides/Guides").then((m) => ({ default: m.GuidePage })));
const Search = lazy(() => import("./pages/Search"));
const Feedback = lazy(() => import("./pages/Feedback"));
const About = lazy(() => import("./pages/About"));
const wait = (el: React.ReactNode) => <Suspense fallback={<div className="page"><p className="muted-text">Loading…</p></div>}>{el}</Suspense>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="patterns" element={<Patterns />} />
        <Route path="patterns/:slug" element={<PatternPage />} />
        <Route path="uml" element={wait(<UmlIndex />)} />
        <Route path="uml/relationships" element={<UmlBasics />} />
        <Route path="uml/notation" element={wait(<NotationLab />)} />
        <Route path="uml/:id" element={wait(<UmlLessonPage />)} />
        <Route path="solid" element={wait(<GuideIndex section="solid" />)} />
        <Route path="solid/:id" element={wait(<GuidePage section="solid" />)} />
        <Route path="anti-patterns" element={wait(<GuideIndex section="anti" />)} />
        <Route path="anti-patterns/:id" element={wait(<GuidePage section="anti" />)} />
        <Route path="search" element={wait(<Search />)} />
        <Route path="feedback" element={wait(<Feedback />)} />
        <Route path="scratch-pad" element={<Suspense fallback={loading}><ScratchPad /></Suspense>} />
        <Route path="scratch-pad/:slug" element={<Suspense fallback={loading}><ScratchPad /></Suspense>} />
        <Route path="scratch-pad/kata/:kata" element={<Suspense fallback={loading}><ScratchPad /></Suspense>} />
        <Route path="compare" element={wait(<CompareIndex />)} />
        <Route path="compare/:id" element={wait(<ComparePage />)} />
        <Route path="case-studies" element={wait(<CaseIndex />)} />
        <Route path="case-studies/:slug" element={wait(<CasePage />)} />
        <Route path="katas" element={wait(<Katas />)} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="review" element={<ReviewSession />} />
        <Route path="review/:slug" element={<ReviewSession />} />
        <Route path="about" element={wait(<About />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
