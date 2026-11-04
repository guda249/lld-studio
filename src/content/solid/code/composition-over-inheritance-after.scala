// After: Logger HAS a formatter and a sink. Mix any format with any destination.
import scala.collection.mutable.ListBuffer

trait Formatter: // how a line looks
  def format(msg: String): String

trait Sink: // where a line goes
  def write(line: String): Unit

class PlainFormatter extends Formatter:
  def format(msg: String): String = msg

class TimestampFormatter extends Formatter:
  def format(msg: String): String = s"[09:30] $msg"

class ConsoleSink extends Sink:
  def write(line: String): Unit = println(line)

class MemorySink extends Sink: // stands in for a file
  val lines = ListBuffer.empty[String]
  def write(line: String): Unit = lines += line

class Logger(var formatter: Formatter, sink: Sink): // parts are handed in, so they can be swapped
  def log(msg: String): Unit = sink.write(formatter.format(msg)) // delegate both jobs

@main def compositionAfter(): Unit =
  Logger(TimestampFormatter(), ConsoleSink()).log("server started")
  val memory = MemorySink()
  val log = Logger(TimestampFormatter(), memory)
  log.log("disk 91% full")
  log.formatter = PlainFormatter() // change behaviour at runtime: no new class
  log.log("disk cleaned")
  println(memory.lines.toList)
