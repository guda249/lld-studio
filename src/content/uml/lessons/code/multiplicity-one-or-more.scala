class OrderLine(val item: String, val qty: Int)

class Order(first: OrderLine, more: OrderLine*):   // 1..*: at least one
  val lines: List[OrderLine] = first :: more.toList

@main def demo(): Unit =
  println(Order(OrderLine("tea", 2)).lines.size)                        // 1
  println(Order(OrderLine("tea", 2), OrderLine("mug", 1)).lines.size)   // 2
  // Order() would not compile: an order needs at least one line
