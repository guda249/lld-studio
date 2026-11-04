final case class HttpRequest(
    method: String,
    url: String,
    headers: Map[String, String],
    body: Option[String],
    timeoutSeconds: Double
)

final class HttpRequestBuilder(url: String):
  private var method = "GET"
  private var headers = Map.empty[String, String]
  private var body: Option[String] = None
  private var timeoutSeconds = 10.0

  def withMethod(m: String): HttpRequestBuilder =
    method = m.toUpperCase
    this

  def withHeader(key: String, value: String): HttpRequestBuilder =
    headers = headers + (key -> value)
    this

  def withJsonBody(b: String): HttpRequestBuilder =
    body = Some(b)
    withHeader("Content-Type", "application/json")

  def withTimeout(seconds: Double): HttpRequestBuilder =
    timeoutSeconds = seconds
    this

  def build(): HttpRequest =
    // rules that span several fields are checked once, here
    if method == "GET" && body.isDefined then
      throw IllegalArgumentException("GET requests cannot have a body")
    if timeoutSeconds <= 0 then
      throw IllegalArgumentException("timeout must be positive")
    HttpRequest(method, url, headers, body, timeoutSeconds)

@main def builderDemo(): Unit =
  val request = HttpRequestBuilder("https://api.example.com/orders")
    .withMethod("post")
    .withJsonBody("""{"id": 7}""")
    .withTimeout(5)
    .build()
  println(s"${request.method} ${request.url} timeout=${request.timeoutSeconds}s")
  println(s"headers=${request.headers} body=${request.body.getOrElse("None")}")

  try HttpRequestBuilder("https://api.example.com/orders").withJsonBody("{}").build()
  catch case e: IllegalArgumentException => println(s"Rejected: ${e.getMessage}")
