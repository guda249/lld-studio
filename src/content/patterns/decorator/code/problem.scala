import scala.collection.mutable

class BasicHttpClient:
  def get(url: String): String = s"<html for $url>"

class LoggingClient extends BasicHttpClient:
  override def get(url: String): String =
    println(s"LOG  GET $url")
    super.get(url)

class CachingClient extends BasicHttpClient:
  private val cache = mutable.Map.empty[String, String]
  override def get(url: String): String =
    if !cache.contains(url) then cache(url) = super.get(url)
    cache(url)

// Copy-paste of the logging code. Adding retries needs four more classes.
class LoggingCachingClient extends CachingClient:
  override def get(url: String): String =
    println(s"LOG  GET $url")
    super.get(url)

@main def decoratorProblem(): Unit =
  val client = LoggingCachingClient()
  println(client.get("https://example.com"))
  val features = 3
  println(s"$features optional features need ${1 << features} classes to cover every combination")
