import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "composite",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Composite pattern let client code do?",
      options: [
        "Treat a single object and a whole group of objects in exactly the same way",
        "Create a family of related objects without naming their classes",
        "Add new behaviour to one object by wrapping it",
        "Share one object between many places to save memory"
      ],
      answer: 0,
      hint: "Think of project.size() and File('notes.txt').size(). What does the caller need to know?",
      explain: "Leaves and containers share one interface, so the client calls size() on a file or a whole folder tree in the same way. The others describe Abstract Factory, Decorator and Flyweight."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks as soon as folders are nested.",
      code: { lang: "python", text: `class Folder(Node):
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self._children: list[Node] = []

    def size(self) -> int:
        return sum(child._size for child in self._children)` },
      answer: 7,
      hint: "Does every child have a _size field? What should the folder ask instead?",
      explain: "Line 7 reads child._size, which only Files have, so a sub-folder makes it crash. It should call child.size(), letting each child (file or folder) answer for itself. That call is where the recursion happens."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `trait Widget:
  def draw(): String

class Button(label: String) extends Widget:
  def draw() = s"[$label]"

class Panel(children: List[Widget]) extends Widget:
  def draw() = children.map(_.draw()).mkString("{ ", " ", " }")` },
      options: ["Decorator", "Composite", "Chain of Responsibility", "Iterator"],
      answer: 1,
      hint: "How many Widgets does a Panel hold, and what does it do with their answers?",
      explain: "Panel is a Widget that holds many Widgets and combines their results, so panels can nest: Composite. A Decorator wraps exactly one object, a chain passes a request along until someone handles it, and an Iterator only walks items."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "In an access-control system a Group can contain users and other groups. Asking a group “who can see this file?” must include everyone inside, at any depth. Which pattern fits best?",
      options: ["Proxy", "Observer", "Composite", "Decorator"],
      answer: 2,
      hint: "It is a part-whole tree, and the question should work the same on one user or a whole group.",
      explain: "Users are leaves, groups are composites that ask their members, and the caller treats both alike: Composite. Proxy controls access to one object, Observer pushes change notifications, and Decorator adds behaviour to one wrapped object."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of project.size() in the right order.",
      steps: [
        "Demo code calls project.size()",
        "project/ asks README.md, which answers 1200",
        "project/ asks src/, which asks app.py and utils.py",
        "src/ adds 5400 and 800 and returns 6200",
        "project/ adds 1200 and 6200 and returns 7400"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The call goes down the tree first; the sums come back up from the bottom.",
      explain: "The client asks the root, the root asks its children in order, the sub-folder asks its own children, and the totals are added on the way back up."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Composite pattern correctly?",
      options: [
        {
          label: "File and Folder extend Node; Folder holds many Nodes through composition.",
          width: 330, height: 200,
          nodes: [
            { id: "n", kind: "abstract", name: "Node", key: true, at: { x: 90, y: 14, w: 120 } },
            { id: "f", kind: "concrete", name: "File", at: { x: 14, y: 140, w: 100 } },
            { id: "d", kind: "concrete", name: "Folder", key: true, at: { x: 170, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "f", to: "n", type: "inheritance" },
            { id: "e2", from: "d", to: "n", type: "inheritance" },
            { id: "e3", from: "d", to: "n", type: "composition", via: [[265, 36]] }
          ]
        },
        {
          label: "File and Folder extend Node; Folder holds many Files only.",
          width: 330, height: 200,
          nodes: [
            { id: "n", kind: "abstract", name: "Node", key: true, at: { x: 105, y: 14, w: 120 } },
            { id: "f", kind: "concrete", name: "File", at: { x: 14, y: 140, w: 100 } },
            { id: "d", kind: "concrete", name: "Folder", key: true, at: { x: 210, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "f", to: "n", type: "inheritance" },
            { id: "e2", from: "d", to: "n", type: "inheritance" },
            { id: "e3", from: "d", to: "f", type: "composition" }
          ]
        },
        {
          label: "Client points to File and to Folder separately; they share no parent.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 110, y: 14, w: 110, h: 50 } },
            { id: "f", kind: "concrete", name: "File", at: { x: 14, y: 140, w: 100 } },
            { id: "d", kind: "concrete", name: "Folder", at: { x: 216, y: 140, w: 100 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "f", type: "association" },
            { id: "e2", from: "c", to: "d", type: "association" }
          ]
        }
      ],
      answer: 0,
      hint: "Can a folder hold another folder in each diagram?",
      explain: "A is right: both extend Node, and Folder's children are Nodes (filled diamond at Folder), so folders can nest. In B a Folder can only hold Files, so the tree is one level deep. C has no common interface, so the client must check types, which is the original problem."
    }
  ],
  cards: [
    { id: "c-intent", front: "Composite: what is its intent, in one line?", back: "Build part-whole trees where leaves and containers share one interface, so clients treat one item and a group of items the same way." },
    { id: "c-vs-decorator", front: "Composite vs Decorator: both are recursive. What is the difference?", back: "A decorator wraps exactly one object and adds behaviour. A composite holds many children and combines their results." },
    { id: "c-solid", front: "Which SOLID principles does Composite mainly apply?", back: "Open/Closed (new node types without changing clients) and Liskov Substitution (any Node works wherever a Node is expected)." },
    { id: "c-spot", front: "Which pattern is hiding in this method?", code: { lang: "python", text: "def cost(self) -> int:\n    return sum(m.cost() for m in self.members)" }, back: "Composite. A container answers by asking each member the same question and combining the answers." },
    { id: "c-uml", front: "UML: what does a filled diamond on a line mean?", back: "Composition: the class at the diamond is the whole and owns the parts. Here Folder ◆→ Node means a folder owns its child nodes." },
    { id: "c-when-not", front: "When should you NOT use Composite?", back: "When the data is not a tree (shared nodes or cycles), or when leaves and containers share almost no behaviour, which forces meaningless methods like File.add()." }
  ]
};

export default quiz;
