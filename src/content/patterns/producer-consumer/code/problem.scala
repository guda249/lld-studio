// Before: the upload handler and the thumbnail workers share a plain buffer.
// Nothing limits its size, nothing stops two workers taking the same photo,
// and an idle worker has to keep polling "anything yet?".
import scala.collection.mutable.ArrayBuffer

val pending = ArrayBuffer[String]()      // shared "queue": no lock, no limit
val thumbnails = ArrayBuffer[String]()

def handleUpload(photo: String): Unit =
  pending += photo                       // never waits, so a burst grows the buffer forever

def workerPeek(): Option[String] =
  pending.headOption                     // 1. check...

def workerFinish(photo: String): Unit =
  thumbnails += s"thumb($photo)"
  pending.remove(0)                      // 2. ...then act: someone may have changed the buffer

@main def problemDemo(): Unit =
  for n <- 0 until 10000 do handleUpload(s"img$n.jpg")
  println(s"After a burst: ${pending.size} photos waiting in memory")

  // Two worker threads with unlucky timing, written out step by step:
  val a = workerPeek().get               // worker A sees img0
  val b = workerPeek().get               // worker B also sees img0 (A has not removed it yet)
  workerFinish(a)                        // A removes img0
  workerFinish(b)                        // B removes img1, which nobody processed
  println(s"Thumbnails made: ${thumbnails.mkString(", ")}")
  println(s"img1.jpg lost: ${!pending.contains("img1.jpg")}")
