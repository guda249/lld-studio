// Runs each compiled program's @main (one at a time, stdout captured, 20 s limit) and writes its output.
import java.io.{ByteArrayOutputStream, PrintStream}
import java.net.URLClassLoader
import java.nio.file.{Files, Paths}
object Runner:
  def main(args: Array[String]): Unit =
    val files = scala.io.Source.fromFile(args(0)).getLines().filter(_.nonEmpty).toList
    val outRoot = Paths.get(args(1)); val resRoot = Paths.get(args(2))
    Files.createDirectories(resRoot)
    val realOut = System.out
    for (f, i) <- files.zipWithIndex do
      val src = scala.io.Source.fromFile(f).mkString
      val mainName = { val pkg = "(?m)^package\\s+([\\w.]+)".r.findFirstMatchIn(src).map(_.group(1) + "."); "@main\\s+def\\s+(\\w+)".r.findFirstMatchIn(src).map(m => pkg.getOrElse("") + m.group(1)) }
      val buf = ByteArrayOutputStream()
      val ps = PrintStream(buf, true, "UTF-8")
      var status = "ok"
      mainName match
        case None => status = "no-main"
        case Some(m) =>
          val loader = URLClassLoader(Array(outRoot.resolve(s"f$i").toUri.toURL), getClass.getClassLoader)
          System.setOut(ps)
          // Scala's println goes through Console.out (inherited by threads the program starts)
          Console.withOut(ps) {
            val t = Thread(() => {
              try { loader.loadClass(m).getMethod("main", classOf[Array[String]]).invoke(null, Array.empty[String]); () }
              catch case e: Throwable => { status = "error: " + Option(e.getCause).getOrElse(e).toString; () }
            })
            t.setDaemon(true); t.start(); t.join(20000)
            if t.isAlive then status = "timeout"
            Thread.sleep(50)
          }
          System.setOut(realOut)
      Files.writeString(resRoot.resolve(s"f$i.txt"), buf.toString("UTF-8"))
      realOut.println(s"$status\t$f")
