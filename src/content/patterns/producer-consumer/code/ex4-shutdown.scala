import java.util.concurrent.{BlockingQueue, ConcurrentLinkedQueue, LinkedBlockingQueue}

val Stop = "<stop>"

class SmsSender(outbox: BlockingQueue[String], sent: ConcurrentLinkedQueue[String]) extends Thread:  // consumer
  setDaemon(true)                                    // a stuck sender cannot keep the JVM alive

  override def run(): Unit =
    var message = outbox.take()
    while message != Stop do
      sent.add(message)
      message = outbox.take()

def deployShutdown(senders: Int, pills: Int): String =
  val outbox = LinkedBlockingQueue[String]()
  val sent = ConcurrentLinkedQueue[String]()
  val workers = List.fill(senders)(SmsSender(outbox, sent))
  workers.foreach(_.start())
  for n <- 1 to 6 do outbox.put(s"OTP $n")          // 6 messages, all queued before any pill
  for _ <- 1 to pills do outbox.put(Stop)
  workers.foreach(_.join(50))                        // a sender with no pill waits on take() forever
  val stuck = workers.count(_.isAlive)
  s"${sent.size} sent, ${senders - stuck} of $senders stopped, $stuck stuck"

@main def shutdownDemo(): Unit =
  for senders <- List(2, 3); pills <- List(1, 2, 3) do
    println(s"$senders senders, $pills pill(s): ${deployShutdown(senders, pills)}")
