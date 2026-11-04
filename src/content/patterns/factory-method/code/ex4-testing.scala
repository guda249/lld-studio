import scala.collection.mutable

trait HttpClient:
  def get(url: String): Map[String, Double]

class RealHttpClient extends HttpClient:
  def get(url: String): Map[String, Double] =
    // a real app would call the network here; this demo stays offline
    throw IllegalStateException(s"no network in this demo ($url)")

class FakeHttpClient(tempC: Double) extends HttpClient:
  val calls: mutable.ListBuffer[String] = mutable.ListBuffer()

  def get(url: String): Map[String, Double] =
    calls += url
    Map("temp_c" -> tempC)

class WeatherService:
  def createClient(): HttpClient = RealHttpClient() // factory method: production default

  def advice(city: String): String =
    val data = createClient().get(s"https://weather.example/$city")
    val temp = data("temp_c")
    val tip = if temp >= 35 then "carry water" else "enjoy the day"
    f"$city: $temp%.0f°C, $tip"

class FakeWeatherService(fake: FakeHttpClient) extends WeatherService:
  override def createClient(): HttpClient = fake // the test swaps only the creation step

@main def weatherTestDemo(): Unit =
  val fake = FakeHttpClient(41)
  println(FakeWeatherService(fake).advice("Nagpur"))
  println(s"Fake client saw: ${fake.calls.mkString("[", ", ", "]")}")
  try println(WeatherService().advice("Nagpur"))
  catch case e: IllegalStateException => println(s"Production client: ${e.getMessage}")
