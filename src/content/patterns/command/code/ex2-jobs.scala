import scala.collection.mutable

// Command: everything needed to do one piece of work later.
abstract class Job:
  var attempts: Int = 0
  def name: String
  def run(): Unit // throws on failure

class SendSms(phone: String, text: String) extends Job:
  val name = s"SendSms($phone)"
  def run(): Unit = println(s"  SMS to $phone: $text")

class GenerateInvoice(orderId: Int, amount: Int) extends Job:
  val name = s"GenerateInvoice($orderId)"
  def run(): Unit = println(s"  invoice INV-$orderId for ₹$amount")

class SyncPayment(txnId: String, failures: Int) extends Job: // fails this many times first
  val name = s"SyncPayment($txnId)"
  def run(): Unit =
    if attempts <= failures then throw RuntimeException("bank API timeout")
    println(s"  payment $txnId synced")

class JobQueue(maxAttempts: Int = 3): // invoker: runs jobs later and retries failures
  private val queue = mutable.Queue.empty[Job]

  def submit(job: Job): Unit = queue.enqueue(job)

  def work(): Unit =
    while queue.nonEmpty do
      val job = queue.dequeue()
      job.attempts += 1
      try
        job.run()
        println(s"done ${job.name} (attempt ${job.attempts})")
      catch
        case err: RuntimeException =>
          if job.attempts < maxAttempts then
            println(s"retry ${job.name}: ${err.getMessage}")
            queue.enqueue(job)
          else println(s"gave up ${job.name}")

@main def jobsDemo(): Unit =
  val jobs = JobQueue(maxAttempts = 3)
  jobs.submit(SendSms("+91-98450-00000", "Your order is packed"))
  jobs.submit(SyncPayment("TXN42", failures = 1))
  jobs.submit(GenerateInvoice(1042, 1299))
  jobs.submit(SyncPayment("TXN43", failures = 5))
  jobs.work()
