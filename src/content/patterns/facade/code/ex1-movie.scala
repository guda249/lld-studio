class Lights:
  def dim(level: Int): String = s"lights at $level%"

class AirConditioner:
  def setTemp(celsius: Int): String = s"AC at ${celsius}°C"

class Projector:
  def on(): String = "projector on"
  def off(): String = "projector off"

class SoundBar:
  def surround(volume: Int): String = s"sound bar surround, volume $volume"
  def mute(): String = "sound bar muted"

// One button in the app; four devices behind it.
class HomeTheaterFacade(lights: Lights, ac: AirConditioner,
                        projector: Projector, sound: SoundBar):
  def watchMovie(title: String): List[String] =
    List(lights.dim(10), ac.setTemp(24), projector.on(), sound.surround(30), s"playing $title")

  def endMovie(): List[String] =
    List(sound.mute(), projector.off(), lights.dim(80))

@main def movieMode(): Unit =
  val home = HomeTheaterFacade(Lights(), AirConditioner(), Projector(), SoundBar())
  println(s"Movie mode: ${home.watchMovie("Sholay").mkString("; ")}")
  println(s"Movie over: ${home.endMovie().mkString("; ")}")
