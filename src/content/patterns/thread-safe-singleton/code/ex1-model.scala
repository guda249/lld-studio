import java.util.concurrent.{CyclicBarrier, TimeUnit}
import java.util.concurrent.atomic.AtomicInteger

class FraudModel:
  val sizeMb = 900 // imagine loading 900 MB of model weights here

// Hands out the one FraudModel. Subclasses differ only in how get() guards creation.
abstract class ModelLoader:
  @volatile protected var model: FraudModel = null
  protected val lock = new Object
  val loads = AtomicInteger(0)
  val locksTaken = AtomicInteger(0)

  protected def load(): FraudModel =
    loads.incrementAndGet()
    FraudModel()

  def get(pause: Option[CyclicBarrier] = None): FraudModel

class NoLockLoader extends ModelLoader:
  def get(pause: Option[CyclicBarrier]): FraudModel =
    if model == null then
      pause.foreach(_.await(2, TimeUnit.SECONDS)) // demo only: every thread passes the check first
      model = load()
    model

class AlwaysLockLoader extends ModelLoader:
  def get(pause: Option[CyclicBarrier]): FraudModel =
    pause.foreach(_.await(2, TimeUnit.SECONDS))
    lock.synchronized: // safe, but every call pays for the lock, forever
      locksTaken.incrementAndGet()
      if model == null then model = load()
      model

class DoubleCheckedLoader extends ModelLoader:
  def get(pause: Option[CyclicBarrier]): FraudModel =
    if model == null then // fast path once loaded
      pause.foreach(_.await(2, TimeUnit.SECONDS))
      lock.synchronized:
        locksTaken.incrementAndGet()
        if model == null then model = load() // check again under the lock
    model

def run(loader: ModelLoader, racing: Int): String =
  val pause = CyclicBarrier(racing)
  val threads = List.fill(racing)(Thread(() => { loader.get(Some(pause)); () }))
  threads.foreach(_.start())
  threads.foreach(_.join())
  (1 to 100).foreach(_ => loader.get()) // 100 more transactions scored later
  val n = loader.loads.get
  val loaded = if n == 1 then "loaded once" else s"loaded $n times"
  val k = loader.locksTaken.get
  s"$loaded, lock taken $k time${if k == 1 then "" else "s"}"

@main def modelDemo(): Unit =
  val ways = List[(String, () => ModelLoader)](
    ("no lock", () => NoLockLoader()), ("always lock", () => AlwaysLockLoader()), ("double-checked", () => DoubleCheckedLoader()))
  for (name, make) <- ways; racing <- List(1, 4) do
    println(s"$name, $racing racing: ${run(make(), racing)}")
