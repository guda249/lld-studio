final case class Txn(note: String, amount: Int)   // positive = credit, negative = debit (in rupees)

abstract class StatementGenerator:
  final def generate(name: String, txns: List[Txn]): String =   // the template method
    val lines = header(name) :: txns.map(formatTxn) ::: List(footer(txns.map(_.amount).sum))
    lines.mkString(separator)

  protected def header(name: String): String
  protected def formatTxn(txn: Txn): String

  protected def footer(net: Int): String = f"Net: ₹$net%,d"   // hook
  protected def separator: String = "\n"                       // hook

class EmailStatement extends StatementGenerator:
  protected def header(name: String): String =
    s"Dear $name, here is your October statement:"

  protected def formatTxn(txn: Txn): String =
    f"  ${txn.note}%-12s ${txn.amount}%+,d"

class SmsStatement extends StatementGenerator:
  protected def header(name: String): String = s"${name.take(10)}:"

  protected def formatTxn(txn: Txn): String = f"${txn.note.take(6)} ${txn.amount}%+d"

  override protected def separator: String = " | "            // SMS must fit on one line

@main def statementDemo(): Unit =
  val txns = List(Txn("Salary", 85000), Txn("Rent UPI", -22000), Txn("Groceries", -6400))
  println(EmailStatement().generate("Priya", txns))
  println(SmsStatement().generate("Priya", txns))
