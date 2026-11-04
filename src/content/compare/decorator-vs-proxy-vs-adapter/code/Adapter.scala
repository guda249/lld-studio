trait WeatherService:                         // target: what our app expects (Celsius, by city)
  def temperature(city: String): Double

class FahrenheitFeed:                         // adaptee: an old library we can't change
  private val readings = Map("LFPG" -> 65.23, "ENGM" -> 44.82, "EGLL" -> 59.0)

  def readF(stationCode: String): Double = readings(stationCode)

class FahrenheitAdapter(feed: FahrenheitFeed) extends WeatherService:  // adapter
  private val codes = Map("Paris" -> "LFPG", "Oslo" -> "ENGM", "London" -> "EGLL")

  def temperature(city: String): Double =
    val fahrenheit = feed.readF(codes(city))             // city -> station code
    math.round((fahrenheit - 32) * 5 / 9 * 10) / 10.0    // Fahrenheit -> Celsius

class WeatherApp(service: WeatherService):    // client: only knows WeatherService

  def report(city: String): String = s"$city: ${service.temperature(city)} C"

@main def demo(): Unit =
  // the wiring happens once, at startup; WeatherApp never sees FahrenheitFeed
  val app = WeatherApp(FahrenheitAdapter(FahrenheitFeed()))
  println(app.report("Paris"))
  println(app.report("Oslo"))
  println(app.report("London"))
