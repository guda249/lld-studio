import scala.collection.mutable
import scala.util.Random

abstract class TurnGame:
  final def play(players: List[String]): String =        // the template method
    setup(players)
    var turn = 0
    while !isOver && turn < maxTurns do
      takeTurn(players(turn % players.size))
      turn += 1
    s"$winner wins after $turn turns"

  protected def setup(players: List[String]): Unit = ()   // hook: nothing by default
  protected def maxTurns: Int = 100                       // hook: a safety limit

  protected def takeTurn(player: String): Unit
  protected def isOver: Boolean
  protected def winner: String

/* Take 1 to 3 sticks; whoever takes the last stick wins. */
class NimGame(start: Int) extends TurnGame:
  private var sticks = start
  private var last = ""

  protected def takeTurn(player: String): Unit =
    val take = if sticks % 4 == 0 then 1 else sticks % 4
    sticks -= take
    last = player
    println(s"  $player takes $take, $sticks left")

  protected def isOver: Boolean = sticks == 0
  protected def winner: String = last

/* First to reach the target score wins. */
class DiceRace(target: Int, seed: Int) extends TurnGame:
  private val rng = new Random(seed)
  private val scores = mutable.Map.empty[String, Int]

  override protected def setup(players: List[String]): Unit =
    players.foreach(p => scores(p) = 0)

  protected def takeTurn(player: String): Unit =
    scores(player) = scores(player) + rng.nextInt(6) + 1

  protected def isOver: Boolean = scores.values.exists(_ >= target)
  protected def winner: String = scores.maxBy(_._2)._1

@main def gameDemo(): Unit =
  println(s"Nim: ${NimGame(10).play(List("Asha", "Ravi"))}")
  println(s"Dice race: ${DiceRace(15, 7).play(List("Asha", "Ravi", "Meena"))}")
