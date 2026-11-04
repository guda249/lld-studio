// "Asha orders two books. Each line of the order has a price and a quantity."
// Nouns that hold data AND do something become classes.

class Customer

class LineItem

class Order

@main def demo(): Unit =
  for name <- List("Customer", "LineItem", "Order") do
    println(s"Class box: $name")
