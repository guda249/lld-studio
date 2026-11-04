import scala.collection.mutable

// A top-level object: created once, shared by every file that uses it.
object FeatureFlags:
  private val on = mutable.Set("live_proctoring")
  def enable(name: String): Unit = on += name
  def disable(name: String): Unit = on -= name
  def isOn(name: String): Boolean = on.contains(name)

def startExam(student: String): String =
  val mode = if FeatureFlags.isOn("live_proctoring") then "with webcam proctoring" else "without proctoring"
  val extra = if FeatureFlags.isOn("extra_time") then " + 10 min extra time" else ""
  s"$student starts the exam $mode$extra"

// The downside: global mutable state leaks from one test into the next.
def testExtraTime(): String =
  FeatureFlags.enable("extra_time") // forgot to switch it off again
  startExam("test-student")

def testDefaultExam(): String =
  startExam("test-student") // expects no extra time

@main def featureFlagsDemo(): Unit =
  println(startExam("Ravi"))
  println(s"testExtraTime:   ${testExtraTime()}")
  println(s"testDefaultExam: ${testDefaultExam()}  <- polluted by the test before")
  FeatureFlags.disable("extra_time")
  println(s"after manual reset: ${startExam("test-student")}")
