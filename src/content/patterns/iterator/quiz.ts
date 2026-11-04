import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "iterator",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Iterator pattern give the code that uses a collection?",
      options: [
        "A way to walk the items one by one without knowing how the collection stores them",
        "A copy of the collection that can be changed safely",
        "A single object that hides a whole subsystem",
        "A way to add new operations to every element class"
      ],
      answer: 0,
      hint: "Think of the TV remote's channel-up button.",
      explain: "An iterator offers \"give me the next item\" and keeps the walking state itself, so the caller never sees pages, stacks or indexes. A copy is not an iterator, hiding a subsystem is Facade, and adding operations to element classes is Visitor."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Two loops over the same playlist interfere with each other. Tap the line that causes it.",
      code: { lang: "python", text: `class Playlist:
    def __init__(self, songs):
        self._songs = songs
        self._pos = 0

    def has_next(self):
        return self._pos < len(self._songs)

    def next(self):
        self._pos += 1
        return self._songs[self._pos - 1]` },
      answer: 4,
      hint: "Where does the \"current position\" live: in the collection or in a separate object?",
      explain: "Line 4 stores the position inside the Playlist itself, so every loop shares one cursor and two listeners fight over it. Move the position into a separate iterator object that the playlist hands out, one per loop."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `class Countdown(from: Int) extends Iterator[Int]:
  private var n = from
  def hasNext: Boolean = n > 0
  def next(): Int =
    n -= 1
    n + 1

for x <- Countdown(3) do println(x)` },
      options: ["Composite", "Iterator", "Template Method", "Memento"],
      answer: 1,
      hint: "Look at the two methods the class offers and how the for loop uses it.",
      explain: "Countdown keeps its own position and offers hasNext and next(), so a plain for loop can walk it: Iterator. There is no tree of parts (Composite), no fixed skeleton with steps to fill in (Template Method) and no saved snapshot (Memento)."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A log viewer reads a 20 GB file. It must show matching lines as soon as they are found, without loading the whole file into memory. What fits best?",
      options: [
        "Read all lines into a list first, then filter",
        "A lazy iterator that reads and yields one line at a time",
        "A Singleton that caches the file",
        "An Observer that notifies on every byte"
      ],
      answer: 1,
      hint: "Memory must stay small, and results should appear early.",
      explain: "A lazy iterator (a Python generator or a Scala Iterator) pulls one line at a time, so memory stays tiny and the first match appears at once. Loading everything first wastes memory, a Singleton does not solve streaming, and byte-level notifications are far too chatty."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of `for order in pages` in the right order.",
      steps: [
        "The loop asks OrderPages for an iterator",
        "OrderPages creates a fresh OrderIterator",
        "The loop calls next(); the empty buffer makes the iterator fetch page 0",
        "next() returns order-0 from the buffer",
        "When a fetched page is empty, the iterator signals the end and the loop stops"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The iterator must exist before anyone can call next() on it.",
      explain: "The loop first gets a fresh iterator from the collection, then keeps calling next(). The iterator fetches lazily, returns one item at a time, and ends the loop when there is nothing left."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Iterator pattern correctly?",
      options: [
        {
          label: "Playlist keeps a position and has next itself; the client calls Playlist directly.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 30, w: 90, h: 50 } },
            { id: "p", kind: "concrete", name: "Playlist", key: true, members: ["- songs", "- pos", "+ next()"], at: { x: 150, y: 14, w: 160 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "p", type: "association" }
          ]
        },
        {
          label: "Playlist creates a SongIterator; InOrder implements SongIterator and keeps its own position; the client uses SongIterator.",
          width: 330, height: 200,
          nodes: [
            { id: "p", kind: "concrete", name: "Playlist", members: ["+ iterator()"], at: { x: 8, y: 14, w: 120 } },
            { id: "i", kind: "interface", name: "SongIterator", key: true, members: ["+ next()"], at: { x: 180, y: 8, w: 140 } },
            { id: "o", kind: "concrete", name: "InOrder", members: ["- pos"], at: { x: 190, y: 130, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "p", to: "i", type: "dependency", label: "creates" },
            { id: "e2", from: "o", to: "i", type: "realization" }
          ]
        },
        {
          label: "InOrder inherits from Playlist and adds a next method.",
          width: 330, height: 200,
          nodes: [
            { id: "p", kind: "concrete", name: "Playlist", key: true, members: ["- songs"], at: { x: 100, y: 14, w: 130 } },
            { id: "o", kind: "concrete", name: "InOrder", members: ["+ next()"], at: { x: 100, y: 130, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "o", to: "p", type: "inheritance" }
          ]
        }
      ],
      answer: 1,
      hint: "The walking state should live outside the collection, behind an interface.",
      explain: "B is right: the collection hands out iterators, and each InOrder keeps its own position behind the SongIterator interface. A keeps the position inside the collection, so two loops clash. C makes the iterator a kind of playlist, mixing the data with the walk."
    }
  ],
  cards: [
    { id: "it-intent", front: "Iterator: what is its intent, in one line?", back: "Walk the items of a collection one by one without exposing how the collection is stored." },
    { id: "it-vs-composite", front: "Iterator vs Composite: how do they relate?", back: "Composite builds a tree of parts. Iterator walks a structure, such as that tree, one item at a time. They are often used together." },
    { id: "it-solid", front: "Which SOLID principles does Iterator apply?", back: "Single Responsibility (walking is separated from storing) and Open/Closed (a new way to walk is a new iterator, not a change to the collection)." },
    { id: "it-spot", front: "Which pattern is hiding in this code?", code: { lang: "python", text: `def evens(limit):
    n = 0
    while n < limit:
        yield n
        n += 2

for x in evens(10):
    print(x)` }, back: "Iterator. A Python generator is an iterator: yield remembers the position between calls to next()." },
    { id: "it-uml", front: "UML: how do you show that a collection creates its iterators?", back: "A dashed dependency arrow from the collection to the iterator, labelled «create». The concrete iterator realizes the Iterator interface (dashed line, hollow triangle)." },
    { id: "it-when-not", front: "When should you NOT write your own Iterator class?", back: "When the language already gives you one: a list, a generator or a Scala collection method. Write a class only if the walk needs extra state or methods." }
  ]
};

export default quiz;
