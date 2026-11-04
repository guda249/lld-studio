/** UML Basics lesson list (fixed order) and lazy loaders for lessons, guides and the notation lab. */
import type { Guide, NotationSymbol, UmlLesson } from "./types";

/** All nine UML Basics lessons. "relationships" has its own animated page (src/pages/UmlBasics.tsx). */
export const UML_LESSONS: { order: number; id: string; title: string; short: string }[] = [
  { order: 1, id: "diagram-types", title: "The 14 diagram types", short: "The UML family, and the five you will actually draw." },
  { order: 2, id: "class-anatomy", title: "Anatomy of a class box", short: "Name, attributes, operations, visibility, static and abstract." },
  { order: 3, id: "relationships", title: "The six relationships", short: "Dependency to composition, inheritance and realization." },
  { order: 4, id: "multiplicity", title: "Multiplicity", short: "1, 0..1, *, 1..* and what they mean in code." },
  { order: 5, id: "sequence", title: "Sequence diagrams", short: "Lifelines, calls, returns and object creation over time." },
  { order: 6, id: "state-machine", title: "State machine diagrams", short: "States, transitions, events, guards and actions." },
  { order: 7, id: "activity-usecase", title: "Activity & use case diagrams", short: "Workflows with decisions and forks; who uses the system for what." },
  { order: 8, id: "draw-first", title: "Draw your first diagram", short: "Read real code and draw its class diagram; the app checks it." },
  { order: 9, id: "quiz", title: "UML Basics quiz", short: "Ten questions across all the lessons." }
];

const lessons = import.meta.glob<{ default: UmlLesson }>("../uml/lessons/*.ts");
const solid = import.meta.glob<{ default: Guide }>("../solid/*.ts");
const anti = import.meta.glob<{ default: Guide }>("../anti/*.ts");
const notation = import.meta.glob<{ default: NotationSymbol[] }>("../uml/notation.ts");

const fileId = (k: string) => k.split("/").pop()!.replace(/\.ts$/, "");
const one = <T,>(g: Record<string, () => Promise<{ default: T }>>, id: string) => {
  const k = Object.keys(g).find((x) => fileId(x) === id);
  return k ? g[k]().then((m) => m.default) : Promise.resolve(null);
};
const all = <T,>(g: Record<string, () => Promise<{ default: T }>>) => Promise.all(Object.values(g).map((f) => f().then((m) => m.default)));

export const hasUmlLesson = (id: string) => Object.keys(lessons).some((k) => fileId(k) === id);
export const loadUmlLesson = (id: string) => one(lessons, id);
export const loadGuides = (section: "solid" | "anti") => all(section === "solid" ? solid : anti).then((l) => l.sort((a, b) => a.order - b.order));
export const loadGuide = (section: "solid" | "anti", id: string) => one(section === "solid" ? solid : anti, id);
export const loadNotation = () => (Object.values(notation)[0]?.().then((m) => m.default) ?? Promise.resolve([] as NotationSymbol[]));
export const guideCount = (section: "solid" | "anti") => Object.keys(section === "solid" ? solid : anti).length;
