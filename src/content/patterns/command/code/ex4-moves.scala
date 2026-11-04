class Hero: // receiver
  var x: Int = 0
  var y: Int = 0

  def move(dx: Int, dy: Int): Unit =
    x += dx
    y += dy

  def position: String = s"($x, $y)"

trait Command:
  def name: String
  def execute(): Unit
  def undo(): Unit

class Move(hero: Hero, val name: String, dx: Int, dy: Int) extends Command:
  def execute(): Unit = hero.move(dx, dy)
  def undo(): Unit = hero.move(-dx, -dy)

class Combo(val name: String, steps: List[Command]) extends Command: // macro command
  def execute(): Unit = steps.foreach(_.execute())
  def undo(): Unit = steps.reverse.foreach(_.undo())

class Game(hero: Hero): // invoker with undo and redo stacks
  private var undoStack: List[Command] = Nil
  private var redoStack: List[Command] = Nil

  private def show(action: String): Unit =
    println(s"${action.padTo(12, ' ')} hero at ${hero.position}")

  def play(command: Command): Unit =
    command.execute()
    undoStack = command :: undoStack
    redoStack = Nil // a new move makes the old future invalid
    show(s"play ${command.name}")

  def undo(): Unit = undoStack match
    case last :: rest =>
      last.undo()
      undoStack = rest
      redoStack = last :: redoStack
      show(s"undo ${last.name}")
    case Nil => println("nothing to undo")

  def redo(): Unit = redoStack match
    case next :: rest =>
      next.execute()
      redoStack = rest
      undoStack = next :: undoStack
      show(s"redo ${next.name}")
    case Nil => println("nothing to redo")

@main def movesDemo(): Unit =
  val hero = Hero()
  val game = Game(hero)
  game.play(Move(hero, "right", 1, 0))
  game.play(Move(hero, "up", 0, 1))
  game.play(Combo("dash", List.fill(3)(Move(hero, "right", 1, 0))))
  game.undo()
  game.undo()
  game.redo()
  game.play(Move(hero, "down", 0, -1))
  game.redo()
