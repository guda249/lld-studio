// an object is created once, on first use, and the JVM makes that thread-safe
object ExchangeRates:
  // the slow download now happens once
  private val rates = Map("EUR" -> 0.92, "GBP" -> 0.79, "INR" -> 83.1)

  def convert(usd: Double, currency: String): Double =
    BigDecimal(usd * rates(currency)).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble

class HotelPricing:
  def price(usd: Double, currency: String): String =
    s"Hotel: ${ExchangeRates.convert(usd, currency)} $currency"

class FlightPricing:
  def price(usd: Double, currency: String): String =
    s"Flight: ${ExchangeRates.convert(usd, currency)} $currency"

@main def demo(): Unit =
  val hotels = HotelPricing()
  val flights = FlightPricing()
  println(hotels.price(120.0, "EUR"))
  println(flights.price(300.0, "INR"))
  println(hotels.price(80.0, "GBP"))
