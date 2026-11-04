trait ExprVisitor[R]:
  def visitNum(n: Num): R
  def visitAdd(a: Add): R
  def visitMul(m: Mul): R

sealed trait Expr:
  def accept[R](v: ExprVisitor[R]): R

final case class Num(value: Int) extends Expr:
  def accept[R](v: ExprVisitor[R]): R = v.visitNum(this)

final case class Add(left: Expr, right: Expr) extends Expr:
  def accept[R](v: ExprVisitor[R]): R = v.visitAdd(this)

final case class Mul(left: Expr, right: Expr) extends Expr:
  def accept[R](v: ExprVisitor[R]): R = v.visitMul(this)

object EvalVisitor extends ExprVisitor[Int]:
  def visitNum(n: Num): Int = n.value
  def visitAdd(a: Add): Int = a.left.accept(this) + a.right.accept(this)
  def visitMul(m: Mul): Int = m.left.accept(this) * m.right.accept(this)

object PrintVisitor extends ExprVisitor[String]:
  def visitNum(n: Num): String = n.value.toString
  def visitAdd(a: Add): String = s"(${a.left.accept(this)} + ${a.right.accept(this)})"
  def visitMul(m: Mul): String = s"${m.left.accept(this)} * ${m.right.accept(this)}"

object PostfixVisitor extends ExprVisitor[String]:
  def visitNum(n: Num): String = n.value.toString
  def visitAdd(a: Add): String = s"${a.left.accept(this)} ${a.right.accept(this)} +"
  def visitMul(m: Mul): String = s"${m.left.accept(this)} ${m.right.accept(this)} *"

@main def exprDemo(): Unit =
  // (2 + 3) * 4 + 1, built as a tree the way a parser would
  val tree: Expr = Add(Mul(Add(Num(2), Num(3)), Num(4)), Num(1))
  println(s"infix:   ${tree.accept(PrintVisitor)}")
  println(s"postfix: ${tree.accept(PostfixVisitor)}")
  println(s"value:   ${tree.accept(EvalVisitor)}")
