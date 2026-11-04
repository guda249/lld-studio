import scala.collection.mutable

type Schema = mutable.LinkedHashMap[String, mutable.ListBuffer[String]]

def describe(schema: Schema): String =
  if schema.isEmpty then "(empty)"
  else schema.toList.map((table, cols) => s"$table(${cols.mkString(", ")})").mkString(", ")

trait Migration:
  def version: String
  def up(schema: Schema): Unit
  def down(schema: Schema): Unit

class CreateUsers extends Migration:
  val version = "001_create_users"
  def up(schema: Schema): Unit = schema("users") = mutable.ListBuffer("id", "name")
  def down(schema: Schema): Unit = schema.remove("users")

class AddPhoneToUsers extends Migration:
  val version = "002_add_phone"
  def up(schema: Schema): Unit = schema("users").append("phone")
  def down(schema: Schema): Unit = schema("users").subtractOne("phone")

class CreateOrders extends Migration:
  val version = "003_create_orders"
  def up(schema: Schema): Unit = schema("orders") = mutable.ListBuffer("id", "user_id", "total")
  def down(schema: Schema): Unit = schema.remove("orders")

class Migrator(schema: Schema): // invoker: applies commands and rolls them back in reverse order
  private var applied: List[Migration] = Nil // newest first

  def migrate(migrations: List[Migration]): Unit =
    val done = applied.map(_.version).toSet
    for m <- migrations do
      if !done.contains(m.version) then
        m.up(schema)
        applied = m :: applied
        println(s"up   ${m.version}  -> ${describe(schema)}")

  def rollback(steps: Int): Unit =
    for _ <- 1 to steps do
      applied match
        case last :: rest =>
          last.down(schema)
          applied = rest
          println(s"down ${last.version}  -> ${describe(schema)}")
        case Nil => println("nothing to roll back")

@main def migrationDemo(): Unit =
  val allMigrations: List[Migration] = List(CreateUsers(), AddPhoneToUsers(), CreateOrders())
  val migrator = Migrator(mutable.LinkedHashMap.empty[String, mutable.ListBuffer[String]])
  migrator.migrate(allMigrations)
  migrator.rollback(2)
  migrator.migrate(allMigrations) // only the rolled-back ones run again
