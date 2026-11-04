import type { ReviewCase } from "../cases";

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct (different domain): a bookshelf hands out a fresh iterator",
    lang: "python",
    expect: {"found":true,"ids":["iterator.protocol","iterator.keeps-position","iterator.aggregate"],"none":["iterator.single-pass","iterator.missing-iter"]},
    code: `class Shelf:
    def __init__(self) -> None:
        self._books: list[str] = []

    def add(self, title: str) -> None:
        self._books.append(title)

    def __iter__(self) -> "ShelfIterator":
        return ShelfIterator(self._books)


class ShelfIterator:
    def __init__(self, books: list[str]) -> None:
        self._books = books
        self._index = 0

    def __iter__(self) -> "ShelfIterator":
        return self

    def __next__(self) -> str:
        if self._index >= len(self._books):
            raise StopIteration
        book = self._books[self._index]
        self._index += 1
        return book


shelf = Shelf()
shelf.add("Dune")
shelf.add("Emma")
for b in shelf:
    print(b)`
  },
  {
    name: "2 Python, buggy: collection is its own iterator, no __iter__, never moves",
    lang: "python",
    expect: {"found":true,"ids":["iterator.missing-iter","iterator.single-pass","iterator.no-position"]},
    code: `class Playlist:
    def __init__(self) -> None:
        self.songs: list[str] = []
        self.pos = 0

    def add(self, song: str) -> None:
        self.songs.append(song)

    def __next__(self) -> str:
        if self.pos >= len(self.songs):
            raise StopIteration
        return self.songs[self.pos]


p = Playlist()
p.add("a")
print(next(p))`
  },
  {
    name: "3 Scala 3, correct: extends Iterator, collection returns the iterator",
    lang: "scala",
    expect: {"found":true,"ids":["iterator.protocol","iterator.keeps-position","iterator.aggregate"],"none":["iterator.extend-iterator","iterator.no-position"]},
    code: `class Countdown(from: Int):
  def iterator: Iterator[Int] = CountdownIterator(from)

class CountdownIterator(start: Int) extends Iterator[Int]:
  private var current = start
  def hasNext: Boolean = current > 0
  def next(): Int =
    val n = current
    current -= 1
    n

@main def demo(): Unit =
  for n <- Countdown(3).iterator do println(n)`
  },
  {
    name: "4 Scala 3, custom interface; collection returns the concrete iterator",
    lang: "scala",
    expect: {"found":true,"ids":["iterator.extend-iterator","iterator.returns-concrete"]},
    code: `trait PageIterator:
  def hasNext: Boolean
  def next(): String

class Pages(pages: Vector[String]):
  def walk(): ForwardPages = ForwardPages(pages)

class ForwardPages(pages: Vector[String]) extends PageIterator:
  private var i = 0
  def hasNext: Boolean = i < pages.size
  def next(): String =
    i += 1
    pages(i - 1)

class BackwardPages(pages: Vector[String]) extends PageIterator:
  private var i = pages.size
  def hasNext: Boolean = i > 0
  def next(): String =
    i -= 1
    pages(i)

@main def demo(): Unit =
  val it = Pages(Vector("a", "b")).walk()
  while it.hasNext do println(it.next())`
  },
  {
    name: "5 Python, not Iterator: the client walks pages by hand",
    lang: "python",
    expect: {"found":false,"ids":["iterator.no-shape","iterator.client-walks"]},
    code: `class Inbox:
    def __init__(self) -> None:
        self.mails = ["a", "b", "c", "d"]

    def get(self, i: int) -> str:
        return self.mails[i]


inbox = Inbox()
print(inbox.get(0))
print(inbox.get(1))
print(inbox.get(2))`
  },
  {
    name: "6 Python, generator function (light form)",
    lang: "python",
    expect: {"found":true,"ids":["iterator.light-form"]},
    code: `from collections.abc import Iterator


def evens(limit: int) -> Iterator[int]:
    n = 0
    while n < limit:
        yield n
        n += 2


for e in evens(10):
    print(e)`
  },
  {
    name: "Python, __next__ without StopIteration: the loop never ends cleanly",
    lang: "python",
    expect: { found: true, ids: ["iterator.no-stop"], none: ["iterator.stops"] },
    code: `class Countdown:
    def __init__(self, start: int) -> None:
        self._n = start

    def __iter__(self) -> "Countdown":
        return self

    def __next__(self) -> int:
        self._n -= 1
        return self._n + 1


for x in Countdown(3):
    print(x)
    if x < -2:
        break
`
  }
];

export default cases;
