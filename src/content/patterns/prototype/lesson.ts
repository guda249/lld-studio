import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-prefab.py?raw";
import ex1Scala from "./code/ex1-prefab.scala?raw";
import ex2Py from "./code/ex2-reorder.py?raw";
import ex2Scala from "./code/ex2-reorder.scala?raw";
import ex3Py from "./code/ex3-deploy.py?raw";
import ex3Scala from "./code/ex3-deploy.scala?raw";
import ex4Py from "./code/ex4-paper.py?raw";
import ex4Scala from "./code/ex4-paper.scala?raw";

const lesson: PatternLesson = {
  slug: "prototype",
  analogy:
    "An HR team keeps an Offer Letter template. For each new hire they make a copy and change the name and joining date. Nobody rebuilds the letter from a blank page, and the template itself is never edited.",
  problem: {
    text: "Every offer letter is set up by hand: the same sections and the same metadata, repeated in each function. The setup is long, and the copies drift apart. In the code below Arjun's letter has already lost the Benefits section and uses an old version number.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Give objects a method that copies them (we call it duplicate(), because Scala classes already inherit a clone() from Java). Keep fully configured examples, the prototypes, in a registry. New objects are copies of a prototype, and callers change only what differs. The copy must be deep: nested lists and maps are copied too, so editing the copy never changes the template.",
  participants: [
    { role: "Prototype", name: "Prototype", kind: "interface", description: "Declares duplicate(), the copy method." },
    { role: "Concrete prototype", name: "Document", kind: "concrete", description: "Copies itself, including its nested sections and metadata." },
    { role: "Registry", name: "TemplateRegistry", kind: "concrete", description: "Optional. Stores named, pre-configured prototypes and hands out copies." },
    { role: "Client", name: "Demo code", kind: "client", description: "Asks the registry for a copy and adjusts it; it never builds a letter from scratch." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "With immutable data, Prototype is almost free. In Scala, a case class plus copy(...) is the pattern: nothing can be changed, so the template can be shared and there are no deep-copy worries. In Python, use a frozen dataclass with tuples and dataclasses.replace(). For mutable Python objects use copy.deepcopy, and customise it with __copy__ and __deepcopy__ when needed.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Document, email and project templates, and the Duplicate button in editors.",
    "Game engines spawning many enemies or items from a configured prefab.",
    "JavaScript's object model, which is prototype-based.",
    "Python's copy module (copy, deepcopy, __deepcopy__) and Java's Object.clone().",
  ],
  whenToUse: [
    "Creating an object is expensive (heavy setup, loaded from disk or network) and copying is cheap.",
    "You need many variations of a few pre-configured objects.",
    "Code must copy objects without knowing their concrete classes.",
  ],
  whenNotToUse: [
    "Objects are cheap and simple to construct directly.",
    "Objects hold resources that must not be copied or shared, such as open files, sockets or locks.",
  ],
  pros: [
    "Skips expensive setup and removes repeated configuration code.",
    "New kinds of objects can be added at runtime by registering new prototypes.",
  ],
  cons: [
    "Shallow versus deep copy bugs: a shallow copy shares nested lists, so editing the copy edits the template.",
    "Objects with circular references or external resources need careful, custom copying.",
  ],
  confusedWith: [
    { name: "Factory Method / Abstract Factory", difference: "Factories build new objects from a class. Prototype makes them from an existing, configured instance." },
    { name: "Memento", difference: "Memento also copies state, but to restore the same object later, not to make new objects." },
    { name: "Builder", difference: "A builder assembles an object step by step from nothing; a prototype starts from a finished example and changes a few fields." },
  ],
  solid:
    "Open/Closed (new variants are added by registering prototypes, not by writing classes) and Dependency Inversion (callers depend on duplicate(), not on constructors).",
  interviewUses: [
    "Document and template systems.",
    "Game object spawning from prefabs.",
    "\"Duplicate this booking\" or \"reorder\" features.",
    "Configuration presets for environments or plans.",
  ],
  examples: [
    {
      id: "prefab",
      domain: "Games",
      title: "Spawning enemies from prefabs",
      situation:
        "Level designers tune each enemy type (health, speed, loot) once. The game must spawn dozens of them per wave, and building each one from scratch repeated the tuning numbers all over the code.",
      roles: [
        { role: "Concrete prototype", name: "Enemy" },
        { role: "Registry", name: "PrefabRegistry" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The prefab is the single source of truth for each enemy type. spawn() copies it and changes only the position, so every goblin starts identical and a designer's change reaches all of them.",
      goodToKnow:
        "The loot list is nested, so duplicate() must copy it too. Otherwise one goblin's lucky drop would appear in every goblin, and in the prefab.",
      walkthrough: [
        "The registry stores two tuned prefabs: a goblin and a troll.",
        "spawn() copies the goblin prefab three times and gives each copy its own position.",
        "A troll is spawned the same way.",
        "The first goblin gets a rare gem added to its loot.",
        "Only that goblin has the gem; the other goblins and the prefab are unchanged.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "reorder",
      domain: "E-commerce",
      title: "Reorder: shallow versus deep copy",
      situation:
        "A grocery app has a Reorder button that copies a past order so the customer can tweak it. After launch, support found that changing a quantity in the new order also changed the old order in the history.",
      roles: [
        { role: "Concrete prototype", name: "Order, LineItem" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Copying a finished order is the natural way to start a new one. But the order holds mutable line items, so the copy has to be deep: a new order with its own line items.",
      goodToKnow:
        "A shallow copy is fine when everything inside is immutable. The bug appears only when nested objects can change, which is why immutable data makes Prototype safer.",
      walkthrough: [
        "The past order ORD-1 has one pack of atta and two of toor dal.",
        "shallow_duplicate() makes a new order, but it still points to the same line items.",
        "Changing the atta quantity to 3 in the new order also changes ORD-1.",
        "duplicate() copies every line item as well.",
        "Now the new order has 3 packs while the history still shows 1.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "deploy",
      domain: "Cloud / DevOps",
      title: "Deployment config presets",
      situation:
        "A platform team keeps a carefully reviewed production config for a payments service. Staging and a disaster-recovery site were written out by hand and kept missing settings that production had.",
      roles: [
        { role: "Concrete prototype", name: "DeployConfig, Resources" },
        { role: "Registry", name: "PRESETS map" },
        { role: "Client", name: "for_staging(), demo code" },
      ],
      why: "Every environment is the production preset with a few changes. Copying with replace() or copy() keeps everything else identical, and because the configs are immutable the preset itself cannot be changed by mistake.",
      goodToKnow:
        "copy() and replace() are shallow: to change a nested value you must copy the nested object too, as for_staging() does with Resources.",
      walkthrough: [
        "The registry holds the production preset: six replicas in ap-south-1 with alerts on.",
        "for_staging() copies the nested Resources with one replica and 2 GB of memory.",
        "It then copies the whole config with the smaller resources and alerts off.",
        "The disaster-recovery config is a one-line copy with a different region.",
        "Printing all three shows production unchanged and each copy differing only where asked.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "paper",
      domain: "Education",
      title: "Exam paper sets from one master",
      situation:
        "A coaching institute prints sets A, B and C of a physics paper so neighbours cannot copy. Loading and checking the question bank is slow, and the old code reloaded it for every set.",
      roles: [
        { role: "Concrete prototype", name: "QuestionPaper" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The expensive work happens once to make the master paper. Each set is a cheap copy of the master with a new name and a rotated question order.",
      goodToKnow:
        "Count or time your expensive step, as load_count does here, to check that the prototype really saves work.",
      walkthrough: [
        "load_master_paper() does the slow work once and builds a five-question paper.",
        "For set A the master is copied and the questions keep their order.",
        "Sets B and C are copied too, with the question list rotated by one and two places.",
        "Each set still has all five questions.",
        "The load counter shows the master was loaded only once, and it still starts with Q1.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
