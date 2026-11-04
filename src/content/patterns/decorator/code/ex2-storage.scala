import java.nio.charset.StandardCharsets
import java.util.Base64

trait DataStore:
  def write(data: String): Unit
  def read(): String

// Stands in for a file or a database column.
class MemoryStore extends DataStore:
  var raw = ""
  def write(data: String): Unit = raw = data
  def read(): String = raw

class StoreDecorator(inner: DataStore) extends DataStore:
  def write(data: String): Unit = inner.write(data)
  def read(): String = inner.read()

class Base64Layer(wrapped: DataStore) extends StoreDecorator(wrapped):
  override def write(data: String): Unit =
    super.write(Base64.getEncoder.encodeToString(data.getBytes(StandardCharsets.UTF_8)))
  override def read(): String =
    new String(Base64.getDecoder.decode(super.read()), StandardCharsets.UTF_8)

// A toy scrambler. A real app would encrypt here.
class ReverseLayer(wrapped: DataStore) extends StoreDecorator(wrapped):
  override def write(data: String): Unit = super.write(data.reverse)
  override def read(): String = super.read().reverse

@main def layeredStorage(): Unit =
  val secret = "db_password=s3cret"
  val diskA = MemoryStore()
  val diskB = MemoryStore()
  val storeA = ReverseLayer(Base64Layer(diskA))
  val storeB = Base64Layer(ReverseLayer(diskB))
  storeA.write(secret)
  storeB.write(secret)
  println(s"A raw : ${diskA.raw}")
  println(s"B raw : ${diskB.raw}")
  println(s"A read: ${storeA.read()}")
  println(s"B read: ${storeB.read()}")
