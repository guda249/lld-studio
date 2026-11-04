import scala.collection.mutable

trait WeatherService:                         // subject: what every client calls
  def temperature(city: String): Double

class StationWeather extends WeatherService:  // the real service: slow, so we count the calls
  private val readings = Map("Paris" -> 18.46, "Oslo" -> 7.12)
  def temperature(city: String): Double =
    println(s"  asking the station about $city...")
    readings(city)

class CachingWeather(real: WeatherService) extends WeatherService:  // proxy: decides IF the real one is called
  private val cache = mutable.Map.empty[String, Double]

  def temperature(city: String): Double =
    if !cache.contains(city) then
      cache(city) = real.temperature(city)
    cache(city)

def show(service: WeatherService, city: String): Unit =   // the client can't tell the difference
  println(s"$city: ${service.temperature(city)}")

@main def demo(): Unit =
  val service = CachingWeather(StationWeather())
  show(service, "Paris")
  show(service, "Paris")                      // answered from the cache: no station call
  show(service, "Oslo")
