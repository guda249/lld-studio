// Before: one fat interface. A plain printer must pretend it can scan and fax.

trait OfficeMachine:
  def printDoc(doc: String): String
  def scan(page: String): String
  def fax(number: String, doc: String): String

class MultiFunctionDevice extends OfficeMachine:
  def printDoc(doc: String): String = s"printed $doc"
  def scan(page: String): String = s"scanned $page"
  def fax(number: String, doc: String): String = s"faxed $doc to $number"

class BasicPrinter extends OfficeMachine: // the cheap branch-office printer
  def printDoc(doc: String): String = s"printed $doc"
  def scan(page: String): String = throw UnsupportedOperationException("no scanner") // forced to exist
  def fax(number: String, doc: String): String = throw UnsupportedOperationException("no fax")

def printPayslips(machine: OfficeMachine): Unit = // only prints, yet depends on scan and fax
  List("asha", "ravi").foreach(n => println(machine.printDoc(s"payslip-$n")))

@main def ispBefore(): Unit =
  printPayslips(BasicPrinter())
  try BasicPrinter().scan("contract") // nothing stops this call
  catch case e: UnsupportedOperationException => println(s"crash: ${e.getMessage}")
