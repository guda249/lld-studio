// Fragile base class: the subclass depends on HOW the base class does its work.
import scala.collection.mutable

class Playlist:
  val songs = mutable.ListBuffer.empty[String]
  def add(song: String): Unit = songs += song
  def addAll(list: List[String]): Unit =
    list.foreach(add) // an internal detail... that subclasses now rely on

class CountingPlaylist extends Playlist:
  var added = 0
  override def add(song: String): Unit =
    added += 1
    super.add(song)
  override def addAll(list: List[String]): Unit =
    added += list.size // counted here AND again inside add()
    super.addAll(list)

@main def deepInheritanceFragile(): Unit =
  val p = CountingPlaylist()
  p.addAll(List("Raga", "Blues"))
  println(s"songs: ${p.songs.size} counted: ${p.added}") // songs: 2 counted: 4
