import scala.collection.mutable

type Event = Map[String, String]
type Handler = Event => Unit

class EventBus:                                        // broker between publishers and subscribers
  private val handlers = mutable.Map.empty[String, mutable.ListBuffer[Handler]]

  def subscribe(topic: String, handler: Handler): Unit =
    handlers.getOrElseUpdate(topic, mutable.ListBuffer.empty[Handler]) += handler

  def publish(topic: String, event: Event): Unit =
    for handler <- handlers.get(topic).map(_.toList).getOrElse(Nil) do
      try handler(event)
      catch                                            // one broken handler must not stop the rest
        case err: RuntimeException => println(s"  [bus] handler failed on $topic: ${err.getMessage}")

def chatNotifier(event: Event): Unit =
  println(s"  #builds: ${event("repo")} failed at step '${event("step")}'")

def pager(event: Event): Unit =
  if event("branch") == "main" then throw RuntimeException("pager service is down")

def deployLog(event: Event): Unit =
  println(s"  deploy log: ${event("repo")} ${event("version")} is live")

@main def ciEventBus(): Unit =
  val bus = EventBus()
  bus.subscribe("build.failed", chatNotifier)
  bus.subscribe("build.failed", pager)
  bus.subscribe("deploy.done", deployLog)

  // the CI runner only knows the bus and topic names, not the subscribers
  println("CI: publishing build.failed")
  bus.publish("build.failed", Map("repo" -> "payments-api", "step" -> "unit tests", "branch" -> "main"))
  println("CI: publishing deploy.done")
  bus.publish("deploy.done", Map("repo" -> "web-app", "version" -> "v2.8.1"))
  println("CI: publishing cache.cleared (nobody listens)")
  bus.publish("cache.cleared", Map.empty)
