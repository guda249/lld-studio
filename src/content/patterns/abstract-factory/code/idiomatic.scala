// a family is just a bundle of matching creation functions
case class CloudKit(upload: String => String, publish: String => String)

object CloudKits:
  val aws: CloudKit = CloudKit(
    upload = name => s"s3://reports/$name",
    publish = msg => s"SQS <- $msg"
  )
  val gcp: CloudKit = CloudKit(
    upload = name => s"gs://reports/$name",
    publish = msg => s"Pub/Sub <- $msg"
  )
  // one config value picks the whole family, so families cannot be mixed
  val byName: Map[String, CloudKit] = Map("aws" -> aws, "gcp" -> gcp)

def publishReport(kit: CloudKit, name: String): String =
  kit.publish(s"report ready at ${kit.upload(name)}")

@main def abstractFactoryIdiomatic(): Unit =
  val config = Map("cloud" -> "gcp")
  println(publishReport(CloudKits.byName(config("cloud")), "q3.pdf"))
  println(publishReport(CloudKits.aws, "q3.pdf"))
