trait PlayerState:  // one class per state
  def press(player: Player): Unit

class Playing extends PlayerState:
  def press(player: Player): Unit =
    player.state = Paused()  // transition

class Paused extends PlayerState:
  def press(player: Player): Unit =
    player.state = Playing()

class Player:
  var state: PlayerState = Paused()  // initial state
  def press(): Unit = state.press(this)  // the state decides

@main def demo(): Unit =
  val player = Player()
  for _ <- 1 to 3 do
    player.press()
    println(player.state.getClass.getSimpleName)
