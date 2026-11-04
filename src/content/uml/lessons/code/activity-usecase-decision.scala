val stock = Map("book" -> 3, "lamp" -> 0)

def checkout(item: String): Unit =
  println(s"Checking stock for $item")           // action
  if stock(item) > 0 then                         // decision
    println("Ship now")                           // [in stock]
  else
    println("Back-order: ships next week")        // [out of stock]
  println("Send receipt")                         // after the merge

@main def demo(): Unit =
  checkout("book")
  checkout("lamp")
