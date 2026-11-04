class HttpRequest(
    val method: String,
    val url: String,
    val headers: Map[String, String],
    val body: Option[String],
    val timeoutSeconds: Double,
    val followRedirects: Boolean,
    val proxy: Option[String],
    val retries: Int
)

@main def builderProblem(): Unit =
  // eight positional arguments: which number is the timeout and which the retries?
  val ok = HttpRequest("POST", "https://api.example.com/orders",
    Map("Content-Type" -> "application/json"), Some("""{"id": 7}"""), 5.0, true, None, 3)
  // timeout and retries swapped by mistake, and a GET with a body: nothing checks either
  val bad = HttpRequest("GET", "https://api.example.com/orders",
    Map.empty, Some("""{"id": 7}"""), 3, true, None, 5)

  for r <- List(ok, bad) do
    println(s"${r.method} timeout=${r.timeoutSeconds}s retries=${r.retries} body=${r.body.getOrElse("None")}")
