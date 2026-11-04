import scala.concurrent.{Await, Future}
import scala.concurrent.duration.*
import scala.concurrent.ExecutionContext.Implicits.global

def packBox(): String =
  Thread.sleep(100)
  "box packed"

def takePayment(): String =
  Thread.sleep(100)
  "payment taken"

@main def demo(): Unit =
  println("Take order")
  val packing = Future(packBox())                 // fork: start both at once
  val paying = Future(takePayment())
  val both = packing.zip(paying)                  // join: wait for both
  println(Await.result(both, 2.seconds))
  println("Ship order")
