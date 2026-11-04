class CheckFailed(message: String) extends Exception(message)

abstract class TestCase:
  final def run(): String =                       // the template method
    setUp()
    val result =
      try
        test()
        "PASS"
      catch case e: CheckFailed => s"FAIL (${e.getMessage})"
      finally tearDown()                          // always runs, even after a failure
    s"${getClass.getSimpleName}: $result"

  protected def setUp(): Unit = ()                // hook
  protected def test(): Unit
  protected def tearDown(): Unit = ()             // hook

  protected def check(condition: Boolean, message: String): Unit =
    if !condition then throw CheckFailed(message)

class CartTotalTest extends TestCase:
  private var cart: List[Int] = Nil

  override protected def setUp(): Unit = cart = List(499, 250)

  protected def test(): Unit = check(cart.sum == 749, "cart total should be 749")

class DiscountTest extends TestCase:
  override protected def setUp(): Unit = println("  setUp: open test database")

  protected def test(): Unit =
    val price = 1000 * 0.9
    check(price == 910, s"expected 910, got $price")

  override protected def tearDown(): Unit = println("  tearDown: close test database")

@main def testsDemo(): Unit =
  for testCase <- List(CartTotalTest(), DiscountTest()) do
    println(testCase.run())
