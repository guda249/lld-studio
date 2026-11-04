final case class Listing(name: String, price: Int, inStock: Boolean, rating: Double)

// Old ranking code from the 2015 codebase: a comparator that returns -1, 0 or 1.
def legacyRankCmp(a: Listing, b: Listing): Int =
  if a.inStock != b.inStock then (if a.inStock then -1 else 1) // in-stock items first
  else if a.rating != b.rating then (if a.rating > b.rating then -1 else 1) // then higher rating
  else a.price.compare(b.price) // then cheaper first

// sorted needs an Ordering, not a bare function.
class RankOrdering extends Ordering[Listing]: // hand-written adapter: function -> Ordering
  def compare(a: Listing, b: Listing): Int = legacyRankCmp(a, b)

@main def rankingAdapterDemo(): Unit =
  val catalogue = List(
    Listing("Sneakers", 2499, false, 4.8),
    Listing("Saree", 1899, true, 4.5),
    Listing("Watch", 999, true, 4.1),
    Listing("Kurta", 1299, true, 4.5)
  )
  val ranked = catalogue.sorted(RankOrdering())
  println("Ranked: " + ranked.map(p => s"${p.name} ₹${p.price}").mkString(", "))

  // The standard library ships a ready-made adapter too.
  val same = catalogue.sorted(Ordering.fromLessThan[Listing]((a, b) => legacyRankCmp(a, b) < 0))
  println(s"Ordering.fromLessThan gives the same order: ${same == ranked}")
