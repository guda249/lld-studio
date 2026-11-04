import scala.collection.mutable

type Request = Map[String, String]
type Handler = Request => String
type Middleware = (Request, Handler) => String

val calls = mutable.Map.empty[String, Int]

def logger(req: Request, next: Handler): String =
  val result = next(req)
  println(s"[log] ${req.getOrElse("user", "anon")} ${req("path")} -> $result")
  result

def auth(req: Request, next: Handler): String =
  if !req.contains("token") then "401 Unauthorized" // stop here, never reach the endpoint
  else next(req)

def rateLimit(req: Request, next: Handler): String =
  val user = req("user")
  calls(user) = calls.getOrElse(user, 0) + 1
  if calls(user) > 2 then "429 Too Many Requests"
  else next(req)

def ordersEndpoint(req: Request): String =
  s"200 OK: orders of ${req("user")}"

def build(middlewares: List[Middleware], last: Handler): Handler =
  middlewares.foldRight(last)((middleware, next) => (req: Request) => middleware(req, next))

@main def middlewareDemo(): Unit =
  val app = build(List(logger, auth, rateLimit), ordersEndpoint)
  app(Map("path" -> "/orders", "user" -> "asha", "token" -> "t1"))
  app(Map("path" -> "/orders", "user" -> "ravi"))
  app(Map("path" -> "/orders", "user" -> "asha", "token" -> "t1"))
  app(Map("path" -> "/orders", "user" -> "asha", "token" -> "t1"))
