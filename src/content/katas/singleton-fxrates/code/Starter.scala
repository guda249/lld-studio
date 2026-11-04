class ExchangeRates:
  // pretend this is a slow download from the bank's rate feed
  private val rates = Map("EUR" -> 0.92, "GBP" -> 0.79, "INR" -> 83.1)

  def convert(usd: Double, currency: String): Double =
    BigDecimal(usd * rates(currency)).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble

class HotelPricing:
  def price(usd: Double, currency: String): String =
    val rates = ExchangeRates() // downloads the rates again
    s"Hotel: ${rates.convert(usd, currency)} $currency"

class FlightPricing:
  def price(usd: Double, currency: String): String =
    val rates = ExchangeRates() // and again: the two may even disagree
    s"Flight: ${rates.convert(usd, currency)} $currency"

@main def demo(): Unit =
  val hotels = HotelPricing()
  val flights = FlightPricing()
  println(hotels.price(120.0, "EUR"))
  println(flights.price(300.0, "INR"))
  println(hotels.price(80.0, "GBP"))
