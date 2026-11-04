trait WeatherService:                         // component: what every client calls
  def temperature(city: String): Double

class StationWeather extends WeatherService:  // the real service
  private val readings = Map("Paris" -> 18.46, "Oslo" -> 7.12)
  def temperature(city: String): Double = readings(city)

class Rounded(inner: WeatherService) extends WeatherService:   // decorator: adds rounding
  def temperature(city: String): Double =
    math.round(inner.temperature(city) * 10) / 10.0

class Logged(inner: WeatherService) extends WeatherService:    // decorator: adds a log line
  def temperature(city: String): Double =
    val value = inner.temperature(city)
    println(s"  log: $city -> $value")
    value

@main def demo(): Unit =
  // the client stacks the extras it wants, in the order it wants
  var service: WeatherService = Logged(Rounded(StationWeather()))
  println(service.temperature("Paris"))
  service = Rounded(Logged(StationWeather()))  // other order: the log sees the raw value
  println(service.temperature("Oslo"))
  service = StationWeather()                  // no extras at all: same interface
  println(service.temperature("Oslo"))
