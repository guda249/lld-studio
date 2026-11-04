class Phone(code: String):
  var state = "Locked"
  private var wrong = 0

  def pin(p: String): Unit =  // event: pin
    if state == "Locked" then
      if p == code then  // guard [ok]
        state = "Unlocked"
        println("  action: unlock")
      else
        wrong += 1
        if wrong == 3 then  // guard [3 wrong]
          state = "Blocked"
          println("  action: alarm")

  def timeout(): Unit =  // event: timeout
    if state == "Unlocked" then
      state = "Locked"
      println("  action: lock")

@main def demo(): Unit =
  val phone = Phone("1234")
  for p <- List("0000", "1234") do
    phone.pin(p)
    println(s"$p -> ${phone.state}")
  phone.timeout()
  println(s"timeout -> ${phone.state}")
