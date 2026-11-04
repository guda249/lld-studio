final case class Product(name: String, price: Int, rating: Double, daysListed: Int)

// each Ordering is a strategy
val sorts: List[(String, Ordering[Product])] = List(
  "priceLowHigh" -> Ordering.by[Product, Int](_.price),
  "topRated"     -> Ordering.by[Product, Double](_.rating).reverse,
  "newest"       -> Ordering.by[Product, Int](_.daysListed)
)

def searchResults(products: List[Product], ordering: Ordering[Product]): List[String] =
  products.sorted(using ordering).map(_.name)

@main def sortDemo(): Unit =
  val catalog = List(
    Product("Kettle", 1499, 4.2, 30),
    Product("Toaster", 999, 4.6, 5),
    Product("Mixer", 2999, 4.4, 12)
  )
  for (label, ordering) <- sorts do
    println(s"$label ${searchResults(catalog, ordering)}")
