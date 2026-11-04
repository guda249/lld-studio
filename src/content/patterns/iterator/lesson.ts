import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-playlist.py?raw";
import ex1Scala from "./code/ex1-playlist.scala?raw";
import ex2Py from "./code/ex2-filetree.py?raw";
import ex2Scala from "./code/ex2-filetree.scala?raw";
import ex3Py from "./code/ex3-statement.py?raw";
import ex3Scala from "./code/ex3-statement.scala?raw";
import ex4Py from "./code/ex4-vitals.py?raw";
import ex4Scala from "./code/ex4-vitals.scala?raw";

const lesson: PatternLesson = {
  slug: "iterator",
  analogy:
    "The channel-up button on a TV remote. You press next and get the next channel; you never need to know how the TV stores its channel list.",
  problem: {
    text: "An orders API returns results a few per page. Every caller writes the same loop: ask for page 0, then page 1, stop when a page is empty. Paging details leak into every caller, and moving to cursor-based paging breaks all of them.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Give the collection an iterator object that keeps the walking state (current page, a small buffer) and offers only \"give me the next item\". Callers use a normal for loop, and the collection is free to change how it stores or fetches data.",
  participants: [
    { role: "Iterator", name: "Iterator (Python __next__, Scala Iterator[T])", kind: "interface", description: "Offers next() and a way to know when the walk is over (StopIteration in Python, hasNext in Scala)." },
    { role: "Concrete iterator", name: "OrderIterator", kind: "concrete", description: "Remembers the current page and buffer, fetches the next page only when the buffer runs dry." },
    { role: "Aggregate", name: "OrderPages", kind: "concrete", description: "The data source. It hands out a fresh iterator for each loop and keeps its storage details private." },
    { role: "Client", name: "iteratorDemo", kind: "client", description: "Loops over the orders with a plain for loop and never sees a page number." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "Both languages build the pattern in. A Python generator function is an iterator: yield remembers the position for you. In Scala, Iterator.from, map, takeWhile and flatten express the same walk in one line. Write a class only when the iterator needs extra methods such as reset() or progress reporting.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Every Python for loop (__iter__ and __next__) and every Scala or Java collection.",
    "Database cursors that stream rows, and file objects that give one line at a time.",
    "Cloud SDK paginators (such as boto3 paginators) that hide page tokens from the caller.",
    "Java Streams and Python itertools, which chain lazy iterators into pipelines.",
  ],
  whenToUse: [
    "A collection has a complex or remote internal structure you want to hide.",
    "You need several ways to walk the same data (depth-first, shuffled, filtered).",
    "The data is too large to load at once and should be streamed lazily.",
  ],
  whenNotToUse: [
    "A plain list is already in memory: just loop over it.",
    "You need random access by index; an iterator only goes forward.",
  ],
  pros: [
    "Hides storage details behind one uniform loop for any collection (Single Responsibility).",
    "Lazy: items are fetched or computed only when needed.",
    "New ways of walking the data are new iterators; the collection does not change (Open/Closed).",
  ],
  cons: [
    "Single pass: once used up, an iterator is empty. Ask the collection for a fresh one.",
    "Changing the collection while iterating over it can cause errors or skipped items.",
  ],
  confusedWith: [
    { name: "Visitor", difference: "Visitor runs an operation on each element, chosen by element type. Iterator only gives access to the elements in order." },
    { name: "Composite", difference: "Composite builds the tree. An iterator is a common way to walk that tree without recursion in the caller." },
  ],
  solid:
    "Single Responsibility (walking the data is separated from storing it), Open/Closed (a new traversal is a new iterator, no change to the collection).",
  interviewUses: [
    "Playlist with in-order and shuffle modes",
    "Paginated feeds (news feed, order history)",
    "File-system tree walker",
    "\"Design an iterator over a nested list\" style questions",
    "Merging k sorted lists or streams",
  ],
  examples: [
    {
      id: "playlist",
      domain: "Music streaming",
      title: "Playlist with shuffle",
      situation:
        "A music app plays a playlist in order or shuffled, and two devices may be playing the same playlist at once. Keeping a single \"current song\" index inside the playlist makes the modes and the devices fight each other.",
      roles: [
        { role: "Iterator", name: "SongIterator" },
        { role: "Concrete iterator", name: "InOrder, Shuffled" },
        { role: "Aggregate", name: "Playlist" },
        { role: "Client", name: "play" },
      ],
      why: "Each play mode is its own iterator class, and each iterator keeps its own position. The playlist only hands them out, so new modes never touch it and many listeners can walk it at once.",
      goodToKnow:
        "The playlist gives each iterator a copy of the song list, so adding a song mid-play cannot break a running iterator. The shuffle uses a fixed seed so the demo prints the same order every time.",
      walkthrough: [
        "Five songs are added to the Road trip playlist.",
        "play() walks an InOrder iterator with hasNext and next, printing the songs as added.",
        "A Shuffled iterator mixes the positions with a seeded Fisher-Yates shuffle and walks them in that order.",
        "Two InOrder iterators are created; A skips ahead two songs.",
        "A is on the third song while B is still on the first, because each iterator keeps its own position.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "filetree",
      domain: "Developer tools",
      title: "File tree walker",
      situation:
        "A code search tool must look through every file under a project folder. Writing the recursive walk in every feature (search, lint, count lines) repeats code, and a search should stop as soon as it finds a match.",
      roles: [
        { role: "Iterator", name: "Iterator (Python protocol, Scala Iterator[String])" },
        { role: "Concrete iterator", name: "DepthFirst" },
        { role: "Aggregate", name: "Node" },
        { role: "Client", name: "fileTreeDemo" },
      ],
      why: "DepthFirst keeps its own stack, so callers get one path at a time with a plain loop. Because it is lazy, a search that finds its file early never visits the rest of the tree.",
      goodToKnow:
        "Using an explicit stack instead of recursion avoids hitting the recursion limit on very deep folders. A breadth-first walker would use a queue instead of a stack.",
      walkthrough: [
        "The project tree has 9 nodes: folders src, utils and tests, and their files.",
        "DepthFirst starts with the root on its stack.",
        "Each next() pops one node and pushes its children so the first child comes out next.",
        "The first loop prints every path, folder before its contents.",
        "The search stops at app/src/utils/money.py after visiting only 6 of the 9 nodes.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "statement",
      domain: "Fintech",
      title: "Merged bank statement",
      situation:
        "A banking app shows one statement built from UPI payments and card payments, which come from two different systems. Loading both lists fully and sorting them is wasteful when each feed is already sorted by date.",
      roles: [
        { role: "Iterator", name: "Iterator[Txn]" },
        { role: "Concrete iterator", name: "MergedStatement" },
        { role: "Aggregate", name: "Feed" },
        { role: "Client", name: "statementDemo" },
      ],
      why: "MergedStatement is an iterator built from two other iterators. It looks one item ahead in each feed and always returns the earlier one, so the merged statement comes out in date order without sorting anything.",
      goodToKnow:
        "This is the merge step of merge sort, and it works for k feeds with a heap. Both inputs must already be sorted; on equal days this version prefers the left feed.",
      walkthrough: [
        "Each Feed hands out a plain iterator over its own transactions.",
        "MergedStatement reads the first item of each feed as look-ahead.",
        "On each step it compares the two days and returns the earlier transaction.",
        "It then refills only the side it just used.",
        "The client keeps a running balance, starting at ₹10000 and ending at ₹68702.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "vitals",
      domain: "Healthcare",
      title: "Streaming patient vitals",
      situation:
        "A ward monitor reads a patient's heart rate all day. Glitches (0 or 250 bpm) must be dropped, and clean readings uploaded in small batches. Keeping a whole day of readings in memory before processing is not an option.",
      roles: [
        { role: "Aggregate", name: "readings (the sensor stream)" },
        { role: "Concrete iterator", name: "plausible, batches" },
        { role: "Client", name: "vitalsDemo" },
      ],
      why: "Each step is a small iterator that wraps the one before it, forming a lazy pipeline. A reading is pulled from the sensor only when the next batch needs it, so memory stays tiny.",
      goodToKnow:
        "Nothing runs when the pipeline is built; work happens only as the final loop pulls items. If nobody consumes the pipeline, no reading is ever taken.",
      walkthrough: [
        "readings, plausible and batches are chained, and nothing is read yet.",
        "The loop asks for the first batch, which pulls readings one at a time.",
        "250 bpm is dropped by plausible, so the first batch is 72, 75 and 78.",
        "The 0 bpm glitch is dropped from the second batch the same way.",
        "The last batch has only one reading, because the stream ended.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
