import java.util.concurrent.{ArrayBlockingQueue, BlockingQueue, LinkedBlockingQueue}
import scala.collection.mutable.ArrayBuffer

val Stop = "<stop>"

class Transcoder(inbox: BlockingQueue[String], outbox: BlockingQueue[String], dead: BlockingQueue[String])
    extends Thread:                                  // consumer of stage 1 AND producer for stage 2
  override def run(): Unit =
    var video = inbox.take()
    while video != Stop do
      if video.endsWith(".corrupt") then dead.put(video)   // park it for a human; keep the line moving
      else outbox.put(video.replace(".mov", ".mp4"))
      video = inbox.take()
    outbox.put(Stop)                                 // pass the pill down the line

class Publisher(inbox: BlockingQueue[String], published: ArrayBuffer[String]) extends Thread:
  override def run(): Unit =
    var video = inbox.take()
    while video != Stop do
      published += video
      video = inbox.take()

def runPipeline(uploads: List[String]): String =
  val raw = ArrayBlockingQueue[String](2)
  val encoded = ArrayBlockingQueue[String](2)
  val dead = LinkedBlockingQueue[String]()
  val published = ArrayBuffer[String]()
  val stages = List(Transcoder(raw, encoded, dead), Publisher(encoded, published))
  stages.foreach(_.start())
  (uploads :+ Stop).foreach(raw.put)
  stages.foreach(_.join())                           // join() also makes `published` safe to read
  s"${published.size} published, ${dead.size} dead letter(s): ${published.mkString(", ")}"

@main def videoDemo(): Unit =
  val batches = List(
    "clean" -> List("intro.mov", "arrays.mov", "graphs.mov"),
    "one corrupt" -> List("intro.mov", "arrays.corrupt", "graphs.mov"),
    "two corrupt" -> List("intro.corrupt", "arrays.mov", "graphs.corrupt")
  )
  for (name, uploads) <- batches do println(s"$name: ${runPipeline(uploads)}")
