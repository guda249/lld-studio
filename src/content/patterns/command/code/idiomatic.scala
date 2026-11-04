import scala.collection.mutable

// Without undo, a command is just a function with no arguments.
def sendEmail(to: String): () => Unit = () => println(s"email sent to $to")

def chargeCard(user: String, amount: Int): () => Unit = () => println(s"charged $user ₹$amount")

@main def idiomaticCommand(): Unit =
  val queue = mutable.Queue.empty[() => Unit]
  queue.enqueue(sendEmail("asha@example.com"))
  queue.enqueue(chargeCard("ravi", 499))
  queue.enqueue(() => println("cache cleared"))
  println(s"${queue.size} commands queued, running them now:")
  while queue.nonEmpty do
    val command = queue.dequeue()
    command()
