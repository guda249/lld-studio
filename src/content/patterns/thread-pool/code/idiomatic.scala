import java.util.concurrent.Executors
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration.*
import scala.util.{Failure, Success, Try}

// The JDK already has thread pools (Executors). Wrap one in an ExecutionContext and
// every Future runs on its fixed set of threads. Future.traverse submits all the
// tasks and gives back one Future with every result, in input order.
def makeInvoice(orderId: Int): String =
  if orderId == 7 then throw IllegalArgumentException("order 7 has no address")
  s"invoice-$orderId.pdf"

@main def idiomaticPoolDemo(): Unit =
  val pool = Executors.newFixedThreadPool(3)
  given ExecutionContext = ExecutionContext.fromExecutorService(pool)

  val all: Future[Seq[Try[String]]] =
    Future.traverse(1 to 10)(id => Future(makeInvoice(id)).transform(t => Success(t)))
  val results = Await.result(all, 2.seconds)
  pool.shutdown()                                    // always shut the pool down

  val ready = results.collect { case Success(file) => file }
  val failed = results.collect { case Failure(e) => e.getMessage }
  println(s"Invoices ready: ${ready.size}")
  println(s"First three: ${ready.take(3).toList}")
  println(s"Failed: ${failed.toList}")
