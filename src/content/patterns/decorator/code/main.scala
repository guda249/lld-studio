import scala.collection.mutable

trait HttpClient:
  def get(url: String): String

// The real client. Its first call fails, like a flaky network.
class BasicHttpClient extends HttpClient:
  var calls = 0
  def get(url: String): String =
    calls += 1
    if calls == 1 then throw java.io.IOException("network blip")
    s"<html for $url>"

abstract class ClientDecorator(inner: HttpClient) extends HttpClient:
  def get(url: String): String = inner.get(url)

class LoggingClient(wrapped: HttpClient) extends ClientDecorator(wrapped):
  override def get(url: String): String =
    println(s"LOG   GET $url")
    super.get(url)

class CachingClient(wrapped: HttpClient) extends ClientDecorator(wrapped):
  private val cache = mutable.Map.empty[String, String]
  override def get(url: String): String =
    if cache.contains(url) then println(s"CACHE hit $url")
    else cache(url) = super.get(url)
    cache(url)

class RetryClient(wrapped: HttpClient, attempts: Int = 3) extends ClientDecorator(wrapped):
  override def get(url: String): String =
    var result: Option[String] = None
    var attempt = 1
    while result.isEmpty do
      try
        result = Some(super.get(url))
      catch
        case e: java.io.IOException =>
          println(s"RETRY attempt $attempt failed: ${e.getMessage}")
          if attempt == attempts then throw e
          attempt += 1
    result.get

@main def decoratorDemo(): Unit =
  val basic = BasicHttpClient()
  val client: HttpClient = LoggingClient(CachingClient(RetryClient(basic)))
  println(client.get("https://example.com"))
  println(client.get("https://example.com"))
  println(s"real network calls: ${basic.calls}")
