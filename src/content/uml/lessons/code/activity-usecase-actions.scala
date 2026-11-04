import scala.collection.mutable.ListBuffer

def addItems(cart: ListBuffer[String]): Unit =
  cart ++= List("book", "pen")
  println(s"Added $cart")

def pay(cart: ListBuffer[String]): Unit =
  println(s"Paid for ${cart.size} items")

def sendReceipt(): Unit = println("Receipt sent")

def checkout(): Unit =          // start: the call begins
  val cart = ListBuffer.empty[String]
  addItems(cart)                // action 1
  pay(cart)                     // action 2
  sendReceipt()                 // action 3
  // end: the method returns

@main def demo(): Unit = checkout()
