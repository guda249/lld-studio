import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-editor.py?raw";
import ex1Scala from "./code/ex1-editor.scala?raw";
import ex2Py from "./code/ex2-forest.py?raw";
import ex2Scala from "./code/ex2-forest.scala?raw";
import ex3Py from "./code/ex3-seats.py?raw";
import ex3Scala from "./code/ex3-seats.scala?raw";
import ex4Py from "./code/ex4-labs.py?raw";
import ex4Scala from "./code/ex4-labs.scala?raw";

const lesson: PatternLesson = {
  slug: "flyweight",
  analogy:
    "A font. Every letter “a” on a page uses the same glyph shape; only its position differs. The printer does not store a fresh copy of the shape for each “a”.",
  problem: {
    text: "A ride-hailing map shows 100,000 car markers. If every marker keeps its own copy of a 50 KB car icon, that is about 5 GB of duplicate image data for what is really one image.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Split each marker's state in two. Intrinsic state (the icon and colour) is the same for many markers, so it goes into one shared, immutable MarkerStyle object: the flyweight. Extrinsic state (latitude and longitude) is unique to each car, so it stays in the small Marker object. A flyweight factory hands out an existing style instead of creating a duplicate.",
  participants: [
    { role: "Flyweight", name: "MarkerStyle", kind: "concrete", description: "Holds the shared, intrinsic state. It must be immutable because many markers point to it." },
    { role: "Flyweight factory", name: "MarkerStyleFactory", kind: "singleton", description: "Returns the existing flyweight for a key, or creates and caches a new one." },
    { role: "Context", name: "Marker", kind: "concrete", description: "Holds the extrinsic state (position) plus a reference to a shared flyweight." },
    { role: "Client", name: "Demo code", kind: "client", description: "Asks the factory for styles instead of building them with MarkerStyle(...)." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "In Python, functools.cache on a small factory function gives the same sharing in one line, and slots=True on the context dataclass cuts the memory of each object further. In Scala, a memoised factory, meaning a Map cache inside an object with getOrElseUpdate, does the job. Case classes are immutable by default, which is exactly what a flyweight needs.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "String interning: Python sys.intern and Java's string pool.",
    "Small-integer caches: CPython reuses small ints, and Java Integer.valueOf caches -128 to 127.",
    "Text editors and browsers share glyph data for each character and font.",
    "Games draw forests, particles and crowds with shared meshes and textures (GPU instancing).",
  ],
  whenToUse: [
    "You need a huge number of similar objects and memory is the bottleneck.",
    "Most of each object's state can be moved out (extrinsic), and the rest is identical across many objects.",
  ],
  whenNotToUse: [
    "Object counts are small; the extra complexity buys nothing.",
    "The “shared” part must change per object; flyweights have to be immutable.",
    "You have not measured. Use a memory profiler first to check the duplication is real.",
  ],
  pros: [
    "Large memory savings when objects are many and similar.",
    "Shared objects are created once, which can also save loading time.",
  ],
  cons: [
    "More complex code; extrinsic state has to be stored and passed around separately.",
    "The factory cache needs thread safety and, in long-running apps, possibly eviction.",
  ],
  confusedWith: [
    { name: "Singleton", difference: "A singleton has exactly one instance of a class. Flyweight has many shared instances, one per distinct intrinsic state." },
    { name: "Prototype", difference: "Prototype copies objects; Flyweight shares one object instead of copying it." },
    { name: "Caching in general", difference: "Flyweight is caching used for one specific goal: sharing immutable object state to save memory." },
  ],
  solid:
    "Single Responsibility (intrinsic and extrinsic state are kept apart) and Open/Closed (new styles are added through the factory without changing clients).",
  interviewUses: [
    "Text editor character rendering.",
    "Map marker rendering in ride-hailing apps.",
    "Chess: piece types are shared, positions live on each board.",
    "Game object pools and particle systems.",
  ],
  examples: [
    {
      id: "editor",
      domain: "Productivity software",
      title: "Text editor glyphs",
      situation:
        "A document editor keeps an object for every character on screen. Long documents have millions of characters but only a few dozen distinct letter, font and size combinations.",
      roles: [
        { role: "Flyweight", name: "Glyph" },
        { role: "Flyweight factory", name: "GlyphFactory" },
        { role: "Context", name: "CharCell" },
      ],
      why: "How a letter looks never depends on where it sits. The glyph is shared, and each cell keeps only its row and column.",
      goodToKnow:
        "render() takes the position as arguments. Passing extrinsic state into the flyweight's methods is the classic GoF form, and it keeps the flyweight free of per-use data.",
      walkthrough: [
        "Two lines of text are split into 38 character cells.",
        "Each cell asks the factory for a glyph with the same font and size.",
        "Repeated letters such as “a”, “l” and the space reuse the same glyph object.",
        "Only 17 glyph objects exist for the 38 characters.",
        "Rendering passes each cell's row and column into the shared glyph.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "forest",
      domain: "Games",
      title: "Forest of trees",
      situation:
        "An open-world game places 20,000 trees on a map. Each tree type has a mesh of up to 1.5 MB, and copying it into every tree would need about 20 GB.",
      roles: [
        { role: "Flyweight", name: "TreeType" },
        { role: "Flyweight factory", name: "TreeTypeFactory" },
        { role: "Context", name: "Tree" },
      ],
      why: "There are only three species but thousands of positions. Sharing the heavy mesh and texture leaves each tree with just x, y and a reference.",
      goodToKnow:
        "Game engines take this further with GPU instancing: the graphics card draws one mesh many times from a list of positions.",
      walkthrough: [
        "A seeded random generator picks a species and a position for each of 20,000 trees.",
        "The factory creates a TreeType only the first time it sees a species.",
        "Every later neem, banyan or palm reuses that object.",
        "Shared meshes need 3 MB, compared with about 20,000 MB if every tree had its own copy.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "seats",
      domain: "Travel",
      title: "Airline seat map",
      situation:
        "A booking site shows seat maps for hundreds of flights at once. Every seat stored its own fare, legroom and perks, although all seats in a cabin class share them.",
      roles: [
        { role: "Flyweight", name: "SeatClass" },
        { role: "Flyweight factory", name: "SEAT_CLASSES pool and class_for()" },
        { role: "Context", name: "seat map entry (seat number, booked flag)" },
      ],
      why: "Only the seat number and booked flag vary per seat. Three shared SeatClass objects describe all 180 seats.",
      goodToKnow:
        "When the set of flyweights is small and known up front, a pre-built pool like this is simpler than a lazy factory.",
      walkthrough: [
        "Three SeatClass objects are built once: Business, Stretch and Economy.",
        "class_for() picks one of them from the row number.",
        "The seat map stores 180 entries but only three seat-class objects.",
        "label() receives the seat number and booked flag as arguments.",
        "Seat 1A shows as booked; 4C and 27F show their fares.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "labs",
      domain: "Healthcare",
      title: "Lab test definitions",
      situation:
        "A lab system produces thousands of results a day. Each result was carrying its own copy of the test's name, unit and normal range, loaded from the master table every time.",
      roles: [
        { role: "Flyweight", name: "TestDefinition" },
        { role: "Flyweight factory", name: "test_def (memoised function)" },
        { role: "Context", name: "LabResult" },
      ],
      why: "The definition of a test is the same for every patient. A memoised factory function loads it once and shares it, and each result keeps only the patient and value.",
      goodToKnow:
        "If the master table can change, a plain cache will serve stale ranges. Give the cache a way to be cleared, such as cache_clear() in Python.",
      walkthrough: [
        "Six readings arrive for three patients and two tests.",
        "The first HB and GLU readings load their definitions from the master table.",
        "Later readings reuse the cached definitions; nothing more is loaded.",
        "Each result asks its shared definition to flag the value as LOW, normal or HIGH.",
        "Six results share just two definition objects.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
