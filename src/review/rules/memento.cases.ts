import type { ReviewCase } from "../cases";

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, other domain (playlist with a copied list)",
    lang: "python",
    expect: {"found":true,"ids":["memento.shape","memento.restores","memento.immutable","memento.copies-state","memento.caretaker-stores"],"none":["memento.shares-live-state","memento.no-restore","memento.mutable"]},
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class PlaylistSnapshot:
    songs: tuple[str, ...]
    volume: int

class Playlist:
    def __init__(self) -> None:
        self._songs: list[str] = []
        self._volume = 5

    def add(self, song: str) -> None:
        self._songs.append(song)

    def snapshot(self) -> PlaylistSnapshot:
        return PlaylistSnapshot(tuple(self._songs), self._volume)

    def go_back(self, snap: PlaylistSnapshot) -> None:
        self._songs = list(snap.songs)
        self._volume = snap.volume

class Undo:
    def __init__(self) -> None:
        self._saved: list[PlaylistSnapshot] = []

    def keep(self, snap: PlaylistSnapshot) -> None:
        self._saved.append(snap)

    def last(self) -> PlaylistSnapshot:
        return self._saved.pop()

p, undo = Playlist(), Undo()
undo.keep(p.snapshot())
p.add("Kesariya")
p.go_back(undo.last())`
  },
  {
    name: "2 Python, buggy: snapshot shares the live list and has a setter",
    lang: "python",
    expect: {"found":true,"ids":["memento.shares-live-state","memento.mutable"],"none":["memento.copies-state","memento.immutable"]},
    code: `class BoardState:
    def __init__(self, pieces: list[str]) -> None:
        self.pieces = pieces

    def set_pieces(self, pieces: list[str]) -> None:
        self.pieces = pieces

class Board:
    def __init__(self) -> None:
        self._pieces = ["K", "Q"]

    def move(self, piece: str) -> None:
        self._pieces.append(piece)

    def save(self) -> BoardState:
        return BoardState(self._pieces)

    def restore(self, state: BoardState) -> None:
        self._pieces = state.pieces

b = Board()
s = b.save()
b.move("N")
b.restore(s)`
  },
  {
    name: "3 Scala 3, buggy: caretaker builds the memento, originator can't restore",
    lang: "scala",
    expect: {"found":true,"ids":["memento.caretaker-creates","memento.no-restore"],"none":["memento.restores","memento.caretaker-stores"]},
    code: `final case class FormState(name: String, age: Int)

class Form:
  var name = ""
  var age = 0
  def save(): FormState = FormState(name, age)

class FormHistory:
  private var states = List.empty[FormState]
  def backup(f: Form): Unit = states = FormState(f.name, f.age) :: states
  def push(s: FormState): Unit = states = s :: states

@main def form(): Unit =
  val f = Form()
  val h = FormHistory()
  h.push(f.save())
  f.name = "Asha"`
  },
  {
    name: "4 Scala 3, not Memento: history copies the fields itself",
    lang: "scala",
    expect: {"found":false,"ids":["memento.no-shape","memento.reaches-in"]},
    code: `class Thermostat:
  var target = 21.0
  var mode = "auto"

class Settings:
  private var saved = List.empty[(Double, String)]

  def backup(t: Thermostat): Unit = saved = (t.target, t.mode) :: saved

  def undo(t: Thermostat): Unit = saved match
    case (tg, md) :: rest =>
      t.target = tg
      t.mode = md
      saved = rest
    case Nil => ()

@main def heat(): Unit =
  val t = Thermostat()
  val s = Settings()
  s.backup(t)
  t.target = 25
  s.undo(t)`
  },
  {
    name: "5 Scala 3, immutable values (idiomatic form)",
    lang: "scala",
    expect: {"found":true,"ids":["memento.immutable-state"],"none":["memento.no-shape"]},
    code: `final case class Score(home: Int = 0, away: Int = 0):
  def homeScores: Score = copy(home = home + 1)
  def awayScores: Score = copy(away = away + 1)

@main def scores(): Unit =
  val history = List(Score()).prepended(Score().homeScores)
  println(history.head)
  println(history.tail.head)`
  }
];

export default cases;
