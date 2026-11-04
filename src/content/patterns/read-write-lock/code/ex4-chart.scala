import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicReference
import java.util.concurrent.locks.ReentrantReadWriteLock

// Doctors' screens read blood pressure all day; a nurse records a new reading now and then.
class PatientChart:
  private val rw = ReentrantReadWriteLock()
  @volatile var systolic = 120
  @volatile var diastolic = 80

  def bpWithLock(): String =
    rw.readLock().lock()
    try s"$systolic/$diastolic"
    finally rw.readLock().unlock()

  def bpWithoutLock(): String = s"$systolic/$diastolic"

  def recordBp(sys: Int, dia: Int, halfway: () => Unit): Unit =
    rw.writeLock().lock()
    try
      systolic = sys
      halfway() // demo only: pause between the two fields
      diastolic = dia
    finally rw.writeLock().unlock()

def describe(bp: String): String = bp match
  case "120/80" => "120/80 (old reading)"
  case "135/90" => "135/90 (new reading)"
  case other => s"$other (torn: never measured)"

def run(useLock: Boolean, when: String): String =
  val chart = PatientChart()
  val read: () => String = if useLock then () => chart.bpWithLock() else () => chart.bpWithoutLock()
  when match
    case "before" => describe(read())
    case "after" =>
      chart.recordBp(135, 90, () => ())
      describe(read())
    case _ =>
      val half = CountDownLatch(1)
      val go = CountDownLatch(1)
      val seen = AtomicReference("")
      val nurse = Thread(() => chart.recordBp(135, 90, () => { half.countDown(); go.await() }))
      nurse.start()
      half.await() // the nurse has written systolic but not diastolic yet
      val doctor = Thread(() => seen.set(read()))
      doctor.start()
      if !useLock then doctor.join() // nothing stops the doctor: it reads the half-written chart
      go.countDown()
      nurse.join()
      doctor.join() // with the read lock, the doctor waited for the whole update
      describe(seen.get)

@main def chartDemo(): Unit =
  for useLock <- List(false, true); when <- List("before", "during", "after") do
    val lock = if useLock then "read lock" else "no lock"
    println(f"$lock%9s, $when%-6s the update: ${run(useLock, when)}")
