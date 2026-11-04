def checkout(inStock: Boolean): List[String] =
  val first = List("check stock")
  if inStock then                         // the diamond: one way or the other
    first ++ List("take payment", "ship order")
  else
    first :+ "tell customer"              // both ways end at the end dot

@main def demo(): Unit =
  println(checkout(true))    // List(check stock, take payment, ship order)
  println(checkout(false))   // List(check stock, tell customer)
