import scala.collection.mutable

final case class GameSave(x: Int, y: Int, moves: Int)   // memento

class Player:                                           // originator
  private var x = 0
  private var y = 0
  private var moves = 0

  def step(direction: Char): Unit =
    val (dx, dy) = direction match
      case 'U' => (0, 1)
      case 'D' => (0, -1)
      case 'L' => (-1, 0)
      case _ => (1, 0)
    x += dx
    y += dy
    moves += 1

  def where: String = s"($x,$y) after $moves moves"

  def save(): GameSave = GameSave(x, y, moves)

  def restore(s: GameSave): Unit =
    x = s.x
    y = s.y
    moves = s.moves

class UndoRedo(player: Player):                         // caretaker with two stacks
  private val undoStack = mutable.Stack.empty[GameSave]
  private val redoStack = mutable.Stack.empty[GameSave]

  def play(direction: Char): Unit =
    undoStack.push(player.save())
    redoStack.clear()                                   // a new move throws away the redo branch
    player.step(direction)

  def undo(): Unit =
    if undoStack.nonEmpty then
      redoStack.push(player.save())
      player.restore(undoStack.pop())

  def redo(): Unit =
    if redoStack.nonEmpty then
      undoStack.push(player.save())
      player.restore(redoStack.pop())

@main def gameUndoRedo(): Unit =
  val player = Player()
  val game = UndoRedo(player)
  for d <- "RRU" do game.play(d)
  println(s"Played RRU: ${player.where}")
  game.undo()
  game.undo()
  println(s"Undo x2: ${player.where}")
  game.redo()
  println(s"Redo: ${player.where}")
  game.play('L')
  game.redo()                                           // nothing to redo any more
  println(s"New move L, then redo: ${player.where}")
