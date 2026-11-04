trait Dialect:
  def placeholder(position: Int): String
  def quote(name: String): String

trait Connection:
  def execute(sql: String, params: List[String]): String

class SqliteDialect extends Dialect:
  def placeholder(position: Int): String = "?"
  def quote(name: String): String = "\"" + name + "\""

class SqliteConnection extends Connection:
  def execute(sql: String, params: List[String]): String =
    s"[sqlite] $sql ${params.mkString("[", ", ", "]")}"

class MySqlDialect extends Dialect:
  def placeholder(position: Int): String = "%s"
  def quote(name: String): String = s"`$name`"

class MySqlConnection extends Connection:
  def execute(sql: String, params: List[String]): String =
    s"[mysql] $sql ${params.mkString("[", ", ", "]")}"

trait DatabaseFactory:
  def createDialect(): Dialect
  def createConnection(): Connection

// one shared instance per family: factories hold no state
object SqliteFactory extends DatabaseFactory:
  def createDialect(): Dialect = SqliteDialect()
  def createConnection(): Connection = SqliteConnection()

object MySqlFactory extends DatabaseFactory:
  def createDialect(): Dialect = MySqlDialect()
  def createConnection(): Connection = MySqlConnection()

class UserRepository(db: DatabaseFactory):
  private val dialect = db.createDialect()
  private val conn = db.createConnection()

  def findByCity(city: String): String =
    val d = dialect
    val sql = s"SELECT * FROM ${d.quote("users")} WHERE ${d.quote("city")} = ${d.placeholder(1)}"
    conn.execute(sql, List(city))

@main def databaseDemo(): Unit =
  println(UserRepository(SqliteFactory).findByCity("Kochi")) // local tests
  println(UserRepository(MySqlFactory).findByCity("Kochi"))  // production
