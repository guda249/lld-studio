import java.util.concurrent.Executors
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration.*

// How many threads should a pool have? A common rule of thumb:
//     threads = cores x (1 + wait time / compute time)
// A task that only computes keeps a core busy, so more threads than cores just queue up.
// A task that mostly waits (disk, network) leaves its core idle, so more threads help.
// On the JVM, threads run CPU work in parallel, one per core.

val Tasks = List(                                    // kind -> (wait ms, compute ms) per task
  "run tests" -> (0, 100),                           // CPU-bound: compile and run the student's code
  "lint + fetch" -> (100, 100),                      // half waiting, half computing
  "fetch files" -> (180, 20)                         // I/O-bound: download submissions from storage
)

class PoolSizer:
  def sizeFor(kind: String, cores: Int): Int =
    val (waitMs, computeMs) = Tasks.toMap.apply(kind)
    (cores * (1 + waitMs.toDouble / computeMs)).toInt

def fetchSubmission(student: Int): String = s"sub-$student.zip"

@main def sizingDemo(): Unit =
  val sizer = PoolSizer()
  for cores <- List(4, 8); (kind, _) <- Tasks do
    println(s"$kind, $cores cores: ${sizer.sizeFor(kind, cores)} threads")
  val size = sizer.sizeFor("fetch files", 4)
  val pool = Executors.newFixedThreadPool(size)
  given ExecutionContext = ExecutionContext.fromExecutorService(pool)
  val files = Await.result(Future.traverse(1 to 5)(n => Future(fetchSubmission(n))), 2.seconds)
  pool.shutdown()
  println(s"Fetched with a pool of $size: ${files.toList}")
