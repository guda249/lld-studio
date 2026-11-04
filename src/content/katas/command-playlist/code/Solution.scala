import scala.collection.mutable.ArrayBuffer

class Playlist:
  val songs = ArrayBuffer.empty[String]
  def show: String = if songs.isEmpty then "(empty)" else songs.mkString(" | ")

trait Command:
  def execute(): Unit
  def undo(): Unit

class AddSong(playlist: Playlist, song: String) extends Command:
  def execute(): Unit = playlist.songs += song
  def undo(): Unit = playlist.songs -= song

class RemoveSong(playlist: Playlist, song: String) extends Command:
  private var at = 0 // remembered during execute, so undo can put it back

  def execute(): Unit =
    at = playlist.songs.indexOf(song)
    playlist.songs.remove(at)

  def undo(): Unit = playlist.songs.insert(at, song)

class MoveSong(playlist: Playlist, song: String, to: Int) extends Command:
  private var at = 0

  def execute(): Unit =
    at = playlist.songs.indexOf(song)
    playlist.songs.insert(to, playlist.songs.remove(at))

  def undo(): Unit = playlist.songs.insert(at, playlist.songs.remove(to))

// The invoker: runs any Command and keeps a history for undo. It never names a concrete command.
class PlaylistEditor:
  private var history: List[Command] = Nil

  def run(command: Command): Unit =
    command.execute()
    history = command :: history

  def undo(): Unit =
    history.head.undo()
    history = history.tail

@main def demo(): Unit =
  val playlist = Playlist()
  val editor = PlaylistEditor()
  for title <- List("Intro", "Sunrise", "Dust") do editor.run(AddSong(playlist, title))
  editor.run(MoveSong(playlist, "Dust", to = 0))
  editor.run(RemoveSong(playlist, "Sunrise"))
  println(s"after edits: ${playlist.show}")
  editor.undo()
  println(s"undo remove: ${playlist.show}")
  editor.undo()
  println(s"undo move:   ${playlist.show}")
