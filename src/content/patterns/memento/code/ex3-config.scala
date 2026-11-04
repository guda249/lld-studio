import scala.collection.mutable

final case class ConfigCheckpoint(label: String, settings: List[(String, String)])   // memento with a label

class ServiceConfig(initial: (String, String)*):                                     // originator
  private val settings = mutable.LinkedHashMap.from(initial)

  def set(key: String, value: String): Unit = settings(key) = value

  def show: String = settings.toList.map((k, v) => s"$k=$v").mkString(", ")

  def checkpoint(label: String): ConfigCheckpoint = ConfigCheckpoint(label, settings.toList)

  def rollback(cp: ConfigCheckpoint): Unit =
    settings.clear()
    settings ++= cp.settings

class ReleaseLog:                                                                    // caretaker
  private val byLabel = mutable.LinkedHashMap.empty[String, ConfigCheckpoint]

  def keep(cp: ConfigCheckpoint): Unit = byLabel(cp.label) = cp

  def get(label: String): ConfigCheckpoint = byLabel(label)

  def labels: List[String] = byLabel.keys.toList

@main def configRollback(): Unit =
  val config = ServiceConfig("replicas" -> "2", "image" -> "api:1.4", "timeout_ms" -> "800")
  val log = ReleaseLog()
  log.keep(config.checkpoint("v1.4"))

  config.set("image", "api:1.5")
  config.set("replicas", "4")
  log.keep(config.checkpoint("v1.5"))

  config.set("timeout_ms", "50")                     // bad hotfix: requests start timing out
  println(s"Live: ${config.show}")
  println(s"Checkpoints: ${log.labels.mkString(", ")}")

  config.rollback(log.get("v1.5"))
  println(s"Back to v1.5: ${config.show}")
  config.rollback(log.get("v1.4"))
  println(s"Back to v1.4: ${config.show}")
