import scala.util.Random

trait BackoffStrategy:
  def delay(attempt: Int): Double

class FixedDelay(seconds: Double = 1.0) extends BackoffStrategy:
  def delay(attempt: Int): Double = seconds

class ExponentialBackoff(base: Double = 0.5, cap: Double = 8.0) extends BackoffStrategy:
  def delay(attempt: Int): Double = math.min(cap, base * math.pow(2, attempt - 1))

class FullJitter(rng: Random = new Random(42)) extends ExponentialBackoff():
  override def delay(attempt: Int): Double = rng.between(0.0, super.delay(attempt))

class RetryingClient(backoff: BackoffStrategy, maxAttempts: Int = 5):
  // a real client would Thread.sleep(delay) after each failed attempt
  def schedule: List[Double] =
    (1 to maxAttempts).map(a => math.round(backoff.delay(a) * 100) / 100.0).toList

@main def retryDemo(): Unit =
  for b <- List(FixedDelay(), ExponentialBackoff(), FullJitter()) do
    println(s"${b.getClass.getSimpleName} ${RetryingClient(b).schedule}")
