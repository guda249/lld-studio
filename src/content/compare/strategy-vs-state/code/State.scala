sealed trait FanState:                        // state: how the fan behaves right now
  def rpm: Int
  def pull: FanState                          // each state knows what comes next

class Off extends FanState:
  def rpm: Int = 0
  def pull: FanState = Low()

class Low extends FanState:
  def rpm: Int = 600
  def pull: FanState = High()

class High extends FanState:
  def rpm: Int = 1200
  def pull: FanState = Off()

class Fan:                                    // context: starts Off, the states move it on
  private var state: FanState = Off()

  def pullChain(): Unit =                     // the user only pulls; the STATE decides where to go
    state = state.pull

  def run(): String = s"Fan at ${state.rpm} rpm"

@main def demo(): Unit =
  val fan = Fan()
  println(fan.run())
  for _ <- 1 to 3 do                          // the same action gives a different result each time
    fan.pullChain()
    println(fan.run())
