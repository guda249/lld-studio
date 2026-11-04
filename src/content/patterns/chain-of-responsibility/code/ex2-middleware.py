from typing import Callable

Request = dict[str, str]
Handler = Callable[[Request], str]
Middleware = Callable[[Request, Handler], str]

calls: dict[str, int] = {}


def logger(req: Request, nxt: Handler) -> str:
    result = nxt(req)
    print(f"[log] {req.get('user', 'anon')} {req['path']} -> {result}")
    return result


def auth(req: Request, nxt: Handler) -> str:
    if "token" not in req:
        return "401 Unauthorized"  # stop here, never reach the endpoint
    return nxt(req)


def rate_limit(req: Request, nxt: Handler) -> str:
    user = req["user"]
    calls[user] = calls.get(user, 0) + 1
    if calls[user] > 2:
        return "429 Too Many Requests"
    return nxt(req)


def orders_endpoint(req: Request) -> str:
    return f"200 OK: orders of {req['user']}"


def link(middleware: Middleware, nxt: Handler) -> Handler:
    return lambda req: middleware(req, nxt)


def build(middlewares: list[Middleware], last: Handler) -> Handler:
    handler = last
    for middleware in reversed(middlewares):
        handler = link(middleware, handler)
    return handler


app = build([logger, auth, rate_limit], orders_endpoint)
app({"path": "/orders", "user": "asha", "token": "t1"})
app({"path": "/orders", "user": "ravi"})
app({"path": "/orders", "user": "asha", "token": "t1"})
app({"path": "/orders", "user": "asha", "token": "t1"})
