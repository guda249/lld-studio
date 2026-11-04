trait Storage:
  def upload(name: String): String

trait Queue:
  def publish(message: String): String

class S3Storage extends Storage:
  def upload(name: String): String = s"s3://reports/$name"

class GcsStorage extends Storage:
  def upload(name: String): String = s"gs://reports/$name"

class SqsQueue extends Queue:
  def publish(message: String): String = s"SQS <- $message"

class PubSubQueue extends Queue:
  def publish(message: String): String = s"Pub/Sub <- $message"

class ReportService(cloud: String):
  // business code knows every cloud's classes
  private val parts: (Storage, Queue) = cloud match
    case "aws" => (S3Storage(), SqsQueue())
    // copy-paste slip: an AWS queue next to GCP storage, and nothing complains
    case "gcp" => (GcsStorage(), SqsQueue())
    case other => throw IllegalArgumentException(s"unknown cloud: $other")

  def publishReport(name: String): String =
    val path = parts._1.upload(name)
    parts._2.publish(s"report ready at $path")

@main def abstractFactoryProblem(): Unit =
  println(ReportService("aws").publishReport("q3.pdf"))
  println(ReportService("gcp").publishReport("q3.pdf")) // mixed families: a silent bug
