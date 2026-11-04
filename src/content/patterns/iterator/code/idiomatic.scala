def fetchPage(page: Int, total: Int = 7, size: Int = 3): List[String] =
  val start = page * size
  (start until math.min(start + size, total)).map(i => s"order-$i").toList

// Iterator combinators build the whole traversal in one line.
def allOrders(): Iterator[String] =
  Iterator.from(0).map(page => fetchPage(page)).takeWhile(_.nonEmpty).flatten

@main def idiomaticIterator(): Unit =
  println(allOrders().toList)
  // Lazy: stops fetching pages as soon as the first match is found.
  println(allOrders().find(_.endsWith("4")).getOrElse("none"))
