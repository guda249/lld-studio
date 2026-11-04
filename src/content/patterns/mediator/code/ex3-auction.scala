import scala.collection.mutable

class Bidder(val name: String, house: AuctionHouse): // colleague: knows only the auction house
  house.register(this)

  def bid(amount: Int): Unit = house.placeBid(this, amount)

  def receive(message: String): Unit = println(s"  to $name: $message")

class AuctionHouse(val item: String, start: Int, step: Int): // mediator: owns the bidding rules
  private var topAmount = start - step // so the first bid must be at least `start`
  private var top: Option[Bidder] = None
  private val bidders = mutable.ListBuffer.empty[Bidder]

  def register(bidder: Bidder): Unit = bidders += bidder

  def placeBid(bidder: Bidder, amount: Int): Unit =
    println(s"${bidder.name} bids ₹$amount")
    val minimum = topAmount + step
    if amount < minimum then bidder.receive(s"rejected, minimum is ₹$minimum")
    else
      top.filter(_ ne bidder).foreach(_.receive(s"you were outbid at ₹$amount"))
      top = Some(bidder)
      topAmount = amount

  def close(): Unit =
    println(s"Auction for $item closed")
    top match
      case None => println("  no bids")
      case Some(winner) =>
        for b <- bidders do
          b.receive(if b eq winner then s"you won at ₹$topAmount" else s"sold to ${winner.name}")

@main def auctionDemo(): Unit =
  val house = AuctionHouse("1975 Royal Enfield Bullet", start = 100000, step = 5000)
  val asha = Bidder("asha", house)
  val ravi = Bidder("ravi", house)
  val kabir = Bidder("kabir", house)
  asha.bid(100000)
  ravi.bid(102000)
  ravi.bid(105000)
  kabir.bid(120000)
  asha.bid(125000)
  house.close()
