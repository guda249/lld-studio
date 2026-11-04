import scala.collection.mutable.ArrayBuffer

class Playlist:
  val songs = ArrayBuffer.empty[String]
  def show: String = if songs.isEmpty then "(empty)" else songs.mkString(" | ")

// Does an edit, and remembers it as a tuple so undo can reverse it.
class PlaylistEditor(playlist: Playlist):
  private var history: List[(String, String, Int, Int)] = Nil

  def edit(action: String, song: String, to: Int = 0): Unit =
    val songs = playlist.songs
    action match
      case "add" =>
        songs += song
        history = ("add", song, 0, 0) :: history
      case "remove" =>
        val at = songs.indexOf(song)
        songs.remove(at)
        history = ("remove", song, at, 0) :: history
      case "move" =>
        val at = songs.indexOf(song)
        songs.insert(to, songs.remove(at))
        history = ("move", song, at, to) :: history

  // The same match again, backwards. Every new action means editing both methods.
  def undo(): Unit =
    val (action, song, at, to) = history.head
    history = history.tail
    val songs = playlist.songs
    action match
      case "add"    => songs -= song
      case "remove" => songs.insert(at, song)
      case "move"   => songs.insert(at, songs.remove(to))

@main def demo(): Unit =
  val playlist = Playlist()
  val editor = PlaylistEditor(playlist)
  for title <- List("Intro", "Sunrise", "Dust") do editor.edit("add", title)
  editor.edit("move", "Dust", to = 0)
  editor.edit("remove", "Sunrise")
  println(s"after edits: ${playlist.show}")
  editor.undo()
  println(s"undo remove: ${playlist.show}")
  editor.undo()
  println(s"undo move:   ${playlist.show}")
