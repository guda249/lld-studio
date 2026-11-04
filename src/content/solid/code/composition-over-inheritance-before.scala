// Before: every mix of "how it looks" and "where it goes" needs its own subclass.
import scala.collection.mutable.ListBuffer

class Logger: // prints plain lines to the console
  def log(msg: String): Unit = write(format(msg))
  def format(msg: String): String = msg
  def write(line: String): Unit = println(line)

class TimestampLogger extends Logger: // changes how it looks
  override def format(msg: String): String = s"[09:30] $msg"

class FileLogger extends Logger: // changes where it goes
  val lines = ListBuffer.empty[String]
  override def write(line: String): Unit = lines += line

class TimestampFileLogger extends FileLogger: // both? pick one parent, copy the other
  override def format(msg: String): String = s"[09:30] $msg" // duplicated from TimestampLogger

@main def compositionBefore(): Unit =
  TimestampLogger().log("server started")
  val f = TimestampFileLogger()
  f.log("disk 91% full")
  println(f.lines.toList)
  // next request: JSON format and a Slack destination -> 3 formats x 3 places = 9 classes
