// After: small value types say what each value is, and check themselves.

enum Currency:
  case INR, USD

case class Money(amount: BigDecimal, currency: Currency): // exact: no 0.30000000000000004
  def +(other: Money): Money =
    require(other.currency == currency, s"can't add ${other.currency} to $currency")
    Money(amount + other.amount, currency)

object Ids:
  opaque type OrderId = String // a String at runtime, a different type to the compiler
  opaque type CustomerId = String
  def orderId(s: String): OrderId = s
  def customerId(s: String): CustomerId = s
  extension (id: OrderId) def orderText: String = id
  extension (id: CustomerId) def customerText: String = id

import Ids.*

enum OrderStatus:
  case Placed, Delivered

def refund(order: OrderId, customer: CustomerId, amount: Money, status: OrderStatus): String =
  if status != OrderStatus.Delivered then s"no refund for ${order.orderText}: status is $status"
  else s"refund ${amount.amount} ${amount.currency} to ${customer.customerText} for order ${order.orderText}"

@main def primitiveObsessionAfter(): Unit =
  val total = Money(BigDecimal("0.10"), Currency.INR) + Money(BigDecimal("0.20"), Currency.INR)
  println(s"total: ${total.amount}") // 0.30
  println(refund(orderId("O-1001"), customerId("C-77"), total, OrderStatus.Delivered))
  // refund(customerId("C-77"), orderId("O-1001"), ...) would not compile: the ids are different types
  try total + Money(BigDecimal(1), Currency.USD)
  catch case e: IllegalArgumentException => println(s"stopped: ${e.getMessage}")
