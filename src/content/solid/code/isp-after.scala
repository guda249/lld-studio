// After: small interfaces. Each machine promises only what it can do;
// each client asks only for what it uses.

trait Printer:
  def printDoc(doc: String): String

trait Scanner:
  def scan(page: String): String

trait Fax:
  def fax(number: String, doc: String): String

class BasicPrinter extends Printer:
  def printDoc(doc: String): String = s"printed $doc"

class MultiFunctionDevice extends Printer, Scanner, Fax:
  def printDoc(doc: String): String = s"printed $doc"
  def scan(page: String): String = s"scanned $page"
  def fax(number: String, doc: String): String = s"faxed $doc to $number"

def printPayslips(printer: Printer): Unit = // depends only on printing
  List("asha", "ravi").foreach(n => println(printer.printDoc(s"payslip-$n")))

def archive(scanner: Scanner): Unit = // depends only on scanning
  println(scanner.scan("contract"))

@main def ispAfter(): Unit =
  printPayslips(BasicPrinter())
  printPayslips(MultiFunctionDevice())
  archive(MultiFunctionDevice())
