import scala.collection.mutable.ListBuffer

class Song(val title: String)

class Playlist:
  val songs = ListBuffer[Song]()           // *: a list that may be empty
  def add(song: Song): Unit = songs += song

@main def demo(): Unit =
  val mix = Playlist()
  println(mix.songs.size)                  // 0 is fine
  mix.add(Song("Morning Rain"))
  mix.add(Song("City Lights"))
  println(mix.songs.map(_.title))
