// Before: every invoice gets a brand-new thread. Starting a thread costs time and
// memory, nothing limits how many run at once, and the invoice the thread makes
// has nowhere to go: a Runnable returns Unit.

var created = 0                                      // how many threads we have started

def makeInvoice(orderId: Int): String =
  s"invoice-$orderId.pdf"                            // nobody ever sees this value

def handleOrders(orderIds: Seq[Int]): Unit =
  val threads = orderIds.map { id =>
    val t = Thread(() => { makeInvoice(id); () })            // one new thread per task
    t.start()                                        // no limit: a burst starts a burst of threads
    created += 1
    t
  }
  threads.foreach(_.join())                          // each thread dies after one invoice

@main def threadPerTaskDemo(): Unit =
  handleOrders(1 to 10)
  println(s"10 orders -> threads created: $created")
  handleOrders(11 to 1010)
  println(s"1,010 orders -> threads created: $created")
  println("Invoices handed back to the caller: none")
