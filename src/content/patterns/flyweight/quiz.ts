import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "flyweight",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "In the Flyweight pattern, what goes into the shared flyweight object?",
      options: [
        "The state that is unique to each object, such as its position",
        "The intrinsic state that is the same for many objects, such as an icon or a font",
        "A counter of how many objects exist",
        "A reference back to every object that uses it"
      ],
      answer: 1,
      hint: "Think of the map markers: which part was copied 100,000 times for no reason?",
      explain: "The flyweight holds intrinsic state, the part that many objects have in common, so it can be stored once and shared. Per-object (extrinsic) state such as position stays outside. Counters and back-references would make the flyweight depend on who uses it, which defeats sharing."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Many trees share one TreeType. Tap the line that breaks the pattern.",
      code: { lang: "python", text: `class TreeType:
    def __init__(self, species, mesh):
        self.species = species
        self.mesh = mesh

    def grow(self, metres):
        self.height = metres

    def draw(self, x, y):
        return f"{self.species} at {x},{y}"` },
      answer: 7,
      hint: "A flyweight is shared by thousands of trees. What happens if one tree changes it?",
      explain: "Line 7 stores a height inside the shared TreeType. Height belongs to one tree (extrinsic state), but every tree of that species points at this object, so they would all grow at once. Keep the flyweight immutable and pass per-tree data in, as draw(x, y) does."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `final case class Piece(kind: String, colour: String)

object Pieces:
  private val cache = collection.mutable.Map.empty[(String, String), Piece]
  def of(kind: String, colour: String): Piece =
    cache.getOrElseUpdate((kind, colour), Piece(kind, colour))

final case class Square(file: Char, rank: Int, piece: Piece)` },
      options: ["Singleton", "Prototype", "Flyweight", "Builder"],
      answer: 2,
      hint: "How many Piece objects exist for sixteen white pawns across a thousand boards?",
      explain: "Pieces.of returns one shared, immutable Piece per (kind, colour) and each Square keeps its own position: Flyweight. A Singleton has exactly one instance, Prototype copies objects instead of sharing them, and Builder assembles one complex object step by step."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A chat app keeps 2 million Message objects in memory. Each one stores the sender's name, avatar image and theme colours, and there are only 300 users. What should you do?",
      options: [
        "Move the sender's name, avatar and colours into a shared, immutable Sender object from a cache, and keep only the text and time in each Message",
        "Make Message a Singleton",
        "Clone a prototype Message for every new message",
        "Compress each avatar inside its Message"
      ],
      answer: 0,
      hint: "Count how many distinct senders there are compared with messages.",
      explain: "Only 300 distinct senders exist, so their heavy data can be shared as 300 flyweights while each message keeps its own text and time. A Singleton would allow one message only, cloning still copies the avatar, and compressing still keeps 2 million copies."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of MarkerStyleFactory.get(\"car.png\", \"yellow\") on its first call in order.",
      steps: [
        "The client calls get with the icon and colour",
        "The factory builds the key (icon, colour)",
        "The key is not in the cache, so the factory creates a MarkerStyle",
        "The factory stores the new style in its cache",
        "The factory returns the style, and the client builds a Marker with its own position"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "You cannot look in the cache before you have a key, and you return what you stored.",
      explain: "The factory makes a key, misses the cache, creates and stores the flyweight, and returns it. The next call with the same key skips the create step and returns the stored object."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows Flyweight correctly?",
      options: [
        {
          label: "Marker inherits from MarkerStyle; the factory creates Markers.",
          width: 330, height: 200,
          nodes: [
            { id: "f", kind: "singleton", name: "StyleFactory", key: true, at: { x: 8, y: 14, w: 130 } },
            { id: "s", kind: "concrete", name: "MarkerStyle", at: { x: 190, y: 14, w: 130 } },
            { id: "m", kind: "concrete", name: "Marker", at: { x: 190, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "f", to: "m", type: "dependency", route: "straight" },
            { id: "e2", from: "m", to: "s", type: "inheritance" }
          ]
        },
        {
          label: "The factory aggregates many MarkerStyle objects; many Markers point to one MarkerStyle.",
          width: 330, height: 200,
          nodes: [
            { id: "f", kind: "singleton", name: "StyleFactory", key: true, at: { x: 8, y: 14, w: 130 } },
            { id: "s", kind: "concrete", name: "MarkerStyle", at: { x: 190, y: 14, w: 130 } },
            { id: "m", kind: "concrete", name: "Marker", at: { x: 190, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "f", to: "s", type: "aggregation", toMult: "0..*" },
            { id: "e2", from: "m", to: "s", type: "association", fromMult: "*", toMult: "1" }
          ]
        },
        {
          label: "Each Marker owns its own MarkerStyle by composition; the factory is not connected.",
          width: 330, height: 200,
          nodes: [
            { id: "f", kind: "singleton", name: "StyleFactory", key: true, at: { x: 8, y: 14, w: 130 } },
            { id: "s", kind: "concrete", name: "MarkerStyle", at: { x: 190, y: 14, w: 130 } },
            { id: "m", kind: "concrete", name: "Marker", at: { x: 190, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e2", from: "m", to: "s", type: "composition", fromMult: "1", toMult: "1" }
          ]
        }
      ],
      answer: 1,
      hint: "Look at the multiplicities: how many markers can share one style?",
      explain: "B is right: the factory keeps a pool of styles (aggregation, 0..*), and many markers (*) point at one style (1). In A, Marker inherits the style, so every marker is a full style object again. In C, composition with 1 to 1 means each marker owns a private copy, which is the original memory problem."
    }
  ],
  cards: [
    { id: "fw-intent", front: "Flyweight: what is its intent, in one line?", back: "Share the common, immutable part of many similar objects so it is stored once, and keep only the per-object part in each object." },
    { id: "fw-vs-singleton", front: "Flyweight vs Singleton: how many instances?", back: "Singleton: exactly one instance of the class. Flyweight: one shared instance per distinct intrinsic state (one per icon and colour, one per letter and font), handed out by a factory." },
    { id: "fw-solid", front: "Which SOLID principles does Flyweight touch?", back: "Single Responsibility (intrinsic and extrinsic state live in different classes) and Open/Closed (new shared styles come from the factory without changing clients)." },
    { id: "fw-spot", front: "Which pattern is hiding in this code?", code: { lang: "python", text: "import sys\nname = sys.intern(user_input)\n# equal strings now share one object" }, back: "Flyweight. String interning keeps one shared copy of each distinct string, and every user of that value points at the same object." },
    { id: "uml-mult", front: "UML: what does “*” at Marker and “1” at MarkerStyle on one association mean?", back: "Multiplicity: many Marker objects are linked to exactly one MarkerStyle. That “many to one” is the shape of sharing in Flyweight." },
    { id: "fw-when-not", front: "When should you NOT use Flyweight?", back: "When there are only a few objects, when the shared part has to change per object (flyweights must be immutable), or before a memory profiler has shown real duplication." }
  ]
};

export default quiz;
