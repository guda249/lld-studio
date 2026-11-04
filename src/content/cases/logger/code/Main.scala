import scala.collection.mutable

enum Level(val value: Int):
  case Debug extends Level(10)
  case Info extends Level(20)
  case Warn extends Level(30)
  case Error extends Level(40)

/** One log event. `tick` stands in for a timestamp so the demo output never changes. */
case class LogRecord(tick: Long, level: Level, logger: String, message: String)

/** Strategy: how a record becomes a line of text. */
trait Formatter:
  def format(record: LogRecord): String

class PlainFormatter extends Formatter:
  def format(record: LogRecord): String =
    f"#${record.tick} ${record.level.toString.toUpperCase}%-5s ${record.logger}: ${record.message}"

class JsonFormatter extends Formatter:
  private def quote(s: String): String = "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

  def format(record: LogRecord): String =
    val fields = List(
      "tick" -> record.tick.toString,
      "level" -> quote(record.level.toString.toUpperCase),
      "logger" -> quote(record.logger),
      "msg" -> quote(record.message)
    )
    fields.map((k, v) => s"${quote(k)}: $v").mkString("{", ", ", "}")

/** Observer: a destination that receives every record its logger publishes. */
trait Appender:
  def append(record: LogRecord): Unit

class ConsoleAppender(formatter: Formatter, minLevel: Level = Level.Debug) extends Appender:
  def append(record: LogRecord): Unit =
    if record.level.value >= minLevel.value then
      println(s"  console | ${formatter.format(record)}")

/** Keeps lines in a list: handy in tests, and a stand-in for a file. */
class MemoryAppender(formatter: Formatter) extends Appender:
  val lines = mutable.ListBuffer.empty[String]

  def append(record: LogRecord): Unit =
    lines += formatter.format(record)

/** Decorator: same interface, holds records and passes them on in batches (fewer slow writes). */
class BufferedAppender(inner: Appender, batchSize: Int) extends Appender:
  private val pending = mutable.ListBuffer.empty[LogRecord]

  def append(record: LogRecord): Unit =
    pending += record
    if pending.size >= batchSize || record.level == Level.Error then
      flush() // errors never wait in the buffer

  def flush(): Unit =
    pending.foreach(inner.append)
    pending.clear()

/** Named logger. Records go to its own appenders, then up the chain to its parent's. */
class Logger(val name: String, parent: Option[Logger], clock: () => Long):
  var level: Option[Level] = None // None means: use the parent's level
  var propagate = true
  private val appenders = mutable.ListBuffer.empty[Appender]

  def addAppender(appender: Appender): Unit =
    appenders += appender

  def effectiveLevel: Level = level match
    case Some(l) => l
    case None => parent.map(_.effectiveLevel).getOrElse(Level.Info)

  def log(level: Level, message: String): Unit =
    // cheap early exit: no record is built
    if level.value >= effectiveLevel.value then
      publish(LogRecord(clock(), level, name, message))

  private def publish(record: LogRecord): Unit =
    appenders.foreach(_.append(record))
    if propagate then parent.foreach(_.publish(record)) // chain of responsibility, up to root

  def debug(message: String): Unit = log(Level.Debug, message)
  def info(message: String): Unit = log(Level.Info, message)
  def warn(message: String): Unit = log(Level.Warn, message)
  def error(message: String): Unit = log(Level.Error, message)

/** Singleton: one registry, so every getLogger("app.db") returns the same Logger. */
object LogManager:
  private var ticks = 0L
  private def tick(): Long =
    ticks += 1
    ticks
  private val loggers = mutable.Map[String, Logger]("" -> Logger("root", None, () => tick()))

  def root: Logger = loggers("")

  def getLogger(name: String): Logger =
    loggers.get(name) match
      case Some(existing) => existing
      case None =>
        val parentName = name.lastIndexOf('.') match // "app.db" -> "app" -> "" (root)
          case -1 => ""
          case i => name.substring(0, i)
        val created = Logger(name, Some(getLogger(parentName)), () => tick())
        loggers(name) = created
        created

@main def demo(): Unit =
  LogManager.root.addAppender(ConsoleAppender(PlainFormatter()))
  val audit = MemoryAppender(JsonFormatter())
  val buffered = BufferedAppender(audit, batchSize = 10)
  LogManager.getLogger("app.payments").addAppender(buffered)

  val db = LogManager.getLogger("app.db")
  val payments = LogManager.getLogger("app.payments")
  println(s"same logger: ${payments eq LogManager.getLogger("app.payments")}")
  println(s"app.db level: ${db.effectiveLevel.toString.toUpperCase} (inherited from root)")

  db.debug("connection pool warmed up") // below INFO: dropped before a record exists
  db.info("connected to orders-db")
  payments.info("charge 120.00 for order 17")
  payments.warn("retrying card for order 18")
  println(s"audit lines while buffered: ${audit.lines.size}")
  payments.error("card declined for order 18") // an error flushes the buffer at once

  LogManager.getLogger("app").level = Some(Level.Debug)
  db.debug("query took 4 ms") // now app.db inherits DEBUG from app
  println("\naudit trail (JSON, written in one batch):")
  for line <- audit.lines do
    println(s"  memory  | $line")
