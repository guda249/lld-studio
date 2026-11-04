trait Storage:
  def upload(name: String): String

trait Queue:
  def publish(message: String): String

class S3Storage extends Storage:
  def upload(name: String): String = s"s3://reports/$name"

class SqsQueue extends Queue:
  def publish(message: String): String = s"SQS <- $message"

class GcsStorage extends Storage:
  def upload(name: String): String = s"gs://reports/$name"

class PubSubQueue extends Queue:
  def publish(message: String): String = s"Pub/Sub <- $message"

trait CloudFactory:
  def createStorage(): Storage
  def createQueue(): Queue

class AwsFactory extends CloudFactory:
  def createStorage(): Storage = S3Storage()
  def createQueue(): Queue = SqsQueue()

class GcpFactory extends CloudFactory:
  def createStorage(): Storage = GcsStorage()
  def createQueue(): Queue = PubSubQueue()

// the client sees only the interfaces, never a concrete class
class ReportService(cloud: CloudFactory):
  private val storage = cloud.createStorage()
  private val queue = cloud.createQueue()

  def publishReport(name: String): String =
    val path = storage.upload(name)
    queue.publish(s"report ready at $path")

@main def abstractFactoryDemo(): Unit =
  val factories: List[CloudFactory] = List(AwsFactory(), GcpFactory())
  factories.foreach(f => println(ReportService(f).publishReport("q3.pdf")))
