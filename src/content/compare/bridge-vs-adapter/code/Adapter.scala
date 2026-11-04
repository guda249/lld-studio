// Adapter: added later. Alert already sends through Channel; a vendor's SMS class doesn't fit it.

trait Channel: // target: the interface our code already uses
  def send(to: String, text: String): String

class EmailChannel extends Channel:
  def send(to: String, text: String): String = s"Email to $to: $text"

class BulkSmsGateway: // adaptee: the vendor's class; we can't change it
  def push(msisdn: String, payload: Map[String, String]): Int =
    println(s"  [gateway] $msisdn <- ${payload("body")}")
    202

class BulkSmsAdapter(gateway: BulkSmsGateway) extends Channel: // adapter: send() becomes push()
  def send(to: String, text: String): String =
    val msisdn = to.replace("+", "").replace("-", "")
    val status = gateway.push(msisdn, Map("body" -> text, "type" -> "transactional"))
    s"SMS to $to: ${if status == 202 then "sent" else "failed"}"

class Alert(channel: Channel): // client: only knows Channel
  def deliver(to: String, text: String): String = channel.send(to, text)

@main def bridgeVsAdapterAdapter(): Unit =
  println(Alert(EmailChannel()).deliver("ops@shop.example", "Payments are down. We are on it."))
  println(Alert(BulkSmsAdapter(BulkSmsGateway())).deliver("+91-98450-11111", "Payments are down. We are on it."))
