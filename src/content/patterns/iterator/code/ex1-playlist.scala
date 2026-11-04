import scala.collection.mutable

trait SongIterator: // iterator interface, classic hasNext / next style
  def hasNext: Boolean
  def next(): String

class InOrder(songs: Vector[String]) extends SongIterator:
  private var pos = 0
  def hasNext: Boolean = pos < songs.size
  def next(): String =
    val song = songs(pos)
    pos += 1
    song

def shuffledIndices(n: Int, seed0: Long): Vector[Int] =
  val order = Array.range(0, n)
  var seed = seed0
  for i <- n - 1 to 1 by -1 do // Fisher-Yates with a tiny fixed-seed generator
    seed = (seed * 1103515245L + 12345L) % 2147483648L
    val j = (seed % (i + 1)).toInt
    val tmp = order(i)
    order(i) = order(j)
    order(j) = tmp
  order.toVector

class Shuffled(songs: Vector[String], seed: Long) extends SongIterator:
  private val order = shuffledIndices(songs.size, seed)
  private var pos = 0
  def hasNext: Boolean = pos < order.size
  def next(): String =
    val song = songs(order(pos))
    pos += 1
    song

class Playlist(val name: String): // aggregate: hands out iterators, keeps its list private
  private val songs = mutable.ArrayBuffer.empty[String]
  def add(title: String): Unit = songs += title
  def inOrder: SongIterator = InOrder(songs.toVector)
  def shuffled(seed: Long): SongIterator = Shuffled(songs.toVector, seed)

def play(label: String, it: SongIterator): Unit =
  val titles = mutable.ListBuffer.empty[String]
  while it.hasNext do titles += it.next()
  println(s"$label: ${titles.mkString(" -> ")}")

@main def playlistDemo(): Unit =
  val roadTrip = Playlist("Road trip")
  List("Monsoon Drive", "Chai at Dawn", "Highway 44", "Ghats Sunset", "Coastal Breeze").foreach(roadTrip.add)

  play("In order", roadTrip.inOrder)
  play("Shuffle ", roadTrip.shuffled(7))
  val a = roadTrip.inOrder
  val b = roadTrip.inOrder
  a.next()
  a.next()
  println(s"Two listeners: A is on ${a.next()}, B is on ${b.next()}")
