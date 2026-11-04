import scala.collection.mutable

type Square = (Int, Int) // (file 0-7 = a-h, rank 0-7 = 1-8)

def parse(name: String): Square = (name(0) - 'a', name(1) - '1')

enum Color(val label: String):
  case White extends Color("white")
  case Black extends Color("black")

  def opponent: Color = if this == White then Black else White

enum Status(val label: String):
  case Active extends Status("active")
  case Check extends Status("check")
  case Resigned extends Status("resigned")
  case Draw extends Status("draw")

/** Template Method: canMove runs the checks every piece shares, then asks the subclass about its shape. */
abstract class Piece(val color: Color):
  def letter: Char
  def name: String = getClass.getSimpleName

  def canMove(board: Board, src: Square, dst: Square): Boolean =
    if src == dst || !board.inside(dst) then false
    else
      val target = board.at(dst)
      if target.exists(_.color == color) then false // never capture your own piece
      else shapeOk(board, src, dst, dst._1 - src._1, dst._2 - src._2, target.isDefined)

  protected def shapeOk(board: Board, src: Square, dst: Square, dx: Int, dy: Int, capture: Boolean): Boolean

  def symbol: Char = if color == Color.White then letter else letter.toLower

class King(side: Color) extends Piece(side):
  val letter = 'K'
  protected def shapeOk(board: Board, src: Square, dst: Square, dx: Int, dy: Int, capture: Boolean) =
    math.max(dx.abs, dy.abs) == 1

class Knight(side: Color) extends Piece(side):
  val letter = 'N'
  protected def shapeOk(board: Board, src: Square, dst: Square, dx: Int, dy: Int, capture: Boolean) =
    Set(dx.abs, dy.abs) == Set(1, 2) // jumps, so nothing can block it

class Rook(side: Color) extends Piece(side):
  val letter = 'R'
  protected def shapeOk(board: Board, src: Square, dst: Square, dx: Int, dy: Int, capture: Boolean) =
    (dx == 0 || dy == 0) && board.pathClear(src, dst)

class Bishop(side: Color) extends Piece(side):
  val letter = 'B'
  protected def shapeOk(board: Board, src: Square, dst: Square, dx: Int, dy: Int, capture: Boolean) =
    dx.abs == dy.abs && board.pathClear(src, dst)

class Queen(side: Color) extends Piece(side):
  val letter = 'Q'
  protected def shapeOk(board: Board, src: Square, dst: Square, dx: Int, dy: Int, capture: Boolean) =
    (dx == 0 || dy == 0 || dx.abs == dy.abs) && board.pathClear(src, dst)

class Pawn(side: Color) extends Piece(side):
  val letter = 'P'
  protected def shapeOk(board: Board, src: Square, dst: Square, dx: Int, dy: Int, capture: Boolean) =
    val step = if color == Color.White then 1 else -1
    val startRank = if color == Color.White then 1 else 6
    if capture then dx.abs == 1 && dy == step // pawns capture diagonally only
    else if dx != 0 then false
    else dy == step || (dy == 2 * step && src._2 == startRank && board.pathClear(src, dst))

class Board:
  private val grid = mutable.Map.empty[Square, Piece]

  def placeStandard(): Unit =
    val back = List[Color => Piece](Rook(_), Knight(_), Bishop(_), Queen(_), King(_), Bishop(_), Knight(_), Rook(_))
    for (make, file) <- back.zipWithIndex do
      grid((file, 0)) = make(Color.White)
      grid((file, 7)) = make(Color.Black)
      grid((file, 1)) = Pawn(Color.White)
      grid((file, 6)) = Pawn(Color.Black)

  def inside(sq: Square): Boolean = sq._1 >= 0 && sq._1 < 8 && sq._2 >= 0 && sq._2 < 8

  def at(sq: Square): Option[Piece] = grid.get(sq)

  def put(sq: Square, piece: Option[Piece]): Unit = piece match
    case Some(p) => grid(sq) = p
    case None => grid.remove(sq)

  /** Every square strictly between src and dst (straight or diagonal) is empty. */
  def pathClear(src: Square, dst: Square): Boolean =
    val (sx, sy) = ((dst._1 - src._1).sign, (dst._2 - src._2).sign)
    Iterator.iterate((src._1 + sx, src._2 + sy))((x, y) => (x + sx, y + sy))
      .takeWhile(_ != dst)
      .forall(sq => !grid.contains(sq))

  def inCheck(color: Color): Boolean =
    val king = grid.collectFirst { case (sq, p: King) if p.color == color => sq }.get
    grid.toList.exists((sq, p) => p.color != color && p.canMove(this, sq, king))

  def show: String =
    val rows = (7 to 0 by -1).map { rank =>
      val cells = (0 until 8).map(file => at((file, rank)).map(_.symbol).getOrElse('.')).mkString
      s"  ${rank + 1} $cells"
    }
    (rows :+ "    abcdefgh").mkString("\n")

/** Command: knows how to apply itself to a board and how to take itself back. */
class Move(val src: Square, val dst: Square, val piece: Piece):
  var captured: Option[Piece] = None

  def execute(board: Board): Unit =
    captured = board.at(dst)
    board.put(dst, Some(piece))
    board.put(src, None)

  def undo(board: Board): Unit =
    board.put(src, Some(piece))
    board.put(dst, captured)

class Game:
  val board = Board()
  board.placeStandard()
  var turn: Color = Color.White
  var status: Status = Status.Active
  private val history = mutable.Stack.empty[Move]

  def move(srcName: String, dstName: String): String =
    val (src, dst) = (parse(srcName), parse(dstName))
    board.at(src) match
      case _ if status == Status.Resigned || status == Status.Draw => "rejected: the game is over"
      case None => s"rejected: no piece on $srcName"
      case Some(p) if p.color != turn => s"rejected: it is ${turn.label}'s turn"
      case Some(p) if !p.canMove(board, src, dst) => s"rejected: a ${p.name} can't go $srcName-$dstName"
      case Some(p) =>
        val mv = Move(src, dst, p)
        mv.execute(board)
        if board.inCheck(turn) then // try it, look, take it back: Command makes this cheap
          mv.undo(board)
          "rejected: that leaves your king in check"
        else
          history.push(mv)
          nextTurn()
          val took = mv.captured.map(c => s" takes ${c.name}").getOrElse("")
          s"${p.name} $srcName-$dstName$took [${status.label}]"

  def undo(): Unit =
    if history.nonEmpty && status != Status.Resigned then
      history.pop().undo(board)
      nextTurn()

  def resign(): String =
    status = Status.Resigned
    s"${turn.label} resigns, ${turn.opponent.label} wins [${status.label}]"

  private def nextTurn(): Unit =
    turn = turn.opponent
    status = if board.inCheck(turn) then Status.Check else Status.Active

@main def demo(): Unit =
  val game = Game()
  val script = List(("e2", "e4"), ("e7", "e5"), ("a2", "a3"), ("UNDO", ""), ("d7", "d5"), ("e4", "e5"),
    ("f1", "c4"), ("b8", "c6"), ("d1", "h5"), ("g8", "f6"), ("h5", "f7"), ("e8", "e7"), ("e8", "f7"))
  for (src, dst) <- script do
    if src == "UNDO" then
      game.undo()
      println(s"undo        -> back to ${game.turn.label} to move")
    else
      val who = game.turn.label
      println(f"$who%-5s $src-$dst -> ${game.move(src, dst)}")
  println(game.resign())
  println(game.move("a7", "a6"))
  println(game.board.show)
