from dataclasses import dataclass


@dataclass(frozen=True)
class Query:
    sql: str
    params: tuple[object, ...]


class QueryBuilder:
    def __init__(self, table: str) -> None:
        self._table = table
        self._columns: list[str] = []
        self._conditions: list[str] = []
        self._params: list[object] = []
        self._order_by: str | None = None
        self._limit: int | None = None

    def select(self, *columns: str) -> "QueryBuilder":
        self._columns.extend(columns)
        return self

    def where(self, condition: str, value: object) -> "QueryBuilder":
        # values never go into the SQL text, only into params (no SQL injection)
        self._conditions.append(f"{condition} ?")
        self._params.append(value)
        return self

    def order_by(self, column: str) -> "QueryBuilder":
        self._order_by = column
        return self

    def limit(self, n: int) -> "QueryBuilder":
        self._limit = n
        return self

    def build(self) -> Query:
        if self._limit is not None and self._order_by is None:
            raise ValueError("LIMIT without ORDER BY gives random rows")
        sql = f"SELECT {', '.join(self._columns) or '*'} FROM {self._table}"
        if self._conditions:
            sql += " WHERE " + " AND ".join(self._conditions)
        if self._order_by:
            sql += f" ORDER BY {self._order_by}"
        if self._limit is not None:
            sql += f" LIMIT {self._limit}"
        return Query(sql, tuple(self._params))


query = (QueryBuilder("products").select("name", "price")
         .where("category =", "shoes").where("price <=", 2500)
         .order_by("price").limit(10).build())
print(query.sql)
print(f"params: {list(query.params)}")
print(QueryBuilder("orders").where("status =", "PENDING").build().sql)

try:
    QueryBuilder("products").limit(5).build()
except ValueError as error:
    print(f"Rejected: {error}")
