class VendingMachine:
  val price = 50
  var state = "Idle"
  var credit = 0

  def coin(value: Int): Unit =
    if state == "Idle" then state = "Collecting"  // Idle -> Collecting
    credit += value  // self-transition

  def pick(): Unit =
    if state == "Collecting" && credit >= price then
      println(s"  action: vend (credit $credit)")
      state = "Idle"
      credit = 0

@main def demo(): Unit =
  val vm = VendingMachine()
  for c <- List(20, 20, 10) do
    vm.coin(c)
    println(s"coin $c -> ${vm.state}, credit ${vm.credit}")
  vm.pick()
  println(s"pick -> ${vm.state}")
