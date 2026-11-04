final case class HttpRequest(
    url: String,
    method: String = "GET",
    body: Option[String] = None,
    timeoutSeconds: Double = 10.0
):
  // the same cross-field check a builder's build() would do
  require(!(method == "GET" && body.isDefined), "GET requests cannot have a body")

@main def builderIdiomatic(): Unit =
  // named arguments with defaults: readable, and no argument mix-ups
  val base = HttpRequest("https://api.example.com/orders")
  val post = base.copy(method = "POST", body = Some("""{"id": 7}"""), timeoutSeconds = 5) // a changed copy
  println(base)
  println(post)

  try base.copy(body = Some("{}"))
  catch case e: IllegalArgumentException => println(s"Rejected: ${e.getMessage}")
