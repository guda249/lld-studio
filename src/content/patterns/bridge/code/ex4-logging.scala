import scala.collection.mutable

type Sink = String => Unit // implementation side: where a line goes (just a function)
val levels = Map("DEBUG" -> 10, "INFO" -> 20, "ERROR" -> 40)

def consoleSink(line: String): Unit = println(s"  console | $line")

abstract class Logger(protected val sink: Sink): // abstraction side; sink is the bridge
  def log(level: String, message: String): Unit

class AppLogger(out: Sink, minLevel: String = "INFO") extends Logger(out):
  def log(level: String, message: String): Unit =
    if levels(level) >= levels(minLevel) then // filters noisy levels
      sink(f"$level%-5s $message")

class AuditLogger(out: Sink, user: String) extends Logger(out):
  def log(level: String, message: String): Unit =
    sink(s"AUDIT user=$user $level $message") // never filtered

@main def loggingBridgeDemo(): Unit =
  val app = AppLogger(consoleSink)
  app.log("DEBUG", "cache warmed") // dropped by the INFO filter
  app.log("INFO", "server started on port 8080")
  app.log("ERROR", "payment service timed out")

  val auditBuffer = mutable.ListBuffer.empty[String]
  val audit = AuditLogger(line => auditBuffer += line, user = "admin@shop") // in-memory sink
  audit.log("INFO", "changed refund limit to ₹5,000")
  audit.log("DEBUG", "viewed customer 1042")
  println(s"Audit buffer holds ${auditBuffer.size} lines, first: ${auditBuffer.head}")

  AuditLogger(consoleSink, user = "ops").log("INFO", "rotated API keys") // audit logger, console sink
