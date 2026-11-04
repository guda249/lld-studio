import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "prototype",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Prototype pattern do?",
      options: [
        "Makes sure a class has only one instance",
        "Builds an object step by step from nothing",
        "Makes new objects by copying a fully configured existing object",
        "Lets two incompatible interfaces work together"
      ],
      answer: 2,
      hint: "Think of the HR team and its Offer Letter template. Where does each new letter come from?",
      explain: "Prototype creates new objects by copying a configured example and changing only what differs. Only one instance is Singleton, step-by-step building is Builder, and joining incompatible interfaces is Adapter."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "Editing a spawned goblin also changes the goblin prefab. Tap the line that causes it.",
      code: { lang: "python", text: `import copy

class Enemy:
    def __init__(self, kind, loot):
        self.kind = kind
        self.loot = loot

    def duplicate(self):
        return copy.copy(self)

goblin = Enemy("goblin", ["copper coin"])
spawned = goblin.duplicate()
spawned.loot.append("rare gem")` },
      answer: 9,
      hint: "Which copy keeps sharing the nested loot list with the original?",
      explain: "Line 9 makes a shallow copy: a new Enemy, but the same loot list inside. Appending to the copy's loot also changes the prefab. Use copy.deepcopy(self) so the nested list is copied too. Line 13 only shows the symptom."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `final case class Plan(name: String, seats: Int, sso: Boolean)

val presets = Map("team" -> Plan("Team", 10, sso = false))

@main def demo(): Unit =
  val acme = presets("team").copy(name = "Acme Team", seats = 25)
  println(acme)` },
      options: ["Builder", "Prototype", "Factory Method", "Singleton"],
      answer: 1,
      hint: "Is the new Plan made from a class, or from an existing, configured Plan?",
      explain: "A configured preset is copied with copy(...), and only the differences are given: Prototype, with a registry of presets. Builder assembles from nothing step by step, Factory Method picks a class to construct, and Singleton is about one shared instance."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A map editor lets designers place hundreds of trees. Each tree type is loaded from a large model file and then tuned. Placing a tree must be instant. What fits best?",
      options: [
        "Load the model file again for every tree that is placed",
        "Load and tune each tree type once, then place copies of it",
        "Make Tree a Singleton so there is only one tree",
        "Wrap every tree in an Adapter"
      ],
      answer: 1,
      hint: "Which step is slow, and how many times does it really need to run?",
      explain: "Loading is the expensive step, so do it once per type and keep that tree as a prototype; each placed tree is a cheap copy with its own position. Reloading repeats the slow work, a Singleton allows only one tree, and an Adapter changes interfaces, not creation."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of making Priya's offer letter in the right order.",
      steps: [
        "Register a fully configured Offer Letter template",
        "Call registry.create(\"offer\")",
        "The template's duplicate() returns a deep copy",
        "Change the copy's title and add a Joining date section",
        "Check that the template still has four sections"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The template must exist before anyone can copy it, and you can only edit a copy once you have it.",
      explain: "First the template is set up once and registered. The client asks the registry, the template copies itself, the client edits only the copy, and the template stays unchanged because the copy was deep."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Prototype pattern correctly?",
      options: [
        {
          label: "Client calls Document's constructor directly; Document has no copy method.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 100 } },
            { id: "d", kind: "concrete", name: "Document", key: true, members: ["+ __init__(…)"], at: { x: 170, y: 20, w: 150 } },
            { id: "s", kind: "concrete", name: "Section", at: { x: 170, y: 140, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "d", type: "dependency", label: "new" },
            { id: "e2", from: "d", to: "s", type: "composition" }
          ]
        },
        {
          label: "Registry holds Prototype templates; Document implements Prototype with duplicate().",
          width: 330, height: 200,
          nodes: [
            { id: "r", kind: "concrete", name: "Registry", key: true, members: ["+ create(key)"], at: { x: 8, y: 20, w: 120 } },
            { id: "p", kind: "interface", name: "Prototype", key: true, members: ["+ duplicate()"], at: { x: 180, y: 14, w: 140 } },
            { id: "d", kind: "concrete", name: "Document", members: ["+ duplicate()"], at: { x: 180, y: 118, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "r", to: "p", type: "aggregation", toMult: "*" },
            { id: "e2", from: "d", to: "p", type: "realization" }
          ]
        },
        {
          label: "Document has a private constructor and a static instance, returned by get().",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 100 } },
            { id: "d", kind: "singleton", name: "Document", key: true, members: ["- instance", "+ get()"], at: { x: 170, y: 20, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "d", type: "association" }
          ]
        }
      ],
      answer: 1,
      hint: "Look for an operation that copies an existing object, and someone who keeps the originals.",
      explain: "B is right: a registry keeps Prototype objects, and Document implements duplicate() so it can copy itself. A builds every Document from its constructor (no copying), and C is a Singleton: one shared instance, not many copies."
    }
  ],
  cards: [
    { id: "pr-intent", front: "Prototype: what is its intent, in one line?", back: "Make new objects by copying a configured example, then change only what differs." },
    { id: "pr-vs-factory", front: "Prototype vs Factory Method: where does the new object come from?", back: "A factory builds it from a class. Prototype copies an existing, already configured instance." },
    { id: "pr-solid", front: "Which SOLID principles does Prototype support?", back: "Open/Closed (new variants are new registered prototypes, not new code) and Dependency Inversion (callers use duplicate(), not constructors)." },
    { id: "pr-spot", front: "Which pattern is hiding in this line?", code: { lang: "scala", text: "val staging = prod.copy(region = \"ap-south-2\")" }, back: "Prototype. An immutable case class copied with copy(...): the preset is the prototype and only the region changes." },
    { id: "uml-aggr", front: "UML: what does a hollow diamond at one end of a line mean?", back: "Aggregation: the class at the diamond holds the other objects, but they can live without it (a registry holding templates)." },
    { id: "pr-when-not", front: "When should you NOT use Prototype?", back: "When objects are cheap and simple to construct, or when they hold things that must not be copied, like open files, sockets or locks." }
  ]
};

export default quiz;
