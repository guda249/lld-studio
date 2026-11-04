sealed trait PlayerState:                              // state (shared, stateless objects)
  def label: String
  def pressPlay(p: MusicPlayer): Unit

  def pressStop(p: MusicPlayer): Unit =
    p.position = 0
    p.changeTo(Stopped)

case object Stopped extends PlayerState:
  val label = "stopped"

  def pressPlay(p: MusicPlayer): Unit =
    println(s"  start '${p.track}' from 0:00")
    p.changeTo(Playing)

  override def pressStop(p: MusicPlayer): Unit = println("  already stopped")

case object Playing extends PlayerState:
  val label = "playing"

  def pressPlay(p: MusicPlayer): Unit =                // the same button now pauses
    p.position += 42                                   // pretend 42 seconds were heard
    println(f"  pause at 0:${p.position}%02d")
    p.changeTo(Paused)

case object Paused extends PlayerState:
  val label = "paused"

  def pressPlay(p: MusicPlayer): Unit =
    println(f"  resume from 0:${p.position}%02d")
    p.changeTo(Playing)

class MusicPlayer(val track: String):                  // context
  var position = 0
  private var state: PlayerState = Stopped

  def changeTo(next: PlayerState): Unit =
    state = next
    println(s"  [${next.label}]")

  def pressPlay(): Unit = state.pressPlay(this)
  def pressStop(): Unit = state.pressStop(this)

@main def playerDemo(): Unit =
  val player = MusicPlayer("Kesariya")
  for button <- List("play", "play", "play", "stop", "stop") do
    println(s"press $button")
    if button == "play" then player.pressPlay() else player.pressStop()
