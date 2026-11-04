import scala.collection.mutable.ListBuffer

trait Notifier:
  def send(text: String): Unit

class Customer(val name: String)

class LineItem(val product: String, val price: Double)

class Receipt(var total: Double)

class Order(val customer: Customer):                    // passed in, kept: association
  val items: ListBuffer[LineItem] = ListBuffer()        // a collection of parts: aggregation
  val receipt = Receipt(0.0)                            // created here: composition

  def add(item: LineItem): Unit =                       // items are made outside, then added
    items += item
    receipt.total += item.price

  def place(notifier: Notifier): Unit =                 // only a parameter: dependency
    notifier.send(s"${customer.name} paid ${receipt.total}")

class PrintNotifier extends Notifier:
  def send(text: String): Unit = println(text)

@main def demo(): Unit =
  val order = Order(Customer("Asha"))
  order.add(LineItem("Book", 250.0))
  order.add(LineItem("Pen", 20.0))
  order.place(PrintNotifier())
