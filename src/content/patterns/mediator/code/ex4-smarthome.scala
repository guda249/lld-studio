class Device(val name: String): // colleague: reports to the hub and obeys it
  var on: Boolean = false
  var hub: Option[Hub] = None

  def report(event: String): Unit =
    println(s"$name: $event")
    hub.foreach(h => h.onEvent(this, event))

  def switch(turnOn: Boolean): Unit =
    if on != turnOn then
      on = turnOn
      println(s"  hub -> $name ${if turnOn then "ON" else "OFF"}")

class Hub(devices: Device*): // mediator: every cross-device rule lives in onEvent()
  private val byName: Map[String, Device] = devices.map(d => d.name -> d).toMap
  private var windowOpen = false
  devices.foreach(d => d.hub = Some(this))

  def onEvent(sender: Device, event: String): Unit =
    val light = byName("hall light")
    val ac = byName("AC")
    event match
      case "unlocked" =>
        light.switch(true)
        if windowOpen then println("  hub: window is open, AC stays off")
        else ac.switch(true)
      case "opened" if sender.name == "window" =>
        windowOpen = true
        ac.switch(false)
      case "closed" if sender.name == "window" =>
        windowOpen = false
        if light.on then ac.switch(true) // someone is home
      case "locked" =>
        light.switch(false)
        ac.switch(false)
      case _ => println("  hub: no rule for this event")

@main def smartHomeDemo(): Unit =
  val door = Device("front door")
  val window = Device("window")
  val light = Device("hall light")
  val ac = Device("AC")
  val hub = Hub(door, window, light, ac)
  window.report("opened")
  door.report("unlocked")
  window.report("closed")
  light.report("flickering")
  door.report("locked")
