import java.util.concurrent.{ConcurrentHashMap, ConcurrentLinkedQueue, CyclicBarrier, TimeUnit}
import scala.jdk.CollectionConverters.*

// An HTTP client for one cloud region: opens a connection pool and fetches credentials.
class RegionClient(val region: String)

trait Registry:
  val created = ConcurrentLinkedQueue[String]()
  def client(region: String, pause: CyclicBarrier): RegionClient

// One client per region (a multiton), created lazily. The map is thread-safe,
// but "check, then put" is two steps, and other threads can run in between.
class RacyRegistry extends Registry:
  private val clients = ConcurrentHashMap[String, RegionClient]()

  def client(region: String, pause: CyclicBarrier): RegionClient =
    if !clients.containsKey(region) then
      pause.await(2, TimeUnit.SECONDS) // demo only: every request passes the check before anyone creates
      created.add(region)
      clients.put(region, RegionClient(region))
    clients.get(region)

// computeIfAbsent runs the creation at most once per key, atomically.
class SafeRegistry extends Registry:
  private val clients = ConcurrentHashMap[String, RegionClient]()

  def client(region: String, pause: CyclicBarrier): RegionClient =
    pause.await(2, TimeUnit.SECONDS)
    clients.computeIfAbsent(region, r => { created.add(r); RegionClient(r) })

def run(registry: Registry, regions: List[String]): String =
  val pause = CyclicBarrier(regions.size)
  val threads = regions.map(r => Thread(() => { registry.client(r, pause); () }))
  threads.foreach(_.start())
  threads.foreach(_.join())
  val made = registry.created.asScala.toList
  val (clients, distinct) = (made.size, made.distinct.size)
  s"$clients client${if clients == 1 then "" else "s"} for $distinct region${if distinct == 1 then "" else "s"}"

@main def regionsDemo(): Unit =
  val requests = List(
    "4 × Mumbai" -> List.fill(4)("ap-south-1"),
    "2 × Mumbai, 2 × Frankfurt" -> List("ap-south-1", "ap-south-1", "eu-central-1", "eu-central-1"))
  for (label, regions) <- requests; (name, make) <- List[(String, () => Registry)](("racy", () => RacyRegistry()), ("safe", () => SafeRegistry())) do
    println(s"$label, $name: ${run(make(), regions)}")
