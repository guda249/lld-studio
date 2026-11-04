class OrderPages(total: Int, pageSize: Int): // aggregate: a pretend paginated API
  def fetchPage(page: Int): List[String] =
    println(s"  (fetching page $page)")
    val start = page * pageSize
    (start until math.min(start + pageSize, total)).map(i => s"order-$i").toList

  def iterator: Iterator[String] = OrderIterator(this) // every loop gets a fresh iterator

class OrderIterator(api: OrderPages) extends Iterator[String]: // concrete iterator
  private var page = 0
  private var buffer: List[String] = Nil
  private var done = false // set after an empty page, so we stop calling the API

  def hasNext: Boolean =
    if buffer.isEmpty && !done then
      buffer = api.fetchPage(page)
      page += 1
      done = buffer.isEmpty
    buffer.nonEmpty

  def next(): String =
    if !hasNext then throw java.util.NoSuchElementException("no more orders")
    val head = buffer.head
    buffer = buffer.tail
    head

@main def iteratorDemo(): Unit =
  val pages = OrderPages(total = 7, pageSize = 3)
  for order <- pages.iterator do println(order) // the caller sees a plain loop, no paging code

  println("first two only:")
  val it = pages.iterator
  val first = it.next()
  val second = it.next()
  println(s"$first $second") // only page 0 is fetched
