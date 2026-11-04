// Deploys the Scala API. The recipe is copied in every deploy class.
class ApiDeploy:
  def run(version: String): Unit =
    println(s"[api] checkout $version")
    println("[api] build: sbt assembly")
    println("[api] test: sbt test")
    println(s"[api] upload api:$version to the servers")
    println("[api] done")

// Deploys the marketing site: same recipe, different build, no tests.
class WebsiteDeploy:
  def run(version: String): Unit =
    println(s"[web] checkout $version")
    println("[web] build: npm ci && npm run build")
    println("[web] test: none for this project")
    println(s"[web] upload web:$version to the servers")
    println("[web] done")

@main def demo(): Unit =
  ApiDeploy().run("v2.4.0")
  WebsiteDeploy().run("v7.1.3")
