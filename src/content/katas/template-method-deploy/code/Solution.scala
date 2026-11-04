// The recipe is written once, in run(). Subclasses fill in what differs.
abstract class Deploy(val name: String):
  // the template method
  final def run(version: String): Unit =
    println(s"[$name] checkout $version")
    build()
    test()
    println(s"[$name] upload $name:$version to the servers")
    println(s"[$name] done")

  // every project must say how it builds
  def build(): Unit

  // a hook: a default that projects may override
  def test(): Unit = println(s"[$name] test: none for this project")

class ApiDeploy extends Deploy("api"):
  def build(): Unit = println("[api] build: sbt assembly")
  override def test(): Unit = println("[api] test: sbt test")

class WebsiteDeploy extends Deploy("web"):
  def build(): Unit = println("[web] build: npm ci && npm run build")

@main def demo(): Unit =
  ApiDeploy().run("v2.4.0")
  WebsiteDeploy().run("v7.1.3")
