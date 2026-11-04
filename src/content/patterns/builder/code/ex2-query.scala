import scala.collection.mutable

final case class Query(sql: String, params: List[Any])

final class QueryBuilder(table: String):
  private val columns = mutable.ListBuffer.empty[String]
  private val conditions = mutable.ListBuffer.empty[String]
  private val params = mutable.ListBuffer.empty[Any]
  private var orderBy: Option[String] = None
  private var limit: Option[Int] = None

  def select(cols: String*): QueryBuilder =
    columns ++= cols
    this

  def where(condition: String, value: Any): QueryBuilder =
    // values never go into the SQL text, only into params (no SQL injection)
    conditions += s"$condition ?"
    params += value
    this

  def withOrderBy(column: String): QueryBuilder =
    orderBy = Some(column)
    this

  def withLimit(n: Int): QueryBuilder =
    limit = Some(n)
    this

  def build(): Query =
    if limit.isDefined && orderBy.isEmpty then
      throw IllegalArgumentException("LIMIT without ORDER BY gives random rows")
    val cols = if columns.isEmpty then "*" else columns.mkString(", ")
    val sql = new StringBuilder(s"SELECT $cols FROM $table")
    if conditions.nonEmpty then sql ++= " WHERE " + conditions.mkString(" AND ")
    orderBy.foreach(c => sql ++= s" ORDER BY $c")
    limit.foreach(n => sql ++= s" LIMIT $n")
    Query(sql.toString, params.toList)

@main def queryDemo(): Unit =
  val query = QueryBuilder("products").select("name", "price")
    .where("category =", "shoes").where("price <=", 2500)
    .withOrderBy("price").withLimit(10).build()
  println(query.sql)
  println(s"params: ${query.params.mkString("[", ", ", "]")}")
  println(QueryBuilder("orders").where("status =", "PENDING").build().sql)

  try QueryBuilder("products").withLimit(5).build()
  catch case e: IllegalArgumentException => println(s"Rejected: ${e.getMessage}")
