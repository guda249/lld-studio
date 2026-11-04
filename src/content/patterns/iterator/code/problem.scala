import scala.collection.mutable

class OrderPages(total: Int, pageSize: Int): // pretend paginated API: 3 orders per page
  def fetchPage(page: Int): List[String] =
    val start = page * pageSize
    (start until math.min(start + pageSize, total)).map(i => s"order-$i").toList

@main def pagingProblem(): Unit =
  val api = OrderPages(total = 7, pageSize = 3)

  // Caller 1: the invoice job writes the paging loop by hand.
  val invoiced = mutable.ListBuffer.empty[String]
  var page = 0
  var batch = api.fetchPage(page)
  while batch.nonEmpty do
    invoiced ++= batch
    page += 1
    batch = api.fetchPage(page)
  println(s"invoiced: ${invoiced.mkString(", ")}")

  // Caller 2: the report copies the same loop again.
  var count = 0
  page = 0
  batch = api.fetchPage(page)
  while batch.nonEmpty do
    count += batch.size
    page += 1
    batch = api.fetchPage(page)
  println(s"report counted $count orders")
  println("Switch the API to cursors and both loops break.")
