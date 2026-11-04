import java.util.concurrent.{ArrayBlockingQueue, BlockingQueue}
import scala.collection.mutable.ArrayBuffer

val Stop = "<stop>"

class LogWriter(lines: BlockingQueue[String], batchSize: Int) extends Thread:   // consumer
  @volatile var diskWrites = 0
  @volatile var written = 0

  override def run(): Unit =
    val batch = ArrayBuffer[String]()
    var line = lines.take()
    while line != Stop do
      batch += line
      if batch.size == batchSize then flush(batch)
      line = lines.take()
    flush(batch)                                     // whatever is left at shutdown

  private def flush(batch: ArrayBuffer[String]): Unit =
    if batch.nonEmpty then
      diskWrites += 1
      written += batch.size
      batch.clear()

def requestThread(lines: BlockingQueue[String], name: String): Thread =   // producer
  Thread(() => for i <- 0 until 4 do lines.put(s"$name: request $i served"))

def run(threads: Int, batchSize: Int): String =
  val lines = ArrayBlockingQueue[String](100)
  val writer = LogWriter(lines, batchSize)
  writer.start()
  val producers = (0 until threads).map(k => requestThread(lines, s"web-$k"))
  producers.foreach(_.start())
  producers.foreach(_.join())
  lines.put(Stop)                                    // only after every producer has finished
  writer.join()
  s"${writer.written} lines in ${writer.diskWrites} disk writes"

@main def logsDemo(): Unit =
  for threads <- List(2, 3); batchSize <- List(1, 5, 10) do
    println(s"$threads request threads, batch $batchSize: ${run(threads, batchSize)}")
