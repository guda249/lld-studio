enum DoorState:  // one case per state box
  case Open, Closed, Locked

class Door:
  var state: DoorState = DoorState.Closed  // current state

  private def go(start: DoorState, end: DoorState): Unit =
    if state == start then state = end  // in the right state?

  def open(): Unit = go(DoorState.Closed, DoorState.Open)
  def close(): Unit = go(DoorState.Open, DoorState.Closed)
  def lock(): Unit = go(DoorState.Closed, DoorState.Locked)
  def unlock(): Unit = go(DoorState.Locked, DoorState.Closed)

@main def demo(): Unit =
  val door = Door()
  door.lock()
  door.open()  // ignored: a locked door can't open
  println(door.state)  // Locked
