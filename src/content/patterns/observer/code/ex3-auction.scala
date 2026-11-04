import scala.collection.mutable

abstract class Bidder(val name: String):               // observer
  def onNewBid(auction: Auction, leader: String, amount: Int): Unit

class Auction(val item: String, start: Int):           // subject
  var amount = start
  var leader = "nobody"
  private val watchers = mutable.ListBuffer.empty[Bidder]

  def watch(bidder: Bidder): Unit = watchers += bidder

  def unwatch(bidder: Bidder): Unit = watchers -= bidder

  def bid(name: String, value: Int): Unit =
    if value > amount then
      leader = name
      amount = value
      println(f"$name bids ₹$value%,d")
      watchers.toList.foreach(_.onNewBid(this, name, value))   // copy: watchers may leave mid-loop

class AutoBidder(bidderName: String, budget: Int, step: Int) extends Bidder(bidderName):
  def onNewBid(auction: Auction, leader: String, amount: Int): Unit =
    if leader != name then
      if amount + step <= budget then auction.bid(name, amount + step)
      else
        println(f"  $name is out (budget ₹$budget%,d) and stops watching")
        auction.unwatch(this)                          // unsubscribes during notification

@main def auctionBids(): Unit =
  val auction = Auction("1971 vintage sitar", start = 20000)
  for bidder <- List(AutoBidder("Meera", budget = 26000, step = 2000),
                     AutoBidder("Kabir", budget = 30000, step = 1500)) do
    auction.watch(bidder)

  auction.bid("Ravi", 21000)
  println(f"Sold to ${auction.leader} for ₹${auction.amount}%,d")
