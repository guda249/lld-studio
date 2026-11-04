final case class Resources(cpu: Double, memoryGb: Int, replicas: Int)

final case class DeployConfig(service: String, region: String, resources: Resources, alertsOn: Boolean)

// one carefully reviewed preset per tier; immutable, so no one can edit it in place
val presets: Map[String, DeployConfig] = Map(
  "prod" -> DeployConfig("payments-api", "ap-south-1", Resources(2.0, 4, 6), alertsOn = true)
)

def forStaging(prod: DeployConfig): DeployConfig =
  // copy the preset and change only what differs; nested values need their own copy()
  val smaller = prod.resources.copy(replicas = 1, memoryGb = 2)
  prod.copy(resources = smaller, alertsOn = false)

def show(name: String, c: DeployConfig): Unit =
  val r = c.resources
  println(s"$name: ${c.service} in ${c.region}, ${r.replicas} x (${r.cpu} CPU, ${r.memoryGb} GB), alerts=${c.alertsOn}")

@main def deployDemo(): Unit =
  val prod = presets("prod")
  val staging = forStaging(prod)
  val drSite = prod.copy(region = "ap-south-2") // disaster-recovery copy in another region

  show("prod", prod)
  show("staging", staging)
  show("dr", drSite)
