import java.util.concurrent.{ArrayBlockingQueue, BlockingQueue, ConcurrentLinkedQueue}
import scala.jdk.CollectionConverters.*

val Stop = "<stop>"                                  // poison pill: tells one consumer to finish

class UploadHandler(jobs: BlockingQueue[String]):    // producer
  def upload(photo: String): Unit =
    jobs.put(photo)                                  // waits while the queue is full

class ThumbnailWorker(jobs: BlockingQueue[String], done: ConcurrentLinkedQueue[String])
    extends Thread:                                  // consumer
  override def run(): Unit =
    var running = true
    while running do
      val photo = jobs.take()                        // waits while the queue is empty
      if photo == Stop then running = false
      else done.add(s"thumb($photo)")

@main def producerConsumerDemo(): Unit =
  val jobs = ArrayBlockingQueue[String](3)           // bounded: at most 3 photos waiting
  val done = ConcurrentLinkedQueue[String]()
  val workers = List.fill(2)(ThumbnailWorker(jobs, done))
  workers.foreach(_.start())

  val handler = UploadHandler(jobs)
  for n <- 1 to 8 do handler.upload(s"img$n.jpg")
  workers.foreach(_ => jobs.put(Stop))               // one pill per consumer
  workers.foreach(_.join())

  println(s"Uploaded 8, thumbnails made: ${done.size}")
  println(s"First three: ${done.asScala.toList.sorted.take(3)}")
  println(s"Queue empty at the end: ${jobs.isEmpty}")
